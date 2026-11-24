package com.debugx.app.data.remote

import com.debugx.app.data.model.ChatMessage
import com.debugx.app.data.model.DebugResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AIChatService {
    suspend fun getReply(
        question: String,
        session: DebugResponse?
    ): ChatMessage = withContext(Dispatchers.IO) {
        val q = question.lowercase()
        val replyText = when {
            q.contains("why") || q.contains("cause") -> {
                "The root cause is that **${session?.rootCause ?: "an boundary or type invariant was violated"}**. Ensuring proper bounds checking prevents this issue."
            }
            q.contains("optimize") || q.contains("faster") || q.contains("complexity") -> {
                "To optimize this further:\n1. Minimize unnecessary allocations.\n2. Consider hash structures for O(1) lookups.\n3. Cache repeated subcomputations."
            }
            q.contains("alternative") || q.contains("another way") -> {
                "An alternative pattern:\n```${session?.language?.lowercase() ?: "code"}\n${session?.correctedCode ?: ""}\n```"
            }
            else -> {
                "For **${session?.errorTitle ?: "this error"}**, write a unit test asserting defensive boundary behaviors to ensure regressions don't recur."
            }
        }
        ChatMessage(isUser = false, text = replyText)
    }
}
