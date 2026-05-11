import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_LANDING_CONTENT } from "@/lib/content-defaults";

export default function AdminLandingPage() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch landing page content from the dedicated endpoint
  const { data: landingData, isLoading: landingLoading } = useQuery<any>({
    queryKey: ['/api/content/landing'],
  });

  const landingContent = landingData?.data || null;

  // Initialize with default content
  const [content, setContent] = useState(DEFAULT_LANDING_CONTENT);

  // Update form when data loads
  useEffect(() => {
    if (landingContent) {
      // Check if it has the new structure
      const hasNewStructure = landingContent.hero && landingContent.joinFun && landingContent.gotItAll && landingContent.deals;
      
      if (hasNewStructure && landingContent.hero?.title) {
        setContent({
          ...DEFAULT_LANDING_CONTENT,
          ...landingContent,
          hero: { ...DEFAULT_LANDING_CONTENT.hero, ...landingContent.hero },
          joinFun: { ...DEFAULT_LANDING_CONTENT.joinFun, ...landingContent.joinFun },
          gotItAll: { ...DEFAULT_LANDING_CONTENT.gotItAll, ...landingContent.gotItAll },
          deals: { ...DEFAULT_LANDING_CONTENT.deals, ...landingContent.deals },
          footer: { ...DEFAULT_LANDING_CONTENT.footer, ...landingContent.footer },
        });
      }
    }
  }, [landingContent]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/admin/content/landing', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/landing'] });
      toast({
        title: "Success",
        description: "Landing page updated successfully",
      });
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update landing page",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode ? "Cannot modify content in demo mode" : "You don't have permission to modify content",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    saveMutation.mutate(content);
  };

  const resetToDefaultMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', '/api/admin/content/landing', DEFAULT_LANDING_CONTENT);
      return response.json();
    },
    onSuccess: () => {
      setContent(DEFAULT_LANDING_CONTENT);
      queryClient.invalidateQueries({ queryKey: ['/api/content/landing'] });
      toast({
        title: "Success",
        description: "Landing page reset to default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset landing page",
        variant: "destructive",
      });
    },
  });

  const handleResetToDefault = () => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode ? "Cannot modify content in demo mode" : "You don't have permission to modify content",
        variant: "destructive",
      });
      return;
    }
    resetToDefaultMutation.mutate();
  };

  if (landingLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Landing Page Editor</h1>
            <p className="text-muted-foreground">
              Customize the 4-section landing page with images and text
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              disabled={!canManageSettings || isDemoMode || resetToDefaultMutation.isPending}
              data-testid="button-reset-default"
            >
              Reset to Default
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !canManageSettings || isDemoMode}
              data-testid="button-save-all"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>

        {isDemoMode && (
          <Alert>
            <AlertDescription>
              Content editing is disabled in demo mode
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Section 1: Hero</TabsTrigger>
            <TabsTrigger value="join-fun">Section 2: Join Fun</TabsTrigger>
            <TabsTrigger value="got-it-all">Section 3: Got It All</TabsTrigger>
            <TabsTrigger value="deals">Section 4: Deals</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 1: Hero (Gradient Background)</CardTitle>
                <CardDescription>
                  Main banner with phone mockups and call-to-action buttons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Text Content</h3>
                  <div className="space-y-2">
                    <Label htmlFor="hero-title">Title</Label>
                    <Input
                      id="hero-title"
                      value={content.hero.title}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="The Live Shopping Marketplace"
                      data-testid="input-hero-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-subtitle">Subtitle</Label>
                    <Textarea
                      id="hero-subtitle"
                      value={content.hero.subtitle}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Shop, sell, and connect around the things you love."
                      data-testid="input-hero-subtitle"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hero-primary-btn">Primary Button Text</Label>
                      <Input
                        id="hero-primary-btn"
                        value={content.hero.primaryButtonText}
                        onChange={(e) => setContent({ ...content, hero: { ...content.hero, primaryButtonText: e.target.value } })}
                        disabled={!canManageSettings || isDemoMode}
                        placeholder="Get Started"
                        data-testid="input-hero-primary-btn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero-primary-link">Primary Button Link</Label>
                      <Input
                        id="hero-primary-link"
                        value={content.hero.primaryButtonLink}
                        onChange={(e) => setContent({ ...content, hero: { ...content.hero, primaryButtonLink: e.target.value } })}
                        disabled={!canManageSettings || isDemoMode}
                        placeholder="/signup"
                        data-testid="input-hero-primary-link"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hero-secondary-btn">Secondary Button Text</Label>
                      <Input
                        id="hero-secondary-btn"
                        value={content.hero.secondaryButtonText}
                        onChange={(e) => setContent({ ...content, hero: { ...content.hero, secondaryButtonText: e.target.value } })}
                        disabled={!canManageSettings || isDemoMode}
                        placeholder="Browse Shows"
                        data-testid="input-hero-secondary-btn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero-secondary-link">Secondary Button Link</Label>
                      <Input
                        id="hero-secondary-link"
                        value={content.hero.secondaryButtonLink}
                        onChange={(e) => setContent({ ...content, hero: { ...content.hero, secondaryButtonLink: e.target.value } })}
                        disabled={!canManageSettings || isDemoMode}
                        placeholder="/marketplace"
                        data-testid="input-hero-secondary-link"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-download">Download Label</Label>
                    <Input
                      id="hero-download"
                      value={content.hero.downloadText}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, downloadText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Download"
                      data-testid="input-hero-download"
                    />
                  </div>
                </div>

                <Separator />

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Main Phone Screenshot</Label>
                      <SingleImageUpload
                        value={content.hero.phoneImage1}
                        onChange={(url) => setContent({ ...content, hero: { ...content.hero, phoneImage1: url } })}
                        label="Upload Main Phone Image"
                        resourceKey="landing-hero-phone1"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-[9/16]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Phone Screenshot</Label>
                      <SingleImageUpload
                        value={content.hero.phoneImage2}
                        onChange={(url) => setContent({ ...content, hero: { ...content.hero, phoneImage2: url } })}
                        label="Upload Secondary Phone Image"
                        resourceKey="landing-hero-phone2"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-[9/16]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>QR Code Image</Label>
                      <SingleImageUpload
                        value={content.hero.qrCodeImage}
                        onChange={(url) => setContent({ ...content, hero: { ...content.hero, qrCodeImage: url } })}
                        label="Upload QR Code"
                        resourceKey="landing-hero-qrcode"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-square"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Join Fun Section */}
          <TabsContent value="join-fun" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 2: Join In the Fun (Dark Background)</CardTitle>
                <CardDescription>
                  Features auctions, flash sales, and giveaways with phone mockup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Text Content</h3>
                  <div className="space-y-2">
                    <Label htmlFor="join-title">Title</Label>
                    <Input
                      id="join-title"
                      value={content.joinFun.title}
                      onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, title: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Join In the Fun"
                      data-testid="input-join-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="join-subtitle">Subtitle</Label>
                    <Textarea
                      id="join-subtitle"
                      value={content.joinFun.subtitle}
                      onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, subtitle: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Take part in fast-paced auctions, incredible flash sales..."
                      data-testid="input-join-subtitle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="join-download">Download Label</Label>
                    <Input
                      id="join-download"
                      value={content.joinFun.downloadText}
                      onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, downloadText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Download"
                      data-testid="input-join-download"
                    />
                  </div>
                </div>

                <Separator />

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Screenshot</Label>
                      <SingleImageUpload
                        value={content.joinFun.phoneImage}
                        onChange={(url) => setContent({ ...content, joinFun: { ...content.joinFun, phoneImage: url } })}
                        label="Upload Phone Image"
                        resourceKey="landing-joinfun-phone"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-[9/16]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>QR Code Image</Label>
                      <SingleImageUpload
                        value={content.joinFun.qrCodeImage}
                        onChange={(url) => setContent({ ...content, joinFun: { ...content.joinFun, qrCodeImage: url } })}
                        label="Upload QR Code"
                        resourceKey="landing-joinfun-qrcode"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-square"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Got It All Section */}
          <TabsContent value="got-it-all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 3: We've Got It All (Dark Background)</CardTitle>
                <CardDescription>
                  Marketplace search and product discovery with phone mockup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Text Content</h3>
                  <div className="space-y-2">
                    <Label htmlFor="got-title">Title</Label>
                    <Input
                      id="got-title"
                      value={content.gotItAll.title}
                      onChange={(e) => setContent({ ...content, gotItAll: { ...content.gotItAll, title: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="We've Got It All"
                      data-testid="input-got-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="got-subtitle">Subtitle</Label>
                    <Textarea
                      id="got-subtitle"
                      value={content.gotItAll.subtitle}
                      onChange={(e) => setContent({ ...content, gotItAll: { ...content.gotItAll, subtitle: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Search our marketplace to find the exact product..."
                      data-testid="input-got-subtitle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="got-download">Download Label</Label>
                    <Input
                      id="got-download"
                      value={content.gotItAll.downloadText}
                      onChange={(e) => setContent({ ...content, gotItAll: { ...content.gotItAll, downloadText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Download"
                      data-testid="input-got-download"
                    />
                  </div>
                </div>

                <Separator />

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Screenshot</Label>
                      <SingleImageUpload
                        value={content.gotItAll.phoneImage}
                        onChange={(url) => setContent({ ...content, gotItAll: { ...content.gotItAll, phoneImage: url } })}
                        label="Upload Phone Image"
                        resourceKey="landing-gotitall-phone"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-[9/16]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>QR Code Image</Label>
                      <SingleImageUpload
                        value={content.gotItAll.qrCodeImage}
                        onChange={(url) => setContent({ ...content, gotItAll: { ...content.gotItAll, qrCodeImage: url } })}
                        label="Upload QR Code"
                        resourceKey="landing-gotitall-qrcode"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-square"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Section */}
          <TabsContent value="deals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section 4: Find Incredible Deals (Gradient Background)</CardTitle>
                <CardDescription>
                  Final call-to-action with trust badge and phone mockup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Text Content</h3>
                  <div className="space-y-2">
                    <Label htmlFor="deals-title">Title</Label>
                    <Input
                      id="deals-title"
                      value={content.deals.title}
                      onChange={(e) => setContent({ ...content, deals: { ...content.deals, title: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Find Incredible Deals on Name Brands"
                      data-testid="input-deals-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deals-subtitle">Subtitle</Label>
                    <Textarea
                      id="deals-subtitle"
                      value={content.deals.subtitle}
                      onChange={(e) => setContent({ ...content, deals: { ...content.deals, subtitle: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="From the brands you love, to hard-to-find specialty products..."
                      data-testid="input-deals-subtitle"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deals-btn">Button Text</Label>
                      <Input
                        id="deals-btn"
                        value={content.deals.buttonText}
                        onChange={(e) => setContent({ ...content, deals: { ...content.deals, buttonText: e.target.value } })}
                        disabled={!canManageSettings || isDemoMode}
                        placeholder="Start Shopping"
                        data-testid="input-deals-btn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deals-link">Button Link</Label>
                      <Input
                        id="deals-link"
                        value={content.deals.buttonLink}
                        onChange={(e) => setContent({ ...content, deals: { ...content.deals, buttonLink: e.target.value } })}
                        disabled={!canManageSettings || isDemoMode}
                        placeholder="/signup"
                        data-testid="input-deals-link"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deals-trust">Trust Badge Text</Label>
                    <Input
                      id="deals-trust"
                      value={content.deals.trustBadgeText}
                      onChange={(e) => setContent({ ...content, deals: { ...content.deals, trustBadgeText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="PEACE OF MIND"
                      data-testid="input-deals-trust"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deals-download">Download Label</Label>
                    <Input
                      id="deals-download"
                      value={content.deals.downloadText}
                      onChange={(e) => setContent({ ...content, deals: { ...content.deals, downloadText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      placeholder="Download"
                      data-testid="input-deals-download"
                    />
                  </div>
                </div>

                <Separator />

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Screenshot</Label>
                      <SingleImageUpload
                        value={content.deals.phoneImage}
                        onChange={(url) => setContent({ ...content, deals: { ...content.deals, phoneImage: url } })}
                        label="Upload Phone Image"
                        resourceKey="landing-deals-phone"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-[9/16]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>QR Code Image</Label>
                      <SingleImageUpload
                        value={content.deals.qrCodeImage}
                        onChange={(url) => setContent({ ...content, deals: { ...content.deals, qrCodeImage: url } })}
                        label="Upload QR Code"
                        resourceKey="landing-deals-qrcode"
                        disabled={!canManageSettings || isDemoMode}
                        aspectRatio="aspect-square"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Section */}
          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Footer</CardTitle>
                <CardDescription>
                  Bottom section with links and copyright
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footer-copyright">Copyright Year</Label>
                  <Input
                    id="footer-copyright"
                    value={content.footer.copyrightText}
                    onChange={(e) => setContent({ ...content, footer: { ...content.footer, copyrightText: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    placeholder="2025"
                    data-testid="input-footer-copyright"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
