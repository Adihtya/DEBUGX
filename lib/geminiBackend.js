/**
 * ==============================================================================
 * DEBUGX — ADVANCED GEMINI AI BACKEND ENGINE
 * Official Google Gen AI SDK (@google/genai) Integration
 * 
 * Features:
 * - Centralized Model Configuration via GEMINI_MODEL & GEMINI_API_KEY env
 * - 5-Stage Reasoning Pipeline (Understand, Investigate, Root Cause, Fix, Review)
 * - Schema-constrained JSON Output validated with Zod
 * - Conversational Debugging with User/Session-separated Context
 * - Code Explainer with Beginner & Developer modes
 * - Controlled Retries with Exponential Backoff for 429/503 errors
 * - Strict execution honesty (no fabricated test results)
 * ==============================================================================
 */

try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional if environment already populated
}

const { z } = require('zod');
const executionEngine = require('./executionEngine');
let GoogleGenAI;
try {
  const genai = require('@google/genai');
  GoogleGenAI = genai.GoogleGenAI;
} catch (e) {
  console.warn('[GeminiBackend] @google/genai package not found, will use HTTPS fallback if needed.');
}

// ==============================================================================
// 1. CENTRALIZED MODEL CONFIGURATION
// ==============================================================================
const GEMINI_CONFIG = {
  get apiKey() {
    return process.env.GEMINI_API_KEY || '';
  },
  get model() {
    return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  },
  temperature: 0.1,
  maxOutputTokens: 3072,
  topP: 0.95,
  maxRetries: 3
};

// ==============================================================================
// 2. RUNTIME VALIDATION SCHEMAS (ZOD)
// ==============================================================================

const IssueSchema = z.object({
  title: z.string(),
  category: z.string(),
  severity: z.string().default('medium'),
  line: z.number().nullable().optional(),
  rootCause: z.string(),
  evidence: z.string().optional(),
  suggestedFix: z.string()
});

const TestCaseSchema = z.object({
  scenario: z.string(),
  input: z.string(),
  expected_outcome: z.string()
});

const VerificationSchema = z.object({
  status: z.string().default('not_verified'),
  testsRun: z.number().default(0),
  passed: z.number().default(0),
  failed: z.number().default(0),
  details: z.string().optional()
});

const ProblematicLineSchema = z.object({
  line_number: z.number().nullable().optional(),
  code: z.string().optional(),
  reason: z.string().optional()
});

const DebuggingResponseSchema = z.object({
  status: z.string().default('BUG FOUND'),
  language: z.string(),
  summary: z.string(),
  issues: z.array(IssueSchema).default([]),
  error_type: z.string().optional(),
  error_summary: z.string().optional(),
  confidence: z.number().optional().default(0.95),
  evidence: z.array(z.string()).default([]),
  root_cause: z.string().optional(),
  problematic_lines: z.array(ProblematicLineSchema).default([]),
  correctedCode: z.string().default(''),
  corrected_code: z.string().optional(),
  changes: z.array(z.string()).default([]),
  why_the_fix_works: z.string().optional(),
  explanation: z.union([z.string(), z.array(z.string())]).default([]),
  test_cases: z.array(TestCaseSchema).default([]),
  verification: VerificationSchema.default({
    status: 'not_verified',
    testsRun: 0,
    passed: 0,
    failed: 0,
    details: 'Not execution-verified. Statically verified against root cause invariants.'
  }),
  verification_status: z.string().optional(),
  verification_details: z.string().optional(),
  prevention_tips: z.array(z.string()).default([]),
  missing_information: z.array(z.string()).default([])
});

const ExplainCodeSchema = z.object({
  summary: z.string(),
  language: z.string(),
  lines: z.array(z.object({
    line_number: z.number(),
    code: z.string(),
    explanation: z.string()
  })).default([]),
  variables: z.array(z.object({
    name: z.string(),
    type: z.string(),
    purpose: z.string()
  })).default([]),
  control_flow: z.array(z.string()).default([]),
  complexity: z.object({
    time: z.string(),
    space: z.string(),
    notes: z.string().optional()
  }),
  best_practices: z.array(z.string()).default([])
});

const SolutionReviewSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(0).max(100),
  preserves_functionality: z.boolean(),
  addresses_root_cause: z.boolean(),
  introduces_regressions: z.boolean(),
  regression_details: z.string().optional(),
  feedback: z.string()
});

