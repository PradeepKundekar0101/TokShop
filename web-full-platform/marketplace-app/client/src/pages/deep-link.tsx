import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeepLink() {
  const params = useParams<{ type: string; id: string }>();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [appName, setAppName] = useState("App");
  const [appScheme, setAppScheme] = useState("app://");

  useEffect(() => {
    fetch("/api/themes")
      .then(res => res.json())
      .then(data => {
        const themes = data.data || data;
        setAppStoreUrl(themes.ios_link || "");
        setPlayStoreUrl(themes.android_link || "");
        setWebsiteUrl(themes.website_url || window.location.origin);
        setAppName(themes.app_name || "App");
        setAppScheme(themes.app_scheme || "app://");
      })
      .catch(() => {
        setWebsiteUrl(window.location.origin);
      });
  }, []);

  const getWebUrl = (type: string, id: string) => {
    switch (type) {
      case "user":
        return `/user?id=${id}`;
      case "product":
        return `/product/${id}`;
      case "show":
        return `/show/${id}`;
      case "giveaway":
        return `/giveaway/${id}`;
      case "auction":
        return `/auction/${id}`;
      default:
        return "/";
    }
  };

  useEffect(() => {
    const { type, id } = params;
    
    if (!type || !id) {
      window.location.replace("/");
      return;
    }

    const userAgent = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(userAgent);
    const android = /Android/i.test(userAgent);
    const mobile = ios || android;

    setIsIOS(ios);
    setIsAndroid(android);
    setIsMobile(mobile);

    if (!mobile) {
      setTimeout(() => {
        window.location.replace(getWebUrl(type, id));
      }, 1000);
      return;
    }

    const referrer = document.referrer;
    const domainHost = websiteUrl ? new URL(websiteUrl).hostname : '';
    const isFromAppDomain = domainHost ? referrer.includes(domainHost) : false;
    const isOnAppDomain = domainHost ? (window.location.hostname === domainHost || 
                             window.location.hostname === `www.${domainHost}`) : false;
    
    if (isOnAppDomain && !isFromAppDomain && websiteUrl) {
      const universalLink = `${websiteUrl}/${type}/${id}`;
      window.location.replace(universalLink);
      
      setTimeout(() => {
        if (document.hasFocus()) {
          setStatus("ready");
        }
      }, 1500);
    } else {
      setStatus("ready");
    }
  }, [params]);

  const handleContinueOnApp = () => {
    const { type, id } = params;
    if (!type || !id) return;
    
    const deepLink = `${appScheme}${type}/${id}`;
    const storeUrl = isIOS ? appStoreUrl : playStoreUrl;
    
    const now = Date.now();
    
    window.location.href = deepLink;
    
    setTimeout(() => {
      if (document.hasFocus() && Date.now() - now < 2000 && storeUrl) {
        window.location.href = storeUrl;
      }
    }, 1500);
  };

  const handleOpenAppStore = () => {
    if (isIOS && appStoreUrl) {
      window.location.href = appStoreUrl;
    } else if (isAndroid && playStoreUrl) {
      window.location.href = playStoreUrl;
    }
  };

  const handleContinueOnWeb = () => {
    const { type, id } = params;
    if (type && id) {
      window.location.replace(getWebUrl(type, id));
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">Loading...</h1>
          <p className="text-muted-foreground text-sm">Please wait while we redirect you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Smartphone className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Open in {appName} App</h1>
          <p className="text-muted-foreground">
            Get the best experience with the {appName} app
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleContinueOnApp}
            className="w-full h-12 text-base font-semibold"
          >
            Continue on {appName}
          </Button>
          
          <Button 
            onClick={handleContinueOnWeb}
            variant="outline"
            className="w-full h-12 text-base"
          >
            Continue on Website
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Don't have the app?{" "}
          <button 
            onClick={handleOpenAppStore}
            className="text-primary underline hover:no-underline"
          >
            {isIOS ? "Download from App Store" : "Download from Google Play"}
          </button>
        </p>
      </div>
    </div>
  );
}
