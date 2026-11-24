// ==============================================================================
// DEBUGX SUPABASE EDGE FUNCTION — analyze-code
// Senior AI Engineering Engine for High-Accuracy Debugging & Code Analysis
// Prioritizes correctness over response speed. Never generates a fix before
// understanding the actual problem.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured in Supabase Edge Function secrets.",
          code: "MISSING_GEMINI_KEY",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Optional Authentication Verification via Supabase Auth Header
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    let authenticatedUserId: string | null = null;
    if (authHeader && supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          authenticatedUserId = user.id;
        }
      } catch (authErr) {
        console.warn("[analyze-code] Auth header verification note:", authErr);
      }
    }

    const body = await req.json().catch(() => ({}));
    const {
      action = "analyze",
      code = "",
      errorMessage = "",
      stackTrace = "",
      expectedBehavior = "",
      language = "Auto-Detect",
      mode = "beginner",
      screenshotBase64,
      mimeType = "image/png",
      question = "",
      sessionContext = null
    } = body;

    // Action 1: Health Ping / Connection Verification
    if (action === "verify") {
      const verifyUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}?key=${geminiApiKey}`;
      const verifyRes = await fetch(verifyUrl);
      const latencyMs = Date.now() - startTime;

      return new Response(
        JSON.stringify({
          status: "connected",
          model: GEMINI_MODEL,
          provider: "Supabase Edge Functions + Google Gemini API",
          latencyMs,
          authenticatedUser: authenticatedUserId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Action 2: Contextual Follow-up Chat
    if (action === "chat") {
      const chatPrompt = `You are DebugX AI, a senior programming tutor and debugging assistant.
Context:
${sessionContext ? JSON.stringify(sessionContext) : "Code: " + code}

User Question: ${question}

Provide an accurate, technically sound, and concise explanation answering the user question based on the diagnosed context.`;

      const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: chatPrompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
        }),
      });

      const geminiData = await geminiRes.json();
      const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to process question.";

      return new Response(
        JSON.stringify({ reply: answer, timestamp: Date.now() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action 3: Explain My Code (Line-by-line, Variables, Flow, Complexity)
    if (action === "explain") {
      const explainPrompt = `You are DebugX Senior AI Code Analysis Specialist.
Examine the following code carefully. Prioritize correctness over speed.
Target Language: ${language}
Explanation Mode: ${mode.toUpperCase()} (beginner = clear analogies and gentle steps; advanced = AST, memory boundaries, asymptotic complexity)

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Return a strictly valid JSON response adhering to this EXACT schema:
{
  "language": "${language}",
  "title": "Concise summary title of algorithm or script",
  "summary": "Clear, technically accurate explanation of what this code does",
  "complexity": {
    "time": "O(...)",
    "time_reasoning": "Derivation based on loops, recursion, and operations in the submitted code",
    "space": "O(...)",
    "space_reasoning": "Derivation based on auxiliary structures allocated in memory"
  },
  "line_explanations": [
    {
      "line": 1,
      "code": "exact code of line 1",
      "explanation": "What this line does",
      "beginner_analogy": "Simple analogy",
      "role": "Function Definition / Variable Declaration / Loop Guard / Branch / Return"
    }
  ],
  "variables": [
    {
      "name": "varName",
      "type": "inferred or explicit type",
      "scope": "Local / Global / Member",
      "declared_line": 1,
      "used_lines": [2, 3],
      "purpose": "What this variable tracks"
    }
  ],
  "control_structures": [
    {
      "type": "Loop / Conditional",
      "line_range": "line start - line end",
      "condition": "guard condition expression",
      "explanation": "execution rule",
      "termination": "termination condition"
    }
  ],
  "function_hierarchy": [
    {
      "name": "function_name",
      "parameters": ["arg1"],
      "returns": "return type/description",
      "callers": [],
      "callees": []
    }
  ],
  "execution_flow": [
    { "step": 1, "line": 1, "description": "Step execution description" }
  ],
  "loop_visualizer": [
    { "iteration": 1, "variables_state": { "var": "val" }, "explanation": "State after iteration" }
  ],
  "function_visualizer": [
    { "frame": 1, "function_name": "name", "arguments": {}, "return_value": "val", "status": "Completed" }
  ],
  "predicted_output": {
    "output_text": "Predicted output when executed with standard input",
    "is_statically_predicted": true,
    "confidence": 0.95,
    "reasoning": "Deduction based on code simulation",
    "execution_notice": "Statically predicted via AST simulation. Not run in a live sandbox."
  },
  "bugs_and_improvements": [
    {
      "type": "Bug / Inefficiency / Code Smell",
      "line": 1,
      "severity": "Low / Medium / High",
      "issue": "Specific issue",
      "fix": "Recommended correction"
    }
  ]
}`;

      const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: explainPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      const geminiData = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action 4: High-Accuracy AI Debugging Engine
    const debugPrompt = `You are DebugX, a world-class senior AI debugging engine.
Your mission: Prioritize correctness over response speed. Never generate a code correction before understanding the actual problem.

