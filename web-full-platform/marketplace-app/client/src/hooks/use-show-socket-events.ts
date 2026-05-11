import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { timeSync } from '@/lib/time-sync';

interface UseShowSocketEventsProps {
  socket: any;
  roomId: string | undefined;
  isConnected: boolean;
  proceedWithJoin: boolean;
  isAuthenticated: boolean;
  user: any;
  currentUserId: string;
  isShowOwner: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  setLeavingRoom: (leaving: boolean) => void;
  disconnect: () => void;
  navigate: (to: string) => void;
  setViewers: React.Dispatch<React.SetStateAction<any[]>>;
  setPinnedProduct: React.Dispatch<React.SetStateAction<any>>;
  setActiveAuction: React.Dispatch<React.SetStateAction<any>>;
  setActiveGiveaway: React.Dispatch<React.SetStateAction<any>>;
  setShippingEstimate: React.Dispatch<React.SetStateAction<any>>;
  setWinnerData: React.Dispatch<React.SetStateAction<any>>;
  setShowWinnerDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setGiveawayWinnerData: React.Dispatch<React.SetStateAction<any>>;
  setShowGiveawayWinnerDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setOrderNotificationData: React.Dispatch<React.SetStateAction<any>>;
  setShowOrderNotification: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeAddedBlink: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentUserBid: React.Dispatch<React.SetStateAction<any>>;
  previousHighestBidRef: React.MutableRefObject<number>;
  lastAlertedMaxBidRef: React.MutableRefObject<number>;
  findWinner: (bids: any[]) => any;
  startTimerWithEndTime: (auction: any) => void;
  getShippingEstimate: (auction: any) => void;
  refetchAuction: () => void;
  refetchBuyNow: () => void;
  refetchGiveaways: () => void;
  refetchOffers: () => void;
  shownWinnerAlertsRef: React.MutableRefObject<Set<string>>;
  setActiveFlashSale: React.Dispatch<React.SetStateAction<any>>;
  setFlashSaleTimeLeft: React.Dispatch<React.SetStateAction<number>>;
}

