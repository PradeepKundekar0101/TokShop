import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/use-page-title';
import { AuctionCard } from '@/components/auction-card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function TrendingAuctions() {
  usePageTitle('Trending Auctions');

  // Fetch trending auctions (same parameters as homepage, but more results)
  const { data: trendingAuctionsData, isLoading } = useQuery({
    queryKey: ['/api/products', 'trending', 'auction'],
    queryFn: async () => {
      const params = new URLSearchParams({
        saletype: 'auction',
        status: 'active',
        limit: '50',
        sortBy: 'views',
        featured: 'true', // Keep same filter as homepage
        type: 'scheduled' // Keep same filter as homepage
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      return response.json();
    }
  });

  const auctions = trendingAuctionsData?.products || [];

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="page-trending-auctions">
      <main className="flex-1 overflow-y-auto bg-white dark:bg-background">
        <div className="flex justify-center w-full">
          <div className="w-full lg:w-[90%] px-4 md:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Trending Auctions
              </h1>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading trending auctions...</p>
              </div>
            ) : auctions.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No trending auctions available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {auctions.map((auction: any) => (
                  <AuctionCard key={auction._id || auction.id} auction={auction} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
