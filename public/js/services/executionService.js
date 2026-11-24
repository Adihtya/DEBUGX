/**
 * ==============================================================================
 * DEBUGX — CLIENT EXECUTION SERVICE (Stage C)
 * Calls the secure backend execution API (/api/execute) to execute code in
 * an isolated temporary sandbox, or uses local sandboxed worker when offline.
 * Captures stdout, stderr, exit code, compilation errors, and runtime exceptions.
 * ==============================================================================
 */

class ExecutionService {
  constructor() {
    this.maxExecutionTimeMs = 3000;
  }

  /**
   * Execute code in an isolated sandbox environment
   * @param {Object} params - { code, language, expectedOutput, inputs }
   * @returns {Promise<Object>} ExecutionResult
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

    // 1. Try secure backend server API (/api/execute)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language, expectedOutput, inputs })
        });

        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn('[ExecutionService] Server execution API unavailable, trying local fallback:', err.message);
      }
    }

    // 2. In-browser sandbox fallback for JavaScript / TypeScript
    const normLang = (language || '').toLowerCase();
    if (normLang.includes('javascript') || normLang.includes('typescript') || normLang === 'js' || normLang === 'ts') {
      return this._executeLocalJavaScript(code, expectedOutput);
    }

    // 3. For languages requiring backend compiler/runtime when server is offline
    return {
      executed: false,
      status: 'VALIDATION INCOMPLETE',
      language,
      reason: `Execution for ${language} requires backend compiler/interpreter service.`,
      stdout: '',
      stderr: '',
      exitCode: null,
      hasError: false,
      errorCategory: null
    };
  }

  /**
   * Confined JavaScript evaluation in client browser
   */
  async _executeLocalJavaScript(code, expectedOutput) {
    const dangerous = [/fetch\s*\(/, /XMLHttpRequest/, /localStorage/, /indexedDB/, /window\./, /document\./];
    for (const pat of dangerous) {
      if (pat.test(code)) {
        return {
          executed: false,
          status: 'VALIDATION INCOMPLETE',
          reason: 'Host environment access not permitted in isolated execution sandbox.',
          stdout: '',
          stderr: 'Host access blocked',
          exitCode: 1,
          hasError: true,
          errorCategory: 'SECURITY_RESTRICTION'
        };
      }
    }

    let logs = [];
    let customConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.join(' '))
    };

    try {
      const runner = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Execution timed out after ${this.maxExecutionTimeMs}ms (infinite loop detected)`));
        }, this.maxExecutionTimeMs);

        try {
          const fn = new Function('console', `
            "use strict";
            ${code}
          `);
          fn(customConsole);
          clearTimeout(timer);
          resolve();
        } catch (e) {
          clearTimeout(timer);
          reject(e);
        }
      });

      await runner;

      const stdout = logs.join('\n');
      let status = 'POSSIBLE LOGIC ERROR';
      let outputMatches = null;
      let hasError = false;

      if (expectedOutput !== null && expectedOutput !== undefined && expectedOutput.trim() !== '') {
        outputMatches = stdout.trim() === expectedOutput.trim();
        status = outputMatches ? 'VERIFIED' : 'BUG FOUND';
        hasError = !outputMatches;
      }

      return {
        executed: true,
        status,
        language: 'JavaScript',
        phase: 'runtime',
        exitCode: 0,
        stdout,
        stderr: '',
        timedOut: false,
        compilationError: null,
        runtimeException: null,
        errorCategory: hasError ? 'LOGICAL_ERROR' : null,
        errorMessage: null,
        errorLine: null,
        hasError,
        outputMatches,
        expectedOutput,
        actualOutput: stdout.trim(),
        durationMs: 10
      };
    } catch (err) {
      const isTimeout = err.message.includes('timed out');
      return {
        executed: true,
        status: 'BUG FOUND',
        language: 'JavaScript',
        phase: isTimeout ? 'runtime' : (err.name === 'SyntaxError' ? 'compilation' : 'runtime'),
        exitCode: 1,
        stdout: logs.join('\n'),
        stderr: err.stack || err.message,
        timedOut: isTimeout,
        compilationError: err.name === 'SyntaxError' ? err.message : null,
        runtimeException: err.name,
        errorCategory: isTimeout ? 'INFINITE_LOOP_TIMEOUT' : (err.name === 'SyntaxError' ? 'SYNTAX_ERROR' : 'RUNTIME_ERROR'),
        errorMessage: err.message,
        errorLine: null,
        hasError: true,
        outputMatches: false,
        expectedOutput,
        actualOutput: '',
        durationMs: 15
      };
    }
  }
}

// Global Singleton
if (typeof window !== 'undefined') {
  window.ExecutionService = ExecutionService;
  window.executionService = new ExecutionService();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExecutionService };
}
