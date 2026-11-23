package com.debugx.app.data.repository

import android.graphics.Bitmap
import com.debugx.app.data.model.DebugResponse
import com.debugx.app.data.model.ExplanationMode
import com.debugx.app.data.model.SampleData
import com.debugx.app.data.remote.GeminiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class DebugRepository(
    private val geminiService: GeminiService = GeminiService()
) {
    private val _history = MutableStateFlow<List<DebugResponse>>(SampleData.INITIAL_HISTORY)
    val history: StateFlow<List<DebugResponse>> = _history.asStateFlow()

    private val _currentSession = MutableStateFlow<DebugResponse?>(SampleData.SECTION_18_SAMPLE)
    val currentSession: StateFlow<DebugResponse?> = _currentSession.asStateFlow()

    fun setApiKey(key: String) {
        geminiService.setApiKey(key)
    }

    suspend fun analyseCode(
        code: String,
        screenshot: Bitmap?,
        language: String,
        mode: ExplanationMode
    ): DebugResponse {
        val response = geminiService.analyse(code, screenshot, language, mode)
        _currentSession.value = response
        _history.value = listOf(response) + _history.value
        return response
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