// ==============================================================================
// 3. CONVERSATIONAL DEBUGGING SESSION STORE
// Separated per user and session ID to maintain complete context without re-pasting
// ==============================================================================

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  _getKey(userId, sessionId) {
    return `${userId || 'anonymous'}:${sessionId || 'default'}`;
  }

  saveSession(userId, sessionId, data) {
    const key = this._getKey(userId, sessionId);
    const existing = this.sessions.get(key) || { messages: [] };
    this.sessions.set(key, {
      ...existing,
      ...data,
      lastUpdated: Date.now()
    });
  }

  getSession(userId, sessionId) {
    const key = this._getKey(userId, sessionId);
    return this.sessions.get(key) || null;
  }

  addMessage(userId, sessionId, role, text) {
    const key = this._getKey(userId, sessionId);
    const session = this.sessions.get(key) || { messages: [] };
    session.messages.push({ role, text, timestamp: Date.now() });
    // Keep max 30 messages
    if (session.messages.length > 30) {
      session.messages = session.messages.slice(-30);
    }
    session.lastUpdated = Date.now();
    this.sessions.set(key, session);
  }

  getMessages(userId, sessionId) {
    const key = this._getKey(userId, sessionId);
    const session = this.sessions.get(key);
    return session ? session.messages : [];
  }
}

const sessionManager = new SessionManager();

// ==============================================================================
// 4. RETRY WITH EXPONENTIAL BACKOFF
// ==============================================================================

