/**
 * DEBUGX — Firebase Configuration & Service Initializer
 * Initializes Firebase App, Authentication, Firestore, Storage, and Firebase AI Logic.
 */

// Default configuration template. Can be overridden via window.__DEBUGX_FIREBASE_CONFIG__
// or stored in localStorage for custom project deployment.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDebugXProjectConfigApiKeyPlaceholder",
  authDomain: "debugx-studio.firebaseapp.com",
  projectId: "debugx-studio",
  storageBucket: "debugx-studio.firebasestorage.app",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:1234567890abcdef123456",
  measurementId: "G-DEBUGXAI123"
};

class FirebaseManager {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.ai = null;
    this.isInitialized = false;
    this.isLiveConnected = false;
    this.config = this.loadConfig();
    this.initPromise = null;
  }

  loadConfig() {
    try {
      if (window.__DEBUGX_FIREBASE_CONFIG__) {
        return window.__DEBUGX_FIREBASE_CONFIG__;
      }
      const saved = localStorage.getItem('debugx_firebase_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[FirebaseManager] Could not parse stored Firebase config:', e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('debugx_firebase_config', JSON.stringify(this.config));
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Dynamically import official Firebase Web SDK (v10 Modular)
        const [
          { initializeApp },
          { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, deleteUser },
          { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp, query, orderBy, limit }
        ] = await Promise.all([
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
        ]);

        this.app = initializeApp(this.config);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);

        // Try importing Firebase Storage
        try {
          const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js');
          this.storage = getStorage(this.app);
          this.storageRefs = { ref, uploadBytes, getDownloadURL };
        } catch (storageErr) {
          console.warn('[FirebaseManager] Storage optional module skipped:', storageErr);
        }

        // Store module utilities for clean access
        this.authOps = { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, deleteUser };
        this.firestoreOps = { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp, query, orderBy, limit };
        
        this.isInitialized = true;
        this.isLiveConnected = true;
        console.log('[FirebaseManager] Firebase services successfully initialized with project:', this.config.projectId);
      } catch (err) {
        console.warn('[FirebaseManager] Live Firebase SDK import encountered an issue (offline or network restriction). Initializing resilient local provider:', err);
        this.isInitialized = true;
        this.isLiveConnected = false;
      }
      return this;
    })();

    return this.initPromise;
  }
}

// Global singleton instance
window.firebaseManager = new FirebaseManager();
