import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/use-page-title';
import { useApiConfig, getImageUrl } from '@/lib/use-api-config';

type SortOption = 'recommended' | 'popular' | 'a-z';

interface Category {
  _id: string;
  name: string;
  icon?: string;
  image?: string;
  viewersCount?: number;
}

export default function Browse() {
  usePageTitle('Browse Categories');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const { externalApiUrl, isLoading: isConfigLoading } = useApiConfig();

  // Fetch categories from API
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ['/api/categories'],
  });
  
  // Don't render until we have the config with externalApiUrl
  const isLoading = isConfigLoading || isCategoriesLoading || !externalApiUrl;

  const categories = categoriesData?.categories || [];

  // Use real viewer counts from API
  const categoriesWithViewers = categories.map(cat => ({
    ...cat,
    viewers: cat.viewersCount || 0,
  }));

  // Sort categories based on selected option
  const sortedCategories = [...categoriesWithViewers].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.viewers - a.viewers;
    } else if (sortBy === 'a-z') {
      return a.name.localeCompare(b.name);
    }
    // recommended - keep original order
    return 0;
  });

  const formatViewers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background" data-testid="page-browse">
        <main className="flex-1 overflow-y-auto bg-white dark:bg-background">
          <div className="flex justify-center w-full">
            <div className="w-full lg:w-[90%] px-4 md:px-6 lg:px-8 py-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Browse by Category
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-square rounded-lg bg-muted animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="page-browse">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-background">
        <div className="flex justify-center w-full">
          <div className="w-full lg:w-[90%] px-4 md:px-6 lg:px-8 py-6">
          {/* Page Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6" data-testid="heading-browse-category">
            Browse by Category
          </h1>

          {/* Sort/Filter Buttons */}
          <div className="flex gap-2 mb-6" data-testid="sort-buttons">
            <Button
              variant={sortBy === 'recommended' ? 'default' : 'outline'}
              onClick={() => setSortBy('recommended')}
              className="h-9"
              data-testid="button-sort-recommended"
            >
              Recommended
            </Button>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              onClick={() => setSortBy('popular')}
              className="h-9"
              data-testid="button-sort-popular"
            >
              Popular
            </Button>
            <Button
              variant={sortBy === 'a-z' ? 'default' : 'outline'}
              onClick={() => setSortBy('a-z')}
              className="h-9"
              data-testid="button-sort-az"
            >
              A-Z
            </Button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4" data-testid="grid-categories">
            {sortedCategories.map((category) => {
              // Construct full image URL from icon path using dynamic API URL
              const iconUrl = category.icon ? getImageUrl(category.icon, externalApiUrl) : null;
              const imageUrl = category.image ? getImageUrl(category.image, externalApiUrl) : iconUrl;
              
              return (
                <Link key={category._id} href={`/category/${category._id}`} data-testid={`link-category-${category._id}`}>
                  <div className="group cursor-pointer rounded-lg overflow-hidden bg-primary hover-elevate active-elevate-2">
                    {/* Category Name at Top */}
                    <div className="p-3 pb-2">
                      <h3 className="font-semibold text-sm md:text-base text-primary-foreground line-clamp-1" data-testid={`text-category-name-${category._id}`}>
                        {category.name}
                      </h3>
                    </div>

                    {/* Category Image */}
                    <div className="flex justify-center items-center py-4 px-6">
                      <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-background/90 rounded-lg">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={category.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-4xl">
                            📦
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Viewer Count at Bottom */}
                    <div className="px-3 pb-3 pt-1">
                      <p className="text-xs md:text-sm text-primary-foreground/80 flex items-center gap-1" data-testid={`text-viewers-${category._id}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground flex-shrink-0"></span>
                        {formatViewers(category.viewers)} viewers
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
