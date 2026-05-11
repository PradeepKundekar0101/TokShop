import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  MapPin, 
  Plus, 
  Minus, 
  ChevronRight,
  Loader2,
  AlertTriangle,
  Zap,
  Gift
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  shippingEstimate?: any;
  onOpenPaymentMethods?: () => void;
  onOpenShippingAddresses?: () => void;
  offerPrice?: number | null;
  isFlashSale?: boolean;
  flashSalePrice?: number;
}

export function BuyNowDialog({ 
  open, 
  onOpenChange, 
  product,
  shippingEstimate: passedShippingEstimate,
  onOpenPaymentMethods,
  onOpenShippingAddresses,
  offerPrice,
  isFlashSale = false,
  flashSalePrice
}: BuyNowDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isQuantityExpanded, setIsQuantityExpanded] = useState(false);

  const availableStock = product?.quantity || 1;
  const showQuantityControls = availableStock > 1;

  const userId = (user as any)?._id || (user as any)?.id || user?.id;

  // Always get from user context (localStorage) - never fetch
  const defaultPayment = user?.defaultpaymentmethod || null;
  const defaultAddress = user?.address || null;

  // Check if address has required fields for shipping calculation
  const hasValidAddress = defaultAddress && 
    defaultAddress.zipcode && 
    defaultAddress.state && 
    defaultAddress.city;

  // Debug logging
  console.log('🚢 BUY NOW DIALOG - Query conditions:', {
    open,
    hasShippingProfile: !!product?.shipping_profile,
    hasWeight: !!product?.shipping_profile?.weight,
    weight: product?.shipping_profile?.weight,
    hasDefaultAddress: !!defaultAddress,
    hasValidAddress,
    hasUser: !!user,
    defaultAddress,
    userAddress: user?.address,
    willQueryRun: open && !!product?.shipping_profile?.weight && hasValidAddress && !!user
  });

  // Always fetch shipping estimate when dialog opens to get latest data with totalWeightOz
  const shouldFetchShippingEstimate = Boolean(open && product?.shipping_profile?.weight && hasValidAddress && user);
  const { data: fetchedShippingEstimate, isLoading: isLoadingShipping, error: shippingError } = useQuery({
    queryKey: ['/api/shipping/estimate', product?._id, quantity, defaultAddress?.id],
    queryFn: async () => {
      if (!product?.shipping_profile || !defaultAddress) {
        return { amount: '0.00' };
      }

      const userId = (user as any)?._id || (user as any)?.id || user?.id;
      const productId = product._id || product.id;
      
      // Extract owner ID - could be object or string
      let ownerId = '';
      if (typeof product.owner === 'string') {
        ownerId = product.owner;
      } else if (product.owner) {
        ownerId = product.owner._id || product.owner.id || '';
      }
      // Fallback: try to get from ownerId field directly
      if (!ownerId && product.ownerId) {
        ownerId = typeof product.ownerId === 'string' 
          ? product.ownerId 
          : (product.ownerId._id || product.ownerId.id || '');
      }
      
      try {
        const res = await apiRequest('POST', '/api/shipping/estimate', {
          weight: product.shipping_profile.weight,
          unit: product.shipping_profile.scale || 'oz',
          product: productId,
          owner: ownerId,
          customer: userId,
          tokshow: product.tokshow,
          buying_label: false
        });
        
        const response = await res.json();
        
        // Check if API returned an error (unshippable address)
        if (response?.success === false && response?.message) {
          return {
            error: true,
            message: response.message,
            amount: '0.00'
          };
        }
        
        // Check if response has an error field
        if (response?.error) {
          return {
            error: true,
            message: response.error,
            amount: '0.00'
          };
        }
        
        return response;
      } catch (error: any) {
        console.error('Shipping estimate error:', error);
        // Return error object instead of throwing
        return {
          error: true,
          message: 'Unable to calculate shipping. Please try again.',
          amount: '0.00'
        };
      }
    },
    // Only fetch shipping estimate when we have a valid address with required fields
    enabled: shouldFetchShippingEstimate,
    // Force refetch every time dialog opens - no caching for shipping estimates
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    // Don't retry on error - just show error message
    retry: false,
  });

  // Use fetched estimate if available, otherwise fallback to passed estimate
  const shippingEstimate = (fetchedShippingEstimate && Object.keys(fetchedShippingEstimate).length > 0) 
    ? fetchedShippingEstimate 
    : passedShippingEstimate;
  
  // Log shipping estimate source
  console.log('🚢 BUY NOW DIALOG - passedShippingEstimate:', passedShippingEstimate);
  console.log('🚢 BUY NOW DIALOG - fetchedShippingEstimate:', fetchedShippingEstimate);
  console.log('🚢 BUY NOW DIALOG - isLoadingShipping:', isLoadingShipping);
  console.log('🚢 BUY NOW DIALOG - final shippingEstimate:', shippingEstimate);

  // Fetch tax estimate
  const shouldFetchTax = Boolean(open && product?.id);
  const { data: taxEstimate, isLoading: isLoadingTax } = useQuery({
    queryKey: ['/api/tax/estimate', product?.id, quantity],
    enabled: shouldFetchTax,
  });

  // Read referral data from localStorage user data
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const hasReferralCredit = storedUser?.referredBy && storedUser?.awarded_referal_credit === false;
  const referredByUserId = storedUser?.referredBy || '';

  // Fetch referral settings for credit amount and minimum
  const { data: referralSettings } = useQuery({
    queryKey: ['referral-settings-for-checkout'],
    queryFn: async () => {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (!res.ok) return null;
      const result = await res.json();
      return result.data || result;
    },
    enabled: Boolean(open && hasReferralCredit),
    staleTime: 60000,
  });

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setIsQuantityExpanded(false);
    }
  }, [open]);

  const incrementQuantity = () => {
    if (quantity < availableStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Use offerPrice if provided, flash sale price if active, otherwise use product price
  const unitPrice = offerPrice ?? (isFlashSale && flashSalePrice ? flashSalePrice : product?.price) ?? 0;
  const originalPrice = product?.price ?? 0;
  const subtotal = unitPrice * quantity;
  const hasShippingError = (shippingEstimate as any)?.error === true;
  const shippingErrorMessage = (shippingEstimate as any)?.message || '';
  const shippingCost = hasShippingError ? 0 : parseFloat((shippingEstimate as any)?.amount || '0');
  const taxAmount = parseFloat((taxEstimate as any)?.tax || '0');

  // Referral credit logic
  const referralCredit = referralSettings?.referral_credit ?? 15;
  const referralMinimum = referralSettings?.referral_credit_limit ?? 25;
  const sellerId = (() => {
    if (typeof product?.owner === 'string') return product.owner;
    if (product?.owner) return product.owner._id || product.owner.id || '';
    if (product?.ownerId) return typeof product.ownerId === 'string' ? product.ownerId : (product.ownerId._id || product.ownerId.id || '');
    return '';
  })();
  const referrerIdNorm = String(referredByUserId || '').trim();
  const sellerIdNorm = String(sellerId || '').trim();
  const isFromReferrer = hasReferralCredit && referrerIdNorm && sellerIdNorm && referrerIdNorm === sellerIdNorm;
  const referralDiscountApplies = isFromReferrer && subtotal >= referralMinimum;

  const referralDiscount = referralDiscountApplies ? Math.min(referralCredit, subtotal + shippingCost + taxAmount) : 0;

  if (open) {
    console.log('[BuyNow Referral Debug]', {
      storedReferredBy: storedUser?.referredBy,
      storedAwardedCredit: storedUser?.awarded_referal_credit,
      hasReferralCredit,
      referrerIdNorm,
      sellerIdNorm,
      sellerId,
      productOwner: product?.owner,
      productOwnerId: product?.ownerId,
      isFromReferrer,
      subtotal,
      referralMinimum,
      referralDiscountApplies,
      referralDiscount
    });
  }

  const total = Math.max(0, subtotal + shippingCost + taxAmount - referralDiscount);

  const buyNowMutation = useMutation({
    mutationFn: async () => {
      // Build payload matching Flutter implementation
      const productId = product._id || product.id;
      
      // Extract seller/owner ID - could be object or string
      let sellerId = '';
      if (typeof product.owner === 'string') {
        sellerId = product.owner;
      } else if (product.owner) {
        sellerId = product.owner._id || product.owner.id || '';
      }
      // Fallback: try to get from ownerId field directly
      if (!sellerId && product.ownerId) {
        sellerId = typeof product.ownerId === 'string' 
          ? product.ownerId 
          : (product.ownerId._id || product.ownerId.id || '');
      }
      
      // Log shipping estimate data
      console.log('🚢 BUY NOW DIALOG - shippingEstimate:', shippingEstimate);
      console.log('🚢 BUY NOW DIALOG - shippingEstimate.totalWeightOz:', (shippingEstimate as any)?.totalWeightOz);
      console.log('🚢 BUY NOW DIALOG - shippingEstimate.carrierAccount:', (shippingEstimate as any)?.carrierAccount);
      
      // If offerPrice is set, create an OFFER instead of an order
      if (offerPrice !== null && offerPrice !== undefined) {
        const offerPayload: any = {
          offeredPrice: offerPrice,
          product: productId,
          seller: sellerId,
          buyer: userId,
          quantity: quantity,
          subtotal: parseFloat(subtotal.toFixed(2)),
          shippingFee: parseFloat((shippingEstimate as any)?.amount || '0'),
          tax: parseFloat(taxAmount.toString() || '0'),
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
        
        console.log('📦 BUY NOW DIALOG - Creating OFFER with payload:', JSON.stringify(offerPayload, null, 2));
        
        const response = await apiRequest('POST', '/api/offers', offerPayload);
        const jsonData = await response.json();
        return { ...jsonData, isOffer: true };
      }
      
      // Regular checkout - create order
      // Determine ordertype based on context
      const ordertype = product.tokshow ? 'tokshow' : 'marketplace';
      
      const payload: any = {
        product: productId,
        status: 'processing',
        shippingFee: parseFloat((shippingEstimate as any)?.amount || '0'),
        servicelevel: (shippingEstimate as any)?.servicelevel?.name || (shippingEstimate as any)?.servicelevel || '',
        rate_id: (shippingEstimate as any)?.rate_id || '',
        bundleId: (shippingEstimate as any)?.bundleId || '',
        totalWeightOz: parseFloat((shippingEstimate as any)?.totalWeightOz || '0'),
        seller_shipping_fee_pay: parseFloat((shippingEstimate as any)?.seller_shipping_fee_pay || '0'),
        carrierAccount: (shippingEstimate as any)?.carrierAccount || '',
        subtotal: subtotal,
        tax: parseFloat(taxAmount.toString() || '0'),
        seller: sellerId,
        buyer: userId,
        quantity: quantity,
        total: parseFloat(total.toFixed(2)),
        color: '',
        size: '',
        tokshow: product.tokshow || '',
        ordertype: ordertype,
      };
      
      // Add flash_sale flag if this is a flash sale purchase
      if (isFlashSale) {
        payload.flash_sale = true;
      }
      
      // Add referral discount if applicable
      if (referralDiscountApplies) {
        payload.referralDiscount = referralDiscount;
        payload.referralCredit = true;
      }
      
      console.log('📦 BUY NOW DIALOG - Full payload before sending:', JSON.stringify(payload, null, 2));
      
      // POST to /api/orders/:id endpoint (matching Flutter)
      return await apiRequest('POST', `/api/orders/${productId}`, payload);
    },
    onSuccess: (response: any) => {
      // Handle offer success differently from order success
      if (response?.isOffer) {
        console.log('Offer created, response:', response);
        toast({
          title: "Offer Sent!",
          description: "Your offer has been sent to the seller. You can track it in My Offers.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
        onOpenChange(false);
        return;
      }
      
      toast({
        title: "Purchase Successful!",
        description: "Your order has been placed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.error || error?.message || "Failed to complete purchase";
      toast({
        title: offerPrice ? "Offer Failed" : "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = () => {
    // Validation checks matching Flutter
    if (!defaultPayment) {
      toast({
        title: "No Payment Method",
        description: "Please add a payment method first",
        variant: "destructive",
      });
      return;
    }
    if (!defaultAddress) {
      toast({
        title: "No Address",
        description: "Please add a shipping address first",
        variant: "destructive",
      });
      return;
    }
    if (quantity > availableStock) {
      toast({
        title: "Quantity Error",
        description: "Quantity exceeds available stock",
        variant: "destructive",
      });
      return;
    }
    buyNowMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className={`text-xl ${isFlashSale ? 'text-yellow-500 flex items-center gap-2' : 'text-white'}`}>
            {isFlashSale && <Zap className="h-5 w-5 animate-pulse" />}
            {isFlashSale ? 'Flash Sale Purchase!' : 'Buy Now'}
          </DialogTitle>
        </DialogHeader>

        {/* Flash Sale Banner */}
        {isFlashSale && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mt-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-500 font-semibold text-sm">Limited Time Flash Sale!</span>
            </div>
            <p className="text-zinc-400 text-xs mt-1">
              {originalPrice > 0 && unitPrice < originalPrice 
                ? `You're getting ${Math.round((1 - unitPrice / originalPrice) * 100)}% off the original price`
                : 'Special flash sale pricing!'}
            </p>
          </div>
        )}

        <div className="space-y-4 mt-4">
          {/* Product Section */}
          <div className="flex gap-4">
            {product?.images?.[0] && (
              <div className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden ${isFlashSale ? 'ring-2 ring-yellow-500' : 'bg-zinc-800'}`}>
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-base leading-tight mb-1">{product?.name}</h3>
              {referralDiscountApplies && (
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-zinc-400 line-through">${originalPrice.toFixed(2)}</span>
                  <span className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>${(originalPrice - referralDiscount).toFixed(2)}</span>
                </div>
              )}
              {availableStock > 0 && (
                <p className="text-sm text-zinc-400">{availableStock} available</p>
              )}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Quantity Section */}
          {showQuantityControls && (
            <>
              <div>
                <button
                  onClick={() => setIsQuantityExpanded(!isQuantityExpanded)}
                  className="w-full flex items-center justify-between py-2 text-sm"
                  data-testid="button-toggle-quantity"
                >
                  <span className="font-medium">Quantity: {quantity}</span>
                  <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform ${isQuantityExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isQuantityExpanded && (
                  <div className="flex items-center gap-4 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      data-testid="button-decrement-quantity"
                    >
                      <Minus className="h-4 w-4" style={{ color: 'white', stroke: 'white' }} />
                    </Button>
                    <div className="flex-1 text-center">
                      <span className="text-lg font-bold">{quantity}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                      onClick={incrementQuantity}
                      disabled={quantity >= availableStock}
                      data-testid="button-increment-quantity"
                    >
                      <Plus className="h-4 w-4" style={{ color: 'white', stroke: 'white' }} />
                    </Button>
                  </div>
                )}
              </div>
              <Separator className="bg-zinc-800" />
            </>
          )}

          {/* Payment Method */}
          <div>
            <p className="text-sm font-semibold mb-2">Payment Method</p>
            <button
              onClick={onOpenPaymentMethods}
              className="w-full flex items-center justify-between py-3 hover:bg-zinc-800/50 rounded-lg px-2 transition-colors"
              data-testid="button-payment-method"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-zinc-400" />
                {defaultPayment ? (
                  <div className="text-left">
                    <p className="text-sm">{defaultPayment.brand?.toUpperCase()} •••• {defaultPayment.last4}</p>
                    {defaultPayment.exp_month && defaultPayment.exp_year && (
                      <p className="text-xs text-zinc-400">
                        Expires {String(defaultPayment.exp_month).padStart(2, '0')}/{defaultPayment.exp_year}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">Add payment method</span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Shipping Address */}
          <div>
            <p className="text-sm font-semibold mb-2">Shipping Address</p>
            <button
              onClick={onOpenShippingAddresses}
              className="w-full flex items-center justify-between py-3 hover:bg-zinc-800/50 rounded-lg px-2 transition-colors"
              data-testid="button-shipping-address"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-zinc-400" />
                {defaultAddress ? (
                  <div className="text-left">
                    <p className="text-sm">
                      {(defaultAddress as any)?.addrress1 || (defaultAddress as any)?.address1 || 'Address on file'}
                      {defaultAddress.city && `, ${defaultAddress.city}`}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {defaultAddress.state && `${defaultAddress.state} `}
                      {defaultAddress.zipcode}
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">Add shipping address</span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Offer Disclaimer */}
          {offerPrice && (
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                You won't be charged until the seller accepts your offer.
              </p>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="space-y-2 bg-zinc-800/30 p-4 rounded-lg">
            {offerPrice && (
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-600 text-white text-xs">Offer Price</Badge>
                <span className="text-xs text-zinc-400 line-through">${(product?.price || 0).toFixed(2)}</span>
                <span className="text-xs text-green-400 font-medium">${offerPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">{offerPrice ? 'Your Offer' : 'Subtotal'}</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {/* Only show shipping if user has a valid address */}
            {hasValidAddress && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Shipping</span>
                {isLoadingShipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasShippingError ? (
                  <span className="text-destructive text-xs font-semibold">Error</span>
                ) : (
                  <span className="font-medium">${shippingCost.toFixed(2)}</span>
                )}
              </div>
            )}
            {/* Only show tax if there is a tax amount */}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Tax</span>
                {isLoadingTax ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                )}
              </div>
            )}
            {referralDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-primary flex items-center gap-1">
                  <Gift className="h-3 w-3" /> Referral Credit
                </span>
                <span className="font-medium text-primary">-${referralDiscount.toFixed(2)}</span>
              </div>
            )}
            <Separator className="bg-zinc-700 my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping Error Message */}
          {hasShippingError && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {shippingErrorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Buy Now Button - Hide when shipping error */}
          {!hasShippingError && (
            <Button
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleBuyNow}
              disabled={buyNowMutation.isPending || !defaultPayment || !defaultAddress || isLoadingShipping}
              data-testid="button-confirm-buy-now"
            >
              {buyNowMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {offerPrice ? 'Submitting Offer...' : 'Processing...'}
                </>
              ) : isLoadingShipping ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calculating shipping...
                </>
              ) : offerPrice ? (
                `Submit Offer - $${total.toFixed(2)}`
              ) : (
                `Buy Now - $${total.toFixed(2)}`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add default export for lazy loading compatibility
export default BuyNowDialog;
