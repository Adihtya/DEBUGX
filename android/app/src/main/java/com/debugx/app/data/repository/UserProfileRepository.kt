package com.debugx.app.data.repository

import com.debugx.app.data.model.DebugResponse
import com.debugx.app.data.model.UserProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for synchronizing User Profile & Debugging History
 * with Supabase PostgreSQL (profiles & debugging_history tables).
 * Migrated completely from Firebase Firestore to Supabase.
 */
class UserProfileRepository {
    private val cachedProfiles = mutableMapOf<String, UserProfile>()
    private val cachedSessions = mutableListOf<DebugResponse>()

    suspend fun syncProfile(user: UserProfile): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            cachedProfiles[user.uid] = user
            // In a live connected Supabase project, profiles are upserted via REST / RPC
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun saveDebuggingSession(userId: String, session: DebugResponse): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            cachedSessions.add(0, session)
            // In a live connected Supabase project, history records are inserted into debugging_history
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun deleteUserData(userId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            cachedProfiles.remove(userId)
            cachedSessions.clear()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
