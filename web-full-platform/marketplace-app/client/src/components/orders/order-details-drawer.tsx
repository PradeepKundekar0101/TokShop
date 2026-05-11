import { useState } from "react";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, HelpCircle, Package, X, Truck, Info } from "lucide-react";
import type { TokshopOrder } from "@shared/schema";
import { formatCurrency, calculateOrderSubtotal } from "@shared/pricing";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateChat } from "@/lib/firebase-chat";
import { useSettings } from "@/lib/settings-context";
import { useApiConfig, getImageUrl } from "@/lib/use-api-config";

interface OrderDetailsDrawerProps {
  order: TokshopOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelOrder?: (orderId: string) => void;
  onViewShipment?: (order: TokshopOrder) => void;
  onMessageBuyer?: (order: TokshopOrder) => void;
  cancelLoading?: boolean;
}

export function OrderDetailsDrawer({
  order,
  open,
  onOpenChange,
  onCancelOrder,
  onViewShipment,
  onMessageBuyer,
  cancelLoading = false,
}: OrderDetailsDrawerProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { externalApiUrl } = useApiConfig();
  const [messagingLoading, setMessagingLoading] = useState(false);

  if (!order) return null;

  // Handle both old order structure (with items array) and new item-level structure
  const isItemLevel = !!(order as any).productId && !(order as any).items;
  const orderData = order as any;
  
  // Get product details - handle both structures
  const product = isItemLevel ? orderData.productId : order.items?.[0]?.productId;
  const productImage = product?.images?.[0] || order.giveaway?.images?.[0] || "";
  const productName = product?.name || order.giveaway?.name || "Product";
  const categoryObj = product?.category || order.giveaway?.category;
  const category = categoryObj?.name || (typeof categoryObj === 'string' ? categoryObj : null) || "N/A";
  const isGiveaway = !!order.giveaway || order.ordertype === 'giveaway' || orderData.orderId?.ordertype === 'giveaway';
  
  // Build items array for display - handle both structures
  const displayItems = isItemLevel 
    ? [{ productId: orderData.productId, quantity: orderData.quantity || 1, price: orderData.price || 0, order_reference: orderData.order_reference }]
    : order.items || [];

  // Print receipt handler
  const printReceipt = () => {
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order #${order.invoice || order._id?.slice(-8) || 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { margin-top: 20px; text-align: right; }
            .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
            .final-total { font-weight: bold; border-top: 2px solid #000; padding-top: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Receipt</h1>
            <p>${settings.app_name || 'TokShop'}</p>
          </div>
          
          <div class="order-info">
            <h3>Order #${order.invoice || order._id?.slice(-8) || 'N/A'}</h3>
            <p><strong>Date:</strong> ${format(orderDate, "MMM d, yyyy 'at' h:mm a")}</p>
            <p><strong>Status:</strong> ${order.label ? 'Label Created' : order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}</p>
            <p><strong>Customer:</strong> ${buyerName}</p>
            ${order.customer?.email ? `<p><strong>Email:</strong> ${order.customer.email}</p>` : ''}
            ${order.tracking_number ? `<p><strong>Tracking:</strong> ${order.tracking_number}</p>` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${displayItems.map((item: any) => `
                <tr>
                  <td>${item.productId?.name || "Unknown Product"}${item.order_reference ? ` ${item.order_reference}` : ''}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${formatCurrency(item.price || 0)}</td>
                  <td>${formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(price)}</span>
            </div>
            ${tax > 0 ? `
              <div class="total-line">
                <span>Tax:</span>
                <span>${formatCurrency(tax)}</span>
              </div>
            ` : ''}
            ${shippingFee > 0 ? `
              <div class="total-line">
                <span>Shipping:</span>
                <span>${formatCurrency(shippingFee)}</span>
              </div>
            ` : ''}
            <div class="total-line final-total">
              <span>Total:</span>
              <span>${formatCurrency(orderTotal)}</span>
            </div>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()">Print Receipt</button>
            <button onclick="window.close()" style="margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast({
        title: "Print Blocked",
        description: "Unable to open print window. Please allow popups and try again.",
        variant: "destructive",
      });
    }
  };
  
  // Financial calculations - calculate from items or item-level data
  const price = isItemLevel 
    ? (orderData.price || 0) * (orderData.quantity || 1)
    : calculateOrderSubtotal(order);
  const tax = orderData.tax || order.tax || 0;
  const shippingFee = orderData.shipping_fee || order.shipping_fee || 0;
  const orderTotal = price + tax + shippingFee;
  
  // Seller earnings calculations - get from order data
  const serviceFee = orderData.service_fee ?? orderData.servicefee ?? order.service_fee ?? order.servicefee ?? 0;
  const processingFee = orderData.stripe_fees ?? order.stripe_fees ?? 0;
  const sellerShippingPaid = orderData.seller_shipping_fee_pay ?? order.seller_shipping_fee_pay ?? 0;
  
  // Commission rate for display purposes only (used in UI text)
  const commissionRate = settings.commission_rate || 0;
  
  // Net earnings - actual revenue after all fees and seller shipping paid
  const netEarnings = price - serviceFee - processingFee - sellerShippingPaid;
  
  // Status badge
  const getStatusBadge = () => {
    const status = order.status || "processing";
    const statusColors: Record<string, string> = {
      processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      ended: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    
    const displayText = order.label ? "Label Created" : status.charAt(0).toUpperCase() + status.slice(1);
    
    return (
      <Badge className={statusColors[status] || statusColors.processing} data-testid="badge-order-status">
        {displayText}
      </Badge>
    );
  };
  
  // Format date
  const orderDate = order.date ? new Date(order.date) : order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = format(orderDate, 'dd MMM yyyy');
  const formattedTime = format(orderDate, 'h:mm a');
  
  // Buyer name
  const buyerName = order.customer?.userName || 
                   `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 
                   'Unknown';

  // Handle message buyer button click
  const handleMessageBuyer = async () => {
    const buyerId = order.customer?._id;
    const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id;
    
    if (!buyerId || !currentUserId) {
      toast({
        title: "Error",
        description: "Unable to start chat. User information is missing.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setMessagingLoading(true);
      
      const currentUserData = {
        firstName: (currentUser as any)?.firstName || '',
        lastName: (currentUser as any)?.lastName || '',
        userName: (currentUser as any)?.userName || '',
        profilePhoto: (currentUser as any)?.profilePhoto || ''
      };
      
      const buyerData = {
        firstName: order.customer?.firstName || '',
        lastName: order.customer?.lastName || '',
        userName: order.customer?.userName || '',
        profilePhoto: order.customer?.profilePhoto || ''
      };
      
      const chatId = await getOrCreateChat(
        currentUserId,
        buyerId,
        currentUserData,
        buyerData
      );
      
      setLocation(`/inbox/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to open chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMessagingLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="sheet-order-details">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl">Order</SheetTitle>
              <SheetDescription className="text-lg text-muted-foreground mt-1" data-testid="text-order-id">
                #{orderData.orderId?.invoice || orderData.orderId?._id?.slice(-8) || order.invoice || order._id?.slice(-8) || 'N/A'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Order Status Badge */}
          <div>
            {getStatusBadge()}
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Items</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Product</th>
                    <th className="text-center text-xs font-medium text-muted-foreground py-2 px-3">Qty</th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">Price</th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems && displayItems.length > 0 ? (
                    displayItems.map((item: any, idx: number) => {
                      const itemProduct = item.productId;
                      const itemImage = getImageUrl(itemProduct?.images?.[0], externalApiUrl);
                      const itemName = itemProduct?.name || "Product";
                      const itemTotal = (item.quantity || 1) * (item.price || 0);
                      
                      return (
                        <tr key={idx} className="border-t border-border" data-testid={`row-product-${idx}`}>
                          <td className="py-3 px-3">
                            <div className="flex gap-2 items-center">
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {itemImage ? (
                                  <img 
                                    src={itemImage} 
                                    alt={itemName}
                                    className="w-full h-full object-cover"
                                    data-testid={`img-product-${idx}`}
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-medium text-sm text-foreground" data-testid={`text-product-name-${idx}`}>
                                {itemName}{item.order_reference ? ` ${item.order_reference}` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-foreground" data-testid={`text-quantity-${idx}`}>
                            {item.quantity || 1}
                          </td>
                          <td className="py-3 px-3 text-right text-sm text-foreground" data-testid={`text-price-${idx}`}>
                            {formatCurrency(item.price || 0)}
                          </td>
                          <td className="py-3 px-3 text-right text-sm font-medium text-foreground" data-testid={`text-total-${idx}`}>
                            {formatCurrency(itemTotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : order.giveaway ? (
                    <tr className="border-t border-border" data-testid="row-product-giveaway">
                      <td className="py-3 px-3">
                        <div className="flex gap-2 items-center">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {order.giveaway.images?.[0] ? (
                              <img 
                                src={getImageUrl(order.giveaway.images[0], externalApiUrl)} 
                                alt={order.giveaway.name}
                                className="w-full h-full object-cover"
                                data-testid="img-product-giveaway"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium text-sm text-foreground" data-testid="text-product-name-giveaway">
                            {order.giveaway.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-sm text-muted-foreground">
                        1
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-muted-foreground">
                        Giveaway
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-muted-foreground">
                        {formatCurrency(0)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {/* View Receipt Button - only for non-giveaway */}
            {!isGiveaway && (
              <button 
                onClick={printReceipt}
                className="mt-3 text-sm text-primary font-medium hover:underline"
                data-testid="button-view-receipt"
              >
                View receipt
              </button>
            )}
          </div>

          {/* Message Buyer */}
          <button
            onClick={handleMessageBuyer}
            disabled={messagingLoading}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-message-buyer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-medium text-foreground">
                {messagingLoading ? "Loading..." : "Message the buyer"}
              </span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Get Help */}
          {/* <button
            className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            data-testid="button-get-help"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-medium text-foreground">Get help with this order</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button> */}

          {/* Shipment Information */}
          {(order.tracking_number || order.label) && (
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="font-medium text-foreground mb-3">
                This order is attached to a shipment.
              </p>
              {order.tracking_number && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Shipment</span>
                  <span className="text-primary font-medium" data-testid="text-tracking-number">
                    #{order.tracking_number}
                  </span>
                </div>
              )}
              {order.customer?.address && (
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Ship to</span>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{order.customer.address.addrress1}</p>
                    <p className="text-muted-foreground">
                      {order.customer.address.city}, {order.customer.address.state} {order.customer.address.zipcode}
                    </p>
                  </div>
                </div>
              )}
              {onViewShipment && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onViewShipment(order)}
                  data-testid="button-view-shipment"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  View Shipment
                </Button>
              )}
            </div>
          )}

          <Separator />

          {/* Order Details */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Order details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order date</span>
                <span className="text-foreground" data-testid="text-order-date">{formattedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order time</span>
                <span className="text-foreground" data-testid="text-order-time">{formattedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buyer</span>
                <span className="text-primary font-medium" data-testid="text-buyer-name">{buyerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="text-foreground" data-testid="text-category">{category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="text-foreground" data-testid="text-quantity">{isItemLevel ? (orderData.quantity || 1) : (order.items?.[0]?.quantity || 1)}</span>
              </div>
              {/* Show name - from tokshow field */}
              {(order.tokshow || orderData.tokshow) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Show</span>
                  <span className="text-foreground">{order.tokshow?.title || order.tokshow?.name || orderData.tokshow?.title || orderData.tokshow?.name || orderData.tokshow || order.tokshow?._id}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Buyer Paid */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Buyer paid</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="text-foreground" data-testid="text-price">{formatCurrency(price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes paid by buyer</span>
                <span className="text-foreground" data-testid="text-tax">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping paid by buyer</span>
                <span className="text-foreground" data-testid="text-shipping-fee">{formatCurrency(shippingFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Order total</span>
                <span data-testid="text-order-total">{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Your Earnings - Only show for non-giveaway orders */}
          {!isGiveaway ? (
            <div>
              <h3 className="font-semibold text-lg mb-4">Your earnings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Earnings became available for payout on {format(new Date(orderDate.getTime() + 86400000), 'dd MMM yyyy')}.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-foreground">{formatCurrency(price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="text-foreground">-{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <p className="text-muted-foreground">Payment Processing Fee</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>This fee covers payment processing costs (2.9% + $0.30 per transaction).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-foreground">-{formatCurrency(processingFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seller Shipping Paid</span>
                  <span className="text-foreground">-{formatCurrency(sellerShippingPaid)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Net earnings</span>
                  <span data-testid="text-net-earnings">{formatCurrency(netEarnings)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-lg mb-4">Giveaway Item</h3>
              <p className="text-sm text-muted-foreground">
                This is a giveaway item. No payment was collected and there are no earnings for this order.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancelOrder && 
             order.status?.toLowerCase() !== "cancelled" && 
             order.status?.toLowerCase() !== "delivered" && 
             order.status?.toLowerCase() !== "shipped" &&
             order.status?.toLowerCase() !== "refunded" &&
             !order.tracking_number && 
             !(order as any).tracking_url && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onCancelOrder(order._id)}
                disabled={cancelLoading}
                data-testid="button-cancel-order"
              >
                {cancelLoading ? "Cancelling..." : "Cancel order"}
              </Button>
            )}
            {onViewShipment && (order.tracking_number || order.label) && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onViewShipment(order)}
                data-testid="button-view-shipment-footer"
              >
                <Truck className="w-4 h-4 mr-2" />
                View Shipment
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
