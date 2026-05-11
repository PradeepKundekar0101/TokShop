import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { type ContactContent } from "@shared/schema";
import { Mail, MessageSquare, Send, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/use-page-title';

export default function ContactUs() {
  const { toast } = useToast();
  usePageTitle('Contact Us');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const { data, isLoading, error } = useQuery<{ success: boolean; data: ContactContent }>({
    queryKey: ['/api/content/contact'],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Message sent!',
          description: result.message || 'Thank you for contacting us. We\'ll get back to you soon.',
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast({
          title: 'Failed to send message',
          description: result.error || 'Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send your message. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center" data-testid="loading-state">
          <div className="text-lg text-muted-foreground">Loading Contact Page...</div>
        </div>
      </div>
    );
  }

  // Validate content - check for empty data object
  const hasValidContent = data?.success && data.data && data.data.title;

  if (error || !data?.success || !hasValidContent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4" data-testid="error-state">
          <h2 className="text-2xl font-bold mb-4">Content Not Available</h2>
          <p className="text-muted-foreground mb-6">
            The contact page content hasn't been configured yet. Please contact the administrator to set up the page content.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const content = data.data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-contact-title">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="text-muted-foreground text-sm sm:text-base mb-2" data-testid="text-contact-subtitle">
              {content.subtitle}
            </p>
          )}
          {content.description && (
            <p className="text-muted-foreground text-sm sm:text-base" data-testid="text-contact-description">
              {content.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Contact Form */}
          {content.showContactForm !== false && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Send us a message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you soon.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                      required
                      data-testid="input-subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      required
                      data-testid="input-message"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Contact Information */}
          <div className={content.showContactForm !== false ? "space-y-6" : "lg:col-span-3 space-y-6"}>
            {content.contactInfo.email && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={`mailto:${content.contactInfo.email}`}
                    className="text-sm font-medium text-primary hover:underline block break-all"
                    data-testid="link-email"
                  >
                    {content.contactInfo.email}
                  </a>
                </CardContent>
              </Card>
            )}

            {content.contactInfo.phone && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Phone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={`tel:${content.contactInfo.phone}`}
                    className="text-sm font-medium text-primary hover:underline block"
                    data-testid="link-phone"
                  >
                    {content.contactInfo.phone}
                  </a>
                </CardContent>
              </Card>
            )}

            {content.contactInfo.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-address">
                    {content.contactInfo.address}
                  </p>
                </CardContent>
              </Card>
            )}

            {content.sections && content.sections.length > 0 && (
              <>
                {content.sections.map((section: { title: string; content: string }, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle data-testid={`section-title-${index}`}>
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-sm whitespace-pre-wrap text-muted-foreground"
                        data-testid={`section-content-${index}`}
                      >
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              <p className="mb-2">
                <strong>Need quick answers?</strong>
              </p>
              <p>
                Check our{' '}
                <Link href="/faq" data-testid="link-faq">
                  <span className="text-primary hover:underline cursor-pointer">
                    FAQ page
                  </span>
                </Link>
                {' '}for answers to common questions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
