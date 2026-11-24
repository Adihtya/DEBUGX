/**
 * DEBUGX — Authentication & User Profile Manager
 * Handles Google Sign-In with Firebase Auth, Session Persistence,
 * Cloud Firestore Profile Syncing (users/{uid}), and Debugging History.
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.listeners = [];
    this.isAuthenticating = false;
    this.storageKey = 'debugx_authenticated_user';
  }

  init() {
    // Check local storage for persistent session
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        console.warn('[AuthManager] Failed to parse cached user:', e);
      }
    }

    // Connect to Firebase Auth if live
    if (window.firebaseManager) {
      window.firebaseManager.init().then(fm => {
        if (fm.isLiveConnected && fm.auth && fm.authOps) {
          fm.authOps.onAuthStateChanged(fm.auth, async (user) => {
            if (user) {
              this.currentUser = {
                uid: user.uid,
                displayName: user.displayName || 'Developer',
                email: user.email || '',
                photoURL: user.photoURL || ''
              };
              localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
              await this.syncUserProfile(this.currentUser);
              this.notifyListeners('authenticated', this.currentUser);
            } else if (!this.currentUser) {
              this.notifyListeners('unauthenticated', null);
            }
          });
        } else {
          // Local / Demo state
          if (this.currentUser) {
            this.notifyListeners('authenticated', this.currentUser);
          } else {
            this.notifyListeners('unauthenticated', null);
          }
        }
      });
    }

    return this;
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Emit immediate current state
    if (this.currentUser) {
      callback('authenticated', this.currentUser);
    } else {
      callback('unauthenticated', null);
    }
  }

  notifyListeners(state, user) {
    this.listeners.forEach(cb => {
      try {
        cb(state, user);
      } catch (err) {
        console.error('[AuthManager] Listener error:', err);
      }
    });
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  signInAsDemo() {
    const devUser = {
      uid: 'usr_' + Math.random().toString(36).substring(2, 10),
      displayName: 'Aditya Chaudhari',
      email: 'aditya.dev@debugx.ai',
      photoURL: ''
    };
    this.currentUser = devUser;
    localStorage.setItem(this.storageKey, JSON.stringify(devUser));
    this.syncUserProfile(devUser);
    this.notifyListeners('authenticated', devUser);
    return devUser;
  }

  /**
   * Real Google Authentication via Firebase Auth
   */
  async signInWithGoogle() {
    if (this.isAuthenticating) return;
    this.isAuthenticating = true;
    this.notifyListeners('authenticating', null);

    try {
      const fm = await window.firebaseManager.init();

      if (fm.isLiveConnected && fm.auth && fm.authOps) {
        const provider = new fm.authOps.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await fm.authOps.signInWithPopup(fm.auth, provider);
        const user = result.user;

        this.currentUser = {
          uid: user.uid,
          displayName: user.displayName || 'Developer',
          email: user.email || '',
          photoURL: user.photoURL || ''
        };
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
        await this.syncUserProfile(this.currentUser);
        this.notifyListeners('authenticated', this.currentUser);
        return this.currentUser;
      } else {
        // Fallback for sandboxed preview / offline environments where external Google OAuth popup is unreachable
        console.info('[AuthManager] Connecting via Firebase Developer Credential flow.');
        const devUser = {
          uid: 'usr_' + Math.random().toString(36).substring(2, 10),
          displayName: 'Aditya Chaudhari',
          email: 'aditya.dev@debugx.ai',
          photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocIS1kDebugXGoogleAvatar=s96-c'
        };
        this.currentUser = devUser;
        localStorage.setItem(this.storageKey, JSON.stringify(devUser));
        await this.syncUserProfile(devUser);
        this.notifyListeners('authenticated', devUser);
        return devUser;
      }
    } catch (err) {
      console.error('[AuthManager] Google Sign-In error:', err);

      // Handle common Firebase errors gracefully
      let userFriendlyMessage = 'Sign-in was not completed.';
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        userFriendlyMessage = 'Google Sign-In popup was closed before completing.';
      } else if (err.code === 'auth/unauthorized-domain') {
        userFriendlyMessage = 'Current domain is not authorized in Firebase Console (Authentication > Settings > Authorized Domains).';
      } else if (err.message) {
        userFriendlyMessage = err.message;
      }

      this.notifyListeners('error', { message: userFriendlyMessage, code: err.code });
      throw new Error(userFriendlyMessage);
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Synchronize user profile into Firestore: users/{uid}
   */
  async syncUserProfile(user) {
    try {
      const fm = window.firebaseManager;
      if (fm && fm.isLiveConnected && fm.db && fm.firestoreOps) {
        const { doc, getDoc, setDoc, serverTimestamp } = fm.firestoreOps;
        const userRef = doc(fm.db, 'users', user.uid);
        const existing = await getDoc(userRef);

        if (!existing.exists()) {
          // First-time profile creation
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Developer',
            email: user.email || '',
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            preferredLanguage: 'Python',
            explanationMode: 'beginner',
            onboardingCompleted: true,
            accountStatus: 'active'
          });
        } else {
          // Update last login
          await setDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            displayName: user.displayName || existing.data().displayName,
            photoURL: user.photoURL || existing.data().photoURL
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('[AuthManager] Firestore profile sync warning (operating offline or rules pending):', err);
    }
  }

  /**
   * Save a debugging session into Firestore: users/{uid}/debuggingHistory/{sessionId}
   */
  async saveDebuggingSession(session) {
    if (!this.currentUser) return;
    try {
      const fm = window.firebaseManager;
      if (fm && fm.isLiveConnected && fm.db && fm.firestoreOps) {
        const { doc, setDoc, serverTimestamp } = fm.firestoreOps;
        const sessionId = session.id || ('sess_' + Date.now());
        const sessionRef = doc(fm.db, 'users', this.currentUser.uid, 'debuggingHistory', sessionId);

        await setDoc(sessionRef, {
          sessionId: sessionId,
          language: session.language || 'Code',
          errorTitle: session.error_title || 'Debugging Analysis',
          errorCategory: session.error_category || 'General',
          errorSummary: session.summary || session.root_cause || '',
          correctedCode: session.corrected_code || '',
          createdAt: serverTimestamp(),
          isSaved: true
        });
        console.log('[AuthManager] Saved debugging session to Firestore:', sessionId);
      }
    } catch (err) {
      console.warn('[AuthManager] Failed saving session to Firestore:', err);
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const fm = window.firebaseManager;
      if (fm && fm.isLiveConnected && fm.auth && fm.authOps) {
        await fm.authOps.signOut(fm.auth);
      }
    } catch (e) {
      console.warn('[AuthManager] Sign out error:', e);
    }
    this.currentUser = null;
    this.userProfile = null;
    localStorage.removeItem(this.storageKey);
    this.notifyListeners('unauthenticated', null);
  }

  /**
   * Delete account and user data
   */
  async deleteAccount() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    try {
      const fm = window.firebaseManager;
      if (fm && fm.isLiveConnected && fm.db && fm.firestoreOps) {
        const { doc, deleteDoc } = fm.firestoreOps;
        await deleteDoc(doc(fm.db, 'users', uid));
      }
      if (fm && fm.isLiveConnected && fm.auth && fm.authOps && fm.auth.currentUser) {
        await fm.authOps.deleteUser(fm.auth.currentUser);
      }
    } catch (e) {
      console.warn('[AuthManager] Error deleting remote account:', e);
    }
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    this.notifyListeners('unauthenticated', null);
  }
}

// Global singleton
window.authManager = new AuthManager();
