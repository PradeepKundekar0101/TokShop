import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Gift, ChevronLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GiveawayCard } from '@/components/giveaway-card';
import { usePageTitle } from '@/hooks/use-page-title';
import { MarketplaceFooter } from '@/components/layout/marketplace-footer';

export default function Giveaways() {
  usePageTitle('Giveaways');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: giveawaysData, isLoading } = useQuery({
    queryKey: ['/api/giveaways', 'public', page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type: 'icona',
        status: 'active',
      });
      if (searchQuery) params.set('name', searchQuery);
      
      const response = await fetch(`/api/giveaways?${params.toString()}`);
      return response.json();
    }
  });

  const giveaways = Array.isArray(giveawaysData?.giveaways) 
    ? giveawaysData.giveaways 
    : Array.isArray(giveawaysData?.data) 
      ? giveawaysData.data 
      : Array.isArray(giveawaysData) 
        ? giveawaysData 
        : [];
  
  const totalPages = giveawaysData?.totalPages || giveawaysData?.pages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            <h1 className="text-lg font-semibold">Giveaways</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search giveaways..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading giveaways...</p>
          </div>
        ) : giveaways.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No giveaways available</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new giveaways!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {giveaways.map((giveaway: any) => (
                <GiveawayCard key={giveaway._id || giveaway.id} giveaway={giveaway} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
}
