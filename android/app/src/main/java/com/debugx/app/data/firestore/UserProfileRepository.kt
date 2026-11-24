package com.debugx.app.data.firestore

import com.debugx.app.data.model.DebugResponse
import com.debugx.app.data.model.UserProfile
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UserProfileRepository {
    private val firestore: FirebaseFirestore by lazy {
        FirebaseFirestore.getInstance()
    }

    suspend fun syncProfile(user: UserProfile): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val userRef = firestore.collection("users").document(user.uid)
            val data = hashMapOf(
                "uid" to user.uid,
                "displayName" to user.displayName,
                "email" to user.email,
                "photoURL" to user.photoURL,
                "lastLoginAt" to FieldValue.serverTimestamp(),
                "preferredLanguage" to user.preferredLanguage,
                "explanationMode" to user.explanationMode,
                "onboardingCompleted" to user.onboardingCompleted,
                "accountStatus" to user.accountStatus
            )
            // Use set with merge so createdAt is preserved if existing
            userRef.set(data, SetOptions.merge())
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun saveDebuggingSession(userId: String, session: DebugResponse): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val sessionId = "sess_${System.currentTimeMillis()}"
            val docRef = firestore.collection("users")
                .document(userId)
                .collection("debuggingHistory")
                .document(sessionId)

            val data = hashMapOf(
                "sessionId" to sessionId,
                "language" to session.language,
                "errorTitle" to session.errorTitle,
                "errorCategory" to session.errorCategory,
                "errorSummary" to session.summary,
                "correctedCode" to session.correctedCode,
                "createdAt" to FieldValue.serverTimestamp(),
                "isSaved" to true
            )

            docRef.set(data)
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun deleteUserData(userId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            firestore.collection("users").document(userId).delete()
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
}
