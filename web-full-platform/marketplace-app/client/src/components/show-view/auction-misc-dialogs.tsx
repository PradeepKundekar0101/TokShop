import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertTriangle, Package } from 'lucide-react';
import { ShareDialog } from '@/components/share-dialog';

interface AuctionMiscDialogsProps {
  // Auction Settings Dialog
  showAuctionSettingsDialog: boolean;
  setShowAuctionSettingsDialog: (show: boolean) => void;
  auctionSettings: any;
  setAuctionSettings: any;
  handleStartAuctionWithSettings: () => void;
  
  // Share Dialog
  showShareDialog: boolean;
  setShowShareDialog: (show: boolean) => void;
  showTitle: string;
  id: string;
  
  // Prebid Dialog
  showPrebidDialog: boolean;
  setShowPrebidDialog: (show: boolean) => void;
  prebidAuction: any;
  setPrebidAuction: (auction: any) => void;
  prebidAmount: string;
  setPrebidAmount: (amount: string) => void;
  prebidMutation: any;
  toast: any;
  currentUserId?: string;
  
  // Order Detail Dialog
  showOrderDetailDialog: boolean;
  setShowOrderDetailDialog: (show: boolean) => void;
  selectedOrder: any;
  orderItemsPage: number;
  setOrderItemsPage: (page: number) => void;
}

