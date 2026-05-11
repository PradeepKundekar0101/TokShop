import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Radio, Zap } from 'lucide-react';
import { useApiConfig, getImageUrl } from '@/lib/use-api-config';
import { useToast } from '@/hooks/use-toast';
import { UserBadge } from '@/components/user-badge';

interface RaidShowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentShowId: string;
  hostName: string;
  hostId: string;
  viewerCount: number;
  onRaid: (targetShowId: string) => void;
}

interface LiveShow {
  _id: string;
  title: string;
  hostName?: string;
  hostId?: string | { _id: string; userName?: string; firstName?: string; profilePhoto?: string };
  userId?: string | { _id: string; userName?: string; firstName?: string; profilePhoto?: string };
  owner?: { _id: string; userName?: string; firstName?: string; profilePhoto?: string; badge?: string; badgeTier?: string };
  viewers?: any[];
  roomImage?: string;
  started?: boolean;
  category?: string | { _id: string; name?: string };
}

export function RaidShowDialog({
  open,
  onOpenChange,
  currentShowId,
  hostName,
  hostId,
  viewerCount,
  onRaid,
}: RaidShowDialogProps) {
  const { externalApiUrl } = useApiConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShow, setSelectedShow] = useState<LiveShow | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { data: liveShows, isLoading, refetch } = useQuery<LiveShow[]>({
    queryKey: ['/api/rooms', 'live'],
    queryFn: async () => {
      const response = await fetch('/api/rooms?live=true');
      if (!response.ok) throw new Error('Failed to fetch live shows');
      const data = await response.json();
      // Handle different API response formats
      const rooms = data.rooms || data.data || data || [];
      return Array.isArray(rooms) ? rooms : [];
    },
    enabled: open,
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Refetch when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      refetch();
    }
    onOpenChange(newOpen);
  };

  const filteredShows = Array.isArray(liveShows) 
    ? liveShows.filter((show) => show._id !== currentShowId) 
    : [];

  const getShowHost = (show: LiveShow) => {
    // Check owner first (most common), then hostId, then userId
    const hostData = show.owner || show.hostId || show.userId;
    if (typeof hostData === 'object' && hostData) {
      return {
        name: hostData.userName || hostData.firstName || 'Host',
        avatar: hostData.profilePhoto || '',
        badge: (hostData as any).badge,
        badgeTier: (hostData as any).badgeTier,
      };
    }
    return { name: show.hostName || 'Host', avatar: '', badge: undefined, badgeTier: undefined };
  };

  const getShowCategory = (show: LiveShow): string => {
    if (!show.category) return '';
    if (typeof show.category === 'object' && show.category.name) {
      return show.category.name;
    }
    if (typeof show.category === 'string') {
      return show.category;
    }
    return '';
  };

  const handleRaidClick = (show: LiveShow) => {
    setSelectedShow(show);
    // Close the main dialog first, then open confirmation
    onOpenChange(false);
    // Small delay to let the first dialog close
    setTimeout(() => {
      setShowConfirmDialog(true);
    }, 100);
  };

  const handleConfirmRaid = async () => {
    if (!selectedShow) return;
    
    setIsValidating(true);
    
    // Validate target show is still live before raiding
    try {
      const response = await fetch(`/api/rooms/${selectedShow._id}`);
      if (!response.ok) {
        throw new Error('Show not found');
      }
      const roomData = await response.json();
      const room = roomData.data || roomData;
      
      // Check if the show is still live (started but not ended)
      if (!room.started || room.ended) {
        toast({
          title: "Show No Longer Live",
          description: "This show has ended. Please select another show to rally to.",
          variant: "destructive",
        });
        setShowConfirmDialog(false);
        setSelectedShow(null);
        // Refresh the list to get updated shows
        queryClient.invalidateQueries({ queryKey: ['/api/rooms', 'live'] });
        return;
      }
      
      // Show is still live, proceed with raid
      onRaid(selectedShow._id);
      setShowConfirmDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to validate target show:', error);
      toast({
        title: "Validation Failed",
        description: "Could not verify the target show. Please try again.",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', 'live'] });
    } finally {
      setIsValidating(false);
    }
  };

  const selectedShowHost = selectedShow ? getShowHost(selectedShow) : null;
  const selectedShowViewers = selectedShow?.viewers?.length || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Rally to a Live Show
            </DialogTitle>
            <DialogDescription>
              Move your {viewerCount} viewer{viewerCount !== 1 ? 's' : ''} to another live show
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredShows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Radio className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No other live shows available</p>
                <p className="text-sm mt-1">Check back later when more sellers are live</p>
              </div>
            ) : (
              filteredShows.map((show) => {
                const showHost = getShowHost(show);
                const showCategory = getShowCategory(show);
                const showViewers = show.viewers?.length || 0;

                return (
                  <div
                    key={show._id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    data-testid={`raid-show-card-${show._id}`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getImageUrl(showHost.avatar, externalApiUrl)} />
                        <AvatarFallback>{showHost.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Badge className="absolute -top-1 -right-1 h-5 px-1.5 text-xs bg-red-500 text-white border-0">
                        LIVE
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{show.title || 'Live Show'}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                        <span>{showCategory || showHost.name}</span>
                        {(showHost.badge || showHost.badgeTier) && (
                          <UserBadge badge={showHost.badge} badgeTier={showHost.badgeTier} size="sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Users className="h-3 w-3" />
                        <span>{showViewers} watching</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleRaidClick(show)}
                      className="shrink-0"
                      data-testid={`button-rally-${show._id}`}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Rally
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Confirm Rally
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to rally <strong>{viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</strong> to{' '}
                  <strong>{selectedShowHost?.name}'s</strong> live show.
                </p>
                <p className="text-sm">
                  Your viewers will be automatically moved to this show, and a message will appear in their chat.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-rally" disabled={isValidating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRaid} disabled={isValidating} data-testid="button-confirm-rally">
              {isValidating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-1" />
              )}
              {isValidating ? 'Validating...' : 'Rally Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
