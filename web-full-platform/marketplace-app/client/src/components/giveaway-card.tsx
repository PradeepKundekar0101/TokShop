import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Clock, Gift, Users, Bookmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';

interface GiveawayCardProps {
  giveaway: any;
  layout?: 'grid' | 'carousel';
}

export function GiveawayCard({ giveaway, layout = 'grid' }: GiveawayCardProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const giveawayId = giveaway._id || giveaway.id;
  const images = giveaway.images || [];
  const firstImage = images.length > 0 ? images[0] : '';
  const name = giveaway.name || 'Untitled Giveaway';
  const description = giveaway.description || '';
  const participantsCount = giveaway.participants?.length || 0;
  const quantity = giveaway.quantity || 1;
  
  const startedTime = giveaway.startedtime;
  const endedTime = giveaway.endedtime;
  const status = giveaway.status || 'active';
  const winner = giveaway.winner;
  
  const currentUserId = (user as any)?._id || (user as any)?.id || (user as any)?.userId || '';
  const bookmarkedIds = (giveaway.bookmarks || giveaway.bookmarked || []).map((b: any) => 
    typeof b === 'string' ? b : (b._id || b.id || b.userId || '')
  );
  const isBookmarked = currentUserId && bookmarkedIds.includes(currentUserId);
  const participantIds = (giveaway.participants || []).map((p: any) => 
    typeof p === 'string' ? p : (p._id || p.id || p.userId || '')
  );
  const hasEntered = currentUserId && participantIds.includes(currentUserId);

  useEffect(() => {
    if (status === 'ended' || winner) {
      setTimeLeft(0);
      setIsLive(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      
      if (startedTime) {
        const startMs = new Date(startedTime).getTime();
        if (now < startMs) {
          const remaining = Math.max(0, Math.floor((startMs - now) / 1000));
          setTimeLeft(remaining);
          setIsLive(false);
          return;
        }
      }
      
      if (endedTime) {
        const endMs = new Date(endedTime).getTime();
        const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
        setTimeLeft(remaining);
        setIsLive(true);
        return;
      }
      
      setTimeLeft(0);
      setIsLive(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [startedTime, endedTime, status, winner]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark giveaways",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('POST', `/api/giveaways/${giveawayId}/bookmark`);
      queryClient.invalidateQueries({ queryKey: ['/api/giveaways'] });
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  const isEnded = status === 'ended' || winner || timeLeft <= 0;

  return (
    <Link href={`/giveaway/${giveawayId}`}>
      <Card className={cn(
        "overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-sm",
        layout === 'carousel' ? 'w-48 sm:w-56 flex-shrink-0' : ''
      )}>
        <div className="relative aspect-square">
          {firstImage && !imageError ? (
            <img
              src={firstImage}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Gift className="h-12 w-12 text-white" />
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge className="bg-purple-600 text-white text-xs">
              <Gift className="h-3 w-3 mr-1" />
              Giveaway
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-black/30 hover:bg-black/50"
            onClick={handleBookmark}
          >
            <Bookmark className={cn(
              "h-4 w-4",
              isBookmarked ? "fill-primary text-primary" : "text-white"
            )} />
          </Button>
          
          {!isEnded && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timeLeft)} {timeLeft > 0 && (isLive ? 'to end' : 'to start')}
            </div>
          )}
          
          {isEnded && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">
                Ended
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm line-clamp-1">{name}</h3>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {participantsCount} {participantsCount === 1 ? 'entry' : 'entries'}
            </div>
            {quantity > 1 && (
              <Badge variant="outline" className="text-xs">
                {quantity} prizes
              </Badge>
            )}
          </div>
          {hasEntered && !isEnded && (
            <Badge className="mt-2 w-full justify-center bg-primary text-primary-foreground">
              You're entered!
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
