import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Clock, Bookmark, CheckCircle, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';

interface AuctionCardProps {
  auction: any;
  layout?: 'grid' | 'carousel';
}

export function AuctionCard({ auction, layout = 'grid' }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get auction details from nested auction object if it exists
  const auctionData = auction.auction || auction;
  
  const productId = auction._id || auction.id;
  const images = auction.images || auction.productImages || [];
  const firstImage = images.length > 0 ? images[0] : '';
  const name = auction.name || 'Untitled Auction';
  const bidsCount = auctionData.bids?.length || auction.bids?.length || 0;
  
  // Get seller info - API returns ownerId
  const seller = auction.ownerId || auction.userId || auction.seller || auction.user;
  const sellerName = seller?.firstName || seller?.userName || seller?.username || 'Seller';
  const sellerVerified = seller?.isVerified || seller?.verified || false;
  
  // Bookmark state
  const currentUserId = user?.id || '';
  const isBookmarked = auction.favorited?.includes(currentUserId) || false;
  
  // Check for scheduled times (featured auctions) or duration-based times (live show auctions)
  const startTimeDate = auctionData.start_time_date;
  const endTimeDate = auctionData.end_time_date;
  const scheduledStartTime = startTimeDate && startTimeDate > 0 ? startTimeDate : null;
  const scheduledEndTime = endTimeDate && endTimeDate > 0 ? endTimeDate : null;
  const duration = auctionData.duration || auction.duration || 0; // Duration in minutes
  const startedTime = auctionData.startedTime || auctionData.started_time || auction.startedTime || auction.started_time;
  const started = auctionData.started || auction.started || false;
  const ended = auctionData.ended || auction.ended || false;
  
  // Calculate current bid (highest bid or starting price)
  const bids = auctionData.bids || auction.bids || [];
  const highestBid = bids.reduce((max: number, bid: any) => 
    Math.max(max, Number(bid.amount) || 0), 0
  ) || 0;
  const startingPrice = Number(auctionData.baseprice || auctionData.startingPrice || auction.baseprice || auction.startingPrice || auction.price || 0);
  const currentBid = Number(highestBid || auctionData.newbaseprice || startingPrice);
  const hasBids = bidsCount > 0 && highestBid > 0;

  // Calculate time left
  useEffect(() => {
    // If ended, no time left
    if (ended) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      
      // For scheduled auctions (featured auctions with absolute start/end times)
      if (scheduledStartTime && scheduledEndTime) {
        const startMs = scheduledStartTime; // Already a timestamp
        const endMs = scheduledEndTime; // Already a timestamp
        
        // Not started yet
        if (now < startMs) {
          // Show time until start
          const untilStart = Math.floor((startMs - now) / 1000);
          setTimeLeft(untilStart);
          return;
        }
        
        // Started, show time until end
        if (now >= startMs && now < endMs) {
          const remaining = Math.floor((endMs - now) / 1000);
          setTimeLeft(remaining);
          return;
        }
        
        // Ended
        setTimeLeft(0);
        return;
      }
      
      // For live show auctions (duration-based)
      if (!started || !startedTime || startedTime === 0) {
        // Show full duration converted to seconds
        setTimeLeft(duration * 60);
        return;
      }
      
      if (!duration) {
        setTimeLeft(0);
        return;
      }
      
      // Parse startedTime to milliseconds
      const startMs = typeof startedTime === 'string' 
        ? new Date(startedTime).getTime() 
        : startedTime;
      
      // Guard against invalid dates
      if (isNaN(startMs)) {
        setTimeLeft(0);
        return;
      }
      
      const endTime = startMs + (duration * 60 * 1000); // duration is in minutes
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [duration, startedTime, started, ended, scheduledStartTime, scheduledEndTime]);

  // Format time left
  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Ended';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const now = Date.now();
  const scheduledStart = scheduledStartTime || 0; // Already a timestamp
  const scheduledEnd = scheduledEndTime || 0; // Already a timestamp
  
  // For scheduled auctions
  const isScheduled = Boolean(scheduledStartTime && scheduledEndTime);
  const notStartedScheduled = isScheduled && now < scheduledStart;
  const activeScheduled = isScheduled && now >= scheduledStart && now < scheduledEnd;
  
  // For live show auctions
  const notStartedLive = !isScheduled && !started && !ended;
  
  const isEnding = timeLeft > 0 && timeLeft <= 60;
  const hasEnded = ended || (isScheduled && now >= scheduledEnd);
  const notStarted = notStartedScheduled || notStartedLive;
  
  // Handle bookmark toggle
  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark auctions",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const currentFavorited = auction.favorited || [];
      const isAlreadyBookmarked = currentFavorited.includes(currentUserId);
      const favorited = isAlreadyBookmarked
        ? currentFavorited.filter((id: string) => id !== currentUserId)
        : [...currentFavorited, currentUserId];
      
      const response = await apiRequest('PATCH', `/api/products/${productId}`, { favorited });
      
      if (response.ok) {
        toast({
          title: isAlreadyBookmarked ? "Bookmark Removed" : "Bookmarked",
          description: isAlreadyBookmarked 
            ? "Auction removed from your bookmarks" 
            : "Auction added to your bookmarks"
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      } else {
        throw new Error('Failed to update bookmark');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cardClassName = layout === 'carousel'
    ? "hover-elevate active-elevate-2 overflow-hidden flex-shrink-0 w-52 sm:w-60"
    : "hover-elevate active-elevate-2 overflow-hidden w-full min-w-0";

  return (
    <Card 
      className={cardClassName}
      data-testid={`card-auction-${productId}`}
    >
      <div className="relative aspect-square bg-muted">
        {!imageError && firstImage ? (
          <img
            src={firstImage}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
        {hasEnded && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">Ended</Badge>
          </div>
        )}
        {/* Timer badge - top left */}
        {!hasEnded && (
          <div className="absolute top-2 left-2">
            {notStartedScheduled ? (
              <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Starts in {formatTime(timeLeft)}
              </Badge>
            ) : notStartedLive ? (
              <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Not Started
              </Badge>
            ) : (
              <Badge 
                className={cn(
                  "bg-primary text-primary-foreground flex items-center gap-1",
                  isEnding && "animate-pulse"
                )}
              >
                <Clock className="h-3 w-3" />
                Ends in {formatTime(timeLeft)}
              </Badge>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <h3 className="text-sm font-semibold line-clamp-2">{name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>By {sellerName}</span>
          {sellerVerified && <CheckCircle className="h-3 w-3 text-primary" />}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-sm">
            {hasBids ? (
              <>
                <span className="font-bold text-primary">${currentBid.toFixed(0)} <span className="font-normal text-muted-foreground text-xs">({bidsCount} bids)</span></span>
                {startingPrice > 0 && (
                  <span className="text-xs text-muted-foreground">Starting: ${startingPrice.toFixed(0)}</span>
                )}
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">Starting Price</span>
                <span className="font-bold text-primary">${startingPrice.toFixed(0)}</span>
              </>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">Auction</Badge>
        </div>
        <Link href={`/auction/${productId}`} data-testid={`link-auction-${productId}`}>
          <Button variant="outline" size="sm" className="w-full">
            View
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
