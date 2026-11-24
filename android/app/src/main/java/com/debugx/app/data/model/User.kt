package com.debugx.app.data.model

data class UserProfile(
    val uid: String = "",
    val displayName: String = "Developer",
    val email: String = "",
    val photoURL: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val lastLoginAt: Long = System.currentTimeMillis(),
    val preferredLanguage: String = "Python",
    val explanationMode: String = "beginner",
    val onboardingCompleted: Boolean = true,
    val accountStatus: String = "active"
)

sealed class AuthState {
    object Unauthenticated : AuthState()
    object Authenticating : AuthState()
    data class Authenticated(val user: UserProfile) : AuthState()
    data class Error(val message: String) : AuthState()
}

enum class AiConnectionState(val label: String) {
    DISCONNECTED("Disconnected"),
    CONNECTING("Connecting..."),
    CONNECTED("Connected & Verified"),
    UNAVAILABLE("Resilient Engine"),
    QUOTA_EXCEEDED("Quota Exceeded")
}
