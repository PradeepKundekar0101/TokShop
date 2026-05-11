import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Save, Eye, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type EmailTemplate, defaultTemplates } from "@/lib/email-template-defaults";

export default function EmailTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [activeTab, setActiveTab] = useState("payment_available");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: "", body: "" });
  const { data: savedTemplatesData, isLoading } = useQuery<any>({
    queryKey: ['/api/templates'],
  });

  useEffect(() => {
    if (!savedTemplatesData?.success) return;
    const apiTemplates = Array.isArray(savedTemplatesData.data)
      ? savedTemplatesData.data
      : savedTemplatesData.data
        ? [savedTemplatesData.data]
        : [];
    if (apiTemplates.length > 0) {
      setTemplates(prev => prev.map(defaultTemplate => {
        const savedTemplate = apiTemplates.find((t: any) => t.slug === defaultTemplate.id);
        if (savedTemplate) {
          return {
            ...defaultTemplate,
            subject: savedTemplate.subject || defaultTemplate.subject,
            body: savedTemplate.htmlContent || defaultTemplate.body,
          };
        }
        return defaultTemplate;
      }));
    }
  }, [savedTemplatesData]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const payload = {
        name: template.name,
        slug: template.id,
        subject: template.subject,
        htmlContent: template.body,
        placeholders: template.variables.map(v => v.name),
      };
      return apiRequest("POST", "/api/templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template saved",
        description: "Email template has been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving template",
        description: error.message || "Failed to save email template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const payload = {
        name: template.name,
        slug: template.id,
        subject: template.subject,
        htmlContent: template.body,
        placeholders: template.variables.map(v => v.name),
      };
      return apiRequest("PUT", `/api/templates/${template.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template updated",
        description: "Email template has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating template",
        description: error.message || "Failed to update email template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully",
      });
      // Switch to first available template
      if (templates.length > 1) {
        const remaining = templates.filter(t => t.id !== activeTab);
        if (remaining.length > 0) {
          setActiveTab(remaining[0].id);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template",
        description: error.message || "Failed to delete email template",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleTemplateChange = (templateId: string, field: 'subject' | 'body', value: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, [field]: value } : t
    ));
  };

  const handleSaveTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Always use POST - API handles both create and update
      saveTemplateMutation.mutate(template);
    }
  };

  const handleResetToDefault = (templateId: string) => {
    const defaultTemplate = defaultTemplates.find(t => t.id === templateId);
    if (defaultTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...defaultTemplate } : t
      ));
      toast({
        title: "Template reset",
        description: "Template has been reset to default. Click 'Save Template' to save changes.",
      });
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    const sampleData: Record<string, string> = {
      name: "John Doe",
      customer_name: "Jane Smith",
      recipient_name: "Jane Smith",
      message: "your order has been confirmed and is being processed.",
      amount: "$245.00",
      order_id: "ORD-12345",
      product_name: "Vintage Watch",
      quantity: "1",
      total_amount: "$55.99",
      carrier: "USPS",
      tracking_number: "9400111899223456789012",
      tracking_url: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223456789012",
      estimated_delivery: "December 28, 2025",
      shipping_address: "123 Main St<br>Anytown, CA 12345",
      app_name: "Your Store",
      support_email: "support@yourstore.com",
      primary_color: "#F43F5E",
      secondary_color: "#0D9488",
      dashboard_url: "#",
      order_url: "#",
      reset_url: "https://yourstore.com/reset-password?token=abc123xyz",
      expiry_time: "1 hour",
      show_title: "Friday Night Live Sale",
      show_time: "December 27, 2025 at 8:00 PM",
      items_sold: "24",
      giveaways: "3",
      shipments: "18",
      total_sales: "$1,245.00",
      tips_received: "$85.50",
      viewers: "156",
      new_followers: "12",
      show_analytics_url: "#",
    };

    let previewSubject = template.subject;
    let previewBody = template.body;

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewSubject = previewSubject.replace(regex, value);
      previewBody = previewBody.replace(regex, value);
    });

    setPreviewContent({ subject: previewSubject, body: previewBody });
    setPreviewOpen(true);
  };

  const currentTemplate = templates.find(t => t.id === activeTab);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Customize the email templates sent to sellers and customers
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <TabsTrigger
                  key={template.id}
                  value={template.id}
                  className="flex items-center gap-2"
                  data-testid={`tab-${template.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {template.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {templates.map((template) => (
            <TabsContent key={template.id} value={template.id}>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            {template.name}
                          </CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {template.recipients.map((recipient) => (
                            <Badge key={recipient} variant="secondary">
                              {recipient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`subject-${template.id}`}>Subject Line</Label>
                        <Input
                          id={`subject-${template.id}`}
                          value={template.subject}
                          onChange={(e) => handleTemplateChange(template.id, 'subject', e.target.value)}
                          placeholder="Email subject"
                          data-testid={`input-subject-${template.id}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`body-${template.id}`}>Email Body</Label>
                        <Textarea
                          id={`body-${template.id}`}
                          value={template.body}
                          onChange={(e) => handleTemplateChange(template.id, 'body', e.target.value)}
                          placeholder="Email body content"
                          className="min-h-[400px] font-mono text-sm"
                          data-testid={`textarea-body-${template.id}`}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleSaveTemplate(template.id)}
                          disabled={saveTemplateMutation.isPending}
                          data-testid={`button-save-${template.id}`}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleResetToDefault(template.id)}
                          data-testid={`button-reset-${template.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset to Default
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                          data-testid={`button-delete-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handlePreview(template)}
                              data-testid={`button-preview-${template.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Email Preview</DialogTitle>
                              <DialogDescription>
                                Preview with sample data and branding colors
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="border rounded-lg p-4 bg-muted/50">
                                <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                                <p className="font-medium">{previewContent.subject}</p>
                              </div>
                              <div className="border rounded-lg overflow-hidden">
                                <iframe
                                  srcDoc={previewContent.body}
                                  title="Email Preview"
                                  className="w-full h-[600px] border-0"
                                  sandbox="allow-same-origin"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Available Variables</CardTitle>
                      <CardDescription>
                        Use these placeholders in your template
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {template.variables.map((variable) => (
                          <div key={variable.name} className="text-sm">
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {"{{" + variable.name + "}}"}
                            </code>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {variable.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
