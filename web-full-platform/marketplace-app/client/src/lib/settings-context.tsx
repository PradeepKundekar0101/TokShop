import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initializeFirebase } from './firebase';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
}

interface AppSettings {
  app_name: string;
  seo_title?: string;
  support_email: string;
  primary_color: string;
  secondary_color: string;
  stripe_publishable_key: string;
  commission_rate: number;
  firebase_config?: FirebaseConfig;
  agerestricted?: boolean;
  privacy_url?: string;
  terms_url?: string;
}

interface ThemeSettings {
  app_name: string;
  seo_title?: string;
  slogan: string;
  primary_color: string;
  secondary_color: string;
  button_color: string;
  button_text_color: string;
  app_logo: string;
  header_logo: string;
  landing_page_logo: string;
  privacy_url?: string;
  terms_url?: string;
  demoMode?: boolean;
  agerestricted?: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  theme: ThemeSettings;
  isLoading: boolean;
  isFirebaseReady: boolean;
  appName: string;
  fetchSettings: () => Promise<void>;
  settingsFetched: boolean;
}

const defaultSettings: AppSettings = {
  app_name: 'TokshopLive',
  seo_title: '',
  support_email: 'support@example.com',
  primary_color: '#F4D03F',
  secondary_color: '#1A1A1A',
  stripe_publishable_key: '',
  commission_rate: 0, // Default 0% commission
};

const defaultTheme: ThemeSettings = {
  app_name: '',
  seo_title: '',
  slogan: '',
  primary_color: 'FFFACC15',
  secondary_color: 'FF0D9488',
  button_color: 'FF000000',
  button_text_color: 'FFFFFFFF',
  app_logo: '',
  header_logo: '',
  landing_page_logo: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  theme: defaultTheme,
  isLoading: true,
  isFirebaseReady: false,
  appName: 'TokshopLive',
  fetchSettings: async () => {},
  settingsFetched: false,
});

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 8-character hex (AARRGGBB or RRGGBBAA format)
  // Strip alpha channel if present
  if (hex.length === 8) {
    // Check if it's AARRGGBB (alpha first) or RRGGBBAA (alpha last)
    // Most mobile formats use AARRGGBB, so we'll handle that
    hex = hex.substring(2); // Remove first 2 chars (alpha channel)
  }
  
  // Convert hex to RGB (now guaranteed to be 6 characters)
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

