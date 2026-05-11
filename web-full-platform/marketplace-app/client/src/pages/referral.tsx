import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/share-dialog";
import {
  Link2,
  Copy,
  Check,
  Share2,
  Users,
  CheckCircle,
} from "lucide-react";


export default function ReferralPage() {
  const { user } = useAuth();
  const { theme } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [referralCredit, setReferralCredit] = useState(0);
  const [referralCreditLimit, setReferralCreditLimit] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [referralLogs, setReferralLogs] = useState<any[]>([]);

  const userId = (user as any)?._id || (user as any)?.id || '';
  const websiteUrl = (theme as any)?.website_url || window.location.origin;
  const referralLink = `${websiteUrl}/invite/${userId}`;
  const appName = theme?.app_name || theme?.seo_title || 'the app';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/full', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const s = data.data || data;
          if (s.referral_credit != null) setReferralCredit(s.referral_credit);
          if (s.referral_credit_limit != null) setReferralCreditLimit(s.referral_credit_limit);
        }
      } catch {}
    };

    const fetchStats = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/referral/stats/${userId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setReferralCount(data.count ?? 0);
        }
      } catch {}
    };

    const fetchLogs = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/referral/logs?userId=${userId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.logs)) setReferralLogs(data.logs);
        }
      } catch {}
    };

    fetchSettings();
    fetchStats();
    fetchLogs();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share it with your friends" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    {
      number: 1,
      title: "Invite your community",
      description: "Referred buyers auto follow you and bookmark your next show",
    },
    {
      number: 2,
      title: "When they make a purchase",
      description: `A $${referralCredit} credit will be automatically applied on their first purchase of $${referralCreditLimit}+`,
    },
  ];


  return (
    <div className="w-full lg:w-[90%] mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Get new followers with your referral link!
        </h1>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">How it works</h2>
        <div className="space-y-4 py-2">
          {steps.map((step) => (
            <div key={step.number} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{step.number}</span>
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-muted/50 rounded-full border px-4 py-2">
        <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-sm truncate text-muted-foreground">{referralLink}</span>
        <Button
          onClick={handleCopy}
          size="sm"
          className="rounded-full gap-1.5 flex-shrink-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <Button
        onClick={() => setShareOpen(true)}
        variant="outline"
        className="w-full rounded-full gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share your referral link
      </Button>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={referralLink}
        title={`Join me on ${appName}! Sign up with my link and get $${referralCredit} off your first purchase.`}
        description="Referral Link"
      />

      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground text-lg">{referralCount}</span> {referralCount === 1 ? 'person has' : 'people have'} signed up with your link and earned a ${referralCredit} credit on orders ${referralCreditLimit}+
      </p>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral History
        </h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Credit Used</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {referralLogs.length > 0 ? (
                referralLogs.map((log: any, index: number) => (
                  <tr key={log._id || index} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-foreground">
                      {log.referredUserId?.userName || log.referredUserId?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      {log.referredUserId?.awarded_referal_credit ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          ${referralCredit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No referrals yet. Share your link to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
