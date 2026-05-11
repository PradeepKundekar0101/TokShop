// Firebase configuration and authentication setup
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirestore, Firestore } from "firebase/firestore";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
}

// Default config as fallback - these are placeholder values
// Real config should come from the API settings
const defaultConfig: FirebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  appId: "your-app-id",
};

// Firebase instances (will be initialized dynamically)
let app: FirebaseApp;
let _auth: Auth;
let _storage: FirebaseStorage;
let _db: Firestore;
let isInitialized = false;

// Initialize Firebase with dynamic config
export function initializeFirebase(config?: FirebaseConfig) {
  // Don't re-initialize with placeholder config
  if (!config || config.projectId === 'your-project-id') {
    console.warn('⚠️ Refusing to initialize auth with placeholder/missing config');
    return;
  }

  // Allow re-initialization if config has changed (for development hot-reload)
  if (isInitialized) {
    console.log('🔥 Auth already initialized, skipping re-initialization');
    return;
  }

  console.log('🔥 Initializing auth with config:', { projectId: config.projectId });

  app = initializeApp(config);
  _auth = getAuth(app);
  _storage = getStorage(app);
  _db = getFirestore(app);
  isInitialized = true;

  console.log('✅ Auth initialized successfully');
}

// Getters that ensure Firebase is initialized
export const getFirebaseAuth = (): Auth => {
  if (!isInitialized) {
    throw new Error('Auth service not initialized. Make sure SettingsProvider loads settings first.');
  }
  return _auth;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!isInitialized) {
    throw new Error('Auth service not initialized. Make sure SettingsProvider loads settings first.');
  }
  return _storage;
};

export const getFirebaseDb = (): Firestore => {
  if (!isInitialized) {
    throw new Error('Auth service not initialized. Make sure SettingsProvider loads settings first.');
  }
  return _db;
};

// Export for backward compatibility
export const auth = new Proxy({} as Auth, {
  get: (target, prop) => {
    return (getFirebaseAuth() as any)[prop];
  }
});

export const storage = new Proxy({} as FirebaseStorage, {
  get: (target, prop) => {
    return (getFirebaseStorage() as any)[prop];
  }
});

export const db = new Proxy({} as Firestore, {
  get: (target, prop) => {
    return (getFirebaseDb() as any)[prop];
  }
});

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

// Configure Google provider
googleProvider.addScope("email");
googleProvider.addScope("profile");

// Configure Apple provider
appleProvider.addScope("email");
appleProvider.addScope("name");

// Google Sign In with popup (better UX than redirect)
export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(getFirebaseAuth(), googleProvider);
  } catch (error: any) {
    // If popup is blocked, fall back to redirect
    if (error.code === "auth/popup-blocked") {
      console.log("Popup blocked, falling back to redirect");
      return await signInWithGoogleRedirect();
    }
    throw error;
  }
};

// Google Sign In with redirect (fallback if popup is blocked)
export const signInWithGoogleRedirect = () => {
  return signInWithRedirect(getFirebaseAuth(), googleProvider);
};

// Handle redirect result (call this on app initialization)
export const handleAuthRedirect = () => {
  return getRedirectResult(getFirebaseAuth());
};

// Sign out
export const firebaseSignOut = () => {
  return signOut(getFirebaseAuth());
};

// Apple Sign In with popup (better UX than redirect)
export const signInWithApple = async () => {
  try {
    return await signInWithPopup(getFirebaseAuth(), appleProvider);
  } catch (error: any) {
    // If popup is blocked, fall back to redirect
    if (error.code === "auth/popup-blocked") {
      console.log("Popup blocked, falling back to redirect");
      return await signInWithAppleRedirect();
    }
    throw error;
  }
};

// Apple Sign In with redirect (fallback if popup is blocked)
export const signInWithAppleRedirect = () => {
  return signInWithRedirect(getFirebaseAuth(), appleProvider);
};

// Auth state observer
export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(getFirebaseAuth(), callback);
};
