import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Home, HelpCircle, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HelpArticle() {
  const [, params] = useRoute("/help-center/:slug");
  const slug = params?.slug;

  // Fetch article by slug
  const { data, isLoading, error } = useQuery<{ success: boolean; data: Article }>({
    queryKey: [`/api/articles/published/${slug}`],
    enabled: !!slug,
  });

  const article = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-article">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background" data-testid="error-article">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Article not found</h1>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/help-center">
              <Button variant="default" data-testid="button-back-help-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Help Center
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-help-article">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/20 to-primary/10 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/80 mb-6" data-testid="breadcrumb-nav">
            <Link href="/">
              <a className="hover:text-white transition-colors flex items-center gap-1" data-testid="link-home">
                <Home className="h-4 w-4" />
                Home
              </a>
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/help-center">
              <a className="hover:text-white transition-colors flex items-center gap-1" data-testid="link-help-center">
                <HelpCircle className="h-4 w-4" />
                Help Center
              </a>
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white capitalize" data-testid="breadcrumb-category">
              {article.category}
            </span>
          </nav>

          {/* Back Button */}
          <Link href="/help-center">
            <Button variant="outline" size="sm" className="mb-4 bg-white/10 hover:bg-white/20 border-white/20 text-white" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Button>
          </Link>

          {/* Category Badge */}
          <Badge variant="secondary" className="mb-3 capitalize" data-testid="badge-category">
            {article.category}
          </Badge>

          {/* Article Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-testid="heading-title">
            {article.title}
          </h1>

          {/* Article Meta */}
          <div className="flex items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-1" data-testid="text-updated-date">
              <Calendar className="h-4 w-4" />
              Updated {format(new Date(article.updatedAt), "MMMM d, yyyy")}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8">
            {/* Article Excerpt */}
            {article.excerpt && (
              <div className="text-lg text-muted-foreground mb-8 pb-8 border-b" data-testid="text-excerpt">
                {article.excerpt}
              </div>
            )}

            {/* Article Content */}
            <div 
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:text-foreground
                prose-p:text-foreground prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:text-foreground prose-ol:text-foreground
                prose-li:text-foreground prose-li:marker:text-muted-foreground
                prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded
                prose-pre:bg-muted prose-pre:text-foreground
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
              data-testid="article-content"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Help Footer */}
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Was this article helpful?</h2>
          <p className="text-muted-foreground mb-6">
            If you still need help, our support team is here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact">
              <Button variant="default" data-testid="button-contact-support">
                Contact Support
              </Button>
            </Link>
            <Link href="/help-center">
              <Button variant="outline" data-testid="button-browse-articles">
                Browse More Articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
