import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { usePageTitle } from '@/hooks/use-page-title';
import { AuctionCard } from '@/components/auction-card';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Loader2 } from 'lucide-react';

export default function Deals() {
  usePageTitle('Deals');

  // Invalidate cache on mount to fetch fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/products', 'deals', 'auction'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products', 'deals', 'trending'] });
  }, []);

  // Fetch auctions (same API as homepage)
  const { data: auctionsData, isLoading: isLoadingAuctions } = useQuery({
    queryKey: ['/api/products', 'deals', 'auction'],
    queryFn: async () => {
      const params = new URLSearchParams({
        saletype: 'auction',
        status: 'active',
        limit: '10',
        sortBy: 'views',
        featured: 'true',
        type: 'scheduled'
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      return response.json();
    }
  });

  // Fetch trending products (limit to 3 for preview)
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['/api/products', 'deals', 'trending'],
    queryFn: async () => {
      const params = new URLSearchParams({
        saletype: 'buy_now',
        status: 'active',
        limit: '6', // Get 6 products for 3 rows (2 per row on mobile)
        sortBy: 'views'
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      return response.json();
    }
  });

  const auctions = auctionsData?.products || [];
  const trendingProducts = trendingData?.products || [];

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="page-deals">
      <main className="flex-1 overflow-y-auto">
        <div className="flex justify-center w-full">
          <div className="w-full lg:w-[90%] px-4 md:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Deals
              </h1>
              <p className="text-muted-foreground">
                Discover trending products and exciting auctions
              </p>
            </div>

            {/* Auctions Section - Only show if loading or has items */}
            {(isLoadingAuctions || auctions.length > 0) && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Auctions</h2>
                  <Link href="/deals/auctions">
                    <Button variant="ghost" className="gap-2" data-testid="button-view-all-auctions">
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {isLoadingAuctions ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                    {auctions.slice(0, 6).map((auction: any) => (
                      <AuctionCard key={auction._id || auction.id} auction={auction} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trending Products Section - Only show if loading or has items */}
            {(isLoadingTrending || trendingProducts.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Trending Products</h2>
                  <Link href="/deals/trending">
                    <Button variant="ghost" className="gap-2" data-testid="button-view-all-trending">
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {isLoadingTrending ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                    {trendingProducts.slice(0, 6).map((product: any) => (
                      <ProductCard key={product._id || product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
