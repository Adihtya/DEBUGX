/**
// ==============================================================================
// DEBUGX — LANGUAGE-AWARE STATIC ANALYSIS ENGINE (Phase 3)
// Deterministic AST, syntactic, and semantic diagnostics layer.
// Inspects code locally before AI invocation to provide concrete evidence.
// ==============================================================================
*/

class StaticAnalyzer {
  constructor() {}

  /**
   * Run language-aware static analysis on processed input
   * @param {Object} processedInput - From InputProcessor
   * @returns {Object} StaticAnalysisResult
   */
  analyze(processedInput) {
    const { sanitizedCode: code, lines, detectedLanguage: language } = processedInput;

    if (!code || !code.trim()) {
      return {
        hasIssues: false,
        diagnostics: [],
        primaryDefect: null,
        language
      };
    }

    const diagnostics = [];

    // Language specific analyzers
    switch (language) {
      case 'Python':
        this._analyzePython(lines, code, diagnostics);
        break;
      case 'JavaScript':
      case 'TypeScript':
        this._analyzeJavaScript(lines, code, diagnostics);
        break;
      case 'Kotlin':
      case 'Java':
        this._analyzeJVM(lines, code, language, diagnostics);
        break;
      case 'C++':
      case 'C':
        this._analyzeC(lines, code, language, diagnostics);
        break;
      case 'SQL':
        this._analyzeSQL(lines, code, diagnostics);
        break;
      case 'HTML':
      case 'CSS':
        this._analyzeWebMarkup(lines, code, language, diagnostics);
        break;
      default:
        this._analyzeGeneric(lines, code, diagnostics);
        break;
    }

    const primaryDefect = diagnostics.find(d => d.severity === 'error') || diagnostics[0] || null;

    return {
      hasIssues: diagnostics.length > 0,
      diagnostics,
      primaryDefect,
      language
    };
  }

