/**
// ==============================================================================
// DEBUGX — SUPABASE PROFILE & PREFERENCES SERVICE
// Manages profiles and user_preferences tables in Supabase PostgreSQL
// ==============================================================================
*/

class ProfileService {
  async getProfile(userId) {
    const client = window.supabaseManager?.getClient();
    if (!client || !window.supabaseManager.isLiveConnected) {
      return { id: userId, full_name: 'Developer', email: 'aditya.dev@debugx.ai' };
    }

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[ProfileService] getProfile error:', err);
      return null;
    }
  }

  async syncProfile(user) {
    const client = window.supabaseManager?.getClient();
    if (!client || !window.supabaseManager.isLiveConnected) return;

    try {
      const { error } = await client
        .from('profiles')
        .upsert({
          id: user.id || user.uid,
          full_name: user.displayName || 'Developer',
          email: user.email || '',
          avatar_url: user.photoURL || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) console.warn('[ProfileService] syncProfile upsert warning:', error);
    } catch (err) {
      console.warn('[ProfileService] syncProfile error:', err);
    }
  }
}

class PreferencesService {
  async getPreferences(userId) {
    const client = window.supabaseManager?.getClient();
    if (!client || !window.supabaseManager.isLiveConnected) {
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
    if (!client || !window.supabaseManager.isLiveConnected) return;

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

window.profileService = new ProfileService();
window.preferencesService = new PreferencesService();