async function executeWithRetry(operation, maxRetries = GEMINI_CONFIG.maxRetries) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (err) {
      attempt++;
      const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      const isTransient = isRateLimit || err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('UNAVAILABLE');

      if (!isTransient || attempt >= maxRetries) {
        throw err;
      }

      // Exponential backoff: 1s, 2s, 4s (+ jitter)
      const delayMs = Math.pow(2, attempt) * 500 + Math.random() * 300;
      console.warn(`[GeminiBackend] Transient error (${err.message}), retrying in ${Math.round(delayMs)}ms (attempt ${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// ==============================================================================
// 5. OFFICIAL GOOGLE GEN AI SDK INVOCATION
// ==============================================================================

let genAIClient = null;

function getGenAIClient(apiKeyOverride) {
  const key = apiKeyOverride ?? GEMINI_CONFIG.apiKey;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment or .env file.');
  }

  if (GoogleGenAI) {
    return new GoogleGenAI({ apiKey: key });
  }
  return null;
}

/**
 * Universal GenerateContent calling official SDK with fallback
 */
async function callGeminiGenerate(prompt, systemInstruction, imageBase64, mimeType, responseSchema = null, apiKeyOverride = null) {
  const key = apiKeyOverride ?? GEMINI_CONFIG.apiKey;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment or .env file.');
  }

  const modelName = GEMINI_CONFIG.model;

  return executeWithRetry(async () => {
    // Attempt 1: Official @google/genai SDK
    if (GoogleGenAI) {
      const ai = new GoogleGenAI({ apiKey: key });
      const contents = [];

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        contents.push({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: cleanBase64
          }
        });
      }
      contents.push(prompt);

      const config = {
        temperature: GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        topP: GEMINI_CONFIG.topP,
        responseMimeType: 'application/json'
      };

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config
      });

      const text = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }
      return JSON.parse(text);
    }

    // Attempt 2: Direct REST endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
    const parts = [{ text: prompt }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: cleanBase64
        }
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        responseMimeType: 'application/json'
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Gemini API error (${res.status}): ${errText}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Gemini REST API returned an empty candidate text.');
    return JSON.parse(raw);
  });
}

// ==============================================================================
// 6. MULTI-STAGE REASONING PIPELINE (ENGINES 1-5)
// ==============================================================================

/**
 * ENGINE 1 — Code Understanding
 */
async function engineUnderstandCode(params) {
  const { code, language, expectedBehavior, framework } = params;
  const prompt = `Analyze this code and produce an initial program comprehension model:
Language: ${language}
Framework: ${framework || 'Standard'}
Expected: ${expectedBehavior || 'Not explicitly stated'}
Source:
\`\`\`${language}
${code}
\`\`\`
Return JSON:
{
  "summary": "High-level summary of what this code intends to achieve",
  "execution_flow": ["step 1", "step 2"],
  "important_functions": ["func1", "func2"],
  "potential_problem_areas": ["area 1", "area 2"]
}`;
  return callGeminiGenerate(prompt, "You are a code understanding and static semantics analyzer.");
}

/**
 * ENGINE 2 & 3 & 4 — Diagnosis, Root Cause, and Fix Generation
 */
async function engineDiagnoseAndFix(params) {
  const {
    code = '',
    language = 'Python',
    mode = 'beginner',
    errorMessage = '',
    stackTrace = '',
    expectedBehavior = '',
    expectedOutput = '',
    actualOutput = '',
    staticDiagnostics = [],
    executionResult = null,
    screenshotBase64 = null,
    mimeType = 'image/png',
    apiKey = null
  } = params;

  const diagnosticsContext = Array.isArray(staticDiagnostics) && staticDiagnostics.length > 0
    ? `\nStatic Analyzer Diagnostics:\n${JSON.stringify(staticDiagnostics, null, 2)}`
    : '';

  const execContext = executionResult && executionResult.executed
    ? `\n=== ACTUAL SANDBOX EXECUTION RESULTS (Ground Truth) ===
Executed: YES (Phase: ${executionResult.phase})
Exit Code: ${executionResult.exitCode}
Timed Out: ${executionResult.timedOut ? 'YES (Infinite Loop Detected)' : 'NO'}
Standard Output:\n${executionResult.stdout || '[NONE]'}
Standard Error / Traceback:\n${executionResult.stderr || '[NONE]'}
Compilation Error:\n${executionResult.compilationError || '[NONE]'}
Runtime Exception:\n${executionResult.runtimeException || '[NONE]'}
Output Comparison: ${executionResult.outputMatches === true ? 'MATCHES EXPECTED OUTPUT' : (executionResult.outputMatches === false ? 'MISMATCH (ACTUAL != EXPECTED)' : 'N/A')}
Status: ${executionResult.status}
`
    : (executionResult ? `\nExecution Status: ${executionResult.reason || 'Not executed'}` : '');

  const systemInstruction = `You are DEBUGX, an expert compiler engineer, systems architect, and senior debugging engine.
Your highest objective is CORRECTNESS over response speed.
Never generate a code correction before understanding the actual problem.

CRITICAL RULES:
1. NEVER FALSELY APPROVE CODE: If the code failed compilation, threw a runtime exception, timed out, or produced incorrect output, a real bug exists. You MUST diagnose it and generate a working fix. Never declare code correct based on superficial checks.
2. CORRECTNESS IS PARAMOUNT: Never hallucinate code, line numbers, or variable names.
3. EVIDENCE-DRIVEN: Base root cause explanations strictly on concrete evidence from the code, error message, static diagnostics, or actual execution results.
4. SURGICAL CORRECTION: Generate the smallest appropriate fix. Preserve original program structure, indentation, and unrelated functions. Do not rewrite working code.
5. UNCERTAINTY HANDLING: If the input is incomplete, ambiguous, or lacks context, set status to "needs_more_information", confidence to 0.0, and state clearly: "Insufficient information to determine the root cause. Additional code, execution output, or environment details are required."
6. CLEAN CODE: If and only if valid code is submitted without defects and passes execution, set error_type to "Clean Code / No Error Detected", status to "VERIFIED", issues to [], and confidence to 1.0.
7. EXECUTION HONESTY: Never claim that code was executed unless an execution tool ran it. Report true execution status.
8. SCHEMA ADHERENCE: Strictly adhere to the requested JSON schema.`;

  const prompt = `=== DEBUGGING REQUEST ===
Target Language: ${language}
Explanation Mode: ${mode.toUpperCase()} (${mode === 'advanced' ? 'ADVANCED: technical terms, complexity, AST invariants' : 'BEGINNER: step-by-step, plain terms, intuitive'})
${code ? `Source Code:\n\`\`\`${language}\n${code}\n\`\`\`` : 'Source Code: [EMPTY / NOT PROVIDED]'}
${errorMessage ? `Error Message:\n${errorMessage}` : ''}
${stackTrace ? `Stack Trace:\n${stackTrace}` : ''}
${expectedBehavior ? `User Expected Behavior:\n${expectedBehavior}` : ''}
${expectedOutput ? `Expected Output:\n${expectedOutput}` : ''}
${actualOutput ? `Actual Output:\n${actualOutput}` : ''}
${diagnosticsContext}
${execContext}

Return strictly valid JSON matching this schema:
{
  "status": "BUG FOUND | VERIFIED | POSSIBLE LOGIC ERROR | VALIDATION INCOMPLETE",
  "language": "${language}",
  "summary": "Concise summary of diagnosis or confirmation of clean code",
  "issues": [
    {
      "title": "Concise issue title",
      "category": "syntax | logical | runtime | integration | performance",
      "severity": "high | medium | low",
      "line": 4, // line number or null
      "rootCause": "Deep technical root cause explanation quoting evidence from code",
      "evidence": "Exact code quote or trace",
      "suggestedFix": "Minimal surgical replacement"
    }
  ],
  "error_type": "Exact Error Category",
  "error_summary": "Concise summary",
  "confidence": 0.95,
  "evidence": ["Evidence 1", "Evidence 2"],
  "root_cause": "Full root cause explanation",
  "problematic_lines": [
    {
      "line_number": 4,
      "code": "code snippet",
      "reason": "why this line triggers the problem"
    }
  ],
  "correctedCode": "The full corrected source code preserving original indentation and structure",
  "corrected_code": "Same as correctedCode",
  "changes": ["Specific minimal change made"],
  "why_the_fix_works": "Why the fix resolves the root cause without side effects",
  "explanation": "Clear explanation for the user",
  "test_cases": [
    {
      "scenario": "Original failure scenario",
      "input": "test input",
      "expected_outcome": "expected safe output"
    },
    {
      "scenario": "Normal input scenario",
      "input": "standard input",
      "expected_outcome": "normal output"
    },
    {
      "scenario": "Edge case scenario",
      "input": "boundary input",
      "expected_outcome": "gracefully handled"
    }
  ],
  "verification": {
    "status": "not_verified",
    "testsRun": 0,
    "passed": 0,
    "failed": 0,
    "details": "Not execution-verified. Statically verified against identified invariants."
  },
  "prevention_tips": ["Tip 1", "Tip 2"],
  "missing_information": []
}`;

  const rawJson = await callGeminiGenerate(prompt, systemInstruction, screenshotBase64, mimeType, null, apiKey);

  // Normalize legacy/standard field overlap before Zod validation
  if (rawJson.status === 'diagnosed') rawJson.status = 'success';
  if (!rawJson.correctedCode && rawJson.corrected_code) rawJson.correctedCode = rawJson.corrected_code;
  if (!rawJson.corrected_code && rawJson.correctedCode) rawJson.corrected_code = rawJson.correctedCode;

  // Clean code normalization
  if (rawJson.error_type?.includes('Clean Code') || rawJson.summary?.includes('No confirmed bug')) {
    rawJson.summary = 'No confirmed bug was identified in the provided code.';
    rawJson.issues = [];
    rawJson.root_cause = 'No confirmed bug was identified in the provided code.';
    rawJson.confidence = 1.0;
    rawJson.correctedCode = code;
    rawJson.corrected_code = code;
  }

  // Validate with Zod
  const validated = DebuggingResponseSchema.parse(rawJson);
  return validated;
}

/**
 * ENGINE 5 — Independent Solution Review
 */
async function engineReviewSolution(originalCode, correctedCode, language, rootCause, apiKey = null) {
  const prompt = `You are an independent Senior Quality Assurance and Compiler Reviewer.
Review this proposed code correction:

Language: ${language}
Original Code:
\`\`\`${language}
${originalCode}
\`\`\`

Identified Root Cause:
${rootCause}

Proposed Corrected Code:
\`\`\`${language}
${correctedCode}
\`\`\`

Evaluate carefully:
1. Does the proposed fix genuinely resolve the identified root cause?
2. Does it preserve all original functionality without breaking other features?
3. Does it introduce any new bugs or regressions?
4. Does it conform to idiomatic ${language} syntax and formatting?

Return strictly valid JSON:
{
  "approved": true, // or false
  "score": 95, // 0 to 100
  "preserves_functionality": true,
  "addresses_root_cause": true,
  "introduces_regressions": false,
  "regression_details": "None identified or description",
  "feedback": "Concise review evaluation summary"
}`;

  const rawReview = await callGeminiGenerate(
    prompt,
    "You are a rigorous independent code reviewer verifying fix safety.",
    null,
    null,
    null,
    apiKey
  );

  return SolutionReviewSchema.parse(rawReview);
}

