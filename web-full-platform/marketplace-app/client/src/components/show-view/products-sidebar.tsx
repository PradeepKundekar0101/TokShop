import { useState } from "react";
import { X, Plus, Clock, Gift, Package, Tag, Loader2, ChevronDown, ChevronUp, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function ProductsSidebar(props: any) {
  const [expandedOfferProducts, setExpandedOfferProducts] = useState<Set<string>>(new Set());
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const {
    showMobileProducts, setShowMobileProducts, showTitle, productTab, setProductTab,
    auctionProducts, pinnedProduct, activeAuction, currentUserId, isShowOwner,
    handleProductAction, setBuyNowProduct, setShowBuyNowDialog, setPrebidAuction,
    setShowPrebidDialog, handleAddProduct, buyNowProducts, giveawayProducts,
    soldProducts, activeGiveaway, setSelectedProduct, giveaways, giveawayTimeLeft,
    soldOrders, setSelectedOrder, setShowOrderDetailDialog, shippingEstimate, id,
    offers, offersCount, onViewOffers, onAcceptOffer, onDeclineOffer, onCounterOffer,
    onMakeOffer, isOfferActionPending, pendingOfferId,
    activeFlashSale, flashSaleTimeLeft, handleEndFlashSale
  } = props;

  // Check if this product is the active flash sale product
  const isFlashSaleProduct = (productId: string) => {
    return activeFlashSale?.productId === productId;
  };
  
  // Calculate flash sale price dynamically based on discount settings
  const calculateFlashSalePrice = (product: any) => {
    if (!product.flash_sale || !product.price) return product.price;
    
    const discountType = product.flash_sale_discount_type || 'percentage';
    const discountValue = product.flash_sale_discount_value || 0;
    
    if (discountType === 'percentage') {
      return product.price * (1 - discountValue / 100);
    } else {
      return Math.max(0, product.price - discountValue);
    }
  };

  // Format flash sale time
  const formatFlashSaleTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  // Check if auction is actually running based on time
  const isAuctionRunning = activeAuction && activeAuction.endTime && Date.now() < activeAuction.endTime;

  return (
        <div className={`
          ${showMobileProducts ? 'fixed inset-0 z-50 bg-black' : 'hidden'}
          lg:flex lg:flex-col lg:relative lg:w-96 lg:z-auto
          bg-black border-r border-zinc-800 flex flex-col
        `} style={{ height: '90vh' }}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-white font-semibold">Products</h2>
            <button onClick={() => setShowMobileProducts(false)} data-testid="button-close-products">
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Show Title - Desktop Only */}
          <div className="hidden lg:block px-4 py-3 border-b border-zinc-800">
            <h2 className="text-white font-semibold text-base" data-testid="text-show-title-left">
              {showTitle}
            </h2>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 text-xs">
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Auction' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Auction')}
              data-testid="tab-auction"
            >
              Auction
            </button>
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Buy Now' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Buy Now')}
              data-testid="tab-buy-now"
            >
              Buy Now
            </button>
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Giveaways' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Giveaways')}
              data-testid="tab-giveaways"
            >
              Giveaways
            </button>
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Sold' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Sold')}
              data-testid="tab-sold"
            >
              Sold
            </button>
            {isShowOwner && (
              <button 
                className={`flex-1 px-2 py-2.5 relative ${productTab === 'Offers' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
                onClick={() => setProductTab('Offers')}
                data-testid="tab-offers"
              >
                Offers
                {offersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {offersCount > 99 ? '99+' : offersCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Tab Content - Fixed Height */}
          <div className="flex-1 relative min-h-0 overflow-hidden">
            {productTab === 'Auction' && (
              <>
                <div className="h-full overflow-y-auto pb-20">
                {/* Show pinned product first if it's an auction */}
                {pinnedProduct && pinnedProduct.listing_type === 'auction' && (
                  <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-900/50 relative" data-testid="product-pinned-auction">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 flex-shrink-0">
                        <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                          {pinnedProduct.images?.[0] && (
                            <img src={pinnedProduct.images[0]} alt={pinnedProduct.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Pinned</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white truncate">{pinnedProduct.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>{pinnedProduct.auction?.bids?.length || 0} bids</span>
                          <span>•</span>
                          <span className="text-white font-medium">${(pinnedProduct.auction?.baseprice || pinnedProduct.baseprice || pinnedProduct.price || 0).toFixed(2)}</span>
                          <span>•</span>
                          <span>{pinnedProduct.quantity || 1} left</span>
                        </div>
                        {isShowOwner && (
                          <Button 
                            size="sm"
                            className="mt-1 h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                            onClick={() => handleProductAction(pinnedProduct)}
                            data-testid="button-product-action-pinned-auction"
                          >
                            Product Actions
                          </Button>
                        )}
                      </div>
                      {!isShowOwner && (
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          onClick={async () => {
                            console.log('📦 Fetching prebid shipping for:', pinnedProduct.name);
                            setPrebidAuction({
                              ...pinnedProduct,
                              prebidShippingCost: undefined
                            });
                            setShowPrebidDialog(true);
                            
                            const payload = {
                              weight: pinnedProduct.shipping_profile?.weight,
                              unit: pinnedProduct.shipping_profile?.scale,
                              product: pinnedProduct._id || pinnedProduct.id,
                              update: false,
                              owner: pinnedProduct.ownerId?._id || pinnedProduct.ownerId || pinnedProduct.owner?._id || pinnedProduct.owner,
                              customer: currentUserId,
                              tokshow: id,
                              buying_label: false
                            };
                            
                            (() => {
                              const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
                              const tk = localStorage.getItem('accessToken');
                              if (tk) { hdrs['x-access-token'] = tk; hdrs['Authorization'] = `Bearer ${tk}`; }
                              const ud = localStorage.getItem('user');
                              if (ud) { hdrs['x-user-data'] = btoa(unescape(encodeURIComponent(ud))); }
                              return fetch('/api/shipping/estimate', {
                                method: 'POST',
                                headers: hdrs,
                                body: JSON.stringify(payload),
                                credentials: 'include'
                              });
                            })()
                              .then(res => res.json())
                              .then(data => {
                                if (data.amount) {
                                  setPrebidAuction({
                                    ...pinnedProduct,
                                    prebidShippingCost: parseFloat(data.amount)
                                  });
                                } else {
                                  setPrebidAuction({
                                    ...pinnedProduct,
                                    prebidShippingCost: null
                                  });
                                }
                              })
                              .catch(() => {
                                setPrebidAuction({
                                  ...pinnedProduct,
                                  prebidShippingCost: null
                                });
                              });
                          }}
                          data-testid="button-prebid-pinned"
                        >
                          Prebid
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {auctionProducts
                  .filter((product: any) => product._id !== pinnedProduct?._id)
                  .map((product: any, index: number) => {
                  // Only hide prebid button if this product's auction is the active auction AND it has started
                  const productAuctionId = product.auction?._id || product.auction?.id || product.auction;
                  const activeAuctionId = activeAuction?._id || activeAuction?.id;
                  const isActiveAuction = activeAuctionId === productAuctionId && activeAuction?.started === true;
                  // Check if user has a prebid (from product.prebids, not auction.bids)
                  const userPrebid = product.prebids?.find((prebid: any) => 
                    prebid.user?._id === currentUserId || 
                    prebid.user?.id === currentUserId ||
                    prebid.user === currentUserId
                  );
                  const userHasPrebid = !!userPrebid;
                  const userPrebidAmount = userPrebid?.autobidamount || userPrebid?.amount;
                  
                  // Calculate highest prebid from prebids array
                  const highestPrebid = product.prebids?.length > 0 
                    ? Math.max(...product.prebids.map((p: any) => p.autobidamount || p.amount || 0))
                    : null;
                  
                  return (
                    <div key={product._id || product.id || index} className="px-3 py-2 border-b border-zinc-700 relative" data-testid={`product-auction-${product._id || index}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 flex-shrink-0">
                          <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>{product.started ? (product.auction?.bids?.length || 0) : (product.prebids?.length || 0)} bids</span>
                            <span>•</span>
                            <span className="text-white font-medium">
                              ${highestPrebid !== null 
                                ? highestPrebid.toFixed(2) 
                                : (product.auction?.baseprice || product.baseprice || product.price || 0).toFixed(2)}
                            </span>
                            <span>•</span>
                            <span>{product.quantity || 1} left</span>
                          </div>
                          {!isShowOwner && userHasPrebid && !isActiveAuction && (
                            <p className="text-xs text-primary font-semibold" data-testid={`text-my-bid-${product._id || index}`}>
                              Your Prebid: ${userPrebidAmount?.toFixed(2) || '0.00'}
                            </p>
                          )}
                          {isShowOwner && (
                            <Button 
                              size="sm"
                              className="mt-1 h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                              onClick={() => handleProductAction(product)}
                              data-testid={`button-product-action-${product._id || index}`}
                            >
                              Product Actions
                            </Button>
                          )}
                        </div>
                        {!isShowOwner && !isActiveAuction && (
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                              onClick={() => {
                                console.log('📦 Fetching prebid shipping for:', product.name);
                                
                                // Open dialog immediately with loading state
                                setPrebidAuction({
                                  ...product,
                                  prebidShippingCost: undefined // undefined means loading
                                });
                                setShowPrebidDialog(true);
                                
                                const payload = {
                                  weight: product.shipping_profile?.weight,
                                  unit: product.shipping_profile?.scale,
                                  product: product._id || product.id,
                                  update: false,
                                  owner: product.ownerId?._id || product.ownerId || product.owner?._id || product.owner,
                                  customer: currentUserId,
                                  tokshow: id,
                                  buying_label: false
                                };
                                
                                (() => {
                                  const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
                                  const tk = localStorage.getItem('accessToken');
                                  if (tk) { hdrs['x-access-token'] = tk; hdrs['Authorization'] = `Bearer ${tk}`; }
                                  const ud = localStorage.getItem('user');
                                  if (ud) { hdrs['x-user-data'] = btoa(unescape(encodeURIComponent(ud))); }
                                  return fetch('/api/shipping/estimate', {
                                    method: 'POST',
                                    headers: hdrs,
                                    body: JSON.stringify(payload),
                                    credentials: 'include'
                                  });
                                })()
                                  .then(res => res.json())
                                  .then(data => {
                                    console.log('✅ Shipping estimate received:', data);
                                    if (data.amount) {
                                      setPrebidAuction({
                                        ...product,
                                        prebidShippingCost: parseFloat(data.amount)
                                      });
                                    } else {
                                      setPrebidAuction({
                                        ...product,
                                        prebidShippingCost: null // null means no shipping cost available
                                      });
                                    }
                                  })
                                  .catch(error => {
                                    console.error('❌ Shipping estimate error:', error);
                                    setPrebidAuction({
                                      ...product,
                                      prebidShippingCost: null
                                    });
                                  });
                              }}
                              data-testid={`button-prebid-${product._id || index}`}
                            >
                              Prebid
                            </Button>
                          )}
                      </div>
                    </div>
                  );
                })}
                {!activeAuction && auctionProducts.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No auction items
                  </div>
                )}
                </div>
                {isShowOwner && (
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
                    onClick={() => handleAddProduct('auction')}
                    data-testid="button-add-auction"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                )}
              </>
            )}
            
            {productTab === 'Buy Now' && (
              <>
                <div className="h-full overflow-y-auto pb-20">
                {/* Only show pinned product if it's NOT an auction */}
                {pinnedProduct && pinnedProduct.listing_type !== 'auction' && (
                  <div className="px-4 py-4 border-b border-zinc-700 relative bg-zinc-900/50" data-testid="product-pinned">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary text-primary-foreground text-xs">Pinned</Badge>
                          {pinnedProduct.flash_sale && (
                            <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">Flash Sale</Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{pinnedProduct.name}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{pinnedProduct.quantity || 0} Available</p>
                        {pinnedProduct.flash_sale && pinnedProduct.flash_sale_discount_value ? (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-zinc-500 line-through">${(pinnedProduct.price || 0).toFixed(2)}</span>
                            <span className="text-base font-semibold text-orange-500">${calculateFlashSalePrice(pinnedProduct).toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-400 mb-2">Price: ${(pinnedProduct.price || 0).toFixed(2)}</p>
                        )}
                        {!isShowOwner && !shippingEstimate?.error && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                              onClick={() => {
                                setBuyNowProduct(pinnedProduct);
                                setShowBuyNowDialog(true);
                              }}
                              data-testid="button-buy-now-pinned"
                            >
                              Buy Now
                            </Button>
                            {pinnedProduct.offer && (
                              <Button
                                size="sm"
                                className="bg-zinc-700 text-white hover:bg-zinc-600"
                                onClick={() => onMakeOffer?.(pinnedProduct)}
                                data-testid="button-make-offer-pinned"
                              >
                                Make Offer
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0">
                        <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                          {pinnedProduct.images?.[0] && (
                            <img src={pinnedProduct.images[0]} alt={pinnedProduct.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    </div>
                    {isShowOwner && !isFlashSaleProduct(pinnedProduct._id) && (
                      <Button 
                        size="sm"
                        className="mt-2 h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                        onClick={() => handleProductAction(pinnedProduct)}
                        data-testid="button-product-action-pinned"
                      >
                        Product Actions
                      </Button>
                    )}
                  </div>
                )}
                {buyNowProducts
                  .filter((product: any) => product._id !== pinnedProduct?._id)
                  .map((product: any, index: number) => (
                  <div key={product._id || product.id || index} className="px-4 py-4 border-b border-zinc-700 relative" data-testid={`product-buynow-${product._id || index}`}>
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white leading-tight">{product.name}</h3>
                          {product.flash_sale && (
                            <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">Flash Sale</Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 mb-1">{product.quantity || 1} Available</p>
                        {product.flash_sale && product.flash_sale_discount_value ? (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-zinc-500 line-through">${(product.price || 0).toFixed(2)}</span>
                            <span className="text-base font-semibold text-orange-500">${calculateFlashSalePrice(product).toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="text-base font-semibold text-white mb-2">Price: ${(product.price || 0).toFixed(2)}</p>
                        )}
                        {!isShowOwner && !shippingEstimate?.error && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                              onClick={() => {
                                setBuyNowProduct(product);
                                setShowBuyNowDialog(true);
                              }}
                              data-testid={`button-buy-now-${product._id || index}`}
                            >
                              Buy Now
                            </Button>
                            {product.offer && (
                              <Button
                                size="sm"
                                className="bg-zinc-700 text-white hover:bg-zinc-600"
                                onClick={() => onMakeOffer?.(product)}
                                data-testid={`button-make-offer-${product._id || index}`}
                              >
                                Make Offer
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0">
                        <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    </div>
                    {isShowOwner && !isFlashSaleProduct(product._id) && (
                      <Button 
                        size="sm"
                        className="mt-2 h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                        onClick={() => handleProductAction(product)}
                        data-testid={`button-product-action-${product._id || index}`}
                      >
                        Product Actions
                      </Button>
                    )}
                  </div>
                ))}
                {!pinnedProduct && buyNowProducts.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No buy now items
                  </div>
                )}
                </div>
                {isShowOwner && (
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
                    onClick={() => handleAddProduct('buy_now')}
                    data-testid="button-add-buy-now"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                )}
              </>
            )}
            
            {productTab === 'Giveaways' && (
              <>
                <div className="h-full overflow-y-auto pb-20">
                {activeGiveaway && (
                  <div className="px-4 py-4 border-b border-zinc-700 bg-zinc-900/50" data-testid="giveaway-active">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-primary text-primary-foreground text-xs">Active Giveaway</Badge>
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{activeGiveaway.name || 'Giveaway'}{activeGiveaway.reference ? ` #${activeGiveaway.reference}` : ''}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{activeGiveaway.participants?.length || 0} participants</p>
                        {!activeGiveaway.ended && giveawayTimeLeft > 0 && (
                          <p className="text-sm text-zinc-400">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {Math.floor(giveawayTimeLeft / 60)}:{(giveawayTimeLeft % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0">
                        <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center">
                          <Gift className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {giveaways.filter((g: any) => g._id !== activeGiveaway?._id).map((giveaway: any, index: number) => (
                  <div key={giveaway._id || giveaway.id || index} className="px-4 py-4 border-b border-zinc-700 relative" data-testid={`giveaway-${giveaway._id || index}`}>
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{giveaway.name || 'Giveaway'}{giveaway.reference ? ` #${giveaway.reference}` : ''}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{giveaway.participants?.length || 0} participants</p>
                        {giveaway.winner && (
                          <p className="text-sm text-green-400">Winner: {giveaway.winner.userName || 'Someone'}</p>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0">
                        <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center">
                          <Gift className="h-10 w-10 text-zinc-600" />
                        </div>
                      </div>
                    </div>
                    {isShowOwner && (
                      <Button 
                        size="sm"
                        className="mt-2 h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                        onClick={() => handleProductAction(giveaway)}
                        data-testid={`button-product-action-${giveaway._id || index}`}
                      >
                        Product Actions
                      </Button>
                    )}
                  </div>
                ))}
                {!activeGiveaway && giveaways.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No giveaways
                  </div>
                )}
                </div>
                {isShowOwner && (
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
                    onClick={() => handleAddProduct('giveaway')}
                    data-testid="button-add-giveaway"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                )}
              </>
            )}
            
            {productTab === 'Sold' && (
              <div className="h-full overflow-y-auto pb-20">
                {soldOrders.map((order: any, index: number) => {
                  const isGiveaway = !!order.giveaway;
                  
                  // For giveaway orders, use order.giveaway
                  // For regular orders, use order.items array
                  let product, productName, productImage, orderPrice, quantity;
                  
                  if (isGiveaway) {
                    product = order.giveaway;
                    const baseName = product?.name || product?.title || 'Giveaway Item';
                    const orderRef = order.order_reference || order.invoice || order._id?.slice(-8) || '';
                    productName = orderRef ? `${baseName} ${orderRef}` : baseName;
                    productImage = product?.images?.[0] || product?.image;
                    orderPrice = 0; // Giveaways are free
                    quantity = order.quantity || product?.quantity || 1;
                  } else {
                    // Regular order with items array
                    const firstItem = order.items?.[0];
                    product = firstItem?.productId || firstItem;
                    const baseName = product?.name || product?.title || 'Item';
                    const orderRef = firstItem?.order_reference || order.order_reference || '';
                    productName = orderRef ? `${baseName} ${orderRef}` : baseName;
                    productImage = product?.images?.[0] || product?.image;
                    orderPrice = order.total || order.price || (firstItem?.price * (firstItem?.quantity || 1)) || 0;
                    quantity = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1;
                  }
                  
                  const customerDisplay = order.customer?.userName 
                    ? `@${order.customer.userName}` 
                    : order.customer?.email || 'Customer';
                  
                  return (
                    <div key={order._id || order.id || index} className="px-4 py-4 border-b border-zinc-700" data-testid={`order-sold-${order._id || index}`}>
                      <div className="flex gap-3 items-center">
                        <div className="w-16 h-16 flex-shrink-0">
                          <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                            {productImage ? (
                              <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-zinc-600" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white mb-0.5 leading-tight truncate">{productName}</h3>
                          <p className="text-xs text-primary font-medium mb-1 truncate">{customerDisplay}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isGiveaway ? (
                              <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
                                Giveaway
                              </Badge>
                            ) : (
                              <p className="text-sm font-bold text-white">${(orderPrice || 0).toFixed(2)}</p>
                            )}
                            <span className="text-xs text-zinc-500">•</span>
                            <p className="text-xs text-zinc-400">Qty: {quantity}</p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-zinc-800 h-8 px-3"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetailDialog(true);
                          }}
                          data-testid={`button-view-order-${order._id || index}`}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {soldOrders.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No sold items yet
                  </div>
                )}
                </div>
            )}

            {productTab === 'Offers' && isShowOwner && (
              <div className="h-full overflow-y-auto pb-20">
                {offers && offers.length > 0 ? (
                  <>
                    {/* Group offers by product */}
                    {(() => {
                      const productOffers: Record<string, { product: any; offers: any[] }> = {};
                      offers.forEach((offer: any) => {
                        const productId = offer.product?._id || offer.productId;
                        if (!productOffers[productId]) {
                          productOffers[productId] = {
                            product: offer.product || { _id: productId, name: 'Unknown Product' },
                            offers: []
                          };
                        }
                        productOffers[productId].offers.push(offer);
                      });

                      const toggleProductExpanded = (productId: string) => {
                        setExpandedOfferProducts(prev => {
                          const next = new Set(prev);
                          if (next.has(productId)) {
                            next.delete(productId);
                          } else {
                            next.add(productId);
                          }
                          return next;
                        });
                      };

                      return Object.entries(productOffers).map(([productId, data]) => {
                        const { product, offers: productOffersList } = data;
                        const pendingOffers = productOffersList.filter((o: any) => o.status === 'pending');
                        const counteredOffers = productOffersList.filter((o: any) => o.status === 'countered');
                        const highestOffer = pendingOffers.reduce((max: any, o: any) => {
                          const offerAmt = o.offeredPrice || o.offerAmount || 0;
                          const maxAmt = max ? (max.offeredPrice || max.offerAmount || 0) : 0;
                          return offerAmt > maxAmt ? o : max;
                        }, null);
                        const isExpanded = expandedOfferProducts.has(productId);
                        
                        return (
                          <div key={productId} className="border-b border-zinc-700" data-testid={`offer-product-${productId}`}>
                            {/* Product Header - Clickable to expand */}
                            <button
                              className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors text-left"
                              onClick={() => toggleProductExpanded(productId)}
                              data-testid={`button-toggle-offers-${productId}`}
                            >
                              <div className="flex gap-3">
                                <div className="w-14 h-14 flex-shrink-0">
                                  <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                                    {product.images?.[0] ? (
                                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Tag className="h-5 w-5 text-zinc-600" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                                  <p className="text-xs text-zinc-400">Listed: ${(product.price || 0).toFixed(2)}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {pendingOffers.length > 0 && (
                                      <Badge className="bg-primary/20 text-primary text-[10px]">
                                        {pendingOffers.length} pending
                                      </Badge>
                                    )}
                                    {counteredOffers.length > 0 && (
                                      <Badge className="bg-secondary/20 text-secondary text-[10px]">
                                        {counteredOffers.length} countered
                                      </Badge>
                                    )}
                                    {highestOffer && (
                                      <span className="text-xs text-success">
                                        Highest: ${(highestOffer.offeredPrice || highestOffer.offerAmount || 0).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-zinc-400" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Individual Offers - Collapsible */}
                            {isExpanded && (
                              <div className="bg-zinc-900/20">
                                {productOffersList.map((offer: any, idx: number) => (
                                  <div 
                                    key={offer._id || idx} 
                                    className={`px-4 py-3 border-t border-zinc-800 ${offer.status !== 'pending' ? 'opacity-60' : ''}`}
                                    data-testid={`offer-item-${offer._id || idx}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                          <AvatarImage src={offer.buyer?.profilePhoto} alt={offer.buyer?.userName || 'User'} />
                                          <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                                            <User className="h-4 w-4" />
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">
                                              ${(offer.offeredPrice || offer.offerAmount || 0).toFixed(2)}
                                            </span>
                                            {product.price > 0 && (
                                              <span className="text-xs text-zinc-500">
                                                ({Math.round((1 - (offer.offeredPrice || offer.offerAmount || 0) / product.price) * 100)}% off)
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-zinc-400 truncate">
                                            by @{offer.buyer?.userName || offer.buyer?.firstName || 'User'}
                                          </p>
                                          {offer.status !== 'pending' && (
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge 
                                                className={`text-[10px] ${
                                                  offer.status === 'accepted' ? 'bg-success text-white' :
                                                  offer.status === 'declined' ? 'bg-destructive text-destructive-foreground' :
                                                  offer.status === 'countered' ? 'bg-secondary text-secondary-foreground' :
                                                  'bg-muted text-muted-foreground'
                                                }`}
                                              >
                                                {offer.status}
                                              </Badge>
                                              {offer.status === 'countered' && offer.counterPrice && (
                                                <span className="text-xs text-secondary">
                                                  Your counter offer: ${offer.counterPrice.toFixed(2)}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {offer.status === 'pending' && (
                                        <div className="flex gap-1">
                                          {isOfferActionPending && pendingOfferId === offer._id ? (
                                            <div className="flex items-center gap-2 px-2">
                                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                              <span className="text-xs text-zinc-400">Processing...</span>
                                            </div>
                                          ) : (
                                            <>
                                              <Button
                                                size="sm"
                                                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onAcceptOffer?.(offer);
                                                }}
                                                disabled={isOfferActionPending}
                                                data-testid={`button-accept-offer-${offer._id || idx}`}
                                              >
                                                Accept
                                              </Button>
                                              <Button
                                                size="sm"
                                                className="h-7 px-2 text-xs bg-zinc-700 text-white hover:bg-zinc-600 border-0"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onCounterOffer?.(offer);
                                                }}
                                                disabled={isOfferActionPending}
                                                data-testid={`button-counter-offer-${offer._id || idx}`}
                                              >
                                                Counter
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-800"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onDeclineOffer?.(offer);
                                                }}
                                                disabled={isOfferActionPending}
                                                data-testid={`button-decline-offer-${offer._id || idx}`}
                                              >
                                                Decline
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </>
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No offers yet</p>
                    <p className="text-xs mt-1">Offers from buyers will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

  );
}
