/**
// ==============================================================================
// DEBUGX — INPUT PROCESSING ENGINE (Phase 2)
// Preserves original source code, extracts error traces, detects language & runtime,
// identifies incompleteness, and isolates diagnostic clues before AI diagnosis.
// ==============================================================================
*/

class InputProcessor {
  constructor() {
    this.supportedLanguages = [
      'Python', 'JavaScript', 'TypeScript', 'Kotlin', 'Java',
      'C++', 'C', 'SQL', 'HTML', 'CSS', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Bash'
    ];
  }

  /**
   * Process raw user input into a normalized, structured representation
   * @param {Object} rawInput
   * @returns {Object} ProcessedInput
   */
  process(rawInput = {}) {
    const originalCode = typeof rawInput.code === 'string' ? rawInput.code : '';
    let errorMessage = (rawInput.errorMessage || '').trim();
    let stackTrace = (rawInput.stackTrace || '').trim();
    const expectedBehavior = (rawInput.expectedBehavior || '').trim();
    const requestedLanguage = rawInput.language || 'Auto-Detect';
    const screenshotBase64 = rawInput.screenshotBase64 || rawInput.imageBase64 || null;
    const screenshotMimeType = rawInput.screenshotMimeType || rawInput.imageMimeType || 'image/png';
    const filename = rawInput.filename || '';

    // 1. Separate embedded stack trace from source code if user pasted combined trace in code box
    const separated = this._separateEmbeddedStackTrace(originalCode);
    const sanitizedCode = separated.cleanCode;
    if (!errorMessage && separated.extractedError) {
      errorMessage = separated.extractedError;
    }
    if (!stackTrace && separated.extractedStackTrace) {
      stackTrace = separated.extractedStackTrace;
    }

    // 2. Line analysis preserving exact formatting
    const lines = sanitizedCode.split(/\r?\n/);
    const lineCount = lines.length;
    const isBlank = sanitizedCode.trim().length === 0;

    // 3. Language & Framework Detection
    const detectedLanguage = this._detectLanguage(sanitizedCode, requestedLanguage, filename, stackTrace);
    const framework = this._detectFramework(sanitizedCode, detectedLanguage);
    const runtime = this._detectRuntime(sanitizedCode, detectedLanguage, stackTrace);

    // 4. Parsed Stack Trace Frames
    const stackFrames = this._parseStackTrace(stackTrace, detectedLanguage);

    // 5. Incompleteness & Truncation Checks
    const incompletenessCheck = this._checkIncompleteness(sanitizedCode, detectedLanguage);

    // 6. Missing Information Identification
    const missingInfo = [];
    if (isBlank && !screenshotBase64 && !errorMessage) {
      missingInfo.push('No source code, error message, or screenshot was supplied.');
    } else if (isBlank && (errorMessage || stackTrace)) {
      missingInfo.push('Error message or stack trace provided, but original source code is missing.');
    } else if (!isBlank && incompletenessCheck.isIncomplete) {
      missingInfo.push(incompletenessCheck.reason);
    }
    if (screenshotBase64 && isBlank) {
      missingInfo.push('Screenshot uploaded. OCR parsing will extract visible code.');
    }

    return {
      originalCode,
      sanitizedCode,
      lines,
      lineCount,
      isBlank,
      detectedLanguage,
      requestedLanguage,
      framework,
      runtime,
      errorMessage,
      stackTrace,
      stackFrames,
      expectedBehavior,
      isIncomplete: incompletenessCheck.isIncomplete,
      isTruncated: incompletenessCheck.isTruncated,
      missingInfo,
      hasScreenshot: Boolean(screenshotBase64),
      screenshotBase64,
      screenshotMimeType,
      filename
    };
  }

