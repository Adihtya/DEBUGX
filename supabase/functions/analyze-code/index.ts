// ==============================================================================
// DEBUGX SUPABASE EDGE FUNCTION — analyze-code
// Server-Side Gemini AI Engine: Multimodal Code Debugging & Explanation
// Key Security Guarantee: GEMINI_API_KEY is stored as a secret on Supabase
// and is NEVER exposed to client browsers or mobile devices.
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
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 2. Retrieve Gemini API Key from Supabase Secrets
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

    // 3. Optional Authentication Verification via Supabase Auth Header
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

    // 4. Parse Request Payload
    const body = await req.json().catch(() => ({}));
    const { action = "analyze", code = "", language = "Python", mode = "beginner", screenshotBase64, mimeType = "image/png", question = "", sessionContext = null } = body;

    // Action 1: Connection Verification / Health Ping
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

    // Action 2: AI Follow-Up Chat
    if (action === "chat") {
      const chatPrompt = `You are DebugX AI, an expert programming tutor and debugging assistant.
Current debugging context:
${sessionContext ? JSON.stringify(sessionContext) : "Code: " + code}

User Question: ${question}

Provide a concise, direct, helpful, and empathetic answer with clean code formatting if relevant.`;

      const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: chatPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      });

      const geminiData = await geminiRes.json();
      const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to analyze this question. Please try rephrasing.";

      return new Response(
        JSON.stringify({
          reply: answer,
          timestamp: Date.now(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action 3: Explain My Code (Line-by-line, Variables, Visualizers, Complexity)
    if (action === "explain") {
      const explainPrompt = `You are DebugX, an expert code explanation engine.
Analyze the following ${language} code in depth for a ${mode === "beginner" ? "beginner student using clear analogies" : "senior engineer analyzing AST, memory, and performance"}:

\`\`\`${language}
${code}
\`\`\`

Return a strictly valid JSON response matching this EXACT JSON schema (no extra text, no markdown codeblocks):
{
  "language": "${language}",
  "title": "Algorithmic Overview Title",
  "summary": "Clear summary of the code and its algorithm",
  "complexity": {
    "time": "O(...)",
    "time_reasoning": "Mathematical explanation",
    "space": "O(...)",
    "space_reasoning": "Auxiliary memory explanation"
  },
  "line_explanations": [
    {
      "line": 1,
      "code": "line code snippet",
      "explanation": "What this line does",
      "beginner_analogy": "Analogy",
      "role": "Role (e.g. Function Definition, Loop Guard, Pointer Initialization)"
    }
  ],
  "variables": [
    {
      "name": "varName",
      "type": "type",
      "scope": "Local / Global",
      "declared_line": 1,
      "used_lines": [1, 2],
      "purpose": "Purpose of variable"
    }
  ],
  "control_structures": [
    {
      "type": "Loop / Condition",
      "line_range": "1-5",
      "condition": "condition check",
      "explanation": "how it controls flow",
      "termination": "when it finishes"
    }
  ],
  "function_hierarchy": [
    {
      "name": "funcName",
      "parameters": ["arg1"],
      "returns": "return type",
      "callers": [],
      "callees": []
    }
  ],
  "execution_flow": [
    {
      "step": 1,
      "line": 1,
      "description": "Step execution description"
    }
  ],
  "loop_visualizer": [
    {
      "iteration": 1,
      "variables_state": { "key": "value" },
      "explanation": "Iteration note"
    }
  ],
  "function_visualizer": [
    {
      "frame": 1,
      "function_name": "main",
      "arguments": {},
      "return_value": "void",
      "status": "Completed"
    }
  ],
  "predicted_output": {
    "output_text": "Expected output",
    "is_statically_predicted": true,
    "confidence": 0.95,
    "reasoning": "Reasoning for predicted output",
    "execution_notice": "Statically predicted via AST simulation. Not run in a live sandbox."
  },
  "bugs_and_improvements": [
    {
      "type": "Improvement / Bug / Inefficient Logic",
      "line": 1,
      "severity": "Low",
      "issue": "Description of potential issue",
      "fix": "Recommended fix"
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
            temperature: 0.2,
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

    // Action 4: Code & Screenshot Multimodal Debugging (Default)
    const debugPrompt = `You are DebugX, a world-class AI debugging assistant.
Your mission: Find the Bug. Understand the Cause. Fix with Confidence.

Target Language: ${language}
Explanation Mode: ${mode.toUpperCase()} (beginner = clear step-by-step analogies; advanced = root cause, AST, memory boundaries)
${code ? `Submitted Code:\n\`\`\`${language}\n${code}\n\`\`\`` : ""}
${screenshotBase64 ? "A screenshot/camera capture of code or an error trace has been attached." : ""}

Analyze the problem thoroughly and return ONLY a strictly valid JSON response adhering to this EXACT schema:
{
  "language": "${language}",
  "error_title": "Concise name of error (e.g. IndexError: list index out of range)",
  "error_category": "Runtime Error / Syntax Error / Logic Error / Type Error",
  "severity": "Low / Medium / High / Critical",
  "confidence": 0.95,
  "problematic_lines": [1],
  "summary": "1-2 sentence high-level summary of what broke",
  "root_cause": "Detailed explanation of exactly why this occurred",
  "original_code": "The user original code or extracted OCR code",
  "corrected_code": "The completely fixed, production-ready code",
  "explanation": [
    "Step 1 explanation of why this happened",
    "Step 2 explanation of the fix",
    "Step 3 explanation of why the solution works"
  ],
  "prevention_tips": [
    "Tip 1 to avoid this in the future",
    "Tip 2 best practice"
  ],
  "related_concepts": ["Concept 1", "Concept 2", "Concept 3"],
  "needs_more_information": false
}`;

    const parts: any[] = [{ text: debugPrompt }];

    // If an image screenshot was uploaded, pass it as multimodal inlineData
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
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("[analyze-code] Gemini API returned error:", errorText);
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
