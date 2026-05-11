import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useLocation } from "wouter";
import { Loader2, UserPlus, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReferrerInfo {
  firstName?: string;
  lastName?: string;
  userName?: string;
  profilePhoto?: string;
  bio?: string;
}

export default function InvitePage() {
  const params = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [appName, setAppName] = useState("App");
  const [appLogo, setAppLogo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [referralCredit, setReferralCredit] = useState(0);
  const [referralCreditLimit, setReferralCreditLimit] = useState(0);

  const referrerId = params.userId;

  useEffect(() => {
    if (!referrerId) {
      setLocation("/");
      return;
    }

    const alreadyUsedReferral = localStorage.getItem('referral_signup_done');
    if (alreadyUsedReferral) {
      localStorage.removeItem('referredBy');
    }

    if (!alreadyUsedReferral) {
      localStorage.setItem('referredBy', referrerId);
    }

    const fetchData = async () => {
      try {
        const [profileRes, themesRes, configRes, settingsRes] = await Promise.all([
          fetch(`/api/users/public/profile/${referrerId}`),
          fetch('/api/public/themes'),
          fetch('/api/config'),
          fetch('/api/settings/full', { credentials: 'include' })
        ]);

        let apiBaseUrl = '';
        if (configRes.ok) {
          const configData = await configRes.json();
          apiBaseUrl = configData.data?.externalApiUrl || '';
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const userData = profileData.user || profileData.data || profileData;
          setReferrer({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            userName: userData.userName || '',
            profilePhoto: userData.profilePhoto || '',
            bio: userData.bio || '',
          });
        } else {
          setError(true);
        }

        if (themesRes.ok) {
          const themesData = await themesRes.json();
          const themes = themesData.data || themesData;
          setAppName(themes.app_name || themes.seo_title || 'App');
          if (themes.app_logo) {
            setAppLogo(themes.app_logo.startsWith('http') ? themes.app_logo : `${apiBaseUrl}${themes.app_logo.startsWith('/') ? '' : '/'}${themes.app_logo}`);
          }
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const s = settingsData.data || settingsData;
          if (s.referral_credit != null) setReferralCredit(s.referral_credit);
          if (s.referral_credit_limit != null) setReferralCreditLimit(s.referral_credit_limit);
        }
      } catch (e) {
        console.error('Failed to fetch invite data:', e);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [referrerId, setLocation]);

  const handleJoin = () => {
    setLocation(`/signup?ref=${referrerId}`);
  };

  const handleLogin = () => {
    setLocation(`/login?ref=${referrerId}`);
  };

  const referrerName = referrer?.userName || 'Someone';

  const profilePhotoUrl = referrer?.profilePhoto
    ? (referrer.profilePhoto.startsWith('http') ? referrer.profilePhoto : `/api/proxy-image?url=${encodeURIComponent(referrer.profilePhoto)}`)
    : '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {appLogo && (
          <div className="flex justify-center">
            <img src={appLogo} alt={appName} className="h-16 w-auto object-contain" />
          </div>
        )}

        <Card className="shadow-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={referrerName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ${profilePhotoUrl ? 'hidden' : ''}`}>
                  <UserPlus className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {referrerName} invited you!
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-primary/5 rounded-lg p-3">
              <Gift className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Sign up through <span className="font-semibold text-foreground">@{referrerName}</span>'s invite and get a <span className="font-semibold text-primary">${referralCredit}</span> credit on your first purchase of ${referralCreditLimit}+ from them!
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleJoin}
                className="w-full h-12 text-base font-semibold"
              >
                Join {appName}
              </Button>

              <Button
                onClick={handleLogin}
                variant="outline"
                className="w-full h-12 text-base"
              >
                I already have an account
              </Button>
            </div>

            {error && !referrer && (
              <p className="text-xs text-center text-muted-foreground">
                This invite link may have expired or is invalid, but you can still sign up!
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>By joining, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
