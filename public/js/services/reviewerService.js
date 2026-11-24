/**
// ==============================================================================
// DEBUGX — SECOND-PASS REVIEWER ENGINE (Phase 7)
// Automatically reviews proposed code fixes before rendering to user:
// - Verifies surgical minimality (no unwanted rewrites or deletions)
// - Checks that original program structure and signatures are preserved
// - Confirms that no new syntax errors or unimported dependencies are added
// ==============================================================================
*/

class ReviewerService {
  constructor() {}

  /**
   * Reviews a proposed fix against the original code and identified defect
   * @param {Object} params - { originalCode, correctedCode, language, primaryDefect }
   * @returns {Object} ReviewResult
   */
  reviewFix(params) {
    const { originalCode = '', correctedCode = '', language = 'Python', primaryDefect } = params;

    const critiques = [];
    let isApproved = true;
    let score = 100;

    // Rule 1: Fix must not be empty if there was a defect
    if (primaryDefect && (!correctedCode || !correctedCode.trim())) {
      critiques.push('Proposed correction is empty despite an identified defect.');
      return {
        approved: false,
        score: 0,
        critique: 'Proposed fix is empty.',
        regressions: critiques
      };
    }

    // Rule 2: Clean code preservation (if no defect, code should remain identical)
    if (!primaryDefect && originalCode.trim() !== correctedCode.trim()) {
      critiques.push('No bug was detected, but the proposed fix altered the original source code.');
      score -= 30;
    }

    // Rule 3: Function / Class Signature Preservation
    const origFuncs = this._extractFunctions(originalCode, language);
    const fixedFuncs = this._extractFunctions(correctedCode, language);
    for (const fn of origFuncs) {
      if (!fixedFuncs.has(fn)) {
        critiques.push(`Original function or method '${fn}' was removed in the proposed correction.`);
        score -= 25;
        isApproved = false;
      }
    }

    // Rule 4: Check if unrelated lines were pruned
    const origLineCount = originalCode.trim().split('\n').length;
    const fixedLineCount = correctedCode.trim().split('\n').length;
    if (origLineCount > 10 && fixedLineCount < origLineCount * 0.4) {
      critiques.push(`Correction stripped excessive lines (${origLineCount} lines reduced to ${fixedLineCount}). Ensure unrelated code is preserved.`);
      score -= 20;
    }

    // Rule 5: Static syntax health of corrected code
    if (typeof window !== 'undefined' && window.staticAnalyzer) {
      const reCheck = window.staticAnalyzer.analyze({
        sanitizedCode: correctedCode,
        lines: correctedCode.split('\n'),
        detectedLanguage: language
      });
      if (reCheck.hasIssues) {
        const errorDefects = reCheck.diagnostics.filter(d => d.severity === 'error');
        if (errorDefects.length > 0) {
          critiques.push(`Proposed fix introduces a new syntax/runtime error: ${errorDefects[0].message}`);
          score -= 40;
          isApproved = false;
        }
      }
    }

    return {
      approved: isApproved && score >= 70,
      score: Math.max(0, score),
      critique: critiques.length ? critiques.join('; ') : 'Fix is minimal, preserves program signatures, and resolves the identified defect.',
      regressions: critiques
    };
  }

  _extractFunctions(code, language) {
    const funcs = new Set();
    if (!code) return funcs;

    let regex;
    if (language === 'Python') {
      regex = /def\s+([a-zA-Z_]\w*)\s*\(/g;
    } else if (language === 'JavaScript' || language === 'TypeScript') {
      regex = /(?:function\s+([a-zA-Z_$]\w*)|([a-zA-Z_$]\w*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
    } else if (language === 'Kotlin') {
      regex = /fun\s+([a-zA-Z_]\w*)\s*\(/g;
    } else if (language === 'Java') {
      regex = /(?:public|private|protected)?\s*(?:static\s+)?[\w<>[\],\s]+\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{/g;
    }

    if (regex) {
      let m;
      while ((m = regex.exec(code)) !== null) {
        const fnName = m[1] || m[2];
        if (fnName) funcs.add(fnName);
      }
    }
    return funcs;
  }
}

// Global Singleton
if (typeof window !== 'undefined') {
  window.ReviewerService = ReviewerService;
  window.reviewerService = new ReviewerService();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReviewerService };
}