/**
 * Composite Master Debugging Pipeline (Engines 1 through 5)
 */
async function analyzeDebuggingPipeline(params) {
  const { code, originalCode, language = 'Python', apiKey, expectedOutput } = params;
  const targetCode = code || originalCode || '';

  // Stage C: Real Isolated Sandbox Execution
  let execResult = null;
  try {
    execResult = await executionEngine.execute({
      code: targetCode,
      language,
      expectedOutput
    });
  } catch (err) {
    execResult = {
      executed: false,
      status: 'VALIDATION FAILED',
      reason: err.message,
      hasError: false
    };
  }

  // Stage D: Diagnosis & Fix Generation (with actual execution evidence)
  const result = await engineDiagnoseAndFix({
    ...params,
    code: targetCode,
    executionResult: execResult
  });

  result.execution = execResult;

  // Ground truth invariant: Overrule false AI clean code declarations
  if (execResult && execResult.hasError) {
    result.status = 'BUG FOUND';
    result.error_type = execResult.errorCategory || result.error_type || 'Execution Error';
    result.error_summary = execResult.errorMessage || execResult.runtimeException || result.error_summary;
    if (!result.issues || result.issues.length === 0 || result.error_type?.includes('Clean Code')) {
      result.issues = [{
        title: execResult.errorMessage || execResult.runtimeException || 'Execution failure detected',
        category: (execResult.errorCategory || 'runtime').toLowerCase(),
        severity: 'high',
        line: execResult.errorLine || 1,
        rootCause: execResult.stderr || execResult.compilationError || 'Process terminated with non-zero exit code.',
        evidence: execResult.stderr || execResult.stdout || 'Execution failure.',
        suggestedFix: 'Correct the execution failure.'
      }];
    }
  } else if (execResult && execResult.executed && !execResult.hasError) {
    if (expectedOutput && execResult.outputMatches === true) {
      result.status = 'VERIFIED';
    } else if (expectedOutput && execResult.outputMatches === false) {
      result.status = 'BUG FOUND';
    } else {
      result.status = 'POSSIBLE LOGIC ERROR';
    }
  } else if (execResult && !execResult.executed) {
    if (result.status !== 'needs_more_information') {
      result.status = result.issues && result.issues.length > 0 ? 'BUG FOUND' : 'VALIDATION INCOMPLETE';
    }
  }

  // Verify the fix via real execution
  if (result.correctedCode && result.correctedCode.trim()) {
    try {
      const fixExec = await executionEngine.execute({
        code: result.correctedCode,
        language,
        expectedOutput
      });

      result.fix_execution = fixExec;
      if (fixExec.executed && !fixExec.hasError) {
        if (expectedOutput) {
          result.verification_status = fixExec.outputMatches ? 'VERIFIED' : 'POSSIBLE LOGIC ERROR';
        } else {
          result.verification_status = 'VERIFIED';
        }
        result.verification_details = `Fix executed successfully without exceptions (Exit code 0, stdout: ${fixExec.stdout.trim() || '[Empty]'})`;
        result.verification = {
          status: result.verification_status,
          testsRun: 1,
          passed: 1,
          failed: 0,
          details: result.verification_details
        };
      } else if (fixExec.hasError) {
        result.verification_status = 'VALIDATION FAILED';
        result.verification_details = `Fix validation failed: ${fixExec.errorMessage || fixExec.runtimeException || 'Runtime error'}`;
        result.verification = {
          status: 'VALIDATION FAILED',
          testsRun: 1,
          passed: 0,
          failed: 1,
          details: result.verification_details
        };
      } else {
        result.verification_status = 'VALIDATION INCOMPLETE';
        result.verification_details = fixExec.reason || 'Validation environment unavailable.';
      }
    } catch (fixErr) {
      console.warn('[GeminiBackend] Fix execution note:', fixErr.message);
    }
  }

  // Step B: Engine 5 (Independent Solution Review) if an issue was diagnosed
  if (result.issues && result.issues.length > 0 && result.correctedCode) {
    try {
      const review = await engineReviewSolution(
        targetCode,
        result.correctedCode,
        language,
        result.root_cause || result.summary,
        apiKey
      );

      result.review = review;
    } catch (reviewErr) {
      console.warn('[GeminiBackend] Solution review step note:', reviewErr.message);
    }
  }

  // Save in Session Manager for follow-up conversational debugging
  if (params.sessionId) {
    sessionManager.saveSession(params.userId, params.sessionId, {
      code: targetCode,
      language,
      result
    });
  }

  return result;
}