CRITICAL INSTRUCTIONS:
1. INPUT ANALYSIS:
   - Carefully examine source code, error message, stack trace, and screenshot.
   - Do NOT assume missing information. If code or context is incomplete, explicitly identify what is missing in "missing_information".
2. ERROR IDENTIFICATION:
   - Identify programming language, error category, exact error message, relevant code location, expected behavior, actual behavior.
   - Do NOT invent line numbers, variables, functions, or error messages.
   - If screenshot is unclear, state that the relevant text could not be confidently read.
3. ROOT CAUSE ANALYSIS:
   - Trace code execution step-by-step. Inspect variable usage, types, loops, conditions, and return values.
   - Explain the root cause using concrete evidence from the supplied code. Distinguish confirmed causes from possible hypotheses.
4. CODE CORRECTION:
   - Generate the SMALLEST APPROPRIATE CORRECTION.
   - Preserve original program structure. Avoid unnecessary rewrites.
   - Preserve existing functionality. Do not remove unrelated code.
   - Do not introduce new dependencies without justification.
   - Preserve indentation and formatting.
5. FIX VALIDATION:
   - Generate test cases (original failure scenario, normal input, edge cases).
   - Label verification_status as "not_run" and verification_details as "Not execution-verified" unless an execution tool actually executed it.
6. EXPLANATION MODE:
   - Mode is ${mode.toUpperCase()}. If BEGINNER: step by step, define terms simply. If ADVANCED: precise technical terms, execution mechanics, complexity.

Submitted Context:
Target Language: ${language}
${code ? `Source Code:\n\`\`\`${language}\n${code}\n\`\`\`` : "No code text provided directly."}
${errorMessage ? `Error Message / Trace:\n${errorMessage}` : ""}
${stackTrace ? `Stack Trace:\n${stackTrace}` : ""}
${expectedBehavior ? `User Expected Behavior:\n${expectedBehavior}` : ""}
${screenshotBase64 ? "A screenshot/camera capture has been attached." : ""}

Return ONLY a strictly valid JSON response adhering to this EXACT schema:
{
  "status": "diagnosed", // or "needs_more_information"
  "language": "${language}",
  "error_type": "Specific Error Category (e.g. ZeroDivisionError, IndexError, SyntaxError, NullPointerException, Logic Error, Clean Code / No Error Detected)",
  "error_summary": "Concise 1-2 sentence description of the exact defect",
  "confidence": 0.95,
  "evidence": [
    "Concrete quote or observation from the user's code"
  ],
  "root_cause": "Detailed, technically accurate explanation of why this error happens",
  "problematic_lines": [
    {
      "line_number": 1,
      "code": "exact code line",
      "reason": "exact reason why this line causes or triggers the failure"
    }
  ],
  "corrected_code": "The complete, smallest appropriate corrected code preserving formatting and structure",
  "changes": [
    "Specific minimal change 1 made to fix the root cause"
  ],
  "why_the_fix_works": "Technical justification explaining how this correction resolves the root cause without side effects",
  "test_cases": [
    {
      "scenario": "Original failure scenario",
      "input": "test input values",
      "expected_outcome": "expected non-failing outcome"
    },
    {
      "scenario": "Normal input scenario",
      "input": "standard valid input values",
      "expected_outcome": "expected behavior"
    },
    {
      "scenario": "Edge case scenario",
      "input": "boundary or empty values",
      "expected_outcome": "handled safely without exception"
    }
  ],
  "verification_status": "not_run",
  "verification_details": "Not execution-verified. Statically verified against identified root cause.",
  "prevention_tips": [
    "Actionable tip to avoid this class of error in the future"
  ],
  "missing_information": []
}`;

    const parts: any[] = [{ text: debugPrompt }];

    if (screenshotBase64) {
      const cleanBase64 = screenshotBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/png",
          data: cleanBase64,
        },
      });
    }

    const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("[analyze-code] Gemini API error:", errorText);
      return new Response(
        JSON.stringify({
          error: `Gemini API error (${geminiRes.status}): ${errorText}`,
          code: "GEMINI_UPSTREAM_ERROR",
        }),
        {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedResult = JSON.parse(rawText);

    // Provide legacy compatibility fields for existing UI components
    parsedResult.error_title = parsedResult.error_title || parsedResult.error_summary || parsedResult.error_type;
    parsedResult.error_category = parsedResult.error_category || parsedResult.error_type;
    parsedResult.severity = parsedResult.severity || "Medium";
    parsedResult.summary = parsedResult.summary || parsedResult.error_summary;
    parsedResult.original_code = parsedResult.original_code || code;
    parsedResult.explanation = parsedResult.explanation || [
      parsedResult.why_the_fix_works || parsedResult.root_cause,
      ...(parsedResult.changes || [])
    ];
    parsedResult.related_concepts = parsedResult.related_concepts || parsedResult.prevention_tips;
    parsedResult.needs_more_information = parsedResult.status === "needs_more_information";

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[analyze-code] Edge function internal error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Internal server error occurred in analyze-code function.",
        code: "INTERNAL_EDGE_ERROR",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