// Calculate luminance to determine if color is light or dark
function getLuminance(hex: string): number {
  hex = hex.replace('#', '');
  
  // Handle 8-character hex (AARRGGBB format) - strip alpha
  if (hex.length === 8) {
    hex = hex.substring(2); // Remove first 2 chars (alpha channel)
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const rLin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// Apply theme colors to CSS variables
function applyThemeColors(
  primaryColor: string, 
  secondaryColor: string,
  buttonColor?: string,
  buttonTextColor?: string
) {
  console.log('🎨 Applying theme colors:', { primaryColor, secondaryColor, buttonColor, buttonTextColor });
  
  const root = document.documentElement;
  
  // Convert colors to HSL
  const primaryHSL = hexToHSL(primaryColor);
  const secondaryHSL = hexToHSL(secondaryColor);
  
  console.log('🎨 Converted to HSL:', { primaryHSL, secondaryHSL });
  
  // Determine if primary color is light or dark
  const luminance = getLuminance(primaryColor);
  const isLightColor = luminance > 0.5; // Threshold for light vs dark
  
  console.log('🎨 Luminance:', { luminance, isLightColor });
  
  // Set text color based on background luminance
  // Light backgrounds need dark text, dark backgrounds need light text
  const foregroundColor = isLightColor ? '0 0% 9%' : '0 0% 100%'; // dark or white
  
  // Apply primary color to all primary-related CSS variables
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', foregroundColor);
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--chart-1', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-primary-foreground', foregroundColor);
  root.style.setProperty('--sidebar-ring', primaryHSL);
  
  // Apply secondary color
  const secondaryLuminance = getLuminance(secondaryColor);
  const isSecondaryLight = secondaryLuminance > 0.5;
  const secondaryForeground = isSecondaryLight ? '0 0% 9%' : '0 0% 100%';
  
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--secondary-foreground', secondaryForeground);
  root.style.setProperty('--accent', secondaryHSL);
  root.style.setProperty('--accent-foreground', secondaryForeground);
  root.style.setProperty('--chart-2', secondaryHSL);
  
  // Apply button colors if provided
  if (buttonColor) {
    const buttonHSL = hexToHSL(buttonColor);
    root.style.setProperty('--button', buttonHSL);
    console.log('🎨 Button color applied:', buttonHSL);
  }
  
  if (buttonTextColor) {
    const buttonTextHSL = hexToHSL(buttonTextColor);
    root.style.setProperty('--button-foreground', buttonTextHSL);
    console.log('🎨 Button text color applied:', buttonTextHSL);
  }
  
  console.log('✅ Theme colors applied successfully');
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [settingsFetched, setSettingsFetched] = useState(false);

  // Lazy fetch settings - only called when needed (e.g., login page)
  const fetchSettingsOnDemand = async () => {
    if (settingsFetched) return; // Already fetched
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/settings', { 
        credentials: 'include',
        headers: token ? { 
          'Authorization': `Bearer ${token}`,
          'x-access-token': token
        } : {}
      });
      if (response.status === 401 || response.status === 404) {
        if (token) {
          console.log('[Settings] Token expired or user not found, logging out');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth')) {
            window.location.href = '/login';
          }
          return;
        }
      }
      if (response.ok) {
        const data = await response.json();
        console.log('⚙️ Settings fetched:', data);
        if (data.success && data.data) {
          console.log('⚙️ Settings data:', data.data);
          setSettings(data.data);
          setSettingsFetched(true);
          
          // Build Firebase config from either nested object or individual fields
          let firebaseConfig: FirebaseConfig | undefined;
          
          if (data.data.firebase_config) {
            // Use nested firebase_config object if available
            firebaseConfig = data.data.firebase_config;
            console.log('🔥 Using nested auth config from API');
          } else if (data.data.firebase_auth_domain || data.data.firebase_project_id) {
            // Build from individual fields (from admin panel settings)
            firebaseConfig = {
              apiKey: data.data.firebase_api_key || data.data.FIREBASE_API_KEY || '',
              authDomain: data.data.firebase_auth_domain || '',
              projectId: data.data.firebase_project_id || '',
              storageBucket: data.data.firebase_storage_bucket || '',
              appId: data.data.firebase_app_id || '',
            };
            console.log('🔥 Built auth config from individual fields');
          }
          
          // Initialize Firebase with dynamic config if available
          if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
            console.log('🔥 Initializing auth with config:', { projectId: firebaseConfig.projectId });
            initializeFirebase(firebaseConfig);
            setIsFirebaseReady(true);
          } else {
            console.warn('⚠️ No valid auth config found in settings');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch app settings:', error);
      console.warn('⚠️ Cannot initialize auth without settings');
    }
  };

  // Only fetch themes on mount - settings are lazy loaded
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Fetch theme settings separately
  useEffect(() => {
    async function fetchThemes() {
      try {
        const response = await fetch('/api/public/themes');
        if (response.ok) {
          const data = await response.json();
          console.log('🎨 Themes fetched:', data);
          if (data.success && data.data) {
            console.log('🎨 Theme data:', data.data);
            setTheme(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch theme settings:', error);
      }
    }

    fetchThemes();
  }, []);

  // Apply theme colors when theme settings are loaded
  useEffect(() => {
    if (!isLoading && theme.primary_color && theme.secondary_color) {
      applyThemeColors(
        theme.primary_color, 
        theme.secondary_color,
        theme.button_color,
        theme.button_text_color
      );
    }
  }, [isLoading, theme.primary_color, theme.secondary_color, theme.button_color, theme.button_text_color]);

  const appName = theme.seo_title || theme.app_name || settings.app_name || 'TokshopLive';

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    settings,
    theme,
    isLoading,
    isFirebaseReady,
    appName,
    fetchSettings: fetchSettingsOnDemand,
    settingsFetched,
  }), [settings, theme, isLoading, isFirebaseReady, appName, settingsFetched]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