  // ============================================================================
  // PYTHON STATIC ANALYZER
  // ============================================================================
  _analyzePython(lines, code, diagnostics) {
    // 1. Bracket & delimiter stack check
    this._checkDelimiterBalance(lines, diagnostics, ['()', '[]', '{}']);

    // 2. Python missing colons
    const colonKeywords = ['if', 'elif', 'else', 'for', 'while', 'def', 'class', 'try', 'except', 'finally', 'with'];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const lineNum = idx + 1;
      if (!trimmed || trimmed.startsWith('#')) return;

      for (const kw of colonKeywords) {
        const regex = new RegExp(`^${kw}\\b(.*)$`);
        const match = trimmed.match(regex);
        if (match) {
          const rest = match[1].trim();
          // Check if line does not end with colon and is not multi-line paren continuation
          if (!trimmed.endsWith(':') && !trimmed.endsWith('\\') && !trimmed.includes('#')) {
            // Ensure parentheses are balanced on this line before calling missing colon
            const opens = (trimmed.match(/\(/g) || []).length;
            const closes = (trimmed.match(/\)/g) || []).length;
            if (opens <= closes) {
              diagnostics.push({
                category: 'SYNTAX_ERROR',
                severity: 'error',
                line: lineNum,
                code: line,
                message: `SyntaxError: expected ':' at end of '${kw}' statement`,
                rootCause: `Python compound statements (${kw}) require a trailing colon (':') before the indented body.`,
                suggestedFix: `${line}:`,
                confidence: 0.99
              });
              return;
            }
          }
        }
      }
    });

    // 3. Assignment inside if condition: `if x = 5:`
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const m = line.match(/^\s*(?:if|elif)\s+([a-zA-Z_]\w*)\s*=\s*([^=][^:]*):/);
      if (m) {
        diagnostics.push({
          category: 'SYNTAX_ERROR',
          severity: 'error',
          line: lineNum,
          code: line,
          message: `SyntaxError: invalid syntax (assignment expression '=' used instead of comparison '==')`,
          rootCause: `In Python, '=' is the assignment operator. Conditional tests require '==' or the walrus operator ':='.`,
          suggestedFix: line.replace(`= ${m[2]}`, `== ${m[2]}`),
          confidence: 0.98
        });
      }
    });

    // 4. Zero Division: `/ 0`, `// 0`, `% 0`
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const zeroDivMatch = line.match(/(?:\/|\/\/|%)\s*0(?:\.0*)?(?![0-9])/);
      if (zeroDivMatch) {
        diagnostics.push({
          category: 'RUNTIME_ERROR_HAZARD',
          severity: 'error',
          line: lineNum,
          code: line,
          message: 'ZeroDivisionError: division or modulo by zero',
          rootCause: 'Division or modulo by zero is mathematically undefined and raises ZeroDivisionError in Python at runtime.',
          suggestedFix: line.replace(/(?:\/|\/\/|%)\s*0(?:\.0*)?/, '/ (divisor if divisor != 0 else 1)'),
          confidence: 0.99
        });
      }
    });

    // 5. Constant List Index Out of Bounds: e.g. `numbers = [10, 20, 30] ... numbers[5]`
    this._checkPythonIndexOutOfBounds(lines, diagnostics);

    // 6. Python NoneType dereference
    let noneVars = new Set();
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const assignNone = line.match(/^\s*([a-zA-Z_]\w*)\s*=\s*None\s*$/);
      if (assignNone) {
        noneVars.add(assignNone[1]);
      }
      for (const v of noneVars) {
        const deref = new RegExp(`\\b${v}\\.([a-zA-Z_]\\w*)\\s*\\(`);
        const match = line.match(deref);
        if (match && !line.includes(`if ${v} is not None`) && !line.includes(`if ${v}:`)) {
          diagnostics.push({
            category: 'RUNTIME_ERROR_HAZARD',
            severity: 'error',
            line: lineNum,
            code: line,
            message: `AttributeError: 'NoneType' object has no attribute '${match[1]}'`,
            rootCause: `Variable '${v}' is initialized to None and dereferenced without a null/None guard.`,
            suggestedFix: `if ${v} is not None:\n    ${line.trim()}`,
            confidence: 0.95
          });
        }
      }
    });

    // 7. Python String + Int Concatenation
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const strNumConcat = line.match(/(['"][^'"]*['"])\s*\+\s*([0-9]+|\b[a-zA-Z_]\w*\b(?!\s*\(|\s*\[))\s*(?:\+|$)/);
      if (strNumConcat && !line.includes('str(')) {
        const potentialNum = strNumConcat[2];
        if (/^[0-9]+$/.test(potentialNum)) {
          diagnostics.push({
            category: 'TYPE_ERROR',
            severity: 'error',
            line: lineNum,
            code: line,
            message: `TypeError: can only concatenate str (not "int") to str`,
            rootCause: `Python does not automatically coerce integers to strings in binary '+' expressions.`,
            suggestedFix: line.replace(potentialNum, `str(${potentialNum})`),
            confidence: 0.97
          });
        }
      }
    });

    // 8. Python Indentation Mismatch
    let prevIndent = 0;
    const indentStack = [0];
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (!line.trim() || line.trim().startsWith('#')) return;
      const indent = line.search(/\S/);

      if (indent > prevIndent) {
        indentStack.push(indent);
      } else if (indent < prevIndent) {
        while (indentStack.length > 0 && indentStack[indentStack.length - 1] > indent) {
          indentStack.pop();
        }
        if (indentStack[indentStack.length - 1] !== indent) {
          diagnostics.push({
            category: 'SYNTAX_ERROR',
            severity: 'error',
            line: lineNum,
            code: line,
            message: `IndentationError: unindent does not match any outer indentation level`,
            rootCause: `The line indentation (${indent} spaces) does not align with any enclosing Python code block.`,
            suggestedFix: ' '.repeat(indentStack[indentStack.length - 1] || 0) + line.trim(),
            confidence: 0.96
          });
        }
      }
      prevIndent = indent;
    });

    // 9. Infinite loop without break or exit
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/^\s*while\s+(?:True|1)\s*:/.test(line)) {
        // scan subsequent lines for break, return, raise
        const loopIndent = line.search(/\S/);
        let hasExit = false;
        for (let j = idx + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (!nextLine.trim() || nextLine.trim().startsWith('#')) continue;
          const nextIndent = nextLine.search(/\S/);
          if (nextIndent <= loopIndent) break; // loop ended
          const codeWithoutStrings = nextLine.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '');
          if (/\b(?:break|return|raise|sys\.exit)\b/.test(codeWithoutStrings)) {
            hasExit = true;
            break;
          }
        }
        if (!hasExit) {
          diagnostics.push({
            category: 'LOGICAL_ERROR',
            severity: 'warning',
            line: lineNum,
            code: line,
            message: 'Potential Infinite Loop: while True without break or return condition',
            rootCause: 'The while loop condition is permanently true and contains no termination break or return statements.',
            suggestedFix: `${line}\n    if termination_condition:\n        break`,
            confidence: 0.92
          });
        }
      }
    });
  }

  _checkPythonIndexOutOfBounds(lines, diagnostics) {
    const listDefs = new Map();
    lines.forEach((line, idx) => {
      const assignMatch = line.match(/^\s*([a-zA-Z_]\w*)\s*=\s*\[([^\]]*)\]/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const rawItems = assignMatch[2].trim();
        const itemCount = rawItems.length === 0 ? 0 : rawItems.split(',').length;
        listDefs.set(varName, { size: itemCount, line: idx + 1 });
      }

      for (const [varName, info] of listDefs.entries()) {
        const accessRegex = new RegExp(`\\b${varName}\\[([0-9]+)\\]`, 'g');
        let match;
        while ((match = accessRegex.exec(line)) !== null) {
          const requestedIdx = parseInt(match[1], 10);
          if (requestedIdx >= info.size) {
            diagnostics.push({
              category: 'RUNTIME_ERROR_HAZARD',
              severity: 'error',
              line: idx + 1,
              code: line,
              message: `IndexError: list index out of range (index ${requestedIdx} requested on list of size ${info.size})`,
              rootCause: `Lists in Python use zero-based indexing. For a list with ${info.size} element(s), valid indices are 0 to ${info.size - 1}. Index ${requestedIdx} exceeds bounds.`,
              suggestedFix: `if len(${varName}) > ${requestedIdx}:\n    ${line.trim()}\nelse:\n    print("Index out of bounds")`,
              confidence: 0.99
            });
          }
        }
      }
    });
  }

  // ============================================================================
  // JAVASCRIPT & TYPESCRIPT STATIC ANALYZER
  // ============================================================================
  _analyzeJavaScript(lines, code, diagnostics) {
    // 1. Delimiter balance
    this._checkDelimiterBalance(lines, diagnostics, ['()', '[]', '{}']);

    // 2. const reassignment
    const constVars = new Set();
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const declMatch = line.match(/\bconst\s+([a-zA-Z_$]\w*)\s*=/);
      if (declMatch) {
        constVars.add(declMatch[1]);
      } else {
        for (const cv of constVars) {
          const reassign = new RegExp(`^\\s*${cv}\\s*=\\s*[^=]`);
          if (reassign.test(line)) {
            diagnostics.push({
              category: 'TYPE_ERROR',
              severity: 'error',
              line: lineNum,
              code: line,
              message: `TypeError: Assignment to constant variable '${cv}'`,
              rootCause: `Variables declared with 'const' cannot be reassigned. Use 'let' if re-assignment is intended.`,
              suggestedFix: `// Change declaration to: let ${cv} = ...`,
              confidence: 0.98
            });
          }
        }
      }
    });

    // 3. Null / Undefined dereference
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/\b(?:null|undefined)\.[a-zA-Z_$]/.test(line)) {
        diagnostics.push({
          category: 'RUNTIME_ERROR_HAZARD',
          severity: 'error',
          line: lineNum,
          code: line,
          message: `TypeError: Cannot read properties of null/undefined`,
          rootCause: `Attempted property access on an explicit null or undefined literal.`,
          suggestedFix: line.replace(/\b(?:null|undefined)\.([a-zA-Z_$]\w*)/, 'obj?.$1'),
          confidence: 0.99
        });
      }
    });

    // 4. Equality with assignment in if
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const ifAssign = line.match(/if\s*\(\s*([a-zA-Z_$]\w*)\s*=\s*([^=)]+)\)/);
      if (ifAssign) {
        diagnostics.push({
          category: 'LOGICAL_ERROR',
          severity: 'warning',
          line: lineNum,
          code: line,
          message: `Potential Bug: Assignment inside conditional 'if (${ifAssign[1]} = ${ifAssign[2]})'`,
          rootCause: `Single '=' performs an assignment rather than comparison, setting '${ifAssign[1]}' to '${ifAssign[2]}' and testing truthiness.`,
          suggestedFix: line.replace(`${ifAssign[1]} = ${ifAssign[2]}`, `${ifAssign[1]} === ${ifAssign[2]}`),
          confidence: 0.94
        });
      }
    });

    // 5. Zero division check
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/(?:\/|%)\s*0(?:\.0*)?(?![0-9])/.test(line)) {
        diagnostics.push({
          category: 'LOGICAL_ERROR',
          severity: 'warning',
          line: lineNum,
          code: line,
          message: 'Zero Division Hazard: division by zero produces Infinity / NaN in JavaScript',
          rootCause: 'Dividing by zero does not crash JavaScript immediately but produces Infinity or NaN, leading to downstream logical corruption.',
          suggestedFix: line.replace(/\/\s*0/, '/ (divisor || 1)'),
          confidence: 0.93
        });
      }
    });
  }

  // ============================================================================
  // JVM (JAVA / KOTLIN) STATIC ANALYZER
  // ============================================================================
  _analyzeJVM(lines, code, language, diagnostics) {
    this._checkDelimiterBalance(lines, diagnostics, ['()', '[]', '{}']);

    // Kotlin Null-Safety violation: `!!` force unwrap
    if (language === 'Kotlin') {
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        if (line.includes('!!') && !line.includes('//')) {
          diagnostics.push({
            category: 'NullPointerException',
            severity: 'warning',
            line: lineNum,
            code: line,
            message: 'KotlinNullPointerException Hazard: Force unwrap operator (!!) used',
            rootCause: `Using '!!' throws a NullPointerException if the underlying expression evaluates to null at runtime.`,
            suggestedFix: line.replace('!!', '?.'),
            confidence: 0.95
          });
        }
      });
    }

    // Java missing semicolon
    if (language === 'Java') {
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
        if (trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(':')) return;
        if (/^(?:if|for|while|try|catch|else|class|public|private|protected)\b/.test(trimmed)) return;

        if (!trimmed.endsWith(';')) {
          diagnostics.push({
            category: 'SYNTAX_ERROR',
            severity: 'error',
            line: lineNum,
            code: line,
            message: `SyntaxError: ';' expected at end of Java statement`,
            rootCause: 'Java statements must terminate with a semicolon (;).',
            suggestedFix: `${line};`,
            confidence: 0.97
          });
        }
      });
    }
  }

  // ============================================================================
  // C / C++ STATIC ANALYZER
  // ============================================================================
  _analyzeC(lines, code, language, diagnostics) {
    this._checkDelimiterBalance(lines, diagnostics, ['()', '[]', '{}']);

    // Check null pointer dereference
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/\*(?:NULL|0)\b/.test(line) || /->\s*NULL/.test(line)) {
        diagnostics.push({
          category: 'RUNTIME_ERROR_HAZARD',
          severity: 'error',
          line: lineNum,
          code: line,
          message: 'Segmentation Fault Hazard: Null pointer dereference',
          rootCause: 'Dereferencing a NULL pointer leads to an immediate crash or segmentation fault.',
          suggestedFix: `if (ptr != NULL) {\n    ${line.trim()}\n}`,
          confidence: 0.98
        });
      }
    });

    // Array bound check on constant declarations: `int arr[3]; arr[5] = 10;`
    const arrayDecl = new Map();
    lines.forEach((line, idx) => {
      const declMatch = line.match(/\b(?:int|char|float|double|long)\s+([a-zA-Z_]\w*)\[([0-9]+)\]/);
      if (declMatch) {
        arrayDecl.set(declMatch[1], parseInt(declMatch[2], 10));
      }

      for (const [arrName, size] of arrayDecl.entries()) {
        const access = new RegExp(`\\b${arrName}\\[([0-9]+)\\]`, 'g');
        let m;
        while ((m = access.exec(line)) !== null) {
          const idxVal = parseInt(m[1], 10);
          if (idxVal >= size) {
            diagnostics.push({
              category: 'RUNTIME_ERROR_HAZARD',
              severity: 'error',
              line: idx + 1,
              code: line,
              message: `Buffer Overflow / Out-of-Bounds: index ${idxVal} on array '${arrName}' of size ${size}`,
              rootCause: `Array '${arrName}' has size ${size} (indices 0 to ${size - 1}). Accessing index ${idxVal} violates bounds causing undefined behavior or crash.`,
              suggestedFix: line.replace(`[${idxVal}]`, `[${size - 1}]`),
              confidence: 0.98
            });
          }
        }
      }
    });
  }

  // ============================================================================
  // SQL STATIC ANALYZER
  // ============================================================================
  _analyzeSQL(lines, code, diagnostics) {
    this._checkDelimiterBalance(lines, diagnostics, ['()']);
    if (diagnostics.length > 0) return;

    const upper = code.toUpperCase();
    if (upper.includes('SELECT') && !upper.includes('FROM') && !upper.includes('VERSION()') && !upper.includes('NOW()')) {
      // Check if selecting column names
      if (/SELECT\s+[a-zA-Z0-9_*, ]+\s*;?$/i.test(code.trim())) {
        diagnostics.push({
          category: 'SYNTAX_ERROR',
          severity: 'error',
          line: 1,
          code: code.trim(),
          message: 'SyntaxError: Missing FROM clause in SELECT statement',
          rootCause: 'In SQL, queries referencing table columns require a FROM <table_name> clause.',
          suggestedFix: `${code.trim().replace(/;$/, '')} FROM target_table;`,
          confidence: 0.95
        });
      }
    }

    // Unclosed string literals
    const singleQuotes = (code.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      diagnostics.push({
        category: 'SYNTAX_ERROR',
        severity: 'error',
        line: 1,
        code: code.trim(),
        message: 'SyntaxError: Unterminated string literal (unmatched single quote)',
        rootCause: 'SQL string literals are enclosed in single quotes (\'). An odd count indicates an unclosed literal.',
        suggestedFix: `${code.trim()}'`,
        confidence: 0.99
      });
    }
  }

  // ============================================================================
  // HTML / CSS STATIC ANALYZER
  // ============================================================================
  _analyzeWebMarkup(lines, code, language, diagnostics) {
    if (language === 'HTML') {
      const openDivs = (code.match(/<div\b/gi) || []).length;
      const closeDivs = (code.match(/<\/div>/gi) || []).length;
      if (openDivs !== closeDivs) {
        diagnostics.push({
          category: 'SYNTAX_ERROR',
          severity: 'error',
          line: lines.length,
          code: lines[lines.length - 1],
          message: `HTML Validation: Unbalanced <div> tags (${openDivs} open vs ${closeDivs} closed)`,
          rootCause: 'Each non-void HTML container tag must have a matching closing tag.',
          suggestedFix: `${code.trim()}\n</div>`,
          confidence: 0.96
        });
      }
    } else if (language === 'CSS') {
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        diagnostics.push({
          category: 'SYNTAX_ERROR',
          severity: 'error',
          line: lines.length,
          code: lines[lines.length - 1],
          message: `CSS Parse Error: Unbalanced braces (${openBraces} '{' vs ${closeBraces} '}')`,
          rootCause: 'CSS rulesets require matching closing braces for selectors and media queries.',
          suggestedFix: `${code.trim()}\n}`,
          confidence: 0.98
        });
      }
    }
  }

  _analyzeGeneric(lines, code, diagnostics) {
    this._checkDelimiterBalance(lines, diagnostics, ['()', '[]', '{}']);
  }

  // ============================================================================
  // SHARED DELIMITER STACK ANALYZER
  // ============================================================================
  _checkDelimiterBalance(lines, diagnostics, pairs = ['()', '[]', '{}']) {
    const stack = [];
    const openToClose = { '(': ')', '[': ']', '{': '}' };
    const closeToOpen = { ')': '(', ']': '[', '}': '{' };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      let inString = null;

      for (let c = 0; c < line.length; c++) {
        const char = line[c];

        // String boundary handling
        if ((char === '"' || char === "'") && (c === 0 || line[c - 1] !== '\\')) {
          if (!inString) inString = char;
          else if (inString === char) inString = null;
          continue;
        }
        if (inString) continue;

        // Comment check
        if (char === '#' || (char === '/' && line[c + 1] === '/')) {
          break; // Rest of line is comment
        }

        if (openToClose[char]) {
          stack.push({ char, line: lineNum, col: c + 1 });
        } else if (closeToOpen[char]) {
          if (stack.length === 0) {
            diagnostics.push({
              category: 'SYNTAX_ERROR',
              severity: 'error',
              line: lineNum,
              col: c + 1,
              code: line,
              message: `SyntaxError: unmatched closing delimiter '${char}'`,
              rootCause: `Encountered closing '${char}' without a matching opening '${closeToOpen[char]}'.`,
              suggestedFix: line.slice(0, c) + line.slice(c + 1),
              confidence: 0.99
            });
            return;
          }
          const top = stack.pop();
          if (openToClose[top.char] !== char) {
            diagnostics.push({
              category: 'SYNTAX_ERROR',
              severity: 'error',
              line: lineNum,
              col: c + 1,
              code: line,
              message: `SyntaxError: mismatched delimiter: '${top.char}' closed with '${char}'`,
              rootCause: `Opening delimiter '${top.char}' on line ${top.line} was improperly closed with '${char}' on line ${lineNum}.`,
              suggestedFix: line.slice(0, c) + openToClose[top.char] + line.slice(c + 1),
              confidence: 0.99
            });
            return;
          }
        }
      }
    }

    if (stack.length > 0) {
      const unclosed = stack.pop();
      diagnostics.push({
        category: 'SYNTAX_ERROR',
        severity: 'error',
        line: unclosed.line,
        col: unclosed.col,
        code: lines[unclosed.line - 1],
        message: `SyntaxError: unclosed delimiter '${unclosed.char}'`,
        rootCause: `Opening delimiter '${unclosed.char}' on line ${unclosed.line} is never closed.`,
        suggestedFix: `${lines[lines.length - 1]}${openToClose[unclosed.char]}`,
        confidence: 0.99
      });
    }
  }
}

// Global Singleton
if (typeof window !== 'undefined') {
  window.StaticAnalyzer = StaticAnalyzer;
  window.staticAnalyzer = new StaticAnalyzer();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StaticAnalyzer };
}
