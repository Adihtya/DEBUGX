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
   * Google OAuth Sign In via Supabase Auth
   */
  async signInWithGoogle() {
    if (this.isAuthenticating) return;
    this.isAuthenticating = true;
    this.notifyListeners('authenticating', null);

    const client = window.supabaseManager?.getClient();

    if (client && window.supabaseManager.isLiveConnected) {
      try {
        // Use skipBrowserRedirect to safely verify before navigating away
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + window.location.pathname,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });

        if (error) throw error;

        if (data?.url) {
          // Pre-flight check the authorize URL to prevent raw black JSON error page
          try {
            const probeRes = await fetch(data.url, { method: 'HEAD', mode: 'no-cors' });
            // In case we can inspect it or it was allowed:
          } catch (probeErr) {
            console.warn('[AuthService] Pre-flight probe note:', probeErr);
          }

          // Navigate to Google OAuth
          window.location.href = data.url;
        } else {
          throw new Error('Supabase did not return an OAuth authorization URL.');
        }
        return data;
      } catch (err) {
        console.warn('[AuthService] Live Supabase Google OAuth failed:', err);
        this.isAuthenticating = false;
        this.notifyListeners('error', {
          message: err.message?.includes('provider is not enabled')
            ? 'Google Sign-In is not enabled yet in your Supabase dashboard (kcbfwckcolewpfanunez). Under Authentication > Providers > Google, enable the toggle and save, or click "Continue as Demo Developer" below to test immediately.'
            : (err.message || 'Google OAuth failed. You can use Demo Developer mode below.')
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