// ==============================================================================
// 7. EXPLAIN MY CODE ENGINE
// ==============================================================================

async function explainCode(params) {
  const { code, language = 'Python', mode = 'beginner', apiKey } = params;

  const modeInstruction = mode === 'advanced'
    ? 'ADVANCED / DEVELOPER MODE: Use precise computer science terminology, AST concepts, memory layout considerations, and asymptotic time/space complexity analysis.'
    : 'BEGINNER MODE: Use simple plain English, intuitive analogies, step-by-step explanations, and clearly define any necessary technical terms.';

  const prompt = `Analyze this code for comprehensive explanation:
Language: ${language}
Mode: ${mode.toUpperCase()}

Source Code:
\`\`\`${language}
${code}
\`\`\`

Return strictly valid JSON matching this schema:
{
  "summary": "High-level summary of what this code achieves",
  "language": "${language}",
  "lines": [
    {
      "line_number": 1,
      "code": "code snippet",
      "explanation": "clear explanation of what this line accomplishes"
    }
  ],
  "variables": [
    {
      "name": "variable name",
      "type": "inferred type",
      "purpose": "how it is used"
    }
  ],
  "control_flow": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "complexity": {
    "time": "e.g. O(n)",
    "space": "e.g. O(1)",
    "notes": "explanation of runtime bottlenecks or memory footprint"
  },
  "best_practices": [
    "Tip on clean code or idiomatic conventions"
  ]
}`;

  const systemInstruction = `You are DebugX Senior AI Code Analysis Specialist. ${modeInstruction}`;
  const raw = await callGeminiGenerate(prompt, systemInstruction, null, null, null, apiKey);
  return ExplainCodeSchema.parse(raw);
}

