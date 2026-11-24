/**
// ==============================================================================
// DEBUGX — SUPABASE AUTH SERVICE
// Manages Google OAuth, Session Persistence, Auto Restoration, and User State
// ==============================================================================
*/

class AuthService {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.listeners = [];
    this.isAuthenticating = false;
    this.storageKey = 'debugx_authenticated_user';
  }

  async init() {
    // 1. Check local cached user session for immediate offline display
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        console.warn('[AuthService] Corrupted local user cache:', e);
      }
    }

    const client = window.supabaseManager?.getClient();
    if (client && window.supabaseManager.isLiveConnected) {
      try {
        // 2. Restore active session or parse OAuth redirect hash (#access_token=...)
        const { data: { session }, error } = await client.auth.getSession();
        if (session?.user) {
          await this._handleAuthUser(session.user, session);
        } else if (!this.currentUser) {
          this.notifyListeners('unauthenticated', null);
        }

        // 3. Listen to live Supabase Auth State changes
        client.auth.onAuthStateChange(async (event, newSession) => {
          console.log('[AuthService] onAuthStateChange event:', event);
          if (newSession?.user) {
            await this._handleAuthUser(newSession.user, newSession);
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.session = null;
            localStorage.removeItem(this.storageKey);
            this.notifyListeners('unauthenticated', null);
          }
        });
      } catch (err) {
        console.warn('[AuthService] Supabase session check error:', err);
        if (this.currentUser) {
          this.notifyListeners('authenticated', this.currentUser);
        } else {
          this.notifyListeners('unauthenticated', null);
        }
      }
    } else {
      // Development / Demo Mode
      if (this.currentUser) {
        this.notifyListeners('authenticated', this.currentUser);
      } else {
        this.notifyListeners('unauthenticated', null);
      }
    }

    return this;
  }

  async _handleAuthUser(sbUser, session) {
    this.session = session;
    const meta = sbUser.user_metadata || {};
    this.currentUser = {
      id: sbUser.id,
      uid: sbUser.id,
      email: sbUser.email || '',
      displayName: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Developer',
      photoURL: meta.avatar_url || meta.picture || '',
      provider: 'supabase-google'
    };

    localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));

    // Sync profile to Supabase PostgreSQL table 'profiles'
    if (window.profileService) {
      await window.profileService.syncProfile(this.currentUser);
    }

    this.notifyListeners('authenticated', this.currentUser);
  }

  onAuthStateChange(callback) {
    this.listeners.push(callback);
    if (this.currentUser) {
      callback('authenticated', this.currentUser);
    } else {
      callback('unauthenticated', null);
    }
  }

  onAuthStateChanged(callback) {
    return this.onAuthStateChange(callback);
  }

  notifyListeners(state, user) {
    this.listeners.forEach(cb => {
      try {
        cb(state, user);
      } catch (err) {
        console.error('[AuthService] Listener error:', err);
      }
    });
  }

  getUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  /**
   * Checks whether Google provider is active in the Supabase project
   */
  async isGoogleProviderEnabled() {
    try {
      const url = `${window.supabaseManager?.config?.url || 'https://kcbfwckcolewpfanunez.supabase.co'}/auth/v1/settings`;
      const res = await fetch(url, {
        headers: { 'apikey': window.supabaseManager?.config?.anonKey }
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data?.external?.google);
      }
    } catch (e) {
      console.warn('[AuthService] Could not check Google provider status:', e);
    }
    return true; // Fallback to allowing standard flow if probe is blocked
  }

  /**
   * Google OAuth Sign In via Supabase Auth
   */
  async signInWithGoogle() {
    if (this.isAuthenticating) return;
    this.isAuthenticating = true;
    this.notifyListeners('authenticating', null);

    const client = window.supabaseManager?.getClient();

    if (client && window.supabaseManager.isLiveConnected) {
      try {
        // 1. Proactively check if Google OAuth is enabled in Supabase to prevent raw JSON error pages
        const isEnabled = await this.isGoogleProviderEnabled();
        if (!isEnabled) {
          this.isAuthenticating = false;
          this.notifyListeners('error', {
            message: 'Google Sign-In is not enabled yet in your Supabase project. Enable it under Authentication > Providers > Google in your Supabase dashboard, or click "Continue as Demo Developer (Instant)" below to test immediately.'
          });
          return;
        }

        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + window.location.pathname,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[AuthService] Live Supabase Google OAuth failed:', err);
        this.isAuthenticating = false;
        this.notifyListeners('error', {
          message: err.message || 'Google OAuth failed. You can use Demo Mode below.'
        });
      } finally {
        this.isAuthenticating = false;
      }
    } else {
      // Demo / Developer instant login
      return this.signInAsDemo();
    }
  }

  /**
   * Instant Demo / Offline Access for immediate testing
   */
  signInAsDemo() {
    this.isAuthenticating = false;
    const devUser = {
      id: 'usr_demo_supabase_' + Math.random().toString(36).substring(2, 9),
      uid: 'usr_demo_supabase_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Aditya Chaudhari',
      email: 'aditya.dev@debugx.ai',
      photoURL: '',
      provider: 'supabase-demo'
    };
    this.currentUser = devUser;
    localStorage.setItem(this.storageKey, JSON.stringify(devUser));
    this.notifyListeners('authenticated', devUser);
    return devUser;
  }

  /**
   * Sign out
   */
  async signOut() {
    const client = window.supabaseManager?.getClient();
    if (client && window.supabaseManager.isLiveConnected) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('[AuthService] SignOut error:', e);
      }
    }
    this.currentUser = null;
    this.session = null;
    localStorage.removeItem(this.storageKey);
    this.notifyListeners('unauthenticated', null);
  }

  /**
   * Delete account and cloud data from Supabase
   */
  async deleteAccount() {
    const user = this.currentUser;
    if (user?.id && window.debuggingService) {
      await window.debuggingService.clearHistory(user.id);
    }
    await this.signOut();
  }

  /**
   * Save debugging session to Supabase PostgreSQL
   */
  async saveDebuggingSession(session) {
    if (this.currentUser && window.debuggingService) {
      return window.debuggingService.saveSession(this.currentUser.id || this.currentUser.uid, session);
    }
  }
}

// Global Singleton
window.authService = new AuthService();
window.authManager = window.authService;
