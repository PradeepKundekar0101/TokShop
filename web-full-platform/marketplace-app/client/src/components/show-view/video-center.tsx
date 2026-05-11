import { Suspense, lazy, useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Send, Volume2, VolumeX, Share2, Menu, X, Clock, Users, DollarSign, Gift, Truck, AlertTriangle, ShoppingBag, MessageCircle, Star, Wallet, MoreVertical, Edit, Trash, Play, Plus, Loader2, Bookmark, Link as LinkIcon, MoreHorizontal, Radio, User, Mail, AtSign, Ban, Flag, ChevronRight, Video, VideoOff, Mic, MicOff, FileText, Sparkles, Skull, Package, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendRoomMessage } from '@/lib/firebase-chat';
import { format, isToday, isTomorrow } from 'date-fns';
import { CustomBidDialog } from '@/components/custom-bid-dialog';
import { RaidShowDialog } from '@/components/raid-show-dialog';
import { UserBadge } from '@/components/user-badge';
import { CameraSettingsModal, CameraSettings } from '@/components/camera-settings-modal';

const LiveKitVideoPlayer = lazy(() => import('@/components/livekit-video-player'));

export function VideoCenter(props: any) {
  // Local UI state for dialogs and sheets
  const [showMoreOptionsSheet, setShowMoreOptionsSheet] = useState(false);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showGiveawayWinnerDialog, setShowGiveawayWinnerDialog] = useState(false);
  const [isNotificationSaved, setIsNotificationSaved] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<'explicit' | 'shipping' | null>(null);
  const [showRaidDialog, setShowRaidDialog] = useState(false);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  
  // Track if banners have been shown (only show once per session)
  const bannersShownRef = useRef(false);
  
  const {
    id, livekitRoom, muted, setMuted, isShowOwner, hasVideo, hasAudio, canPublish,
    toggleCamera, toggleMicrophone, isConnecting, isConnected,
    hostAvatar, hostName, hostId, averageReviews, isFollowingHost,
    handleFollowHost, isFollowLoading, showTitle, activeAuction,
    auctionTimeLeft, currentBid, bidAmount, setBidAmount, handlePlaceBid,
    isPlacingBid, isUserWinning, pinnedProduct, activeGiveaway,
    giveawayTimeLeft, handleJoinGiveaway, handleFollowAndJoinGiveaway, isJoiningGiveaway, currentUserId,
    handleEndGiveaway, setShowMobileProducts, setShowMobileChat,
    handleUnfollowHost, isLive, viewerCount, showTipDialog, setShowTipDialog, showThumbnail,
    showMobileProducts, showMobileChat, chatMessagesRef, chatMessages,
    imageError, setImageError, toast, user, show, viewers, isAuthenticated, navigate,
    userSuggestions, setUserSuggestions,
    isEndingShow, setIsEndingShow, socket, socketIsConnected, setLivekitEnabled, leaveRoom, queryClient,
    refetchShow, winnerData, giveawayWinnerData, orderNotificationData, showOrderNotification,
    winningUser, shippingEstimate, handleRerunAuction,
    placeBidMutation, setBuyNowProduct, renderMessageWithMentions, selectMention,
    handleMessageChange, timeAddedBlink, buyNowProduct,
    host, setShowShareDialog, livekit,
    showBuyNowDialog, setShowBuyNowDialog, message, handleSendMessage,
    currentMentions, setCurrentMentions, setShowPaymentShippingAlert,
    showCustomBidDialog, setShowCustomBidDialog,
    flashSaleTimeLeft,
    activeFlashSale,
    onCameraSettingsConfirm
  } = props;
  
  const isActiveFlashSale = activeFlashSale && (activeFlashSale.productId === pinnedProduct?._id || activeFlashSale.productId === pinnedProduct?.id);

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const storedUser = getStoredUser();
  const hasReferralCredit = storedUser?.referredBy && storedUser?.awarded_referal_credit === false;

  const { data: referralSettings } = useQuery({
    queryKey: ['referral-settings-show-view'],
    queryFn: async () => {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (!res.ok) return null;
      const result = await res.json();
      return result.data || result;
    },
    enabled: Boolean(hasReferralCredit),
    staleTime: 60000,
  });

  const referralInfo = (() => {
    if (!hasReferralCredit || !pinnedProduct) return null;
    const referralCredit = referralSettings?.referral_credit ?? 15;
    const referralMinimum = referralSettings?.referral_credit_limit ?? 25;
    const price = pinnedProduct.price || 0;
    const referrerIdNorm = String(storedUser.referredBy || '').trim();
    const productSellerId = (() => {
      if (typeof pinnedProduct.owner === 'string') return pinnedProduct.owner;
      if (pinnedProduct.owner) return pinnedProduct.owner._id || pinnedProduct.owner.id || '';
      if (pinnedProduct.ownerId) return typeof pinnedProduct.ownerId === 'string' ? pinnedProduct.ownerId : (pinnedProduct.ownerId._id || pinnedProduct.ownerId.id || '');
      return hostId || '';
    })();
    const sellerIdNorm = String(productSellerId || '').trim();
    if (!referrerIdNorm || !sellerIdNorm || referrerIdNorm !== sellerIdNorm) return null;
    if (price < referralMinimum) return null;
    const discount = Math.min(referralCredit, price);
    return { referredBy: referrerIdNorm, credit: discount, minimum: referralMinimum };
  })();

  // Check if user has payment and shipping info
  const hasPaymentAndShipping = () => {
    if (!user) return false;
    const userData = user as any;
    return !!(userData.address && userData.defaultpaymentmethod);
  };
  
  // Handler for custom bid button - checks payment/shipping before opening dialog
  const handleCustomBidClick = () => {
    if (!hasPaymentAndShipping()) {
      setShowPaymentShippingAlert(true);
      return;
    }
    setShowCustomBidDialog(true);
  };
  
  // Check if current user has already saved this show for notifications
  useEffect(() => {
    if (show && currentUserId) {
      const invitedIds = show.invitedhostIds || show.invited_host_ids || [];
      const isSaved = invitedIds.includes(currentUserId);
      setIsNotificationSaved(isSaved);
    }
  }, [show, currentUserId]);
  
  // Show winner dialog when winnerData changes
  useEffect(() => {
    if (winnerData) {
      setShowWinnerDialog(true);
      const timer = setTimeout(() => {
        setShowWinnerDialog(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [winnerData]);
  
  // Show giveaway winner dialog when giveawayWinnerData changes
  useEffect(() => {
    if (giveawayWinnerData) {
      setShowGiveawayWinnerDialog(true);
      const timer = setTimeout(() => {
        setShowGiveawayWinnerDialog(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [giveawayWinnerData]);
  
  // Show warning banners sequentially when user views the show (only once)
  useEffect(() => {
    if (!show) return;
    
    // Only show banners once per session
    if (bannersShownRef.current) {
      console.log('⏭️ Banners already shown, skipping');
      return;
    }

    // Use correct field names with underscores
    const shipping = show?.shipping_settings;
    
    console.log('🎯 Shipping settings object:', shipping);
    console.log('🎯 Explicit content:', show?.explicit_content);
    
    // Check shipping conditions from shipping_settings
    const hasFreePickup = shipping?.freePickupEnabled === true;
    const hasBuyerCap = shipping?.shippingCostMode === "buyer_pays_up_to";
    const hasFreeShipping = shipping?.shippingCostMode === "seller_pays_all";
    const hasExplicit = show?.explicit_content === true;
    
    // Determine if we should show a shipping banner
    const hasShippingBanner = hasFreePickup || hasBuyerCap || hasFreeShipping;

    console.log('🎯 Banner check:', { 
      isLive, 
      isConnected, 
      hasFreePickup, 
      hasBuyerCap, 
      hasFreeShipping, 
      hasExplicit, 
      hasShippingBanner
    });

    // No banners to show
    if (!hasExplicit && !hasShippingBanner) {
      console.log('❌ No banners to show');
      setCurrentBanner(null);
      bannersShownRef.current = true; // Mark as shown even if no banners
      return;
    }

    // Mark that we're showing banners
    bannersShownRef.current = true;

    // Only explicit banner
    if (hasExplicit && !hasShippingBanner) {
      console.log('✅ Setting banner to: explicit');
      setCurrentBanner('explicit');
      const timer = setTimeout(() => {
        console.log('✅ Clearing banner (after explicit)');
        setCurrentBanner(null);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Only shipping banner
    if (hasShippingBanner && !hasExplicit) {
      console.log('✅ Setting banner to: shipping');
      setCurrentBanner('shipping');
      const timer = setTimeout(() => {
        console.log('✅ Clearing banner (after shipping)');
        setCurrentBanner(null);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Both banners - show sequentially
    if (hasExplicit && hasShippingBanner) {
      console.log('✅ Setting banner to: explicit (both)');
      // Show explicit first
      setCurrentBanner('explicit');
      
      const timer1 = setTimeout(() => {
        console.log('✅ Setting banner to: shipping (after explicit)');
        // After 5 seconds, show shipping
        setCurrentBanner('shipping');
        
        const timer2 = setTimeout(() => {
          console.log('✅ Clearing banner (after both)');
          // After another 5 seconds, hide all
          setCurrentBanner(null);
        }, 5000);
        
        return () => clearTimeout(timer2);
      }, 5000);
      
      return () => clearTimeout(timer1);
    }
  }, [show]);
  
  // Ensure the function exists before calling
  const handleWalletClick = () => {
    if (setShowPaymentShippingAlert) {
      setShowPaymentShippingAlert(true);
    }
  };

  // Use livekit from props if provided, otherwise reconstruct
  const livekitObj = livekit || {
    room: livekitRoom,
    isConnecting: isConnecting,
    isConnected: isConnected,
    hasVideo: hasVideo,
    hasAudio: hasAudio,
    error: null,
    disconnect: async () => {},
    connect: () => {},
    toggleCamera: toggleCamera,
    toggleMicrophone: toggleMicrophone,
  };

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

  // Log current banner state on every render
  console.log('🎬 VideoCenter render - currentBanner:', currentBanner);

  return (
    <>
      {/* Center - Video Player */}
      <div className="flex-1 flex flex-col bg-black min-w-0 h-auto" style={{ height: window.innerWidth < 1024 ? 'var(--mobile-vh, 100vh)' : 'auto' }}>
          {/* Video Player Container - Full height */}
          <div className="relative bg-black flex items-center justify-center overflow-hidden h-full">
            {/* Blurred Background Thumbnail */}
            {showThumbnail && !imageError && (
              <div className="absolute inset-0 z-0">
                <img
                  src={showThumbnail}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110"
                  aria-hidden="true"
                />
              </div>
            )}
            
            {/* Host Info Bar */}
            <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-safe-top pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
              <div className="flex items-center gap-3 pointer-events-auto">
                <a 
                  href={`/profile/${hostId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity flex-shrink-0"
                  data-testid="link-host-profile"
                >
                  <Avatar className="h-12 w-12" data-testid="avatar-host">
                    <AvatarImage src={hostAvatar} />
                    <AvatarFallback className="text-sm">{hostName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </a>
                <div className="flex flex-col gap-0.5">
                  <a 
                    href={`/profile/${hostId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white leading-tight hover:underline flex items-center gap-1"
                    data-testid="link-host-username"
                  >
                    {hostName}
                    {(host?.badge || host?.badgeTier) && (
                      <UserBadge badge={host.badge} badgeTier={host.badgeTier} size="sm" />
                    )}
                  </a>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-white">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      <span className="text-sm font-semibold">{averageReviews.toFixed(1)}</span>
                    </div>
                    {!isShowOwner && (
                      <>
                        <Badge 
                          className={`${
                            isFollowingHost 
                              ? 'bg-zinc-700 hover:bg-zinc-600 text-white' 
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          } font-bold px-3 py-0.5 text-xs h-6 w-fit rounded-full cursor-pointer transition-colors`}
                          onClick={isFollowingHost ? handleUnfollowHost : handleFollowHost}
                          data-testid="badge-follow-status"
                        >
                          {isFollowLoading ? (
                            '...'
                          ) : (
                            isFollowingHost ? 'Following' : 'Follow'
                          )}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                  <div className="relative flex items-center justify-center">
                    <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                      <Radio className="h-4 w-4" />
                    </div>
                    {isLive && (
                      <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="text-base font-bold">{viewerCount}</span>
                </div>
              </div>
            </div>

            {/* Floating Giveaway Widget - Mobile Only (below viewer count, right side) */}
            {activeGiveaway && !activeGiveaway.ended && (
              <div className="lg:hidden absolute top-20 right-4 z-40 pointer-events-none w-auto max-w-[200px]">
                <div className="bg-gradient-to-r from-purple-600/95 to-pink-600/95 backdrop-blur-md rounded-xl shadow-2xl p-2.5 animate-in slide-in-from-top-3 duration-500 pointer-events-auto border border-white/20">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="bg-white/20 rounded-full p-1 backdrop-blur-sm flex-shrink-0">
                        <Gift className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-xs truncate leading-tight">
                          {activeGiveaway.name || 'Giveaway'}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 text-white/90 text-[10px]">
                      <div className="flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        <span>{activeGiveaway.participants?.length || 0}</span>
                      </div>
                      {giveawayTimeLeft > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{giveawayTimeLeft}s</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    {isShowOwner ? (
                      <button
                        onClick={handleEndGiveaway}
                        className="w-full px-2 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold text-[10px] rounded-lg transition-colors"
                        data-testid="button-end-giveaway-mobile"
                      >
                        End
                      </button>
                    ) : (() => {
                      // Check if user already entered (handle both string IDs and objects)
                      const participants = activeGiveaway.participants || [];
                      const isAlreadyParticipant = participants.some((p: any) => 
                        (typeof p === 'string' ? p : p.id || p._id) === currentUserId
                      );
                      return isAlreadyParticipant;
                    })() ? (
                      <div className="w-full px-2 py-1.5 bg-green-500/90 text-white font-semibold text-[10px] rounded-lg text-center" data-testid="text-already-entered-mobile">
                        Entered!
                      </div>
                    ) : (
                      <button
                        onClick={activeGiveaway.whocanenter === 'followers' && !isFollowingHost ? handleFollowAndJoinGiveaway : handleJoinGiveaway}
                        disabled={isJoiningGiveaway}
                        className="w-full px-2 py-1.5 bg-white hover:bg-white/90 text-black font-semibold text-[10px] rounded-lg transition-colors disabled:opacity-50"
                        data-testid="button-join-giveaway-mobile"
                      >
                        {isJoiningGiveaway ? (
                          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                        ) : (
                          'Enter'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="relative w-full h-full md:w-auto md:h-full md:aspect-[9/16]">
              
              {/* More Options Sheet Overlay */}
              {showMoreOptionsSheet && (
                <div 
                  className="absolute inset-0 z-50 flex items-end"
                  onClick={() => setShowMoreOptionsSheet(false)}
                >
                  {/* Backdrop */}
                  <div className="absolute inset-0 bg-black/50" />
                  
                  {/* Sheet content - bottom sheet style */}
                  <div 
                    className="relative w-full bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom-5 duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-black">Show Options</h3>
                        <p className="text-sm text-gray-600 mt-1">Manage your live show</p>
                      </div>
                      <div className="space-y-2">
                        {/* Raid Show - Only show when live and has viewers */}
                        {isLive && viewerCount > 0 && (
                          <button
                            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => {
                              setShowMoreOptionsSheet(false);
                              setShowRaidDialog(true);
                            }}
                            data-testid="button-rally-show"
                          >
                            <Zap className="h-5 w-5 text-primary" />
                            <span className="flex-1 text-left text-black font-semibold">Rally to Another Show</span>
                            <Badge variant="secondary" className="text-xs">
                              {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
                            </Badge>
                          </button>
                        )}

                        {/* End Show - Only show when live */}
                        {isLive && (
                          <button
                            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={async () => {
                              if (isEndingShow) return;
                              
                              setIsEndingShow(true);
                              setShowMoreOptionsSheet(false);
                              
                              try {
                                const endResponse = await fetch(`/api/rooms/${id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ ended: true })
                                });
                                
                                if (!endResponse.ok) {
                                  throw new Error('Failed to end show');
                                }
                                
                                console.log('✅ Show ended successfully');
                                
                                if (socket) {
                                  socket.emit('end-room', { roomId: id });
                                }
                                
                                if (livekit.disconnect) {
                                  await livekit.disconnect();
                                }
                                setLivekitEnabled(false);
                                
                                if (id) {
                                  leaveRoom(id);
                                }
                                
                                queryClient.invalidateQueries({ queryKey: ['/api/rooms', id, currentUserId] });
                                
                                toast({
                                  title: "Show Ended",
                                  description: "Your show has been ended successfully.",
                                });
                                
                                navigate('/');
                              } catch (error) {
                                console.error('Error ending show:', error);
                                setIsEndingShow(false);
                                toast({
                                  title: "Error",
                                  description: "Failed to end show. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={isEndingShow}
                            data-testid="button-end-show"
                          >
                            {isEndingShow ? (
                              <>
                                <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                                <span className="flex-1 text-left text-black font-semibold">Ending Show...</span>
                              </>
                            ) : (
                              <>
                                <X className="h-5 w-5 text-red-600" />
                                <span className="flex-1 text-left text-black font-semibold">End Show</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete Show - Only show when not started */}
                        {!isLive && (
                          <button
                            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={async () => {
                              if (isEndingShow) return;
                              
                              setIsEndingShow(true);
                              setShowMoreOptionsSheet(false);
                              
                              try {
                                const deleteResponse = await fetch(`/api/rooms/${id}?destroy=true`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                });
                                
                                if (!deleteResponse.ok) {
                                  throw new Error('Failed to delete show');
                                }
                                
                                console.log('✅ Show deleted successfully');
                                
                                if (id) {
                                  leaveRoom(id);
                                }
                                
                                toast({
                                  title: "Show Deleted",
                                  description: "Your show has been deleted successfully.",
                                });
                                
                                navigate('/');
                              } catch (error) {
                                console.error('Error deleting show:', error);
                                setIsEndingShow(false);
                                toast({
                                  title: "Error",
                                  description: "Failed to delete show. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={isEndingShow}
                            data-testid="button-delete-show"
                          >
                            {isEndingShow ? (
                              <>
                                <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                                <span className="flex-1 text-left text-black font-semibold">Deleting...</span>
                              </>
                            ) : (
                              <>
                                <Trash className="h-5 w-5 text-red-600" />
                                <span className="flex-1 text-left text-black font-semibold">Delete</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Edit Show - Only show when show hasn't started */}
                        {!isLive && !show?.started && (
                          <button
                            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => {
                              setShowMoreOptionsSheet(false);
                              navigate(`/schedule-show?edit=${id}`);
                            }}
                            data-testid="button-edit-show"
                          >
                            <Edit className="h-5 w-5 text-blue-600" />
                            <span className="flex-1 text-left text-black font-semibold">Edit Show</span>
                          </button>
                        )}
                        
                        {/* Cancel */}
                        <button
                          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => setShowMoreOptionsSheet(false)}
                          data-testid="button-cancel-options"
                        >
                          <span className="flex-1 text-center text-gray-600">Cancel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Auction Winner Announcement - Small overlay at top of video */}
              {showWinnerDialog && winnerData && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-white rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
                    {winnerData?.profileImage ? (
                      <img 
                        src={winnerData.profileImage} 
                        alt={winnerData?.name || 'Winner'} 
                        className="w-10 h-10 rounded-full object-cover"
                        data-testid="img-winner-profile"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {winnerData?.name?.substring(0, 2).toUpperCase() || '🏆'}
                        </span>
                      </div>
                    )}
                    <span className="text-black font-bold text-sm whitespace-nowrap" data-testid="text-winner-name">
                      {winnerData?.name || 'Someone'} won!
                    </span>
                  </div>
                </div>
              )}

              {/* Giveaway Winner Announcement - Appealing overlay at top of video */}
              {showGiveawayWinnerDialog && giveawayWinnerData && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 border-2 border-white/20">
                    <Gift className="h-6 w-6 text-white animate-bounce" />
                    {giveawayWinnerData?.profileImage ? (
                      <img 
                        src={giveawayWinnerData.profileImage} 
                        alt={giveawayWinnerData?.name || 'Winner'} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                        data-testid="img-giveaway-winner-profile"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-white text-base font-bold">
                          {giveawayWinnerData?.name?.substring(0, 2).toUpperCase() || '🎉'}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-base whitespace-nowrap" data-testid="text-giveaway-winner-name">
                        {giveawayWinnerData?.name || 'Someone'} won!
                      </span>
                      <span className="text-white/90 text-xs whitespace-nowrap">
                        {giveawayWinnerData?.giveawayName}
                      </span>
                    </div>
                    <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Order Notification - Show owner sees purchase notification */}
              {showOrderNotification && orderNotificationData && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="bg-gradient-to-r from-secondary via-secondary/90 to-secondary/80 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 border-2 border-white/20">
                    <ShoppingBag className="h-6 w-6 text-white animate-bounce" />
                    <div className="flex items-center">
                      <span className="text-white font-bold text-base whitespace-nowrap" data-testid="text-order-message">
                        {orderNotificationData?.message || 'A purchase was made!'}
                      </span>
                    </div>
                    <DollarSign className="h-6 w-6 text-yellow-300 animate-pulse" />
                  </div>
                </div>
              )}

              {/* LiveKit Video Player - shown when connected AND has video */}
              {livekit.isConnected && livekit.room && livekit.hasVideo && (
                <div className="absolute inset-0 w-full h-full z-20 bg-black" data-testid="livekit-video-player">
                  <Suspense fallback={
                    <div className="flex items-center justify-center w-full h-full">
                      <Loader2 className="h-12 w-12 animate-spin text-white" />
                    </div>
                  }>
                    <LiveKitVideoPlayer room={livekit.room} />
                  </Suspense>
                </div>
              )}

              {/* Warning Banners - Sequential Display */}
              {currentBanner === 'explicit' && (
                <div className="absolute top-20 left-0 right-0 flex items-center justify-center px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg border border-primary/30">
                    <Flag className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-white font-medium text-base">May contain explicit content.</span>
                  </div>
                </div>
              )}

              {currentBanner === 'shipping' && (
                <div className="absolute top-20 left-0 right-0 flex items-center justify-center px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg border border-secondary/30">
                    <span className="text-white font-medium text-base">
                      {show?.shipping_settings?.freePickupEnabled 
                        ? '📦 Free shipping on all orders!' 
                        : show?.shipping_settings?.shippingCostMode === 'seller_pays_all'
                        ? '📦 Free shipping on all orders!'
                        : show?.shipping_settings?.shippingCostMode === 'buyer_pays_up_to'
                        ? `📦 Pay max $${show?.shipping_settings?.reducedShippingCapAmount?.toFixed(2) || '0.00'} in shipping costs, regardless of how much you order!`
                        : '📦 Shipping discount available!'}
                    </span>
                  </div>
                </div>
              )}

              {/* Show connecting state */}
              {livekit.isConnecting && (
                <div className="absolute inset-0 w-full h-full bg-black/90 z-30 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-white">
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <p className="text-lg font-semibold">Connecting to live stream...</p>
                    <p className="text-sm text-white/70">This may take a few moments</p>
                  </div>
                </div>
              )}

              {/* Show camera initializing state - when connected but no video yet (only for host with publish permissions) */}
              {livekit.isConnected && !livekit.hasVideo && !livekit.isConnecting && isShowOwner && canPublish && (
                <div className="absolute inset-0 w-full h-full bg-black/90 z-30 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-white">
                    <Video className="h-12 w-12 animate-pulse" />
                    <p className="text-lg font-semibold">Initializing camera...</p>
                    <p className="text-sm text-white/70">Please allow camera and microphone access</p>
                  </div>
                </div>
              )}

              {/* Show waiting for host state - for viewers or owners without publish permissions when connected but host has no video yet */}
              {livekit.isConnected && !livekit.hasHostVideo && !livekit.isConnecting && (!isShowOwner || (isShowOwner && !canPublish)) && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-black/85 via-black/80 to-black/85 z-30 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-6 text-white max-w-md mx-4 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-primary/30 to-primary/10 rounded-full p-6 border border-primary/30">
                        <Radio className="h-12 w-12 text-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold">Show is starting soon</p>
                      <p className="text-sm text-white/70">The host is preparing their camera...</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                      <span>Connected and waiting</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show error state */}
              {livekit.error && !livekit.isConnected && (
                <div className="absolute inset-0 w-full h-full bg-black/80 z-15 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-white max-w-sm mx-4">
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                    <p className="text-lg font-semibold text-center">{livekit.error}</p>
                    <Button onClick={livekit.connect} variant="outline">
                      Retry Connection
                    </Button>
                  </div>
                </div>
              )}

              {/* TESTING: Placeholder as background - SIMPLIFIED (96 SVGs removed) */}
              <div className="relative w-full h-full bg-gray-800" data-testid="show-video-placeholder">
                <span className="sr-only">No video available</span>
              </div>
              
              {/* Overlay preview video or image on top when not live */}
              {!livekit.hasVideo && (
                <>
                  {/* Show preview video if available and show hasn't started */}
                  {show?.preview_videos && !imageError && !isLive && (
                    <video
                      src={show.preview_videos}
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      autoPlay
                      loop
                      muted
                      playsInline
                      onError={() => setImageError(true)}
                      data-testid="show-preview-video"
                    />
                  )}
                  
                  {/* Show thumbnail as fallback or when live but video not ready */}
                  {showThumbnail && !imageError && (!show?.preview_videos || isLive) && (
                    <img
                      src={showThumbnail}
                      alt={showTitle}
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      onError={() => setImageError(true)}
                      data-testid="show-video-thumbnail"
                    />
                  )}
                </>
              )}

              {/* Desktop Product Info Overlay - Left Side */}
              {(
              <div 
                className={cn(
                  "hidden lg:block absolute left-0 right-24 px-4 pointer-events-none z-30",
                  "bottom-4"
                )}
              >
                <div className="pointer-events-auto w-full min-w-0">
                  {/* Active Auction Info */}
                  {activeAuction && (
                    <div className="flex flex-col gap-1.5 w-full min-w-0">
                      {activeAuction.bids && activeAuction.bids.length > 0 && (() => {
                        const calculatedEndTime = activeAuction.endTime || (activeAuction.startedTime + (activeAuction.duration * 1000));
                        return !(activeAuction.startedTime && Date.now() > calculatedEndTime);
                      })() && (
                        <p className="text-xs font-bold uppercase tracking-wide drop-shadow-lg">
                          <span className="text-white">{winningUser?.userName || winningUser?.firstName || 'Someone'}</span>{' '}
                          <span className="text-teal-400">winning!</span>
                        </p>
                      )}
                      
                      <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                        {activeAuction.product?.name || 'Auction Item'}{activeAuction.product?.order_reference_counter ? ` #${activeAuction.product.order_reference_counter}` : ''}
                      </h2>
                      
                      <div className="flex items-center gap-1.5 text-white/90">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" opacity="0.3"/>
                          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">$</text>
                        </svg>
                        <span className="text-sm font-medium drop-shadow-lg">
                          Bids: {activeAuction.bids?.length || 0}
                        </span>
                      </div>
                      
                      {shippingEstimate && (
                        <p className={`text-sm drop-shadow-lg ${shippingEstimate.error ? 'text-destructive font-semibold' : 'text-white/90 underline'}`}>
                          {shippingEstimate.error 
                            ? 'Unshippable' 
                            : `Shipping is US$${parseFloat(shippingEstimate.amount || 0).toFixed(2)} + Taxes`
                          }
                        </p>
                      )}
                      
                      {/* Rerun Auction Button - Show when auction ended with no bids and user is owner */}
                      {(() => {
                        // Calculate end time in milliseconds
                        let calculatedEndTime = activeAuction.endTime;
                        if (typeof calculatedEndTime === 'string') {
                          calculatedEndTime = new Date(calculatedEndTime).getTime();
                        } else if (!calculatedEndTime && activeAuction.startedTime && activeAuction.duration) {
                          calculatedEndTime = activeAuction.startedTime + (activeAuction.duration * 1000);
                        }
                        
                        const isEnded = calculatedEndTime && Date.now() > calculatedEndTime;
                        return isEnded && isShowOwner && (!activeAuction.bids || activeAuction.bids.length === 0);
                      })() && (
                        <Button
                          onClick={handleRerunAuction}
                          className="mt-6 w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-colors"
                          data-testid="button-rerun-auction"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Rerun Auction
                        </Button>
                      )}
                      
                      {/* Bid Buttons - Desktop */}
                      {(() => {
                        const hasAuction = !!activeAuction;
                        const notEnded = activeAuction && auctionTimeLeft > 0;
                        const hasTimeLeft = auctionTimeLeft > 0;
                        const notOwner = !isShowOwner;
                        const shouldShow = hasAuction && notEnded && hasTimeLeft && notOwner;
                        
                        if (!shouldShow) return null;
                        
                        const nextBid = activeAuction.newbaseprice || activeAuction.baseprice || 1;
                        
                        // Check if user has already placed a custom bid in this auction
                        // Each user has only one bid object that gets updated by backend
                        const userBid = activeAuction.bids?.find((bid: any) => 
                          bid.user?._id === currentUserId
                        );
                        // Only enforce max limit if this bid has custom_bid flag set
                        const userMaxBidLimit = userBid?.custom_bid ? userBid.autobidamount : null;
                        const hasReachedMax = userMaxBidLimit && nextBid > userMaxBidLimit;
                        
                        const hasShippingError = shippingEstimate?.error === true;
                        
                        return (
                          <div className="flex gap-2 mt-4 w-full">
                            <button
                              onClick={() => handleCustomBidClick()}
                              disabled={isUserWinning || hasShippingError}
                              className="h-9 flex-[0.35] rounded-full border-2 border-white/90 text-white font-semibold text-sm bg-transparent hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              data-testid="button-custom-bid-desktop"
                            >
                              Custom
                            </button>
                            <button
                              onClick={() => handlePlaceBid(nextBid)}
                              disabled={placeBidMutation.isPending || isUserWinning || hasShippingError}
                              className="h-9 flex-[0.65] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              data-testid="button-place-bid-desktop"
                            >
                              {placeBidMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              ) : (
                                `Bid: $${nextBid.toFixed(0)}`
                              )}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* Pinned Product Info */}
                  {(!activeAuction || (() => {
                    const calculatedEndTime = activeAuction.endTime || (activeAuction.startedTime + (activeAuction.duration * 1000));
                    return activeAuction.startedTime && Date.now() > calculatedEndTime;
                  })()) && pinnedProduct && (pinnedProduct._id !== activeAuction?.product?._id && pinnedProduct._id !== activeAuction?.product?.id) && (
                    <div className="flex flex-col gap-1.5 w-full min-w-0">
                      <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                        {pinnedProduct.name || 'Product'}
                      </h2>
                      
                      <div className="flex items-center gap-1.5 text-white/90">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" opacity="0.3"/>
                          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">$</text>
                        </svg>
                        <span className="text-sm font-medium drop-shadow-lg">
                          Available: {pinnedProduct.quantity || 0}
                        </span>
                      </div>
                      
                      {/* Flash Sale Info - Compact - Show for both active flash sale and when product has flash_sale enabled */}
                      {(isActiveFlashSale || pinnedProduct.flash_sale) && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-zinc-800/90 rounded-full px-3 py-1.5">
                              <Zap className="h-4 w-4 text-yellow-400" />
                              <span className="text-white font-semibold text-sm">
                                Flash Sale - {pinnedProduct.flash_sale_discount_type === 'percentage' 
                                  ? `${pinnedProduct.flash_sale_discount_value || 0}% Off`
                                  : `$${pinnedProduct.flash_sale_discount_value || 0} Off`
                                }
                              </span>
                            </div>
                            <div className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 flex items-center gap-2">
                              <span className="font-bold text-sm">
                                {pinnedProduct.quantity || 0} {isActiveFlashSale ? 'Left' : 'Available'}
                              </span>
                              {isActiveFlashSale && flashSaleTimeLeft > 0 && (
                                <>
                                  <span className="text-primary-foreground/50">·</span>
                                  <span className="font-mono font-bold text-sm">
                                    {Math.floor(flashSaleTimeLeft / 60)}:{(flashSaleTimeLeft % 60).toString().padStart(2, '0')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Referral Credit Info - show when user has referral credit from this seller */}
                      {!pinnedProduct.flash_sale && referralInfo && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/50 line-through text-sm">${(pinnedProduct.price || 0).toFixed(2)}</span>
                          <span className="text-primary font-bold text-sm">${((pinnedProduct.price || 0) - referralInfo.credit).toFixed(2)}</span>
                        </div>
                      )}

                      {!isActiveFlashSale && shippingEstimate && (
                        <p className={`text-sm drop-shadow-lg ${shippingEstimate.error ? 'text-destructive font-semibold' : 'text-white/90 underline'}`}>
                          {shippingEstimate.error 
                            ? 'Unshippable' 
                            : `Shipping is US$${parseFloat(shippingEstimate.amount || 0).toFixed(2)} + Taxes`
                          }
                        </p>
                      )}
                      
                      {!isShowOwner && !shippingEstimate?.error && (
                        pinnedProduct.flash_sale && !isActiveFlashSale ? (
                          <Button
                            disabled
                            className="mt-6 w-full h-11 rounded-full font-bold text-base bg-zinc-700 text-zinc-400 cursor-not-allowed"
                            data-testid="button-waiting-price-reveal"
                          >
                            <Zap className="h-5 w-5 mr-2" />
                            Waiting Price Reveal
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setBuyNowProduct(pinnedProduct);
                              setShowBuyNowDialog(true);
                            }}
                            className="mt-6 w-full h-11 rounded-full font-bold text-base transition-colors bg-primary hover:bg-primary/90 text-primary-foreground"
                            data-testid="button-buy-now-overlay"
                          >
                            <ShoppingBag className="h-5 w-5 mr-2" />
                            {isActiveFlashSale ? 'Buy Flash Sale!' : 'Buy Now'}
                          </Button>
                        )
                      )}
                      
                      {isShowOwner && pinnedProduct.flash_sale && !isActiveFlashSale && (
                        <Button
                          onClick={() => {
                            if (!socket || !id) return;
                            socket.emit('start-flash-sale', {
                              productId: pinnedProduct._id,
                              roomId: id,
                              discountType: pinnedProduct.flash_sale_discount_type || 'percentage',
                              discountValue: pinnedProduct.flash_sale_discount_value || 0,
                              duration: pinnedProduct.flash_sale_duration || 60,
                              buyLimit: pinnedProduct.flash_sale_buy_limit || 1,
                              originalPrice: pinnedProduct.price || 0
                            });
                            console.log('⚡ Start flash sale emitted:', {
                              productId: pinnedProduct._id,
                              roomId: id,
                              discountType: pinnedProduct.flash_sale_discount_type,
                              discountValue: pinnedProduct.flash_sale_discount_value,
                              duration: pinnedProduct.flash_sale_duration,
                              buyLimit: pinnedProduct.flash_sale_buy_limit,
                              originalPrice: pinnedProduct.price
                            });
                          }}
                          className="mt-4 w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-colors flex items-center justify-center"
                          data-testid="button-start-flash-sale"
                        >
                          <Zap className="h-5 w-5 mr-2" />
                          Start Flash Sale
                        </Button>
                      )}
                      
                      {isShowOwner && isActiveFlashSale && (
                        <div className="mt-4 w-full h-11 rounded-full bg-primary/20 text-primary font-bold text-base flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Purchases {pinnedProduct.salesCount || 0}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Combined Chat, Product Info & Auction Section - Mobile Only */}
              {(
              <div className={cn(
                "absolute bottom-0 left-0 right-20 pointer-events-none lg:hidden z-30 flex flex-col",
                (showMobileProducts || showMobileChat) && "hidden",
                !isLive && isShowOwner && "pb-20"
              )}>
                {/* Chat Messages & Input - Top section */}
                <div className="relative pb-2">
                  <div className="relative z-10 pl-3 pr-3 pb-2 md:pl-4 md:pr-auto md:max-w-80 flex flex-col gap-2 pointer-events-auto">
                    {/* Chat Messages - strictly limited height */}
                    <div ref={chatMessagesRef} className={cn(
                      "space-y-0.5 overflow-y-auto scrollbar-hide flex flex-col",
                      !activeAuction && !pinnedProduct ? "min-h-[40vh] justify-end" : "max-h-[30vh] justify-start"
                    )}>
                        {chatMessages.slice(-6).map((msg: any, i: number) => (
                          <div 
                            key={i} 
                            className="flex gap-2 p-1 animate-in slide-in-from-bottom-2 duration-300"
                            data-testid={`chat-overlay-message-${i}`}
                          >
                            <Avatar 
                              className="h-6 w-6 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                if (msg.senderId) {
                                  window.open(`/profile/${msg.senderId}`, '_blank');
                                }
                              }}
                            >
                              <AvatarImage src={msg.image_url} />
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {msg.senderName?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                {msg.senderName}
                              </p>
                              <div className="text-xs leading-tight break-words text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                {renderMessageWithMentions(msg.message, msg.mentions)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat Input */}
                      {isAuthenticated && (
                        <div className="pointer-events-auto">
                          {/* User Suggestions Chips */}
                          {userSuggestions.length > 0 && (
                            <div className="mb-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {userSuggestions.map((suggestedUser: any) => (
                                <div
                                  key={suggestedUser._id || suggestedUser.id}
                                  onClick={() => selectMention(
                                    suggestedUser.userName || suggestedUser.firstName,
                                    suggestedUser._id || suggestedUser.id
                                  )}
                                  className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                  data-testid={`mention-suggestion-mobile-${suggestedUser._id || suggestedUser.id}`}
                                >
                                  <Avatar className="h-7 w-7">
                                    {suggestedUser.profilePhoto && (
                                      <AvatarImage src={suggestedUser.profilePhoto} alt={suggestedUser.userName} />
                                    )}
                                    <AvatarFallback className="text-xs">
                                      {(suggestedUser.userName || suggestedUser.firstName || 'A').charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-white max-w-[60px] truncate">
                                    {suggestedUser.userName || suggestedUser.firstName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 items-center pointer-events-auto">
                            <Input
                              placeholder="Send a message..."
                              value={message}
                              onChange={(e) => handleMessageChange(e.target.value)}
                              onFocus={() => setIsKeyboardVisible(true)}
                              onBlur={() => setIsKeyboardVisible(false)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && message.trim()) {
                                  e.preventDefault();
                                  handleSendMessage(message);
                                }
                              }}
                              className="flex-1 bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-400 h-11 rounded-full px-5 pointer-events-auto"
                              data-testid="input-chat-message"
                            />
                            {message.trim() && (
                              <Button
                                onClick={() => handleSendMessage(message)}
                                size="icon"
                                className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                                data-testid="button-send-message"
                              >
                                <Send className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                
                {/* Product Info & Auction Buttons - Bottom section */}
                <div className="px-4 pb-3 pt-3 pointer-events-auto">
                  {/* Product Info */}
                  <div className="mb-3">
                    {/* Active Auction Info */}
                    {activeAuction && (
                      <div className="space-y-1.5">
                        {/* Current Winning Bidder */}
                        {activeAuction.bids && activeAuction.bids.length > 0 && (() => {
                          const calculatedEndTime = activeAuction.endTime || (activeAuction.startedTime + (activeAuction.duration * 1000));
                          return !(activeAuction.startedTime && Date.now() > calculatedEndTime);
                        })() && (
                          <p className="text-xs font-bold uppercase tracking-wide drop-shadow-lg">
                            <span className="text-white">{winningUser?.userName || winningUser?.firstName || 'Someone'}</span>{' '}
                            <span className="text-teal-400">winning!</span>
                          </p>
                        )}
                        
                        {/* Product Name */}
                        <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                          {activeAuction.product?.name || 'Auction Item'}{activeAuction.product?.order_reference_counter ? ` #${activeAuction.product.order_reference_counter}` : ''}
                        </h2>
                        
                        {/* Bids Count */}
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10" opacity="0.3"/>
                            <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">$</text>
                          </svg>
                          <span className="text-sm font-medium drop-shadow-lg">
                            Bids: {activeAuction.bids?.length || 0}
                          </span>
                        </div>
                        
                        {/* Shipping Info */}
                        {shippingEstimate && (
                          <p className={`text-sm drop-shadow-lg ${shippingEstimate.error ? 'text-destructive font-semibold' : 'text-white/90 underline'}`}>
                            {shippingEstimate.error 
                              ? shippingEstimate.message 
                              : `Shipping is US$${parseFloat(shippingEstimate.amount || 0).toFixed(2)} + Taxes`
                            }
                          </p>
                        )}
                        
                        {/* Rerun Auction Button - Show when auction ended with no bids and user is owner */}
                        {(() => {
                          // Calculate end time in milliseconds
                          let calculatedEndTime = activeAuction.endTime;
                          if (typeof calculatedEndTime === 'string') {
                            calculatedEndTime = new Date(calculatedEndTime).getTime();
                          } else if (!calculatedEndTime && activeAuction.startedTime && activeAuction.duration) {
                            calculatedEndTime = activeAuction.startedTime + (activeAuction.duration * 1000);
                          }
                          
                          const isEnded = calculatedEndTime && Date.now() > calculatedEndTime;
                          return isEnded && isShowOwner && (!activeAuction.bids || activeAuction.bids.length === 0);
                        })() && (
                          <Button
                            onClick={handleRerunAuction}
                            className="mt-6 w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-colors"
                            data-testid="button-rerun-auction"
                          >
                            <Play className="h-5 w-5 mr-2" />
                            Rerun Auction
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Pinned Product Info */}
                    {(!activeAuction || (() => {
                      const calculatedEndTime = activeAuction.endTime || (activeAuction.startedTime + (activeAuction.duration * 1000));
                      return activeAuction.startedTime && Date.now() > calculatedEndTime;
                    })()) && pinnedProduct && (pinnedProduct._id !== activeAuction?.product?._id && pinnedProduct._id !== activeAuction?.product?.id) && (
                      <div className="space-y-1.5">
                        {/* Product Name */}
                        <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                          {pinnedProduct.name || 'Product'}
                        </h2>
                        
                        {/* Available Count */}
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10" opacity="0.3"/>
                            <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">$</text>
                          </svg>
                          <span className="text-sm font-medium drop-shadow-lg">
                            Available: {pinnedProduct.quantity || 0}
                          </span>
                        </div>
                        
                        {/* Flash Sale Info - Mobile Compact */}
                        {pinnedProduct.flash_sale && (
                          <div className="mt-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5 bg-zinc-800/90 rounded-full px-2 py-1">
                                <Zap className="h-3 w-3 text-yellow-400" />
                                <span className="text-white font-semibold text-[10px]">
                                  Flash Sale - {pinnedProduct.flash_sale_discount_type === 'percentage' 
                                    ? `${pinnedProduct.flash_sale_discount_value || 0}% Off`
                                    : `$${pinnedProduct.flash_sale_discount_value || 0} Off`
                                  }
                                </span>
                              </div>
                              <div className="bg-primary text-primary-foreground rounded-full px-2 py-1 flex items-center gap-1">
                                <span className="font-bold text-[10px]">
                                  {pinnedProduct.quantity || 0} {pinnedProduct.flash_sale_started ? 'Left' : 'Available'}
                                </span>
                                {pinnedProduct.flash_sale_started && flashSaleTimeLeft > 0 && (
                                  <>
                                    <span className="text-primary-foreground/50">·</span>
                                    <span className="font-mono font-bold text-[10px]">
                                      {Math.floor(flashSaleTimeLeft / 60)}:{(flashSaleTimeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Shipping Info */}
                        {!pinnedProduct.flash_sale && shippingEstimate && (
                          <p className={`text-sm drop-shadow-lg ${shippingEstimate.error ? 'text-destructive font-semibold' : 'text-white/90 underline'}`}>
                            {shippingEstimate.error 
                              ? shippingEstimate.message 
                              : `Shipping is US$${parseFloat(shippingEstimate.amount || 0).toFixed(2)} + Taxes`
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Auction Buttons */}
                  {(() => {
                    const hasAuction = !!activeAuction;
                    const notEnded = activeAuction && auctionTimeLeft > 0;
                    const hasTimeLeft = auctionTimeLeft > 0;
                    const notOwner = !isShowOwner;
                    const shouldShow = hasAuction && notEnded && hasTimeLeft && notOwner;
                    
                    console.log('🎯 BID BUTTONS VISIBILITY CHECK:', {
                      hasAuction,
                      notEnded,
                      hasTimeLeft,
                      auctionTimeLeft,
                      notOwner,
                      isShowOwner,
                      shouldShow,
                      activeAuction: activeAuction ? {
                        _id: activeAuction._id,
                        startedTime: activeAuction.startedTime,
                        duration: activeAuction.duration,
                        endTime: activeAuction.endTime
                      } : null
                    });
                    
                    if (!shouldShow) return null;
                    
                    const nextBid = activeAuction.newbaseprice || activeAuction.baseprice || 1;
                    
                    // Check if user has already placed a custom bid in this auction
                    // Each user has only one bid object that gets updated by backend
                    const userBid = activeAuction.bids?.find((bid: any) => 
                      bid.user?._id === currentUserId
                    );
                    // Only enforce max limit if this bid has custom_bid flag set
                    const userMaxBidLimit = userBid?.custom_bid ? userBid.autobidamount : null;
                    const hasReachedMax = userMaxBidLimit && nextBid > userMaxBidLimit;
                    
                    const hasShippingError = shippingEstimate?.error === true;
                    
                    return (
                      <div className="flex gap-2 border-t border-white/10 pt-3 w-full">
                        <button
                          onClick={() => handleCustomBidClick()}
                          disabled={isUserWinning || hasShippingError}
                          className="h-11 w-[140px] rounded-full border-2 border-white/90 text-white font-semibold text-lg bg-transparent hover:bg-white/10 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid="button-custom-bid"
                        >
                          Custom
                        </button>
                        <button
                          onClick={() => handlePlaceBid(nextBid)}
                          disabled={placeBidMutation.isPending || isUserWinning || hasShippingError}
                          className="flex-1 h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid="button-place-bid"
                        >
                          {placeBidMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          ) : (
                            `Bid: $${nextBid.toFixed(0)}`
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
              )}

              {/* Scheduled Show Info - Center (Only shown when show is not live and user is NOT owner) */}
              {!isLive && !isShowOwner && !isKeyboardVisible && (
                <div className="absolute top-16 left-0 right-0 lg:top-1/2 lg:-translate-y-1/2 flex justify-center z-20 pointer-events-none px-4">
                  <div className="flex flex-col items-center gap-1.5 px-3 py-3 pointer-events-auto bg-black/50 backdrop-blur-md rounded-xl max-w-[280px] w-full lg:max-w-sm lg:px-6 lg:py-8 lg:gap-3">
                    {/* Show starts text and time */}
                    <div className="text-center mb-0.5">
                      <p className="text-white text-xs font-medium mb-0.5 lg:text-sm lg:mb-1">Show starts</p>
                      <p className="text-white text-lg font-bold lg:text-2xl">{scheduledTimeText || 'Soon'}</p>
                    </div>
                    
                    {/* Buttons for viewers */}
                    <div className="flex flex-col gap-2 w-full lg:gap-3">
                      <Button
                        className="w-full h-9 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full lg:h-12 lg:text-base"
                        onClick={async () => {
                          try {
                            console.log('🔔 Save & Notify clicked:', { currentUserId, show });
                            const currentInvitedIds = show?.invitedhostIds || show?.invited_host_ids || [];
                            const isAlreadySaved = currentInvitedIds.includes(currentUserId);
                            const invitedhostIds = isAlreadySaved
                              ? currentInvitedIds.filter((userId: string) => userId !== currentUserId) // Remove user ID
                              : [...currentInvitedIds, currentUserId]; // Add user ID
                            
                            console.log('🔔 Notification update:', { currentInvitedIds, isAlreadySaved, invitedhostIds });
                            
                            const response = await fetch(`/api/rooms/${id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include',
                              body: JSON.stringify({ invitedhostIds })
                            });
                            
                            console.log('🔔 Response:', response.status, response.statusText);
                            
                            if (response.ok) {
                              console.log('✅ Response OK, updating UI...');
                              setIsNotificationSaved(!isAlreadySaved);
                              console.log('✅ Showing success toast...');
                              toast({
                                title: isAlreadySaved ? "Notification Removed" : "Notification Set",
                                description: isAlreadySaved 
                                  ? "You won't be notified about this show"
                                  : "We'll notify you when the show starts!"
                              });
                              console.log('✅ Invalidating queries...');
                              queryClient.invalidateQueries({ queryKey: ['/api/rooms', id] });
                              console.log('✅ Save & Notify complete!');
                            } else {
                              console.error('❌ Response not OK:', response.status);
                              const errorData = await response.text();
                              console.error('❌ Error data:', errorData);
                              throw new Error('Failed to update notification');
                            }
                          } catch (error) {
                            console.error('❌ Caught error:', error);
                            toast({
                              title: "Error",
                              description: "Failed to update notification. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                        data-testid="button-save-notify"
                      >
                        <Bookmark className={cn("h-5 w-5 mr-2", isNotificationSaved && "fill-current")} />
                        {isNotificationSaved ? "Saved" : "Save & notify me"}
                      </Button>
                      
                      <Button
                        variant="secondary"
                        className="w-full h-9 text-sm font-semibold bg-white hover:bg-gray-200 text-black rounded-full lg:h-12 lg:text-base"
                        onClick={() => setShowShareDialog(true)}
                        data-testid="button-share-show"
                      >
                        Share show
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Show Button - Bottom (Only shown when show is not live and user is owner) */}
              {!isLive && isShowOwner && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center z-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pb-6 pt-12 pointer-events-none">
                  <Button
                    size="lg"
                    className="w-[90%] h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-2xl pointer-events-auto"
                    onClick={() => {
                      if (socket && socketIsConnected) {
                        console.log('🎬 Start Show button clicked - opening camera settings');
                        setShowCameraSettings(true);
                      } else if (socket && !socketIsConnected) {
                        console.warn('⚠️ Socket exists but not connected yet');
                        toast({
                          title: "Connecting...",
                          description: "Please wait a moment and try again.",
                          variant: "default"
                        });
                      } else {
                        console.error('❌ Socket not initialized');
                        toast({
                          title: "Connection Error",
                          description: "Unable to start show. Please refresh the page.",
                          variant: "destructive"
                        });
                      }
                    }}
                    disabled={livekit.isConnecting || !socketIsConnected}
                    data-testid="button-start-show"
                  >
                    {livekit.isConnecting ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : !socketIsConnected ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Settings className="h-6 w-6 mr-2" />
                        Start Show
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Camera Settings Modal */}
              <CameraSettingsModal
                open={showCameraSettings}
                onClose={() => setShowCameraSettings(false)}
                onConfirm={(settings: CameraSettings) => {
                  setShowCameraSettings(false);
                  console.log('🎬 Camera settings confirmed:', settings);
                  
                  if (onCameraSettingsConfirm) {
                    onCameraSettingsConfirm(settings);
                  }
                  
                  socket.emit('start-room', { roomId: id, userId: currentUserId });
                  setLivekitEnabled(true);
                  
                  toast({
                    title: "Starting Show",
                    description: "Connecting to live stream..."
                  });
                }}
              />

              {/* Right Side Controls (Whatnot Style) - Positioned on video */}
              <div className={cn(
                "absolute right-3 flex flex-col gap-6 z-40 items-end",
                isShowOwner && !isLive ? "bottom-24" : 
                (activeAuction && (() => {
                  const calculatedEndTime = activeAuction.endTime || (activeAuction.startedTime + (activeAuction.duration * 1000));
                  return !(activeAuction.startedTime && Date.now() > calculatedEndTime);
                })() && auctionTimeLeft > 0 && !isShowOwner) ? "bottom-24" : "bottom-4"
              )}>
                <button 
                  className="flex flex-col items-center gap-1 text-white drop-shadow-lg"
                  onClick={() => {
                    if (livekit.isConnected && livekit.toggleAudioMute) {
                      livekit.toggleAudioMute();
                    } else {
                      setMuted(!muted);
                    }
                  }}
                  data-testid="button-sound"
                >
                  {livekit.isConnected ? (
                    livekit.isMuted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />
                  ) : (
                    muted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />
                  )}
                  <span className="text-xs font-semibold">Sound</span>
                </button>

                <button 
                  className="flex flex-col items-center gap-1 text-white drop-shadow-lg"
                  onClick={() => setShowShareDialog(true)}
                  data-testid="button-share"
                >
                  <Share2 className="h-7 w-7" />
                  <span className="text-xs font-semibold">Share</span>
                </button>

                {/* Store button - Only show on mobile */}
                <button 
                  className="lg:hidden flex flex-col items-center gap-1 text-white drop-shadow-lg"
                  onClick={() => setShowMobileProducts(true)}
                  data-testid="button-mobile-products"
                >
                  <ShoppingBag className="h-7 w-7" />
                  <span className="text-xs font-semibold">Store</span>
                </button>

                {/* More options button - Only show for show owner with publish permissions */}
                {isShowOwner && canPublish && (
                  <button 
                    className="flex flex-col items-center gap-1 text-white drop-shadow-lg"
                    onClick={() => setShowMoreOptionsSheet(true)}
                    data-testid="button-more-options"
                  >
                    <MoreVertical className="h-7 w-7" />
                    <span className="text-xs font-semibold">More</span>
                  </button>
                )}

                {/* Wallet button - Only show for viewers, not hosts */}
                {!isShowOwner && (
                  <button 
                    className="flex flex-col items-center gap-1 text-white drop-shadow-lg"
                    onClick={handleWalletClick}
                    data-testid="button-wallet"
                  >
                    <Wallet className="h-7 w-7" />
                    <span className="text-xs font-semibold">Wallet</span>
                  </button>
                )}

                {/* Price and Timer - Only show when there's an auction or pinned product */}
                {(activeAuction || pinnedProduct) && (
                  <div className="flex flex-col items-center gap-0.5 text-white drop-shadow-lg" data-testid="display-current-bid">
                    {/* Flash sale price display - show strikethrough when flash_sale is true (active or waiting) */}
                    {!activeAuction && pinnedProduct?.flash_sale && (
                      <span className="text-sm text-white/50 line-through">
                        ${(pinnedProduct.price || 0).toFixed(2)}
                      </span>
                    )}
                    {/* Referral credit strikethrough - show when no flash sale but referral applies */}
                    {!activeAuction && pinnedProduct && !pinnedProduct.flash_sale && referralInfo && (
                      <span className="text-sm text-white/50 line-through">
                        ${(pinnedProduct.price || 0).toFixed(2)}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {activeAuction && timeAddedBlink && (
                        <span className="text-lg font-bold text-yellow-400">
                          +{activeAuction.increaseBidBy || 5}
                        </span>
                      )}
                      <span className="text-xl font-bold">
                        ${activeAuction 
                          ? currentBid.toFixed(0) 
                          : pinnedProduct 
                            ? pinnedProduct.flash_sale
                              ? isActiveFlashSale
                                ? (pinnedProduct.flash_sale_discount_type === 'percentage'
                                    ? (pinnedProduct.price || 0) * (1 - (pinnedProduct.flash_sale_discount_value || 0) / 100)
                                    : (pinnedProduct.price || 0) - (pinnedProduct.flash_sale_discount_value || 0)
                                  ).toFixed(2)
                                : '****'
                              : referralInfo
                                ? ((pinnedProduct.price || 0) - referralInfo.credit).toFixed(2)
                                : (pinnedProduct.price || 0).toFixed(0)
                            : '0'
                        }
                      </span>
                    </div>
                    {activeAuction && (() => {
                      // Check if auction has ended - use API's ended flag or calculate from endTime
                      const endTimeMs = activeAuction.endTime 
                        ? (typeof activeAuction.endTime === 'string' ? new Date(activeAuction.endTime).getTime() : activeAuction.endTime)
                        : (activeAuction.startedTime + (activeAuction.duration * 1000));
                      const isEnded = activeAuction.ended || (activeAuction.startedTime && Date.now() > endTimeMs);
                      return isEnded && activeAuction.bids && activeAuction.bids.length > 0;
                    })() && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-red-500">
                          SOLD
                        </span>
                      </div>
                    )}
                    {activeAuction && (() => {
                      // Use endTime if available (accounts for time extensions), otherwise calculate from duration
                      const endTimeMs = activeAuction.endTime 
                        ? (typeof activeAuction.endTime === 'string' ? new Date(activeAuction.endTime).getTime() : activeAuction.endTime)
                        : (activeAuction.startedTime + (activeAuction.duration * 1000));
                      const isEnded = activeAuction.ended || (activeAuction.startedTime && Date.now() > endTimeMs);
                      const isNotEnded = !isEnded;
                      return isNotEnded && auctionTimeLeft > 0;
                    })() && (
                      <div className={cn(
                        "flex items-center gap-1 transition-all duration-200",
                        timeAddedBlink && "scale-125 text-yellow-400"
                      )}>
                        {activeAuction.sudden && (
                          <Skull className="h-4 w-4" />
                        )}
                        <span className={cn(
                          "text-sm font-bold",
                          timeAddedBlink ? "text-yellow-400" : "text-red-500"
                        )}>
                          {String(Math.floor(auctionTimeLeft / 60)).padStart(2, '0')}:{(auctionTimeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Custom Bid Dialog */}
        {activeAuction && (
          <CustomBidDialog
            open={showCustomBidDialog}
            onOpenChange={setShowCustomBidDialog}
            productName={activeAuction?.product?.name || 'Auction Item'}
            currentBid={currentBid}
            minimumBid={activeAuction?.newbaseprice || activeAuction?.baseprice || 1}
            onPlaceBid={(amount, isMaxBid) => {
              // Route through placeBidMutation for payment/shipping validation
              handlePlaceBid({
                amount: amount,
                isMaxBid: isMaxBid
              });
            }}
            isPending={placeBidMutation.isPending}
            timeLeft={auctionTimeLeft}
          />
        )}

        {/* Raid Show Dialog */}
        <RaidShowDialog
          open={showRaidDialog}
          onOpenChange={setShowRaidDialog}
          currentShowId={id}
          hostName={hostName}
          hostId={hostId}
          viewerCount={viewerCount}
          onRaid={async (targetShowId: string) => {
            // CRITICAL: Capture the source show ID immediately before any async operations
            // The `id` from useParams is reactive and will change after navigation
            const sourceShowId = id;
            console.log('🚀 Initiating rally from show:', sourceShowId, 'to show:', targetShowId);
            
            // Get current viewer count from state for accuracy
            const currentViewerCount = viewerCount || viewers?.length || 0;
            
            // Emit rally socket event first - this triggers viewers to move
            if (socket && socketIsConnected) {
              socket.emit('rally', {
                fromRoom: sourceShowId,
                toRoom: targetShowId,
                hostName: hostName,
                hostId: hostId,
                viewerCount: currentViewerCount
              });
              console.log('✅ Rally event emitted to move', currentViewerCount, 'viewers');
            } else {
              console.warn('⚠️ Socket not connected, rally may not work properly');
            }
            
            // Show toast immediately
            toast({
              title: "Rally Started!",
              description: `Sending ${currentViewerCount} viewer${currentViewerCount !== 1 ? 's' : ''} to the other show`,
            });
            
            // Send chat message to target show about the raid (via Firebase, not socket)
            try {
              await sendRoomMessage(
                targetShowId,
                `${hostName} has rallied for you with ${currentViewerCount} viewer${currentViewerCount !== 1 ? 's' : ''}! 🚀`,
                hostId,
                hostName,
                hostAvatar || '',
                []
              );
              console.log('✅ Rally chat message sent to target show');
            } catch (error) {
              console.error('Failed to send rally chat message:', error);
            }
            
            // End the current show after giving viewers time to receive the rally event
            setTimeout(async () => {
              try {
                // End the SOURCE show via API (using captured ID, not reactive `id`)
                console.log('🔴 Ending source show:', sourceShowId);
                await fetch(`/api/rooms/${sourceShowId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ ended: true })
                });
                console.log('✅ Source show ended via API:', sourceShowId);
                
                // Notify via socket
                if (socket) {
                  socket.emit('end-room', { roomId: sourceShowId });
                }
                
                // Disconnect LiveKit
                if (livekit?.disconnect) {
                  await livekit.disconnect();
                }
                setLivekitEnabled(false);
                
                // Leave the source room
                leaveRoom(sourceShowId);
                
                // Navigate host to the target show they're raiding
                console.log('🚀 Navigating host to target show:', targetShowId);
                navigate(`/show/${targetShowId}`);
              } catch (error) {
                console.error('Error ending show after raid:', error);
                toast({
                  title: "Error",
                  description: "Failed to end show properly. Please try again.",
                  variant: "destructive",
                });
              }
            }, 2000);
          }}
        />
    </>
  );
}
