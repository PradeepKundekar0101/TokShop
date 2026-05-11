import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { BASE_URL } from './utils';

// Firebase Admin app instance (initialized on-demand)
let adminApp: App | null = null;
let isInitializing = false;

// Initialize Firebase Admin SDK with dynamic config from settings API
async function initializeFirebaseAdmin(): Promise<App> {
  // Return existing app if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const apps = getApps();
    if (apps.length > 0) return apps[0];
  }

  isInitializing = true;

  try {
    // Fetch Firebase config from settings API with timeout
    console.log('🔥 Fetching auth config from settings API...');
    
    const fetchWithTimeout = async (url: string, timeout = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const response = await fetchWithTimeout(`${BASE_URL}/settings`, 5000);
    
    if (!response.ok) {
      throw new Error('Failed to fetch auth config from settings API');
    }

    const settings = await response.json();
    
    // Build Firebase config from settings
    const firebaseConfig = {
      projectId: settings.firebase_project_id || 'tokshop-33509',
      storageBucket: settings.firebase_storage_bucket || 'tokshop-33509.appspot.com',
    };

    console.log('🔥 Initializing Admin with config:', { 
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket 
    });

    adminApp = initializeApp(firebaseConfig);
    console.log('✅ Admin initialized successfully');
    
    return adminApp;
  } catch (error) {
    console.error('❌ Admin initialization error:', error);
    // Fallback to default config
    const fallbackConfig = {
      projectId: 'tokshop-33509',
      storageBucket: 'tokshop-33509.appspot.com',
    };
    console.log('⚠️ Using fallback auth config');
    adminApp = initializeApp(fallbackConfig);
    return adminApp;
  } finally {
    isInitializing = false;
  }
}

// Lazy getters that initialize on first use
export async function getAdminAuth(): Promise<Auth> {
  const app = await initializeFirebaseAdmin();
  return getAuth(app);
}

export async function getAdminStorage(): Promise<Storage> {
  const app = await initializeFirebaseAdmin();
  return getStorage(app);
}

export async function getAdminFirestore(): Promise<Firestore> {
  const app = await initializeFirebaseAdmin();
  return getFirestore(app);
}

// Verify Firebase ID token
export async function verifyFirebaseToken(idToken: string) {
  try {
    const auth = await getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider: decodedToken.firebase.sign_in_provider,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      success: false,
      error: 'Invalid or expired authentication token',
    };
  }
}

// Delete images from Firebase Storage
export async function deleteImagesFromStorage(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  const storage = await getAdminStorage();
  const bucket = storage.bucket();
  
  const deletePromises = imageUrls.map(async (url) => {
    try {
      // Extract the file path from Firebase Storage URL
      // Firebase URLs look like: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media...
      const urlParts = url.split('/o/');
      if (urlParts.length < 2) {
        console.warn('Invalid storage URL format:', url);
        return;
      }

      // Decode the file path (it's URL-encoded)
      const encodedPath = urlParts[1].split('?')[0];
      const filePath = decodeURIComponent(encodedPath);

      console.log(`🗑️ Deleting image from storage: ${filePath}`);

      // Delete the file from Storage
      await bucket.file(filePath).delete();
      
      console.log(`✅ Successfully deleted: ${filePath}`);
    } catch (error: any) {
      // Don't throw - log and continue with other deletions
      console.error(`❌ Error deleting image ${url}:`, error.message);
    }
  });

  await Promise.all(deletePromises);
}