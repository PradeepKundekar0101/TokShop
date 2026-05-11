import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getKnowledgeBaseSections } from "@/data/knowledge-base";
import { useSettings } from "@/lib/settings-context";

export default function KnowledgeBase() {
  const { appName, theme } = useSettings();
  const knowledgeBaseSections = useMemo(() => getKnowledgeBaseSections(appName), [appName]);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSections, setFilteredSections] = useState(knowledgeBaseSections);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Helper function to extract text from React nodes
  const extractTextFromNode = (node: any): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (!node) return '';
    
    // Handle React elements
    if (node.props && node.props.children) {
      return extractTextFromNode(node.props.children);
    }
    
    // Handle arrays
    if (Array.isArray(node)) {
      return node.map(extractTextFromNode).join(' ');
    }
    
    return '';
  };

  // Update filtered sections when knowledge base sections change
  useEffect(() => {
    setFilteredSections(knowledgeBaseSections);
  }, [knowledgeBaseSections]);

  // Filter sections based on search query - includes body text
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSections(knowledgeBaseSections);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = knowledgeBaseSections.filter(section => {
      const titleMatch = section.title.toLowerCase().includes(query);
      const descMatch = section.description.toLowerCase().includes(query);
      const contentMatch = section.content.some(item => {
        const contentTitleMatch = item.title.toLowerCase().includes(query);
        const bodyText = extractTextFromNode(item.body).toLowerCase();
        const bodyMatch = bodyText.includes(query);
        return contentTitleMatch || bodyMatch;
      });
      return titleMatch || descMatch || contentMatch;
    });
    setFilteredSections(filtered);
  }, [searchQuery]);

  // Scroll spy effect - only tracks filtered sections
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      // Only track sections that are currently visible (filtered)
      for (const section of filteredSections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredSections]);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      {theme.demoMode && (
        <div className="bg-primary text-primary-foreground py-2 px-4 text-center">
          <a 
            href="/knowledge-base" 
            className="text-sm font-medium hover:underline"
          >
            You are viewing this app in demo mode. Visit our Knowledge Base to learn more.
          </a>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-knowledge-base-title">
              {appName} Knowledge Base
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Everything you need to know about the live streaming e-commerce platform
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                data-testid="input-knowledge-search"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Contents</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ScrollArea className="h-[calc(100vh-240px)]">
                    <nav className="space-y-1">
                      {filteredSections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover-elevate",
                              activeSection === section.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            data-testid={`button-nav-${section.id}`}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-left truncate">{section.title}</span>
                            {activeSection === section.id && (
                              <ChevronRight className="h-3 w-3 ml-auto flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Mobile Navigation - Accordion */}
          <div className="lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="sections">
                    <AccordionTrigger className="text-sm">
                      Jump to Section
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pt-2">
                        {filteredSections.map((section) => {
                          const Icon = section.icon;
                          return (
                            <button
                              key={section.id}
                              onClick={() => scrollToSection(section.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                activeSection === section.id
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover-elevate"
                              )}
                              data-testid={`button-nav-mobile-${section.id}`}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-left">{section.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <main className="min-w-0">
            {searchQuery && filteredSections.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      No results found for "<strong>{searchQuery}</strong>"
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Try different keywords or browse all topics below
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-primary hover:underline text-sm font-medium"
                      data-testid="button-clear-search"
                    >
                      Clear search and show all topics
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-12">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    ref={(el) => {
                      sectionRefs.current[section.id] = el;
                    }}
                    className="scroll-mt-24"
                    data-testid={`section-${section.id}`}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-muted/30">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-2xl mb-2">{section.title}</CardTitle>
                            <CardDescription className="text-base">
                              {section.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {section.content.length} {section.content.length === 1 ? 'topic' : 'topics'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-8">
                          {section.content.map((item, index) => (
                            <div key={index} className="space-y-3">
                              <h3 className="text-lg font-semibold">{item.title}</h3>
                              <div className="text-muted-foreground leading-relaxed">
                                {typeof item.body === 'string' ? (
                                  <p>{item.body}</p>
                                ) : (
                                  item.body
                                )}
                              </div>
                              {index < section.content.length - 1 && (
                                <div className="border-b pt-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                );
              })}
            </div>

            {/* Footer */}
            {filteredSections.length > 0 && !searchQuery && (
              <Card className="mt-12">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-2">
                    Need more help?
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <a
                      href="/faq"
                      className="text-sm text-primary hover:underline"
                      data-testid="link-faq"
                    >
                      Visit FAQ
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href="/contact"
                      className="text-sm text-primary hover:underline"
                      data-testid="link-contact"
                    >
                      Contact Support
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href="/about"
                      className="text-sm text-primary hover:underline"
                      data-testid="link-about"
                    >
                      About Us
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
