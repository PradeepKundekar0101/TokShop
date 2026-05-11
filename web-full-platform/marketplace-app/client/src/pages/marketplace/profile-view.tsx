import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Share2, MessageCircle, Star, ShoppingBag, Calendar, MoreVertical, Ban, Flag, ChevronDown, ChevronUp, Waves } from "lucide-react";
import { UserBadge } from "@/components/user-badge";
import { BadgeDescription } from "@/components/badge-description";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/use-page-title";
import { apiRequest } from "@/lib/queryClient";
import { getOrCreateChat, blockUser, unblockUser } from "@/lib/firebase-chat";
import { ShowCard } from "@/components/show-card";
import { ShareDialog } from "@/components/share-dialog";

// Review Card Component with expandable details
function ReviewCard({ review }: { review: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-300 text-gray-300"
        )}
      />
    ));
  };

  const hasDetailedRatings = review.overall || review.shipping || review.packaging || review.accuracy;

  return (
    <div className="border border-border rounded-lg p-4 sm:p-6" data-testid={`review-${review._id}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
          <AvatarImage src={review.from?.profilePhoto} />
          <AvatarFallback>
            {review.from?.firstName?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-sm sm:text-base">
                {review.from?.firstName || 'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString(undefined, { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {renderStars(review.overall || review.rating || 0)}
              <span className="text-sm font-semibold ml-1">
                {(review.overall || review.rating || 0).toFixed(1)}
              </span>
            </div>
          </div>
          
          <p className="text-sm sm:text-base text-foreground mb-3">{review.review}</p>
          
          {hasDetailedRatings && (
            <>
              {isExpanded && (
                <div className="space-y-2 mb-3 pt-3 border-t border-border">
                  {review.overall && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.overall)}
                        <span className="text-sm font-semibold ml-1">{review.overall.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {review.shipping && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Shipping</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.shipping)}
                        <span className="text-sm font-semibold ml-1">{review.shipping.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {review.packaging && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Packaging</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.packaging)}
                        <span className="text-sm font-semibold ml-1">{review.packaging.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {review.accuracy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Accuracy</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.accuracy)}
                        <span className="text-sm font-semibold ml-1">{review.accuracy.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                data-testid={`button-toggle-review-${review._id}`}
              >
                {isExpanded ? (
                  <>
                    See less <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    See more <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileView() {
  usePageTitle('Profile');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/profile/:userId");
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("shows");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [followersDialogType, setFollowersDialogType] = useState<'followers' | 'following'>('followers');
  
  // Handle both /profile/:userId and /user?id=userId routes
  let userId = params?.userId;
  if (!userId && location.startsWith('/user')) {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    userId = urlParams.get('id') || undefined;
  }
  
  // Fetch user data from API based on user ID
  const currentUserId = (currentUser as any)?._id || currentUser?.id;
  
  const { data: profileUser, isLoading } = useQuery<any>({
    queryKey: ['/api/profile', userId || currentUserId],
    queryFn: async () => {
      const userIdToFetch = userId || currentUserId;
      if (!userIdToFetch) throw new Error('No user ID available');
      const response = await fetch(`/api/profile/${userIdToFetch}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      // API returns data directly or nested under 'data' key
      return data.data || data;
    },
    enabled: !!(userId || currentUserId),
    staleTime: 0,
  });

  // Fetch reviews for this user
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<any>({
    queryKey: ['/api/users/review', userId || currentUserId],
    queryFn: async () => {
      const userIdToFetch = userId || currentUserId;
      if (!userIdToFetch) return { reviews: [] };
      
      const response = await fetch(`/api/users/review/${userIdToFetch}`);
      if (!response.ok) return { reviews: [] };
      return response.json();
    },
    enabled: !!(userId || currentUserId),
    staleTime: 0,
  });

  // Fetch followers/following list with pagination
  const {
    data: followersData,
    fetchNextPage: fetchNextFollowersPage,
    hasNextPage: hasNextFollowersPage,
    isFetchingNextPage: isFetchingNextFollowers,
    isLoading: followersLoading,
    refetch: refetchFollowers,
  } = useInfiniteQuery({
    queryKey: ['/api/users', followersDialogType, userId || currentUserId],
    queryFn: async ({ pageParam = 1 }) => {
      const userIdToFetch = userId || currentUserId;
      if (!userIdToFetch) return { users: [], totalDoc: 0, page: 1 };
      const endpoint = followersDialogType === 'followers' 
        ? `/api/users/followers/${userIdToFetch}?page=${pageParam}&limit=20` 
        : `/api/users/following/${userIdToFetch}?page=${pageParam}&limit=20`;
      const response = await fetch(endpoint);
      if (!response.ok) return { users: [], totalDoc: 0, page: pageParam };
      const json = await response.json();
      // Handle various response formats
      const innerData = json.data || json;
      const users = innerData.users || innerData.followers || innerData.following || innerData;
      return {
        users: Array.isArray(users) ? users : [],
        totalDoc: json.totalDoc || innerData.totalDoc || 0,
        page: pageParam,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalItems = lastPage.totalDoc || 0;
      const itemsPerPage = 20;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: showFollowersDialog && !!(userId || currentUserId),
    staleTime: 0,
    gcTime: 0,
  });

  // Refetch when dialog opens
  useEffect(() => {
    if (showFollowersDialog) {
      refetchFollowers();
    }
  }, [showFollowersDialog, followersDialogType]);

  // Ref for infinite scroll in followers dialog
  const followersScrollRef = useRef<HTMLDivElement>(null);

  // Update follow and block status when profileUser changes - MUST be before early returns
  useEffect(() => {
    if (profileUser) {
      if (profileUser.isfollowing !== undefined) {
        setIsFollowing(profileUser.isfollowing);
      }
      // Check if current user is in blocked_by array (means current user has blocked this profile)
      if (currentUserId && profileUser.blocked_by && Array.isArray(profileUser.blocked_by)) {
        setIsBlocked(profileUser.blocked_by.includes(currentUserId));
      }
    }
  }, [profileUser, currentUserId]);

  // Fetch products for this user
  const { data: userProductsData, isLoading: productsLoading } = useQuery<any>({
    queryKey: ['/api/products', 'user', userId || currentUserId],
    queryFn: async () => {
      const userIdToFetch = userId || currentUserId;
      if (!userIdToFetch) return { products: [] };
      
      const params = new URLSearchParams({
        userid: userIdToFetch,
        roomid: '',
        saletype: 'buy_now',
        category: '',
        page: '1',
        limit: '15',
        featured: 'true',
        status: 'active',
      });
      
      const response = await fetch(`/api/products/?${params.toString()}`);
      if (!response.ok) return { products: [] };
      return response.json();
    },
    enabled: !!(userId || currentUserId),
    staleTime: 0,
  });

  // Fetch shows for this user with infinite scroll
  const {
    data: userShowsData,
    fetchNextPage: fetchNextShowsPage,
    hasNextPage: hasNextShowsPage,
    isFetchingNextPage: isFetchingNextShows,
  } = useInfiniteQuery({
    queryKey: ['/api/rooms', 'user', userId || currentUserId],
    queryFn: async ({ pageParam = 1 }) => {
      const userIdToFetch = userId || currentUserId;
      if (!userIdToFetch) return { rooms: [], pages: 0 };
      
      const params = new URLSearchParams({
        userid: userIdToFetch,
        page: String(pageParam),
        limit: '20',
        status: 'active',
      });
      
      if (currentUserId) {
        params.set('currentUserId', currentUserId);
      }
      
      const response = await fetch(`/api/rooms?${params.toString()}`);
      if (!response.ok) return { rooms: [], pages: 0 };
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalItems = lastPage.totalDoc || 0;
      const itemsPerPage = Math.max(lastPage.limits || 20, 1);
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!(userId || currentUserId),
    staleTime: 0,
  });

  // Infinite scroll observer for shows
  const showsObserverTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextShowsPage && !isFetchingNextShows) {
          fetchNextShowsPage();
        }
      },
      { threshold: 0, rootMargin: '100px' }
    );

    const currentTarget = showsObserverTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextShowsPage, isFetchingNextShows, fetchNextShowsPage]);

  // Display user - use profileUser if found, otherwise current user
  const displayUser = profileUser || currentUser;
  const isOwnProfile = !userId || userId === currentUserId;

  // Follow mutation - MUST be before early returns
  const followMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PUT', `/api/follow/${currentUserId}/${userId}`, {});
    },
    onSuccess: () => {
      setIsFollowing(true);
      queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation - MUST be before early returns
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PUT', `/api/unfollow/${currentUserId}/${userId}`, {});
    },
    onSuccess: () => {
      setIsFollowing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  // Block mutation - MUST be before early returns
  const blockMutation = useMutation({
    mutationFn: async () => {
      // Call both API and Firebase
      const [apiResult] = await Promise.all([
        apiRequest('PUT', `/api/block/${currentUserId}/${userId}`, {}),
        blockUser(currentUserId!, userId!),
      ]);
      return apiResult;
    },
    onSuccess: () => {
      setIsBlocked(true);
      queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
      toast({
        title: "User Blocked",
        description: `You have blocked @${displayUser?.userName || 'user'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to block user",
        variant: "destructive",
      });
    },
  });

  // Unblock mutation - MUST be before early returns
  const unblockMutation = useMutation({
    mutationFn: async () => {
      // Call both API and Firebase
      const [apiResult] = await Promise.all([
        apiRequest('PUT', `/api/unblock/${currentUserId}/${userId}`, {}),
        unblockUser(currentUserId!, userId!),
      ]);
      return apiResult;
    },
    onSuccess: () => {
      setIsBlocked(false);
      queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
      toast({
        title: "User Unblocked",
        description: `You have unblocked @${displayUser?.userName || 'user'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unblock user",
        variant: "destructive",
      });
    },
  });

  // Report mutation - MUST be before early returns
  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await apiRequest('POST', '/api/report', {
        reason,
        reported_by: currentUserId,
        reported: userId,
      });
    },
    onSuccess: () => {
      setShowReportDialog(false);
      setReportReason("");
      toast({
        title: "User Reported",
        description: `Thank you for reporting @${displayUser?.userName || 'user'}. We will review this report.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report user",
        variant: "destructive",
      });
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If user not found, show error
  if (userId && !profileUser && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground mb-4">This user does not exist.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const user = displayUser;
    if (user?.userName) {
      return user.userName[0].toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return 'U';
  };

  // Handle follow/unfollow button click
  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  // Handle message button click
  const handleMessage = () => {
    if (!userId || !currentUserId) return;
    
    // Navigate immediately - let inbox page handle chat creation
    const params = new URLSearchParams({
      otherUserId: userId,
      otherUserName: displayUser?.userName || displayUser?.firstName || 'User',
      otherUserPhoto: displayUser?.profilePhoto || ''
    });
    
    setLocation(`/inbox?${params.toString()}`);
  };

  // Handle block/unblock toggle
  const handleBlockToggle = () => {
    if (isBlocked) {
      unblockMutation.mutate();
    } else {
      blockMutation.mutate();
    }
  };

  // Handle report user
  const handleReportUser = () => {
    setShowReportDialog(true);
  };

  // Handle submit report
  const handleSubmitReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reporting this user",
        variant: "destructive",
      });
      return;
    }
    reportMutation.mutate(reportReason.trim());
  };

  // Handle share profile
  const handleShare = () => {
    setShowShareDialog(true);
  };

  const getShareUrl = () => {
    return `${window.location.origin}/user?id=${userId || currentUserId}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });
      setShowShareDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleShareTo = (platform: string) => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Check out ${userDisplayName}'s profile`);
    
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${url}&title=${text}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setShowShareDialog(false);
    }
  };
  
  // Get user data for display
  const userAvatar = displayUser?.profilePhoto || '';
  const userDisplayName = displayUser?.userName || displayUser?.firstName || 'User';
  const userUsername = displayUser?.userName || 'user';
  const userBio = displayUser?.bio || '';
  const userFollowers = displayUser?.followersCount || displayUser?.followers?.length || 0;
  const userFollowing = displayUser?.followingCount || displayUser?.following?.length || 0;

  const upcomingShows = userShowsData?.pages?.flatMap(page => page.rooms || []) || [];
  const userProducts = userProductsData?.products || [];

  // Legacy mock data (keeping structure for fallback)
  const upcomingShowsLegacy = [
    {
      id: 1,
      status: "Live",
      date: "164",
      thumbnail: "https://via.placeholder.com/300x400",
      viewers: 83,
      title: "SOLID GOLD GIVEAWAYS"
    },
    {
      id: 2,
      date: "Tomorrow 22:04",
      thumbnail: "https://via.placeholder.com/300x400",
      viewers: 64,
      title: "SOLID GOLD GIVEAWAYS"
    },
    {
      id: 3,
      date: "Thu 23:04",
      thumbnail: "https://via.placeholder.com/300x400",
      viewers: 81,
      title: "SOLID GOLD GIVEAWAYS"
    },
    {
      id: 4,
      date: "Fri 22:04",
      thumbnail: "https://via.placeholder.com/300x400",
      viewers: 45,
      title: "SOLID GOLD GIVEAWAYS"
    },
    {
      id: 5,
      date: "Sat 22:04",
      thumbnail: "https://via.placeholder.com/300x400",
      viewers: 42,
      title: "SOLID GOLD GIVEAWAYS"
    },
    {
      id: 6,
      date: "Sun 22:04",
      thumbnail: "https://via.placeholder.com/300x400",
      viewers: 42,
      title: "SOLID GOLD GIVEAWAYS"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background" data-testid="page-profile-view">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-background">
        <div className="w-full">
        {/* Profile Header Section */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20" data-testid="avatar-profile-view">
                  <AvatarImage src={userAvatar} alt={userUsername} />
                  <AvatarFallback className="bg-teal-500 text-white text-xl sm:text-2xl font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {displayUser?.seller && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full w-4 h-4 sm:w-5 sm:h-5 border-2 border-background" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate" data-testid="text-display-name">
                    {userDisplayName}
                  </h1>
                  {(displayUser?.badge || displayUser?.badgeTier) && (
                    <UserBadge badge={displayUser.badge} badgeTier={displayUser.badgeTier} size="lg" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  @{userUsername}
                </p>
                {displayUser?.badgeTier && (
                  <div className="mb-2">
                    <BadgeDescription badgeTier={displayUser.badgeTier} size={16} showText={true} />
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{displayUser?.averagereviews || '0'} Rating</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleShare}
                data-testid="button-share" 
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              {!isOwnProfile && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMessage}
                    data-testid="button-message" 
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span>Message</span>
                  </Button>
                  <Button 
                    variant={isFollowing ? "outline" : "default"} 
                    size="sm" 
                    onClick={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    data-testid="button-follow"
                  >
                    {followMutation.isPending || unfollowMutation.isPending 
                      ? "Loading..." 
                      : isFollowing 
                        ? "Following" 
                        : "Follow"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid="button-more-options" className="h-8 w-8 sm:h-9 sm:w-9">
                        <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" data-testid="menu-more-options">
                      <DropdownMenuItem 
                        onClick={handleBlockToggle} 
                        disabled={blockMutation.isPending || unblockMutation.isPending}
                        data-testid="menu-item-block"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {blockMutation.isPending || unblockMutation.isPending 
                          ? "Loading..." 
                          : isBlocked 
                            ? "Unblock User" 
                            : "Block User"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleReportUser} data-testid="menu-item-report" className="text-destructive">
                        <Flag className="h-4 w-4 mr-2" />
                        Report User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {isOwnProfile && (
                <Link href="/profile" className="flex-1 sm:flex-initial">
                  <Button variant="default" size="sm" data-testid="button-edit-profile" className="w-full sm:w-auto">
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Bio */}
          {userBio && (
            <div className="mb-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {userBio}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm mb-4">
            <button 
              className="hover:underline" 
              data-testid="button-following-stat"
              onClick={() => {
                setFollowersDialogType('following');
                setShowFollowersDialog(true);
              }}
            >
              <span className="font-bold text-foreground">{userFollowing.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </button>
            <button 
              className="hover:underline" 
              data-testid="button-followers-stat"
              onClick={() => {
                setFollowersDialogType('followers');
                setShowFollowersDialog(true);
              }}
            >
              <span className="font-bold text-foreground">{userFollowers.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">followers</span>
            </button>
          </div>

        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 sm:h-12 p-0 px-4 sm:px-6 overflow-x-auto">
            <TabsTrigger 
              value="shop" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-3 sm:px-6 text-sm"
              data-testid="tab-shop"
            >
              Shop
            </TabsTrigger>
            <TabsTrigger 
              value="shows" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-3 sm:px-6 text-sm"
              data-testid="tab-shows"
            >
              Shows
            </TabsTrigger>
            {displayUser?.seller && (
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-3 sm:px-6 text-sm"
                data-testid="tab-reviews"
              >
                Reviews
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="shop" className="p-4 sm:p-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4" data-testid="text-shop-products">
                Products ({userProducts.length})
              </h2>
              
              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : userProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No products in shop</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {userProducts.map((product: any) => (
                    <Link href={`/product/${product._id}`} key={product._id || product.id}>
                      <div 
                        className="group cursor-pointer"
                        data-testid={`product-${product._id}`}
                      >
                      <div className="aspect-square overflow-hidden rounded-lg mb-2 bg-muted relative">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name || 'Product'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
                          </div>
                        )}
                        {product.tokshow && (
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant="secondary" 
                              className="bg-primary/90 text-primary-foreground hover:bg-primary text-xs gap-1"
                              data-testid={`badge-in-show-${product._id}`}
                            >
                              <Waves className="w-3 h-3" />
                              In Show
                            </Badge>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm truncate text-foreground" data-testid={`product-name-${product._id}`}>
                        {product.productName || product.name || 'Untitled Product'}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`product-price-${product._id}`}>
                        ${(product.price || 0).toFixed(2)}
                      </p>
                      {product.quantity !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                        </p>
                      )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shows" className="p-4 sm:p-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4" data-testid="text-upcoming-shows">
                Shows ({upcomingShows.length})
              </h2>
              
              {upcomingShows.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No shows yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {upcomingShows.map((show: any) => (
                      <ShowCard
                        key={show._id || show.id}
                        show={show}
                        currentUserId={currentUserId || ''}
                        variant="profile"
                        showHostInfo={false}
                      />
                    ))}
                  </div>
                  
                  {/* Infinite scroll trigger */}
                  <div ref={showsObserverTarget} className="h-20 flex items-center justify-center mt-4">
                    {isFetchingNextShows && (
                      <p className="text-sm text-muted-foreground">Loading more shows...</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {displayUser?.seller && (
            <TabsContent value="reviews" className="p-4 sm:p-6">
              {reviewsLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading reviews...</p>
                </div>
              ) : (reviewsData?.reviews || []).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {(reviewsData?.reviews || []).map((review: any) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
        </div>
      </main>

      {/* Share Profile Dialog */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        url={getShareUrl()}
        title={`Check out ${userDisplayName}'s profile`}
        description="Profile"
      />

      {/* Report User Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting @{displayUser?.userName || 'user'}. 
              This will help us review your report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe why you're reporting this user..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-report-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setReportReason("");
              }}
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitReport}
              disabled={reportMutation.isPending}
              data-testid="button-submit-report"
            >
              {reportMutation.isPending ? "Reporting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Followers/Following Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="capitalize">{followersDialogType}</DialogTitle>
          </DialogHeader>
          <div 
            className="flex-1 overflow-y-auto py-2"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
              if (scrollBottom < 100 && hasNextFollowersPage && !isFetchingNextFollowers) {
                fetchNextFollowersPage();
              }
            }}
          >
            {followersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (() => {
              const allUsers = followersData?.pages?.flatMap(page => page.users) || [];
              if (allUsers.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    No {followersDialogType} yet
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  {allUsers.map((user: any) => (
                    <Link
                      key={user._id || user.id}
                      href={`/profile/${user._id || user.id}`}
                      onClick={() => setShowFollowersDialog(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile || user.profileUrl || user.avatar} />
                        <AvatarFallback>
                          {(user.firstName?.[0] || user.userName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          @{user.userName || user.username || 'User'}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {isFetchingNextFollowers && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
