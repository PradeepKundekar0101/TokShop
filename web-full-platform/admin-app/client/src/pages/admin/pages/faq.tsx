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
import { Save, Plus, Trash2, HelpCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { faqContentSchema, type FAQContent } from "@shared/schema";

const DEFAULT_FAQ_CONTENT: FAQContent = {
  title: 'Frequently Asked Questions',
  subtitle: 'Find answers to common questions about our platform',
  faqs: [
    { question: 'How do I create an account?', answer: 'Click on the "Get Started" button and follow the registration process. You can sign up using your email or social media accounts.' },
    { question: 'Is it safe to shop here?', answer: 'Yes! We provide buyer protection on all purchases and use secure payment processing to ensure your transactions are safe.' },
    { question: 'How do live auctions work?', answer: 'Join a live show, browse the items being showcased, and place your bids in real-time. The highest bidder wins when the auction closes.' },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.' }
  ],
};

export default function AdminFAQPage() {
  const { toast } = useToast();
  const { canManageSettings, isDemoMode } = usePermissions();

  const { data: faqData, isLoading } = useQuery<any>({
    queryKey: ['/api/content/faq'],
  });

  const form = useForm<FAQContent>({
    resolver: zodResolver(faqContentSchema),
    defaultValues: DEFAULT_FAQ_CONTENT,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "faqs",
  });

  useEffect(() => {
    if (faqData?.data && faqData.data.title) {
      form.reset(faqData.data);
    }
  }, [faqData, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FAQContent) => {
      const response = await fetch('/api/admin/content/faq', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update FAQ page');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/faq'] });
      toast({
        title: "Success",
        description: "FAQ page updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ page",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/content/faq/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset FAQ page');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Reset to hardcoded defaults
      form.reset(DEFAULT_FAQ_CONTENT);
      queryClient.invalidateQueries({ queryKey: ['/api/content/faq'] });
      toast({
        title: "Success",
        description: "FAQ page reset to default content",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset FAQ page",
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

    if (confirm('Are you sure you want to reset the FAQ page to default content? This cannot be undone.')) {
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
              <HelpCircle className="h-8 w-8" />
              FAQ Page Editor
            </h1>
            <p className="text-muted-foreground">
              Manage frequently asked questions
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
            <CardTitle>FAQ Items</CardTitle>
            <CardDescription>Add and manage frequently asked questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">FAQ #{index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={!canManageSettings || isDemoMode || fields.length === 1}
                      data-testid={`button-remove-faq-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`faqs.${index}.question`}>Question</Label>
                    <Textarea
                      id={`faqs.${index}.question`}
                      {...form.register(`faqs.${index}.question`)}
                      disabled={!canManageSettings || isDemoMode}
                      className="min-h-20"
                      data-testid={`input-faq-question-${index}`}
                    />
                    {form.formState.errors.faqs?.[index]?.question && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.faqs[index]?.question?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`faqs.${index}.answer`}>Answer</Label>
                    <Textarea
                      id={`faqs.${index}.answer`}
                      {...form.register(`faqs.${index}.answer`)}
                      disabled={!canManageSettings || isDemoMode}
                      className="min-h-32"
                      data-testid={`input-faq-answer-${index}`}
                    />
                    {form.formState.errors.faqs?.[index]?.answer && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.faqs[index]?.answer?.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ question: '', answer: '' })}
              disabled={!canManageSettings || isDemoMode}
              className="w-full"
              data-testid="button-add-faq"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