export function AuctionMiscDialogs(props: AuctionMiscDialogsProps) {
  const {
    showAuctionSettingsDialog, setShowAuctionSettingsDialog, auctionSettings,
    setAuctionSettings, handleStartAuctionWithSettings, showShareDialog,
    setShowShareDialog, showTitle, id, showPrebidDialog, setShowPrebidDialog,
    prebidAuction, setPrebidAuction, prebidAmount, setPrebidAmount,
    prebidMutation, toast, currentUserId, showOrderDetailDialog, setShowOrderDetailDialog,
    selectedOrder, orderItemsPage, setOrderItemsPage
  } = props;

  return (
    <>
      {/* Auction Settings Dialog */}
      <Dialog open={showAuctionSettingsDialog} onOpenChange={setShowAuctionSettingsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Auction Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Format Section */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Format</h3>
              <div className="flex items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Sudden Death</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    This means when you're down to 10:01, the last person to bid wins!
                  </p>
                </div>
                <Switch
                  checked={auctionSettings.sudden}
                  onCheckedChange={(checked: boolean) => setAuctionSettings((prev: any) => ({ ...prev, sudden: checked }))}
                  className="ml-3"
                  data-testid="switch-auction-sudden"
                />
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Settings</h3>
              
              {/* Row with Starting Price and Time */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                {/* Starting Price */}
                <div>
                  <label className="text-sm text-white mb-2 block">Starting Price</label>
                  <Input
                    type="number"
                    value={auctionSettings.startingPrice}
                    onChange={(e) => setAuctionSettings((prev: any) => ({ ...prev, startingPrice: parseFloat(e.target.value) || 0 }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-auction-starting-price"
                  />
                </div>

                {/* Time/Duration Label */}
                <div>
                  <label className="text-sm text-white mb-2 block">Time</label>
                  <div className="flex items-center justify-center h-10 px-3 bg-zinc-800 border border-zinc-700 rounded-md text-white">
                    <span className="text-base font-medium">{auctionSettings.duration}s</span>
                  </div>
                </div>
              </div>

              {/* Time selection chips - Full width below */}
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 5, 10, 15, 20].map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => setAuctionSettings((prev: any) => ({ ...prev, duration: seconds }))}
                    className={`
                      px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${auctionSettings.duration === seconds
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                      }
                    `}
                    data-testid={`button-auction-duration-${seconds}`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>

            {/* Counter-Bid Time */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-white">Counter-Bid Time</h3>
                <div className="group relative">
                  <AlertTriangle className="h-4 w-4 text-zinc-400" />
                  <div className="hidden group-hover:block absolute left-0 top-6 bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-zinc-300 w-64 z-10">
                    When the auction has less than 5 seconds remaining, any new bids will reset the timer to the selected amount.
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 5, 7, 10].map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => setAuctionSettings((prev: any) => ({ ...prev, counterBidTime: seconds }))}
                    className={`
                      px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${auctionSettings.counterBidTime === seconds
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                      }
                    `}
                    data-testid={`button-counter-bid-${seconds}`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                onClick={() => setShowAuctionSettingsDialog(false)}
                data-testid="button-cancel-auction"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-white text-black hover:bg-zinc-200"
                onClick={handleStartAuctionWithSettings}
                data-testid="button-confirm-start-auction"
              >
                Start Auction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        url={`${window.location.origin}/show/${id}`}
        title={showTitle}
        description="Show"
      />

      {/* Prebid Dialog */}
      <Dialog open={showPrebidDialog} onOpenChange={setShowPrebidDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Place Prebid</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter your maximum bid for {prebidAuction?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="prebid-amount" className="text-sm font-medium text-white">
                Your Max Bid ($)
              </label>
              <Input
                id="prebid-amount"
                type="number"
                placeholder="Enter amount"
                value={prebidAmount}
                onChange={(e) => setPrebidAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-prebid-amount"
                autoFocus
              />
              {prebidAuction?.prebidShippingCost === undefined ? (
                <p className="text-sm text-center text-zinc-400">
                  Calculating shipping...
                </p>
              ) : prebidAuction?.prebidShippingCost !== null ? (
                <p className="text-sm text-center text-zinc-300">
                  + ${prebidAuction.prebidShippingCost.toFixed(2)} Shipping
                </p>
              ) : null}
              <p className="text-xs text-zinc-400">
                Your prebid will automatically place bids up to this amount
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPrebidDialog(false);
                  setPrebidAmount('');
                  setPrebidAuction(null);
                }}
                data-testid="button-cancel-prebid"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const amount = parseFloat(prebidAmount);
                  const baseprice = prebidAuction?.auction?.baseprice || prebidAuction?.baseprice || 0;
                  
                  if (!amount || amount < baseprice) {
                    toast({
                      title: "Invalid Amount",
                      description: `Bid must be at least $${baseprice.toFixed(2)}`,
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Check if user has an existing prebid and prevent lowering it
                  const userExistingPrebid = prebidAuction?.prebids?.find((p: any) => 
                    p.user?._id === currentUserId || 
                    p.user?.id === currentUserId ||
                    p.user === currentUserId
                  );
                  const existingPrebidAmount = userExistingPrebid?.autobidamount || userExistingPrebid?.amount || 0;
                  
                  if (existingPrebidAmount > 0 && amount < existingPrebidAmount) {
                    toast({
                      title: "Invalid Amount",
                      description: `You cannot lower your prebid. Your current prebid is $${existingPrebidAmount.toFixed(2)}`,
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  prebidMutation.mutate({ listing: prebidAuction, amount });
                }}
                disabled={prebidMutation.isPending || !prebidAmount}
                data-testid="button-submit-prebid"
              >
                {prebidMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDetailDialog} onOpenChange={(open) => {
        setShowOrderDetailDialog(open);
        if (!open) {
          setOrderItemsPage(1);
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md" data-testid="dialog-order-detail">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Order Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
          {selectedOrder && (() => {
            const isGiveaway = !!selectedOrder.giveaway;
            
            // Check if this is a flat order item (from /orders/items/all) or full order (with items array)
            const isFlatItem = !selectedOrder.items && (selectedOrder.productId || selectedOrder.product);
            
            // For flat item structure, extract product info directly
            const flatProduct = selectedOrder.productId || selectedOrder.product;
            const flatProductName = flatProduct?.name || flatProduct?.title || selectedOrder.name || 'Item';
            const flatProductImage = flatProduct?.images?.[0] || flatProduct?.image || selectedOrder.image;
            const flatPrice = selectedOrder.price || flatProduct?.price || 0;
            const flatQuantity = selectedOrder.quantity || 1;
            
            // Calculate subtotal from all items
            const calculateSubtotal = () => {
              if (isGiveaway) return 0;
              if (isFlatItem) return flatPrice * flatQuantity;
              if (selectedOrder.items && selectedOrder.items.length > 0) {
                return selectedOrder.items.reduce((sum: number, item: any) => {
                  const itemPrice = item.price || 0;
                  const itemQty = item.quantity || 1;
                  return sum + (itemPrice * itemQty);
                }, 0);
              }
              return 0;
            };
            
            // For display purposes in table
            let product, productName, productImage, quantity;
            
            if (isGiveaway) {
              product = selectedOrder.giveaway;
              productName = product?.name || product?.title || 'Giveaway Item';
              productImage = product?.images?.[0] || product?.image;
              quantity = selectedOrder.quantity || product?.quantity || 1;
            } else if (isFlatItem) {
              product = flatProduct;
              productName = flatProductName;
              productImage = flatProductImage;
              quantity = flatQuantity;
            } else {
              const firstItem = selectedOrder.items?.[0];
              product = firstItem?.productId || firstItem;
              productName = product?.name || product?.title || 'Item';
              productImage = product?.images?.[0] || product?.image;
              quantity = selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1;
            }
            
            // Customer info - handle both nested customer object and flat structure
            const customer = selectedOrder.customer || selectedOrder.user || selectedOrder.buyer;
            const customerName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || customer?.userName || customer?.email || 'Customer';
            const customerEmail = customer?.email || '';
            const orderPrice = calculateSubtotal();
            const shippingFee = selectedOrder.shipping_fee || selectedOrder.shippingFee || 0;
            const tax = selectedOrder.tax || 0;
            const total = selectedOrder.total || (orderPrice + shippingFee + tax);
            
            // For flat items, create a single-item array for display
            const allItems = isFlatItem 
              ? [{ productId: flatProduct, price: flatPrice, quantity: flatQuantity, order_reference: selectedOrder.order_reference }]
              : (selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : []);
            
            // Pagination logic for items
            const itemsPerPage = 5;
            const totalPages = Math.ceil(allItems.length / itemsPerPage);
            const startIndex = (orderItemsPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedItems = allItems.slice(startIndex, endIndex);
            
            return (
              <div className="space-y-4">
                {/* Order Date and Status - Top */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-800">
                  {selectedOrder.date && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Order Date</p>
                      <p className="text-sm text-white">
                        {format(new Date(selectedOrder.date), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Status</p>
                    <Badge className="bg-green-600 text-white">
                      {(selectedOrder.status || 'ended').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                {/* Items Table */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Items</p>
                  <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-zinc-800/50">
                        <tr>
                          <th className="text-left text-xs font-medium text-zinc-400 py-2 px-3">Product</th>
                          <th className="text-center text-xs font-medium text-zinc-400 py-2 px-3">Qty</th>
                          <th className="text-right text-xs font-medium text-zinc-400 py-2 px-3">Price</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full">
                        <tbody>
                          {paginatedItems.length > 0 ? (
                            paginatedItems.map((item: any, idx: number) => {
                            const itemProduct = item.productId || item;
                            const itemImage = itemProduct?.images?.[0] || itemProduct?.image;
                            const itemName = itemProduct?.name || itemProduct?.title || 'Item';
                            const itemPrice = item.price || 0;
                            const itemQty = item.quantity || 1;
                            const itemTotal = itemPrice * itemQty;
                            
                              return (
                                <tr key={idx} className="border-t border-zinc-800">
                                  <td className="py-3 px-3">
                                    <div className="flex gap-2 items-center">
                                      <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {itemImage ? (
                                          <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                                        ) : (
                                          <Package className="w-5 h-5 text-zinc-600" />
                                        )}
                                      </div>
                                      <span className="font-medium text-sm text-white">{itemName}{item.order_reference ? ` ${item.order_reference}` : ''}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-sm text-white">{itemQty}</td>
                                  <td className="py-3 px-3 text-right text-sm text-white">${itemPrice.toFixed(2)}</td>
                                </tr>
                              );
                            })
                          ) : isGiveaway ? (
                            <tr className="border-t border-zinc-800">
                              <td className="py-3 px-3">
                                <div className="flex gap-2 items-center">
                                  <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {productImage ? (
                                      <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-5 h-5 text-zinc-600" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-white">{productName}</span>
                                    <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
                                      Giveaway
                                    </Badge>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center text-sm text-zinc-400">{quantity}</td>
                              <td className="py-3 px-3 text-right text-sm text-zinc-400">Free</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {allItems.length > itemsPerPage && (
                      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/30 border-t border-zinc-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOrderItemsPage(Math.max(1, orderItemsPage - 1))}
                          disabled={orderItemsPage === 1}
                          className="text-white disabled:opacity-50"
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-zinc-400">
                          Page {orderItemsPage} of {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOrderItemsPage(Math.min(totalPages, orderItemsPage + 1))}
                          disabled={orderItemsPage === totalPages}
                          className="text-white disabled:opacity-50"
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                    
                    {/* Order Summary - Immediately below table, only for non-giveaways */}
                    {!isGiveaway && (
                      <div className="border-t-2 border-zinc-800">
                        <div className="px-3 py-2 space-y-1.5 text-sm">
                          {shippingFee > 0 && (
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Shipping</span>
                              <span className="text-white">${shippingFee.toFixed(2)}</span>
                            </div>
                          )}
                          {tax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Tax</span>
                              <span className="text-white">${tax.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-base">
                            <span className="text-white">Total</span>
                            <span className="text-white">${total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Customer Info & Shipping Address - Side by Side */}
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-3 mt-4">
                  {/* Customer Info */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Customer</p>
                    <p className="text-sm font-medium text-white">{customerName}</p>
                    {customerEmail && (
                      <p className="text-xs text-zinc-400">{customerEmail}</p>
                    )}
                  </div>
                  
                  {/* Shipping Address */}
                  {(selectedOrder.customer?.address || selectedOrder.shippingAddress) && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Shipping Address</p>
                      {(() => {
                        const address = selectedOrder.customer?.address || selectedOrder.shippingAddress;
                        return (
                          <div className="text-sm text-white space-y-0.5">
                            {address.addrress1 && <p>{address.addrress1}</p>}
                            {address.addrress2 && <p>{address.addrress2}</p>}
                            <p>
                              {address.city && `${address.city}, `}
                              {address.state && `${address.state} `}
                              {(address.zipcode || address.zip) && `${address.zipcode || address.zip}`}
                            </p>
                            {(address.countryCode || address.country) && (
                              <p>{address.countryCode || address.country}</p>
                            )}
                            {address.phone && (
                              <p className="text-xs text-zinc-400 mt-1">Phone: {address.phone}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {/* Tracking Info */}
                {selectedOrder.tracking_number && (
                  <div className="border-t border-zinc-800 pt-3">
                    <p className="text-xs text-zinc-500 mb-1">Tracking Number</p>
                    <p className="text-sm font-mono text-primary">{selectedOrder.tracking_number}</p>
                  </div>
                )}
              </div>
            );
          })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