export function useShowSocketEvents({
  socket,
  roomId,
  isConnected,
  proceedWithJoin,
  isAuthenticated,
  user,
  currentUserId,
  isShowOwner,
  joinRoom,
  leaveRoom,
  setLeavingRoom,
  disconnect,
  navigate,
  setViewers,
  setPinnedProduct,
  setActiveAuction,
  setActiveGiveaway,
  setShippingEstimate,
  setWinnerData,
  setShowWinnerDialog,
  setGiveawayWinnerData,
  setShowGiveawayWinnerDialog,
  setOrderNotificationData,
  setShowOrderNotification,
  setTimeAddedBlink,
  setCurrentUserBid,
  previousHighestBidRef,
  lastAlertedMaxBidRef,
  findWinner,
  startTimerWithEndTime,
  getShippingEstimate,
  refetchAuction,
  refetchBuyNow,
  refetchGiveaways,
  refetchOffers,
  shownWinnerAlertsRef,
  setActiveFlashSale,
  setFlashSaleTimeLeft,
}: UseShowSocketEventsProps) {
  const { toast } = useToast();
  const lastAuctionRefetchRef = useRef<number>(0);
  const lastGiveawayRefetchRef = useRef<number>(0);
  const lastOffersRefetchRef = useRef<number>(0);
  
  // Track the current running auction ID to prevent stale ended flags from previous auctions
  // This is used to sanitize incoming room data that might have stale ended: true
  const currentRunningAuctionIdRef = useRef<string | null>(null);

  // Debounced refetch functions to prevent duplicate calls
  const debouncedRefetchAuction = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastAuctionRefetchRef.current;
    
    // Only refetch if it's been more than 500ms since the last refetch
    if (timeSinceLastRefetch > 500) {
      lastAuctionRefetchRef.current = now;
      refetchAuction();
    }
  }, [refetchAuction]);

  const debouncedRefetchGiveaways = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastGiveawayRefetchRef.current;
    
    // Only refetch if it's been more than 500ms since the last refetch
    if (timeSinceLastRefetch > 500) {
      lastGiveawayRefetchRef.current = now;
      refetchGiveaways();
    }
  }, [refetchGiveaways]);

  const debouncedRefetchOffers = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastOffersRefetchRef.current;
    
    // Only refetch if it's been more than 500ms since the last refetch
    if (timeSinceLastRefetch > 500) {
      lastOffersRefetchRef.current = now;
      console.log('🔄 Refetching offers via socket event');
      refetchOffers();
    }
  }, [refetchOffers]);

  // Memoized handler: Fetch offers (triggered by socket event)
  const handleFetchOffers = useCallback((data: any) => {
    console.log('📬 fetch_offers socket event received:', data);
    debouncedRefetchOffers();
    // Also refetch buy now products since offer acceptance affects product quantity
    refetchBuyNow();
  }, [debouncedRefetchOffers, refetchBuyNow]);

  // Memoized handler: User connected
  const handleUserConnected = useCallback((data: any) => {
    console.log('👤 User connected:', data);
    setViewers(prev => {
      const filtered = prev.filter(v => (v._id || v.userId) !== data.userId);
      const updated = [...filtered, { _id: data.userId, userId: data.userId, userName: data.userName }];
      console.log('👥 Viewers updated:', { previous: prev.length, new: updated.length, viewers: updated });
      return updated;
    });
  }, [setViewers]);

  // Memoized handler: User disconnected
  const handleUserDisconnected = useCallback((data: any) => {
    console.log('User left:', data);
    setViewers(prev => prev.filter(v => (v._id || v.userId) !== data.userId));
  }, [setViewers]);

  // Memoized handler: Current user successfully joined room
  // Note: Join message is now sent directly in show-view.tsx to avoid race conditions
  const handleCurrentUserJoined = useCallback((data: any) => {
    console.log('✅ Current user joined room:', data);
  }, []);

  // Memoized handler: Room started
  const handleRoomStarted = useCallback((roomData: any) => {
    console.log('Room started - full room data:', roomData);
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    toast({
      title: "Show Started!",
      description: "The live show has begun.",
      duration: 3000
    });
  }, [roomId, currentUserId, toast]);

  // Memoized handler: Room ended
  const handleRoomEnded = useCallback(() => {
    console.log('Room ended');
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    toast({
      title: "Show Ended",
      description: "Thanks for watching!",
      variant: "destructive"
    });
  }, [roomId, currentUserId, toast]);

  // Memoized handler: Product pinned
  const handleProductPinned = useCallback((roomData: any) => {
    console.log('Product pinned - room data:', roomData);
    
    // Update state from room data
    const pinnedProd = roomData.pinned || roomData.pinnedProduct;
    const activeAuc = roomData.activeauction || roomData.activeAuction || roomData.active_auction;
    const activeGive = roomData.activegiveaway || roomData.activeGiveaway || roomData.active_giveaway;
    
    setPinnedProduct(pinnedProd || null);
    setActiveAuction(activeAuc || null);
    setActiveGiveaway(activeGive || null);
    
    // Fetch shipping estimate if there's a pinned product
    if (pinnedProd) {
      // Skip shipping estimate if user is the show owner
      const hostId = roomData?.owner?._id || roomData?.owner?.id;
      const isOwner = isAuthenticated && currentUserId === hostId;
      
      if (pinnedProd.shipping_profile && !isOwner) {
        const pinnedPayload = {
          weight: pinnedProd.shipping_profile.weight,
          unit: pinnedProd.shipping_profile.scale,
          product: pinnedProd._id || pinnedProd.id,
          update: true,
          owner: roomData?.owner?._id || roomData?.owner?.id,
          customer: currentUserId,
          tokshow: roomId,
          buying_label: false
        };
        
        console.log('📦 Fetching shipping estimate for pinned product:', pinnedPayload);
        
        (() => {
          const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
          const tk = localStorage.getItem('accessToken');
          if (tk) { hdrs['x-access-token'] = tk; hdrs['Authorization'] = `Bearer ${tk}`; }
          const ud = localStorage.getItem('user');
          if (ud) { hdrs['x-user-data'] = btoa(unescape(encodeURIComponent(ud))); }
          return fetch('/api/shipping/estimate', {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify(pinnedPayload),
            credentials: 'include'
          });
        })()
          .then(res => res.json())
          .then(data => {
            console.log('✅ Pinned product shipping estimate received:', data);
            setShippingEstimate({
              amount: data.amount,
              currency: data.currency,
              rate_id: data.objectId,
              bundleId: data.bundleId,
            });
          })
          .catch(err => console.error('❌ Error fetching pinned product shipping:', err));
      } else {
        // Clear shipping estimate if owner or no shipping profile
        console.log('🧹 Clearing shipping estimate (owner or no shipping profile)');
        setShippingEstimate(null);
      }
    } else {
      // Clear shipping estimate when no product is pinned
      setShippingEstimate(null);
    }
    
    // Invalidate query to keep data in sync
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
  }, [roomId, currentUserId, setPinnedProduct, setActiveAuction, setActiveGiveaway, setShippingEstimate, isAuthenticated]);

  // Memoized handler: Pinned product updated
  const handlePinnedProductUpdated = useCallback((data: any) => {
    console.log('Pinned product updated:', data);
    if (data !== null && data !== undefined) {
      if (data.quantity !== null && data.quantity !== undefined) {
        setPinnedProduct((prev: any) => prev ? { ...prev, quantity: data.quantity } : null);
      } else {
        setPinnedProduct(null);
      }
    } else {
      setPinnedProduct(null);
    }
    
    // Refetch Buy Now products to keep the list in sync
    refetchBuyNow();
  }, [setPinnedProduct, refetchBuyNow]);

  // Memoized handler: Auction started
  const handleAuctionStarted = useCallback((auction: any) => {
    console.log('🎉 Auction started - auction data:', auction);
    
    // Reset alert tracking for new auction
    lastAlertedMaxBidRef.current = 0;
    setCurrentUserBid(null); // Reset bid state for new auction
    
    // The auction object is sent directly, not wrapped in roomData
    // Normalize endTime to always be a number
    const normalizedAuction = auction ? { ...auction } : null;
    
    if (normalizedAuction) {
      // Track the current running auction ID to sanitize stale room data
      const auctionId = normalizedAuction._id || normalizedAuction.id;
      currentRunningAuctionIdRef.current = auctionId;
      console.log('📌 Tracking new running auction ID:', auctionId);
      
      // Convert endTime to number if it's a string
      if (normalizedAuction.endTime && typeof normalizedAuction.endTime === 'string') {
        normalizedAuction.endTime = new Date(normalizedAuction.endTime).getTime();
      }
      
      // CRITICAL: Ensure ended is explicitly false for new auctions
      // This prevents stale ended:true from previous auctions persisting
      normalizedAuction.ended = false;
      normalizedAuction.started = true;
      
      // Update global time sync service if server time is provided
      if (normalizedAuction.serverTime) {
        timeSync.updateFromServerTime(normalizedAuction.serverTime, 'socket');
      }
    }
    
    setActiveAuction(normalizedAuction);
    setPinnedProduct(null); // Force clear pinned product when auction starts
    setActiveGiveaway(null); // Force clear giveaway when auction starts
    
    // Start timer and fetch shipping estimate for the auction
    if (normalizedAuction) {
      findWinner(normalizedAuction.bids || []);
      startTimerWithEndTime(normalizedAuction);
      getShippingEstimate(normalizedAuction);
      
      // Update cached auction products list with new auction data
      const productId = auction.product?._id || auction.product?.id || auction.product;
      if (roomId && productId) {
        let cacheUpdated = false;
        
        queryClient.setQueryData(['/api/products', roomId, 'auction'], (old: any) => {
          if (!old?.products) {
            console.log('⚠️ No cached products, skipping cache update');
            return old;
          }
          
          const updatedProducts = old.products.map((product: any) => {
            if (product._id === productId || product.id === productId) {
              cacheUpdated = true;
              console.log('✅ Updated product auction in cache:', productId);
              return {
                ...product,
                auction: auction
              };
            }
            return product;
          });
          
          return {
            ...old,
            products: updatedProducts
          };
        });
        
        // Fallback: If cache update failed (product not found), invalidate to refetch
        if (!cacheUpdated) {
          console.log('⚠️ Product not found in cache for new auction, invalidating query');
          queryClient.invalidateQueries({ queryKey: ['/api/products', roomId, 'auction'] });
        }
      }
    }
    
    // Invalidate query to keep data in sync
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
  }, [roomId, currentUserId, setCurrentUserBid, setActiveAuction, setPinnedProduct, setActiveGiveaway, findWinner, startTimerWithEndTime, getShippingEstimate, lastAlertedMaxBidRef]);

  // Memoized handler: Auction pinned
  const handleAuctionPinned = useCallback((roomData: any) => {
    console.log('Auction pinned - room data:', roomData);
    
    // Update state from room data
    const activeAuc = roomData.activeauction || roomData.activeAuction || roomData.active_auction;
    
    // CRITICAL: Sanitize incoming auction data to prevent stale ended flags
    // If this auction matches the current running auction, force ended=false
    if (activeAuc) {
      const incomingId = activeAuc._id || activeAuc.id;
      if (currentRunningAuctionIdRef.current && incomingId === currentRunningAuctionIdRef.current) {
        console.log('🧹 Sanitizing auction pinned data - forcing ended=false for running auction:', incomingId);
        activeAuc.ended = false;
        activeAuc.started = true;
      }
    }
    
    setActiveAuction(activeAuc || null);
    setPinnedProduct(null); // Force clear pinned product when auction is pinned
    setActiveGiveaway(null); // Force clear giveaway when auction is pinned
    
    // Invalidate query to keep data in sync
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
  }, [roomId, currentUserId, setActiveAuction, setPinnedProduct, setActiveGiveaway]);

  // Memoized handler: Bid updated
  const handleBidUpdated = useCallback((auction: any) => {
    console.log('🔍 BID-UPDATED RECEIVED:');
    console.log('  Full auction object:', auction);
    console.log('  Has endTime?:', auction.endTime);
    console.log('  Has ended?:', auction.ended);
    console.log('  Bids count:', auction.bids?.length);
    console.log('  newbaseprice:', auction.newbaseprice);
    
    // Track this as the current running auction if not already tracked
    // This helps when viewer joins mid-auction after auction-started already fired
    const incomingAuctionId = auction._id || auction.id;
    if (incomingAuctionId && !currentRunningAuctionIdRef.current) {
      console.log('📌 Setting running auction ID from bid-updated:', incomingAuctionId);
      currentRunningAuctionIdRef.current = incomingAuctionId;
    }
    
    setActiveAuction((prev: any) => {
      if (!prev) {
        console.log('  ⚠️ No previous auction, keeping prev');
        return prev;
      }
      
      console.log('  Previous endTime:', prev.endTime);
      console.log('  Previous ended:', prev.ended);
      console.log('  Previous serverOffset:', prev.serverOffset);
      
      // CRITICAL FIX: Also update ended, startedTime, and endTime from the socket payload
      // This prevents stale "ended: true" from a previous auction from persisting
      const updated = {
        ...prev,
        bids: auction.bids || prev.bids,
        higestbid: auction.higestbid !== undefined ? auction.higestbid : prev.higestbid,
        newbaseprice: auction.newbaseprice !== undefined ? auction.newbaseprice : prev.newbaseprice,
        // Update timing/state fields from socket payload to fix stale ended flag
        ended: auction.ended !== undefined ? auction.ended : prev.ended,
        startedTime: auction.startedTime !== undefined ? auction.startedTime : prev.startedTime,
        endTime: auction.endTime !== undefined ? auction.endTime : prev.endTime,
        started: auction.started !== undefined ? auction.started : prev.started,
      };
      
      console.log('  Updated auction endTime:', updated.endTime);
      console.log('  Updated auction ended:', updated.ended);
      console.log('  Updated auction serverOffset:', updated.serverOffset);
      
      return updated;
    });
    
    // Update cached auction products list with new bid data
    const productId = auction.product?._id || auction.product?.id || auction.product;
    const auctionId = auction._id || auction.id;
    if (roomId && productId && auctionId) {
      let cacheUpdated = false;
      
      queryClient.setQueryData(['/api/products', roomId, 'auction'], (old: any) => {
        if (!old?.products) {
          console.log('⚠️ No cached products for bid update');
          return old;
        }
        
        const updatedProducts = old.products.map((product: any) => {
          if (product._id === productId || product.id === productId) {
            // Verify this is the right auction
            if (product.auction?._id === auctionId || product.auction?.id === auctionId) {
              cacheUpdated = true;
              console.log('✅ Updated product auction bids in cache:', productId, 'Bids:', auction.bids?.length);
              return {
                ...product,
                auction: {
                  ...product.auction,
                  bids: auction.bids ?? product.auction?.bids ?? [],
                  higestbid: auction.higestbid !== undefined ? auction.higestbid : product.auction.higestbid,
                  newbaseprice: auction.newbaseprice !== undefined ? auction.newbaseprice : product.auction.newbaseprice,
                }
              };
            }
          }
          return product;
        });
        
        return {
          ...old,
          products: updatedProducts
        };
      });
      
      // Fallback: If cache update failed (product not found), invalidate to refetch
      if (!cacheUpdated) {
        console.log('⚠️ Product not found in cache, invalidating query');
        queryClient.invalidateQueries({ queryKey: ['/api/products', roomId, 'auction'] });
      }
    }
    
    // Update current user's bid state for reliable tracking
    // Handle both bid.user and bid.bidder formats with multiple ID variations
    const userBid = auction.bids?.find((bid: any) => 
      bid.user?._id === currentUserId || 
      bid.user?.id === currentUserId ||
      bid.user === currentUserId ||
      bid.bidder?._id === currentUserId ||
      bid.bidder?.id === currentUserId ||
      bid.bidder === currentUserId
    );
    if (userBid) {
      setCurrentUserBid((prevBid: any) => {
        // Reset alert tracking if user updated their max bid
        if (prevBid && userBid.autobidamount !== prevBid.autobidamount) {
          lastAlertedMaxBidRef.current = 0;
          console.log('  🔄 User updated max bid, reset alert tracking');
        }
        return userBid;
      });
      console.log('  💰 Current user bid updated:', userBid);
    }
    
    // Check if autobid max was exceeded
    const currentHighestBid = auction.newbaseprice || auction.higestbid || 0;
    const previousHighest = previousHighestBidRef.current;
    
    if (userBid && userBid.custom_bid && userBid.autobidamount) {
      // User has a max bid set (custom_bid with autobidamount)
      const userMaxBid = userBid.autobidamount || 0;
      
      // Check if highest bid exceeds user's max AND user is not the highest bidder
      const highestBidder = auction.bids?.[auction.bids.length - 1];
      const userIsHighest = highestBidder?.user?._id === currentUserId || 
                           highestBidder?.user?.id === currentUserId ||
                           highestBidder?.bidder?._id === currentUserId ||
                           highestBidder?.bidder?.id === currentUserId;
      
      // Only show toast if:
      // 1. Current bid exceeds user's max
      // 2. User is not winning
      // 3. Bid increased from previous
      // 4. We haven't already alerted for this max bid level
      if (currentHighestBid > userMaxBid && 
          !userIsHighest && 
          currentHighestBid > previousHighest &&
          userMaxBid !== lastAlertedMaxBidRef.current) {
        console.log('🚨 Autobid max exceeded!', {
          currentHighestBid,
          userMaxBid,
          userIsHighest,
          lastAlerted: lastAlertedMaxBidRef.current
        });
        toast({
          title: "You've been outbid!",
          description: `Someone bid $${currentHighestBid}. Your max was $${userMaxBid}.`,
          variant: "destructive",
          duration: 5000,
        });
        lastAlertedMaxBidRef.current = userMaxBid;
      }
    }
    
    previousHighestBidRef.current = currentHighestBid;
    
    findWinner(auction.bids || []);
  }, [setActiveAuction, setCurrentUserBid, toast, previousHighestBidRef, lastAlertedMaxBidRef, currentUserId, findWinner, roomId]);

  // Memoized handler: User bid updated (when updating max autobid)
  const handleUserBidUpdated = useCallback((updatedBid: any) => {
    console.log('🔄 USER-BID-UPDATED RECEIVED:', updatedBid);
    
    setActiveAuction((prev: any) => {
      if (!prev || !prev.bids) {
        console.log('  ⚠️ No previous auction or bids, keeping prev');
        return prev;
      }
      
      // Find and update the specific user's bid in the bids array
      const bids = prev.bids.map((bid: any) => {
        const bidUserId = bid.user?._id || bid.user?.id || bid.user || bid.bidder?._id || bid.bidder?.id || bid.bidder;
        const updatedUserId = updatedBid.user?._id || updatedBid.user?.id || updatedBid.user || updatedBid.bidder?._id || updatedBid.bidder?.id || updatedBid.bidder;
        
        if (bidUserId === updatedUserId) {
          console.log('  ✅ Found user bid to update:', bidUserId);
          return updatedBid; // Replace with updated bid
        }
        return bid;
      });
      
      const updated = {
        ...prev,
        bids: bids,
      };
      
      console.log('  Updated auction with new bid data');
      return updated;
    });
    
    // Update current user's bid state if it's their bid that was updated
    const updatedUserId = updatedBid.user?._id || updatedBid.user?.id || updatedBid.user || updatedBid.bidder?._id || updatedBid.bidder?.id || updatedBid.bidder;
    if (updatedUserId === currentUserId) {
      setCurrentUserBid(updatedBid);
      console.log('  💰 Current user bid updated:', updatedBid);
    }
    
    // Recalculate winner with updated bids
    setActiveAuction((prev: any) => {
      if (prev && prev.bids) {
        findWinner(prev.bids);
      }
      return prev;
    });
  }, [setActiveAuction, setCurrentUserBid, findWinner, currentUserId]);

  // Memoized handler: Auction time extended
  const handleAuctionTimeExtended = useCallback((data: any) => {
    console.log('Auction time extended:', data);
    
    const newEndTimeMs = data.newEndTime;
    const serverTime = data.serverTime;
    
    setActiveAuction((prev: any) => {
      if (!prev) return prev;
      
      const updated = {
        ...prev,
        endTime: newEndTimeMs,
      };
      
      if (serverTime) {
        updated.serverTime = serverTime;
        updated.serverOffset = serverTime - Date.now();
      }
      
      startTimerWithEndTime(updated);
      
      return updated;
    });
    
    setTimeAddedBlink(true);
    setTimeout(() => {
      setTimeAddedBlink(false);
    }, 1000);
  }, [setActiveAuction, setTimeAddedBlink, startTimerWithEndTime]);

  // Memoized handler: Auction ended
  const handleAuctionEnded = useCallback((auction: any) => {
    if (!auction) {
      return;
    }
    
    // Clear the running auction tracking since this auction has ended
    const endedAuctionId = auction._id || auction.id;
    console.log('🏁 Auction ended, clearing tracking for:', endedAuctionId);
    currentRunningAuctionIdRef.current = null;
    
    // Mark the auction as ended and preserve ALL bid data
    const endedAuction = {
      ...auction,
      ended: true
    };
    
    setActiveAuction(endedAuction);
    setCurrentUserBid(null); // Reset bid state when auction ends
    lastAlertedMaxBidRef.current = 0; // Reset alert tracking when auction ends
    
    const winner = findWinner(auction.bids || []);
    
    // Only show winner alert if we haven't already shown it (prevents duplicate from timer expiration)
    const auctionId = auction._id;
    if (winner && auctionId && !shownWinnerAlertsRef.current.has(auctionId)) {
      shownWinnerAlertsRef.current.add(auctionId);
      
      const winnerName = winner.user?.userName || winner.bidder?.userName || 'Someone';
      const winAmount = winner.amount || auction.higestbid || auction.newbaseprice;
      
      setWinnerData({
        name: winnerName,
        amount: winAmount,
        profileImage: winner.user?.profilePhoto,
        user: winner.user
      });
      setShowWinnerDialog(true);
      
      setTimeout(() => {
        setShowWinnerDialog(false);
      }, 5000);
    }
    
    // Invalidate show query to update sales metrics (salesTotal, salesCount)
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    
    // Invalidate sold orders query to refresh the orders list
    queryClient.invalidateQueries({ queryKey: ['/api/orders', roomId, 'sold'] });
    
    // Refetch the auction products list to update the tab
    // This won't affect activeAuction state because we have validation in the initialization effect
    debouncedRefetchAuction();
  }, [setActiveAuction, setCurrentUserBid, findWinner, setWinnerData, setShowWinnerDialog, debouncedRefetchAuction, shownWinnerAlertsRef, roomId, currentUserId]);

  // Memoized handler: Auction updated
  const handleAuctionUpdate = useCallback(() => {
    console.log('Auction updated - refetching auctions list and metrics');
    
    // Invalidate show query to update sales metrics (salesTotal, salesCount)
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    
    // Invalidate sold orders query to refresh the orders list
    queryClient.invalidateQueries({ queryKey: ['/api/orders', roomId, 'sold'] });
    
    // Refetch the auction products list to update the tab
    debouncedRefetchAuction();
  }, [debouncedRefetchAuction, roomId, currentUserId]);

  // Memoized handler: Giveaway started
  const handleGiveawayStarted = useCallback((roomData: any) => {
    console.log('Giveaway started - room data:', roomData);
    
    // Update state from room data
    const activeGive = roomData.activegiveaway || roomData.activeGiveaway || roomData.active_giveaway;
    
    setActiveGiveaway(activeGive || null);
    setActiveAuction(null); // Force clear auction when giveaway starts
    setPinnedProduct(null); // Force clear pinned product when giveaway starts
    
    // Invalidate query to keep data in sync
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
  }, [roomId, currentUserId, setActiveGiveaway, setActiveAuction, setPinnedProduct]);

  // Memoized handler: Giveaway joined
  const handleGiveawayJoined = useCallback((giveaway: any) => {
    console.log('Giveaway joined:', giveaway);
    setActiveGiveaway(giveaway);
  }, [setActiveGiveaway]);

  // Memoized handler: Giveaway ended
  const handleGiveawayEnded = useCallback((giveaway: any) => {
    console.log('Giveaway ended:', giveaway);
    
    if (giveaway.winner) {
      const winnerName = giveaway.winner.userName || giveaway.winner.firstName || 'Someone';
      const winnerProfile = giveaway.winner.profilePhoto || giveaway.winner.profileUrl || giveaway.winner.profilePicture;
      
      console.log('🎁 Showing giveaway winner overlay:', { winnerName, winnerProfile, winner: giveaway.winner });
      
      setGiveawayWinnerData({
        name: winnerName,
        profileImage: winnerProfile,
        giveawayName: giveaway.name || 'Giveaway'
      });
      setShowGiveawayWinnerDialog(true);
      
      setTimeout(() => {
        setShowGiveawayWinnerDialog(false);
        setActiveGiveaway(null);
      }, 10000);
    } else {
      setActiveGiveaway(null);
    }
    
    debouncedRefetchGiveaways();
  }, [setActiveGiveaway, setGiveawayWinnerData, setShowGiveawayWinnerDialog, debouncedRefetchGiveaways]);

  // Memoized handler: Marketplace order (buy-now purchase)
  const handleMarketplaceOrder = useCallback((data: any) => {
    console.log('🛒 MARKETPLACE ORDER EVENT RECEIVED:', data);
    console.log('🛒 Order data:', JSON.stringify(data, null, 2));
    
    // Invalidate queries to refresh product lists and room data
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    queryClient.invalidateQueries({ queryKey: ['/api/orders', roomId, 'sold'] });
    
    // Show notification banner to show owner only
    if (isShowOwner) {
      const buyerName = data?.buyerName || data?.userName || 'Someone';
      const productName = data?.productName || 'a product';
      
      setOrderNotificationData({
        buyerName,
        productName,
        message: data?.msg || `${buyerName} purchased ${productName}`
      });
      setShowOrderNotification(true);
      // Auto-dismiss handled by useEffect in show-view.tsx
    }
  }, [roomId, currentUserId, isShowOwner, setOrderNotificationData, setShowOrderNotification]);

  // Memoized handler: Rally in - viewer is being raided to another show
  const handleRallyIn = useCallback((data: any) => {
    console.log('🚀 RALLY-IN EVENT RECEIVED:', data);
    const { toRoom, hostName, viewerCount } = data;
    
    // Don't redirect the host who initiated the rally
    if (isShowOwner) {
      console.log('🚀 Host initiated rally, not redirecting self');
      return;
    }
    
    // Show toast notification
    toast({
      title: "You're being raided!",
      description: `${hostName} is moving you and ${viewerCount - 1} others to a new show`,
      duration: 3000,
    });
    
    // CRITICAL: Set leaving flag BEFORE leaving room to prevent auto-rejoin to OLD room
    // This suppresses the SocketProvider's auto-rejoin logic during the rally transition
    setLeavingRoom(true);
    console.log('🚀 Set leaving flag to prevent auto-rejoin to old room');
    
    // Leave current room
    if (roomId) {
      leaveRoom(roomId);
    }
    
    // Navigate to the target show after a short delay for smooth transition
    // The new show-view.tsx will handle joining and registering socket listeners automatically
    setTimeout(() => {
      console.log('🚀 Navigating to target show:', toRoom);
      navigate(`/show/${toRoom}`);
      
      // Clear leaving flag after navigation so the new page can join normally
      setTimeout(() => {
        console.log('🚀 Clearing leaving flag - new show will handle joining');
        setLeavingRoom(false);
      }, 300);
    }, 1000);
  }, [isShowOwner, roomId, leaveRoom, setLeavingRoom, navigate, toast]);

  // Flash sale timer ref
  const flashSaleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized handler: Flash sale started
  const handleFlashSaleStarted = useCallback((data: any) => {
    console.log('⚡ FLASH-SALE-STARTED EVENT RECEIVED:', data);
    const { productId, endTime, serverTime, discountType, discountValue } = data;
    
    // Calculate server offset for accurate timing
    const serverOffset = serverTime ? serverTime - Date.now() : 0;
    
    // Update pinned product with flash sale started state
    setPinnedProduct((prev: any) => {
      if (!prev || (prev._id !== productId && prev.id !== productId)) {
        console.log('⚡ Flash sale productId does not match pinned product, skipping update');
        return prev;
      }
      
      return {
        ...prev,
        flash_sale_started: true,
        flash_sale_ended: false,
        flashSaleEndTime: endTime,
        serverOffset: serverOffset,
        flash_sale_discount_type: discountType || prev.flash_sale_discount_type,
        flash_sale_discount_value: discountValue || prev.flash_sale_discount_value
      };
    });
    
    setActiveFlashSale({
      productId,
      endTime,
      serverTime,
      serverOffset
    });
    
    // Calculate initial time left
    const now = Date.now() + serverOffset;
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
    setFlashSaleTimeLeft(timeLeft);
    
    // Clear any existing timer
    if (flashSaleTimerRef.current) {
      clearInterval(flashSaleTimerRef.current);
    }
    
    // Start countdown timer
    flashSaleTimerRef.current = setInterval(() => {
      const currentTime = Date.now() + serverOffset;
      const remaining = Math.max(0, Math.floor((endTime - currentTime) / 1000));
      setFlashSaleTimeLeft(remaining);
      
      if (remaining <= 0) {
        if (flashSaleTimerRef.current) {
          clearInterval(flashSaleTimerRef.current);
          flashSaleTimerRef.current = null;
        }
        setActiveFlashSale(null);
        // Update pinned product to mark flash sale as ended
        setPinnedProduct((prev: any) => prev ? {
          ...prev,
          flash_sale_started: false,
          flash_sale_ended: true
        } : null);
        refetchBuyNow();
      }
    }, 1000);
    
    toast({
      title: "Flash Sale Started!",
      description: "Limited time deal - act fast!",
      duration: 3000,
    });
  }, [setActiveFlashSale, setFlashSaleTimeLeft, setPinnedProduct, refetchBuyNow, toast]);

  // Memoized handler: Flash sale ended
  const handleFlashSaleEnded = useCallback((data: any) => {
    console.log('⚡ FLASH-SALE-ENDED EVENT RECEIVED:', data);
    
    // Clear timer
    if (flashSaleTimerRef.current) {
      clearInterval(flashSaleTimerRef.current);
      flashSaleTimerRef.current = null;
    }
    
    setActiveFlashSale(null);
    setFlashSaleTimeLeft(0);
    refetchBuyNow();
    
    toast({
      title: "Flash Sale Ended",
      description: "The flash sale has ended.",
      duration: 3000,
    });
  }, [setActiveFlashSale, setFlashSaleTimeLeft, refetchBuyNow, toast]);

  // Memoized handler: Flash sale product update (quantity changed)
  const handleFlashSaleProductUpdate = useCallback((product: any) => {
    console.log('⚡ FLASH-SALE-PRODUCT-UPDATE EVENT RECEIVED:', product);
    
    // Update pinned product with new quantity
    setPinnedProduct((prev: any) => {
      if (prev && (prev._id === product._id || prev.id === product._id)) {
        return { ...prev, quantity: product.quantity };
      }
      return prev;
    });
    
    // If quantity is 0, end the flash sale
    if (product.quantity <= 0) {
      if (flashSaleTimerRef.current) {
        clearInterval(flashSaleTimerRef.current);
        flashSaleTimerRef.current = null;
      }
      setActiveFlashSale(null);
      setFlashSaleTimeLeft(0);
      refetchBuyNow();
    }
  }, [setPinnedProduct, setActiveFlashSale, setFlashSaleTimeLeft, refetchBuyNow]);

  // Memoized handler: Prebid - update product prebids in real-time
  const handlePrebid = useCallback((data: any) => {
    console.log('📡 PREBID EVENT RECEIVED:', data);
    const productId = data._id || data.id;
    const prebids = data.prebids;
    
    if (!productId || !roomId) {
      console.log('⚠️ Missing productId or roomId for prebid update');
      return;
    }
    
    // Update the cached auction products with new prebids
    queryClient.setQueryData(['/api/products', roomId, 'auction'], (old: any) => {
      if (!old?.products) {
        console.log('⚠️ No cached products for prebid update');
        return old;
      }
      
      const updatedProducts = old.products.map((product: any) => {
        if (product._id === productId || product.id === productId) {
          console.log('✅ Updated product prebids in cache:', productId, prebids);
          return {
            ...product,
            prebids: prebids
          };
        }
        return product;
      });
      
      return { ...old, products: updatedProducts };
    });
  }, [roomId]);

  // Refs to track current room and pending leave timeout for cleanup decisions
  const currentRoomRef = useRef<string | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Main effect: Register all socket event listeners
  // NOTE: This effect should NOT leave the room on cleanup when isConnected changes
  // That would cause issues during brief socket disconnects
  // IMPORTANT: Register listeners immediately without waiting for proceedWithJoin
  // This ensures rallied users don't miss events during the host conflict check
  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;

    // NOTE: Room joining is now handled in show-view.tsx when socket connects
    // This effect only registers event listeners
    
    console.log('✅ Socket event listeners registered for room:', roomId);

    // Register all event listeners
    socket.on('user-connected', handleUserConnected);
    socket.on('current-user-joined', handleCurrentUserJoined);
    socket.on('left-room', handleUserDisconnected);
    socket.on('room-started', handleRoomStarted);
    socket.on('room-ended', handleRoomEnded);
    socket.on('product-pinned', handleProductPinned);
    socket.on('updated-pinned-product', handlePinnedProductUpdated);
    socket.on('auction-started', handleAuctionStarted);
    socket.on('auction-pinned', handleAuctionPinned);
    socket.on('bid-updated', handleBidUpdated);
    socket.on('user-bid-updated', handleUserBidUpdated);
    socket.on('auction-time-extended', handleAuctionTimeExtended);
    socket.on('auction-ended', handleAuctionEnded);
    socket.on('auction-update', handleAuctionUpdate);
    socket.on('started-giveaway', handleGiveawayStarted);
    socket.on('joined-giveaway', handleGiveawayJoined);
    socket.on('ended-giveaway', handleGiveawayEnded);
    socket.on('marketplace_order', handleMarketplaceOrder);
    socket.on('fetch_offers', handleFetchOffers);
    socket.on('rally-in', handleRallyIn);
    socket.on('prebid', handlePrebid);
    socket.on('flash-sale-started', handleFlashSaleStarted);
    socket.on('flash-sale-ended', handleFlashSaleEnded);
    socket.on('flash-sale-product-update', handleFlashSaleProductUpdate);

    // Cleanup function - only unregister listeners, don't leave room
    // Room leaving is handled by the separate roomId-only effect below
    return () => {
      socket.off('user-connected', handleUserConnected);
      socket.off('current-user-joined', handleCurrentUserJoined);
      socket.off('left-room', handleUserDisconnected);
      socket.off('room-started', handleRoomStarted);
      socket.off('room-ended', handleRoomEnded);
      socket.off('product-pinned', handleProductPinned);
      socket.off('updated-pinned-product', handlePinnedProductUpdated);
      socket.off('auction-started', handleAuctionStarted);
      socket.off('auction-pinned', handleAuctionPinned);
      socket.off('bid-updated', handleBidUpdated);
      socket.off('user-bid-updated', handleUserBidUpdated);
      socket.off('auction-time-extended', handleAuctionTimeExtended);
      socket.off('auction-ended', handleAuctionEnded);
      socket.off('auction-update', handleAuctionUpdate);
      socket.off('started-giveaway', handleGiveawayStarted);
      socket.off('joined-giveaway', handleGiveawayJoined);
      socket.off('ended-giveaway', handleGiveawayEnded);
      socket.off('marketplace_order', handleMarketplaceOrder);
      socket.off('fetch_offers', handleFetchOffers);
      socket.off('rally-in', handleRallyIn);
      socket.off('prebid', handlePrebid);
      socket.off('flash-sale-started', handleFlashSaleStarted);
      socket.off('flash-sale-ended', handleFlashSaleEnded);
      socket.off('flash-sale-product-update', handleFlashSaleProductUpdate);
      socket.off('createMessage');
      // Clear flash sale timer on cleanup
      if (flashSaleTimerRef.current) {
        clearInterval(flashSaleTimerRef.current);
        flashSaleTimerRef.current = null;
      }
      console.log('🔌 Socket listeners cleaned up (room not left - handled separately)');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    socket,
    roomId,
    isConnected,
    handleCurrentUserJoined,
    handleUserBidUpdated,
  ]);

  // SEPARATE EFFECT: Handle room leaving ONLY when roomId changes or component unmounts
  // Uses debounced cleanup to prevent false leaves during re-renders
  useEffect(() => {
    if (!roomId) return;
    
    // Cancel any pending leave timeout - we're (re)entering a room
    if (leaveTimeoutRef.current) {
      console.log('🔌 Cancelled pending leave - effect re-ran');
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
      // IMPORTANT: Clear the leaving flag since we cancelled the debounced leave
      // This re-enables auto-rejoin on reconnect for the new room
      setLeavingRoom(false);
    }
    
    // Track the current room
    const previousRoom = currentRoomRef.current;
    currentRoomRef.current = roomId;
    
    // If we're switching rooms, leave the previous one immediately and clear flash sale
    if (previousRoom && previousRoom !== roomId) {
      console.log('🔌 Leaving previous room:', previousRoom, '(navigated to:', roomId, ')');
      leaveRoom(previousRoom);
      
      // Clear flash sale timer when switching rooms
      if (flashSaleTimerRef.current) {
        clearInterval(flashSaleTimerRef.current);
        flashSaleTimerRef.current = null;
      }
      // Reset flash sale state for new room
      setActiveFlashSale(null);
      setFlashSaleTimeLeft(0);
    }
    
    // Cleanup: set leaving flag to prevent auto-rejoin, then schedule debounced leave
    return () => {
      const roomToLeave = roomId;
      
      // IMMEDIATELY set leaving flag to suppress auto-rejoin on reconnect during debounce window
      // This is synchronous and happens before any debounce
      setLeavingRoom(true);
      
      // Schedule leave-room emit after a short delay
      // If effect re-runs immediately (re-render), this will be cancelled (and joinRoom clears the flag)
      // If it's a real unmount, the timeout will fire
      leaveTimeoutRef.current = setTimeout(() => {
        console.log('🔌 Debounced leave triggered - leaving room:', roomToLeave);
        leaveRoom(roomToLeave);
        // Clear the leaving flag after the leave is complete
        setLeavingRoom(false);
        if (currentRoomRef.current === roomToLeave) {
          currentRoomRef.current = null;
        }
        leaveTimeoutRef.current = null;
      }, 300); // 300ms debounce - enough to cancel on re-renders
    };
  }, [roomId, leaveRoom, setLeavingRoom]);
}
