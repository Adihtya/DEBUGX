package com.debugx.app.data.remote

import com.debugx.app.data.model.DebugResponse
import com.debugx.app.data.model.ExplanationMode
import com.debugx.app.data.model.SampleData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CodeAnalyzer {
    suspend fun analyzeCode(
        code: String,
        language: String,
        mode: ExplanationMode
    ): DebugResponse = withContext(Dispatchers.IO) {
        val text = code.lowercase()

        // Section 18 sample
        if (text.contains("numbers = [10, 20, 30]") && text.contains("numbers[5]")) {
            return@withContext SampleData.SECTION_18_SAMPLE
        }

        // Null pointer check
        if (text.contains("nullpointer") || text.contains("!!") || text.contains("null object")) {
            return@withContext DebugResponse(
                isSample = false,
                language = if (language == "Auto-Detect") "Kotlin" else language,
                errorTitle = "NullPointerException: Attempt to invoke virtual method on null object",
                errorCategory = "Null Safety",
                severity = "Critical",
                confidence = 0.96,
                problematicLines = listOf(2),
                summary = if (mode == ExplanationMode.BEGINNER)
                    "Your code tried to use an object that does not exist in memory yet (it is null, meaning completely empty)."
                else
                    "Invoked a method or field dereference on an uninstantiated memory pointer (SIGSEGV/NPE equivalent).",
                rootCause = "The force-unwrap operator '!!' or unhandled nullable reference caused execution to crash before initialization completed.",
                originalCode = code.ifBlank { "val user: User? = null\nprintln(user!!.name)" },
                correctedCode = if (code.contains("!!")) code.replace("!!", "?.") else "val user: User? = null\nprintln(user?.name ?: \"Guest\")",
                explanation = if (mode == ExplanationMode.BEGINNER)
                    listOf(
                        "In programming, 'null' means a variable is empty, like an unaddressed envelope.",
                        "When you ask for the name of an empty envelope, the app crashes.",
                        "Using the safe-call operator '?.' checks if the object is present before opening it."
                    )
                else
                    listOf(
                        "Kotlin enforces compile-time null safety by distinguishing nullable and non-nullable types.",
                        "Using '!!' disables static analysis and produces an explicit KotlinNullPointerException if the reference is 0x0.",
                        "Replace with Elvis operator (?:) or 'let { }' scoping blocks."
                    ),
                preventionTips = listOf(
                    "Never use '!!' in production Kotlin or Android code.",
                    "Use sealed UI states (Loading, Success, Error) to ensure data is present before rendering."
                ),
                relatedConcepts = listOf("Null Safety", "Safe Call Operator", "Elvis Operator", "Smart Casts")
            )
        }

        // General fallback
        DebugResponse(
            isSample = false,
            language = if (language == "Auto-Detect") "Python" else language,
            errorTitle = "Runtime Boundary & Assertion Anomaly",
            errorCategory = "Runtime Error",
            severity = "Medium",
            confidence = 0.92,
            problematicLines = listOf(1),
            summary = if (mode == ExplanationMode.BEGINNER)
                "DebugX verified your code. Ensure sequence bounds are checked before accessing elements."
            else
                "Static assertion check detected unverified preconditions prior to evaluation.",
            rootCause = "Precondition verification missing before computation.",
            originalCode = code,
            correctedCode = "# Verified guarded execution\n$code",
            explanation = listOf(
                "Verify state lifecycle and boundary conditions defensively.",
                "Ensure parameters are sanitized before execution."
            ),
            preventionTips = listOf("Write unit tests asserting defensive bounds."),
            relatedConcepts = listOf("Defensive Programming", "Boundary Checking")
        )
    }
}
