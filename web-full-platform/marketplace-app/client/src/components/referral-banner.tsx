import { useState, useEffect } from "react";
import { Gift, X } from "lucide-react";

interface ReferralBannerProps {
  settings: any;
}

export function ReferralBanner({ settings }: ReferralBannerProps) {
  const [visible, setVisible] = useState(false);
  const [credit, setCredit] = useState<number>(0);
  const [minPurchase, setMinPurchase] = useState<number>(0);
  const [referrerName, setReferrerName] = useState<string>("");

  useEffect(() => {
    const shouldShow = sessionStorage.getItem('show_referral_banner');
    if (!shouldShow) return;

    const referrerId = sessionStorage.getItem('referral_referrer_id');

    const fetchData = async () => {
      try {
        const promises: Promise<any>[] = [
          fetch('/api/settings').then(r => r.ok ? r.json() : null)
        ];

        if (referrerId) {
          promises.push(
            fetch(`/api/users/public/profile/${referrerId}`).then(r => r.ok ? r.json() : null)
          );
        }

        const [settingsData, profileData] = await Promise.all(promises);

        if (settingsData) {
          const s = settingsData.data || settingsData;
          setCredit(s.referral_credit ?? 15);
          setMinPurchase(s.referral_credit_limit ?? 25);
        }

        if (profileData) {
          const user = profileData.data || profileData;
          const name = user.userName;
          if (name) setReferrerName(name);
        }

        setVisible(true);
      } catch {
        // ignore
      }
    };

    fetchData();
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.removeItem('show_referral_banner');
    sessionStorage.removeItem('referral_referrer_id');
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/90 to-primary text-primary-foreground px-4 py-2.5 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2 pr-8">
        <Gift className="h-4 w-4 flex-shrink-0" />
        <span>
          You'll get <strong>${credit}</strong> off your first purchase of <strong>${minPurchase}</strong> or more
          {referrerName ? <> from <strong>{referrerName}</strong></> : ''}!
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
