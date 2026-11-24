package com.debugx.app.viewmodel

import android.app.Application
import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.debugx.app.data.auth.AuthManager
import com.debugx.app.data.model.*
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

enum class ExplainTab {
    LINE_BY_LINE,
    VARIABLES,
    VISUALIZERS,
    EXECUTION_FLOW,
    PREDICTED_OUTPUT,
    BUGS_OPTIMIZATION,
    ASK_AI
}

data class ExplainUiState(
    val codeInput: String = "def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
    val selectedLanguage: String = "Python",
    val explanationMode: ExplanationMode = ExplanationMode.BEGINNER,
    val selectedLine: Int? = 1,
    val selectedVariable: String? = null,
    val isLoading: Boolean = false,
    val loadingStage: String = "",
    val explanationResult: CodeExplanationResponse? = ExplainSampleData.BINARY_SEARCH_SAMPLE,
    val activeTab: ExplainTab = ExplainTab.LINE_BY_LINE,
    val followUpQuestions: List<ChatMessage> = listOf(
        ChatMessage(
            isUser = false,
            text = "I've analyzed your code. Ask me any question about its logic, runtime mechanics, memory usage, or alternative implementations!"
        )
    ),
    val errorMessage: String? = null
)

class DebugViewModel(
    application: Application
) : AndroidViewModel(application) {

    private val authManager = AuthManager(application.applicationContext)
    private val repository = DebugRepository()

    val authState: StateFlow<AuthState> = authManager.authState
    val currentUser: StateFlow<UserProfile?> = authManager.currentUser
    val aiConnectionState: StateFlow<AiConnectionState> = repository.aiConnectionState
    val aiLatencyMs: StateFlow<Long> = repository.aiLatencyMs

    private val _uiState = MutableStateFlow(DebugUiState())
    val uiState: StateFlow<DebugUiState> = _uiState.asStateFlow()

    private val _explainUiState = MutableStateFlow(ExplainUiState())
    val explainUiState: StateFlow<ExplainUiState> = _explainUiState.asStateFlow()

    val history = repository.history
    val currentSession = repository.currentSession
    val currentExplanation = repository.currentExplanation

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                isUser = false,
                text = "Hello! I have the context of your debugging analysis. Ask me to explain line by line, optimize, or provide practice problems!"
            )
        )
    )
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    // -------------------------------------------------------------
    // Authentication & Profile Actions
    // -------------------------------------------------------------
    fun signInWithGoogle(activityContext: Context) {
        viewModelScope.launch {
            val result = authManager.signInWithGoogle(activityContext)
            result.onSuccess { user ->
                // Sync profile to Supabase PostgreSQL
                repository.userProfileRepository.syncProfile(user)
                // Automatically verify AI Logic connection
                repository.verifyAiConnection()
            }
        }
    }

    fun signInAsDemo() {
        viewModelScope.launch {
            val result = authManager.signInAsDemo()
            result.onSuccess { user ->
                repository.userProfileRepository.syncProfile(user)
                repository.verifyAiConnection()
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authManager.signOut()
        }
    }

    fun deleteAccount() {
        viewModelScope.launch {
            val uid = currentUser.value?.uid
            if (!uid.isNullOrEmpty()) {
                repository.userProfileRepository.deleteUserData(uid)
            }
            authManager.deleteAccount()
        }
    }

    fun retryAiConnection() {
        viewModelScope.launch {
            repository.verifyAiConnection()
        }
    }

    // -------------------------------------------------------------
    // Debugging Actions
    // -------------------------------------------------------------
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
                    mode = state.explanationMode,
                    userId = currentUser.value?.uid
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
            delay(400)
            val reply = repository.askChat(question)
            _chatMessages.value = _chatMessages.value + reply
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

    // -------------------------------------------------------------
    // Explain My Code Actions
    // -------------------------------------------------------------
    fun updateExplainCode(code: String) {
        _explainUiState.value = _explainUiState.value.copy(codeInput = code)
    }

    fun updateExplainLanguage(language: String) {
        _explainUiState.value = _explainUiState.value.copy(selectedLanguage = language)
    }

    fun setExplainMode(mode: ExplanationMode) {
        _explainUiState.value = _explainUiState.value.copy(explanationMode = mode)
    }

    fun selectExplainLine(line: Int?) {
        _explainUiState.value = _explainUiState.value.copy(selectedLine = line)
    }

    fun selectExplainVariable(variableName: String?) {
        _explainUiState.value = _explainUiState.value.copy(selectedVariable = variableName)
    }

    fun setExplainTab(tab: ExplainTab) {
        _explainUiState.value = _explainUiState.value.copy(activeTab = tab)
    }

    fun loadBinarySearchSample() {
        _explainUiState.value = _explainUiState.value.copy(
            codeInput = "def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
            selectedLanguage = "Python",
            explanationResult = ExplainSampleData.BINARY_SEARCH_SAMPLE,
            selectedLine = 1,
            selectedVariable = null
        )
    }

    fun explainCode(onSuccess: () -> Unit = {}) {
        val state = _explainUiState.value
        if (state.codeInput.isBlank()) {
            _explainUiState.value = state.copy(errorMessage = "Please enter or upload code to explain.")
            return
        }

        viewModelScope.launch {
            _explainUiState.value = state.copy(
                isLoading = true,
                loadingStage = "Analyzing AST structure & symbols...",
                errorMessage = null
            )
            delay(400)
            _explainUiState.value = _explainUiState.value.copy(
                loadingStage = "Generating line-by-line & complexity breakdown..."
            )

            try {
                val result = repository.explainCode(
                    code = state.codeInput,
                    language = state.selectedLanguage,
                    mode = state.explanationMode
                )
                _explainUiState.value = _explainUiState.value.copy(
                    isLoading = false,
                    explanationResult = result
                )
                onSuccess()
            } catch (e: Exception) {
                _explainUiState.value = _explainUiState.value.copy(
                    isLoading = false,
                    errorMessage = e.localizedMessage ?: "Failed to explain code."
                )
            }
        }
    }

    fun sendExplainQuestion(question: String) {
        sendExplainFollowUp(question)
    }

    fun sendExplainFollowUp(question: String) {
        if (question.isBlank()) return
        val current = _explainUiState.value.followUpQuestions
        _explainUiState.value = _explainUiState.value.copy(
            followUpQuestions = current + ChatMessage(isUser = true, text = question)
        )

        viewModelScope.launch {
            delay(500)
            val replyText = "For this algorithm: Always ensure boundary conditions low <= high are strictly maintained."
            _explainUiState.value = _explainUiState.value.copy(
                followUpQuestions = _explainUiState.value.followUpQuestions + ChatMessage(isUser = false, text = replyText)
            )
        }
    }
}
