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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { queryClient } from "@/lib/queryClient";
import { Save, Plus, Trash2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { contactContentSchema, type ContactContent } from "@shared/schema";

const DEFAULT_CONTACT_CONTENT: ContactContent = {
  title: 'Contact Us',
  subtitle: 'Get in touch with our team',
  description: 'Have a question or need help? We\'re here for you. Reach out and we\'ll respond as soon as possible.',
  contactInfo: {
    email: 'support@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
  },
  showContactForm: true,
  sections: [
    { title: 'Customer Support', content: 'Our support team is available Monday through Friday, 9am to 5pm EST. We aim to respond to all inquiries within 24 hours.' }
  ],
};

export default function AdminContactPage() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();

  const { data: pageData, isLoading } = useQuery<any>({
    queryKey: ['/api/content/contact'],
  });

  const form = useForm<ContactContent>({
    resolver: zodResolver(contactContentSchema),
    defaultValues: DEFAULT_CONTACT_CONTENT,
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
    mutationFn: async (data: ContactContent) => {
      const response = await fetch('/api/admin/content/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update Contact page');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/contact'] });
      toast({
        title: "Success",
        description: "Contact page updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Contact page",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/content/contact/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset Contact page');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset to hardcoded defaults
      form.reset(DEFAULT_CONTACT_CONTENT);
      queryClient.invalidateQueries({ queryKey: ['/api/content/contact'] });
      toast({
        title: "Success",
        description: "Contact page reset to default content",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset Contact page",
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

    if (confirm('Are you sure you want to reset the Contact page to default content? This cannot be undone.')) {
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
              <Mail className="h-8 w-8" />
              Contact Page Editor
            </h1>
            <p className="text-muted-foreground">
              Manage the Contact Us page content
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
            <CardDescription>Configure the main title and description</CardDescription>
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

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                disabled={!canManageSettings || isDemoMode}
                className="min-h-20"
                data-testid="input-description"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Provide contact details for users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactInfo.email">Email (Optional)</Label>
              <Input
                id="contactInfo.email"
                type="email"
                {...form.register('contactInfo.email')}
                disabled={!canManageSettings || isDemoMode}
                data-testid="input-contact-email"
              />
              {form.formState.errors.contactInfo?.email && (
                <p className="text-sm text-destructive">{form.formState.errors.contactInfo.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo.phone">Phone (Optional)</Label>
              <Input
                id="contactInfo.phone"
                {...form.register('contactInfo.phone')}
                disabled={!canManageSettings || isDemoMode}
                data-testid="input-contact-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo.address">Address (Optional)</Label>
              <Textarea
                id="contactInfo.address"
                {...form.register('contactInfo.address')}
                disabled={!canManageSettings || isDemoMode}
                className="min-h-20"
                data-testid="input-contact-address"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showContactForm"
                checked={form.watch('showContactForm')}
                onCheckedChange={(checked) => form.setValue('showContactForm', checked as boolean)}
                disabled={!canManageSettings || isDemoMode}
                data-testid="checkbox-show-contact-form"
              />
              <Label htmlFor="showContactForm" className="text-sm font-normal">
                Show contact form on the page
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Sections (Optional)</CardTitle>
            <CardDescription>Add extra content sections to the contact page</CardDescription>
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
                      disabled={!canManageSettings || isDemoMode}
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
                      className="min-h-32"
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
