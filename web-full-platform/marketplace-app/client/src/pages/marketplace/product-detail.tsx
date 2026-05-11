import { useState, useEffect, Suspense, lazy } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, MessageCircle, Shield, Flag, ChevronLeft, ChevronRight, ShoppingBag, ChevronDown, CreditCard, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateChat } from "@/lib/firebase-chat";

// Lazy load heavy dialog components
const BuyNowDialog = lazy(() => import('@/components/buy-now-dialog'));
const AddPaymentDialog = lazy(() => import('@/components/add-payment-dialog'));
const AddAddressDialog = lazy(() => import('@/components/add-address-dialog'));
const PaymentMethodListDialog = lazy(() => import('@/components/payment-method-list-dialog'));
const AddressListDialog = lazy(() => import('@/components/address-list-dialog'));
const MakeOfferDialog = lazy(() => import('@/components/make-offer-dialog'));

export default function ProductDetail() {
  const [, params] = useRoute("/product/:productId");
  const [, setLocation] = useLocation();
  const { user: currentUser, refreshUserData } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentListDialog, setShowPaymentListDialog] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showAddressListDialog, setShowAddressListDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showOptionDropdown, setShowOptionDropdown] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMakeOfferDialog, setShowMakeOfferDialog] = useState(false);
  const [offerPrice, setOfferPrice] = useState<number | null>(null);

  // Support both /product/:productId and /product?id=xxx URL patterns
  const queryParams = new URLSearchParams(window.location.search);
  const productId = params?.productId || queryParams.get('id');

  // Reset checkout view and offer price when product changes
  useEffect(() => {
    setShowCheckout(false);
    setOfferPrice(null);
  }, [productId]);

  // Fetch product details
  const shouldFetchProduct = Boolean(productId);
  const { data: product, isLoading } = useQuery<any>({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      return data.product || data;
    },
    enabled: shouldFetchProduct,
  });

  // NOTE: Shipping estimate moved to after defaultAddress is fetched (see below)

  // Use seller info from product data if populated, otherwise fetch separately
  const sellerFromProduct = product?.ownerId && typeof product.ownerId === 'object' ? product.ownerId : null;
  const sellerId = product?.ownerId?._id || product?.ownerId;
  
  const shouldFetchSeller = Boolean(sellerId && !sellerFromProduct);
  const { data: fetchedSeller } = useQuery<any>({
    queryKey: ['/api/profile', sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      const response = await fetch(`/api/profile/${sellerId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data || data;
    },
    enabled: shouldFetchSeller, // Only fetch if not already in product data
  });
  
  // Use seller data from product if available, otherwise use fetched data
  const seller = sellerFromProduct || fetchedSeller;

  const userId = (currentUser as any)?._id || (currentUser as any)?.id || currentUser?.id;

  // Refresh user data on mount to ensure we have fresh address/payment info for shipping
  useEffect(() => {
    if (userId && refreshUserData) {
      refreshUserData();
    }
  }, [userId]);

  // Always get from user context (localStorage) - never fetch
  const defaultPayment = currentUser?.defaultpaymentmethod || null;
  const defaultAddress = currentUser?.address || null;

  // Check if address has required fields for shipping calculation
  const hasValidAddress = defaultAddress && 
    defaultAddress.zipcode && 
    defaultAddress.state && 
    defaultAddress.city;

  // Fetch shipping estimate - only when we have a valid address
  const shouldFetchShipping = Boolean(product && productId && hasValidAddress && userId);
  const { data: shippingEstimate, isLoading: isLoadingShipping } = useQuery<any>({
    queryKey: ['/api/shipping/estimate', productId, hasValidAddress, userId],
    queryFn: async () => {
      if (!product || !userId) return null;
      try {
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
            weight: product.shipping_profile.weight,
            unit: product.shipping_profile.scale,
            product: productId,
            owner: product.ownerId?._id || product.ownerId,
            customer: userId,
            tokshow: product.tokshow?._id || product.tokshow || null,
            buying_label: false
          }),
        });
        if (!response.ok) return { error: true, amount: '0.00' };
        const data = await response.json();
        if (data?.success === false) {
          return { error: true, message: data.message, amount: '0.00' };
        }
        return data;
      } catch (error) {
        console.error('Failed to fetch shipping estimate:', error);
        return null;
      }
    },
    // Only fetch when we have product, productId, AND a valid address
    enabled: shouldFetchShipping,
    // Force refetch every time page is visited - no caching for shipping estimates
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: false,
  });

  // Fetch seller's other products - same API as profile Shop tab
  const shouldFetchSellerProducts = Boolean(sellerId);
  const { data: sellerProducts } = useQuery<any>({
    queryKey: ['/api/products', 'seller-products', sellerId, productId], // Unique key to avoid cache collision
    queryFn: async () => {
      if (!sellerId) return { products: [] };
      const params = new URLSearchParams({
        userid: sellerId,
        roomid: '',
        type: '',
        saletype: '',
        category: '',
        page: '1',
        limit: '50', // Get more products to show after filtering
        featured: 'true',
        status: 'active',
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) return { products: [] };
      return response.json();
    },
    enabled: shouldFetchSellerProducts,
  });

  // Referral discount logic - read from localStorage
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const hasReferralCredit = storedUser?.referredBy && storedUser?.awarded_referal_credit === false;
  const referredByUserId = storedUser?.referredBy || '';

  const { data: referralSettings } = useQuery({
    queryKey: ['referral-settings-for-checkout'],
    queryFn: async () => {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (!res.ok) return null;
      const result = await res.json();
      return result.data || result;
    },
    enabled: Boolean(showCheckout && hasReferralCredit),
    staleTime: 60000,
  });

  const referralCredit = referralSettings?.referal_credit || 15;
  const referralMinimum = referralSettings?.referral_credit_limit || 25;
  const referrerIdNorm = (referredByUserId || '').toString().trim().toLowerCase();
  const sellerIdNorm = (sellerId || '').toString().trim().toLowerCase();
  const isFromReferrer = hasReferralCredit && referrerIdNorm === sellerIdNorm;
  const inlineSubtotal = (offerPrice !== null ? offerPrice : (product?.price || 0)) * quantity;
  const inlineShippingCost = shippingEstimate ? (typeof shippingEstimate.amount === 'string' ? parseFloat(shippingEstimate.amount) : (shippingEstimate.amount || 0)) : 0;
  const referralDiscountApplies = isFromReferrer && inlineSubtotal >= referralMinimum;
  const referralDiscount = referralDiscountApplies ? Math.min(referralCredit, inlineSubtotal + inlineShippingCost) : 0;

  // Checkout mutation - place order OR create offer depending on offerPrice state
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Product not found");
      
      const productId = product._id || product.id;
      const shippingCost = parseFloat((shippingEstimate as any)?.amount || '0');
      // Use offer price if making an offer, otherwise use product price
      const priceToUse = offerPrice !== null ? offerPrice : (product.price || 0);
      const subtotal = priceToUse * quantity;
      const total = Math.max(0, subtotal + shippingCost - referralDiscount);
      
      // If making an offer, call the offers API
      if (offerPrice !== null) {
        const offerPayload: any = {
          product: productId,
          seller: sellerId,
          buyer: userId,
          quantity: quantity,
          subtotal: parseFloat(subtotal.toFixed(2)),
          shippingFee: parseFloat(shippingCost.toFixed(2)),
          tax: 0,
          bundleId: (shippingEstimate as any)?.bundleId || '',
          rate_id: (shippingEstimate as any)?.rate_id || '',
          servicelevel: (shippingEstimate as any)?.servicelevel?.name || (shippingEstimate as any)?.servicelevel || '',
          totalWeightOz: parseFloat((shippingEstimate as any)?.totalWeightOz || '0'),
          seller_shipping_fee_pay: parseFloat((shippingEstimate as any)?.seller_shipping_fee_pay || '0'),
        };
        
        // Only include tokshow if it has a value
        if (product.tokshow) {
          offerPayload.tokshow = product.tokshow;
        }
        
        const response = await apiRequest('POST', '/api/offers', offerPayload);
        const jsonData = await response.json();
        return { ...jsonData, isOffer: true };
      }
      
      // Regular checkout - create order
      const payload: any = {
        product: productId,
        seller: sellerId,
        buyer: userId,
        quantity: quantity,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingFee: parseFloat(shippingCost.toFixed(2)),
        tax: 0,
        total: parseFloat(total.toFixed(2)),
        color: '',
        size: '',
        bundleId: (shippingEstimate as any)?.bundleId || '',
        rate_id: (shippingEstimate as any)?.rate_id || '',
        servicelevel: (shippingEstimate as any)?.servicelevel?.name || (shippingEstimate as any)?.servicelevel || '',
        totalWeightOz: parseFloat((shippingEstimate as any)?.totalWeightOz || '0'),
        seller_shipping_fee_pay: parseFloat((shippingEstimate as any)?.seller_shipping_fee_pay || '0'),
        status: 'processing',
      };

      if (referralDiscount > 0) {
        payload.referralDiscount = parseFloat(referralDiscount.toFixed(2));
        payload.referredBy = referredByUserId;
      }
      
      // Only include tokshow if it has a value
      if (product.tokshow) {
        payload.tokshow = product.tokshow;
      }
      
      // Include carrierAccount from shipping estimate if available
      if ((shippingEstimate as any)?.carrierAccount) {
        payload.carrierAccount = (shippingEstimate as any).carrierAccount;
      }
      
      const response = await apiRequest('POST', `/api/orders/${productId}`, payload);
      const jsonData = await response.json();
      return jsonData;
    },
    onSuccess: (data: any) => {
      // Handle offer success differently from order success
      if (data?.isOffer) {
        console.log('Offer created, response:', data);
        toast({
          title: "Offer Sent!",
          description: "Your offer has been sent to the seller. You can track it in My Offers.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        setShowCheckout(false);
        setOfferPrice(null);
        // Stay on product page - don't navigate away
        return;
      }
      
      console.log('Order created, response:', data);
      // API returns { success: true, data: { newOrder: {...}, newItem: {...} } }
      const orderId = data?.data?.newOrder?._id || data?.newOrder?._id || data?.order?._id || data?._id;
      console.log('Extracted order ID:', orderId);
      
      toast({
        title: "Purchase Successful!",
        description: "Your order has been placed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setShowCheckout(false);
      
      // Always navigate to thank you page with order ID
      if (orderId) {
        console.log('Navigating to thank you page:', `/thank-you/${orderId}`);
        setLocation(`/thank-you/${orderId}`);
      } else {
        console.error('No order ID found in response, going to purchases');
        setLocation('/purchases');
      }
    },
    onError: (error: any) => {
      const isOffer = offerPrice !== null;
      toast({
        title: isOffer ? "Offer Failed" : "Purchase Failed",
        description: error?.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleMessageSeller = async () => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to message",
        variant: "destructive",
      });
      return;
    }

    // If owner, go to inbox (all messages)
    if (isOwner) {
      setLocation('/inbox');
      return;
    }

    // Otherwise, open chat with seller
    if (!seller) {
      toast({
        title: "Error",
        description: "Seller information not available",
        variant: "destructive",
      });
      return;
    }

    setMessagingLoading(true);
    try {
      const currentUserId = (currentUser as any)?._id || currentUser?.id;
      const chatId = await getOrCreateChat(currentUserId, sellerId);
      setLocation(`/inbox/${chatId}`);
    } catch (error) {
      toast({
        title: "Failed to open chat",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setMessagingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-40 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Product not found</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Extract images
  const images = product.images || [];
  const sellerName = seller?.firstName || seller?.userName || 'Seller';
  const sellerUsername = seller?.userName || 'user';
  
  // Use actual seller stats from product's userid object or fetched seller data
  const rating = seller?.averagereviews || seller?.rating;
  const reviewCount = seller?.reviewCount;
  const soldCount = seller?.soldCount;
  const following = seller?.following?.length || seller?.followingCount;
  const followers = seller?.followers?.length || seller?.followersCount;

  // Filter out the current product from seller's other products
  const otherProducts = sellerProducts?.products?.filter((p: any) => {
    const prodId = p._id || p.id;
    return prodId !== productId;
  }) || [];
  
  
  // Get shipping cost from estimate
  const shippingCost = shippingEstimate?.amount || shippingEstimate?.[0]?.amount || product.shipping_fee || null;
  
  // Check if current user is the owner
  const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id;
  const isOwner = currentUserId && currentUserId === sellerId;

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
          <h1 className="font-semibold truncate flex-1">{product.productName || 'Product'}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid md:grid-cols-2 gap-6">
        {/* Left Column - Images */}
        <div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4 relative">
            {images.length > 0 && images[selectedImageIndex] ? (
              <img
                src={images[selectedImageIndex]}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
              </div>
            )}
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
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === idx ? 'border-primary' : 'border-transparent'
                  }`}
                  data-testid={`thumbnail-${idx}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info or Checkout */}
        {!showCheckout ? (
        <div className="space-y-6">
          {/* Title & Price */}
          <div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-product-title">
              {product.productName || product.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span data-testid="text-quantity">
                {product.quantity > 0 ? `${product.quantity} Available` : 'Out of Stock'}
              </span>
              {product.condition && (
                <>
                  <span>•</span>
                  <span>{product.condition}</span>
                </>
              )}
            </div>
            <p className="text-3xl font-bold" data-testid="text-product-price">
              US${(product.price || 0).toFixed(2)}
              {shippingCost !== null && (
                <span className="text-sm text-muted-foreground font-normal">
                  {' '}+ US${(typeof shippingCost === 'string' ? parseFloat(shippingCost) : shippingCost).toFixed(2)} shipping + taxes
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed" 
              data-testid="button-buy-now"
              disabled={isOwner || (shouldFetchShipping && isLoadingShipping)}
              onClick={() => {
                if (!isOwner) {
                  setShowCheckout(true);
                }
              }}
            >
              {isOwner ? 'Your Product' : isLoadingShipping && shouldFetchShipping ? 'Loading...' : 'Buy Now'}
            </Button>
            
            {/* Make Offer Button - only show if product accepts offers and user is not owner */}
            {product.offer && !isOwner && (
              <Button 
                size="sm"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" 
                data-testid="button-make-offer"
                disabled={shouldFetchShipping && isLoadingShipping}
                onClick={() => setShowMakeOfferDialog(true)}
              >
                Make Offer
              </Button>
            )}
          </div>

          {/* Seller Info */}
          <Card className="overflow-hidden">
            <Link href={`/profile/${sellerId}`}>
              <div className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={seller?.profilePhoto} />
                    <AvatarFallback>{sellerName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-lg" data-testid="text-seller-name">{sellerUsername}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMessageSeller();
                  }}
                  disabled={messagingLoading}
                  data-testid="button-message-icon"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </Link>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 divide-x bg-muted/30">
              {rating !== undefined && rating !== null && (
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold mb-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    {rating.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
              )}
              {reviewCount !== undefined && reviewCount !== null && (
                <div className="p-4 text-center">
                  <p className="text-xl font-bold mb-1">{reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}K` : reviewCount}</p>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </div>
              )}
              {soldCount !== undefined && soldCount !== null && (
                <div className="p-4 text-center">
                  <p className="text-xl font-bold mb-1">{soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}K` : soldCount}</p>
                  <p className="text-sm text-muted-foreground">Sold</p>
                </div>
              )}
            </div>
          </Card>

          {/* Product Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Product Details</h3>
            <div className="space-y-2 text-sm">
              {product.condition && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condition</span>
                  <span className="font-medium" data-testid="text-condition">{product.condition}</span>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{typeof product.category === 'object' ? product.category.name : product.category}</span>
                </div>
              )}
              {product.productType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{product.productType}</span>
                </div>
              )}
            </div>
            {product.description && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground" data-testid="text-description">{product.description}</p>
              </div>
            )}
          </Card>

          {/* View Profile Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation(`/profile/${sellerId}`)}
            data-testid="button-view-profile"
          >
            View Profile
          </Button>

          {/* Buyer Protections */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Buyer Protections</h3>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{settings.app_name} Buyer Guarantee</p>
                <p className="text-sm text-muted-foreground">
                  Receive your purchase on time and as described or we'll make it right.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between text-sm">
            {product.createdAt && (
              <span className="text-muted-foreground">
                Created on {new Date(product.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            )}
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" data-testid="button-report">
              <Flag className="h-4 w-4 mr-1" />
              Report Listing
            </Button>
          </div>
        </div>
        ) : (
        <div className="space-y-4">
          {/* Product Header with Thumbnail */}
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[0]}
                  alt={product.productName || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base leading-tight mb-1 truncate" data-testid="text-product-title">
                {product.productName || product.name}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-quantity">
                {product.quantity > 0 ? `${product.quantity} available` : 'Out of stock'}
              </p>
            </div>
          </div>

          {/* Option Dropdown */}
          <div>
            <button
              onClick={() => setShowOptionDropdown(!showOptionDropdown)}
              className="w-full flex items-center justify-between py-3 px-0 text-left border-b"
              data-testid="button-option-dropdown"
            >
              <span className="text-sm font-medium">Option</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showOptionDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between py-3 px-0 border-b">
            <span className="text-sm font-medium">{offerPrice !== null ? 'Your Offer' : 'Price'}</span>
            <div className="flex items-center gap-2" data-testid="text-product-price">
              {offerPrice !== null ? (
                <>
                  <span className="text-muted-foreground line-through text-sm">
                    US${(product.price || 0).toFixed(2)}
                  </span>
                  <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                    US${offerPrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-semibold">
                  US${(product.price || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-b">
            <button
              onClick={() => {
                if (defaultPayment) {
                  setShowPaymentListDialog(true);
                } else {
                  setShowPaymentDialog(true);
                }
              }}
              className="w-full flex items-center justify-between py-3 px-0 text-left hover:bg-muted/50 transition-colors"
              data-testid="button-payment-method"
            >
              <span className="text-sm font-medium">Payment</span>
              <div className="flex items-center gap-2">
                {defaultPayment ? (
                  <>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{defaultPayment.brand} •••• {defaultPayment.last4}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Add payment</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </div>

          {/* Address */}
          <div className="border-b">
            <button
              onClick={() => {
                if (defaultAddress) {
                  setShowAddressListDialog(true);
                } else {
                  setShowAddressDialog(true);
                }
              }}
              className="w-full flex items-center justify-between py-3 px-0 text-left hover:bg-muted/50 transition-colors"
              data-testid="button-shipping-address"
            >
              <span className="text-sm font-medium">Address</span>
              <div className="flex items-center gap-2">
                {defaultAddress ? (
                  <>
                    <div className="text-right text-sm max-w-[200px]">
                      <div className="font-medium truncate">
                        {defaultAddress.name || 'User'}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {defaultAddress.city && `${defaultAddress.city}, `}
                        {defaultAddress.state} {defaultAddress.zipcode}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Add address</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">US${((offerPrice !== null ? offerPrice : (product.price || 0)) * quantity).toFixed(2)}</span>
            </div>
            {/* Only show shipping if user has a valid address */}
            {hasValidAddress && (
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                {isLoadingShipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : shippingEstimate?.error ? (
                  <span className="text-destructive text-xs">{shippingEstimate.message || 'Error'}</span>
                ) : shippingCost !== null ? (
                  <span className="font-medium">
                    US${(typeof shippingCost === 'string' ? parseFloat(shippingCost) : shippingCost).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-zinc-400 text-xs">Unavailable</span>
                )}
              </div>
            )}
            {referralDiscountApplies && (
              <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--primary))' }}>
                <span>Referral Credit</span>
                <span className="font-medium">-US${referralDiscount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span data-testid="text-total-price">
                US${Math.max(0,
                  (offerPrice !== null ? offerPrice : (product.price || 0)) * quantity + 
                  (shippingCost ? (typeof shippingCost === 'string' ? parseFloat(shippingCost) : shippingCost) : 0) -
                  referralDiscount
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCheckout(false);
                setOfferPrice(null);
              }}
              data-testid="button-checkout-back"
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isOwner || !defaultPayment || !defaultAddress || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
              data-testid="button-checkout"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                offerPrice !== null ? 'Make Offer' : 'Check out'
              )}
            </Button>
          </div>
        </div>
        )}
      </div>

      {/* More from Seller */}
      {otherProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <Separator className="mb-6" />
          <h2 className="text-xl font-bold mb-4">More from the Seller</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {otherProducts.slice(0, 15).map((p: any) => (
              <Link key={p._id} href={`/product/${p._id}`}>
                <div className="cursor-pointer group" data-testid={`related-product-${p._id}`}>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2 relative">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate" data-testid={`product-name-${p._id}`}>
                    {p.name || 'No Title'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    US${(p.price || 0).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Buy Now Dialog - Lazy loaded and only rendered when needed */}
      {showBuyNowDialog && (
        <Suspense fallback={<div />}>
          <BuyNowDialog
            open={showBuyNowDialog}
            onOpenChange={setShowBuyNowDialog}
            product={product}
            onOpenPaymentMethods={() => {
              setShowBuyNowDialog(false);
              if (defaultPayment) {
                setShowPaymentListDialog(true);
              } else {
                setShowPaymentDialog(true);
              }
            }}
            onOpenShippingAddresses={() => {
              setShowBuyNowDialog(false);
              if (defaultAddress) {
                setShowAddressListDialog(true);
              } else {
                setShowAddressDialog(true);
              }
            }}
          />
        </Suspense>
      )}

      {/* Payment Dialogs - Lazy loaded and only rendered when needed */}
      {showPaymentDialog && (
        <Suspense fallback={<div />}>
          <AddPaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            onSuccess={async () => {
              setShowPaymentDialog(false);
              // Invalidate cache and refetch to show the newly added card
              await queryClient.invalidateQueries({ queryKey: [`/api/users/paymentmethod/default/${userId}`] });
              await refreshUserData();
            }}
          />
        </Suspense>
      )}
      
      {showPaymentListDialog && (
        <Suspense fallback={<div />}>
          <PaymentMethodListDialog
            open={showPaymentListDialog}
            onOpenChange={async (open) => {
              setShowPaymentListDialog(open);
              // When closing dialog, always refresh payment data (in case cards were deleted)
              if (!open) {
                await queryClient.invalidateQueries({ queryKey: [`/api/users/paymentmethod/default/${userId}`] });
                await refreshUserData();
              }
            }}
            onSuccess={async () => {
              setShowPaymentListDialog(false);
              // Invalidate cache and refetch to show the newly selected card
              await queryClient.invalidateQueries({ queryKey: [`/api/users/paymentmethod/default/${userId}`] });
              await refreshUserData();
            }}
          />
        </Suspense>
      )}

      {/* Address Dialogs - Lazy loaded and only rendered when needed */}
      {showAddressDialog && (
        <Suspense fallback={<div />}>
          <AddAddressDialog
            open={showAddressDialog}
            onOpenChange={setShowAddressDialog}
            onSuccess={async () => {
              setShowAddressDialog(false);
              // Refetch address data to get new address
              await queryClient.invalidateQueries({ queryKey: [`/api/address/default/address/${userId}`] });
              await refreshUserData();
            }}
          />
        </Suspense>
      )}
      
      {showAddressListDialog && (
        <Suspense fallback={<div />}>
          <AddressListDialog
            open={showAddressListDialog}
            onOpenChange={async (open) => {
              setShowAddressListDialog(open);
              // When closing dialog, always refresh address data (in case addresses were deleted)
              if (!open) {
                await queryClient.invalidateQueries({ queryKey: [`/api/address/default/address/${userId}`] });
                await refreshUserData();
              }
            }}
            onSuccess={async () => {
              setShowAddressListDialog(false);
              // Refetch address data to get updated address
              await queryClient.invalidateQueries({ queryKey: [`/api/address/default/address/${userId}`] });
              await refreshUserData();
            }}
          />
        </Suspense>
      )}

      {/* Make Offer Dialog - Lazy loaded and only rendered when needed */}
      {showMakeOfferDialog && (
        <Suspense fallback={<div />}>
          <MakeOfferDialog
            open={showMakeOfferDialog}
            onOpenChange={setShowMakeOfferDialog}
            product={product}
            shippingEstimate={shippingEstimate}
            onContinueWithOffer={(price: number) => {
              setOfferPrice(price);
              setShowCheckout(true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
