import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Home, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch published articles
  const { data, isLoading, error } = useQuery<{ success: boolean; data: Article[]; total: number }>({
    queryKey: ["/api/articles/published"],
  });

  const articles = data?.data || [];

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(articles.map(a => a.category)))];

  // Filter articles by search and category
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background" data-testid="page-help-center">
      {/* Hero Section with Background Image */}
      <div className="relative h-[300px] bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
        {/* Dark wash overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40 z-10" />
        
        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col justify-center items-start w-full px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/80 mb-4" data-testid="breadcrumb-nav">
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
            {selectedCategory !== "all" && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-white capitalize" data-testid="breadcrumb-category">
                  {selectedCategory}
                </span>
              </>
            )}
          </nav>

          {/* Category Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" data-testid="heading-category">
            {selectedCategory === "all" ? "Help Center" : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </h1>

          {/* Search Bar */}
          <div className="w-full max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/95 backdrop-blur-sm border-white/20 text-foreground"
                data-testid="input-search-articles"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8" data-testid="category-filter">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                  data-testid={`button-category-${category}`}
                >
                  {category === "all" ? "All Articles" : category}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12" data-testid="loading-articles">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12" data-testid="error-articles">
            <p className="text-destructive">Failed to load articles. Please try again later.</p>
          </div>
        )}

        {/* Articles Grid - Whatnot Style */}
        {!isLoading && !error && (
          <>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12" data-testid="no-articles">
                <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No articles found</h2>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Check back later for helpful articles"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="articles-grid">
                {filteredArticles.map((article) => (
                  <Link key={article._id} href={`/help-center/${article.slug}`}>
                    <Card className="h-full hover-elevate active-elevate-2 transition-all cursor-pointer" data-testid={`card-article-${article.slug}`}>
                      <CardContent className="p-6">
                        {/* Category Badge */}
                        <Badge variant="secondary" className="mb-3 capitalize" data-testid={`badge-category-${article.slug}`}>
                          {article.category}
                        </Badge>

                        {/* Article Title */}
                        <h3 className="text-lg font-semibold text-primary mb-2 hover:underline" data-testid={`title-${article.slug}`}>
                          {article.title}
                        </h3>

                        {/* Article Excerpt */}
                        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`excerpt-${article.slug}`}>
                          {article.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Help Footer */}
        <div className="mt-16 border-t pt-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Still need help?</h2>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button variant="default" data-testid="button-contact-support">
                  Contact Support
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" data-testid="button-view-faq">
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
