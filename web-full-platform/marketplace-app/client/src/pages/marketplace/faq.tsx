import { Link } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { type FAQContent } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/settings-context';
import { usePageTitle } from '@/hooks/use-page-title';

export default function FAQ() {
  const { settings } = useSettings();
  usePageTitle('FAQ');

  const { data, isLoading, error } = useQuery<{ success: boolean; data: FAQContent }>({
    queryKey: ['/api/content/faq'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center" data-testid="loading-state">
          <div className="text-lg text-muted-foreground">Loading FAQ...</div>
        </div>
      </div>
    );
  }

  // Validate content - check for empty data object
  const hasValidContent = data?.success && data.data && data.data.title && data.data.faqs && data.data.faqs.length > 0;

  if (error || !data?.success || !hasValidContent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4" data-testid="error-state">
          <h2 className="text-2xl font-bold mb-4">Content Not Available</h2>
          <p className="text-muted-foreground mb-6">
            The FAQ content hasn't been configured yet. Please contact the administrator to set up the page content.
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
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-faq-title">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="text-muted-foreground text-sm sm:text-base" data-testid="text-faq-subtitle">
              {content.subtitle}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {content.faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b last:border-b-0"
                >
                  <AccordionTrigger
                    className="px-4 sm:px-6 py-4 text-left hover:no-underline hover-elevate"
                    data-testid={`faq-question-${index}`}
                  >
                    <span className="font-medium text-sm sm:text-base pr-4">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent 
                    className="px-4 sm:px-6 pb-4 text-sm sm:text-base text-muted-foreground whitespace-pre-wrap"
                    data-testid={`faq-answer-${index}`}
                  >
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Still have questions section */}
        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardContent className="p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-4" data-testid="text-help-heading">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Our support team is here to help. Reach out and we'll get back to you as soon as possible.
            </p>
            <Link href="/contact">
              <Button data-testid="button-contact-us">
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
