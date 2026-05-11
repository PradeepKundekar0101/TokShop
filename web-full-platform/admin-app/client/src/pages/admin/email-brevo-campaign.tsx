import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, Eye, Upload, Plus, Trash2, AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Launch Your Live Shopping Business with Tokshop</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 50px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold;">TOKSHOP</h1>
              <p style="color: #00d4ff; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">Your Own Live Shopping Marketplace</p>
            </td>
          </tr>
          
          <!-- Hero Message -->
          <tr>
            <td style="padding: 40px 30px 20px 30px; text-align: center;">
              <h2 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 26px; line-height: 1.3;">
                Start Your Own Platform Like Whatnot
              </h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.7; margin: 0;">
                Hi {{params.name}},<br><br>
                Live shopping is growing fast - <strong>$68 billion by 2026</strong>. 
                With Tokshop, you get a ready-made platform to start your own live shopping business in days.
              </p>
            </td>
          </tr>
          
          <!-- Stats Bar -->
          <tr>
            <td style="padding: 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
                <tr>
                  <td width="33%" style="padding: 25px 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.2);">
                    <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">$68B</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 5px 0 0 0;">Market by 2026</p>
                  </td>
                  <td width="33%" style="padding: 25px 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.2);">
                    <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">10x</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 5px 0 0 0;">More Sales</p>
                  </td>
                  <td width="33%" style="padding: 25px 10px; text-align: center;">
                    <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">48hrs</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 5px 0 0 0;">To Launch</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 30px 30px 40px 30px; text-align: center;">
              <p style="color: #666666; font-size: 16px; margin: 0 0 25px 0;">
                Want to start your own live shopping business?
              </p>
              <a href="https://wa.me/254791334234?text=Hi%2C%20I%27m%20interested%20in%20Tokshop%20for%20my%20live%20shopping%20business" style="display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);">
                Chat With Us on WhatsApp
              </a>
              <p style="color: #999999; font-size: 13px; margin: 20px 0 0 0;">
                or just reply to this email
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 0 15px 0;">
                Tokshop - Live Shopping Platform
              </p>
              <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 0; line-height: 1.6;">
                You got this email because you showed interest in live shopping.<br>
                <a href="https://tokshoplive.com/unsubscribe" style="color: #00d4ff; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>`;

interface Recipient {
  email: string;
  name?: string;
}

interface SendResult {
  successful: Recipient[];
  failed: { recipient: Recipient; error: string }[];
}

