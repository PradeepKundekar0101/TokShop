import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsIcon, Save, ShieldX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailSettings() {
  const { toast } = useToast();

  const [emailServiceProvider, setEmailServiceProvider] = useState("mailgun");
  const [emailApiKey, setEmailApiKey] = useState("");
  const [emailFromAddress, setEmailFromAddress] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailReplyTo, setEmailReplyTo] = useState("");
  const [emailMailgunDomain, setEmailMailgunDomain] = useState("");

  const { data: settingsData } = useQuery<any>({
    queryKey: ['/api/settings/full'],
  });

  const settings = settingsData?.data || settingsData;
  const isDemoMode = settings?.demoMode || false;

  useEffect(() => {
    if (settings) {
      setEmailServiceProvider(settings.email_service_provider || 'mailgun');
      setEmailApiKey(settings.email_api_key || '');
      setEmailFromAddress(settings.email_from_address || '');
      setEmailFromName(settings.email_from_name || '');
      setEmailReplyTo(settings.email_reply_to || '');
      setEmailMailgunDomain(settings.email_mailgun_domain || '');
    }
  }, [settings]);

  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/full'] });
      toast({
        title: "Email settings saved",
        description: "Email configuration has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save email settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveEmailSettings = () => {
    if (!emailFromAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "From Address is required",
        variant: "destructive",
      });
      return;
    }

    saveEmailSettingsMutation.mutate({
      email_service_provider: emailServiceProvider,
      email_api_key: emailApiKey,
      email_from_address: emailFromAddress,
      email_from_name: emailFromName,
      email_reply_to: emailReplyTo,
      email_mailgun_domain: emailMailgunDomain,
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {isDemoMode && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <ShieldX className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Email functionality is disabled in demo mode. This page is view-only to prevent sending emails to real users.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Email Service Configuration
            </CardTitle>
            <CardDescription>
              Configure email service provider for sending emails to users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email_service_provider">Email Service Provider</Label>
              <Select
                value={emailServiceProvider}
                onValueChange={setEmailServiceProvider}
                disabled={isDemoMode}
              >
                <SelectTrigger id="email_service_provider" data-testid="select-email-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="brevo">Brevo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email_api_key">API Key</Label>
                <Input
                  id="email_api_key"
                  type={isDemoMode ? 'text' : 'password'}
                  value={emailApiKey}
                  onChange={(e) => setEmailApiKey(e.target.value)}
                  placeholder="Enter API key"
                  data-testid="input-email-api-key"
                  disabled={isDemoMode}
                />
              </div>

              {emailServiceProvider === 'mailgun' && (
                <div className="space-y-2">
                  <Label htmlFor="email_mailgun_domain">Mailgun Domain</Label>
                  <Input
                    id="email_mailgun_domain"
                    value={emailMailgunDomain}
                    onChange={(e) => setEmailMailgunDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    data-testid="input-mailgun-domain"
                    disabled={isDemoMode}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_from_address">From Address *</Label>
                  <Input
                    id="email_from_address"
                    type="email"
                    value={emailFromAddress}
                    onChange={(e) => setEmailFromAddress(e.target.value)}
                    placeholder="noreply@yourdomain.com"
                    data-testid="input-email-from"
                    disabled={isDemoMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_from_name">From Name</Label>
                  <Input
                    id="email_from_name"
                    value={emailFromName}
                    onChange={(e) => setEmailFromName(e.target.value)}
                    placeholder="Your App Name"
                    data-testid="input-email-from-name"
                    disabled={isDemoMode}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_reply_to">Reply-To Address</Label>
                <Input
                  id="email_reply_to"
                  type="email"
                  value={emailReplyTo}
                  onChange={(e) => setEmailReplyTo(e.target.value)}
                  placeholder="support@yourdomain.com"
                  data-testid="input-email-reply-to"
                  disabled={isDemoMode}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveEmailSettings}
              disabled={isDemoMode || saveEmailSettingsMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-save-email-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveEmailSettingsMutation.isPending ? "Saving..." : "Save Email Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
