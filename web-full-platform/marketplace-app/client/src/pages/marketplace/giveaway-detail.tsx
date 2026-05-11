import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Gift, ChevronLeft, Clock, Users, Calendar, Bookmark, Share2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePageTitle } from '@/hooks/use-page-title';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function GiveawayDetail() {
  const [, params] = useRoute('/giveaway/:id');
  const giveawayId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: giveawayData, isLoading } = useQuery({
    queryKey: ['/api/giveaways', giveawayId],
    queryFn: async () => {
      const response = await fetch(`/api/giveaways/${giveawayId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!giveawayId,
  });

  const giveaway = giveawayData?.giveaway || giveawayData;
  usePageTitle(giveaway?.name || 'Giveaway');

  const currentUserId = (user as any)?._id || (user as any)?.id || (user as any)?.userId || '';
  const participantIds = (giveaway?.participants || []).map((p: any) => 
    typeof p === 'string' ? p : (p._id || p.id || p.userId || '')
  );
  const hasEntered = currentUserId && participantIds.includes(currentUserId);
  const bookmarkedIds = (giveaway?.bookmarks || giveaway?.bookmarked || []).map((b: any) => 
    typeof b === 'string' ? b : (b._id || b.id || b.userId || '')
  );
  const isBookmarked = currentUserId && bookmarkedIds.includes(currentUserId);

  const enterMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/giveaways/${giveawayId}/enter`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/giveaways', giveawayId] });
      toast({
        title: "You're in!",
        description: "You've successfully entered the giveaway. Good luck!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enter giveaway",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/giveaways/${giveawayId}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/giveaways', giveawayId] });
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to bookmark",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!giveaway?.endedtime || giveaway?.status === 'ended' || giveaway?.winner) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const endMs = new Date(giveaway.endedtime).getTime();
      const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [giveaway?.endedtime, giveaway?.status, giveaway?.winner]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: giveaway?.name,
          text: `Check out this giveaway: ${giveaway?.name}`,
          url: window.location.href,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(window.location.href);
          toast({ title: "Link copied to clipboard" });
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const isEnded = giveaway?.status === 'ended' || giveaway?.winner || timeLeft <= 0;
  const images = giveaway?.images || [];
  const participantsCount = giveaway?.participants?.length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading giveaway...</p>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Gift className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Giveaway not found</p>
        <Link href="/giveaways">
          <Button variant="link" className="mt-2">Browse all giveaways</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/giveaways">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold line-clamp-1">{giveaway.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
            >
              <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-primary text-primary")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="aspect-square relative">
          {images.length > 0 ? (
            <img
              src={images[selectedImage]}
              alt={giveaway.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Gift className="h-24 w-24 text-white" />
            </div>
          )}
          
          {!isEnded && (
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </div>
          )}
          
          {isEnded && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Giveaway Ended
              </Badge>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {images.map((img: string, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2",
                  selectedImage === index ? "border-primary" : "border-transparent"
                )}
              >
                <img src={img} alt={`${giveaway.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{giveaway.name}</h2>
            {giveaway.description && (
              <p className="text-muted-foreground mt-2">{giveaway.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {participantsCount} entered
            </Badge>
            {giveaway.quantity > 1 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                {giveaway.quantity} prizes
              </Badge>
            )}
            {giveaway.endedtime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Ends {format(new Date(giveaway.endedtime), 'MMM d, yyyy')}
              </Badge>
            )}
          </div>

          {giveaway.user && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={giveaway.user.profilePhoto || giveaway.user.profilePic} />
                    <AvatarFallback>
                      {(giveaway.user.firstName?.[0] || giveaway.user.userName?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {giveaway.user.firstName || giveaway.user.userName || 'Seller'}
                    </p>
                    <p className="text-sm text-muted-foreground">Hosted by</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {giveaway.winner && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-600">Winner Announced!</p>
                    <p className="text-sm">
                      {giveaway.winner.firstName || giveaway.winner.userName || 'A lucky winner'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {!isEnded && (
        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="max-w-4xl mx-auto">
            {hasEntered ? (
              <Button className="w-full" size="lg" disabled>
                <CheckCircle className="h-5 w-5 mr-2" />
                You're Entered!
              </Button>
            ) : !user ? (
              <Link href="/login">
                <Button className="w-full" size="lg">
                  Sign in to Enter
                </Button>
              </Link>
            ) : (
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                size="lg"
                onClick={() => enterMutation.mutate()}
                disabled={enterMutation.isPending}
              >
                <Gift className="h-5 w-5 mr-2" />
                {enterMutation.isPending ? 'Entering...' : 'Enter Giveaway'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
