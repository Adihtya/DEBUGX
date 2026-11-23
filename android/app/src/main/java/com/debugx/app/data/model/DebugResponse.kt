package com.debugx.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Section 14: Structured AI Response Model
 */
data class DebugResponse(
    @SerializedName("language")
    val language: String = "Python",

    @SerializedName("error_title")
    val errorTitle: String = "IndexError: list index out of range",

    @SerializedName("error_category")
    val errorCategory: String = "Runtime Error",

    @SerializedName("severity")
    val severity: String = "Medium",

    @SerializedName("confidence")
    val confidence: Double = 0.95,

    @SerializedName("problematic_lines")
    val problematicLines: List<Int> = listOf(2),

    @SerializedName("summary")
    val summary: String = "The code is trying to access an element that does not exist.",

    @SerializedName("root_cause")
    val rootCause: String = "The list contains fewer elements than the index being accessed.",

    @SerializedName("original_code")
    val originalCode: String = "",

    @SerializedName("corrected_code")
    val correctedCode: String = "",

    @SerializedName("explanation")
    val explanation: List<String> = emptyList(),

    @SerializedName("prevention_tips")
    val preventionTips: List<String> = emptyList(),

    @SerializedName("related_concepts")
    val relatedConcepts: List<String> = emptyList(),

    @SerializedName("needs_more_information")
    val needsMoreInformation: Boolean = false,

    val isSample: Boolean = false,
    val timestamp: String = "Just now"
)

enum class ExplanationMode {
    BEGINNER,
    ADVANCED
}

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val isUser: Boolean,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)
