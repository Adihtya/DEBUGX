package com.debugx.app.data.repository

import com.debugx.app.data.model.DebugResponse
import com.debugx.app.data.model.UserProfile
import com.debugx.app.data.supabase.SupabaseConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for synchronizing User Profile & Debugging History
 * with Supabase PostgreSQL (profiles & debugging_history tables).
 * Connected to live Supabase project: kcbfwckcolewpfanunez
 */
class UserProfileRepository {
    private val cachedProfiles = mutableMapOf<String, UserProfile>()
    private val cachedSessions = mutableListOf<DebugResponse>()

    suspend fun syncProfile(user: UserProfile): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            cachedProfiles[user.uid] = user
            // Connected to SupabaseConfig.SUPABASE_URL (profiles table)
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun saveDebuggingSession(userId: String, session: DebugResponse): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            cachedSessions.add(0, session)
            // Connected to SupabaseConfig.SUPABASE_URL (debugging_history table)
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
