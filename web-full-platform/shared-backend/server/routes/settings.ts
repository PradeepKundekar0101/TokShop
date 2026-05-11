import type { Express } from "express";
import { BASE_URL } from "../utils";

export function registerSettingsRoutes(app: Express) {
  // Get Firebase auth keys only (no auth required) - for login page
  app.get("/api/settings/keys", async (req, res) => {
    try {
      const url = `${BASE_URL}/settings/keys`;
      console.log(`Fetching auth keys from: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch settings from API for keys, using empty defaults`);
        return res.json({
          success: true,
          data: {
            firebase_api_key: "",
            firebase_auth_domain: "",
            firebase_project_id: "",
          },
        });
      }

      const data = await response.json();
      const settings = Array.isArray(data) ? data[0] : data;
      
      // Return only Firebase auth keys needed for login
      res.json({
        success: true,
        data: {
          firebase_api_key: settings?.firebase_api_key || settings?.FIREBASE_API_KEY || "",
          firebase_auth_domain: settings?.firebase_auth_domain || "",
          firebase_project_id: settings?.firebase_project_id || "",
        },
      });
    } catch (error: any) {
      console.error("Error fetching auth keys:", error);
      res.json({
        success: true,
        data: {
          firebase_api_key: "",
          firebase_auth_domain: "",
          firebase_project_id: "",
        },
      });
    }
  });

  // Get public theme settings (no auth required) - both /themes and /api/public/themes
  app.get(["/themes", "/api/public/themes"], async (req, res) => {
    try {
      const url = `${BASE_URL}/themes`;
      console.log(`Fetching public themes from: ${url}`);
      
      // Try to get access token from session if available
      const accessToken = req.session?.accessToken;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        // Return default values if API fails
        console.warn(`Failed to fetch themes from API, using defaults`);
        return res.json({
          success: true,
          data: {
            app_name: "",
            slogan: "",
            primary_color: "FFFACC15",
            secondary_color: "FF0D9488",
            button_color: "FF000000",
            button_text_color: "FFFFFFFF",
            app_logo: "",
            header_logo: "",
            landing_page_logo: "",
          },
        });
      }

      const data = await response.json();
      const themes = Array.isArray(data) ? data[0] : data;
      
      // Extract landing_page_logo from resources array if present
      let landingPageLogo = themes?.landing_page_logo || "";
      if (!landingPageLogo && themes?.resources && Array.isArray(themes.resources)) {
        const landingLogoResource = themes.resources.find((r: any) => r.key === 'landing_page_logo');
        if (landingLogoResource) {
          landingPageLogo = landingLogoResource.url;
        }
      }
      
      res.json({
        success: true,
        data: {
          app_name: themes?.app_name || "",
          seo_title: themes?.seo_title || "",
          slogan: themes?.slogan || "",
          primary_color: themes?.primary_color || "FFFACC15",
          secondary_color: themes?.secondary_color || "FF0D9488",
          button_color: themes?.button_color || "FF000000",
          button_text_color: themes?.button_text_color || "FFFFFFFF",
          app_logo: themes?.app_logo || "",
          header_logo: themes?.header_logo || "",
          landing_page_logo: landingPageLogo,
          privacy_url: themes?.privacy_url || themes?.privacyUrl || "",
          terms_url: themes?.terms_url || themes?.termsUrl || "",
          demoMode: themes?.demoMode || themes?.demo_mode || false,
          agerestricted: themes?.agerestricted || false,
          ios_link: themes?.ios_link || themes?.iosLink || themes?.app_store_url || "",
          android_link: themes?.android_link || themes?.androidLink || themes?.play_store_url || "",
          website_url: themes?.website_url || themes?.websiteUrl || "",
          app_scheme: themes?.app_scheme || themes?.appScheme || themes?.deep_link_scheme || "",
        },
      });
    } catch (error: any) {
      console.error("Error fetching public themes:", error);
      // Return default values on error
      res.json({
        success: true,
        data: {
          app_name: "",
          slogan: "",
          primary_color: "FFFACC15",
          secondary_color: "FF0D9488",
          button_color: "FF000000",
          button_text_color: "FFFFFFFF",
          app_logo: "",
          header_logo: "",
          landing_page_logo: "",
        },
      });
    }
  });

  // Get public app settings (branding information)
  app.get("/api/settings", async (req, res) => {
    try {
      // Try to get access token from Authorization header first, then session
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : req.session?.accessToken;
      
      // If no auth, return defaults immediately - don't call external API
      if (!accessToken) {
        return res.json({
          success: true,
          data: {
            app_name: "App",
            seo_title: "",
            support_email: "support@example.com",
            primary_color: "#F4D03F",
            secondary_color: "#1A1A1A",
            stripe_publishable_key: "",
            commission_rate: 0,
            firebase_api_key: "",
            firebase_auth_domain: "",
            firebase_project_id: "",
            firebase_storage_bucket: "",
            firebase_app_id: "",
            demoMode: false,
          },
        });
      }
      
      const url = `${BASE_URL}/settings`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      };
      
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`Failed to fetch settings from API (${response.status}): ${errorText}`);
        // Pass through 401/404 so the frontend can handle token expiry
        if (response.status === 401 || response.status === 404) {
          return res.status(response.status).json({
            success: false,
            error: response.status === 401 ? "Unauthorized" : "Not found",
          });
        }
        // For other errors, return defaults
        return res.json({
          success: true,
          data: {
            app_name: "App",
            seo_title: "",
            support_email: "support@example.com",
            primary_color: "#F4D03F",
            secondary_color: "#1A1A1A",
            stripe_publishable_key: "",
            commission_rate: 0,
            firebase_api_key: "",
            firebase_auth_domain: "",
            firebase_project_id: "",
            firebase_storage_bucket: "",
            firebase_app_id: "",
            demoMode: false,
          },
        });
      }

      const data = await response.json();
      const settings = Array.isArray(data) ? data[0] : data;
      
      // Extract public branding information, Stripe publishable key, and Firebase config
      const publicSettings = {
        app_name: settings?.app_name || "App",
        seo_title: settings?.seo_title || "",
        support_email: settings?.support_email || "support@example.com",
        primary_color: settings?.primary_color || "#F4D03F",
        secondary_color: settings?.secondary_color || "#1A1A1A",
        // API returns 'stripepublickey' not 'stripe_publishable_key'
        stripe_publishable_key: settings?.stripepublickey || settings?.stripe_publishable_key || "",
        commission_rate: parseFloat(settings?.commission || "0"), // API returns 'commission' as string
        // Firebase configuration (individual fields) - check multiple possible field names
        firebase_api_key: settings?.firebase_api_key || settings?.FIREBASE_API_KEY || settings?.firebaseApiKey || settings?.apiKey || "",
        firebase_auth_domain: settings?.firebase_auth_domain || settings?.FIREBASE_AUTH_DOMAIN || settings?.firebaseAuthDomain || settings?.authDomain || "",
        firebase_project_id: settings?.firebase_project_id || settings?.FIREBASE_PROJECT_ID || settings?.firebaseProjectId || settings?.projectId || "",
        firebase_storage_bucket: settings?.firebase_storage_bucket || settings?.FIREBASE_STORAGE_BUCKET || settings?.firebaseStorageBucket || settings?.storageBucket || "",
        firebase_app_id: settings?.firebase_app_id || settings?.FIREBASE_APP_ID || settings?.firebaseAppId || settings?.appId || "",
        // Demo mode flag
        demoMode: settings?.demoMode || false,
        // Age restriction flag
        agerestricted: settings?.agerestricted || false,
        // Legal page URLs
        privacy_url: settings?.privacy_url || "",
        terms_url: settings?.terms_url || "",
      };
      
      res.json({
        success: true,
        data: publicSettings,
      });
    } catch (error: any) {
      console.error("Error fetching public app settings:", error);
      // Return default values on error
      res.json({
        success: true,
        data: {
          app_name: "App",
          seo_title: "",
          support_email: "support@example.com",
          primary_color: "#F4D03F",
          secondary_color: "#1A1A1A",
          stripe_publishable_key: "",
          commission_rate: 0,
          // Firebase configuration - must come from API, no hardcoded defaults
          firebase_api_key: "",
          firebase_auth_domain: "",
          firebase_project_id: "",
          firebase_storage_bucket: "",
          firebase_app_id: "",
          demoMode: false,
        },
      });
    }
  });

  // Get full app settings (proxy to external API)
  app.get("/api/settings/full", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : req.session?.accessToken;

      const url = `${BASE_URL}/settings`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch app settings",
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: Array.isArray(data) ? data[0] : data,
      });
    } catch (error: any) {
      console.error("Error fetching full app settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch app settings",
        details: error.message,
      });
    }
  });

  // Update app settings (proxy to external API)
  app.post("/api/settings", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : req.session?.accessToken;

      const url = `${BASE_URL}/settings`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Settings update error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: "Failed to update app settings",
          details: errorData,
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: data,
      });
    } catch (error: any) {
      console.error("Error updating app settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update app settings",
        details: error.message,
      });
    }
  });
}
