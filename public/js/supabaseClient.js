/**
// ==============================================================================
// DEBUGX — SUPABASE CLIENT INITIALIZER
// Initializes the official Supabase JS client (@supabase/supabase-js)
// ==============================================================================
*/

const DEFAULT_SUPABASE_CONFIG = {
  url: "https://your-project-ref.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
};

class SupabaseManager {
  constructor() {
    this.client = null;
    this.isLiveConnected = false;
    this.isInitialized = false;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (window.__DEBUGX_SUPABASE_CONFIG__) {
        return window.__DEBUGX_SUPABASE_CONFIG__;
      }
      const saved = localStorage.getItem('debugx_supabase_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[SupabaseManager] Could not parse stored Supabase config:', e);
    }
    return DEFAULT_SUPABASE_CONFIG;
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('debugx_supabase_config', JSON.stringify(this.config));
    this.init();
  }

  isConfigured() {
    return Boolean(
      this.config &&
      this.config.url &&
      !this.config.url.includes('your-project-ref') &&
      this.config.anonKey &&
      !this.config.anonKey.includes('placeholder')
    );
  }

  init() {
    if (this.isInitialized && this.client) return this.client;

    try {
      // Check if official Supabase JS library is loaded in window
      const createClient = window.supabase?.createClient;
      if (typeof createClient === 'function') {
        this.client = createClient(this.config.url, this.config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'debugx_supabase_auth_token'
          }
        });
        this.isLiveConnected = this.isConfigured();
        this.isInitialized = true;
        console.log(`[SupabaseManager] Initialized Supabase client (${this.isLiveConnected ? 'Live Project' : 'Development/Demo Mode'})`);
      } else {
        console.warn('[SupabaseManager] Supabase JS SDK not yet available on window.');
      }
    } catch (err) {
      console.error('[SupabaseManager] Error initializing Supabase client:', err);
    }

    return this.client;
  }

  getClient() {
    if (!this.client) {
      this.init();
    }
    return this.client;
  }
}

// Global Singleton
window.supabaseManager = new SupabaseManager();
