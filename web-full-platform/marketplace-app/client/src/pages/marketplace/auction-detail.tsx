import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Hammer, ChevronLeft, ChevronRight, User, Truck, ShieldCheck, AlertCircle, Loader2, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/lib/socket-context";
import { cn } from "@/lib/utils";
import { CustomBidDialog } from "@/components/custom-bid-dialog";

// Lazy load payment/shipping components (same as live show)
const PaymentShippingAlertDialog = lazy(() => import('@/components/payment-shipping-alert-dialog').then(m => ({ default: m.PaymentShippingAlertDialog })));
const PaymentShippingSheet = lazy(() => import('@/components/payment-shipping-sheet').then(m => ({ default: m.PaymentShippingSheet })));

export default function AuctionDetail() {
  const [, params] = useRoute("/auction/:auctionId");
  const [, setLocation] = useLocation();
  const { user: currentUser, refreshUserData } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { socket, isConnected, connect, disconnect } = useSocket();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasNotStarted, setHasNotStarted] = useState(false);

  const productId = params?.auctionId;
  const currentUserId = (currentUser as any)?._id || currentUser?.id;
  const userName = (currentUser as any)?.userName || currentUser?.firstName || 'Guest';
  
  // Track auction ID to avoid re-joining when product data changes
  const auctionIdRef = useRef<string | null>(null);

  // Payment & Shipping dialogs (same as live show)
  const [showPaymentShippingAlert, setShowPaymentShippingAlert] = useState<boolean>(false);
  const [showPaymentShippingSheet, setShowPaymentShippingSheet] = useState<boolean>(false);
  
  // Custom Bid Dialog
  const [showCustomBidDialog, setShowCustomBidDialog] = useState<boolean>(false);

  // Refresh user data on page load to get latest address/payment info
  useEffect(() => {
    if (currentUser) {
      refreshUserData();
    }
  }, [currentUser?.id]);

  console.log('🔍 STEP 1: Product ID from URL params:', productId);

  // Fetch product with embedded auction data
  const { data: product, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/products', productId],
    enabled: !!productId,
  });

  console.log('🔍 STEP 2: Product fetch result:', { 
    isLoading, 
    hasProduct: !!product,
    productKeys: product ? Object.keys(product) : []
  });

  if (product) {
    console.log('🔍 STEP 3: Product data structure:', {
      productId: product._id,
      productName: product.name,
      hasAuction: !!product.auction,
      auctionKeys: product.auction ? Object.keys(product.auction) : [],
      auctionId: product.auction?._id,
      bidsCount: product.auction?.bids?.length || 0
    });
    console.log('🔍 STEP 4: Full auction object:', product.auction);
    console.log('🔍 STEP 5: Bids array:', product.auction?.bids);
  }

  // The product response already contains the full auction data
  const mergedData = product;

  // Fetch shipping estimate
  const { data: shippingEstimate, isLoading: isLoadingShipping } = useQuery<any>({
    queryKey: ['/api/shipping/estimate', productId],
    queryFn: async () => {
      if (!product) {
        console.log('📦 Shipping estimate: No product data yet');
        return null;
      }
      try {
        console.log('📦 Fetching shipping estimate for product:', {
          productId,
          weight: product.weight,
          unit: product.unit,
          ownerId: product.ownerId
        });
        const shippingHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        const userToken = localStorage.getItem('accessToken');
        if (userToken) {
          shippingHeaders['x-access-token'] = userToken;
          shippingHeaders['Authorization'] = `Bearer ${userToken}`;
        }
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          shippingHeaders['x-user-data'] = btoa(unescape(encodeURIComponent(storedUserData)));
        }
        const response = await fetch('/api/shipping/estimate', {
          method: 'POST',
          headers: shippingHeaders,
          credentials: 'include',
          body: JSON.stringify({
            weight: product.weight || 1,
            unit: product.unit || 'oz',
            product: productId,
            owner: product.ownerId?._id || product.ownerId,
            tokshow: product.tokshow?._id || product.tokshow || null,
            buying_label: false,
            customer: (currentUser as any)?._id || currentUser?.id || null
          }),
        });
        console.log('📦 Shipping estimate response status:', response.status);
        if (!response.ok) {
          console.log('📦 Shipping estimate failed with status:', response.status);
          return null;
        }
        const data = await response.json();
        console.log('📦 Shipping estimate data:', data);
        return data;
      } catch (error) {
        console.error('📦 Failed to fetch shipping estimate:', error);
        return null;
      }
    },
    enabled: !!product && !!productId,
  });

  console.log('📦 Shipping estimate state:', {
    isLoadingShipping,
    hasEstimate: !!shippingEstimate,
    estimateData: shippingEstimate
  });

  // Connect socket and join scheduled auction room
  useEffect(() => {
    if (!socket) {
      console.log('📱 Waiting for socket to initialize...');
      return;
    }
    
    console.log('📱 Socket ready - connecting...');
    connect();
    
    return () => {
      console.log('📱 Auction detail page unmounting - disconnecting socket...');
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]); // Only re-run when socket instance becomes available

  // Extract and store auction ID when product loads
  useEffect(() => {
    if (product && !auctionIdRef.current) {
      const auctionInfo = product.auction || product;
      const auctionId = auctionInfo._id || productId;
      auctionIdRef.current = auctionId;
      console.log('📋 Stored auction ID:', auctionId);
    }
  }, [product, productId]);

  // Join scheduled auction room when socket connects
  useEffect(() => {
    if (!socket || !isConnected || !auctionIdRef.current || !currentUserId) return;

    const auctionId = auctionIdRef.current;

    console.log('📤 Joining scheduled auction:', {
      auctionId,
      userId: currentUserId,
      userName,
      socketConnected: isConnected
    });

    // Join scheduled auction room
    socket.emit('join-scheduled-auction', {
      auction: auctionId,
      userId: currentUserId,
      userName
    });

    console.log('✅ Joined scheduled auction room:', auctionId);

    // Socket event handler: Bid updated
    const handleBidUpdated = (auction: any) => {
      console.log('🔍 BID-UPDATED received on auction detail page:', auction);
      // Invalidate and refetch the product query to get updated auction data
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
    };

    // Socket event handler: Auction ended
    const handleAuctionEnded = (auction: any) => {
      console.log('🏁 AUCTION-ENDED received:', auction);
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      toast({
        title: "Auction Ended",
        description: "This auction has concluded.",
      });
    };

    // Socket event handler: New scheduled auction created
    const handleScheduledAuctionCreated = (data: any) => {
      console.log('🎉 SCHEDULED-AUCTION-CREATED received:', data);
      // Force immediate refetch to show the new auction
      refetch().then(() => {
        // Update auction ID ref to join new auction room if needed
        if (data.auction?._id) {
          auctionIdRef.current = data.auction._id;
        }
      });
      toast({
        title: "New Auction Available",
        description: "A new auction has been scheduled for this product.",
      });
    };

    // Register socket event listeners
    // Note: No auction-time-extended for scheduled auctions (they have fixed start/end times)
    socket.on('bid-updated', handleBidUpdated);
    socket.on('auction-ended', handleAuctionEnded);
    socket.on('scheduled-auction-created', handleScheduledAuctionCreated);

    return () => {
      // Cleanup socket event listeners
      socket.off('bid-updated', handleBidUpdated);
      socket.off('auction-ended', handleAuctionEnded);
      socket.off('scheduled-auction-created', handleScheduledAuctionCreated);

      console.log('📤 Leaving scheduled auction:', auctionId);
      socket.emit('leave-scheduled-auction', {
        auction: auctionId,
        userId: currentUserId
      });
    };
  }, [socket, isConnected, productId, currentUserId, userName, toast]);

  // Calculate time remaining
  useEffect(() => {
    if (!mergedData) {
      setTimeLeft(0);
      setHasNotStarted(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      
      // Check for scheduled times (featured auctions) FIRST - before checking ended flag
      const auctionInfo = mergedData.auction;
      const startTimeDate = auctionInfo?.start_time_date;
      const endTimeDate = auctionInfo?.end_time_date;
      const scheduledStartTime = startTimeDate && startTimeDate > 0 ? startTimeDate : null;
      const scheduledEndTime = endTimeDate && endTimeDate > 0 ? endTimeDate : null;
      
      // For scheduled auctions (absolute start/end times) - takes priority over ended flag
      if (scheduledStartTime && scheduledEndTime) {
        const startMs = scheduledStartTime; // Already a timestamp
        const endMs = scheduledEndTime; // Already a timestamp
        
        // Not started yet
        if (now < startMs) {
          const untilStart = Math.floor((startMs - now) / 1000);
          setHasNotStarted(true);
          setTimeLeft(untilStart);
          return;
        }
        
        // Started, show time until end
        if (now >= startMs && now < endMs) {
          const remaining = Math.floor((endMs - now) / 1000);
          setHasNotStarted(false);
          setTimeLeft(remaining);
          return;
        }
        
        // Ended
        setHasNotStarted(false);
        setTimeLeft(0);
        return;
      }
      
      // Fall back to checking ended flag for non-scheduled auctions
      if (mergedData.ended) {
        setHasNotStarted(false);
        setTimeLeft(0);
        return;
      }
      
      // For live show auctions (duration-based)
      const duration = mergedData.duration || 0;
      const startedTime = mergedData.startedTime || mergedData.started_time;
      const started = mergedData.started || false;

      if (!started || !startedTime || startedTime === 0) {
        // Show full duration
        setTimeLeft(duration * 60);
        return;
      }

      if (!duration) {
        setTimeLeft(0);
        return;
      }

      const startMs = typeof startedTime === 'string' 
        ? new Date(startedTime).getTime() 
        : startedTime;
      
      if (isNaN(startMs)) {
        setTimeLeft(0);
        return;
      }
      
      const endTime = startMs + (duration * 60 * 1000); // duration in minutes
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [mergedData]);

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Auction Ended';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Calculate current bid - bids are in the nested auction object
  const auctionInfo = mergedData?.auction || {};
  const bids = auctionInfo?.bids || [];
  
  const highestBid = bids.reduce((max: number, bid: any) => 
    Math.max(max, Number(bid.amount) || 0), 0
  );
  
  const currentBid = Number(highestBid || auctionInfo?.newbaseprice || auctionInfo?.baseprice || 0);
  const minimumBid = auctionInfo?.newbaseprice || auctionInfo?.baseprice || 0;
  const bidIncrement = auctionInfo?.increaseBidBy || 5;

  // Find current user's bid
  const userBid = bids.find((bid: any) => {
    const bidUserId = bid.user?._id || bid.userId;
    return bidUserId === currentUser?.id;
  });
  const userBidAmount = userBid ? Number(userBid.amount) : null;

  // Check if current user is winning
  const isUserWinning = bids.length > 0 && bids[bids.length - 1]?.userId === currentUser?.id;
  const hasEnded = timeLeft === 0 || mergedData?.ended;

  // Helper function to check if user has payment and shipping info
  const hasPaymentAndShipping = () => {
    if (!currentUser) return false;
    const userData = currentUser as any;
    return !!(userData.address && userData.defaultpaymentmethod);
  };

  // Place bid mutation - supports both regular and custom bids
  const placeBidMutation = useMutation({
    mutationFn: async (options: number | { amount: number; custom?: { autobid: boolean; autobidAmount: number } }) => {
      if (!currentUser) {
        throw new Error('Please sign in to place a bid');
      }

      // Check if user has payment and shipping info before bidding
      if (!hasPaymentAndShipping()) {
        setShowPaymentShippingAlert(true);
        throw new Error('Please add payment and shipping information before bidding');
      }
      
      if (!socket || !isConnected) {
        throw new Error('Not connected to server. Please try again.');
      }
      
      // Parse options - support both old number format and new object format
      const isCustomBid = typeof options === 'object' && options.custom;
      const amount = typeof options === 'number' ? options : options.amount;
      const customOptions = typeof options === 'object' ? options.custom : undefined;
      
      // Use nested auction ID if available, otherwise fall back to product ID
      const auctionInfo = mergedData.auction || mergedData;
      const auctionId = auctionInfo._id || mergedData._id;
      
      // Determine bid amount
      let bidAmount = amount;
      if (isCustomBid && customOptions!.autobid) {
        // Autobid enabled - place bid at next minimum
        bidAmount = auctionInfo.newbaseprice || auctionInfo.baseprice || amount;
      }
      
      console.log('📤 Placing bid via socket:', {
        user: currentUserId,
        amount: bidAmount,
        auction: auctionId,
        increaseBidBy: auctionInfo.increaseBidBy || bidIncrement,
        isCustomBid,
        autobid: isCustomBid ? customOptions!.autobid : false,
        autobidamount: isCustomBid ? customOptions!.autobidAmount : bidAmount
      });
      
      // Emit the bid - fire and forget, real-time updates will show the result
      socket.emit('place-bid', {
        user: currentUserId,
        amount: bidAmount,
        increaseBidBy: auctionInfo.increaseBidBy || bidIncrement,
        auction: auctionId,
        prebid: false,
        autobid: isCustomBid ? customOptions!.autobid : false,
        autobidamount: isCustomBid ? customOptions!.autobidAmount : bidAmount,
        custom_bid: isCustomBid ? true : false,
        roomId: auctionId, // For scheduled auctions, roomId is the auction ID
        type: 'scheduled' // Indicate this is a scheduled auction bid
      });
      
      console.log('✅ Bid socket event emitted');
      
      // Return immediately - the real-time socket updates will reflect the bid
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Bid placed!",
        description: "Your bid has been placed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bid failed",
        description: error.message || "Failed to place bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickBid = () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place a bid.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasNotStarted) {
      toast({
        title: "Auction not started",
        description: "This auction hasn't started yet. Please wait.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasEnded) {
      toast({
        title: "Auction ended",
        description: "This auction has already ended.",
        variant: "destructive",
      });
      return;
    }

    // Use newbaseprice, or default_startprice if newbaseprice is 0
    const bidAmount = auctionInfo?.newbaseprice || mergedData?.default_startprice || 0;
    placeBidMutation.mutate(bidAmount);
  };

  // Handler for custom bid (from dialog)
  const handleCustomBid = (amount: number, isMaxBid: boolean) => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place a bid.",
        variant: "destructive",
      });
      return;
    }

    // Check payment/shipping before opening dialog
    if (!hasPaymentAndShipping()) {
      setShowPaymentShippingAlert(true);
      return;
    }

    placeBidMutation.mutate({
      amount,
      custom: {
        autobid: isMaxBid,
        autobidAmount: amount
      }
    });
  };

  // Open custom bid dialog
  const handleOpenCustomBid = () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place a bid.",
        variant: "destructive",
      });
      return;
    }

    // Check payment/shipping before opening dialog
    if (!hasPaymentAndShipping()) {
      setShowPaymentShippingAlert(true);
      return;
    }

    setShowCustomBidDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!mergedData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Auction not found</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const images = mergedData.images || mergedData.productImages || [];
  const ownerData = typeof mergedData.ownerId === 'object' ? mergedData.ownerId : null;
  const sellerId = mergedData.ownerId?._id || mergedData.ownerId;
  const sellerName = ownerData?.userName || ownerData?.firstName || 'Seller';
  const sellerAvatar = ownerData?.profilePhoto;
  const isEnding = timeLeft > 0 && timeLeft <= 300; // Last 5 minutes
  const isOwner = currentUser?.id === sellerId; // Check if current user is the owner

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate flex-1">{mergedData.name || 'Auction'}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left Column - Images and Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Image Carousel */}
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[selectedImageIndex]}
                        alt={mergedData.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                            data-testid="button-prev-image"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                            data-testid="button-next-image"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Hammer className="h-24 w-24 text-muted-foreground/20" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={cn(
                          "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                          selectedImageIndex === idx ? "border-primary" : "border-border hover:border-primary/50"
                        )}
                        data-testid={`thumbnail-${idx}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mergedData.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{mergedData.description}</p>
                  </div>
                )}

                {mergedData.category && (
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <Badge variant="outline">{mergedData.category.name || mergedData.category}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="md:col-span-3 space-y-6">
            {/* Auction Status Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Timer */}
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  hasEnded ? "border-muted bg-muted/50" : hasNotStarted ? "border-primary bg-primary/10" : isEnding ? "border-destructive bg-destructive/10 animate-pulse" : "border-primary bg-primary/10"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">{hasNotStarted ? "Starts in" : "Time Remaining"}</span>
                  </div>
                  <p className={cn("text-2xl font-bold", hasEnded ? "text-muted-foreground" : isEnding ? "text-destructive" : "text-primary")}>
                    {formatTime(timeLeft)}
                  </p>
                </div>

                <Separator />

                {/* Current Bid / Starting Price */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{bids.length > 0 ? 'Current Bid' : 'Starting Price'}</p>
                  <p className="text-3xl font-bold text-primary" data-testid="current-bid">
                    ${currentBid.toFixed(2)}
                    {!isLoadingShipping && shippingEstimate?.amount && (
                      <span className="text-sm text-muted-foreground font-normal">
                        {' '}+ ${(typeof shippingEstimate.amount === 'string' ? parseFloat(shippingEstimate.amount) : shippingEstimate.amount).toFixed(2)} shipping + taxes
                      </span>
                    )}
                  </p>
                  {bids.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
                    </p>
                  )}
                </div>

                {/* Winning Status */}
                {isUserWinning && !hasEnded && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">You're winning!</span>
                  </div>
                )}

                {/* Bidding Buttons */}
                {!hasEnded ? (
                  hasNotStarted ? (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="font-semibold mb-2">Auction Not Started</p>
                      <p className="text-sm text-muted-foreground">
                        Bidding will open when the auction starts
                      </p>
                    </div>
                  ) : isOwner ? (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="font-semibold mb-2">Your Auction</p>
                      <p className="text-sm text-muted-foreground">
                        You cannot bid on your own auction
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={handleQuickBid}
                          className="flex-1"
                          size="lg"
                          disabled={placeBidMutation.isPending}
                          data-testid="button-quick-bid"
                        >
                          {placeBidMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Hammer className="h-5 w-5 mr-2" />
                              Place Bid - ${(auctionInfo?.newbaseprice || mergedData?.default_startprice || 0).toFixed(2)}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleOpenCustomBid}
                          variant="outline"
                          size="lg"
                          disabled={placeBidMutation.isPending}
                          data-testid="button-custom-bid"
                        >
                          <DollarSign className="h-5 w-5" />
                        </Button>
                      </div>

                      {userBidAmount !== null && (
                        <p className="text-xs text-muted-foreground text-center" data-testid="text-user-bid">
                          Your bid: ${userBidAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="font-semibold mb-2">Auction Ended</p>
                    {bids.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Winning bid: ${currentBid.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No bids placed</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={sellerAvatar} />
                    <AvatarFallback>{sellerName[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{sellerName}</p>
                    <p className="text-sm text-muted-foreground">Seller</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/profile/${sellerId}`)}
                  data-testid="button-view-seller"
                >
                  <User className="h-4 w-4 mr-2" />
                  View Seller Profile
                </Button>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>By bidding, you agree to buy this item if you win.</p>
                    <p>All bids are binding and cannot be retracted.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment & Shipping Alert - Same dialog as live show */}
      {showPaymentShippingAlert && (
        <Suspense fallback={<div />}>
          <PaymentShippingAlertDialog
            open={showPaymentShippingAlert}
            onOpenChange={setShowPaymentShippingAlert}
            onAddInfo={() => {
              setShowPaymentShippingAlert(false);
              setShowPaymentShippingSheet(true);
            }}
          />
        </Suspense>
      )}

      {/* Payment & Shipping Sheet - Full form for adding payment and address */}
      {showPaymentShippingSheet && (
        <Suspense fallback={<div />}>
          <PaymentShippingSheet
            open={showPaymentShippingSheet}
            onOpenChange={(open) => {
              setShowPaymentShippingSheet(open);
              if (!open) {
                refreshUserData();
              }
            }}
          />
        </Suspense>
      )}

      {/* Custom Bid Dialog */}
      <CustomBidDialog
        open={showCustomBidDialog}
        onOpenChange={setShowCustomBidDialog}
        productName={mergedData?.name || 'Auction Item'}
        currentBid={currentBid}
        minimumBid={auctionInfo?.newbaseprice || auctionInfo?.baseprice || 1}
        onPlaceBid={handleCustomBid}
        isPending={placeBidMutation.isPending}
      />
    </div>
  );
}
