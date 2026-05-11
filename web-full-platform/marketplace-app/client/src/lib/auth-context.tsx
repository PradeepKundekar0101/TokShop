import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { onAuthStateChange, signInWithGoogle, signInWithApple, firebaseSignOut, handleAuthRedirect } from "./firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { loginSchema, signupSchema, socialAuthSchema, socialAuthCompleteSchema, type LoginData, type SignupData, type SocialAuthData, type SocialAuthCompleteData } from "@shared/schema";
import { apiRequest, queryClient } from "./queryClient";
import { useSettings } from "./settings-context";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  userName?: string;
  country?: string;
  phone?: string;
  date_of_birth?: string; // YYYY-MM-DD format
  seller?: boolean;
  admin?: boolean;
  role?: 'superAdmin' | 'admin';
  authProvider?: 'email' | 'google' | 'apple'; // Track how user signed up
  address?: any; // Shipping address from Tokshop API
  defaultpaymentmethod?: any; // Default payment method from Tokshop API
  above_age?: boolean; // User has confirmed they are over 18
  referredBy?: string | null; // ID of user who referred this user
  awarded_referal_credit?: boolean; // Whether referral credit has been used
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingSocialAuth: boolean;
  pendingSocialAuthEmail: string | null;
  pendingSocialAuthData: FirebaseUser | null;
  showAgeVerification: boolean;
  login: (email: string, password: string) => Promise<void>;
  emailLogin: (email: string, password: string) => Promise<void>;
  emailSignup: (email: string, password: string, firstname: string, lastname: string, username: string, phone: string, country: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  completeSocialAuth: (data: SocialAuthCompleteData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserData: () => Promise<{ address: any; defaultpaymentmethod: any } | null>;
  confirmAge: () => Promise<void>;
  declineAge: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function getClientIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      return data.ip || '';
    }
  } catch (e) {}
  return '';
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('[AuthProvider] Initializing AuthProvider');
  
  const { isFirebaseReady, settings, theme, isLoading: settingsLoading, fetchSettings, settingsFetched } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSocialAuth, setPendingSocialAuth] = useState(false);
  const [pendingSocialAuthEmail, setPendingSocialAuthEmail] = useState<string | null>(null);
  const [pendingSocialAuthData, setPendingSocialAuthData] = useState<FirebaseUser | null>(null);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const isProcessingRef = useRef(false);
  const hasCheckedAuth = useRef(false);
  const lastRefreshTime = useRef<number>(0);
  const isRefreshing = useRef(false);

  console.log('[AuthProvider] Current state - isLoading:', isLoading, 'user:', user ? user.id : 'null', 'isAuthenticated:', !!user, 'isFirebaseReady:', isFirebaseReady);

  const isAuthenticated = !!user;

  // Call backend social auth API after successful Firebase auth  
  const authenticateWithTokshopRef = useRef<(firebaseUser: FirebaseUser, additionalUserInfo?: any, skipNewUserCheck?: boolean, providerToken?: string | null) => Promise<any>>();
  
  authenticateWithTokshopRef.current = async (firebaseUser: FirebaseUser, additionalUserInfo?: any, skipNewUserCheck: boolean = false, providerToken?: string | null) => {
    try {
      // Get Firebase ID token for server-side verification
      const idToken = await firebaseUser.getIdToken(true);
      
      // Detect provider type based on provider data
      let authType: 'google' | 'apple' | null = null;
      if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
        if (firebaseUser.providerData.some(p => p.providerId === 'apple.com')) {
          authType = 'apple';
        } else if (firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
          authType = 'google';
        }
      }
      
      // For Apple, try to get provider info from additionalUserInfo if available
      if (!authType && additionalUserInfo?.providerId === 'apple.com') {
        authType = 'apple';
      } else if (!authType && additionalUserInfo?.providerId === 'google.com') {
        authType = 'google';
      }
      
      // If we still can't determine the provider, this is an error condition
      if (!authType) {
        throw new Error('Unable to determine authentication provider');
      }

      // Extract Apple profile data from additionalUserInfo if available (first-time login)
      let firstName = '';
      let lastName = '';
      let email = firebaseUser.email || '';
      
      if (authType === 'apple' && additionalUserInfo?.profile) {
        // Apple provides profile data only on first sign-in
        const profile = additionalUserInfo.profile;
        if (profile.name) {
          firstName = profile.name.firstName || '';
          lastName = profile.name.lastName || '';
        }
        if (profile.email) {
          email = profile.email;
        }
      } else if (authType === 'google' || !additionalUserInfo?.profile) {
        // Google or subsequent Apple logins - use displayName
        firstName = firebaseUser.displayName?.split(' ')[0] || '';
        lastName = firebaseUser.displayName?.split(' ').slice(1).join(' ') || '';
      }
      
      // For Apple users, skip the user existence check and proceed directly to social auth
      // The backend social auth endpoint will handle user creation/login appropriately

      const referredBy = localStorage.getItem('referredBy') || undefined;
      const clientIp = referredBy ? await getClientIp() : '';

      // Prepare social auth data with Firebase verification info
      const socialAuthData = {
        // Firebase verification data (server will use this for identity)
        idToken: idToken,
        uid: firebaseUser.uid,
        // OAuth provider token for backend decoding (Google accessToken or Apple identityToken)
        providerToken: providerToken || undefined,
        // Profile data (server will use verified Firebase data as primary source)
        email: email,
        firstName: firstName,
        lastName: lastName,
        type: authType,
        profilePhoto: firebaseUser.photoURL || '',
        userName: '', // Leave empty so new users are redirected to completion page to enter their own username
        country: '',
        phone: '',
        gender: '',
        ...(referredBy ? { referredBy, clientIp } : {}),
      };

      // Send to backend with Firebase token - let server handle validation and user correlation
      const response = await apiRequest('POST', '/api/auth/social', socialAuthData);

      const tokshopResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(tokshopResponse.error || `Authentication failed: ${response.status}`);
      }
      
      if (tokshopResponse.success) {
        // Check if this is a new user who needs to complete their profile
        // Only show completion form if explicitly marked as a new user by the backend
        // Skip this check if we already verified user existence before calling this function
        if (!skipNewUserCheck && tokshopResponse.newuser === true) {
          // Set pending social auth state instead of completing authentication
          setPendingSocialAuth(true);
          setPendingSocialAuthEmail(firebaseUser.email || '');
          setPendingSocialAuthData(firebaseUser);
          return tokshopResponse;
        }

        // Existing user - complete authentication immediately
        const userData = {
          id: tokshopResponse.data._id || tokshopResponse.data.id,
          email: tokshopResponse.data.email,
          firstName: tokshopResponse.data.firstName,
          lastName: tokshopResponse.data.lastName || '',
          profilePhoto: tokshopResponse.data.profilePhoto || firebaseUser.photoURL || '',
          userName: tokshopResponse.data.userName,
          country: tokshopResponse.data.country || '',
          phone: tokshopResponse.data.phone || '',
          date_of_birth: tokshopResponse.data.date_of_birth || tokshopResponse.data.dateOfBirth,
          seller: tokshopResponse.data.seller || false,
          admin: tokshopResponse.data.admin || false,
          authProvider: authType as 'google' | 'apple',
          address: tokshopResponse.data.address,
          defaultpaymentmethod: tokshopResponse.data.defaultpaymentmethod,
          above_age: tokshopResponse.data.above_age || false,
          referredBy: tokshopResponse.data.referredBy || null,
          awarded_referal_credit: tokshopResponse.data.awarded_referal_credit ?? false
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (tokshopResponse.accessToken) {
          localStorage.setItem('accessToken', tokshopResponse.accessToken);
        }
        
        if (referredBy) {
          localStorage.removeItem('referredBy');
        }
        
        // Clear any pending auth state
        setPendingSocialAuth(false);
        setPendingSocialAuthEmail(null);
        setPendingSocialAuthData(null);
      } else {
        throw new Error(tokshopResponse.message || 'Authentication failed');
      }

      return tokshopResponse;
    } catch (error: any) {
      console.error('Authentication failed:', error?.message || error);
      throw error;
    }
  };
  
  const authenticateWithTokshop = async (firebaseUser: FirebaseUser, additionalUserInfo?: any, skipNewUserCheck: boolean = false, providerToken?: string | null) => {
    if (authenticateWithTokshopRef.current) {
      return await authenticateWithTokshopRef.current(firebaseUser, additionalUserInfo, skipNewUserCheck, providerToken);
    }
  };

  const login = async (email: string, password: string) => {
    return await emailLogin(email, password);
  };

  const emailLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Validate input using schema
      const validatedData = loginSchema.parse({ email, password });
      
      const response = await apiRequest('POST', '/api/auth/login', validatedData);
      const loginResponse = await response.json();
      
      if (loginResponse.success) {
        // Set user data from login response
        const userData = {
          id: loginResponse.data._id || loginResponse.data.id,
          email: loginResponse.data.email,
          firstName: loginResponse.data.firstName,
          lastName: loginResponse.data.lastName || '',
          profilePhoto: loginResponse.data.profilePhoto || '',
          userName: loginResponse.data.userName,
          country: loginResponse.data.country || '',
          phone: loginResponse.data.phone || '',
          date_of_birth: loginResponse.data.date_of_birth || loginResponse.data.dateOfBirth,
          seller: loginResponse.data.seller || false,
          admin: loginResponse.data.admin || false,
          authProvider: 'email' as const,
          address: loginResponse.data.address,
          defaultpaymentmethod: loginResponse.data.defaultpaymentmethod,
          above_age: loginResponse.data.above_age || false,
          referredBy: loginResponse.data.referredBy || null,
          awarded_referal_credit: loginResponse.data.awarded_referal_credit ?? false
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (loginResponse.accessToken) {
          localStorage.setItem('accessToken', loginResponse.accessToken);
        }

        const referredBy = localStorage.getItem('referredBy');
        if (referredBy) {
          localStorage.removeItem('referredBy');
        }
      } else {
        // Use the actual API message first, fallback to friendly error, then generic message
        const apiMessage = loginResponse.message || loginResponse.error || 'Login failed';
        throw new Error(apiMessage);
      }
    } catch (error: any) {
      console.error('Email login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const emailSignup = async (email: string, password: string, firstName: string, lastName: string, userName: string, phone: string, country: string) => {
    try {
      setIsLoading(true);
      
      // Validate input using schema
      const validatedData = signupSchema.parse({ email, password, firstName, lastName, userName, phone, country });
      
      const referredBy = localStorage.getItem('referredBy') || undefined;
      const clientIp = referredBy ? await getClientIp() : '';
      const payload = { ...validatedData, ...(referredBy ? { referredBy, clientIp } : {}) };
      
      const response = await apiRequest('POST', '/api/auth/signup', payload);
      const signupResponse = await response.json();
      
      if (signupResponse.success) {
        // Set user data from signup response
        const userData = {
          id: signupResponse.data._id || signupResponse.data.id,
          email: signupResponse.data.email,
          firstName: signupResponse.data.firstName,
          lastName: signupResponse.data.lastName || '',
          profilePhoto: signupResponse.data.profilePhoto || '',
          userName: signupResponse.data.userName,
          country: signupResponse.data.country || country, // Use from signup form
          phone: signupResponse.data.phone || '',
          date_of_birth: signupResponse.data.date_of_birth || signupResponse.data.dateOfBirth,
          seller: signupResponse.data.seller || false,
          admin: signupResponse.data.admin || false,
          authProvider: 'email' as const,
          address: signupResponse.data.address,
          defaultpaymentmethod: signupResponse.data.defaultpaymentmethod,
          above_age: signupResponse.data.above_age || false,
          referredBy: signupResponse.data.referredBy || null,
          awarded_referal_credit: signupResponse.data.awarded_referal_credit ?? false
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (signupResponse.accessToken) {
          localStorage.setItem('accessToken', signupResponse.accessToken);
        }
        
        if (referredBy) {
          localStorage.setItem('referral_signup_done', 'true');
          localStorage.removeItem('referredBy');
          document.cookie = 'referral_signup_done=true; path=/; max-age=31536000; SameSite=Lax';
          sessionStorage.setItem('show_referral_banner', 'true');
          sessionStorage.setItem('referral_referrer_id', referredBy);
        }
      } else {
        // Use the actual API message first, fallback to friendly error, then generic message
        const apiMessage = signupResponse.message || signupResponse.error || 'Signup failed';
        throw new Error(apiMessage);
      }
    } catch (error: any) {
      console.error('Email signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      
      if (result?.user) {
        // Extract provider token from result (Google accessToken)
        const providerToken = (result as any)?.providerToken || null;
        
        // Store providerToken for use if this is a new user requiring completion
        if (providerToken) {
          localStorage.setItem('pendingProviderToken', providerToken);
        }
        
        // Let authenticateWithTokshop handle new user detection via `newuser` response field
        await authenticateWithTokshop(result.user, (result as any)?.additionalUserInfo, false, providerToken);
      }
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithApple();
      // Handle authentication directly to capture additionalUserInfo for Apple
      if (result?.user) {
        // Extract provider token from result (Apple identityToken)
        const providerToken = (result as any)?.providerToken || null;
        
        // Store providerToken for use if this is a new user requiring completion
        if (providerToken) {
          localStorage.setItem('pendingProviderToken', providerToken);
        }
        
        await authenticateWithTokshop(result.user, (result as any)?.additionalUserInfo, false, providerToken);
      }
    } catch (error) {
      console.error('Apple login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeSocialAuth = async (completionData: SocialAuthCompleteData) => {
    try {
      setIsLoading(true);
      
      if (!pendingSocialAuthData) {
        throw new Error('No pending social authentication data found');
      }

      // Validate input using schema
      const validatedData = socialAuthCompleteSchema.parse(completionData);

      // Detect provider type based on pending auth data
      let authType: 'google' | 'apple' = 'google'; // default
      if (pendingSocialAuthData.providerData && pendingSocialAuthData.providerData.length > 0) {
        if (pendingSocialAuthData.providerData.some(p => p.providerId === 'apple.com')) {
          authType = 'apple';
        } else if (pendingSocialAuthData.providerData.some(p => p.providerId === 'google.com')) {
          authType = 'google';
        }
      }

      // Get stored provider token from pending auth
      const storedProviderToken = localStorage.getItem('pendingProviderToken') || undefined;
      
      const referredBy = localStorage.getItem('referredBy') || undefined;
      const clientIp = referredBy ? await getClientIp() : '';

      // Combine the original Firebase data with the completion data
      const fullSocialAuthData = {
        email: pendingSocialAuthData.email || '',
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        userName: validatedData.userName,
        type: authType,
        profilePhoto: pendingSocialAuthData.photoURL || '',
        country: validatedData.country || '',
        phone: validatedData.phone || '',
        gender: validatedData.gender || '',
        providerToken: storedProviderToken,
        ...(referredBy ? { referredBy, clientIp } : {}),
      };

      const response = await apiRequest('POST', '/api/auth/social/complete', fullSocialAuthData);
      const completeResponse = await response.json();
      
      if (completeResponse.success) {
        // Set user data from completion response
        const userData = {
          id: completeResponse.data._id || completeResponse.data.id,
          email: completeResponse.data.email,
          firstName: completeResponse.data.firstName,
          lastName: completeResponse.data.lastName || '',
          profilePhoto: completeResponse.data.profilePhoto || pendingSocialAuthData.photoURL || '',
          userName: completeResponse.data.userName,
          country: completeResponse.data.country || '',
          phone: completeResponse.data.phone || '',
          date_of_birth: completeResponse.data.date_of_birth || completeResponse.data.dateOfBirth,
          seller: completeResponse.data.seller || false,
          admin: completeResponse.data.admin || false,
          authProvider: authType as 'google' | 'apple',
          address: completeResponse.data.address,
          defaultpaymentmethod: completeResponse.data.defaultpaymentmethod,
          above_age: completeResponse.data.above_age || false,
          referredBy: completeResponse.data.referredBy || null,
          awarded_referal_credit: completeResponse.data.awarded_referal_credit ?? false
        };
        
        setUser(userData);
        // Store complete user data and access token in localStorage for header-based persistence
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        if (completeResponse.accessToken) {
          localStorage.setItem('accessToken', completeResponse.accessToken);
        }

        if (referredBy) {
          localStorage.setItem('referral_signup_done', 'true');
          localStorage.removeItem('referredBy');
          document.cookie = 'referral_signup_done=true; path=/; max-age=31536000; SameSite=Lax';
          sessionStorage.setItem('show_referral_banner', 'true');
          sessionStorage.setItem('referral_referrer_id', referredBy);
        }

        // Clear pending auth state
        setPendingSocialAuth(false);
        setPendingSocialAuthEmail(null);
        setPendingSocialAuthData(null);
        // Clear stored provider token
        localStorage.removeItem('pendingProviderToken');
      } else {
        throw new Error(completeResponse.error || 'Failed to complete social authentication');
      }
    } catch (error: any) {
      console.error('Social auth completion failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear HttpOnly cookies
      await apiRequest('POST', '/api/auth/logout', {});
      await firebaseSignOut();
      setUser(null);
      // Clear stored user data and access token
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('pendingProviderToken');
      // Clear pending auth state
      setPendingSocialAuth(false);
      setPendingSocialAuthEmail(null);
      setPendingSocialAuthData(null);
      // Clear React Query cache to prevent stale user data from showing for new user
      queryClient.clear();
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear user state on error
      setUser(null);
      // Clear stored user data and access token
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('pendingProviderToken');
      // Clear pending auth state
      setPendingSocialAuth(false);
      setPendingSocialAuthEmail(null);
      setPendingSocialAuthData(null);
      // Clear React Query cache to prevent stale user data
      queryClient.clear();
    }
  };

  const checkAuthRef = useRef<() => Promise<void>>();
  
  checkAuthRef.current = async () => {
    // Prevent multiple simultaneous calls
    if (hasCheckedAuth.current) {
      console.log('[checkAuth] Already checked, skipping');
      return;
    }
    
    try {
      console.log('[checkAuth] Starting auth check...');
      
      // Check for admin impersonation URL params
      const urlParams = new URLSearchParams(window.location.search);
      const isImpersonating = urlParams.get('impersonate') === 'true';
      
      if (isImpersonating) {
        console.log('[checkAuth] Admin impersonation detected, processing...');
        const token = urlParams.get('token');
        const authtoken = urlParams.get('authtoken');
        const userDataParam = urlParams.get('user');
        
        if (token && userDataParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            
            // Store the impersonation tokens
            localStorage.setItem('accessToken', token);
            if (authtoken) {
              localStorage.setItem('authtoken', authtoken);
            }
            localStorage.setItem('impersonating', 'true');
            
            // Build user object
            const impersonatedUser: User = {
              id: userData._id || userData.id,
              email: userData.email || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              profilePhoto: userData.profilePhoto || '',
              coverPhoto: userData.coverPhoto || '',
              userName: userData.userName || '',
              country: userData.country || '',
              phone: userData.phonenumber || userData.phone || '',
              date_of_birth: userData.date_of_birth || '',
              seller: userData.seller || false,
              admin: userData.admin || false,
              address: userData.address || null,
              defaultpaymentmethod: userData.defaultpaymentmethod || null,
              above_age: userData.above_age || false,
              referredBy: userData.referredBy || null,
              awarded_referal_credit: userData.awarded_referal_credit ?? false,
            };
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(impersonatedUser));
            localStorage.setItem('userId', impersonatedUser.id);
            
            // Set the user state
            setUser(impersonatedUser);
            hasCheckedAuth.current = true;
            setIsLoading(false);
            
            // Clean up URL params
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            console.log('[checkAuth] Impersonation successful as:', impersonatedUser.userName || impersonatedUser.email);
            return;
          } catch (e) {
            console.error('[checkAuth] Failed to parse impersonation data:', e);
          }
        }
      }
      
      // First handle any pending redirects with a timeout
      const redirectPromise = handleAuthRedirect();
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2000));
      const redirectResult = await Promise.race([redirectPromise, timeoutPromise]) as any;
      
      if (redirectResult?.user && !isProcessingRef.current) {
        isProcessingRef.current = true;
        try {
          // Handle redirect result with additionalUserInfo
          await authenticateWithTokshop(redirectResult.user, redirectResult?.additionalUserInfo);
        } finally {
          isProcessingRef.current = false;
        }
        return;
      }

      // Check if we have stored user data in localStorage
      const storedUser = localStorage.getItem('user');
      console.log('[checkAuth] localStorage user:', storedUser ? 'EXISTS' : 'NONE');
      
      if (storedUser) {
        try {
          // Parse stored user data first
          const userData = JSON.parse(storedUser);
          console.log('[checkAuth] Setting user from localStorage:', userData.id);
          
          // Ensure address, defaultpaymentmethod, and above_age fields always exist (even if null)
          // This prevents unnecessary API calls when these fields weren't in old localStorage data
          if (!('address' in userData)) {
            userData.address = null;
          }
          if (!('defaultpaymentmethod' in userData)) {
            userData.defaultpaymentmethod = null;
          }
          if (!('above_age' in userData)) {
            userData.above_age = false;
          }
          
          // Save updated user data back to localStorage with the new fields
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Set user immediately from localStorage
          setUser(userData);
          
          // Fetch fresh user profile from API to validate user exists
          console.log('[checkAuth] Fetching fresh user data from API...');
          
          // Use fetch directly (not apiRequest) so we can check 404 status before it throws
          fetch(`/api/profile/${userData.id}`, {
            method: 'GET',
            credentials: 'include'
          })
            .then(async (res) => {
              // If 404, user doesn't exist in database - log them out
              if (res.status === 404) {
                console.log('[checkAuth] User not found in database (404), logging out...');
                localStorage.removeItem('userId');
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                setUser(null);
                return null;
              }
              
              if (!res.ok) {
                console.log('[checkAuth] Profile fetch failed with status:', res.status);
                return null;
              }
              
              return res.json();
            })
            .then(async (profileData) => {
              // If profileData is null, user was logged out or fetch failed
              if (profileData === null) {
                return;
              }
              
              // User exists, fetch additional data
              const [addressRes, paymentRes] = await Promise.all([
                fetch(`/api/address/default/address/${userData.id}`, { credentials: 'include' })
                  .then(res => res.ok ? res.json() : { address: null })
                  .catch(() => ({ address: null })),
                fetch(`/api/users/paymentmethod/${userData.id}`, { credentials: 'include' })
                  .then(res => res.ok ? res.json() : [])
                  .catch(() => [])
              ]);
              
              const defaultAddress = addressRes?.address || null;
              const hasPaymentMethod = Array.isArray(paymentRes) && paymentRes.length > 0;
              const defaultPaymentMethod = hasPaymentMethod ? paymentRes[0] : null;
              
              // Merge fresh profile data with existing user data
              const updatedUser = {
                ...userData,
                // Update profile fields from fresh data
                firstName: profileData.firstName || userData.firstName,
                lastName: profileData.lastName || userData.lastName,
                userName: profileData.userName || userData.userName,
                email: profileData.email || userData.email,
                profilePhoto: profileData.profilePhoto || userData.profilePhoto,
                coverPhoto: profileData.coverPhoto || userData.coverPhoto,
                bio: profileData.bio || userData.bio,
                phonenumber: profileData.phonenumber || userData.phonenumber,
                applied_seller: profileData.applied_seller ?? userData.applied_seller,
                stripe_account: profileData.stripe_account || userData.stripe_account,
                shipping_settings: profileData.shipping_settings || userData.shipping_settings,
                notification_settings: profileData.notification_settings || userData.notification_settings,
                address: defaultAddress,
                defaultpaymentmethod: defaultPaymentMethod,
                above_age: userData.above_age === true ? true : (profileData.above_age ?? false),
                referredBy: profileData.referredBy || userData.referredBy || null,
                awarded_referal_credit: profileData.awarded_referal_credit ?? userData.awarded_referal_credit ?? false
              };
              
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              console.log('[checkAuth] Fresh user data updated:', {
                hasProfile: true,
                hasAddress: !!defaultAddress,
                hasPayment: !!defaultPaymentMethod,
                profilePhoto: updatedUser.profilePhoto ? 'SET' : 'NONE'
              });
            })
            .catch(error => {
              console.error('[checkAuth] Failed to fetch fresh user data:', error);
            });
        } catch (parseError) {
          // If we can't parse the stored data, clear it
          console.error('Failed to parse stored user data:', parseError);
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // No stored user data, user not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't clear data on error, just set no user if there's no stored data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Ensure address, defaultpaymentmethod, and above_age fields always exist
          if (!('address' in userData)) {
            userData.address = null;
          }
          if (!('defaultpaymentmethod' in userData)) {
            userData.defaultpaymentmethod = null;
          }
          if (!('above_age' in userData)) {
            userData.above_age = false;
          }
          // Save updated user data back to localStorage with the new fields
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch {
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      console.log('[checkAuth] Auth check complete, setting hasCheckedAuth = true, isLoading = false');
      hasCheckedAuth.current = true;
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    if (checkAuthRef.current) {
      await checkAuthRef.current();
    }
  };

  const refreshUserData = async (): Promise<{ address: any; defaultpaymentmethod: any } | null> => {
    try {
      // First, sync from localStorage which may have been updated by profile page
      const storedUser = localStorage.getItem('user');
      let currentUserData = user;
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Update state with localStorage data (includes profile updates like userName)
          currentUserData = { ...user, ...parsedUser };
          setUser(currentUserData);
          console.log('[refreshUserData] Synced user from localStorage:', parsedUser.userName);
        } catch (e) {
          console.error('[refreshUserData] Failed to parse stored user');
        }
      }

      if (!currentUserData?.id) {
        console.log('[refreshUserData] No user logged in');
        return null;
      }

      // Prevent multiple simultaneous calls for address/payment fetch
      if (isRefreshing.current) {
        console.log('[refreshUserData] Already refreshing, skipping address/payment fetch...');
        return { address: currentUserData.address, defaultpaymentmethod: currentUserData.defaultpaymentmethod };
      }

      // Debounce: Don't refresh address/payment if we refreshed less than 2 seconds ago
      const now = Date.now();
      if (now - lastRefreshTime.current < 2000) {
        console.log('[refreshUserData] Refreshed recently, skipping address/payment fetch...');
        return { address: currentUserData.address, defaultpaymentmethod: currentUserData.defaultpaymentmethod };
      }

      isRefreshing.current = true;
      lastRefreshTime.current = now;

      console.log('[refreshUserData] Fetching latest profile/address/payment data for:', currentUserData.id);

      // Fetch profile to get referral fields
      const profileResponse = await apiRequest('GET', `/api/profile/${currentUserData.id}`);
      const profileData = await profileResponse.json();

      // Fetch default address from the correct endpoint
      const addressResponse = await apiRequest('GET', `/api/address/default/address/${currentUserData.id}`);
      const addressResponseData = await addressResponse.json();
      
      // Unwrap the address from the proxy response: { address: {...} }
      const defaultAddress = addressResponseData?.address || null;

      // Fetch payment methods (returns an array)
      const paymentResponse = await apiRequest('GET', `/api/users/paymentmethod/${currentUserData.id}`);
      const paymentMethods = await paymentResponse.json();
      
      // Check if there are any payment methods
      // API returns an array directly, e.g., [] or [{...}, {...}]
      const hasPaymentMethod = Array.isArray(paymentMethods) && paymentMethods.length > 0;
      const defaultPaymentMethod = hasPaymentMethod ? paymentMethods[0] : null;

      // Update user context with fresh data (merge with current user data)
      const updatedUser = {
        ...currentUserData,
        address: defaultAddress || null,
        defaultpaymentmethod: defaultPaymentMethod || null,
        referredBy: profileData?.referredBy || currentUserData.referredBy || '',
        awarded_referal_credit: profileData?.awarded_referal_credit ?? currentUserData.awarded_referal_credit ?? false,
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('[refreshUserData] User data updated:', {
        userName: updatedUser.userName,
        hasAddress: !!updatedUser.address,
        hasPayment: !!updatedUser.defaultpaymentmethod,
        referredBy: updatedUser.referredBy,
        awarded_referal_credit: updatedUser.awarded_referal_credit,
      });

      // Return the fresh data for immediate use
      return { address: defaultAddress, defaultpaymentmethod: defaultPaymentMethod };
    } catch (error) {
      console.error('[refreshUserData] Failed to refresh user data:', error);
      return null;
    } finally {
      isRefreshing.current = false;
    }
  };

  // Handle case where Firebase config is not available - still allow app to load
  useEffect(() => {
    if (!settingsLoading && !isFirebaseReady) {
      console.log('[AuthProvider] Settings loaded but auth not available - checking localStorage');
      // Try to restore user from localStorage even without Firebase
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('accessToken');
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('[AuthProvider] Restored user from localStorage:', parsedUser.id);
          setUser(parsedUser);
        } catch (e) {
          console.error('[AuthProvider] Failed to parse stored user');
        }
      }
      // Stop loading so app can render
      setIsLoading(false);
      hasCheckedAuth.current = true;
    }
  }, [settingsLoading, isFirebaseReady]);

  useEffect(() => {
    // Only set up Firebase listener after Firebase is initialized
    if (!isFirebaseReady) {
      console.log('[AuthProvider] Waiting for auth to be ready...');
      return;
    }

    console.log('[AuthProvider] Auth ready, setting up auth listener');
    
    // Set up Firebase auth state listener (mainly for logout events now)
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('[Auth Listener] Auth state changed, user:', firebaseUser ? 'EXISTS' : 'NONE', 'hasCheckedAuth:', hasCheckedAuth.current);
      
      if (!firebaseUser) {
        // Only clear user if there's no backend session token
        // This prevents email/password users from being logged out when Firebase reports no user
        const storedToken = localStorage.getItem('accessToken');
        if (!storedToken) {
          console.log('[Auth Listener] No auth user and no stored token - clearing user');
          setUser(null);
        } else {
          console.log('[Auth Listener] No auth user but backend session exists - keeping user logged in');
        }
      }
      // Note: Sign-in authentication now handled directly in login functions
      // to properly capture additionalUserInfo
      
      // Only set loading to false after checkAuth has completed
      if (hasCheckedAuth.current) {
        console.log('[Auth Listener] Setting isLoading = false');
        setIsLoading(false);
      } else {
        console.log('[Auth Listener] Waiting for checkAuth to complete...');
      }
    });

    // Check for any pending redirects on app load
    checkAuth();

    return () => unsubscribe();
  }, [isFirebaseReady]);

  // Fetch settings when user is authenticated (to get agerestricted with auth token)
  useEffect(() => {
    if (user && !settingsFetched) {
      console.log('[AuthProvider] User authenticated, fetching settings for age restriction check');
      fetchSettings();
    }
  }, [user, settingsFetched, fetchSettings]);

  // Check if age verification is needed when user is authenticated
  const checkAgeVerification = useCallback(() => {
    // Check both theme.agerestricted (public) and settings.agerestricted (authenticated)
    const isAgeRestricted = theme.agerestricted || settings.agerestricted;
    if (user && isAgeRestricted && !user.above_age) {
      console.log('[AgeVerification] Age restricted content, user has not confirmed age');
      setShowAgeVerification(true);
    } else {
      setShowAgeVerification(false);
    }
  }, [user, theme.agerestricted, settings.agerestricted]);

  // Run age verification check when user or settings change
  useEffect(() => {
    checkAgeVerification();
  }, [checkAgeVerification]);

  // Confirm user is over 18
  const confirmAge = async () => {
    if (!user) return;
    
    try {
      // Call existing user profile update endpoint
      const response = await apiRequest('PATCH', '/api/users/profile', { above_age: true });
      const data = await response.json();
      
      if (data.success) {
        // Update local user state
        const updatedUser = { ...user, above_age: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowAgeVerification(false);
        console.log('[AgeVerification] User confirmed they are over 18');
      } else {
        throw new Error(data.message || 'Failed to confirm age');
      }
    } catch (error) {
      console.error('[AgeVerification] Error confirming age:', error);
      throw error;
    }
  };

  // Decline age verification - log user out
  const declineAge = async () => {
    console.log('[AgeVerification] User declined age verification, logging out');
    setShowAgeVerification(false);
    await logout();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    pendingSocialAuth,
    pendingSocialAuthEmail,
    pendingSocialAuthData,
    showAgeVerification,
    login,
    emailLogin,
    emailSignup,
    loginWithGoogle,
    loginWithApple,
    completeSocialAuth,
    logout,
    checkAuth,
    refreshUserData,
    confirmAge,
    declineAge,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}