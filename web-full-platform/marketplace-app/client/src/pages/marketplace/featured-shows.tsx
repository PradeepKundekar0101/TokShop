import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/use-page-title';
import { ShowCard } from '@/components/show-card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export default function FeaturedShows() {
  usePageTitle('Featured Shows');
  const { user } = useAuth();
  const currentUserId = (user as any)?._id || user?.id;

  const { data: featuredShowsData, isLoading } = useQuery({
    queryKey: ['/api/rooms', 'featured', 'page'],
    queryFn: async () => {
      const params = [
        `page=1`,
        `live=`,
        `featured=true`,
        `ownerUsername=`,
        `limit=50`,
        `category=`,
        `userid=`,
        `currentUserId=${currentUserId || ''}`,
        `title=`,
        `status=active`
      ];
      const queryString = params.join('&');
      const response = await fetch(`/api/rooms?${queryString}`);
      return response.json();
    }
  });

  const shows = featuredShowsData?.rooms || [];

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="page-featured-shows">
      <main className="flex-1 overflow-y-auto bg-white dark:bg-background">
        <div className="flex justify-center w-full">
          <div className="w-full lg:w-[90%] px-4 md:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Featured Shows
              </h1>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading featured shows...</p>
              </div>
            ) : shows.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No featured shows available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {shows.map((show: any) => (
                  <ShowCard
                    key={show._id || show.id}
                    show={show}
                    currentUserId={currentUserId || ''}
                    variant="grid"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
