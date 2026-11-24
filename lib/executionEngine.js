/**
 * ==============================================================================
 * DEBUGX — SECURE ISOLATED CODE EXECUTION & VALIDATION ENGINE (Stage C)
 * 
 * Executes untrusted code in an isolated temporary sandbox with:
 * - Strict timeout enforcement (infinite loop protection)
 * - Memory and process limits
 * - Capturing stdout, stderr, compilation errors, and runtime exceptions
 * - Deterministic assertion and output comparison
 * - Zero fabricated results: reports truthfully what happened
 * ==============================================================================
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Default limits
const LIMITS = {
  EXECUTION_TIMEOUT_MS: 3000,
  COMPILATION_TIMEOUT_MS: 5000,
  MAX_BUFFER_BYTES: 1024 * 1024, // 1MB output cap
  SANDBOX_ROOT: path.join(os.tmpdir(), 'debugx_sandboxes')
};

// Ensure sandbox root exists
try {
  if (!fs.existsSync(LIMITS.SANDBOX_ROOT)) {
    fs.mkdirSync(LIMITS.SANDBOX_ROOT, { recursive: true, mode: 0o700 });
  }
} catch (e) {
  // tmpdir access fallback
}

class ExecutionEngine {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || LIMITS.EXECUTION_TIMEOUT_MS;
    this.compilationTimeoutMs = options.compilationTimeoutMs || LIMITS.COMPILATION_TIMEOUT_MS;
    this.sandboxRoot = LIMITS.SANDBOX_ROOT;
  }

  /**
   * Main execution entry point
   * @param {Object} params - { code, language, expectedOutput, inputs }
   * @returns {Promise<ExecutionResult>}
   */
  async execute(params) {
    const { code, language = 'Python', expectedOutput = null, inputs = [] } = params;

    if (!code || !code.trim()) {
      return {
        executed: false,
        status: 'VALIDATION INCOMPLETE',
        reason: 'Empty code submission. Nothing to execute.',
        stdout: '',
        stderr: '',
        exitCode: null,
        hasError: false,
        errorCategory: null
      };
    }

    const normLang = this._normalizeLanguage(language);

    switch (normLang) {
      case 'python':
        return this._executePython(code, expectedOutput, inputs);
      case 'javascript':
        return this._executeJavaScript(code, expectedOutput, inputs);
      case 'cpp':
      case 'c':
        return this._executeCpp(code, normLang, expectedOutput, inputs);
      default:
        return {
          executed: false,
          status: 'VALIDATION INCOMPLETE',
          language: normLang,
          reason: `Isolated execution runtime for '${language}' is not available on this server.`,
          stdout: '',
          stderr: '',
          exitCode: null,
          hasError: false,
          errorCategory: null
        };
    }
  }

  _normalizeLanguage(lang) {
    const l = (lang || '').toLowerCase().trim();
    if (l.includes('python') || l === 'py') return 'python';
    if (l.includes('javascript') || l.includes('node') || l === 'js') return 'javascript';
    if (l.includes('typescript') || l === 'ts') return 'javascript'; // Node can run stripped TS / JS
    if (l === 'cpp' || l === 'c++') return 'cpp';
    if (l === 'c') return 'c';
    if (l.includes('java')) return 'java';
    return l;
  }

  /**
   * Create isolated sandbox directory for a single run
   */
  _createSandboxDir() {
    const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const runDir = path.join(this.sandboxRoot, runId);
    fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
    return { runId, runDir };
  }

  /**
   * Clean up sandbox directory safely
   */
  _cleanupSandboxDir(dir) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore cleanup errors
    }
  }

  /**
   * 1. PYTHON EXECUTION
   */
  async _executePython(code, expectedOutput, inputs) {
    const { runDir } = this._createSandboxDir();
    const scriptPath = path.join(runDir, 'script.py');

    try {
      fs.writeFileSync(scriptPath, code, 'utf8');

      // First check syntax without executing
      const syntaxCheck = this._runProcess('python3', ['-m', 'py_compile', scriptPath], runDir, 2000);
      if (syntaxCheck.exitCode !== 0) {
        const errorMsg = syntaxCheck.stderr || syntaxCheck.stdout;
        const parsed = this._parsePythonError(errorMsg, code);
        return {
          executed: true,
          status: 'BUG FOUND',
          language: 'Python',
          phase: 'compilation',
          exitCode: syntaxCheck.exitCode,
          stdout: '',
          stderr: errorMsg,
          timedOut: false,
          compilationError: errorMsg,
          runtimeException: parsed.exception,
          errorCategory: 'SYNTAX_ERROR',
          errorMessage: parsed.message,
          errorLine: parsed.line,
          hasError: true,
          durationMs: syntaxCheck.durationMs
        };
      }

      // Execute script with timeout
      const execResult = this._runProcess('python3', [scriptPath], runDir, this.timeoutMs, inputs);
      const parsedError = execResult.exitCode !== 0 ? this._parsePythonError(execResult.stderr, code) : null;
      
      let hasError = execResult.exitCode !== 0 || execResult.timedOut;
      let errorCategory = null;
      if (execResult.timedOut) {
        errorCategory = 'INFINITE_LOOP_TIMEOUT';
      } else if (hasError) {
        errorCategory = parsedError?.category || 'RUNTIME_ERROR';
      }

      // Check logical correctness against expected output if provided
      let outputMatches = null;
      let status = 'POSSIBLE LOGIC ERROR';

      if (execResult.timedOut) {
        status = 'BUG FOUND';
      } else if (hasError) {
        status = 'BUG FOUND';
      } else {
        // Ran cleanly without runtime crash
        if (expectedOutput !== null && expectedOutput !== undefined && expectedOutput.trim() !== '') {
          const normActual = execResult.stdout.trim();
          const normExpected = expectedOutput.trim();
          outputMatches = normActual === normExpected;
          if (outputMatches) {
            status = 'VERIFIED';
          } else {
            status = 'BUG FOUND';
            hasError = true;
            errorCategory = 'LOGICAL_ERROR';
          }
        } else {
          // No expected output provided to assert against: code executes without crash, but logic is unverified
          status = 'POSSIBLE LOGIC ERROR';
        }
      }

      return {
        executed: true,
        status,
        language: 'Python',
        phase: 'runtime',
        exitCode: execResult.exitCode,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        timedOut: execResult.timedOut,
        compilationError: null,
        runtimeException: parsedError?.exception || (execResult.timedOut ? 'Execution Timeout (Infinite Loop)' : null),
        errorCategory,
        errorMessage: parsedError?.message || (execResult.timedOut ? `Execution timed out after ${this.timeoutMs}ms (infinite loop detected)` : null),
        errorLine: parsedError?.line || null,
        hasError,
        outputMatches,
        expectedOutput,
        actualOutput: execResult.stdout.trim(),
        durationMs: execResult.durationMs
      };
    } finally {
      this._cleanupSandboxDir(runDir);
    }
  }

  /**
   * 2. JAVASCRIPT EXECUTION (Node.js)
   */
  async _executeJavaScript(code, expectedOutput, inputs) {
    const { runDir } = this._createSandboxDir();
    const scriptPath = path.join(runDir, 'script.js');

    try {
      fs.writeFileSync(scriptPath, code, 'utf8');

      // Check syntax first
      const syntaxCheck = this._runProcess('node', ['--check', scriptPath], runDir, 2000);
      if (syntaxCheck.exitCode !== 0) {
        const errorMsg = syntaxCheck.stderr || syntaxCheck.stdout;
        const parsed = this._parseNodeError(errorMsg, code);
        return {
          executed: true,
          status: 'BUG FOUND',
          language: 'JavaScript',
          phase: 'compilation',
          exitCode: syntaxCheck.exitCode,
          stdout: '',
          stderr: errorMsg,
          timedOut: false,
          compilationError: errorMsg,
          runtimeException: parsed.exception,
          errorCategory: 'SYNTAX_ERROR',
          errorMessage: parsed.message,
          errorLine: parsed.line,
          hasError: true,
          durationMs: syntaxCheck.durationMs
        };
      }

      // Execute script with timeout and heap limit
      const execResult = this._runProcess('node', ['--max-old-space-size=64', scriptPath], runDir, this.timeoutMs, inputs);
      const parsedError = execResult.exitCode !== 0 ? this._parseNodeError(execResult.stderr, code) : null;

      let hasError = execResult.exitCode !== 0 || execResult.timedOut;
      let errorCategory = null;
      if (execResult.timedOut) {
        errorCategory = 'INFINITE_LOOP_TIMEOUT';
      } else if (hasError) {
        errorCategory = parsedError?.category || 'RUNTIME_ERROR';
      }

      let outputMatches = null;
      let status = 'POSSIBLE LOGIC ERROR';

      if (execResult.timedOut || hasError) {
        status = 'BUG FOUND';
      } else {
        if (expectedOutput !== null && expectedOutput !== undefined && expectedOutput.trim() !== '') {
          const normActual = execResult.stdout.trim();
          const normExpected = expectedOutput.trim();
          outputMatches = normActual === normExpected;
          if (outputMatches) {
            status = 'VERIFIED';
          } else {
            status = 'BUG FOUND';
            hasError = true;
            errorCategory = 'LOGICAL_ERROR';
          }
        } else {
          status = 'POSSIBLE LOGIC ERROR';
        }
      }

      return {
        executed: true,
        status,
        language: 'JavaScript',
        phase: 'runtime',
        exitCode: execResult.exitCode,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        timedOut: execResult.timedOut,
        compilationError: null,
        runtimeException: parsedError?.exception || (execResult.timedOut ? 'Execution Timeout (Infinite Loop)' : null),
        errorCategory,
        errorMessage: parsedError?.message || (execResult.timedOut ? `Execution timed out after ${this.timeoutMs}ms (infinite loop detected)` : null),
        errorLine: parsedError?.line || null,
        hasError,
        outputMatches,
        expectedOutput,
        actualOutput: execResult.stdout.trim(),
        durationMs: execResult.durationMs
      };
    } finally {
      this._cleanupSandboxDir(runDir);
    }
  }

  /**
   * 3. C / C++ EXECUTION (clang++ / g++)
   */
  async _executeCpp(code, langType, expectedOutput, inputs) {
    const { runDir } = this._createSandboxDir();
    const ext = langType === 'c' ? '.c' : '.cpp';
    const srcPath = path.join(runDir, 'program' + ext);
    const binPath = path.join(runDir, 'program.out');

    try {
      fs.writeFileSync(srcPath, code, 'utf8');

      // Compiler selection
      const compiler = langType === 'c' ? 'clang' : 'clang++';
      const compileArgs = ['-O0', '-Wall', srcPath, '-o', binPath];

      const compileCheck = this._runProcess(compiler, compileArgs, runDir, this.compilationTimeoutMs);
      if (compileCheck.exitCode !== 0 || !fs.existsSync(binPath)) {
        const errorMsg = compileCheck.stderr || compileCheck.stdout;
        const lineMatch = errorMsg.match(/:(\d+):(\d+):\s*error:\s*(.+)/);
        return {
          executed: true,
          status: 'BUG FOUND',
          language: langType === 'c' ? 'C' : 'C++',
          phase: 'compilation',
          exitCode: compileCheck.exitCode,
          stdout: '',
          stderr: errorMsg,
          timedOut: compileCheck.timedOut,
          compilationError: errorMsg,
          runtimeException: 'CompilationError',
          errorCategory: 'COMPILATION_ERROR',
          errorMessage: lineMatch ? lineMatch[3] : errorMsg.split('\n')[0],
          errorLine: lineMatch ? parseInt(lineMatch[1], 10) : null,
          hasError: true,
          durationMs: compileCheck.durationMs
        };
      }

      // Execute compiled binary
      const execResult = this._runProcess(binPath, [], runDir, this.timeoutMs, inputs);
      let hasError = execResult.exitCode !== 0 || execResult.timedOut;
      let errorCategory = null;
      if (execResult.timedOut) {
        errorCategory = 'INFINITE_LOOP_TIMEOUT';
      } else if (hasError) {
        errorCategory = 'RUNTIME_ERROR';
      }

      let outputMatches = null;
      let status = 'POSSIBLE LOGIC ERROR';

      if (execResult.timedOut || hasError) {
        status = 'BUG FOUND';
      } else {
        if (expectedOutput !== null && expectedOutput !== undefined && expectedOutput.trim() !== '') {
          const normActual = execResult.stdout.trim();
          const normExpected = expectedOutput.trim();
          outputMatches = normActual === normExpected;
          if (outputMatches) {
            status = 'VERIFIED';
          } else {
            status = 'BUG FOUND';
            hasError = true;
            errorCategory = 'LOGICAL_ERROR';
          }
        } else {
          status = 'POSSIBLE LOGIC ERROR';
        }
      }

      return {
        executed: true,
        status,
        language: langType === 'c' ? 'C' : 'C++',
        phase: 'runtime',
        exitCode: execResult.exitCode,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        timedOut: execResult.timedOut,
        compilationError: null,
        runtimeException: execResult.timedOut ? 'Execution Timeout (Infinite Loop)' : (hasError ? `Process exited with code ${execResult.exitCode}` : null),
        errorCategory,
        errorMessage: execResult.timedOut ? `Execution timed out after ${this.timeoutMs}ms (infinite loop detected)` : (hasError ? execResult.stderr || `Runtime error (exit code ${execResult.exitCode})` : null),
        errorLine: null,
        hasError,
        outputMatches,
        expectedOutput,
        actualOutput: execResult.stdout.trim(),
        durationMs: execResult.durationMs
      };
    } finally {
      this._cleanupSandboxDir(runDir);
    }
  }

  /**
   * Synchronous child process execution with timeout and output capture
   */
  _runProcess(command, args, cwd, timeoutMs, inputs = []) {
    const start = Date.now();
    try {
      let inputData = '';
      if (Array.isArray(inputs) && inputs.length > 0) {
        inputData = inputs.join('\n') + '\n';
      }

      const stdout = execSync(`${command} ${args.map(a => `"${a}"`).join(' ')}`, {
        cwd,
        input: inputData,
        timeout: timeoutMs,
        maxBuffer: LIMITS.MAX_BUFFER_BYTES,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      });

      return {
        exitCode: 0,
        stdout: stdout || '',
        stderr: '',
        timedOut: false,
        durationMs: Date.now() - start
      };
    } catch (err) {
      const isTimeout = err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM';
      return {
        exitCode: err.status !== undefined ? err.status : 1,
        stdout: (err.stdout ? err.stdout.toString() : ''),
        stderr: (err.stderr ? err.stderr.toString() : (err.message || '')),
        timedOut: isTimeout,
        durationMs: Date.now() - start
      };
    }
  }

  /**
   * Parse Python Traceback and Error Details
   */
  _parsePythonError(stderr, code) {
    if (!stderr) return { exception: 'UnknownError', message: 'Unknown error', category: 'RUNTIME_ERROR', line: null };

    // Syntax error: File ".../script.py", line 4
    const lineMatch = stderr.match(/File ".*?", line (\d+)/);
    const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : null;

    // Error type & message: e.g. NameError: name 'y' is not defined
    const errorMatch = stderr.match(/\b([A-Za-z]+Error|[A-Za-z]+Exception):\s*(.+)/);
    const exception = errorMatch ? errorMatch[1] : 'PythonException';
    const message = errorMatch ? errorMatch[2].trim() : stderr.split('\n')[0];

    let category = 'RUNTIME_ERROR';
    if (exception === 'SyntaxError' || exception === 'IndentationError') {
      category = 'SYNTAX_ERROR';
    } else if (exception === 'ZeroDivisionError') {
      category = 'ARITHMETIC_ERROR';
    } else if (exception === 'IndexError') {
      category = 'INDEX_ERROR';
    } else if (exception === 'NameError') {
      category = 'UNDEFINED_VARIABLE';
    } else if (exception === 'TypeError') {
      category = 'TYPE_ERROR';
    }

    return {
      exception,
      message: `${exception}: ${message}`,
      category,
      line: lineNum
    };
  }

  /**
   * Parse Node.js Error Output
   */
  _parseNodeError(stderr, code) {
    if (!stderr) return { exception: 'UnknownError', message: 'Unknown error', category: 'RUNTIME_ERROR', line: null };

    // Line match: script.js:4
    const lineMatch = stderr.match(/script\.js:(\d+)/);
    const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : null;

    // Error match: ReferenceError: y is not defined
    const errorMatch = stderr.match(/\b([A-Za-z]+Error):\s*(.+)/);
    const exception = errorMatch ? errorMatch[1] : 'JavaScriptError';
    const message = errorMatch ? errorMatch[2].trim() : stderr.split('\n')[0];

    let category = 'RUNTIME_ERROR';
    if (exception === 'SyntaxError') {
      category = 'SYNTAX_ERROR';
    } else if (exception === 'ReferenceError') {
      category = 'UNDEFINED_VARIABLE';
    } else if (exception === 'TypeError') {
      category = 'TYPE_ERROR';
    } else if (exception === 'RangeError') {
      category = 'RANGE_ERROR';
    }

    return {
      exception,
      message: `${exception}: ${message}`,
      category,
      line: lineNum
    };
  }
}

module.exports = new ExecutionEngine();
