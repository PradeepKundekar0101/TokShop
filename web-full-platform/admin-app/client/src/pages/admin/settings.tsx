import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, DollarSign, Key, Package, Link as LinkIcon, Smartphone, ShieldX, Mail, Info, Languages, Plus, Trash2, Download, Upload, Palette, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiConfig, getImageUrl } from "@/lib/use-api-config";

export default function AdminSettings() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [selectedLandingLogoFile, setSelectedLandingLogoFile] = useState<File | null>(null);
  const [isUploadingLandingLogo, setIsUploadingLandingLogo] = useState(false);
  const { externalApiUrl } = useApiConfig();

  const { data: settingsData, isLoading } = useQuery<any>({
    queryKey: ['/api/settings/full'],
  });

  const settings = settingsData?.data || settingsData;

  // Separate query for themes
  const { data: themesData, isLoading: isLoadingThemes } = useQuery<any>({
    queryKey: ['/api/themes'],
  });

  const themes = themesData?.data || themesData;

  // Helper function to mask sensitive keys in demo mode
  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••••••••••';
    return `${key.substring(0, 4)}${'•'.repeat(12)}${key.substring(key.length - 4)}`;
  };

  const [formData, setFormData] = useState({
    app_name: '',
    seo_title: '',
    website_url: '',
    privacy_url: '',
    terms_url: '',
    demoMode: false,
    commission: '',
    stripe_fee: '',
    extra_charges: '',
    referral_credit: '',
    referral_credit_limit: '',
    currency: '$',
    support_email: '',
    forceUpdate: false,
    seller_auto_approve: true,
    appVersion: '',
    androidVersion: '',
    iosVersion: '',
    ios_link: '',
    android_link: '',
    app_scheme: '',
    FIREBASE_API_KEY: '',
    firebase_auth_domain: '',
    firebase_project_id: '',
    firebase_storage_bucket: '',
    firebase_app_id: '',
    shippo_api_key: '',
    stripeSecretKey: '',
    stripepublickey: '',
    stripe_webhook_key: '',
    stripe_platform_webhook_key: '',
    stripe_connect_account: '',
    stripe_service_fee_account: '',
    livekit_url: '',
    livekit_api_key: '',
    livekit_api_secret: '',
    google_api_key: '',
  });

  // Separate state for theme data
  const [themeFormData, setThemeFormData] = useState({
    app_name: '',
    seo_title: '',
    slogan: '',
    primary_color: '',
    secondary_color: '',
    button_color: '',
    button_text_color: '',
    app_logo: '',
    header_logo: '',
    landing_page_logo: '',
    ios_link: '',
    android_link: '',
  });
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Update form data when settings load from API
  useEffect(() => {
    setFormData({
      app_name: settings?.app_name || '',
      seo_title: settings?.seo_title || '',
      website_url: settings?.website_url || '',
      privacy_url: settings?.privacy_url || '',
      terms_url: settings?.terms_url || '',
      demoMode: settings?.demoMode || false,
      commission: settings?.commission || '',
      stripe_fee: settings?.stripe_fee || '',
      extra_charges: settings?.extra_charges || '',
      referral_credit: settings?.referral_credit || '',
      referral_credit_limit: settings?.referral_credit_limit || '',
      currency: settings?.currency || '$',
      support_email: settings?.support_email || '',
      forceUpdate: settings?.forceUpdate || false,
      seller_auto_approve: settings?.seller_auto_approve !== undefined ? settings.seller_auto_approve : true,
      appVersion: settings?.appVersion || '',
      androidVersion: settings?.androidVersion || '',
      iosVersion: settings?.iosVersion || '',
      ios_link: settings?.ios_link || '',
      android_link: settings?.android_link || '',
      app_scheme: settings?.app_scheme || '',
      FIREBASE_API_KEY: settings?.FIREBASE_API_KEY || '',
      firebase_auth_domain: settings?.firebase_config?.authDomain || settings?.firebase_auth_domain || '',
      firebase_project_id: settings?.firebase_config?.projectId || settings?.firebase_project_id || '',
      firebase_storage_bucket: settings?.firebase_config?.storageBucket || settings?.firebase_storage_bucket || '',
      firebase_app_id: settings?.firebase_config?.appId || settings?.firebase_app_id || '',
      shippo_api_key: settings?.shippo_api_key || '',
      stripeSecretKey: settings?.stripeSecretKey || '',
      stripepublickey: settings?.stripepublickey || '',
      stripe_webhook_key: settings?.stripe_webhook_key || '',
      stripe_platform_webhook_key: settings?.stripe_platform_webhook_key || '',
      stripe_connect_account: settings?.stripe_connect_account || '',
      stripe_service_fee_account: settings?.stripe_service_fee_account || '',
      livekit_url: settings?.livekit_url || '',
      livekit_api_key: settings?.livekit_api_key || '',
      livekit_api_secret: settings?.livekit_api_secret || '',
      google_api_key: settings?.google_api_key || '',
    });
  }, [settings]);

  // Update theme form data when themes load from API
  useEffect(() => {
    setThemeFormData({
      app_name: themes?.app_name || '',
      seo_title: themes?.seo_title || '',
      slogan: themes?.slogan || '',
      primary_color: themes?.primary_color || 'FFFACC15',
      secondary_color: themes?.secondary_color || 'FF0D9488',
      button_color: themes?.button_color || 'FF000000',
      button_text_color: themes?.button_text_color || 'FFFFFFFF',
      app_logo: themes?.app_logo || '',
      header_logo: themes?.header_logo || '',
      landing_page_logo: themes?.landing_page_logo || '',
      ios_link: themes?.ios_link || '',
      android_link: themes?.android_link || '',
    });
  }, [themes]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/full'] });
      toast({
        title: "Settings updated",
        description: "Platform settings have been saved successfully.",
      });
      setIsSaving(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Mutation for updating themes via POST /themes
  const updateThemeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/themes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      toast({
        title: "Theme updated",
        description: "Theme settings have been saved successfully.",
      });
      setIsSavingTheme(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update theme. Please try again.",
        variant: "destructive",
      });
      setIsSavingTheme(false);
    },
  });

  const handleSave = () => {
    if (!canManageSettings) {
      toast({
        title: "Action not allowed",
        description: "Settings cannot be changed in demo mode",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    updateMutation.mutate(formData);
  };

  const handleSaveTheme = () => {
    if (!canManageSettings) {
      toast({
        title: "Action not allowed",
        description: "Settings cannot be changed in demo mode",
        variant: "destructive",
      });
      return;
    }
    setIsSavingTheme(true);
    updateThemeMutation.mutate(themeFormData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleThemeInputChange = (field: string, value: any) => {
    setThemeFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('logo', file);

      const response = await fetch('/api/themes/upload-logo', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();
      console.log('Logo upload response:', result);

      if (result.success) {
        // Handle different response formats from the API
        // The API might return: { data: { logo_url: "..." } } or { data: { app_logo: "..." } } or { data: "..." }
        const logoUrl = result.data?.logo_url || result.data?.app_logo || (typeof result.data === 'string' ? result.data : null);
        console.log('Extracted logo URL:', logoUrl);
        
        if (logoUrl) {
          setThemeFormData(prev => ({
            ...prev,
            app_logo: logoUrl,
          }));
        }
        setSelectedLogoFile(null);
        // Clear the file input
        const fileInput = document.getElementById('app_logo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        toast({
          title: "Logo uploaded",
          description: "App logo has been uploaded. Click 'Save Theme Settings' to apply the change.",
        });
        
        // Don't invalidate themes here - it would overwrite our local state before user saves
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLandingLogoUpload = async (file: File) => {
    setIsUploadingLandingLogo(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('logo', file);

      const response = await fetch('/api/themes/upload-landing-logo', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();
      console.log('Landing logo upload response:', result);

      if (result.success) {
        const logoUrl = result.data?.logo_url || result.data?.landing_page_logo || (typeof result.data === 'string' ? result.data : null);
        console.log('Extracted landing logo URL:', logoUrl);
        
        if (logoUrl) {
          setThemeFormData(prev => ({
            ...prev,
            landing_page_logo: logoUrl,
          }));
        }
        setSelectedLandingLogoFile(null);
        const fileInput = document.getElementById('landing_page_logo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        toast({
          title: "Logo uploaded",
          description: "Landing page logo has been uploaded. Click 'Save Theme Settings' to apply the change.",
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload landing page logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLandingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Platform Settings</h2>
            <p className="text-muted-foreground">Configure platform settings and preferences</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !canManageSettings}
            data-testid="button-save-settings"
          >
            {isSaving ? "Saving..." : isDemoMode ? "Demo Mode - Read Only" : "Save Changes"}
          </Button>
        </div>

        {isDemoMode && (
          <Alert className="mb-6">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              Demo mode is active. All settings are read-only and cannot be modified.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="inline-flex w-full min-w-max sm:w-full sm:min-w-0 sm:grid sm:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="general" data-testid="tab-general" className="flex-shrink-0 sm:flex-shrink">
                <Settings className="h-4 w-4 mr-2 hidden sm:inline" />
                General
              </TabsTrigger>
              <TabsTrigger value="payment" data-testid="tab-payment" className="flex-shrink-0 sm:flex-shrink">
                <DollarSign className="h-4 w-4 mr-2 hidden sm:inline" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="theme" data-testid="tab-theme" className="flex-shrink-0 sm:flex-shrink">
                <Palette className="h-4 w-4 mr-2 hidden sm:inline" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="api-keys" data-testid="tab-api-keys" className="flex-shrink-0 sm:flex-shrink">
                <Key className="h-4 w-4 mr-2 hidden sm:inline" />
                API & Integrations
              </TabsTrigger>
              <TabsTrigger value="app-versions" data-testid="tab-app-versions" className="flex-shrink-0 sm:flex-shrink">
                <Smartphone className="h-4 w-4 mr-2 hidden sm:inline" />
                App Versions
              </TabsTrigger>
              <TabsTrigger value="translations" data-testid="tab-translations" className="flex-shrink-0 sm:flex-shrink">
                <Languages className="h-4 w-4 mr-2 hidden sm:inline" />
                Translations
              </TabsTrigger>
            </TabsList>
          </div>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={formData.support_email}
                      onChange={(e) => handleInputChange('support_email', e.target.value)}
                      placeholder="support@example.com"
                      data-testid="input-support-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency Symbol</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      placeholder="$"
                      data-testid="input-currency"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission">Platform Commission (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    value={formData.commission}
                    onChange={(e) => handleInputChange('commission', e.target.value)}
                    placeholder="5"
                    data-testid="input-commission"
                  />
                  <p className="text-xs text-muted-foreground">
                    Commission percentage charged on transactions
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe_fee">Stripe Fee (%)</Label>
                    <Input
                      id="stripe_fee"
                      type="number"
                      step="0.01"
                      value={formData.stripe_fee}
                      onChange={(e) => handleInputChange('stripe_fee', e.target.value)}
                      placeholder="2.9"
                      data-testid="input-stripe-fee"
                    />
                    <p className="text-xs text-muted-foreground">
                      Stripe processing fee percentage
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extra_charges">Extra Charges (Fixed)</Label>
                    <Input
                      id="extra_charges"
                      type="number"
                      step="0.01"
                      value={formData.extra_charges}
                      onChange={(e) => handleInputChange('extra_charges', e.target.value)}
                      placeholder="0.30"
                      data-testid="input-extra-charges"
                    />
                    <p className="text-xs text-muted-foreground">
                      Fixed additional charges per transaction
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="referral_credit">Referral Credit ($)</Label>
                    <Input
                      id="referral_credit"
                      type="number"
                      step="0.01"
                      value={formData.referral_credit}
                      onChange={(e) => handleInputChange('referral_credit', e.target.value)}
                      placeholder="15"
                      data-testid="input-referral-credit"
                    />
                    <p className="text-xs text-muted-foreground">
                      Credit amount given to referred users
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral_credit_limit">Referral Credit Limit ($)</Label>
                    <Input
                      id="referral_credit_limit"
                      type="number"
                      step="0.01"
                      value={formData.referral_credit_limit}
                      onChange={(e) => handleInputChange('referral_credit_limit', e.target.value)}
                      placeholder="25"
                      data-testid="input-referral-credit-limit"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum order amount to apply the referral credit
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seller Approval Workflow</CardTitle>
                <CardDescription>Control how users become sellers on your platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="seller-auto-approve">Automatic Seller Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, users can become sellers automatically without admin approval. When disabled, admin must manually approve all seller applications.
                    </p>
                  </div>
                  <Switch
                    id="seller-auto-approve"
                    checked={formData.seller_auto_approve}
                    onCheckedChange={(checked) => handleInputChange('seller_auto_approve', checked)}
                    data-testid="switch-seller-auto-approve"
                  />
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {formData.seller_auto_approve ? (
                      <>
                        Automatic approval is <strong>enabled</strong>. Users will become sellers immediately after applying.
                      </>
                    ) : (
                      <>
                        Manual approval is <strong>required</strong>. Admins must review and approve seller applications in the Users section.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Integration</CardTitle>
                <CardDescription>Stripe payment gateway configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripepublickey">Stripe Publishable Key</Label>
                  <Input
                    id="stripepublickey"
                    value={isDemoMode ? maskKey(formData.stripepublickey) : formData.stripepublickey}
                    onChange={(e) => handleInputChange('stripepublickey', e.target.value)}
                    placeholder="pk_test_..."
                    data-testid="input-stripe-public-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                  <Input
                    id="stripeSecretKey"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.stripeSecretKey) : formData.stripeSecretKey}
                    onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                    placeholder="sk_test_..."
                    data-testid="input-stripe-secret-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this key secret and secure
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe_webhook_key">Stripe Webhook Secret</Label>
                  <Input
                    id="stripe_webhook_key"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.stripe_webhook_key) : formData.stripe_webhook_key}
                    onChange={(e) => handleInputChange('stripe_webhook_key', e.target.value)}
                    placeholder="whsec_..."
                    data-testid="input-stripe-webhook-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for verifying webhook events from Stripe Connected Account
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe_platform_webhook_key">Stripe Platform Webhook Key</Label>
                  <Input
                    id="stripe_platform_webhook_key"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.stripe_platform_webhook_key) : formData.stripe_platform_webhook_key}
                    onChange={(e) => handleInputChange('stripe_platform_webhook_key', e.target.value)}
                    placeholder="whsec_..."
                    data-testid="input-stripe-platform-webhook-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for verifying webhook events from Stripe Platform
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe_connect_account">Stripe Connect Account (Shipping Fees)</Label>
                  <Input
                    id="stripe_connect_account"
                    value={formData.stripe_connect_account}
                    onChange={(e) => handleInputChange('stripe_connect_account', e.target.value)}
                    placeholder="acct_..."
                    data-testid="input-stripe-connect-account"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                  />
                  <p className="text-xs text-muted-foreground">
                    Stripe Connect account ID to receive shipping fees
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe_service_fee_account">Stripe Connect Account (Service Fees)</Label>
                  <Input
                    id="stripe_service_fee_account"
                    value={formData.stripe_service_fee_account}
                    onChange={(e) => handleInputChange('stripe_service_fee_account', e.target.value)}
                    placeholder="acct_..."
                    data-testid="input-stripe-service-fee-account"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                  />
                  <p className="text-xs text-muted-foreground">
                    Stripe Connect account ID to receive service fees
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Configure your app name, logo and slogan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">App Name</Label>
                  <Input
                    id="app_name"
                    value={themeFormData.app_name}
                    onChange={(e) => handleThemeInputChange('app_name', e.target.value)}
                    placeholder="Your App Name"
                    data-testid="input-app-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={themeFormData.seo_title}
                    onChange={(e) => handleThemeInputChange('seo_title', e.target.value)}
                    placeholder="Browser title (defaults to App Name if empty)"
                    data-testid="input-seo-title"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will appear in the browser tab. If empty, the app name will be used.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app_logo">App Logo</Label>
                  <div className="flex items-start gap-4">
                    {themeFormData.app_logo && (
                      <div className="flex-shrink-0">
                        {(() => {
                          const logoSrc = themeFormData.app_logo.startsWith('http') 
                            ? themeFormData.app_logo 
                            : `${externalApiUrl}/${themeFormData.app_logo.replace(/^\//, '')}`;
                          console.log('Logo preview URL:', logoSrc, 'from:', themeFormData.app_logo, 'baseUrl:', externalApiUrl);
                          return (
                            <img 
                              src={logoSrc} 
                              alt="App Logo" 
                              className="h-20 w-20 object-contain rounded border border-border bg-muted p-2"
                              onError={(e) => {
                                console.log('Logo image failed to load:', logoSrc);
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Logo</text></svg>';
                              }}
                            />
                          );
                        })()}
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="app_logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedLogoFile(file);
                            }
                          }}
                          data-testid="input-app-logo"
                          className="cursor-pointer flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (selectedLogoFile) {
                              handleLogoUpload(selectedLogoFile);
                            } else {
                              toast({
                                title: "No file selected",
                                description: "Please select a logo file first.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={!selectedLogoFile || isUploadingLogo}
                          data-testid="button-upload-logo"
                        >
                          {isUploadingLogo ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select a logo file and click Upload (PNG, JPG, or SVG recommended)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landing_page_logo">Landing Page Logo</Label>
                  <div className="flex items-start gap-4">
                    {themeFormData.landing_page_logo && (
                      <div className="flex-shrink-0">
                        {(() => {
                          const logoSrc = themeFormData.landing_page_logo.startsWith('http') 
                            ? themeFormData.landing_page_logo 
                            : `${externalApiUrl}/${themeFormData.landing_page_logo.replace(/^\//, '')}`;
                          return (
                            <img 
                              src={logoSrc} 
                              alt="Landing Page Logo" 
                              className="h-20 w-20 object-contain rounded border border-border bg-muted p-2"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Logo</text></svg>';
                              }}
                            />
                          );
                        })()}
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="landing_page_logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedLandingLogoFile(file);
                            }
                          }}
                          data-testid="input-landing-page-logo"
                          className="cursor-pointer flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (selectedLandingLogoFile) {
                              handleLandingLogoUpload(selectedLandingLogoFile);
                            } else {
                              toast({
                                title: "No file selected",
                                description: "Please select a logo file first.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={!selectedLandingLogoFile || isUploadingLandingLogo}
                          data-testid="button-upload-landing-logo"
                        >
                          {isUploadingLandingLogo ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Logo displayed on the landing page (PNG, JPG, or SVG recommended)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slogan">Slogan</Label>
                  <Input
                    id="slogan"
                    value={themeFormData.slogan}
                    onChange={(e) => handleThemeInputChange('slogan', e.target.value)}
                    placeholder="Your app tagline or slogan"
                    data-testid="input-slogan"
                  />
                  <p className="text-xs text-muted-foreground">
                    A short tagline that appears with your brand
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    data-testid="input-website-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your main website URL
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>App Theme Colors</CardTitle>
                <CardDescription>Configure colors for your mobile app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color_theme">Primary Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-12 h-10 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: themeFormData.primary_color ? `#${themeFormData.primary_color.slice(-6)}` : '#FACC15' }}
                      />
                      <Input
                        id="primary_color_theme"
                        value={themeFormData.primary_color}
                        onChange={(e) => handleThemeInputChange('primary_color', e.target.value.toUpperCase())}
                        placeholder="FFFACC15"
                        data-testid="input-primary-color-theme"
                        maxLength={8}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: AARRGGBB (e.g., FFFACC15 for yellow)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color_theme">Secondary Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-12 h-10 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: themeFormData.secondary_color ? `#${themeFormData.secondary_color.slice(-6)}` : '#0D9488' }}
                      />
                      <Input
                        id="secondary_color_theme"
                        value={themeFormData.secondary_color}
                        onChange={(e) => handleThemeInputChange('secondary_color', e.target.value.toUpperCase())}
                        placeholder="FF0D9488"
                        data-testid="input-secondary-color-theme"
                        maxLength={8}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: AARRGGBB (e.g., FF0D9488 for teal)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="button_color">Button Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-12 h-10 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: themeFormData.button_color ? `#${themeFormData.button_color.slice(-6)}` : '#000000' }}
                      />
                      <Input
                        id="button_color"
                        value={themeFormData.button_color}
                        onChange={(e) => handleThemeInputChange('button_color', e.target.value.toUpperCase())}
                        placeholder="FF000000"
                        data-testid="input-button-color"
                        maxLength={8}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: AARRGGBB (e.g., FF000000 for black)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="button_text_color">Button Text Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-12 h-10 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: themeFormData.button_text_color ? `#${themeFormData.button_text_color.slice(-6)}` : '#FFFFFF' }}
                      />
                      <Input
                        id="button_text_color"
                        value={themeFormData.button_text_color}
                        onChange={(e) => handleThemeInputChange('button_text_color', e.target.value.toUpperCase())}
                        placeholder="FFFFFFFF"
                        data-testid="input-button-text-color"
                        maxLength={8}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: AARRGGBB (e.g., FFFFFFFF for white)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal Links</CardTitle>
                <CardDescription>Privacy policy and terms of service URLs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="privacy_url">Privacy Policy URL</Label>
                  <Input
                    id="privacy_url"
                    type="url"
                    value={formData.privacy_url}
                    onChange={(e) => handleInputChange('privacy_url', e.target.value)}
                    placeholder="https://example.com/privacy"
                    data-testid="input-privacy-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms_url">Terms of Service URL</Label>
                  <Input
                    id="terms_url"
                    type="url"
                    value={formData.terms_url}
                    onChange={(e) => handleInputChange('terms_url', e.target.value)}
                    placeholder="https://example.com/terms"
                    data-testid="input-terms-url"
                  />
                </div>
              </CardContent>
            </Card>

            {!formData.demoMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Demo Mode</CardTitle>
                  <CardDescription>Control whether CRUD operations are allowed on the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="demo-mode">Enable Demo Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, all create, update, and delete operations will be disabled for everyone (including super admins). Perfect for protecting demo environments from modifications.
                      </p>
                    </div>
                    <Switch
                      id="demo-mode"
                      checked={formData.demoMode}
                      onCheckedChange={(checked) => handleInputChange('demoMode', checked)}
                      data-testid="switch-demo-mode"
                    />
                  </div>
                  {formData.demoMode && (
                    <Alert>
                      <ShieldX className="h-4 w-4" />
                      <AlertDescription>
                        Demo mode is currently <strong>enabled</strong>. All CRUD operations are disabled across the platform.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSaveTheme}
                disabled={isSavingTheme || !canManageSettings}
                data-testid="button-save-theme"
              >
                {isSavingTheme ? "Saving..." : "Save Theme Settings"}
              </Button>
            </div>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Firebase Configuration</CardTitle>
                <CardDescription>Configure Firebase for authentication and storage (web apps)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    These settings configure Firebase for your applications. Get these values from your Firebase Console → Project Settings → General → Your apps.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="firebase_auth_domain">Firebase Auth Domain</Label>
                  <Input
                    id="firebase_auth_domain"
                    value={formData.firebase_auth_domain}
                    onChange={(e) => handleInputChange('firebase_auth_domain', e.target.value)}
                    placeholder="your-project.firebaseapp.com"
                    data-testid="input-firebase-auth-domain"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase_project_id">Firebase Project ID</Label>
                  <Input
                    id="firebase_project_id"
                    value={formData.firebase_project_id}
                    onChange={(e) => handleInputChange('firebase_project_id', e.target.value)}
                    placeholder="your-project-id"
                    data-testid="input-firebase-project-id"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase_storage_bucket">Firebase Storage Bucket</Label>
                  <Input
                    id="firebase_storage_bucket"
                    value={formData.firebase_storage_bucket}
                    onChange={(e) => handleInputChange('firebase_storage_bucket', e.target.value)}
                    placeholder="your-project.appspot.com"
                    data-testid="input-firebase-storage-bucket"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase_app_id">Firebase App ID</Label>
                  <Input
                    id="firebase_app_id"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.firebase_app_id) : formData.firebase_app_id}
                    onChange={(e) => handleInputChange('firebase_app_id', e.target.value)}
                    placeholder="1:123456789:web:abc123def456"
                    data-testid="input-firebase-app-id"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this App ID secure
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FIREBASE_API_KEY">Firebase API Key</Label>
                  <Input
                    id="FIREBASE_API_KEY"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.FIREBASE_API_KEY) : formData.FIREBASE_API_KEY}
                    onChange={(e) => handleInputChange('FIREBASE_API_KEY', e.target.value)}
                    placeholder="AIza..."
                    data-testid="input-firebase-api-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    API key for Firebase authentication and storage
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LiveKit Integration</CardTitle>
                <CardDescription>Live streaming platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="livekit_url">LiveKit URL</Label>
                  <Input
                    id="livekit_url"
                    value={formData.livekit_url}
                    onChange={(e) => handleInputChange('livekit_url', e.target.value)}
                    placeholder="wss://your-livekit-url.com"
                    data-testid="input-livekit-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="livekit_api_key">LiveKit API Key</Label>
                  <Input
                    id="livekit_api_key"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.livekit_api_key) : formData.livekit_api_key}
                    onChange={(e) => handleInputChange('livekit_api_key', e.target.value)}
                    placeholder="API..."
                    data-testid="input-livekit-api-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="livekit_api_secret">LiveKit API Secret</Label>
                  <Input
                    id="livekit_api_secret"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.livekit_api_secret) : formData.livekit_api_secret}
                    onChange={(e) => handleInputChange('livekit_api_secret', e.target.value)}
                    placeholder="Secret..."
                    data-testid="input-livekit-api-secret"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    LiveKit credentials for video streaming
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other API Keys</CardTitle>
                <CardDescription>Additional third-party service keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shippo_api_key">Shippo API Key</Label>
                  <Input
                    id="shippo_api_key"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.shippo_api_key) : formData.shippo_api_key}
                    onChange={(e) => handleInputChange('shippo_api_key', e.target.value)}
                    placeholder="shippo_..."
                    data-testid="input-shippo-api-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for shipping label generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_api_key">Google API Key</Label>
                  <Input
                    id="google_api_key"
                    type={isDemoMode ? 'text' : 'password'}
                    value={isDemoMode ? maskKey(formData.google_api_key) : formData.google_api_key}
                    onChange={(e) => handleInputChange('google_api_key', e.target.value)}
                    placeholder="AIza..."
                    data-testid="input-google-api-key"
                    readOnly={isDemoMode}
                    disabled={isDemoMode}
                    onCopy={(e) => isDemoMode && e.preventDefault()}
                    onCut={(e) => isDemoMode && e.preventDefault()}
                    onPaste={(e) => isDemoMode && e.preventDefault()}
                    className={isDemoMode ? 'select-none cursor-not-allowed opacity-60' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for Google services (Maps, Places, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* App Versions */}
          <TabsContent value="app-versions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>App Version Management</CardTitle>
                <CardDescription>Manage mobile app version numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appVersion">App Version</Label>
                  <Input
                    id="appVersion"
                    value={formData.appVersion}
                    onChange={(e) => handleInputChange('appVersion', e.target.value)}
                    placeholder="1.0.0"
                    data-testid="input-app-version"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="androidVersion">Android Version</Label>
                    <Input
                      id="androidVersion"
                      value={formData.androidVersion}
                      onChange={(e) => handleInputChange('androidVersion', e.target.value)}
                      placeholder="1.0.0"
                      data-testid="input-android-version"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iosVersion">iOS Version</Label>
                    <Input
                      id="iosVersion"
                      value={formData.iosVersion}
                      onChange={(e) => handleInputChange('iosVersion', e.target.value)}
                      placeholder="1.0.0"
                      data-testid="input-ios-version"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="android_link">Android App URL (Play Store)</Label>
                    <Input
                      id="android_link"
                      value={formData.android_link}
                      onChange={(e) => handleInputChange('android_link', e.target.value)}
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      data-testid="input-android-link"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ios_link">iOS App URL (App Store)</Label>
                    <Input
                      id="ios_link"
                      value={formData.ios_link}
                      onChange={(e) => handleInputChange('ios_link', e.target.value)}
                      placeholder="https://apps.apple.com/app/..."
                      data-testid="input-ios-link"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app_scheme">Deep Link Scheme</Label>
                  <Input
                    id="app_scheme"
                    value={formData.app_scheme}
                    onChange={(e) => handleInputChange('app_scheme', e.target.value)}
                    placeholder="myapp://"
                    data-testid="input-app-scheme"
                  />
                  <p className="text-xs text-muted-foreground">
                    The URL scheme for deep linking into the mobile app (e.g., myapp://). Used when redirecting users from web to the native app.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="forceUpdate"
                    checked={formData.forceUpdate}
                    onCheckedChange={(checked) => handleInputChange('forceUpdate', checked)}
                    data-testid="switch-force-update"
                  />
                  <Label htmlFor="forceUpdate" className="cursor-pointer">
                    Force App Update
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, users will be required to update the app to continue using it
                </p>
                <p className="text-xs text-muted-foreground">
                  These version numbers are used with the Force Update feature
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={async () => {
                    if (!canManageSettings) {
                      toast({
                        variant: 'destructive',
                        title: 'Permission Denied',
                        description: 'You do not have permission to manage settings',
                      });
                      return;
                    }
                    updateMutation.mutate(formData);
                  }}
                  disabled={updateMutation.isPending}
                  data-testid="save-app-versions"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save App Version Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Translations Tab */}
          <TabsContent value="translations" className="space-y-6">
            <TranslationsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Translations Manager Component
function TranslationsManager() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState<string>('');
  const defaultLanguageInitialized = useRef(false);

  const { data: translationsData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/translations'],
  });

  // Extract new structure: { success, version, default_language, translations }
  const responseData = translationsData?.data || {};
  const translations = responseData.translations || responseData; // Fallback for old structure
  const version = responseData.version;
  const apiDefaultLanguage = responseData.default_language;

  const [translationValues, setTranslationValues] = useState<Record<string, Record<string, string>>>({});
  
  const languages = Object.keys(translationValues);

  useEffect(() => {
    if (translations && Object.keys(translations).length > 0 && Object.keys(translationValues).length === 0) {
      setTranslationValues(translations);
    }
  }, [translations, translationValues]);

  // Only set default language from API once on initial load
  useEffect(() => {
    if (!defaultLanguageInitialized.current && apiDefaultLanguage) {
      setDefaultLanguage(apiDefaultLanguage);
      defaultLanguageInitialized.current = true;
    } else if (!defaultLanguageInitialized.current && languages.length > 0 && !defaultLanguage) {
      // Fallback to first language only if API didn't provide a default
      setDefaultLanguage(languages[0]);
      defaultLanguageInitialized.current = true;
    }
  }, [apiDefaultLanguage, languages, defaultLanguage]);

  // Get all unique keys from all languages
  const allKeys = Array.from(
    new Set(
      Object.values(translationValues).flatMap((lang: any) => Object.keys(lang))
    )
  ).sort();

  const handleAddLanguage = () => {
    if (!newLanguageCode || newLanguageCode.length !== 2) {
      toast({
        title: "Invalid language code",
        description: "Language code must be exactly 2 characters (e.g., 'es', 'fr')",
        variant: "destructive",
      });
      return;
    }

    if (languages.includes(newLanguageCode)) {
      toast({
        title: "Language already exists",
        description: `Language '${newLanguageCode}' is already configured`,
        variant: "destructive",
      });
      return;
    }

    // If this is the first language, create with starter keys
    if (languages.length === 0) {
      const starterKeys: Record<string, string> = {
        app_name: '',
        hi: '',
        home: '',
        profile: '',
        settings: '',
      };
      
      setTranslationValues({
        [newLanguageCode]: starterKeys,
      });
    } else {
      // Copy all keys from English (or first language) with empty values
      const referenceLanguage = translations['en'] || translations[languages[0]] || {};
      const newLanguageTranslations: Record<string, string> = {};
      Object.keys(referenceLanguage).forEach(key => {
        newLanguageTranslations[key] = '';
      });

      setTranslationValues(prev => ({
        ...prev,
        [newLanguageCode]: newLanguageTranslations,
      }));
    }

    setSelectedLanguage(newLanguageCode);
    setNewLanguageCode('');
    setIsAddingLanguage(false);

    toast({
      title: "Language added",
      description: `Language '${newLanguageCode}' has been added. ${languages.length === 0 ? 'Add your translation keys and' : 'Fill in the translations and'} save.`,
    });
  };

  const handleDeleteLanguage = (langCode: string) => {
    if (langCode === 'en') {
      toast({
        title: "Cannot delete English",
        description: "English is the default language and cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    const newTranslations = { ...translationValues };
    delete newTranslations[langCode];
    setTranslationValues(newTranslations);

    if (selectedLanguage === langCode) {
      setSelectedLanguage('en');
    }

    toast({
      title: "Language removed",
      description: `Language '${langCode}' has been removed. Click Save to apply changes.`,
    });
  };

  const handleTranslationChange = (key: string, value: string) => {
    setTranslationValues(prev => ({
      ...prev,
      [selectedLanguage]: {
        ...prev[selectedLanguage],
        [key]: value,
      },
    }));
  };

  const handleSaveTranslations = async () => {
    if (!canManageSettings) {
      toast({
        title: "Action not allowed",
        description: "Settings cannot be changed in demo mode",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiRequest('POST', '/api/admin/translations', {
        translations: translationValues,
        default_language: defaultLanguage,
      });

      if (!response.ok) {
        throw new Error('Failed to save translations');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/admin/translations'] });
      
      toast({
        title: "Translations saved",
        description: "All translations have been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save translations",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadXML = async () => {
    try {
      const response = await fetch('/api/admin/translations/download', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download translations');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'translations.xml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "Your translations XML file is downloading",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download translations",
        variant: "destructive",
      });
    }
  };

  const handleUploadXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      toast({
        title: "Invalid file",
        description: "Please upload an XML file",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/translations/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload translations');
      }

      const data = await response.json();

      queryClient.invalidateQueries({ queryKey: ['/api/admin/translations'] });

      toast({
        title: "Upload successful",
        description: data.message || "Translations imported successfully",
      });

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload translations",
        variant: "destructive",
      });
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no translations exist yet, show an empty state that allows adding first language
  if (languages.length === 0 && !isAddingLanguage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Translations</CardTitle>
          <CardDescription>
            No translations found. Add your first language to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Start by adding English (en) as your default language, then add translation keys.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setIsAddingLanguage(true)} data-testid="button-add-first-language">
            <Plus className="h-4 w-4 mr-2" />
            Add First Language
          </Button>
          
          {isAddingLanguage && (
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Code (e.g., en)"
                value={newLanguageCode}
                onChange={(e) => setNewLanguageCode(e.target.value.toLowerCase())}
                maxLength={2}
                className="w-32"
                data-testid="input-new-language"
              />
              <Button onClick={handleAddLanguage} size="sm" data-testid="button-confirm-add">
                Add
              </Button>
              <Button 
                onClick={() => {
                  setIsAddingLanguage(false);
                  setNewLanguageCode('');
                }} 
                size="sm" 
                variant="ghost"
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>App Translations</CardTitle>
            <CardDescription>
              Manage translations for your mobile app. Download as XML, edit offline, and upload back.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadXML} variant="outline" data-testid="button-download-xml">
              <Download className="h-4 w-4 mr-2" />
              Download XML
            </Button>
            <Button onClick={() => document.getElementById('xml-upload-input')?.click()} variant="outline" data-testid="button-upload-xml">
              <Upload className="h-4 w-4 mr-2" />
              Upload XML
            </Button>
            <input
              id="xml-upload-input"
              type="file"
              accept=".xml"
              onChange={handleUploadXML}
              className="hidden"
              data-testid="input-xml-upload"
            />
            <Button onClick={handleSaveTranslations} disabled={isSaving || !canManageSettings} data-testid="button-save-translations">
              {isSaving ? "Saving..." : isDemoMode ? "Demo Mode - Read Only" : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Translation Info */}
        {version !== undefined && (
          <div className="flex gap-4 text-sm text-muted-foreground border-b pb-4">
            <div>
              <span className="font-medium">Version:</span> {version}
            </div>
          </div>
        )}

        {/* Language Selection and Default Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select Language to Edit</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {lang.toUpperCase()} - {translationValues[lang]?.app_name || 'Language'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Language</Label>
            <Select value={defaultLanguage || languages[0] || 'en'} onValueChange={setDefaultLanguage}>
              <SelectTrigger data-testid="select-default-language">
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {lang.toUpperCase()} - {translationValues[lang]?.app_name || 'Language'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add/Delete Language Actions */}
        <div className="flex gap-4 items-center">

          {!isAddingLanguage ? (
            <Button 
              onClick={() => setIsAddingLanguage(true)} 
              variant="outline"
              data-testid="button-add-language"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Language
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Code (e.g., es)"
                value={newLanguageCode}
                onChange={(e) => setNewLanguageCode(e.target.value.toLowerCase())}
                maxLength={2}
                className="w-32"
                data-testid="input-new-language"
              />
              <Button onClick={handleAddLanguage} size="sm" data-testid="button-confirm-add">
                Add
              </Button>
              <Button 
                onClick={() => {
                  setIsAddingLanguage(false);
                  setNewLanguageCode('');
                }} 
                size="sm" 
                variant="ghost"
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
            </div>
          )}

          {selectedLanguage !== 'en' && (
            <Button
              onClick={() => handleDeleteLanguage(selectedLanguage)}
              variant="destructive"
              size="sm"
              data-testid="button-delete-language"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Translation Keys */}
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Dynamic Placeholders:</strong> Use placeholders like <code className="px-1 py-0.5 bg-muted rounded">@app_name</code>, <code className="px-1 py-0.5 bg-muted rounded">@name</code>, <code className="px-1 py-0.5 bg-muted rounded">@provider</code> in your translations. These will be automatically replaced with actual values in the app.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg">
          <div className="bg-muted px-4 py-3 border-b">
            <p className="text-sm font-medium">
              Editing {selectedLanguage.toUpperCase()} ({allKeys.length} keys)
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <div className="divide-y">
              {allKeys.map((key) => {
                const englishTranslation = translations['en']?.[key];
                const placeholderText = selectedLanguage !== 'en' && englishTranslation
                  ? englishTranslation
                  : `Enter ${selectedLanguage.toUpperCase()} translation for "${key}"`;
                
                return (
                  <div key={key} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="grid gap-2">
                      <Label htmlFor={`trans-${key}`} className="text-xs text-muted-foreground font-mono">
                        {key}
                      </Label>
                      <Input
                        id={`trans-${key}`}
                        value={translationValues[selectedLanguage]?.[key] || ''}
                        onChange={(e) => handleTranslationChange(key, e.target.value)}
                        placeholder={placeholderText}
                        data-testid={`input-translation-${key}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {allKeys.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No translation keys found. Add a language and start adding translations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
