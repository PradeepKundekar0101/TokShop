import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, Home, Shield, HelpCircle, Save, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const ICON_OPTIONS = ['Play', 'Zap', 'Shield', 'Star', 'TrendingUp'];

export default function AdminContentPages() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch landing page content from the dedicated endpoint
  const { data: landingData, isLoading: landingLoading } = useQuery<any>({
    queryKey: ['/api/content/landing'],
  });

  const landingContent = landingData?.data || null;

  // Initialize with default structure
  const [content, setContent] = useState({
    hero: {
      title: '',
      subtitle: '',
      primaryButtonText: '',
      primaryButtonLink: '',
      secondaryButtonText: '',
      heroImage: '',
      heroImageAlt: '',
      liveViewers: ''
    },
    howItWorks: {
      title: '',
      subtitle: '',
      steps: [
        { icon: 'Play', title: '', description: '' },
        { icon: 'Zap', title: '', description: '' },
        { icon: 'Shield', title: '', description: '' }
      ]
    },
    joinFun: {
      title: '',
      subtitle: '',
      image: '',
      imageAlt: '',
      features: [
        { icon: 'Play', title: '', description: '' }
      ],
      buttonText: '',
      buttonLink: ''
    },
    categories: {
      title: '',
      subtitle: '',
      items: [
        { name: '', image: '' }
      ],
      buttonText: '',
      buttonLink: ''
    },
    brands: {
      title: '',
      subtitle: '',
      items: [
        { name: '', logo: '' }
      ],
      image: '',
      imageAlt: '',
      buttonText: '',
      buttonLink: ''
    },
    finalCTA: {
      title: '',
      subtitle: '',
      buttonText: '',
      buttonLink: ''
    },
    footer: {
      copyrightText: ''
    }
  });

  // Update form when data loads
  useEffect(() => {
    if (landingContent) {
      setContent(landingContent);
    }
  }, [landingContent]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/content/landing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update landing page');
      }
      
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
      const response = await fetch('/api/admin/content/landing/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset landing page');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/landing'] });
      if (data?.data) {
        setContent(data.data);
      }
      toast({
        title: "Success",
        description: "Landing page reset to default content",
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

    if (confirm('Are you sure you want to reset all landing page content to default? This cannot be undone.')) {
      resetToDefaultMutation.mutate();
    }
  };

  if (landingLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Landing Page Editor</h1>
            <p className="text-muted-foreground">
              Customize all sections of the marketplace landing page
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            <TabsTrigger value="join-fun">Join Fun</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="cta">Final CTA</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>
                  Main banner that appears at the top of the landing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Title</Label>
                  <Input
                    id="hero-title"
                    value={content.hero.title}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
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
                    rows={3}
                    data-testid="input-hero-subtitle"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero-primary-btn-text">Primary Button Text</Label>
                    <Input
                      id="hero-primary-btn-text"
                      value={content.hero.primaryButtonText}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, primaryButtonText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-hero-primary-btn-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero-primary-btn-link">Primary Button Link</Label>
                    <Input
                      id="hero-primary-btn-link"
                      value={content.hero.primaryButtonLink}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, primaryButtonLink: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-hero-primary-btn-link"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-secondary-btn-text">Secondary Button Text</Label>
                  <Input
                    id="hero-secondary-btn-text"
                    value={content.hero.secondaryButtonText}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, secondaryButtonText: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-hero-secondary-btn-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-image">Hero Image URL</Label>
                  <Input
                    id="hero-image"
                    value={content.hero.heroImage}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, heroImage: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    placeholder="https://..."
                    data-testid="input-hero-image"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-image-alt">Hero Image Alt Text</Label>
                  <Input
                    id="hero-image-alt"
                    value={content.hero.heroImageAlt}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, heroImageAlt: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-hero-image-alt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-live-viewers">Live Viewers Text</Label>
                  <Input
                    id="hero-live-viewers"
                    value={content.hero.liveViewers}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, liveViewers: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    placeholder="e.g., 12.5K watching"
                    data-testid="input-hero-live-viewers"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* How It Works Section */}
          <TabsContent value="how-it-works" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works Section</CardTitle>
                <CardDescription>
                  Explain the process in 3 simple steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hiw-title">Section Title</Label>
                  <Input
                    id="hiw-title"
                    value={content.howItWorks.title}
                    onChange={(e) => setContent({ ...content, howItWorks: { ...content.howItWorks, title: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-hiw-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hiw-subtitle">Section Subtitle</Label>
                  <Textarea
                    id="hiw-subtitle"
                    value={content.howItWorks.subtitle}
                    onChange={(e) => setContent({ ...content, howItWorks: { ...content.howItWorks, subtitle: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    rows={2}
                    data-testid="input-hiw-subtitle"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Steps (Must have exactly 3)</h3>
                  {content.howItWorks.steps.map((step, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium">Step {index + 1}</h4>

                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Select
                            value={step.icon}
                            onValueChange={(value) => {
                              const newSteps = [...content.howItWorks.steps];
                              newSteps[index] = { ...newSteps[index], icon: value };
                              setContent({ ...content, howItWorks: { ...content.howItWorks, steps: newSteps } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                          >
                            <SelectTrigger data-testid={`select-hiw-step-${index}-icon`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ICON_OPTIONS.map((icon) => (
                                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={step.title}
                            onChange={(e) => {
                              const newSteps = [...content.howItWorks.steps];
                              newSteps[index] = { ...newSteps[index], title: e.target.value };
                              setContent({ ...content, howItWorks: { ...content.howItWorks, steps: newSteps } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            data-testid={`input-hiw-step-${index}-title`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={step.description}
                            onChange={(e) => {
                              const newSteps = [...content.howItWorks.steps];
                              newSteps[index] = { ...newSteps[index], description: e.target.value };
                              setContent({ ...content, howItWorks: { ...content.howItWorks, steps: newSteps } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            rows={3}
                            data-testid={`input-hiw-step-${index}-description`}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Join Fun Section */}
          <TabsContent value="join-fun" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Join In the Fun Section</CardTitle>
                <CardDescription>
                  Highlight exciting features with an engaging image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="jf-title">Section Title</Label>
                  <Input
                    id="jf-title"
                    value={content.joinFun.title}
                    onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, title: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-jf-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jf-subtitle">Section Subtitle</Label>
                  <Textarea
                    id="jf-subtitle"
                    value={content.joinFun.subtitle}
                    onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, subtitle: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    rows={2}
                    data-testid="input-jf-subtitle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jf-image">Section Image URL</Label>
                  <Input
                    id="jf-image"
                    value={content.joinFun.image}
                    onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, image: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    placeholder="https://..."
                    data-testid="input-jf-image"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jf-image-alt">Image Alt Text</Label>
                  <Input
                    id="jf-image-alt"
                    value={content.joinFun.imageAlt}
                    onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, imageAlt: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-jf-image-alt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jf-btn-text">Button Text</Label>
                    <Input
                      id="jf-btn-text"
                      value={content.joinFun.buttonText}
                      onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, buttonText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-jf-btn-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jf-btn-link">Button Link</Label>
                    <Input
                      id="jf-btn-link"
                      value={content.joinFun.buttonLink}
                      onChange={(e) => setContent({ ...content, joinFun: { ...content.joinFun, buttonLink: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-jf-btn-link"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Features</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContent({
                          ...content,
                          joinFun: {
                            ...content.joinFun,
                            features: [...content.joinFun.features, { icon: 'Star', title: '', description: '' }]
                          }
                        });
                      }}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="button-add-jf-feature"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>

                  {content.joinFun.features.map((feature, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Feature {index + 1}</h4>
                          {content.joinFun.features.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newFeatures = content.joinFun.features.filter((_, i) => i !== index);
                                setContent({ ...content, joinFun: { ...content.joinFun, features: newFeatures } });
                              }}
                              disabled={!canManageSettings || isDemoMode}
                              data-testid={`button-remove-jf-feature-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Select
                            value={feature.icon}
                            onValueChange={(value) => {
                              const newFeatures = [...content.joinFun.features];
                              newFeatures[index] = { ...newFeatures[index], icon: value };
                              setContent({ ...content, joinFun: { ...content.joinFun, features: newFeatures } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                          >
                            <SelectTrigger data-testid={`select-jf-feature-${index}-icon`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ICON_OPTIONS.map((icon) => (
                                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => {
                              const newFeatures = [...content.joinFun.features];
                              newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                              setContent({ ...content, joinFun: { ...content.joinFun, features: newFeatures } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            data-testid={`input-jf-feature-${index}-title`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={feature.description}
                            onChange={(e) => {
                              const newFeatures = [...content.joinFun.features];
                              newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                              setContent({ ...content, joinFun: { ...content.joinFun, features: newFeatures } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            rows={2}
                            data-testid={`input-jf-feature-${index}-description`}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Section */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories Section</CardTitle>
                <CardDescription>
                  Showcase your product categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cat-title">Section Title</Label>
                  <Input
                    id="cat-title"
                    value={content.categories.title}
                    onChange={(e) => setContent({ ...content, categories: { ...content.categories, title: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-cat-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-subtitle">Section Subtitle</Label>
                  <Textarea
                    id="cat-subtitle"
                    value={content.categories.subtitle}
                    onChange={(e) => setContent({ ...content, categories: { ...content.categories, subtitle: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    rows={2}
                    data-testid="input-cat-subtitle"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-btn-text">Button Text</Label>
                    <Input
                      id="cat-btn-text"
                      value={content.categories.buttonText}
                      onChange={(e) => setContent({ ...content, categories: { ...content.categories, buttonText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-cat-btn-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cat-btn-link">Button Link</Label>
                    <Input
                      id="cat-btn-link"
                      value={content.categories.buttonLink}
                      onChange={(e) => setContent({ ...content, categories: { ...content.categories, buttonLink: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-cat-btn-link"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Category Items</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContent({
                          ...content,
                          categories: {
                            ...content.categories,
                            items: [...content.categories.items, { name: '', image: '' }]
                          }
                        });
                      }}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="button-add-category"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>

                  {content.categories.items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Category {index + 1}</h4>
                          {content.categories.items.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newItems = content.categories.items.filter((_, i) => i !== index);
                                setContent({ ...content, categories: { ...content.categories, items: newItems } });
                              }}
                              disabled={!canManageSettings || isDemoMode}
                              data-testid={`button-remove-category-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...content.categories.items];
                              newItems[index] = { ...newItems[index], name: e.target.value };
                              setContent({ ...content, categories: { ...content.categories, items: newItems } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            data-testid={`input-category-${index}-name`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input
                            value={item.image}
                            onChange={(e) => {
                              const newItems = [...content.categories.items];
                              newItems[index] = { ...newItems[index], image: e.target.value };
                              setContent({ ...content, categories: { ...content.categories, items: newItems } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            placeholder="https://..."
                            data-testid={`input-category-${index}-image`}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brands Section */}
          <TabsContent value="brands" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brands Section</CardTitle>
                <CardDescription>
                  Feature trusted brands on your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="brands-title">Section Title</Label>
                  <Input
                    id="brands-title"
                    value={content.brands.title}
                    onChange={(e) => setContent({ ...content, brands: { ...content.brands, title: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-brands-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brands-subtitle">Section Subtitle</Label>
                  <Textarea
                    id="brands-subtitle"
                    value={content.brands.subtitle}
                    onChange={(e) => setContent({ ...content, brands: { ...content.brands, subtitle: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    rows={2}
                    data-testid="input-brands-subtitle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brands-image">Section Image URL</Label>
                  <Input
                    id="brands-image"
                    value={content.brands.image}
                    onChange={(e) => setContent({ ...content, brands: { ...content.brands, image: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    placeholder="https://..."
                    data-testid="input-brands-image"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brands-image-alt">Image Alt Text</Label>
                  <Input
                    id="brands-image-alt"
                    value={content.brands.imageAlt}
                    onChange={(e) => setContent({ ...content, brands: { ...content.brands, imageAlt: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-brands-image-alt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brands-btn-text">Button Text</Label>
                    <Input
                      id="brands-btn-text"
                      value={content.brands.buttonText}
                      onChange={(e) => setContent({ ...content, brands: { ...content.brands, buttonText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-brands-btn-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brands-btn-link">Button Link</Label>
                    <Input
                      id="brands-btn-link"
                      value={content.brands.buttonLink}
                      onChange={(e) => setContent({ ...content, brands: { ...content.brands, buttonLink: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-brands-btn-link"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Brand Items</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContent({
                          ...content,
                          brands: {
                            ...content.brands,
                            items: [...content.brands.items, { name: '', logo: '' }]
                          }
                        });
                      }}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="button-add-brand"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Brand
                    </Button>
                  </div>

                  {content.brands.items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Brand {index + 1}</h4>
                          {content.brands.items.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newItems = content.brands.items.filter((_, i) => i !== index);
                                setContent({ ...content, brands: { ...content.brands, items: newItems } });
                              }}
                              disabled={!canManageSettings || isDemoMode}
                              data-testid={`button-remove-brand-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...content.brands.items];
                              newItems[index] = { ...newItems[index], name: e.target.value };
                              setContent({ ...content, brands: { ...content.brands, items: newItems } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            data-testid={`input-brand-${index}-name`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Logo URL (optional)</Label>
                          <Input
                            value={item.logo || ''}
                            onChange={(e) => {
                              const newItems = [...content.brands.items];
                              newItems[index] = { ...newItems[index], logo: e.target.value };
                              setContent({ ...content, brands: { ...content.brands, items: newItems } });
                            }}
                            disabled={!canManageSettings || isDemoMode}
                            placeholder="https://..."
                            data-testid={`input-brand-${index}-logo`}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Final CTA Section */}
          <TabsContent value="cta" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Final Call-to-Action Section</CardTitle>
                <CardDescription>
                  Encourage visitors to take action before leaving
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cta-title">Title</Label>
                  <Input
                    id="cta-title"
                    value={content.finalCTA.title}
                    onChange={(e) => setContent({ ...content, finalCTA: { ...content.finalCTA, title: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    data-testid="input-cta-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta-subtitle">Subtitle</Label>
                  <Textarea
                    id="cta-subtitle"
                    value={content.finalCTA.subtitle}
                    onChange={(e) => setContent({ ...content, finalCTA: { ...content.finalCTA, subtitle: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    rows={2}
                    data-testid="input-cta-subtitle"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta-btn-text">Button Text</Label>
                    <Input
                      id="cta-btn-text"
                      value={content.finalCTA.buttonText}
                      onChange={(e) => setContent({ ...content, finalCTA: { ...content.finalCTA, buttonText: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-cta-btn-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cta-btn-link">Button Link</Label>
                    <Input
                      id="cta-btn-link"
                      value={content.finalCTA.buttonLink}
                      onChange={(e) => setContent({ ...content, finalCTA: { ...content.finalCTA, buttonLink: e.target.value } })}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid="input-cta-btn-link"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Section */}
          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Footer Section</CardTitle>
                <CardDescription>
                  Footer content and copyright information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footer-copyright">Copyright Text</Label>
                  <Input
                    id="footer-copyright"
                    value={content.footer.copyrightText}
                    onChange={(e) => setContent({ ...content, footer: { ...content.footer, copyrightText: e.target.value } })}
                    disabled={!canManageSettings || isDemoMode}
                    placeholder="e.g., 2025"
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
