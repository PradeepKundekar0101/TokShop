import { Link } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { type SectionBasedPage } from "@shared/schema";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/use-page-title';

export default function TermsOfService() {
  usePageTitle('Terms of Service');

  const { data, isLoading, error } = useQuery<{ success: boolean; data: SectionBasedPage }>({
    queryKey: ['/api/content/terms'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center" data-testid="loading-state">
          <div className="text-lg text-muted-foreground">Loading Terms of Service...</div>
        </div>
      </div>
    );
  }

  // Validate content - check for empty data object
  const hasValidContent = data?.success && data.data && data.data.title && data.data.sections && data.data.sections.length > 0;

  if (error || !data?.success || !hasValidContent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4" data-testid="error-state">
          <h2 className="text-2xl font-bold mb-4">Content Not Available</h2>
          <p className="text-muted-foreground mb-6">
            The terms of service content hasn't been configured yet. Please contact the administrator to set up the page content.
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
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4" data-testid="text-terms-title">
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="text-muted-foreground mb-8" data-testid="text-terms-subtitle">
            {content.subtitle}
          </p>
        )}

        <div className="space-y-8">
          {content.sections.map((section: { title: string; content: string }, index: number) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4" data-testid={`section-title-${index}`}>
                  {section.title}
                </h2>
                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground"
                  data-testid={`section-content-${index}`}
                >
                  {section.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-4" data-testid="text-questions-heading">
              Questions about our Terms of Service?
            </h3>
            <p className="text-muted-foreground mb-6">
              If you have any questions or concerns about our terms, please contact us.
            </p>
            <Link href="/contact">
              <Button data-testid="button-contact-us">
                Contact Us
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}