export default function EmailBrevoCampaign() {
  const { toast } = useToast();
  
  const [subject, setSubject] = useState("Launch Your Live Shopping Business with Tokshop");
  const [htmlContent, setHtmlContent] = useState(DEFAULT_EMAIL_TEMPLATE);
  const [senderName, setSenderName] = useState("Tokshop");
  const [senderEmail, setSenderEmail] = useState("sales@tokshoplive.com");
  const [replyToEmail, setReplyToEmail] = useState("reggycodas@gmail.com");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [csvText, setCsvText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, status: "" });
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHeaderRow = (email: string): boolean => {
    const headerPatterns = ['email', 'e-mail', 'email address', 'emailaddress', 'mail', 'recipient'];
    return headerPatterns.some(pattern => email.toLowerCase().includes(pattern)) || !email.includes('@');
  };

  const downloadCSV = (data: Recipient[], filename: string) => {
    const csvContent = "email,name\n" + data.map(r => `${r.email},${r.name || ''}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(line => line.trim());
      const newRecipients: Recipient[] = [];
      const existingEmails = new Set(recipients.map(r => r.email.toLowerCase()));
      let skippedFirst = false;

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        const email = parts[0]?.trim();
        const name = parts[1]?.trim() || undefined;

        if (!skippedFirst) {
          skippedFirst = true;
          if (isHeaderRow(email)) {
            continue;
          }
        }

        if (email && email.includes('@') && email.includes('.') && !existingEmails.has(email.toLowerCase())) {
          newRecipients.push({ email, name });
          existingEmails.add(email.toLowerCase());
        }
      }

      if (newRecipients.length > 0) {
        setRecipients([...recipients, ...newRecipients]);
        toast({
          title: "File imported successfully",
          description: `Added ${newRecipients.length} recipients from ${file.name}`,
        });
      } else {
        toast({
          title: "No new recipients found",
          description: "The file contained no valid new email addresses",
          variant: "destructive",
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const sendEmailsInBatches = async (data: { recipients: Recipient[]; subject: string; htmlContent: string; senderName: string; senderEmail: string; replyToEmail: string }) => {
    const BATCH_SIZE = 50;
    const BATCH_DELAY = 1000;
    const batches: Recipient[][] = [];
    
    for (let i = 0; i < data.recipients.length; i += BATCH_SIZE) {
      batches.push(data.recipients.slice(i, i + BATCH_SIZE));
    }

    const successfulEmails: Recipient[] = [];
    const failedEmails: { recipient: Recipient; error: string }[] = [];

    setIsSending(true);
    setSendResult(null);
    setSendProgress({ current: 0, total: data.recipients.length, status: "Starting..." });

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStart = i * BATCH_SIZE;
      
      setSendProgress({
        current: batchStart,
        total: data.recipients.length,
        status: `Sending batch ${i + 1} of ${batches.length}...`
      });

      try {
        const res = await apiRequest("POST", "/api/admin/brevo/send-batch", {
          recipients: batch,
          subject: data.subject,
          htmlContent: data.htmlContent,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          replyToEmail: data.replyToEmail,
        });
        
        const response = await res.json() as { success: boolean; details?: { successful?: number; failed?: number }; error?: string };

        if (response.success) {
          batch.forEach(recipient => successfulEmails.push(recipient));
        } else {
          const errorMsg = response.error || `Batch ${i + 1} failed`;
          batch.forEach(recipient => failedEmails.push({ recipient, error: errorMsg }));
        }
      } catch (error: any) {
        const errorMsg = error.message || `Batch ${i + 1} error`;
        batch.forEach(recipient => failedEmails.push({ recipient, error: errorMsg }));
      }

      setSendProgress({
        current: batchStart + batch.length,
        total: data.recipients.length,
        status: `Sent ${batchStart + batch.length} of ${data.recipients.length}`
      });

      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }

    setIsSending(false);
    setSendProgress({ current: data.recipients.length, total: data.recipients.length, status: "Complete" });
    
    const result: SendResult = { successful: successfulEmails, failed: failedEmails };
    setSendResult(result);
    setShowResultDialog(true);

    if (successfulEmails.length === 0 && failedEmails.length > 0) {
      throw new Error(`All ${failedEmails.length} emails failed to send. Check your Brevo API key and sender email.`);
    }

    return {
      success: successfulEmails.length > 0,
      message: `Campaign complete: ${successfulEmails.length} sent successfully, ${failedEmails.length} failed`,
      details: { 
        total: data.recipients.length, 
        successful: successfulEmails.length, 
        failed: failedEmails.length,
        successfulEmails,
        failedEmails
      }
    };
  };

  const sendTestMutation = useMutation({
    mutationFn: async (data: { email: string; subject: string; htmlContent: string; senderName: string; senderEmail: string }) => {
      return apiRequest("POST", "/api/admin/brevo/send-test", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test email sent",
        description: data.message || `Email sent to ${testEmail}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send test email",
        description: error.message || "Please check your Brevo API key and try again",
        variant: "destructive",
      });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (data: { recipients: Recipient[]; subject: string; htmlContent: string; senderName: string; senderEmail: string; replyToEmail: string }) => {
      return sendEmailsInBatches(data);
    },
    onSuccess: (data: any) => {
      const hasFailed = data.details?.failed > 0;
      toast({
        title: hasFailed ? "Campaign completed with some failures" : "Campaign sent successfully",
        description: data.message || `Emails sent successfully`,
        variant: hasFailed ? "default" : "default",
      });
    },
    onError: (error: any) => {
      setIsSending(false);
      toast({
        title: "Campaign failed",
        description: error.message || "Please check your settings and try again",
        variant: "destructive",
      });
    },
  });

  const handleAddRecipient = () => {
    if (!newEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (recipients.some(r => r.email === newEmail.trim())) {
      toast({
        title: "Duplicate email",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    setRecipients([...recipients, { email: newEmail.trim(), name: newName.trim() || undefined }]);
    setNewEmail("");
    setNewName("");
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
  };

  const handleImportCSV = () => {
    if (!csvText.trim()) {
      toast({
        title: "No data",
        description: "Please paste CSV data",
        variant: "destructive",
      });
      return;
    }

    const lines = csvText.split('\n').filter(line => line.trim());
    const newRecipients: Recipient[] = [];
    const existingEmails = new Set(recipients.map(r => r.email.toLowerCase()));
    let skippedFirst = false;

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const email = parts[0]?.trim();
      const name = parts[1]?.trim() || undefined;

      if (!skippedFirst) {
        skippedFirst = true;
        if (isHeaderRow(email)) {
          continue;
        }
      }

      if (email && email.includes('@') && email.includes('.') && !existingEmails.has(email.toLowerCase())) {
        newRecipients.push({ email, name });
        existingEmails.add(email.toLowerCase());
      }
    }

    if (newRecipients.length > 0) {
      setRecipients([...recipients, ...newRecipients]);
      setCsvText("");
      toast({
        title: "Import successful",
        description: `Added ${newRecipients.length} recipients`,
      });
    } else {
      toast({
        title: "No new recipients",
        description: "No valid new email addresses found",
        variant: "destructive",
      });
    }
  };

  const handleSendTest = () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    sendTestMutation.mutate({
      email: testEmail.trim(),
      subject,
      htmlContent,
      senderName,
      senderEmail,
    });
  };

  const handleSendCampaign = () => {
    if (recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !htmlContent.trim()) {
      toast({
        title: "Missing content",
        description: "Please provide subject and email content",
        variant: "destructive",
      });
      return;
    }

    sendCampaignMutation.mutate({
      recipients,
      subject,
      htmlContent,
      senderName,
      senderEmail,
      replyToEmail,
    });
  };

  const handleLoadTemplate = async () => {
    try {
      const response = await fetch('/email-preview.html');
      if (response.ok) {
        const template = await response.text();
        setHtmlContent(template);
        toast({
          title: "Template loaded",
          description: "Email template has been loaded",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to load template",
        description: "Could not load the email template",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Brevo Email Campaign
            </h1>
            <p className="text-muted-foreground mt-1">
              Send marketing emails using Brevo (formerly Sendinblue)
            </p>
          </div>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-preview-email">
                <Eye className="h-4 w-4 mr-2" />
                Preview Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
              </DialogHeader>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={htmlContent}
                  title="Email Preview"
                  className="w-full h-[600px] bg-white"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Make sure you have configured your <strong>BREVO_API_KEY</strong> in the environment variables. 
            You can get your API key from the <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="underline text-primary">Brevo dashboard</a>.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="compose" className="space-y-6">
          <TabsList>
            <TabsTrigger value="compose" data-testid="tab-compose">Compose</TabsTrigger>
            <TabsTrigger value="recipients" data-testid="tab-recipients">
              Recipients
              {recipients.length > 0 && (
                <Badge variant="secondary" className="ml-2">{recipients.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Write your email subject and content. Use {"{{params.name}}"} to personalize with recipient's name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    data-testid="input-subject"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="html-content">HTML Content</Label>
                    <Button variant="outline" size="sm" onClick={handleLoadTemplate} data-testid="button-load-template">
                      <Upload className="h-4 w-4 mr-2" />
                      Load Template
                    </Button>
                  </div>
                  <Textarea
                    id="html-content"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Paste your HTML email content here..."
                    rows={15}
                    className="font-mono text-sm"
                    data-testid="textarea-html-content"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Test Email</CardTitle>
                <CardDescription>
                  Send a test email to yourself before sending to all recipients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      data-testid="input-test-email"
                    />
                  </div>
                  <Button
                    onClick={handleSendTest}
                    disabled={sendTestMutation.isPending}
                    data-testid="button-send-test"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendTestMutation.isPending ? "Sending..." : "Send Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Recipients</CardTitle>
                <CardDescription>
                  Add email addresses manually or import from CSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-[1fr,1fr,auto]">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      data-testid="input-new-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (Optional)</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="John Doe"
                      data-testid="input-new-name"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddRecipient} data-testid="button-add-recipient">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label>Upload CSV File</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a CSV file with email addresses (supports 2500+ rows)
                    </p>
                    <div className="flex gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="flex-1"
                        data-testid="input-file-upload"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: email,name (one per line). Header row is optional and will be skipped.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <Label>Or Paste CSV Data</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      For smaller lists, paste directly
                    </p>
                    <Textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="john@example.com,John Doe&#10;jane@example.com,Jane Smith"
                      rows={5}
                      data-testid="textarea-csv"
                    />
                    <Button onClick={handleImportCSV} className="mt-2" variant="outline" data-testid="button-import-csv">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Pasted Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recipients List</CardTitle>
                    <CardDescription>
                      {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} added
                    </CardDescription>
                  </div>
                  {recipients.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRecipients([])}
                      data-testid="button-clear-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recipients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recipients added yet
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {recipients.map((recipient, index) => (
                        <div
                          key={recipient.email}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                          data-testid={`recipient-${index}`}
                        >
                          <div>
                            <p className="font-medium">{recipient.email}</p>
                            {recipient.name && (
                              <p className="text-sm text-muted-foreground">{recipient.name}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRecipient(recipient.email)}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sender Settings</CardTitle>
                <CardDescription>
                  Configure the sender name and email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sender-name">Sender Name</Label>
                    <Input
                      id="sender-name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your Company Name"
                      data-testid="input-sender-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender-email">Sender Email</Label>
                    <Input
                      id="sender-email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="sales@yourcompany.com"
                      data-testid="input-sender-email"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be a verified sender in your Brevo account
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reply-to-email">Reply-To Email</Label>
                    <Input
                      id="reply-to-email"
                      value={replyToEmail}
                      onChange={(e) => setReplyToEmail(e.target.value)}
                      placeholder="replies@yourcompany.com"
                      data-testid="input-reply-to-email"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recipients will reply to this email address
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-primary">
          <CardContent className="pt-6">
            {isSending ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{sendProgress.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {sendProgress.current} of {sendProgress.total} emails sent
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Math.round((sendProgress.current / sendProgress.total) * 100)}%
                  </Badge>
                </div>
                <Progress 
                  value={(sendProgress.current / sendProgress.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Estimated time remaining: ~{Math.ceil((sendProgress.total - sendProgress.current) / 50)} seconds
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {recipients.length > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      Ready to send to {recipients.length.toLocaleString()} recipient{recipients.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {subject || "No subject set"}
                    </p>
                    {recipients.length > 100 && (
                      <p className="text-xs text-muted-foreground">
                        Estimated time: ~{Math.ceil(recipients.length / 50)} seconds ({Math.ceil(recipients.length / 50)} batches)
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={handleSendCampaign}
                  disabled={recipients.length === 0 || sendCampaignMutation.isPending}
                  data-testid="button-send-campaign"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendCampaignMutation.isPending ? "Sending Campaign..." : "Send Campaign"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {sendResult && sendResult.failed.length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                Campaign Results
              </DialogTitle>
            </DialogHeader>
            
            {sendResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-green-600">{sendResult.successful.length.toLocaleString()}</p>
                      <p className="text-sm text-green-700">Sent Successfully</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-red-600">{sendResult.failed.length.toLocaleString()}</p>
                      <p className="text-sm text-red-700">Failed to Send</p>
                    </CardContent>
                  </Card>
                </div>

                {sendResult.successful.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-700">Successful Emails ({sendResult.successful.length})</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadCSV(sendResult.successful, `successful-emails-${new Date().toISOString().split('T')[0]}.csv`)}
                        data-testid="button-download-successful"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>
                    <ScrollArea className="h-[120px] border rounded-lg p-2">
                      <div className="space-y-1">
                        {sendResult.successful.slice(0, 50).map((r, i) => (
                          <div key={i} className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="truncate">{r.email}</span>
                            {r.name && <span className="text-muted-foreground">({r.name})</span>}
                          </div>
                        ))}
                        {sendResult.successful.length > 50 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ... and {sendResult.successful.length - 50} more. Download CSV for full list.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {sendResult.failed.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-red-700">Failed Emails ({sendResult.failed.length})</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadCSV(sendResult.failed.map(f => f.recipient), `failed-emails-${new Date().toISOString().split('T')[0]}.csv`)}
                        data-testid="button-download-failed"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Download Failed CSV
                      </Button>
                    </div>
                    <ScrollArea className="h-[120px] border rounded-lg p-2 border-red-200">
                      <div className="space-y-1">
                        {sendResult.failed.slice(0, 50).map((f, i) => (
                          <div key={i} className="text-sm flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                            <span className="truncate">{f.recipient.email}</span>
                            <span className="text-xs text-red-500 truncate">- {f.error}</span>
                          </div>
                        ))}
                        {sendResult.failed.length > 50 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ... and {sendResult.failed.length - 50} more. Download CSV for full list.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                    <Alert className="mt-4" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You can download the failed emails and retry them by importing the CSV again.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowResultDialog(false)} data-testid="button-close-results">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