  /**
   * Separates stack traces accidentally or deliberately pasted inside the code textarea
   */
  _separateEmbeddedStackTrace(rawCode) {
    if (!rawCode) return { cleanCode: '', extractedError: '', extractedStackTrace: '' };

    // Check for Python Traceback
    const pyTraceMatch = rawCode.match(/(Traceback \(most recent call last\):[\s\S]+?(?:[A-Za-z]+Error|Exception):[^\n]+)/);
    if (pyTraceMatch) {
      const trace = pyTraceMatch[1];
      const clean = rawCode.replace(trace, '').trim();
      const lastLine = trace.trim().split('\n').pop() || '';
      return { cleanCode: clean || rawCode, extractedError: lastLine, extractedStackTrace: trace };
    }

    // Check for JavaScript / Node Stack Trace
    const jsTraceMatch = rawCode.match(/((?:[A-Za-z]+Error|TypeError|ReferenceError|SyntaxError): [^\n]+(?:\n\s+at [^\n]+)+)/);
    if (jsTraceMatch) {
      const trace = jsTraceMatch[1];
      const clean = rawCode.replace(trace, '').trim();
      const firstLine = trace.split('\n')[0] || '';
      return { cleanCode: clean || rawCode, extractedError: firstLine, extractedStackTrace: trace };
    }

    // Check for Java / Kotlin Stack Trace
    const javaTraceMatch = rawCode.match(/((?:Exception in thread "[^"]*" |java\.lang\.[A-Za-z]+Exception|kotlin\.[A-Za-z]+Exception)[\s\S]+?(?:\n\s+at [^\n]+)+)/);
    if (javaTraceMatch) {
      const trace = javaTraceMatch[1];
      const clean = rawCode.replace(trace, '').trim();
      const firstLine = trace.split('\n')[0] || '';
      return { cleanCode: clean || rawCode, extractedError: firstLine, extractedStackTrace: trace };
    }

    return { cleanCode: rawCode, extractedError: '', extractedStackTrace: '' };
  }

  /**
   * Detects programming language with multi-heuristic signatures
   */
  _detectLanguage(code, requested, filename = '', stackTrace = '') {
    if (requested && requested !== 'Auto-Detect' && requested !== 'auto') {
      const found = this.supportedLanguages.find(l => l.toLowerCase() === requested.toLowerCase());
      if (found) return found;
      return requested.charAt(0).toUpperCase() + requested.slice(1);
    }

    // Check filename extension if provided
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      const extMap = {
        'py': 'Python', 'js': 'JavaScript', 'jsx': 'JavaScript', 'ts': 'TypeScript', 'tsx': 'TypeScript',
        'kt': 'Kotlin', 'kts': 'Kotlin', 'java': 'Java', 'cpp': 'C++', 'cc': 'C++', 'c': 'C', 'h': 'C', 'hpp': 'C++',
        'sql': 'SQL', 'html': 'HTML', 'htm': 'HTML', 'css': 'CSS', 'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP', 'swift': 'Swift', 'sh': 'Bash'
      };
      if (ext && extMap[ext]) return extMap[ext];
    }

    // Check stack trace signatures
    if (stackTrace) {
      if (/Traceback \(most recent call last\)/i.test(stackTrace) || /File ".*\.py"/i.test(stackTrace)) return 'Python';
      if (/at (?:async )?[A-Za-z0-9_$.]+\s*\([^)]+:[0-9]+:[0-9]+\)/i.test(stackTrace)) return 'JavaScript';
      if (/java\.lang\.|AndroidRuntime|androidx\./i.test(stackTrace)) return 'Kotlin';
    }

    const trimmed = code.trim();
    if (!trimmed) return 'Python'; // Default neutral container

    // Language heuristics scoring
    const scores = {
      Python: 0, JavaScript: 0, TypeScript: 0, Kotlin: 0, Java: 0,
      'C++': 0, C: 0, SQL: 0, HTML: 0, CSS: 0
    };

    // Python heuristics
    if (/def\s+[a-zA-Z_]\w*\s*\(/.test(code)) scores.Python += 6;
    if (/:[\s]*$/m.test(code)) scores.Python += 3;
    if (/\belif\b/.test(code)) scores.Python += 8;
    if (/\b(?:import\s+math|import\s+os|import\s+sys|import\s+numpy|import\s+pandas)\b/.test(code)) scores.Python += 7;
    if (/\bprint\s*\(/.test(code) && !/System\.out\.print/.test(code)) scores.Python += 4;
    if (/\bNone\b/.test(code)) scores.Python += 5;
    if (/\bTrue\b|\bFalse\b/.test(code)) scores.Python += 3;
    if (/^[\t ]*except\s+[a-zA-Z_]/m.test(code)) scores.Python += 8;
    if (/^[\t ]*with\s+open\(/m.test(code)) scores.Python += 8;

    // TypeScript / JavaScript heuristics
    if (/\binterface\s+[A-Z]\w*\s*\{/.test(code)) scores.TypeScript += 10;
    if (/\btype\s+[A-Z]\w*\s*=\s*/.test(code)) scores.TypeScript += 8;
    if (/:\s*(?:string|number|boolean|any|void|never)\b/.test(code)) scores.TypeScript += 7;
    if (/\bconsole\.(?:log|error|warn)\s*\(/.test(code)) { scores.JavaScript += 7; scores.TypeScript += 6; }
    if (/\b(?:const|let|var)\s+[a-zA-Z_$]/.test(code)) { scores.JavaScript += 5; scores.TypeScript += 5; }
    if (/=>\s*\{?/.test(code)) { scores.JavaScript += 4; scores.TypeScript += 4; }
    if (/\bfunction\s+[a-zA-Z_$]/.test(code)) { scores.JavaScript += 5; scores.TypeScript += 5; }
    if (/\bdocument\.querySelector|\bwindow\./.test(code)) scores.JavaScript += 8;

    // Kotlin / Android heuristics
    if (/@Composable\b/.test(code)) scores.Kotlin += 15;
    if (/\bfun\s+[a-zA-Z_]\w*\s*\(/.test(code)) scores.Kotlin += 10;
    if (/\bval\s+[a-zA-Z_]\w*\s*[:=]/.test(code)) scores.Kotlin += 7;
    if (/Modifier\.[a-zA-Z]+/.test(code)) scores.Kotlin += 10;
    if (/remember\s*\{/.test(code)) scores.Kotlin += 10;
    if (/\bprintln\s*\(/.test(code) && !scores.Python) scores.Kotlin += 4;

    // Java heuristics
    if (/public\s+class\s+[A-Z]\w*/.test(code)) scores.Java += 10;
    if (/public\s+static\s+void\s+main\s*\(/.test(code)) scores.Java += 12;
    if (/System\.out\.println\s*\(/.test(code)) scores.Java += 10;
    if (/\bArrayList<[A-Za-z0-9_]+>/.test(code)) scores.Java += 8;

    // C / C++ heuristics
    if (/#include\s+<iostream>|std::cout|std::vector|std::string/.test(code)) scores['C++'] += 15;
    if (/#include\s+<stdio\.h>|printf\s*\(|malloc\s*\(/.test(code)) scores.C += 12;
    if (/cout\s*<<|cin\s*>>/.test(code)) scores['C++'] += 12;
    if (/int\s+main\s*\(\s*(?:int\s+argc|void)?\s*\)/.test(code)) { scores['C++'] += 6; scores.C += 6; }

    // SQL heuristics
    if (/\bSELECT\b[\s\S]+?\bFROM\b/i.test(code)) scores.SQL += 15;
    if (/\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bCREATE\s+TABLE\b/i.test(code)) scores.SQL += 15;

    // HTML / CSS heuristics
    if (/<!DOCTYPE\s+html|<html[\s>]|<div[\s>]|<body[\s>]/i.test(code)) scores.HTML += 15;
    if (/^[.#][a-zA-Z0-9_-]+\s*\{[\s\S]*?\}/m.test(code) && !scores.JavaScript) scores.CSS += 12;

    let bestLang = 'Python';
    let highestScore = 0;
    for (const [lang, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestLang = lang;
      }
    }

    return bestLang;
  }

  _detectFramework(code, language) {
    if (/@Composable|setContent|remember\s*\{|LazyColumn/.test(code)) return 'Jetpack Compose / Android';
    if (/import\s+React|useState|useEffect|className=|jsx/.test(code)) return 'React';
    if (/createClient\([^)]*supabase/.test(code) || /supabase\.from\(/.test(code)) return 'Supabase';
    if (/express\(\)|app\.get\(|app\.post\(|req,\s*res/.test(code)) return 'Express.js';
    if (/torch\.|nn\.Module|optimizer\.step/.test(code)) return 'PyTorch';
    if (/django\.|models\.Model|views\.py/.test(code)) return 'Django';
    if (/from\s+fastapi\s+import|@app\.get/.test(code)) return 'FastAPI';
    if (/from\s+flask\s+import|@app\.route/.test(code)) return 'Flask';
    if (/pd\.DataFrame|np\.array/.test(code)) return 'Pandas / NumPy';
    return null;
  }

  _detectRuntime(code, language, stackTrace) {
    if (language === 'Python') return 'Python 3.x (CPython)';
    if (language === 'JavaScript' || language === 'TypeScript') {
      if (/process\.|require\(|module\.exports/.test(code)) return 'Node.js';
      if (/Deno\./.test(code)) return 'Deno';
      return 'V8 / Modern Browser';
    }
    if (language === 'Kotlin' || language === 'Java') {
      if (/android|androidx|compose/i.test(code + stackTrace)) return 'Android ART Runtime';
      return 'OpenJDK / JVM';
    }
    if (language === 'C' || language === 'C++') return 'GCC / Clang';
    if (language === 'SQL') return 'PostgreSQL / Standard ANSI SQL';
    return null;
  }

  _parseStackTrace(trace, language) {
    if (!trace) return [];
    const frames = [];

    if (language === 'Python' || /Traceback/i.test(trace)) {
      const frameRegex = /File "([^"]+)", line ([0-9]+)(?:, in (.+))?/g;
      let match;
      while ((match = frameRegex.exec(trace)) !== null) {
        frames.push({
          file: match[1],
          line: parseInt(match[2], 10),
          function: match[3] || 'module',
          raw: match[0]
        });
      }
    } else if (language === 'JavaScript' || /at /i.test(trace)) {
      const frameRegex = /at (?:([A-Za-z0-9_$.<>]+)\s+)?\(?(?:.*[\\/])?([^:()]+):([0-9]+):([0-9]+)\)?/g;
      let match;
      while ((match = frameRegex.exec(trace)) !== null) {
        frames.push({
          file: match[2],
          line: parseInt(match[3], 10),
          column: parseInt(match[4], 10),
          function: match[1] || 'anonymous',
          raw: match[0]
        });
      }
    }
    return frames;
  }

  _checkIncompleteness(code, language) {
    const trimmed = code.trim();
    if (!trimmed) return { isIncomplete: true, isTruncated: false, reason: 'Empty code input.' };

    const lastLine = trimmed.split('\n').pop()?.trim() || '';

    // Check abrupt ends
    if (/^(?:if|elif|while|for|def|class|else|try|except|finally|with)\b.*[^:]$/m.test(lastLine) && language === 'Python') {
      return {
        isIncomplete: true,
        isTruncated: false,
        reason: `Incomplete statement on final line: '${lastLine}'. Expected colon or indented body.`
      };
    }

    if (/[=+\-*/&|]\s*$/.test(lastLine)) {
      return {
        isIncomplete: true,
        isTruncated: true,
        reason: `Code appears truncated mid-expression: ending with '${lastLine}'.`
      };
    }

    // Check unbalanced delimiters over whole file
    const openParen = (code.match(/\(/g) || []).length;
    const closeParen = (code.match(/\)/g) || []).length;
    const openBrace = (code.match(/\{/g) || []).length;
    const closeBrace = (code.match(/\}/g) || []).length;
    const openBracket = (code.match(/\[/g) || []).length;
    const closeBracket = (code.match(/\]/g) || []).length;

    if (openBrace > closeBrace && ['JavaScript', 'TypeScript', 'Java', 'Kotlin', 'C++', 'C'].includes(language)) {
      return {
        isIncomplete: true,
        isTruncated: true,
        reason: `Unclosed curly braces: ${openBrace} opening vs ${closeBrace} closing braces.`
      };
    }

    if (openParen > closeParen) {
      return {
        isIncomplete: true,
        isTruncated: true,
        reason: `Unclosed parentheses: ${openParen} '(' vs ${closeParen} ')'.`
      };
    }

    if (openBracket > closeBracket) {
      return {
        isIncomplete: true,
        isTruncated: true,
        reason: `Unclosed square brackets: ${openBracket} '[' vs ${closeBracket} ']'.`
      };
    }

    return { isIncomplete: false, isTruncated: false, reason: '' };
  }
}

// Global Singleton
if (typeof window !== 'undefined') {
  window.InputProcessor = InputProcessor;
  window.inputProcessor = new InputProcessor();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InputProcessor };
}