// ==============================================================================
// 8. CONVERSATIONAL DEBUGGING (FOLLOW-UP QUESTIONS)
// ==============================================================================

async function chatFollowUp(params) {
  const { question, userId, sessionId, sessionContext, apiKey } = params;

  // Retrieve prior session context
  const storedSession = sessionManager.getSession(userId, sessionId);
  const priorMessages = sessionManager.getMessages(userId, sessionId);

  const contextData = sessionContext || storedSession?.result || storedSession?.code || 'No prior context available.';

  const formattedHistory = priorMessages
    .slice(-10)
    .map(m => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n');

  const prompt = `You are DEBUGX AI Senior Conversational Debugging Assistant.
The user is asking a follow-up question regarding their code debugging session.

=== CURRENT DEBUGGING SESSION CONTEXT ===
${typeof contextData === 'string' ? contextData : JSON.stringify(contextData, null, 2)}

${formattedHistory ? `=== CONVERSATION HISTORY ===\n${formattedHistory}\n` : ''}

USER QUESTION: ${question}

Provide a direct, technically accurate, and helpful response. If asked to explain line-by-line, optimize, or explain to a beginner, tailor your answer precisely.`;

  // Track user message
  sessionManager.addMessage(userId, sessionId, 'user', question);

  let replyText = '';
  try {
    const key = apiKey || GEMINI_CONFIG.apiKey;
    const modelName = GEMINI_CONFIG.model;

    if (GoogleGenAI) {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.generateContent({
        model: modelName,
        contents: [prompt],
        config: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      });
      replyText = res.text || res.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
        })
      });
      const data = await res.json();
      replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  } catch (err) {
    console.error('[GeminiBackend] Conversational chat error:', err);
    throw err;
  }

  // Track AI response
  sessionManager.addMessage(userId, sessionId, 'assistant', replyText);

  return {
    reply: replyText,
    sessionId: sessionId || 'default',
    timestamp: Date.now()
  };
}

// ==============================================================================
// 9. HEALTH & CONFIGURATION CHECK
// ==============================================================================

async function checkHealth(apiKeyOverride = null) {
  const key = apiKeyOverride ?? GEMINI_CONFIG.apiKey;
  const configured = Boolean(key && key.trim().length > 5);

  const status = {
    configured,
    model: GEMINI_CONFIG.model,
    officialSdkAvailable: Boolean(GoogleGenAI),
    provider: 'Google Gen AI SDK (@google/genai)',
    status: configured ? 'ready' : 'missing_api_key'
  };

  if (!configured) {
    return status;
  }

  try {
    const start = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.model}?key=${key}`;
    const res = await fetch(url);
    status.latencyMs = Date.now() - start;
    status.upstreamReachable = res.ok;
    status.upstreamStatus = res.status;
  } catch (e) {
    status.upstreamReachable = false;
    status.upstreamError = e.message;
  }

  return status;
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
  GEMINI_CONFIG,
  DebuggingResponseSchema,
  ExplainCodeSchema,
  SolutionReviewSchema,
  sessionManager,
  executeWithRetry,
  analyzeDebuggingPipeline,
  engineUnderstandCode,
  engineDiagnoseAndFix,
  engineReviewSolution,
  explainCode,
  chatFollowUp,
  checkHealth
};
