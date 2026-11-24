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
      expectedOutput = "",
      actualOutput = "",
      language = "Auto-Detect",
      mode = "beginner",
      staticDiagnostics = [],
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
Examine the following code carefully. Prioritize correctness and technical accuracy over speed.

Mode: ${mode === "advanced" ? "ADVANCED (use precise technical terminology, time/space complexity, AST concepts)" : "BEGINNER (plain step-by-step explanations, define any technical terms)"}
Language: ${language}

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

      const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: explainPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        throw new Error(`Gemini API error: ${await geminiRes.text()}`);
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      return new Response(rawText, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action 4: Master Debugging Engine (Accuracy Overhaul Pipeline)
    const diagnosticsContext = Array.isArray(staticDiagnostics) && staticDiagnostics.length > 0
      ? `Static Analysis Pre-check Evidence:\n${JSON.stringify(staticDiagnostics, null, 2)}`
      : "";

    const debugPrompt = `You are DEBUGX, an expert compiler engineer, systems architect, and AI debugging engine.
Your highest objective is CORRECTNESS over response speed.
Never generate a code correction before fully understanding the actual problem.

=== INPUT DATA ===
Language: ${language}
Mode: ${mode.toUpperCase()} (BEGINNER: step-by-step, plain terms, define jargon; ADVANCED: precise technical terms, execution flow, AST details, memory/complexity)
${code ? `Source Code:\n\`\`\`${language}\n${code}\n\`\`\`` : "Source Code: [EMPTY/NOT PROVIDED]"}
${errorMessage ? `Error Message:\n${errorMessage}` : ""}
${stackTrace ? `Stack Trace:\n${stackTrace}` : ""}
${expectedBehavior ? `User Expected Behavior:\n${expectedBehavior}` : ""}
${expectedOutput ? `Expected Output:\n${expectedOutput}` : ""}
${actualOutput ? `Actual Output:\n${actualOutput}` : ""}
${diagnosticsContext}
${screenshotBase64 ? "A screenshot or camera image has been attached." : ""}

=== CRITICAL RULES ===
1. CORRECTNESS IS PARAMOUNT: Never hallucinate code, line numbers, or variable names.
2. EVIDENCE-DRIVEN: Base root cause explanations strictly on concrete evidence from the code, error message, or static diagnostics.
3. SURGICAL CORRECTION: Generate the smallest appropriate fix. Preserve original program structure, indentation, and unrelated functions. Do not rewrite working code.
4. UNCERTAINTY HANDLING: If the input is incomplete or insufficient, set status to "needs_more_information" and list exactly what is missing.
5. EXECUTION HONESTY: Never claim that code was executed unless an execution tool ran it. Set verification_status to "not_run" and verification_details to "Not execution-verified. Statically verified against root cause."
6. CLEAN CODE: If the code is correct and has no errors, set error_type to "Clean Code / No Error Detected", confidence to 1.0, and keep corrected_code identical to original_code.

Return ONLY a strictly valid JSON response adhering to this schema:
{
  "status": "diagnosed", // or "needs_more_information"
  "language": "${language}",
  "error_type": "Exact Error Category (e.g. ZeroDivisionError, IndexError, SyntaxError, NullPointerException, Logic Error, Clean Code / No Error Detected)",
  "error_summary": "Concise 1-2 sentence description of the exact defect",
  "confidence": 0.95,
  "evidence": [
    "Concrete quote or observation from the user's code or error trace"
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
    "Specific minimal change made to fix the root cause"
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
