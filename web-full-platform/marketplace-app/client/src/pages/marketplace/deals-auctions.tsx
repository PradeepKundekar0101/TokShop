import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { usePageTitle } from '@/hooks/use-page-title';
import { AuctionCard } from '@/components/auction-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function DealsAuctions() {
  usePageTitle('All Auctions');

  // Invalidate cache on mount to fetch fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/products', 'all', 'auction'] });
  }, []);

  // Fetch all auctions (same API as homepage)
  const { data: auctionsData, isLoading } = useQuery({
    queryKey: ['/api/products', 'all', 'auction'],
    queryFn: async () => {
      const params = new URLSearchParams({
        saletype: 'auction',
        status: 'active',
        limit: '100', // Get more auctions
        sortBy: 'views',
        featured: 'true',
        type: 'scheduled'
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      return response.json();
    }
  });

  const auctions = auctionsData?.products || [];

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="page-deals-auctions">
      <main className="flex-1 overflow-y-auto">
        <div className="flex justify-center w-full">
          <div className="w-full lg:w-[90%] px-4 md:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link href="/deals">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  All Auctions
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {auctions.length} {auctions.length === 1 ? 'auction' : 'auctions'} available
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : auctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-muted-foreground mb-4">No auctions available</p>
                <Link href="/deals">
                  <Button variant="outline">Back to Deals</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
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
