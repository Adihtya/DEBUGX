package com.debugx.app.viewmodel

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.debugx.app.data.model.ChatMessage
import com.debugx.app.data.model.DebugResponse
import com.debugx.app.data.model.ExplanationMode
import com.debugx.app.data.model.SampleData
import com.debugx.app.data.repository.DebugRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DebugUiState(
    val codeInput: String = "numbers = [10, 20, 30]\nprint(numbers[5])",
    val selectedLanguage: String = "Python",
    val screenshotBitmap: Bitmap? = null,
    val explanationMode: ExplanationMode = ExplanationMode.BEGINNER,
    val isLoading: Boolean = false,
    val loadingStage: String = "",
    val loadingProgress: Float = 0f,
    val analysisResult: DebugResponse? = SampleData.SECTION_18_SAMPLE,
    val errorMessage: String? = null
)

class DebugViewModel(
    private val repository: DebugRepository = DebugRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(DebugUiState())
    val uiState: StateFlow<DebugUiState> = _uiState.asStateFlow()

    val history = repository.history
    val currentSession = repository.currentSession

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                isUser = false,
                text = "Hello! I have the context of your debugging analysis. Ask me to explain line by line, optimize, or provide practice problems!"
            )
        )
    )
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    fun updateCode(code: String) {
        _uiState.value = _uiState.value.copy(codeInput = code)
    }

    fun updateLanguage(language: String) {
        _uiState.value = _uiState.value.copy(selectedLanguage = language)
    }

    fun updateScreenshot(bitmap: Bitmap?) {
        _uiState.value = _uiState.value.copy(screenshotBitmap = bitmap)
    }

    fun setExplanationMode(mode: ExplanationMode) {
        _uiState.value = _uiState.value.copy(explanationMode = mode)
    }

    fun setApiKey(key: String) {
        repository.setApiKey(key)
    }

    fun loadSection18Sample() {
        _uiState.value = _uiState.value.copy(
            codeInput = SampleData.SECTION_18_SAMPLE.originalCode,
            selectedLanguage = "Python",
            screenshotBitmap = null,
            analysisResult = SampleData.SECTION_18_SAMPLE
        )
    }

    fun analyseCode(onSuccess: () -> Unit) {
        val state = _uiState.value
        if (state.codeInput.isBlank() && state.screenshotBitmap == null) {
            _uiState.value = state.copy(errorMessage = "Please enter code or upload a screenshot.")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(
                isLoading = true,
                loadingStage = "Extracting code and error traces...",
                loadingProgress = 0.3f,
                errorMessage = null
            )
            delay(500)

            _uiState.value = _uiState.value.copy(
                loadingStage = "Consulting Gemini AI Debugging Engine...",
                loadingProgress = 0.7f
            )

            try {
                val result = repository.analyseCode(
                    code = state.codeInput,
                    screenshot = state.screenshotBitmap,
                    language = state.selectedLanguage,
                    mode = state.explanationMode
                )

                _uiState.value = _uiState.value.copy(
                    loadingStage = "Synthesizing fix & prevention tips...",
                    loadingProgress = 1.0f
                )
                delay(400)

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    analysisResult = result
                )
                onSuccess()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.localizedMessage ?: "Failed to analyze code."
                )
            }
        }
    }

    fun sendChatMessage(question: String) {
        if (question.isBlank()) return
        val current = _chatMessages.value
        _chatMessages.value = current + ChatMessage(isUser = true, text = question)

        viewModelScope.launch {
            delay(600)
            val reply = generateContextualChatReply(question)
            _chatMessages.value = _chatMessages.value + ChatMessage(isUser = false, text = reply)
        }
    }

    private fun generateContextualChatReply(question: String): String {
        val q = question.lowercase()
        val err = _uiState.value.analysisResult?.errorTitle ?: "Error"
        val lang = _uiState.value.analysisResult?.language ?: "Python"

        return when {
            q.contains("line by line") || q.contains("explain") ->
                "Here is the breakdown for your $lang code:\n1. Sequence allocation occurs.\n2. The line triggering $err accesses memory beyond capacity.\n3. The guard check prevents the crash."
            q.contains("another way") || q.contains("alternative") ->
                "Alternative approach: Wrap in a try-except block, or iterate directly using 'for item in items:' without manual indices."
            q.contains("optimise") ->
                "Bounds checking with 'len() > index' costs O(1) cycles. Exception unwinding is considerably more expensive."
            else ->
                "Regarding your question on $err: Ensure defensive validation guards are placed before accessing dynamic indices."
        }
    }

    fun selectHistoryItem(item: DebugResponse, onNavigate: () -> Unit) {
        repository.setCurrentSession(item)
        _uiState.value = _uiState.value.copy(analysisResult = item)
        onNavigate()
    }

    fun deleteHistoryItem(item: DebugResponse) {
        repository.deleteHistoryItem(item)
    }

    fun clearHistory() {
        repository.clearHistory()
    }
}
