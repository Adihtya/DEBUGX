package com.debugx.app.data.supabase

/**
 * Supabase configuration for DebugX Android
 * Live Project: kcbfwckcolewpfanunez
 */
object SupabaseConfig {
    const val SUPABASE_URL = "https://kcbfwckcolewpfanunez.supabase.co"
    const val SUPABASE_KEY = "sb_publishable_kyfpQhHfd3_XSvAUqjrR6Q_UQblvP-g"
    const val STORAGE_BUCKET = "debugx-uploads"
    const val EDGE_FUNCTION_ANALYZE = "$SUPABASE_URL/functions/v1/analyze-code"
}
