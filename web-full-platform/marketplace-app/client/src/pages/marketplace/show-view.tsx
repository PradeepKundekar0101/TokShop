import { Link, useParams, useLocation } from 'wouter';
import { Search, Send, Volume2, VolumeX, Share2, Menu, X, Clock, Users, DollarSign, Gift, Truck, AlertTriangle, ShoppingBag, MessageCircle, Star, Wallet, MoreVertical, Edit, Trash, Play, Plus, Loader2, Bookmark, Link as LinkIcon, MoreHorizontal, Radio, User, Mail, AtSign, Ban, Flag, ChevronRight, Video, VideoOff, Mic, MicOff, FileText, Sparkles, Skull, Package, Zap } from 'lucide-react';
import { timeSync } from '@/lib/time-sync';
import { format, isToday, isTomorrow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { useSocket } from '@/lib/socket-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useShowSocketEvents } from '@/hooks/use-show-socket-events';
import { subscribeToRoomMessages, sendRoomMessage } from '@/lib/firebase-chat';
import { useLiveKit } from '@/hooks/use-livekit';
import { ProductForm } from '@/components/product-form';
import { ShareDialog } from '@/components/share-dialog';
import { BuyNowDialog } from '@/components/buy-now-dialog';
import { TipSellerDialog } from '@/components/tip-seller-dialog';
import { WalletDialog } from '@/components/wallet-dialog';
import { MakeOfferDialog } from '@/components/make-offer-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Import show-view components
import { ProductsSidebar } from '@/components/show-view/products-sidebar';
import { VideoCenter } from '@/components/show-view/video-center';
import { ChatSidebar } from '@/components/show-view/chat-sidebar';
import { DialogsContainer } from '@/components/show-view/dialogs-container';

// Lazy load heavy components
const LiveKitVideoPlayer = lazy(() => import('@/components/livekit-video-player'));
const PaymentShippingAlertDialog = lazy(() => import('@/components/payment-shipping-alert-dialog').then(m => ({ default: m.PaymentShippingAlertDialog })));
const PaymentMethodListDialog = lazy(() => import('@/components/payment-method-list-dialog').then(m => ({ default: m.PaymentMethodListDialog })));
const AddressListDialog = lazy(() => import('@/components/address-list-dialog'));

// Helper: Normalize auction endTime to always be a number (timestamp)
function normalizeAuctionEndTime(auction: any): any {
  if (!auction) return auction;
  
  const normalized = { ...auction };
  
  // Convert endTime to number if it's a string
  if (normalized.endTime) {
    if (typeof normalized.endTime === 'string') {
      normalized.endTime = new Date(normalized.endTime).getTime();
    }
  }
  
  // If no endTime but has startedTime and duration, calculate it
  if (!normalized.endTime && normalized.startedTime && normalized.duration) {
    normalized.endTime = normalized.startedTime + (normalized.duration * 1000);
  }
  
  return normalized;
}

export default function ShowViewNew() {
  usePageTitle('Live Show');
  const { settings, isFirebaseReady, fetchSettings } = useSettings();
  const { user, isAuthenticated, refreshUserData } = useAuth();
  
  // Initialize Firebase for chat messages
  useEffect(() => {
    if (!isFirebaseReady) {
      fetchSettings();
    }
  }, [isFirebaseReady, fetchSettings]);
  const { socket, isConnected, joinRoom, leaveRoom, setLeavingRoom, connect, disconnect } = useSocket();
  const { toast } = useToast();
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  // UI State
  const [message, setMessage] = useState('');
  const [muted, setMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('Chat');
  const [productTab, setProductTab] = useState('Auction');
  const [showMobileProducts, setShowMobileProducts] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [productActionSheet, setProductActionSheet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [addProductType, setAddProductType] = useState<'auction' | 'buy_now' | 'giveaway'>('buy_now');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isNotificationSaved, setIsNotificationSaved] = useState(false);
  const [showUserActionsDialog, setShowUserActionsDialog] = useState(false);
  const [showMoreOptionsSheet, setShowMoreOptionsSheet] = useState(false);
  const [isEndingShow, setIsEndingShow] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [showMentionDialog, setShowMentionDialog] = useState(false);
  const [showAuctionSettingsDialog, setShowAuctionSettingsDialog] = useState(false);
  const [auctionSettings, setAuctionSettings] = useState({
    startingPrice: 0,
    duration: 10,
    sudden: false,
    counterBidTime: 5
  });
  const [showPrebidDialog, setShowPrebidDialog] = useState(false);
  const [prebidAuction, setPrebidAuction] = useState<any>(null);
  const [prebidAmount, setPrebidAmount] = useState('');
  
  // Real-time State
  const [viewers, setViewers] = useState<any[]>([]);
  const [pinnedProduct, setPinnedProduct] = useState<any>(null);
  const [activeAuction, setActiveAuction] = useState<any>(null);
  const [activeGiveaway, setActiveGiveaway] = useState<any>(null);
  const [auctionTimeLeft, setAuctionTimeLeft] = useState<number>(0);
  const [giveawayTimeLeft, setGiveawayTimeLeft] = useState<number>(0);
  const [bidAmount, setBidAmount] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [shippingEstimate, setShippingEstimate] = useState<any>(null);
  const [winningUser, setWinningUser] = useState<any>(null);
  const [winningCurrentPrice, setWinningCurrentPrice] = useState<number>(0);
  const [timeAddedBlink, setTimeAddedBlink] = useState<boolean>(false);
  const [showWinnerDialog, setShowWinnerDialog] = useState<boolean>(false);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [showGiveawayWinnerDialog, setShowGiveawayWinnerDialog] = useState<boolean>(false);
  const [giveawayWinnerData, setGiveawayWinnerData] = useState<any>(null);
  const [showOrderNotification, setShowOrderNotification] = useState<boolean>(false);
  const [orderNotificationData, setOrderNotificationData] = useState<any>(null);
  
  // Track current user's bid for reliable state
  const [currentUserBid, setCurrentUserBid] = useState<any>(null);
  
  // Track autobid max exceeded state
  const previousHighestBidRef = useRef<number>(0);
  const lastAlertedMaxBidRef = useRef<number>(0);
  
  
  // Payment & Shipping Alert
  const [showPaymentShippingIntermediateAlert, setShowPaymentShippingIntermediateAlert] = useState<boolean>(false);
  const hasShownPaymentAlertRef = useRef<boolean>(false);
  
  // Wallet Dialog
  const [showWalletDialog, setShowWalletDialog] = useState<boolean>(false);
  const [showPaymentMethodsDialog, setShowPaymentMethodsDialog] = useState<boolean>(false);
  const [showAddressesDialog, setShowAddressesDialog] = useState<boolean>(false);
  
  // Track which auctions have already shown winner alerts (to prevent duplicates)
  const shownWinnerAlertsRef = useRef<Set<string>>(new Set());
  
  // Buy Now Dialog
  const [showBuyNowDialog, setShowBuyNowDialog] = useState<boolean>(false);
  const [buyNowProduct, setBuyNowProduct] = useState<any>(null);
  
  // Flash Sale State
  const [activeFlashSale, setActiveFlashSale] = useState<any>(null);
  const [flashSaleTimeLeft, setFlashSaleTimeLeft] = useState<number>(0);
  const [showFlashSaleDialog, setShowFlashSaleDialog] = useState<boolean>(false);
  const [flashSaleSettings, setFlashSaleSettings] = useState({
    salePrice: 0,
    duration: 60
  });
  
  // Make Offer Dialog
  const [showMakeOfferDialog, setShowMakeOfferDialog] = useState<boolean>(false);
  const [makeOfferProduct, setMakeOfferProduct] = useState<any>(null);
  const [pendingOfferPrice, setPendingOfferPrice] = useState<number | null>(null);
  
  // Custom Bid Dialog
  const [showCustomBidDialog, setShowCustomBidDialog] = useState<boolean>(false);
  
  // Tip Seller Dialog
  const [showTipDialog, setShowTipDialog] = useState<boolean>(false);
  
  // Order Detail Dialog
  const [showOrderDetailDialog, setShowOrderDetailDialog] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItemsPage, setOrderItemsPage] = useState<number>(1);
  
  // Track if join message has been sent
  const hasJoinedRef = useRef(false);
  const auctionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const orderNotificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashSaleRestorationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref for auto-scrolling chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Mention/tagging state
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [currentMentions, setCurrentMentions] = useState<Array<{ id: string; name: string }>>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  // Connect socket on mount (but don't disconnect on unmount - socket stays connected for show-to-show navigation)
  // Socket will auto-reconnect and auto-rejoin rooms, so we don't need to manage disconnect here
  // The SocketProvider handles cleanup when the entire app unmounts
  useEffect(() => {
    console.log('📱 Show view mounted - connecting socket...');
    connect();
    // Note: We intentionally do NOT disconnect on unmount to prevent race conditions
    // during show-to-show navigation (e.g., Rally feature). The socket stays connected
    // and room membership is managed by useShowSocketEvents hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount
  
  // Join room immediately when socket is connected
  const hasJoinedRoomRef = useRef(false);
  const hasSentJoinMessageRef = useRef(false);
  
  // Reset ALL real-time state and flags when room ID changes
  // This is CRITICAL for rally transitions - prevents old show's state from persisting
  useEffect(() => {
    console.log('🔄 Room ID changed - resetting all real-time state for new show:', id);
    
    // Reset join flags
    hasJoinedRoomRef.current = false;
    hasSentJoinMessageRef.current = false;
    hasShownPaymentAlertRef.current = false;
    
    // Reset all real-time state to fresh values
    setViewers([]);
    setPinnedProduct(null);
    setActiveAuction(null);
    setActiveGiveaway(null);
    setAuctionTimeLeft(0);
    setGiveawayTimeLeft(0);
    setBidAmount('');
    setChatMessages([]);
    setShippingEstimate(null);
    setWinningUser(null);
    setWinningCurrentPrice(0);
    setTimeAddedBlink(false);
    setShowWinnerDialog(false);
    setWinnerData(null);
    setShowGiveawayWinnerDialog(false);
    setGiveawayWinnerData(null);
    setShowOrderNotification(false);
    setOrderNotificationData(null);
    setCurrentUserBid(null);
    
    // Reset flash sale state
    setActiveFlashSale(null);
    setFlashSaleTimeLeft(0);
    
    // Reset refs
    previousHighestBidRef.current = 0;
    lastAlertedMaxBidRef.current = 0;
    shownWinnerAlertsRef.current = new Set();
    
    // Clear any running timers
    if (auctionTimerRef.current) {
      clearInterval(auctionTimerRef.current);
      auctionTimerRef.current = null;
    }
    if (orderNotificationTimerRef.current) {
      clearTimeout(orderNotificationTimerRef.current);
      orderNotificationTimerRef.current = null;
    }
    if (flashSaleRestorationTimerRef.current) {
      clearInterval(flashSaleRestorationTimerRef.current);
      flashSaleRestorationTimerRef.current = null;
    }
  }, [id]);
  
  // Flash sale countdown timer - starts when activeFlashSale exists and flashSaleTimeLeft > 0
  // This handles both socket-started and restored-from-show-data flash sales
  useEffect(() => {
    // Only start timer if we have an active flash sale with time remaining
    if (!activeFlashSale || flashSaleTimeLeft <= 0) {
      // Clean up any existing timer when flash sale ends
      if (flashSaleRestorationTimerRef.current) {
        clearInterval(flashSaleRestorationTimerRef.current);
        flashSaleRestorationTimerRef.current = null;
      }
      return;
    }
    
    // Don't create duplicate timers
    if (flashSaleRestorationTimerRef.current) {
      return;
    }
    
    console.log('⏱️ Starting flash sale countdown timer, time left:', flashSaleTimeLeft);
    
    flashSaleRestorationTimerRef.current = setInterval(() => {
      setFlashSaleTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          console.log('⏱️ Flash sale countdown reached 0, clearing timer');
          if (flashSaleRestorationTimerRef.current) {
            clearInterval(flashSaleRestorationTimerRef.current);
            flashSaleRestorationTimerRef.current = null;
          }
          setActiveFlashSale(null);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (flashSaleRestorationTimerRef.current) {
        clearInterval(flashSaleRestorationTimerRef.current);
        flashSaleRestorationTimerRef.current = null;
      }
    };
  }, [activeFlashSale, flashSaleTimeLeft > 0]);
  
  useEffect(() => {
    if (!id) return;
    
    console.log('🔄 Room join check:', {
      isConnected,
      hasJoined: hasJoinedRoomRef.current,
      willJoin: isConnected && !hasJoinedRoomRef.current
    });
    
    // Join the socket room (only once per room)
    if (isConnected && !hasJoinedRoomRef.current) {
      console.log('✅ Socket connected - joining room immediately:', id);
      joinRoom(id);
      hasJoinedRoomRef.current = true;
    }
    
    // Send join message to Firebase (only once per room, when user and firebase are ready)
    if (isConnected && user && isFirebaseReady && !hasSentJoinMessageRef.current) {
      const userId = (user as any)?._id || user?.id;
      const userName = (user as any)?.userName || (user as any)?.firstName?.trim() || 'User';
      const userPhoto = (user as any)?.profilePhoto?.trim() || '';
      
      if (userId) {
        hasSentJoinMessageRef.current = true;
        console.log('📨 Sending join message');
        sendRoomMessage(id, 'joined 👋', userId, userName, userPhoto, [])
          .then(() => console.log('✅ Join message sent'))
          .catch((err) => {
            console.error('❌ Failed to send join message:', err);
            hasSentJoinMessageRef.current = false; // Allow retry on error
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isConnected, user, isFirebaseReady]);
  
  // Set mobile viewport height accounting for browser chrome
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--mobile-vh', `${window.innerHeight}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
  
  // Follow state - track locally
  const [isFollowingHost, setIsFollowingHost] = useState(false);
  
  // LiveKit state
  const [livekitEnabled, setLivekitEnabled] = useState(false);
  const [cameraSettings, setCameraSettings] = useState<{ deviceId?: string; resolution?: { width: number; height: number } } | undefined>(undefined);
  
  // Host conflict detection
  const [showHostConflictDialog, setShowHostConflictDialog] = useState(false);
  const [conflictingShow, setConflictingShow] = useState<any>(null);
  const [proceedWithJoin, setProceedWithJoin] = useState(false);
  
  // Fetch single show from API
  const currentUserId = (user as any)?._id || user?.id;
  
  // Initialize currentUserBid when activeAuction loads or changes
  useEffect(() => {
    if (!activeAuction || !currentUserId) {
      setCurrentUserBid(null);
      return;
    }
    
    // Find user's existing bid in the loaded auction
    // Handle both bid.user and bid.bidder formats
    const userBid = activeAuction.bids?.find((bid: any) => 
      bid.user?._id === currentUserId || 
      bid.user?.id === currentUserId ||
      bid.user === currentUserId ||
      bid.bidder?._id === currentUserId ||
      bid.bidder?.id === currentUserId ||
      bid.bidder === currentUserId
    );
    
    if (userBid) {
      setCurrentUserBid(userBid);
      console.log('💰 Initial currentUserBid set from activeAuction:', userBid);
    } else {
      setCurrentUserBid(null);
    }
  }, [activeAuction?._id, activeAuction?.id, currentUserId]); // Watch both _id and id
  
  const { data: show, isLoading, refetch: refetchShow } = useQuery<any>({
    queryKey: ['/api/rooms', id, currentUserId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentUserId) {
        params.set('currentUserId', currentUserId);
      }
      const url = `/api/rooms/${id}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch show');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch auction products for this show
  const { data: auctionProductsData, refetch: refetchAuction } = useQuery<any>({
    queryKey: ['/api/products', id, 'auction'],
    queryFn: async () => {
      const params = new URLSearchParams({
        roomId: id!,
        saletype: 'auction',
        status: 'active',
        page: '1',
        limit: '50'
      });
      const url = `/api/products?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) return { products: [] };
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch buy now products for this show
  const { data: buyNowProductsData, refetch: refetchBuyNow } = useQuery<any>({
    queryKey: ['/api/products', id, 'buy_now'],
    queryFn: async () => {
      const params = new URLSearchParams({
        roomId: id!,
        saletype: 'buy_now',
        status: 'active',
        page: '1',
        limit: '50'
      });
      const url = `/api/products?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) return { products: [] };
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch sold orders for this show
  const { data: soldOrdersData, refetch: refetchSold } = useQuery<any>({
    queryKey: ['/api/orders/items/all', id, 'sold'],
    queryFn: async () => {
      const params = new URLSearchParams({
        tokshow: id!,
        page: '1',
        limit: '50'
      });
      const url = `/api/orders/items/all?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) return { orders: [] };
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch giveaways for this show
  const { data: giveawaysData, refetch: refetchGiveaways } = useQuery<any>({
    queryKey: ['/api/giveaways', id],
    queryFn: async () => {
      const params = new URLSearchParams({
        room: id!,
        type: 'show',
        status: 'active',
        page: '1',
        limit: '20'
      });
      const url = `/api/giveaways?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) return { giveaways: [] };
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch offers for this show (only for show owner)
  const { data: offersData, refetch: refetchOffers } = useQuery<any>({
    queryKey: ['/api/offers', id, 'show', currentUserId],
    queryFn: async () => {
      const params = new URLSearchParams({
        tokshowId: id!,
        user: currentUserId!,
        role: 'seller',
        page: '1',
        limit: '100'
      });
      const url = `/api/offers?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) return { offers: [] };
      return response.json();
    },
    enabled: !!id && !!currentUserId && isAuthenticated,
  });

  // Extract offers data - flatten from products array if grouped by product
  const offers = useMemo(() => {
    if (offersData?.offers) {
      return offersData.offers;
    }
    // If grouped by products, flatten them
    if (offersData?.products) {
      const allOffers: any[] = [];
      offersData.products.forEach((product: any) => {
        (product.offers || []).forEach((offer: any) => {
          allOffers.push({
            ...offer,
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              images: product.images
            }
          });
        });
      });
      return allOffers;
    }
    return [];
  }, [offersData]);
  const offersCount = offers.filter((o: any) => o.status === 'pending').length;

  // Extract stable owner ID from show data to prevent infinite loops
  const ownerId = useMemo(() => show?.owner?._id || show?.owner?.id, [show?.owner?._id, show?.owner?.id]);

  // Persist owner ID in ref once available (for race condition protection)
  const ownerIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (ownerId !== ownerIdRef.current) {
      ownerIdRef.current = ownerId;
      console.log('📌 Updated ownerId in ref:', ownerId);
    }
  }, [ownerId]);
  
  // Reset ownerIdRef when room/show changes
  useEffect(() => {
    return () => {
      ownerIdRef.current = undefined;
    };
  }, [id]);

  // Initialize viewers from show data
  useEffect(() => {
    if (show?.viewers && Array.isArray(show.viewers)) {
      console.log('👥 Initializing viewers from show data:', show.viewers.length);
      // Only update if the viewers count or content has actually changed
      setViewers(prev => {
        // Check if viewers array has actually changed
        if (prev.length === show.viewers.length) {
          const isSame = prev.every((viewer, index) => {
            const showViewer = show.viewers[index];
            return (viewer._id || viewer.userId) === (showViewer._id || showViewer.userId);
          });
          if (isSame) return prev; // No change, return previous to avoid re-render
        }
        return show.viewers;
      });
    }
  }, [show]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Helper: Find winner from bids (highest bidder)
  const findWinner = useCallback((bids: any[]) => {
    console.log('🏆 findWinner called with bids:', bids);
    
    if (!bids || bids.length === 0) {
      console.log('  ❌ No bids, clearing winner');
      setWinningUser(null);
      setWinningCurrentPrice(0);
      return null;
    }
    
    const allBidAmounts = bids.map(bid => bid.amount);
    const highestBid = Math.max(...allBidAmounts);
    const winningBid = bids.find(bid => bid.amount === highestBid);
    
    console.log('  🎯 Highest bid:', highestBid);
    console.log('  🎯 Winning bid:', winningBid);
    console.log('  👤 Winner user:', winningBid?.user);
    
    // Bids have a 'user' field, not 'bidder'
    const winner = winningBid?.user || winningBid?.bidder;
    setWinningUser(winner);
    setWinningCurrentPrice(highestBid);
    
    console.log('  ✅ Set winningUser to:', winner);
    
    return winningBid;
  }, []);

  // Helper: Get shipping estimate
  const getShippingEstimate = useCallback(async (auction: any) => {
    // Skip if user is the show owner (check persisted ownerIdRef for early events)
    const stableOwnerId = ownerId || ownerIdRef.current;
    if (stableOwnerId && isAuthenticated && currentUserId === stableOwnerId) {
      console.log('🚫 Skipping shipping estimate: user is show owner');
      return;
    }
    
    if (!auction?.product?.shipping_profile || !currentUserId) {
      console.log('🚫 Skipping shipping estimate:', {
        hasShippingProfile: !!auction?.product?.shipping_profile,
        hasCurrentUserId: !!currentUserId
      });
      return;
    }
    
    try {
      const payload = {
        weight: auction.product.shipping_profile.weight,
        unit: auction.product.shipping_profile.scale,
        product: auction.product._id || auction.product.id,
        update: true,
        owner: ownerId,
        customer: currentUserId,
        tokshow: id,
        buying_label: false
      };
      
      console.log('📦 Fetching shipping estimate with payload:', payload);
      
      const shippingHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const userToken = localStorage.getItem('accessToken');
      if (userToken) {
        shippingHeaders['x-access-token'] = userToken;
        shippingHeaders['Authorization'] = `Bearer ${userToken}`;
      }
      const userData = localStorage.getItem('user');
      if (userData) {
        shippingHeaders['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
      }
      
      const response = await fetch('/api/shipping/estimate', {
        method: 'POST',
        headers: shippingHeaders,
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Shipping estimate received:', data);
        
        // Check if API returned an error (unshippable address)
        if (data.success === false && data.message) {
          console.warn('⚠️ Shipping estimate error:', data.message);
          setShippingEstimate({
            error: true,
            message: data.message,
            amount: '0.00'
          });
        } else {
          setShippingEstimate({
            amount: data.amount,
            currency: data.currency,
            rate_id: data.objectId,
            bundleId: data.bundleId,
            totalWeightOz: data.totalWeightOz,
            seller_shipping_fee_pay: data.seller_shipping_fee_pay,
            carrierAccount: data.carrierAccount,
            servicelevel: data.servicelevel?.name || ''
          });
        }
      } else {
        console.error('❌ Shipping estimate failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error getting shipping estimate:', error);
    }
  }, [currentUserId, ownerId, id, isAuthenticated]);

  // Helper: Start timer with endTime and server offset
  const startTimerWithEndTime = useCallback((auction: any) => {
    // Cancel existing timer
    if (auctionTimerRef.current) {
      clearInterval(auctionTimerRef.current);
    }
    
    // Don't start timer if no endTime
    if (!auction.endTime) {
      console.log('⚠️ Cannot start timer: no endTime in auction', auction._id);
      return;
    }
    
    // Normalize endTime to number
    let endTimeMs = typeof auction.endTime === 'string' 
      ? new Date(auction.endTime).getTime() 
      : auction.endTime;
    
    // Validate that we have a valid numeric timestamp
    if (!Number.isFinite(endTimeMs)) {
      console.error('❌ Invalid endTime:', auction.endTime, 'Cannot start timer');
      return;
    }
    
    console.log('⏰ Starting timer:', {
      endTimeMs,
      startedTime: auction.startedTime,
      adjustedNow: timeSync.adjustedNow(),
      localNow: Date.now(),
      offset: timeSync.getOffset(),
      duration: auction.duration,
      remaining: Math.floor((endTimeMs - timeSync.adjustedNow()) / 1000)
    });
    
    // Calculate remaining time using time-synced clock
    const initialRemaining = Math.floor((endTimeMs - timeSync.adjustedNow()) / 1000);
    if (initialRemaining > 0) {
      setAuctionTimeLeft(initialRemaining);
    }
    
    auctionTimerRef.current = setInterval(() => {
      // Get current endTime from state instead of closure
      setActiveAuction((currentAuction: any) => {
        if (!currentAuction || !currentAuction.endTime) {
          if (auctionTimerRef.current) {
            clearInterval(auctionTimerRef.current);
          }
          setAuctionTimeLeft(0);
          return currentAuction;
        }
        
        // Normalize endTime to number in case state was updated with string
        const endTimeMs = typeof currentAuction.endTime === 'string'
          ? new Date(currentAuction.endTime).getTime()
          : currentAuction.endTime;
        
        // Validate endTime
        if (!Number.isFinite(endTimeMs)) {
          console.error('❌ Invalid endTime in timer callback:', currentAuction.endTime);
          if (auctionTimerRef.current) {
            clearInterval(auctionTimerRef.current);
          }
          setAuctionTimeLeft(0);
          return currentAuction;
        }
        
        // Use time-synced clock for accurate countdown
        const remaining = Math.floor((endTimeMs - timeSync.adjustedNow()) / 1000);
        
        if (remaining <= 0) {
          setAuctionTimeLeft(0);
          if (auctionTimerRef.current) {
            clearInterval(auctionTimerRef.current);
          }
          
          // Show winner alert when timer expires (only once per auction)
          const auctionId = currentAuction._id;
          if (auctionId && !shownWinnerAlertsRef.current.has(auctionId)) {
            shownWinnerAlertsRef.current.add(auctionId);
            
            const winner = findWinner(currentAuction.bids || []);
            if (winner) {
              const winnerName = winner.user?.userName || winner.bidder?.userName || 'Someone';
              const winAmount = winner.amount || currentAuction.higestbid || currentAuction.newbaseprice;
              
              setWinnerData({
                name: winnerName,
                amount: winAmount,
                profileImage: winner.user?.profilePhoto,
                user: winner.user
              });
            }
          }
          
          // Mark auction as ended locally when timer expires
          // This ensures UI updates immediately (prebid button shows, bid buttons hide)
          // The socket event will also set ended: true, but may be delayed
          return {
            ...currentAuction,
            ended: true
          };
        } else {
          setAuctionTimeLeft(remaining);
          return currentAuction;
        }
      });
    }, 1000);
  }, [findWinner]);

  // Reset join flag when room ID changes
  useEffect(() => {
    hasJoinedRef.current = false;
    setImageError(false); // Reset image error state
  }, [id]);

  // Check if user is already in invitedhostIds when show data loads
  useEffect(() => {
    if (show && currentUserId) {
      const invitedIds = show.invitedhostIds || show.invited_host_ids || [];
      setIsNotificationSaved(invitedIds.includes(currentUserId));
    }
  }, [show, currentUserId]);

  // Initialize activeAuction, activeGiveaway, and pinnedProduct from show data (for page refresh)
  useEffect(() => {
    console.log('🔄 Initialization useEffect running. Show data:', show);
    if (show) {
      const showActiveAuction = show.activeauction || show.activeAuction || show.active_auction;
      console.log('🔍 BEFORE setActiveAuction - showActiveAuction:', showActiveAuction);
      
      // Validate that showActiveAuction is a real auction object, not an empty Mongoose document
      // Empty Mongoose docs have {$__, $isNew, _doc, success} but no actual auction data
      // Check for: valid _id, product object exists, and has bids array (even if empty)
      const isValidAuction = showActiveAuction && 
        showActiveAuction._id && 
        typeof showActiveAuction._id === 'string' &&
        showActiveAuction._id.length > 0 &&
        showActiveAuction.product &&
        Array.isArray(showActiveAuction.bids);
      
      // Check if the auction has ended
      // Calculate endTime from startedTime + duration if not present
      let calculatedEndTime = showActiveAuction?.endTime;
      if (!calculatedEndTime && showActiveAuction?.startedTime && showActiveAuction?.duration) {
        calculatedEndTime = showActiveAuction.startedTime + (showActiveAuction.duration * 1000);
      }
      
      const isAuctionEnded = showActiveAuction?.ended === true || 
        (calculatedEndTime && Date.now() >= (typeof calculatedEndTime === 'string' ? new Date(calculatedEndTime).getTime() : calculatedEndTime));
      
      // CRITICAL FIX: Check if we already have an activeAuction in state with a DIFFERENT ID
      // If so, don't overwrite it - the socket event (auction-started) has the fresher data
      // This prevents stale show query data from overwriting the correct auction state
      setActiveAuction((currentAuction: any) => {
        const showAuctionId = showActiveAuction?._id;
        const currentAuctionId = currentAuction?._id;
        
        // If we have a current auction with a DIFFERENT ID and it's NOT ended, don't overwrite
        // The socket auction-started event has already set the correct auction
        if (currentAuction && currentAuctionId && showAuctionId && 
            currentAuctionId !== showAuctionId && currentAuction.ended !== true) {
          console.log('🛡️ PROTECTING activeAuction state - current auction ID differs from show data:', {
            currentId: currentAuctionId,
            showId: showAuctionId,
            currentEnded: currentAuction.ended
          });
          return currentAuction; // Keep the current (fresher) auction
        }
        
        if (isValidAuction && !isAuctionEnded) {
          console.log('📦 Initializing active auction from show data:', showActiveAuction);
          console.log('🔍 Show activeauction bids:', showActiveAuction.bids);
          console.log('🔍 Show activeauction ended:', showActiveAuction.ended);
          console.log('🔍 Full show object keys:', Object.keys(show));
          
          // Normalize endTime to always be a number
          const normalizedAuction = normalizeAuctionEndTime(showActiveAuction);
          
          // Update global time sync if serverTime is present
          if (normalizedAuction.serverTime) {
            timeSync.updateFromServerTime(normalizedAuction.serverTime, 'http');
          }
          
          console.log('🔍 CALLING setActiveAuction with:', normalizedAuction);
          
          // Start timer and find winner for running auction
          findWinner(normalizedAuction.bids || []);
          startTimerWithEndTime(normalizedAuction);
          getShippingEstimate(normalizedAuction);
          
          return normalizedAuction;
        } else if (isAuctionEnded) {
          // Only set ended auction if we don't have a current running auction with different ID
          if (!currentAuction || currentAuctionId === showAuctionId || currentAuction.ended === true) {
            console.log('⏰ Auction in show data has ended - setting it to show on overlay');
            // Set the ended auction so it shows on the overlay
            const normalizedEndedAuction = normalizeAuctionEndTime(showActiveAuction);
            
            // Find winner for ended auction (no shipping estimate needed - order already placed)
            findWinner(showActiveAuction.bids || []);
            
            return normalizedEndedAuction;
          } else {
            console.log('🛡️ Not overwriting current running auction with ended show data');
            return currentAuction;
          }
        } else {
          console.log('⚠️ NO valid activeAuction found in show data (might be empty Mongoose doc), NOT updating activeAuction state');
          return currentAuction;
        }
      });
      
      const showActiveGiveaway = show.pinned_giveaway || show.pinnedGiveaway || show.activegiveaway || show.activeGiveaway || show.active_giveaway;
      if (showActiveGiveaway) {
        console.log('📦 Initializing active giveaway from show data:', showActiveGiveaway);
        setActiveGiveaway(showActiveGiveaway);
      }
      
      // Initialize pinned product from show data
      // But SKIP if it's the same as the active auction product
      if (show.pinned) {
        const auctionProductId = showActiveAuction?.product?._id || showActiveAuction?.product?.id;
        const pinnedProductId = show.pinned._id || show.pinned.id;
        
        if (auctionProductId && pinnedProductId === auctionProductId) {
          console.log('📌 Skipping pinned product - same as active auction product');
          setPinnedProduct(null);
        } else {
          console.log('📌 Initializing pinned product from show data:', show.pinned);
          setPinnedProduct(show.pinned);
          
          // Restore active flash sale state if there's an ongoing flash sale
          // Check if flash_sale_end_time is in the future (most reliable indicator)
          if (show.pinned.flash_sale && show.pinned.flash_sale_end_time && !show.pinned.flash_sale_ended) {
            const endTime = new Date(show.pinned.flash_sale_end_time).getTime();
            const now = Date.now();
            const remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));
            
            console.log('⚡ Flash sale check on load:', {
              flash_sale: show.pinned.flash_sale,
              flash_sale_started: show.pinned.flash_sale_started,
              flash_sale_ended: show.pinned.flash_sale_ended,
              flash_sale_end_time: show.pinned.flash_sale_end_time,
              endTime,
              now,
              remainingTime
            });
            
            if (remainingTime > 0) {
              console.log('⚡ Restoring active flash sale from show data:', {
                productId: show.pinned._id,
                endTime: show.pinned.flash_sale_end_time,
                remainingTime,
                quantityLeft: show.pinned.quantity
              });
              
              setActiveFlashSale({
                productId: show.pinned._id || show.pinned.id,
                startedAt: endTime - (show.pinned.flash_sale_duration * 1000),
                duration: show.pinned.flash_sale_duration,
                quantityLeft: show.pinned.quantity,
                discountType: show.pinned.flash_sale_discount_type || 'percentage',
                discountValue: show.pinned.flash_sale_discount_value || 0,
                originalPrice: show.pinned.price,
                salePrice: show.pinned.flash_sale_price
              });
              setFlashSaleTimeLeft(remainingTime);
            } else {
              console.log('⚡ Flash sale has expired, not restoring');
            }
          }
          
          // Get shipping estimate for pinned product (skip if user is show owner)
          const hostId = show?.owner?._id || show?.owner?.id;
          const isOwner = isAuthenticated && currentUserId === hostId;
          
          if (show.pinned.shipping_profile && !isOwner) {
          const pinnedPayload = {
            weight: show.pinned.shipping_profile.weight,
            unit: show.pinned.shipping_profile.scale,
            product: show.pinned._id || show.pinned.id,
            update: true,
            owner: show?.owner?._id || show?.owner?.id,
            customer: currentUserId,
            tokshow: id,
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
              
              // Check if API returned an error (unshippable address)
              if (data.success === false && data.message) {
                console.warn('⚠️ Pinned product shipping estimate error:', data.message);
                setShippingEstimate({
                  error: true,
                  message: data.message,
                  amount: '0.00'
                });
              } else {
                setShippingEstimate({
                  amount: data.amount,
                  currency: data.currency,
                  rate_id: data.objectId,
                  bundleId: data.bundleId,
                  totalWeightOz: data.totalWeightOz,
                  seller_shipping_fee_pay: data.seller_shipping_fee_pay,
                  carrierAccount: data.carrierAccount,
                  servicelevel: data.servicelevel?.name || ''
                });
              }
            })
            .catch(err => console.error('❌ Error fetching pinned product shipping:', err));
          } else if (isOwner) {
            console.log('🚫 Skipping shipping estimate for pinned product: user is show owner');
          }
        }
      } else {
        setPinnedProduct(null);
      }
    }
  }, [show]);

  // Auto-connect to LiveKit if show has already started
  useEffect(() => {
    console.log('🎥 Auto-connect check:', {
      hasShow: !!show,
      status: show?.status,
      started: show?.started,
      ended: show?.ended,
      willConnect: show && show.started === true && !show?.ended
    });
    
    // Don't enable LiveKit if show has ended
    if (show?.ended) {
      console.log('❌ Show has ended, not enabling LiveKit');
      setLivekitEnabled(false);
      return;
    }
    
    // Don't enable LiveKit if show hasn't started
    if (show && !show.started) {
      console.log('❌ Show has not started yet, not enabling LiveKit');
      setLivekitEnabled(false);
      return;
    }
    
    if (show && show.started === true) {
      console.log('✅ Auto-enabling LiveKit connection');
      setLivekitEnabled(true);
    }
  }, [show]);

  // Check for host conflicts before joining room
  useEffect(() => {
    if (!socket || !id || !isConnected) return;
    
    // If user is not authenticated, allow immediate join
    if (!isAuthenticated || !currentUserId) {
      setProceedWithJoin(true);
      return;
    }
    
    // Check if user has an active show running
    const checkActiveShows = async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "10",
          userid: currentUserId,
          currentUserId: currentUserId,
          status: "active"
        });
        
        const response = await fetch(`/api/rooms?${params.toString()}`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          setProceedWithJoin(true);
          return;
        }
        
        const data = await response.json();
        const activeShows = data.rooms || [];
        
        // Find shows where user is the owner and show has started but not ended
        const userActiveShows = activeShows.filter((s: any) => {
          const ownerId = s.owner?._id || s.owner?.id;
          return ownerId === currentUserId && s.started === true && !s.ended;
        });
        
        // If user has an active show and is trying to join a different one
        if (userActiveShows.length > 0 && userActiveShows[0]._id !== id) {
          console.log('⚠️ Host conflict detected:', {
            activeShow: userActiveShows[0]._id,
            attemptingToJoin: id
          });
          setConflictingShow(userActiveShows[0]);
          setShowHostConflictDialog(true);
          return; // Don't join yet
        }
        
        // No conflict, proceed with joining
        setProceedWithJoin(true);
      } catch (error) {
        console.error('Error checking active shows:', error);
        // On error, allow joining anyway
        setProceedWithJoin(true);
      }
    };
    
    checkActiveShows();
  }, [socket, id, isConnected, isAuthenticated, currentUserId]);

  // Determine if current user is the show owner
  const host = show?.owner;
  const hostId = host?._id || host?.id;
  const isShowOwner = isAuthenticated && currentUserId === hostId;

  // Socket.IO real-time event listeners (refactored into custom hook)
  useShowSocketEvents({
    socket,
    roomId: id,
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
  });


  // Subscribe to Firebase room messages - wait for Firebase to be ready
  useEffect(() => {
    if (!id || !isFirebaseReady) return;
    
    console.log(`📨 Subscribing to room messages for show: ${id}`);
    
    const unsubscribe = subscribeToRoomMessages(
      id,
      (messages) => {
        console.log(`📨 Received ${messages.length} messages:`, messages);
        const formattedMessages = messages.map(msg => ({
          message: msg.message,
          senderName: msg.senderName,
          senderId: msg.sender,
          timestamp: msg.date,
          image_url: msg.senderProfileUrl,
          mentions: msg.mentions || []
        }));
        console.log('📨 Formatted messages:', formattedMessages);
        setChatMessages(formattedMessages);
      },
      (error) => {
        console.error('❌ Error loading room messages:', error);
      }
    );
    
    return () => {
      console.log(`📨 Unsubscribing from room messages for show: ${id}`);
      unsubscribe();
    };
  }, [id, isFirebaseReady]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      });
    }
  }, [chatMessages]);

  // Auto-dismiss order notification banner after 5 seconds
  // Using useEffect ensures proper cleanup when new orders arrive
  useEffect(() => {
    if (showOrderNotification) {
      // Clear any existing timer to prevent race conditions
      if (orderNotificationTimerRef.current) {
        clearTimeout(orderNotificationTimerRef.current);
      }
      
      // Set new timer to auto-dismiss
      orderNotificationTimerRef.current = setTimeout(() => {
        setShowOrderNotification(false);
      }, 5000);
    }
    
    // Cleanup: clear timer when component unmounts or when showOrderNotification changes
    return () => {
      if (orderNotificationTimerRef.current) {
        clearTimeout(orderNotificationTimerRef.current);
      }
    };
  }, [showOrderNotification, orderNotificationData]);

  // Search users for mentions
  const searchUsers = async (query: string) => {
    if (!query || query.length < 1) {
      setUserSuggestions([]);
      return;
    }
    
    setIsSearchingUsers(true);
    try {
      const response = await fetch(`/users?title=${encodeURIComponent(query)}&page=1&limit=10`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUserSuggestions(data.users || data.data || []);
      } else {
        setUserSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUserSuggestions([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };
  
  // Handle message input change with @ detection
  const handleMessageChange = (text: string) => {
    setMessage(text);
    
    // Check if last word starts with @
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      // Search for users
      const searchQuery = lastWord.substring(1);
      searchUsers(searchQuery);
      setShowMentionDialog(true);
    } else {
      // Clear suggestions
      setUserSuggestions([]);
      setShowMentionDialog(false);
    }
  };
  
  // Handle mention selection
  const selectMention = (userName: string, userId: string) => {
    const words = message.split(' ');
    const lastWord = words[words.length - 1];
    
    // Replace the @word with @username followed by space
    const newText = lastWord.startsWith('@')
      ? message.substring(0, message.length - lastWord.length) + `@${userName} `
      : `${message} @${userName} `;
    
    setMessage(newText);
    
    // Add to current mentions
    setCurrentMentions(prev => [...prev, { id: userId, name: userName }]);
    
    // Clear suggestions and close dialog
    setUserSuggestions([]);
    setShowMentionDialog(false);
    
    // Focus back on input and move cursor to end
    if (messageInputRef.current) {
      messageInputRef.current.focus();
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.setSelectionRange(newText.length, newText.length);
        }
      }, 0);
    }
  };
  
  // Render message with clickable mentions
  const renderMessageWithMentions = (messageText: string, mentions: Array<{ id: string; name: string }> = []) => {
    // Check if message is a question (contains '?') - use primary color from settings
    const isQuestion = messageText.includes('?');
    const baseTextColor = isQuestion ? 'text-primary font-medium' : 'text-zinc-300';
    
    if (!mentions || mentions.length === 0) {
      return <span className={`text-xs ${baseTextColor}`}>{messageText}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    // Sort mentions by their position in the text to process them in order
    const sortedMentions = [...mentions].sort((a, b) => {
      const handleA = `@${a.name}`;
      const handleB = `@${b.name}`;
      const indexA = messageText.indexOf(handleA, lastIndex);
      const indexB = messageText.indexOf(handleB, lastIndex);
      return indexA - indexB;
    });

    sortedMentions.forEach((mention, idx) => {
      const handle = `@${mention.name}`;
      const mentionIndex = messageText.indexOf(handle, lastIndex);

      if (mentionIndex === -1) return;

      // Add text before mention
      if (mentionIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className={`text-xs ${baseTextColor}`}>
            {messageText.substring(lastIndex, mentionIndex)}
          </span>
        );
      }

      // Add clickable mention
      parts.push(
        <span
          key={`mention-${idx}`}
          onClick={() => window.open(`/profile/${mention.id}`, '_blank')}
          className="text-xs text-primary font-bold cursor-pointer hover:underline"
        >
          {handle}
        </span>
      );

      lastIndex = mentionIndex + handle.length;
    });

    // Add remaining text after last mention
    if (lastIndex < messageText.length) {
      parts.push(
        <span key="text-end" className={`text-xs ${baseTextColor}`}>
          {messageText.substring(lastIndex)}
        </span>
      );
    }

    return <span>{parts}</span>;
  };

  // Helper function to send chat message
  const handleSendMessage = async (messageText: string) => {
    if (!id || !messageText.trim() || !currentUserId) return;
    
    const userName = (user as any)?.userName || user?.firstName || 'Guest';
    const userPhoto = (user as any)?.profilePhoto || '';
    const mentionsToSend = [...currentMentions];
    
    console.log('Sending message with mentions:', mentionsToSend);
    
    // Clear input immediately for instant feedback
    setMessage('');
    setCurrentMentions([]);
    setUserSuggestions([]);
    
    try {
      await sendRoomMessage(
        id,
        messageText.trim(),
        currentUserId,
        userName,
        userPhoto,
        mentionsToSend
      );
      
      console.log('Message sent successfully');
      
      // Send notifications to mentioned users
      if (mentionsToSend.length > 0) {
        console.log('Sending notifications to:', mentionsToSend.map(m => m.id));
        try {
          const notifResponse = await fetch('/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              title: `${userName} mentioned you`,
              ids: mentionsToSend.map(m => m.id),
              message: "-",
              screen: "RoomScreen",
              id: id,
              sender: currentUserId,
              senderName: userName,
              senderphoto: userPhoto
            })
          });
          console.log('Notification response status:', notifResponse.status);
        } catch (notifError) {
          console.error('Error sending mention notifications:', notifError);
          // Don't show error to user, notification failure shouldn't block message sending
        }
      } else {
        console.log('No mentions to send notifications for');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message if sending failed
      setMessage(messageText);
      setCurrentMentions(mentionsToSend);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  // Giveaway timer
  useEffect(() => {
    if (!activeGiveaway || activeGiveaway.ended) return;
    
    const interval = setInterval(() => {
      // API returns startedtime (lowercase), normalise to both camelCase and lowercase variants
      const rawStart = activeGiveaway.startedTime ?? activeGiveaway.startedtime;
      const startTime = rawStart
        ? (typeof rawStart === 'string' ? new Date(rawStart).getTime() : Number(rawStart))
        : 0;
      const duration = activeGiveaway.duration || 60; // Default 60 seconds
      const endTime = startTime + (duration * 1000);
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setGiveawayTimeLeft(timeLeft);
    }, 100);
    
    return () => clearInterval(interval);
  }, [activeGiveaway]);

  // Helper function to check if user has payment and shipping info
  const hasPaymentAndShipping = () => {
    if (!user) return false;
    const userData = user as any;
    return !!(userData.address && userData.defaultpaymentmethod);
  };

  // Check for payment/shipping when joining show (once per session)
  useEffect(() => {
    const checkPaymentShipping = async () => {
      // Wait for show data to load before checking
      if (!show || !user || hasShownPaymentAlertRef.current) return;
      
      // Check if user is the show owner
      const hostId = show?.owner?._id || show?.owner?.id;
      const isOwner = isAuthenticated && currentUserId === hostId;
      if (isOwner) return;
      
      // Refresh user data to get latest address/payment info from API
      // Use the RETURNED data (not stale React state) to check
      const freshData = await refreshUserData();
      
      // Check using the fresh data returned from the API
      const hasAddress = !!freshData?.address;
      const hasPayment = !!freshData?.defaultpaymentmethod;
      
      if (!hasAddress || !hasPayment) {
        setShowPaymentShippingIntermediateAlert(true);
        hasShownPaymentAlertRef.current = true;
      }
    };
    
    checkPaymentShipping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, show]); // Check when user ID changes or show loads

  // Refresh products when switching tabs
  useEffect(() => {
    if (productTab === 'Auction') {
      refetchAuction();
    } else if (productTab === 'Buy Now') {
      refetchBuyNow();
    } else if (productTab === 'Sold') {
      refetchSold();
    } else if (productTab === 'Giveaways') {
      refetchGiveaways();
    } else if (productTab === 'Offers') {
      refetchOffers();
    }
  }, [productTab, refetchAuction, refetchBuyNow, refetchSold, refetchGiveaways, refetchOffers]);

  // Place bid mutation - supports both regular and custom bids
  const placeBidMutation = useMutation({
    mutationFn: async (options: number | { amount: number; custom?: { autobid: boolean; autobidAmount: number } }) => {
      if (!socket || !activeAuction) throw new Error('Cannot place bid');
      
      // Check if user has payment and shipping info before bidding
      if (!hasPaymentAndShipping()) {
        setShowPaymentShippingIntermediateAlert(true);
        throw new Error('Please add payment and shipping information before bidding');
      }
      
      // Parse options - support both old number format and new object format
      const isCustomBid = typeof options === 'object' && options.custom;
      const amount = typeof options === 'number' ? options : options.amount;
      const customOptions = typeof options === 'object' ? options.custom : undefined;
      
      // Use reliable currentUserBid state instead of scanning activeAuction.bids
      const inheritCustomBidFlag = currentUserBid?.custom_bid || false;
      const existingMaxBid = currentUserBid?.autobidamount;
      const userHasExistingBid = !!currentUserBid;
      
      // Determine if this is just updating autobid max or placing a new bid
      // Only update (no immediate bid) if: user has existing bid + autobid ON + user is WINNING
      const isJustUpdatingAutobid = isCustomBid && customOptions!.autobid && userHasExistingBid && isUserWinning;
      
      if (isJustUpdatingAutobid) {
        // User is winning - just update max bid (use update-bid action)
        const updatePayload = {
          user: currentUserId,
          auction: activeAuction._id || activeAuction.id,
          autobidamount: customOptions!.autobidAmount,
          roomId: id
        };
        
        console.log('🔄 Updating bid max (user winning):', updatePayload);
        socket.emit('update-bid', updatePayload);
        console.log('✅ update-bid event emitted');
      } else {
        // Placing new bid (with or without autobid)
        let bidAmount = amount;
        if (isCustomBid && customOptions!.autobid) {
          // Autobid enabled - place bid at next minimum (either first time or trying to reclaim lead)
          bidAmount = activeAuction.newbaseprice || activeAuction.baseprice || 1;
        }
        
        const bidPayload = {
          user: currentUserId,
          amount: bidAmount,
          increaseBidBy: activeAuction.increaseBidBy || 5,
          auction: activeAuction._id || activeAuction.id,
          prebid: false,
          autobid: isCustomBid ? customOptions!.autobid : false,
          autobidamount: isCustomBid ? customOptions!.autobidAmount : (existingMaxBid || amount),
          custom_bid: isCustomBid ? true : inheritCustomBidFlag,
          roomId: id
        };
        
        console.log('💰 Placing bid:', bidPayload);
        console.log('📡 Socket connected:', socket.connected);
        console.log('  Using currentUserBid:', currentUserBid);
        
        socket.emit('place-bid', bidPayload);
        
        console.log('✅ place-bid event emitted');
      }
    },
    onSuccess: () => {
      setBidAmount('');
    }
  });

  // Prebid mutation
  const prebidMutation = useMutation({
    mutationFn: async ({ listing, amount }: { listing: any; amount: number }) => {
      // Check if user has payment and shipping info before prebidding
      if (!hasPaymentAndShipping()) {
        setShowPaymentShippingIntermediateAlert(true);
        throw new Error('Please add payment and shipping information before prebidding');
      }

      // Emit place-prebid socket event only
      const productId = listing._id || listing.id;
      if (socket) {
        socket.emit('place-prebid', {
          productId,
          user: currentUserId,
          amount: amount,
          room: id
        });
        console.log('📡 place-prebid event emitted:', { productId, user: currentUserId, amount, room: id });
      }
    },
    onSuccess: () => {
      toast({
        title: "Prebid Placed!",
        description: "Your prebid has been registered successfully"
      });
      setShowPrebidDialog(false);
      setPrebidAmount('');
      setPrebidAuction(null);
      refetchAuction();
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Place Prebid",
        description: error.message || "Failed to place prebid",
        variant: "destructive"
      });
    }
  });

  // Accept offer mutation
  const acceptOfferMutation = useMutation({
    mutationFn: async (offer: any) => {
      const offerId = offer._id || offer.id;
      return await apiRequest('POST', `/api/offers/accept`, { offerId });
    },
    onSuccess: () => {
      toast({
        title: "Offer Accepted",
        description: "The offer has been accepted. An order will be created automatically."
      });
      refetchOffers();
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Accept Offer",
        description: error.message || "Failed to accept offer",
        variant: "destructive"
      });
    }
  });

  // Decline offer mutation
  const declineOfferMutation = useMutation({
    mutationFn: async (offer: any) => {
      const offerId = offer._id || offer.id;
      return await apiRequest('POST', `/api/offers/reject`, { offerId });
    },
    onSuccess: () => {
      toast({
        title: "Offer Declined",
        description: "The offer has been declined."
      });
      refetchOffers();
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Decline Offer",
        description: error.message || "Failed to decline offer",
        variant: "destructive"
      });
    }
  });

  // Counter offer state
  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false);
  const [counterOfferData, setCounterOfferData] = useState<any>(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [offerConfirmAction, setOfferConfirmAction] = useState<{ offer: any; action: 'accept' | 'decline' } | null>(null);

  // Counter offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async ({ offer, amount }: { offer: any; amount: number }) => {
      const offerId = offer._id || offer.id;
      return await apiRequest('POST', `/api/offers/counter`, { offerId, counterPrice: amount });
    },
    onSuccess: () => {
      toast({
        title: "Counter Offer Sent",
        description: "Your counter offer has been sent to the buyer."
      });
      setShowCounterOfferDialog(false);
      setCounterOfferData(null);
      setCounterOfferAmount('');
      refetchOffers();
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Send Counter Offer",
        description: error.message || "Failed to send counter offer",
        variant: "destructive"
      });
    }
  });

  // Handlers for offer actions - show confirmation dialog first
  const handleAcceptOffer = useCallback((offer: any) => {
    setOfferConfirmAction({ offer, action: 'accept' });
  }, []);

  const handleDeclineOffer = useCallback((offer: any) => {
    setOfferConfirmAction({ offer, action: 'decline' });
  }, []);

  const handleCounterOffer = useCallback((offer: any) => {
    setCounterOfferData(offer);
    setCounterOfferAmount('');
    setShowCounterOfferDialog(true);
  }, []);

  // Handle confirmed offer action
  const handleConfirmOfferAction = useCallback(() => {
    if (!offerConfirmAction) return;
    if (offerConfirmAction.action === 'accept') {
      acceptOfferMutation.mutate(offerConfirmAction.offer, {
        onSettled: () => setOfferConfirmAction(null)
      });
    } else {
      declineOfferMutation.mutate(offerConfirmAction.offer, {
        onSettled: () => setOfferConfirmAction(null)
      });
    }
  }, [offerConfirmAction, acceptOfferMutation, declineOfferMutation]);

  const isOfferConfirmPending = acceptOfferMutation.isPending || declineOfferMutation.isPending;

  const submitCounterOffer = useCallback(() => {
    if (!counterOfferData || !counterOfferAmount) return;
    const amount = parseFloat(counterOfferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid counter offer amount",
        variant: "destructive"
      });
      return;
    }
    counterOfferMutation.mutate({ offer: counterOfferData, amount });
  }, [counterOfferData, counterOfferAmount, counterOfferMutation, toast]);

  // Join giveaway mutation
  const joinGiveawayMutation = useMutation({
    mutationFn: async () => {
      if (!socket || !activeGiveaway) throw new Error('Cannot join giveaway');
      
      // Check 1: User must have a shipping address
      const addressResponse = await fetch(`/api/address/all/${currentUserId}`);
      if (addressResponse.ok) {
        const addresses = await addressResponse.json();
        if (!addresses || addresses.length === 0) {
          throw new Error('Please add a shipping address before entering giveaways');
        }
      }
      
      // Check 2: User country must match the room owner's country
      const currentUserCountry = (user as any)?.country;
      const ownerCountry = show?.owner?.country;
      if (currentUserCountry && ownerCountry && currentUserCountry !== ownerCountry) {
        throw new Error('You cannot join international giveaways. This giveaway is only available to participants in the same country as the host.');
      }

      // Check 3: User must be following host if giveaway requires it
      if (activeGiveaway.whocanenter === 'followers' && !isFollowingHost) {
        throw new Error('You must follow the host to enter this giveaway');
      }
      
      // Check 4: User cannot enter the same giveaway twice
      const participants = activeGiveaway.participants || [];
      const isAlreadyParticipant = participants.some((p: any) => 
        (typeof p === 'string' ? p : p.id || p._id) === currentUserId
      );
      if (isAlreadyParticipant) {
        throw new Error('You have already entered this giveaway');
      }
      
      // Emit join-giveaway with correct structure (matching Flutter)
      socket.emit('join-giveaway', {
        giveawayId: activeGiveaway._id || activeGiveaway.id,
        showId: id,
        userId: currentUserId
      });
    },
    onSuccess: () => {
      // Silently joined - no toast notification
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Join Giveaway",
        description: error.message || "Failed to join giveaway",
        variant: "destructive"
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Check if this is a giveaway
      const isGiveaway = selectedProduct?.saletype === 'giveaway' || 
                         selectedProduct?.listing_type === 'giveaway' ||
                         giveaways.some((g: any) => g._id === productId);
      
      if (isGiveaway) {
        // Delete giveaway using DELETE /api/giveaways/:id
        return await apiRequest('DELETE', `/api/giveaways/${productId}`, {});
      } else {
        // Delete regular product using PUT /api/products/:id/delete
        return await apiRequest('PUT', `/api/products/${productId}/delete`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/giveaways'] });
      refetchAuction();
      refetchBuyNow();
      refetchGiveaways();
      toast({
        title: "Deleted Successfully",
        description: "Item has been removed successfully"
      });
      setShowDeleteConfirm(false);
      setProductActionSheet(false);
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete item",
        variant: "destructive"
      });
    }
  });

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !hostId) {
        throw new Error('Missing user or host ID');
      }
      return await apiRequest('PUT', `/api/follow/${currentUserId}/${hostId}`, {});
    },
    onSuccess: () => {
      setIsFollowingHost(true);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', id, currentUserId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Follow Failed",
        description: error.message || "Failed to follow user",
        variant: "destructive"
      });
    }
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !hostId) {
        throw new Error('Missing user or host ID');
      }
      return await apiRequest('PUT', `/api/unfollow/${currentUserId}/${hostId}`, {});
    },
    onSuccess: () => {
      setIsFollowingHost(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', id, currentUserId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Unfollow Failed",
        description: error.message || "Failed to unfollow user",
        variant: "destructive"
      });
    }
  });

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to follow users",
        variant: "destructive"
      });
      return;
    }
    
    if (isFollowingHost) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  // Handler for "Follow host to enter giveaway" button (matches Flutter behavior)
  const handleFollowAndJoinGiveaway = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to enter giveaways",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First, follow the host
      if (!currentUserId || !hostId) {
        throw new Error('Missing user or host ID');
      }
      
      await apiRequest('PUT', `/api/follow/${currentUserId}/${hostId}`, {});
      
      // Update following state
      setIsFollowingHost(true);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', id, currentUserId] });
      
      // Then join the giveaway (matching Flutter behavior)
      joinGiveawayMutation.mutate();
      
    } catch (error: any) {
      toast({
        title: "Failed to Enter Giveaway",
        description: error.message || "Could not follow host",
        variant: "destructive"
      });
    }
  };

  const isLive = show?.started === true;
  const viewerCount = viewers.length || show?.viewers?.length || 0;
  const hostName = host?.userName || host?.firstName?.trim() || 'Host';
  const hostAvatar = host?.profilePhoto && host.profilePhoto.trim() ? host.profilePhoto : '';
  const showTitle = show?.title || 'Show';
  const showThumbnail = (show?.thumbnail && show.thumbnail.trim()) ? show.thumbnail.trim() : null;
  const averageReviews = host?.averagereviews ?? 0;
  const hasValidThumbnail = showThumbnail !== null && !imageError;
  const hasExplicitContent = show?.explicitContent === true || show?.explicit_content === true;
  const shippingOptions = show?.shippingOptions || show?.shipping_options;
  const hasFreePickup = shippingOptions?.freePickupEnabled === true || shippingOptions?.free_pickup_enabled === true;
  const hasBuyerCap = shippingOptions?.shippingCostMode === "buyer_pays_up_to" || shippingOptions?.shipping_cost_mode === "buyer_pays_up_to";
  
  // Format scheduled time
  const scheduledAt = show?.date || show?.scheduledAt || show?.scheduled_at;
  const formatScheduledTime = (timestamp: string | number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    
    // If scheduled time is in the past, show "Starting soon"
    if (date < now) {
      return 'Starting soon';
    }
    
    if (isToday(date)) {
      return `Today ${format(date, 'HH:mm')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };
  const scheduledTimeText = scheduledAt ? formatScheduledTime(scheduledAt) : null;
  
  // Calculate actual highest bid from bids array (newbaseprice is already +1, so don't use it)
  const highestBidFromArray = activeAuction?.bids?.reduce((max: number, bid: any) => 
    Math.max(max, bid.amount || 0), 0
  ) || 0;
  const currentBid = highestBidFromArray || activeAuction?.newbaseprice || activeAuction?.baseprice || activeAuction?.product?.startingPrice || activeAuction?.startingPrice || 0;
  
  // Debug logging for current bid calculation
  if (activeAuction) {
    console.log('💰 CURRENT BID CALCULATION:', {
      hasBids: !!activeAuction.bids,
      bidsLength: activeAuction.bids?.length,
      highestBidFromArray,
      newbaseprice: activeAuction?.newbaseprice,
      baseprice: activeAuction?.baseprice,
      productStartingPrice: activeAuction?.product?.startingPrice,
      auctionStartingPrice: activeAuction?.startingPrice,
      finalCurrentBid: currentBid,
      activeAuctionKeys: Object.keys(activeAuction)
    });
  }
  const isUserWinning = activeAuction?.bids?.some((b: any) => 
    (b.bidder?.id === currentUserId || b.bidder?._id === currentUserId) && 
    b.amount === currentBid
  );

  // Extract products from API responses - display exactly what comes from the API
  const auctionProducts = auctionProductsData?.products || [];
  const buyNowProducts = buyNowProductsData?.products || [];
  const giveawayProducts = giveawaysData?.giveaways || [];
  const soldProducts = soldOrdersData?.items || [];
  
  const soldOrders = soldOrdersData?.items || [];
  const giveaways = giveawaysData?.giveaways || [];
  
  // Sync pinned product with latest buy now products data (e.g., after editing a product)
  useEffect(() => {
    if (!pinnedProduct || !buyNowProducts || buyNowProducts.length === 0) return;
    
    // Find the updated product in the buy now list
    const updatedProduct = buyNowProducts.find(
      (p: any) => p._id === pinnedProduct._id || p.id === pinnedProduct._id
    );
    
    console.log('🔍 Sync effect check:', {
      pinnedProductId: pinnedProduct._id,
      pinnedDuration: pinnedProduct.flash_sale_duration,
      foundProduct: !!updatedProduct,
      updatedDuration: updatedProduct?.flash_sale_duration
    });
    
    if (updatedProduct) {
      // Always sync flash sale fields from buyNowProducts to pinnedProduct
      // This ensures any edits are reflected immediately
      const fieldsToSync = [
        'flash_sale', 'flash_sale_duration', 'flash_sale_discount_type',
        'flash_sale_discount_value', 'flash_sale_buy_limit', 'flash_sale_price'
      ];
      
      const hasChanges = fieldsToSync.some(
        field => updatedProduct[field] !== pinnedProduct[field]
      );
      
      if (hasChanges) {
        console.log('🔄 Syncing pinned product with updated data:', {
          oldDuration: pinnedProduct.flash_sale_duration,
          newDuration: updatedProduct.flash_sale_duration,
          oldDiscountValue: pinnedProduct.flash_sale_discount_value,
          newDiscountValue: updatedProduct.flash_sale_discount_value
        });
        setPinnedProduct((prev: any) => ({
          ...prev,
          flash_sale: updatedProduct.flash_sale,
          flash_sale_duration: updatedProduct.flash_sale_duration,
          flash_sale_discount_type: updatedProduct.flash_sale_discount_type,
          flash_sale_discount_value: updatedProduct.flash_sale_discount_value,
          flash_sale_buy_limit: updatedProduct.flash_sale_buy_limit,
          flash_sale_price: updatedProduct.flash_sale_price
        }));
      }
    }
  }, [buyNowProducts]);
  
  // Initialize LiveKit for video streaming
  // Role is determined server-side based on room ownership
  const livekit = useLiveKit({
    roomId: id || '',
    userId: currentUserId || '',
    userName: user?.userName || user?.firstName || currentUserId || '',
    enabled: livekitEnabled && isLive,
    cameraSettings,
  });
  
  // Extract livekit properties for VideoCenter (avoid name conflicts)
  const livekitRoom = livekit.room;
  const livekitIsConnecting = livekit.isConnecting;
  const livekitIsConnected = livekit.isConnected;
  
  // Initialize follow state from host's followers list
  useEffect(() => {
    if (host?.followers && currentUserId) {
      const isCurrentlyFollowing = host.followers.includes(currentUserId);
      setIsFollowingHost(isCurrentlyFollowing);
    }
  }, [host, currentUserId]);

  // Auto-enable LiveKit for viewers when show is live
  useEffect(() => {
    // Don't enable if show has ended
    if (show?.ended) {
      console.log('❌ Show has ended, not enabling LiveKit for viewer');
      setLivekitEnabled(false);
      return;
    }
    
    // Don't enable if show hasn't started
    if (show && !show.started) {
      console.log('❌ Show has not started, not enabling LiveKit for viewer');
      setLivekitEnabled(false);
      return;
    }
    
    if (isLive && !isShowOwner && !livekitEnabled) {
      console.log('🔴 Show is live, enabling LiveKit for viewer...');
      setLivekitEnabled(true);
    }
  }, [isLive, isShowOwner, livekitEnabled, show?.ended, show?.started]);

  // Handler to open product action sheet
  const handleProductAction = (product: any) => {
    console.log('🛒 Opening product action sheet:', {
      product,
      showStatus: show?.status,
      showStarted: show?.started,
      isLive,
      productSaletype: product?.saletype,
      productListingType: product?.listing_type
    });
    setSelectedProduct(product);
    setProductActionSheet(true);
  };

  // Handler to open add product dialog
  const handleAddProduct = (type: 'auction' | 'buy_now' | 'giveaway') => {
    setAddProductType(type);
    setShowAddProductDialog(true);
  };

  // Handler to open auction settings dialog
  const handleOpenAuctionSettings = () => {
    if (!selectedProduct) return;
    
    // Pre-fill settings with product data
    // Ensure duration is at least 2 seconds (minimum for meaningful auction)
    const productDuration = selectedProduct.duration || selectedProduct.default_duration || 0;
    const safeDuration = productDuration > 0 ? productDuration : 10;
    
    setAuctionSettings({
      startingPrice: selectedProduct.startingPrice || selectedProduct.price || 0,
      duration: safeDuration,
      sudden: selectedProduct.sudden || false,
      counterBidTime: 5
    });
    
    setProductActionSheet(false);
    setShowAuctionSettingsDialog(true);
  };

  // Handler to rerun an ended auction
  const handleRerunAuction = () => {
    if (!activeAuction?.product) return;
    
    // Set the product from the ended auction
    setSelectedProduct(activeAuction.product);
    
    // Pre-fill settings with the previous auction data
    setAuctionSettings({
      startingPrice: activeAuction.baseprice || activeAuction.startingPrice || activeAuction.product.startingPrice || 0,
      duration: activeAuction.duration || 10,
      sudden: activeAuction.sudden || false,
      counterBidTime: activeAuction.increaseBidBy || 5
    });
    
    setShowAuctionSettingsDialog(true);
  };

  // Handler to pin/unpin product
  const handlePinProduct = () => {
    if (!socket || !selectedProduct || !id) return;
    
    const isPinned = pinnedProduct?._id === selectedProduct._id;
    
    // Emit pin-product event matching Flutter app structure
    socket.emit('pin-product', {
      pinned: !isPinned, // true to pin, false to unpin
      product: selectedProduct._id,
      tokshow: id
    });
    
    console.log('📌 Pin product emitted:', {
      pinned: !isPinned,
      product: selectedProduct._id,
      tokshow: id
    });
    
    setProductActionSheet(false);
    setShowMobileProducts(false); // Close store dialog on mobile
  };
  
  // Handler to start auction with settings
  const handleStartAuctionWithSettings = () => {
    if (!socket || !selectedProduct) return;
    
    // Extract auction ID from product
    const auctionId = typeof selectedProduct.auction === 'string' 
      ? selectedProduct.auction 
      : selectedProduct.auction?._id;
    
    console.log('🎯 Product auction info:', {
      productId: selectedProduct._id,
      auctionField: selectedProduct.auction,
      extractedAuctionId: auctionId
    });
    
    // Build auction object manually - don't spread all auction fields
    const auctionData = {
      _id: auctionId,
      winner: null,
      higestbid: 0,
      winning: false,
      bids: [],
      tokshow: id,
      sudden: auctionSettings.sudden,
      owner: currentUserId,
      increaseBidBy: auctionSettings.counterBidTime,
      baseprice: auctionSettings.startingPrice,
      product: selectedProduct._id || selectedProduct.id,
      duration: auctionSettings.duration,
      startedTime: null,
      started: false,
      ended: false
    };
    
    console.log('🎯 Starting auction:', {
      roomId: id,
      auction: auctionData,
      increaseBidBy: auctionSettings.counterBidTime
    });
    
    console.log('📡 Socket status before emit:', {
      connected: socket.connected,
      id: socket.id,
      hasListeners: socket.hasListeners('auction-started')
    });
    
    socket.emit('start-auction', {
      roomId: id,
      auction: auctionData,
      increaseBidBy: auctionSettings.counterBidTime
    });
    
    console.log('✅ start-auction event emitted to external API');
    
    setShowAuctionSettingsDialog(false);
    setSelectedProduct(null);
    setShowMobileProducts(false); // Close store dialog on mobile
  };

  // Handler to start giveaway
  const handleStartGiveaway = () => {
    if (!socket || !selectedProduct || !id) return;
    
    console.log('🎁 Starting giveaway:', {
      giveawayId: selectedProduct._id,
      showId: id
    });
    
    // Emit start-giveaway event matching Flutter app structure
    socket.emit('start-giveaway', {
      giveawayId: selectedProduct._id,
      showId: id
    });
    
    setProductActionSheet(false);
    setSelectedProduct(null);
    setShowMobileProducts(false); // Close store dialog on mobile
  };

  // Handler to open flash sale settings
  const handleOpenFlashSaleSettings = () => {
    if (!selectedProduct) return;
    
    // Pre-fill sale price with a discounted price (e.g., 20% off)
    const originalPrice = selectedProduct.price || selectedProduct.buy_now_price || 0;
    const suggestedSalePrice = Math.floor(originalPrice * 0.8);
    
    setFlashSaleSettings({
      salePrice: suggestedSalePrice > 0 ? suggestedSalePrice : 1,
      duration: 60
    });
    setProductActionSheet(false);
    setShowFlashSaleDialog(true);
  };

  // Handler to start flash sale with settings
  const handleStartFlashSale = () => {
    if (!socket || !selectedProduct || !id) return;
    
    const salePrice = flashSaleSettings.salePrice;
    const duration = flashSaleSettings.duration;
    
    console.log('⚡ Starting flash sale:', {
      productId: selectedProduct._id,
      showId: id,
      salePrice,
      duration
    });
    
    // Emit start-flash-sale event
    socket.emit('start-flash-sale', {
      productId: selectedProduct._id,
      showId: id,
      salePrice,
      duration
    });
    
    setShowFlashSaleDialog(false);
    setSelectedProduct(null);
    setShowMobileProducts(false);
    
    toast({
      title: "Flash Sale Starting",
      description: `Flash sale will run for ${duration} seconds`,
      duration: 3000,
    });
  };

  // Handler to end flash sale
  const handleEndFlashSale = () => {
    if (!socket || !id || !activeFlashSale) return;
    
    console.log('⚡ Ending flash sale:', {
      productId: activeFlashSale.productId,
      showId: id
    });
    
    socket.emit('end-flash-sale', {
      productId: activeFlashSale.productId,
      showId: id
    });
  };

  // Handler to manually end giveaway (draw winner)
  const handleEndGiveaway = () => {
    if (!socket || !activeGiveaway || !id) return;
    
    console.log('🎁 Ending giveaway:', {
      giveawayId: activeGiveaway._id,
      showId: id
    });
    
    // Emit draw-giveaway event matching Flutter app structure
    socket.emit('draw-giveaway', {
      giveawayId: activeGiveaway._id,
      showId: id
    });
  };

  // Handler functions for VideoCenter
  const handleFollowHost = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to follow users",
        variant: "destructive"
      });
      return;
    }
    followMutation?.mutate();
  };

  const handleUnfollowHost = () => {
    unfollowMutation?.mutate();
  };

  // Reusable bidding method for both quick bids and custom bids
  const handlePlaceBid = (bidParams: number | { amount: number; isMaxBid?: boolean }) => {
    // Prevent user from bidding against themselves (silently)
    if (isUserWinning) {
      return;
    }

    // Handle both simple number bids and custom bid objects
    if (typeof bidParams === 'number') {
      // Quick bid - just pass the amount
      placeBidMutation?.mutate(bidParams);
    } else {
      const { amount, isMaxBid = false } = bidParams;
      
      if (isMaxBid) {
        // Auto-bid enabled - set max autobid amount
        placeBidMutation?.mutate({
          amount: amount,
          custom: {
            autobid: true,
            autobidAmount: amount
          }
        });
      } else {
        // Auto-bid NOT enabled - place immediate bid at this amount
        placeBidMutation?.mutate(amount);
      }
    }
  };

  const handleJoinGiveaway = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to enter giveaways",
        variant: "destructive"
      });
      return;
    }
    joinGiveawayMutation?.mutate();
  };

  if (isLoading && !show) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading show...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Show Not Found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white flex flex-col overflow-hidden">
      {/* Show Ended Alert */}
      {show?.ended && (
        <Alert className="rounded-none border-x-0 border-t-0 border-b border-zinc-800 bg-red-900/20 border-red-800/30 flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-sm text-red-200">
            This show has already ended
          </AlertDescription>
        </Alert>
      )}


      {/* Main Content - Testing ProductsSidebar ONLY (fixed) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <ProductsSidebar 
          showMobileProducts={showMobileProducts}
          setShowMobileProducts={setShowMobileProducts}
          showTitle={showTitle}
          productTab={productTab}
          setProductTab={setProductTab}
          auctionProducts={auctionProducts}
          pinnedProduct={pinnedProduct}
          activeAuction={activeAuction}
          currentUserId={currentUserId}
          isShowOwner={isShowOwner}
          handleProductAction={handleProductAction}
          setBuyNowProduct={setBuyNowProduct}
          setShowBuyNowDialog={setShowBuyNowDialog}
          setPrebidAuction={setPrebidAuction}
          setShowPrebidDialog={setShowPrebidDialog}
          handleAddProduct={handleAddProduct}
          buyNowProducts={buyNowProducts}
          giveawayProducts={giveawayProducts}
          soldProducts={soldProducts}
          activeGiveaway={activeGiveaway}
          setSelectedProduct={setSelectedProduct}
          giveaways={giveaways}
          giveawayTimeLeft={giveawayTimeLeft}
          soldOrders={soldOrders}
          setSelectedOrder={setSelectedOrder}
          setShowOrderDetailDialog={setShowOrderDetailDialog}
          shippingEstimate={shippingEstimate}
          id={id}
          offers={offers}
          offersCount={offersCount}
          onAcceptOffer={handleAcceptOffer}
          onDeclineOffer={handleDeclineOffer}
          onCounterOffer={handleCounterOffer}
          activeFlashSale={activeFlashSale}
          flashSaleTimeLeft={flashSaleTimeLeft}
          handleEndFlashSale={handleEndFlashSale}
          onMakeOffer={(product: any) => {
            setMakeOfferProduct(product);
            setShowMakeOfferDialog(true);
          }}
          isOfferActionPending={isOfferConfirmPending}
          pendingOfferId={isOfferConfirmPending ? (offerConfirmAction?.offer?._id || offerConfirmAction?.offer?.id) : null}
        />

        <VideoCenter
          id={id}
          livekitRoom={livekitRoom}
          muted={muted}
          setMuted={setMuted}
          isShowOwner={isShowOwner}
          hasVideo={livekit.hasVideo}
          hasAudio={livekit.hasAudio}
          toggleCamera={livekit.toggleCamera}
          toggleMicrophone={livekit.toggleMicrophone}
          canPublish={livekit.canPublish}
          isConnecting={livekitIsConnecting}
          isConnected={livekitIsConnected}
          hostAvatar={hostAvatar}
          hostName={hostName}
          hostId={hostId}
          averageReviews={averageReviews}
          isFollowingHost={isFollowingHost}
          handleFollowHost={handleFollowHost}
          isFollowLoading={followMutation?.isPending}
          showTitle={showTitle}
          activeAuction={activeAuction}
          auctionTimeLeft={auctionTimeLeft}
          currentBid={currentBid}
          bidAmount={bidAmount}
          setBidAmount={setBidAmount}
          handlePlaceBid={handlePlaceBid}
          isPlacingBid={placeBidMutation?.isPending}
          isUserWinning={isUserWinning}
          pinnedProduct={pinnedProduct}
          activeGiveaway={activeGiveaway}
          giveawayTimeLeft={giveawayTimeLeft}
          handleJoinGiveaway={handleJoinGiveaway}
          handleFollowAndJoinGiveaway={handleFollowAndJoinGiveaway}
          isJoiningGiveaway={joinGiveawayMutation?.isPending}
          currentUserId={currentUserId}
          handleEndGiveaway={handleEndGiveaway}
          setShowMobileProducts={setShowMobileProducts}
          setShowMobileChat={setShowMobileChat}
          handleUnfollowHost={handleUnfollowHost}
          isLive={isLive}
          viewerCount={viewers.length}
          showTipDialog={showTipDialog}
          setShowTipDialog={setShowTipDialog}
          showThumbnail={showThumbnail}
          showMobileProducts={showMobileProducts}
          showMobileChat={showMobileChat}
          chatMessagesRef={chatMessagesRef}
          chatMessages={chatMessages}
          imageError={imageError}
          setImageError={setImageError}
          toast={toast}
          user={user}
          show={show}
          viewers={viewers}
          isAuthenticated={isAuthenticated}
          navigate={navigate}
          userSuggestions={userSuggestions}
          setUserSuggestions={setUserSuggestions}
          isEndingShow={isEndingShow}
          setIsEndingShow={setIsEndingShow}
          socket={socket}
          socketIsConnected={isConnected}
          setLivekitEnabled={setLivekitEnabled}
          leaveRoom={leaveRoom}
          queryClient={queryClient}
          refetchShow={refetchShow}
          winnerData={winnerData}
          giveawayWinnerData={giveawayWinnerData}
          orderNotificationData={orderNotificationData}
          showOrderNotification={showOrderNotification}
          winningUser={winningUser}
          shippingEstimate={shippingEstimate}
          handleRerunAuction={handleRerunAuction}
          placeBidMutation={placeBidMutation}
          setBuyNowProduct={setBuyNowProduct}
          renderMessageWithMentions={renderMessageWithMentions}
          selectMention={selectMention}
          handleMessageChange={handleMessageChange}
          handleSendMessage={handleSendMessage}
          message={message}
          currentMentions={currentMentions}
          setCurrentMentions={setCurrentMentions}
          timeAddedBlink={timeAddedBlink}
          buyNowProduct={buyNowProduct}
          host={host}
          setShowShareDialog={setShowShareDialog}
          livekit={livekit}
          showBuyNowDialog={showBuyNowDialog}
          setShowBuyNowDialog={setShowBuyNowDialog}
          setShowPaymentShippingAlert={setShowWalletDialog}
          showCustomBidDialog={showCustomBidDialog}
          setShowCustomBidDialog={setShowCustomBidDialog}
          flashSaleTimeLeft={flashSaleTimeLeft}
          activeFlashSale={activeFlashSale}
          onCameraSettingsConfirm={setCameraSettings}
        />
        
        <ChatSidebar
          showMobileChat={showMobileChat}
          setShowMobileChat={setShowMobileChat}
          isShowOwner={isShowOwner}
          show={show}
          viewerCount={viewers.length}
          activeGiveaway={activeGiveaway}
          isAuthenticated={isAuthenticated}
          isFollowingHost={isFollowingHost}
          joinGiveawayMutation={joinGiveawayMutation}
          handleFollowAndJoinGiveaway={handleFollowAndJoinGiveaway}
          setShowShareDialog={setShowShareDialog}
          handleEndGiveaway={handleEndGiveaway}
          chatMessages={chatMessages}
          chatScrollRef={chatScrollRef}
          renderMessageWithMentions={renderMessageWithMentions}
          showMentionDialog={showMentionDialog}
          userSuggestions={userSuggestions}
          isSearchingUsers={isSearchingUsers}
          selectMention={selectMention}
          messageInputRef={messageInputRef}
          message={message}
          handleMessageChange={handleMessageChange}
          handleSendMessage={handleSendMessage}
          currentUserId={currentUserId}
          giveaways={giveaways}
          giveawayTimeLeft={giveawayTimeLeft}
        />
        
        <DialogsContainer
          productActionSheet={productActionSheet}
          setProductActionSheet={setProductActionSheet}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          setEditingProduct={setEditingProduct}
          setShowEditProductDialog={setShowEditProductDialog}
          handlePinProduct={handlePinProduct}
          pinnedProduct={pinnedProduct}
          isLive={isLive}
          show={show}
          isShowOwner={isShowOwner}
          handleOpenAuctionSettings={handleOpenAuctionSettings}
          handleStartGiveaway={handleStartGiveaway}
          handleOpenFlashSaleSettings={handleOpenFlashSaleSettings}
          setShowDeleteConfirm={setShowDeleteConfirm}
          giveaways={giveaways}
          activeFlashSale={activeFlashSale}
          showAuctionSettingsDialog={showAuctionSettingsDialog}
          setShowAuctionSettingsDialog={setShowAuctionSettingsDialog}
          auctionSettings={auctionSettings}
          setAuctionSettings={setAuctionSettings}
          handleStartAuctionWithSettings={handleStartAuctionWithSettings}
          showDeleteConfirm={showDeleteConfirm}
          deleteProductMutation={deleteProductMutation}
          showAddProductDialog={showAddProductDialog}
          setShowAddProductDialog={setShowAddProductDialog}
          addProductType={addProductType}
          id={id || ''}
          refetchAuction={refetchAuction}
          refetchBuyNow={refetchBuyNow}
          refetchGiveaways={refetchGiveaways}
          refetchShow={refetchShow}
          showEditProductDialog={showEditProductDialog}
          editingProduct={editingProduct}
          showShareDialog={showShareDialog}
          setShowShareDialog={setShowShareDialog}
          showTitle={showTitle}
          showPrebidDialog={showPrebidDialog}
          setShowPrebidDialog={setShowPrebidDialog}
          prebidAuction={prebidAuction}
          setPrebidAuction={setPrebidAuction}
          prebidAmount={prebidAmount}
          setPrebidAmount={setPrebidAmount}
          prebidMutation={prebidMutation}
          toast={toast}
          currentUserId={currentUserId}
          showOrderDetailDialog={showOrderDetailDialog}
          setShowOrderDetailDialog={setShowOrderDetailDialog}
          selectedOrder={selectedOrder}
          orderItemsPage={orderItemsPage}
          setOrderItemsPage={setOrderItemsPage}
        />

        {/* Buy Now Dialog */}
        {showBuyNowDialog && buyNowProduct && (
          <BuyNowDialog
            open={showBuyNowDialog}
            onOpenChange={(open) => {
              setShowBuyNowDialog(open);
              if (!open) {
                // Reset offer price when dialog closes
                setPendingOfferPrice(null);
              }
            }}
            product={buyNowProduct}
            shippingEstimate={shippingEstimate}
            offerPrice={pendingOfferPrice}
            isFlashSale={activeFlashSale?.productId === (buyNowProduct?._id || buyNowProduct?.id)}
            flashSalePrice={activeFlashSale?.productId === (buyNowProduct?._id || buyNowProduct?.id) 
              ? (() => {
                  const discountType = buyNowProduct?.flash_sale_discount_type || 'percentage';
                  const discountValue = buyNowProduct?.flash_sale_discount_value || 0;
                  const price = buyNowProduct?.price || 0;
                  if (discountType === 'percentage') {
                    return price * (1 - discountValue / 100);
                  } else {
                    return Math.max(0, price - discountValue);
                  }
                })()
              : undefined
            }
            onOpenPaymentMethods={() => {
              setShowBuyNowDialog(false);
              setShowPaymentShippingIntermediateAlert(true);
            }}
            onOpenShippingAddresses={() => {
              setShowBuyNowDialog(false);
              setShowPaymentShippingIntermediateAlert(true);
            }}
          />
        )}

        {/* Make Offer Dialog */}
        {showMakeOfferDialog && makeOfferProduct && (
          <MakeOfferDialog
            open={showMakeOfferDialog}
            onOpenChange={setShowMakeOfferDialog}
            product={makeOfferProduct}
            shippingEstimate={shippingEstimate}
            onContinueWithOffer={(offerPrice: number) => {
              // Just set the offer price and open BuyNowDialog
              // The actual offer submission happens in BuyNowDialog
              setPendingOfferPrice(offerPrice);
              setBuyNowProduct(makeOfferProduct);
              setShowBuyNowDialog(true);
            }}
          />
        )}

        {/* Tip Seller Dialog */}
        {showTipDialog && host && (
          <TipSellerDialog
            open={showTipDialog}
            onOpenChange={setShowTipDialog}
            seller={host}
            onOpenPaymentMethods={() => {
              setShowTipDialog(false);
              setShowPaymentShippingIntermediateAlert(true);
            }}
          />
        )}

        {/* Wallet Dialog */}
        {showWalletDialog && (
          <WalletDialog
            open={showWalletDialog}
            onOpenChange={setShowWalletDialog}
            onOpenPaymentMethods={() => {
              setShowWalletDialog(false);
              setShowPaymentMethodsDialog(true);
            }}
            onOpenShippingAddresses={() => {
              setShowWalletDialog(false);
              setShowAddressesDialog(true);
            }}
          />
        )}

        {/* Payment Methods Dialog - Always rendered to prefetch data */}
        <Suspense fallback={<div />}>
          <PaymentMethodListDialog
            open={showPaymentMethodsDialog}
            onOpenChange={setShowPaymentMethodsDialog}
          />
        </Suspense>

        {/* Addresses Dialog */}
        {showAddressesDialog && (
          <Suspense fallback={<div />}>
            <AddressListDialog
              open={showAddressesDialog}
              onOpenChange={setShowAddressesDialog}
            />
          </Suspense>
        )}

        {/* Flash Sale Settings Dialog */}
        <Dialog open={showFlashSaleDialog} onOpenChange={setShowFlashSaleDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Start Flash Sale
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-zinc-400 mb-2">Product: {selectedProduct?.name}</p>
                <p className="text-sm text-zinc-400 mb-4">
                  Original Price: ${(selectedProduct?.price || selectedProduct?.buy_now_price || 0).toFixed(2)}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Flash Sale Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={flashSaleSettings.salePrice}
                  onChange={(e) => setFlashSaleSettings(prev => ({
                    ...prev,
                    salePrice: parseFloat(e.target.value) || 0
                  }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Duration (seconds)</label>
                <div className="flex gap-2">
                  {[30, 60, 120, 300].map((seconds) => (
                    <Button
                      key={seconds}
                      variant={flashSaleSettings.duration === seconds ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFlashSaleSettings(prev => ({ ...prev, duration: seconds }))}
                      className={flashSaleSettings.duration === seconds 
                        ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                        : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      }
                    >
                      {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="bg-zinc-800 p-3 rounded-lg">
                <p className="text-sm text-zinc-400">
                  <span className="text-yellow-500 font-medium">
                    {Math.round((1 - flashSaleSettings.salePrice / (selectedProduct?.price || selectedProduct?.buy_now_price || 1)) * 100)}% OFF
                  </span>
                  {' '}- Sale runs for {flashSaleSettings.duration >= 60 
                    ? `${flashSaleSettings.duration / 60} minute${flashSaleSettings.duration > 60 ? 's' : ''}` 
                    : `${flashSaleSettings.duration} seconds`
                  }
                </p>
              </div>
              
              <div className="flex gap-3 mt-4">
                <Button
                  variant="ghost"
                  className="flex-1 text-white hover:bg-zinc-800"
                  onClick={() => {
                    setShowFlashSaleDialog(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600"
                  onClick={handleStartFlashSale}
                  disabled={flashSaleSettings.salePrice <= 0}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start Sale
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Intermediate Payment & Shipping Alert - Shows first when user is missing info */}
        {showPaymentShippingIntermediateAlert && (
          <Suspense fallback={<div />}>
            <PaymentShippingAlertDialog
              open={showPaymentShippingIntermediateAlert}
              onOpenChange={setShowPaymentShippingIntermediateAlert}
              onAddInfo={() => setShowWalletDialog(true)}
            />
          </Suspense>
        )}

        {/* Counter Offer Dialog */}
        <Dialog open={showCounterOfferDialog} onOpenChange={setShowCounterOfferDialog}>
          <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Counter Offer</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Send a counter offer to the buyer
              </DialogDescription>
            </DialogHeader>
            {counterOfferData && (
              <div className="space-y-4">
                <div className="bg-zinc-800 p-3 rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">Original Offer</p>
                  <p className="font-semibold text-white">${(counterOfferData.offeredPrice || counterOfferData.offerAmount || 0).toFixed(2)}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    from @{counterOfferData.buyer?.userName || counterOfferData.buyer?.firstName || 'User'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">Your Counter Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={counterOfferAmount}
                      onChange={(e) => setCounterOfferAmount(e.target.value)}
                      className="pl-7 bg-zinc-800 border-zinc-600 text-white"
                      placeholder="Enter counter amount"
                      data-testid="input-counter-offer-amount"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white"
                    onClick={() => {
                      setShowCounterOfferDialog(false);
                      setCounterOfferData(null);
                      setCounterOfferAmount('');
                    }}
                    disabled={counterOfferMutation.isPending}
                    data-testid="button-cancel-counter-offer"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={submitCounterOffer}
                    disabled={counterOfferMutation.isPending || !counterOfferAmount}
                    data-testid="button-submit-counter-offer"
                  >
                    {counterOfferMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : 'Send Counter'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Offer Accept/Decline Confirmation Dialog */}
        <AlertDialog open={!!offerConfirmAction} onOpenChange={(open) => !isOfferConfirmPending && !open && setOfferConfirmAction(null)}>
          <AlertDialogContent className="bg-zinc-900 text-white border-zinc-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                {offerConfirmAction?.action === 'accept' ? 'Accept Offer?' : 'Decline Offer?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                {offerConfirmAction?.action === 'accept' 
                  ? `Accept this offer of $${(offerConfirmAction?.offer?.offeredPrice || offerConfirmAction?.offer?.offerAmount || 0).toFixed(2)}? An order will be created automatically.`
                  : "Are you sure you want to decline this offer?"
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={isOfferConfirmPending}
                className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600 hover:text-white"
                data-testid="button-cancel-offer-action"
              >
                Cancel
              </AlertDialogCancel>
              <Button 
                onClick={handleConfirmOfferAction}
                disabled={isOfferConfirmPending}
                className={offerConfirmAction?.action === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                data-testid="button-confirm-offer-action"
              >
                {isOfferConfirmPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {offerConfirmAction?.action === 'accept' ? 'Creating Order...' : 'Declining...'}
                  </>
                ) : (
                  offerConfirmAction?.action === 'accept' ? 'Accept' : 'Decline'
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Host Conflict Dialog */}
        <Dialog open={showHostConflictDialog} onOpenChange={setShowHostConflictDialog}>
          <DialogContent 
            className="bg-white text-black max-w-[95vw] sm:max-w-md mx-4 [&>button]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-black text-base sm:text-lg">Active Show Detected</DialogTitle>
              <DialogDescription className="text-gray-600 text-sm">
                You have an active live show running. Joining this show will end your current show.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {conflictingShow && (
                <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Your Current Show:</p>
                  <p className="font-semibold text-black text-sm sm:text-base">{conflictingShow.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Started {format(new Date(conflictingShow.activeTime || conflictingShow.date), "h:mm a")}
                  </p>
                </div>
              )}
              <p className="text-xs sm:text-sm text-gray-700">
                Do you want to leave your current show and join this one?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto order-2 sm:order-1"
                  onClick={() => {
                    setShowHostConflictDialog(false);
                    
                    // Navigate back to the active show
                    if (conflictingShow) {
                      navigate(`/show/${conflictingShow._id}`);
                    }
                    
                    setConflictingShow(null);
                  }}
                  data-testid="button-cancel-join"
                >
                  Stay in Current Show
                </Button>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto order-1 sm:order-2"
                  onClick={async () => {
                    if (socket && conflictingShow && currentUserId) {
                      console.log('🚪 Leaving previous show:', conflictingShow._id);
                      
                      try {
                        // 1. First, end the previous show by setting ended: true
                        try {
                          await apiRequest('PUT', `/api/rooms/${conflictingShow._id}`, { ended: true });
                          console.log('✅ Previous show ended');
                        } catch (error) {
                          console.error('Failed to end previous show', error);
                        }
                        
                        // 2. Then delete the previous show
                        try {
                          await apiRequest('DELETE', `/api/rooms/${conflictingShow._id}`, {});
                          console.log('✅ Previous show deleted');
                        } catch (error) {
                          console.error('Failed to delete previous show', error);
                        }
                        
                        // 3. Emit leave-room socket event for the previous show
                        socket.emit('leave-room', {
                          roomId: conflictingShow._id,
                          userId: currentUserId
                        });
                        
                        // 4. Close dialog and proceed with joining new show
                        setShowHostConflictDialog(false);
                        setConflictingShow(null);
                        setProceedWithJoin(true);
                        
                        toast({
                          title: "Left Previous Show",
                          description: "Your previous show has been ended.",
                        });
                      } catch (error) {
                        console.error('Error leaving previous show:', error);
                        toast({
                          title: "Error",
                          description: "Failed to leave previous show. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  data-testid="button-confirm-join"
                >
                  Leave and Join New Show
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </div>
  );
}
