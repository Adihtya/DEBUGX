/**
// ==============================================================================
// DEBUGX — SUPABASE PREFERENCES SERVICE
// Manages user_preferences table in Supabase PostgreSQL
// ==============================================================================
*/

class PreferencesService {
  async getPreferences(userId) {
    const client = window.supabaseManager?.getClient();
    if (!client || !window.supabaseManager?.isLiveConnected) {
      return { explanation_mode: 'beginner', preferred_language: 'Python', theme: 'dark' };
    }

    try {
      const { data, error } = await client
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      return data || { explanation_mode: 'beginner', preferred_language: 'Python', theme: 'dark' };
    } catch (err) {
      console.warn('[PreferencesService] getPreferences error:', err);
      return { explanation_mode: 'beginner', preferred_language: 'Python', theme: 'dark' };
    }
  }

  async updatePreferences(userId, prefs) {
    const client = window.supabaseManager?.getClient();
    if (!client || !window.supabaseManager?.isLiveConnected) return;

    try {
      const { error } = await client
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...prefs,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err) {
      console.warn('[PreferencesService] updatePreferences error:', err);
    }
  }
}

// Global Singleton
window.preferencesService = window.preferencesService || new PreferencesService();
