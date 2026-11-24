package com.debugx.app.data.repository

import android.graphics.Bitmap
import com.debugx.app.data.model.*
import com.debugx.app.data.remote.GeminiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class DebugRepository(
    val geminiService: GeminiService = GeminiService(),
    val userProfileRepository: UserProfileRepository = UserProfileRepository()
) {
    private val _history = MutableStateFlow<List<DebugResponse>>(SampleData.INITIAL_HISTORY)
    val history: StateFlow<List<DebugResponse>> = _history.asStateFlow()

    private val _currentSession = MutableStateFlow<DebugResponse?>(SampleData.SECTION_18_SAMPLE)
    val currentSession: StateFlow<DebugResponse?> = _currentSession.asStateFlow()

    private val _currentExplanation = MutableStateFlow<CodeExplanationResponse?>(ExplainSampleData.BINARY_SEARCH_SAMPLE)
    val currentExplanation: StateFlow<CodeExplanationResponse?> = _currentExplanation.asStateFlow()

    val aiConnectionState = geminiService.connectionState
    val aiLatencyMs = geminiService.latencyMs

    suspend fun verifyAiConnection(): Result<Long> {
        return geminiService.verifyConnection()
    }

    fun setApiKey(key: String) {
        geminiService.setApiKey(key)
    }

    suspend fun analyseCode(
        code: String,
        screenshot: Bitmap?,
        language: String,
        mode: ExplanationMode,
        userId: String? = null
    ): DebugResponse {
        val response = geminiService.analyse(code, screenshot, language, mode)
        _currentSession.value = response
        _history.value = listOf(response) + _history.value

        // Automatically sync to Supabase PostgreSQL if user is authenticated
        if (!userId.isNullOrEmpty()) {
            userProfileRepository.saveDebuggingSession(userId, response)
        }
        return response
    }

    suspend fun explainCode(
        code: String,
        language: String,
        mode: ExplanationMode
    ): CodeExplanationResponse {
        val response = geminiService.explainCode(code, language, mode)
        _currentExplanation.value = response
        return response
    }

    suspend fun askChat(question: String): ChatMessage {
        return geminiService.askChat(question, _currentSession.value)
    }

    fun setCurrentExplanation(explanation: CodeExplanationResponse) {
        _currentExplanation.value = explanation
    }

    fun setCurrentSession(session: DebugResponse) {
        _currentSession.value = session
    }

    fun deleteHistoryItem(item: DebugResponse) {
        _history.value = _history.value.filter { it != item }
    }

    fun clearHistory() {
        _history.value = emptyList()
    }
}
