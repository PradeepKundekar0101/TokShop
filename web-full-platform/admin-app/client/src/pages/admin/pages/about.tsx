import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { queryClient } from "@/lib/queryClient";
import { Save, Plus, Trash2, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sectionBasedPageSchema, type SectionBasedPage } from "@shared/schema";

const DEFAULT_ABOUT_CONTENT: SectionBasedPage = {
  title: 'About Us',
  subtitle: 'Learn more about our mission and what makes us different',
  sections: [
    { title: 'Our Story', content: 'We started with a simple mission: to create the most engaging and trustworthy live shopping marketplace. Today, thousands of buyers and sellers connect on our platform every day to discover amazing deals and build lasting relationships.' },
    { title: 'Our Mission', content: 'We believe shopping should be fun, social, and exciting. That\'s why we\'ve built a platform that combines the thrill of live auctions with the convenience of online shopping.' },
    { title: 'Why Choose Us', content: 'With buyer protection, secure payments, and a vibrant community of sellers, we\'re committed to providing the best live shopping experience possible.' }
  ],
};

export default function AdminAboutPage() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();

  const { data: pageData, isLoading } = useQuery<any>({
    queryKey: ['/api/content/about'],
  });

  const form = useForm<SectionBasedPage>({
    resolver: zodResolver(sectionBasedPageSchema),
    defaultValues: DEFAULT_ABOUT_CONTENT,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  useEffect(() => {
    if (pageData?.data && pageData.data.title) {
      form.reset(pageData.data);
    }
  }, [pageData, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: SectionBasedPage) => {
      const response = await fetch('/api/admin/content/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update About page');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/about'] });
      toast({
        title: "Success",
        description: "About page updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update About page",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/content/about/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset About page');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset to hardcoded defaults
      form.reset(DEFAULT_ABOUT_CONTENT);
      queryClient.invalidateQueries({ queryKey: ['/api/content/about'] });
      toast({
        title: "Success",
        description: "About page reset to default content",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset About page",
        variant: "destructive",
      });
    },
  });

  const handleSave = form.handleSubmit((data) => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode ? "Cannot modify content in demo mode" : "You don't have permission to modify content",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(data);
  });

  const handleReset = () => {
    if (isDemoMode || !canManageSettings) {
      toast({
        title: "Permission Denied",
        description: isDemoMode ? "Cannot modify content in demo mode" : "You don't have permission to modify content",
        variant: "destructive",
      });
      return;
    }

    if (confirm('Are you sure you want to reset the About page to default content? This cannot be undone.')) {
      resetMutation.mutate();
    }
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <FileText className="h-8 w-8" />
              About Us Page Editor
            </h1>
            <p className="text-muted-foreground">
              Manage the About Us page content
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!canManageSettings || isDemoMode || resetMutation.isPending}
              data-testid="button-reset-default"
            >
              Reset to Default
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending || !canManageSettings || isDemoMode}
              data-testid="button-save"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
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

        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
            <CardDescription>Configure the main title and subtitle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register('title')}
                disabled={!canManageSettings || isDemoMode}
                data-testid="input-title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Input
                id="subtitle"
                {...form.register('subtitle')}
                disabled={!canManageSettings || isDemoMode}
                data-testid="input-subtitle"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Sections</CardTitle>
            <CardDescription>Add and manage page sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Section #{index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={!canManageSettings || isDemoMode || fields.length === 1}
                      data-testid={`button-remove-section-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`sections.${index}.title`}>Section Title</Label>
                    <Input
                      id={`sections.${index}.title`}
                      {...form.register(`sections.${index}.title`)}
                      disabled={!canManageSettings || isDemoMode}
                      data-testid={`input-section-title-${index}`}
                    />
                    {form.formState.errors.sections?.[index]?.title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.sections[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sections.${index}.content`}>Section Content</Label>
                    <Textarea
                      id={`sections.${index}.content`}
                      {...form.register(`sections.${index}.content`)}
                      disabled={!canManageSettings || isDemoMode}
                      className="min-h-48"
                      data-testid={`input-section-content-${index}`}
                    />
                    {form.formState.errors.sections?.[index]?.content && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.sections[index]?.content?.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ title: '', content: '' })}
              disabled={!canManageSettings || isDemoMode}
              className="w-full"
              data-testid="button-add-section"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
