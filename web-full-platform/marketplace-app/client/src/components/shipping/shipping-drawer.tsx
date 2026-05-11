import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Package, 
  Printer, 
  Calculator, 
  RefreshCw,
  Truck,
  DollarSign,
  ChevronDown,
  Users
} from "lucide-react";
import type { TokshopOrder, ShippingEstimateRequest, ShippingEstimateResponse, ShippingLabelPurchaseRequest, ShippingLabelPurchaseResponse, ShipmentBundle } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BulkLabelDialog } from "./bulk-label-dialog";

interface ShippingDrawerProps {
  order?: TokshopOrder;
  bundle?: ShipmentBundle & { orders: TokshopOrder[] };
  children?: React.ReactNode;
  currentTab?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Use shared type instead of local interface
type ShippingEstimate = ShippingEstimateResponse;

export function ShippingDrawer({ order, bundle, children, currentTab, open: externalOpen, onOpenChange: externalOnOpenChange }: ShippingDrawerProps) {
  // Determine if we're dealing with a bundle or individual order
  const isBundle = !!bundle;
  const bundleOrders = bundle?.orders || [];
  const displayOrder = order || (bundleOrders.length > 0 ? bundleOrders[0] : null);
  
  // Early return if no order data available - BEFORE any hooks are called
  if (!displayOrder && !children) {
    return null;
  }

  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  
  // State for collapsible bundle sections - collapsed by default
  const [bundleSummaryOpen, setBundleSummaryOpen] = useState(false);
  
  // State for label format dialog
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<ShippingEstimate | null>(null);
  const [lockedEstimate, setLockedEstimate] = useState<ShippingEstimate | null>(null); // Locked estimate with current rate_id
  
  // Debug logging
  useEffect(() => {
    console.log('labelDialogOpen changed to:', labelDialogOpen);
  }, [labelDialogOpen]);
  
  // State for price tracking and warnings - track initial price per service
  const [initialEstimatePrices, setInitialEstimatePrices] = useState<Record<string, number>>({});
  const [priceIncreaseWarning, setPriceIncreaseWarning] = useState<{ amount: number; percentage: number } | null>(null);
  
  // Helper function to toggle expanded order states
  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  // Bundle calculation helpers
  const calculateBundleTotals = () => {
    if (!isBundle || !bundleOrders.length) {
      return { subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 };
    }
    
    return bundleOrders.reduce((acc, order) => {
      const orderSubtotal = order.items && order.items.length > 0 
        ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
        : (order.total || 0) + (order.servicefee || 0);
      
      const orderItemCount = order.items 
        ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) 
        : 1;
      
      // Use total_shipping_cost if available, otherwise fall back to seller_shipping_fee_pay or shipping_fee
      const orderShipping = order.total_shipping_cost ?? order.seller_shipping_fee_pay ?? order.shipping_fee ?? 0;
      
      return {
        subtotal: acc.subtotal + orderSubtotal,
        tax: acc.tax + (order.tax || 0),
        shipping: acc.shipping + orderShipping,
        total: acc.total + orderSubtotal + (order.tax || 0) + orderShipping,
        itemCount: acc.itemCount + orderItemCount
      };
    }, { subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 });
  };
  
  // Helper function to calculate correct subtotal for single orders
  const calculateSubtotal = () => {
    // Calculate subtotal from items if available
    if (displayOrder.items && displayOrder.items.length > 0) {
      const itemsTotal = displayOrder.items.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
      }, 0);
      if (itemsTotal > 0) return itemsTotal;
    }
    // Fall back to order total + service fee
    return (displayOrder.total || 0) + (displayOrder.servicefee || 0);
  };
  
  // Extract dimensions from order data
  const getRealOrderDimensions = () => {
    if (displayOrder.length && displayOrder.width && displayOrder.height) {
      return {
        length: displayOrder.length.toString(),
        width: displayOrder.width.toString(),
        height: displayOrder.height.toString(),
      };
    }
    
    // Fallback
    return {
      length: "10",
      width: "8", 
      height: "3",
    };
  };
  
  // Extract weight from order data
  const getRealOrderWeight = () => {
    if (displayOrder.weight) {
      return displayOrder.weight.toString();
    }
    // Calculate from items if no order-level weight
    let totalWeight = 0;
    if (displayOrder.items && displayOrder.items.length > 0) {
      displayOrder.items.forEach((item: any) => {
        if (item.weight) {
          totalWeight += Number(item.weight) * (item.quantity || 1);
        }
      });
    }
    if ((displayOrder as any).giveaway?.shipping_profile?.weight) {
      totalWeight += Number((displayOrder as any).giveaway.shipping_profile.weight);
    }
    return totalWeight.toString();
  };
  
  // Get the weight unit from order data
  const getWeightUnit = () => {
    return displayOrder.giveaway?.shipping_profile?.scale || "oz";
  };
  
  const [dimensions, setDimensions] = useState(getRealOrderDimensions());
  const [weight, setWeight] = useState(getRealOrderWeight());
  
  // Track the last fetched signature to avoid redundant API calls
  const lastFetchedSignatureRef = useRef<string | null>(null);
  
  // Check if we have valid data for fetching estimates
  const hasValidDimensions = Boolean(dimensions.length && dimensions.width && dimensions.height && weight);

  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Shipping estimates API call - automatically fetch when drawer opens with valid data
  const shippingEstimatesQuery = useQuery({
    queryKey: ['/api/shipping/profiles/estimate/rates', {
      weight,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      product: displayOrder.giveaway?._id || '',
      owner: displayOrder.seller?._id || '',
      customer: displayOrder.customer?._id || '',
      isBundle,
    }],
    queryFn: async () => {
      // Send data in request body instead of query parameters
      const requestData = {
        weight: weight,
        unit: getWeightUnit(),
        product: displayOrder.giveaway?._id || (displayOrder.items?.[0]?.productId?._id) || displayOrder._id,
        update: true,
        owner: displayOrder.seller?._id || '',
        customer: displayOrder.customer?._id || '',
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        order_id: displayOrder._id,
      };

      // Get auth headers
      const userToken = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userToken) {
        headers['x-access-token'] = userToken;
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      if (userData) {
        headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
      }

      const response = await fetch(`/api/shipping/profiles/estimate/rates`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shipping estimates: ${response.status}`);
      }
      
      return await response.json() as ShippingEstimateResponse[];
    },
    enabled: false, // Manual fetching only - controlled by useEffect below
    retry: 1,
    staleTime: Infinity, // Never auto-refetch, only manual
  });

  const estimates = shippingEstimatesQuery.data || [];
  
  // Only fetch estimates when dimensions/weight actually change (user edits inputs)
  // NOT on drawer open - only on explicit changes or Refresh button click
  const initialSignatureRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!isOpen || !hasValidDimensions) return;
    
    // Create signature of current values
    const currentSignature = JSON.stringify({
      weight,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      orderId: displayOrder._id,
    });
    
    // On first open, just store the initial signature without fetching
    if (initialSignatureRef.current === null) {
      initialSignatureRef.current = currentSignature;
      lastFetchedSignatureRef.current = currentSignature;
      return; // Don't fetch on initial open
    }
    
    // Only fetch if values changed from what we last fetched
    if (lastFetchedSignatureRef.current !== currentSignature) {
      lastFetchedSignatureRef.current = currentSignature;
      shippingEstimatesQuery.refetch();
    }
  }, [isOpen, weight, dimensions.length, dimensions.width, dimensions.height, displayOrder._id]);
  
  // Reset initial signature when order changes
  useEffect(() => {
    initialSignatureRef.current = null;
  }, [displayOrder._id]);

  // Track initial estimate prices per service and detect price changes
  useEffect(() => {
    if (estimates.length > 0) {
      const newInitialPrices = { ...initialEstimatePrices };
      let hasChanges = false;
      
      estimates.forEach(estimate => {
        // Use composite key including delivery time for better uniqueness
        const serviceKey = `${estimate.carrier}-${estimate.service}-${estimate.deliveryTime}`;
        
        // Store initial price for this service if we don't have it
        if (!(serviceKey in initialEstimatePrices)) {
          newInitialPrices[serviceKey] = parseFloat(estimate.price);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setInitialEstimatePrices(newInitialPrices);
        console.log('Stored initial estimate prices:', newInitialPrices);
      }
      
      // Check if first estimate price has increased significantly (>10%) for the warning banner
      const firstServiceKey = `${estimates[0].carrier}-${estimates[0].service}-${estimates[0].deliveryTime}`;
      const initialPrice = initialEstimatePrices[firstServiceKey];
      if (initialPrice) {
        const currentPrice = parseFloat(estimates[0].price);
        const priceDiff = currentPrice - initialPrice;
        const percentIncrease = (priceDiff / initialPrice) * 100;
        
        if (priceDiff > 0 && percentIncrease > 10) {
          setPriceIncreaseWarning({
            amount: priceDiff,
            percentage: percentIncrease
          });
          console.log('Price increase detected:', { priceDiff, percentIncrease });
        } else {
          setPriceIncreaseWarning(null);
        }
      }
    }
  }, [estimates, initialEstimatePrices]);

  // Reset initial prices and warning when drawer closes
  useEffect(() => {
    if (!isOpen) {
      // Clear when drawer closes
      setInitialEstimatePrices({});
      setPriceIncreaseWarning(null);
    }
  }, [isOpen]);

  const handleRefreshEstimates = () => {
    // Clear the signature to force a refetch
    lastFetchedSignatureRef.current = null;
    shippingEstimatesQuery.refetch();
    toast({ title: "Refreshing shipping estimates..." });
  };

  // Purchase shipping label mutation
  const purchaseLabelMutation = useMutation({
    mutationFn: async (estimate: ShippingEstimate & { labelFileType?: string; priceDifference?: string }) => {
      const requestData: ShippingLabelPurchaseRequest & { 
        label_file_type?: string;
        estimate_data?: {
          price: string;
          carrier: string;
          service: string;
          deliveryTime?: string;
          estimatedDays?: number;
          weight: number;
          weight_unit: string;
          length: number;
          width: number;
          height: number;
        };
      } = {
        rate_id: estimate.objectId, // Use objectId from shipping estimate as rate_id
        order: isBundle ? (bundleOrders[0]?.bundleId || displayOrder._id) : displayOrder._id, // Pass the actual bundleId that groups the orders
        isBundle: isBundle, // Explicitly indicate if this is a bundle purchase
        shipping_fee: parseFloat(estimate.price),
        servicelevel: `${estimate.carrier} ${estimate.service}`,
        carrier: estimate.carrier,
        deliveryTime: estimate.deliveryTime,
        label_file_type: estimate.labelFileType, // Add label file type
        // Include weight and dimensions
        weight: parseFloat(weight),
        weight_unit: getWeightUnit(),
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        // Add the estimate data with full price
        estimate_data: {
          price: estimate.price, // Send the full shipping price
          carrier: estimate.carrier,
          service: estimate.service,
          deliveryTime: estimate.deliveryTime,
          estimatedDays: estimate.estimatedDays,
          weight: parseFloat(weight),
          weight_unit: getWeightUnit(),
          length: parseFloat(dimensions.length),
          width: parseFloat(dimensions.width),
          height: parseFloat(dimensions.height),
        }
      };

      const response = await apiRequest('POST', '/api/shipping/profiles/buy/label', requestData);
      return await response.json() as ShippingLabelPurchaseResponse;
    },
    onSuccess: (response, estimate) => {
      if (response.success && response.data) {
        // Immediately open the label for printing
        if (response.data.label_url) {
          window.open(response.data.label_url, '_blank');
        }

        // Refresh logic based on current tab
        if (currentTab === 'all') {
          // If tab is "all", refresh orders
          queryClient.invalidateQueries({ queryKey: ['external-orders'] });
        } else {
          // For other tabs, just refresh bundles
          queryClient.invalidateQueries({ queryKey: ['/api/bundles'] });
        }
        
        // Always refresh shipping metrics
        queryClient.invalidateQueries({ queryKey: ['/api/shipping/metrics'] });

        toast({
          title: "Shipping label purchased successfully!",
          description: `${response.data.carrier} ${response.data.service} - $${response.data.cost}\nTracking: ${response.data.tracking_number}`,
        });

        console.log('Label purchase successful:', response.data);
        setIsOpen(false);
      } else {
        toast({
          title: "Label purchase failed",
          description: response.message || "Unable to purchase shipping label",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error('Label purchase error:', error);
      toast({
        title: "Failed to purchase shipping label",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handlePrintLabel = (estimate: ShippingEstimate) => {
    // Safety check: ensure objectId is present before purchasing
    if (!estimate.objectId || estimate.objectId.trim() === '') {
      toast({
        title: "Cannot purchase label",
        description: "Invalid shipping rate. Please refresh estimates and try again.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('handlePrintLabel called:', { estimate, labelDialogOpen });
    
    // Lock the estimate with its current rate_id - use this for purchase
    // Don't try to match after refresh as rate_ids change
    setSelectedEstimate(estimate);
    setLockedEstimate(estimate);
    setLabelDialogOpen(true);
    
    console.log('After setState calls - labelDialogOpen set to true');
  };

  const confirmLabelPurchase = (labelFileType: string) => {
    if (!lockedEstimate) {
      console.error('No locked estimate available for purchase');
      toast({
        title: "Error",
        description: "Could not find shipping rate. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Use the LOCKED estimate with its original rate_id
    // Don't try to find a matching estimate from refreshed list as matching is unreliable
    const estimateToUse = lockedEstimate;
    
    // Calculate the price difference from the INITIAL price for THIS service
    const serviceKey = `${estimateToUse.carrier}-${estimateToUse.service}-${estimateToUse.deliveryTime}`;
    const currentPrice = parseFloat(estimateToUse.price);
    const originalPrice = initialEstimatePrices[serviceKey] || currentPrice;
    const priceDifference = (currentPrice - originalPrice).toFixed(2);
    
    console.log('=== LABEL PURCHASE DEBUG ===');
    console.log('RATE_ID being sent to buy label endpoint:', estimateToUse.objectId);
    console.log('Order rate_id (if stored on order):', (displayOrder as any).rate_id || 'NOT STORED ON ORDER');
    console.log('Full purchase details:', {
      serviceKey,
      initialPrice: originalPrice,
      currentPrice: estimateToUse.price,
      priceDifference,
      carrier: estimateToUse.carrier,
      service: estimateToUse.service,
      objectId: estimateToUse.objectId,
      weight,
      dimensions,
      labelFileType
    });
    console.log('=== END LABEL PURCHASE DEBUG ===');
    
    // Add labelFileType and price difference to the mutation data
    purchaseLabelMutation.mutate({ 
      ...estimateToUse, 
      labelFileType,
      priceDifference 
    });
    setLabelDialogOpen(false);
    // Close drawer after confirming (the mutation onSuccess will close it too, but this is immediate)
    setIsOpen(false);
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      )}
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isBundle ? (
              <>
                <Users size={20} />
                Ship Bundle - {bundleOrders.length} Orders
              </>
            ) : (
              <>
                <Package size={20} />
                Ship Order {displayOrder.invoice || displayOrder._id.slice(-8)}
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {isBundle 
              ? `Manage bundle dimensions, get shipping estimates, and print labels for ${bundleOrders.length} orders`
              : "Manage dimensions, get shipping estimates, and print labels"
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-6">
          {/* Bundle or Order Summary */}
          {isBundle ? (
            <>
              {/* Customer Name at Top - Always Visible */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{displayOrder.customer?.firstName || ''} {displayOrder.customer?.lastName || ''}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Bundle Summary */}
              <Collapsible open={bundleSummaryOpen} onOpenChange={setBundleSummaryOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          Bundle Summary
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${bundleSummaryOpen ? 'rotate-180' : ''}`} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Orders in Bundle:</span>
                    <span className="font-medium">{bundleOrders.length} orders</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span>{calculateBundleTotals().itemCount} items</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bundle Subtotal:</span>
                    <span className="font-medium">${calculateBundleTotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bundle Tax:</span>
                    <span>{calculateBundleTotals().tax > 0 ? `$${calculateBundleTotals().tax.toFixed(2)}` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bundle Shipping:</span>
                    <span>
                      {(() => {
                        const bundleShipping = Number(calculateBundleTotals().shipping);
                        const estimatedShipping = Number(selectedEstimate?.price ?? estimates[0]?.price ?? 0);
                        const shippingCost = bundleShipping > 0 ? bundleShipping : estimatedShipping;
                        return shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '—';
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span className="text-muted-foreground">Bundle Total:</span>
                    <span>${calculateBundleTotals().total.toFixed(2)}</span>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </>
          ) : (
            /* Single Order Summary */
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{displayOrder.customer?.firstName || ''} {displayOrder.customer?.lastName || ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="text-right">
                    {displayOrder.items && displayOrder.items.length > 0 
                      ? displayOrder.items.map((item: any, idx: number) => (
                          <span key={idx}>
                            {item.productId?.name 
                              ? `${item.productId.name}${item.order_reference ? ` ${item.order_reference}` : ''}` 
                              : (item.order_reference || 'Item')}
                            {idx < displayOrder.items.length - 1 ? ', ' : ''}
                          </span>
                        ))
                      : 'Item'} 
                    ({displayOrder.giveaway ? displayOrder.giveaway.quantity : (displayOrder.items ? displayOrder.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 1)} items)
                  </span>
                </div>
                {calculateSubtotal() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>{(displayOrder.tax ?? 0) > 0 ? `$${(displayOrder.tax ?? 0).toFixed(2)}` : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buyer Paid Shipping:</span>
                  <span>
                    {(displayOrder.shipping_fee ?? 0) > 0 ? `$${(displayOrder.shipping_fee ?? 0).toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Shipping Cost:</span>
                  <span className="text-red-600">
                    {(displayOrder.seller_shipping_fee_pay ?? 0) > 0 ? `-$${Number(displayOrder.seller_shipping_fee_pay).toFixed(2)}` : '—'}
                  </span>
                </div>
                {(() => {
                  const subtotal = calculateSubtotal();
                  const tax = displayOrder.tax || 0;
                  const buyerShipping = displayOrder.shipping_fee || 0;
                  const sellerShippingCost = displayOrder.seller_shipping_fee_pay || 0;
                  const total = subtotal + tax + buyerShipping - Number(sellerShippingCost);
                  return total > 0 ? (
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span className="text-muted-foreground">Net Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span>{displayOrder.createdAt ? format(new Date(displayOrder.createdAt), "MMM dd, yyyy") : "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package Dimensions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator size={16} />
                {isBundle ? 'Bundle' : 'Package'} Dimensions & Weight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show actual order dimensions from database */}
              <div className="p-3 bg-muted/30 rounded-md space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">Order Information:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Weight: </span>
                    <span className="font-medium">{displayOrder.weight || '0'} {getWeightUnit()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dimensions: </span>
                    <span className="font-medium">
                      {displayOrder.giveaway 
                        ? `${displayOrder.giveaway.length || '—'} × ${displayOrder.giveaway.width || '—'} × ${displayOrder.giveaway.height || '—'} in`
                        : `${displayOrder.length || '—'} × ${displayOrder.width || '—'} × ${displayOrder.height || '—'} in`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-xs font-medium text-muted-foreground">Editable Values for Estimates:</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="length" className="text-xs">Length (in)</Label>
                  <Input
                    id="length"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({...dimensions, length: e.target.value})}
                    placeholder="11"
                    data-testid="input-length"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-xs">Width (in)</Label>
                  <Input
                    id="width"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({...dimensions, width: e.target.value})}
                    placeholder="6"
                    data-testid="input-width"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Height (in)</Label>
                  <Input
                    id="height"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({...dimensions, height: e.target.value})}
                    placeholder="0.25"
                    data-testid="input-height"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="weight" className="text-xs">Weight (oz)</Label>
                <Input
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="1.5"
                  className="mt-1"
                  data-testid="input-weight"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleRefreshEstimates}
                  variant="outline"
                  size="sm"
                  disabled={shippingEstimatesQuery.isLoading}
                  data-testid="button-refresh-estimates"
                >
                  <RefreshCw size={14} className={`mr-1 ${shippingEstimatesQuery.isLoading ? 'animate-spin' : ''}`} />
                  {shippingEstimatesQuery.isLoading ? 'Loading...' : 'Refresh Estimates'}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Shipping Estimates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck size={16} />
                Shipping Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shippingEstimatesQuery.error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">
                    Failed to fetch shipping estimates: {shippingEstimatesQuery.error.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please check package dimensions and weight, then try again.
                  </p>
                </div>
              )}
              {priceIncreaseWarning && priceIncreaseWarning.amount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md" data-testid="alert-price-increase">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    ⚠️ Shipping Cost Increased
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    The shipping cost has increased by <span className="font-semibold">${priceIncreaseWarning.amount.toFixed(2)}</span> ({priceIncreaseWarning.percentage.toFixed(1)}%). 
                    You will be charged the current price when purchasing the label.
                  </p>
                </div>
              )}
              {!hasValidDimensions && estimates.length === 0 && !shippingEstimatesQuery.error && (
                <div className="mb-4 p-3 bg-muted/50 border border-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Enter package dimensions and weight above to automatically calculate shipping costs.
                  </p>
                </div>
              )}
              {/* Show order's existing shipping rate when no fresh estimates are loaded */}
              {estimates.length === 0 && !shippingEstimatesQuery.error && (() => {
                const orderShippingCost = displayOrder.total_shipping_cost ?? displayOrder.seller_shipping_fee_pay ?? displayOrder.shipping_fee ?? 0;
                const orderCarrier = (displayOrder as any).carrier || 'USPS';
                const orderService = displayOrder.servicelevel || 'Standard';
                const orderRateId = (displayOrder as any).rate_id || '';
                
                return (
                  <div
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {orderCarrier}
                        </Badge>
                        <span className="font-medium text-sm">{orderService}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Buyer paid rate
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">${Number(orderShippingCost).toFixed(2)}</p>
                      </div>
                      <Button
                        onClick={() => handlePrintLabel({
                          objectId: orderRateId,
                          carrier: orderCarrier,
                          service: orderService,
                          price: orderShippingCost.toString(),
                          deliveryTime: 'Buyer paid rate',
                          estimatedDays: 0
                        })}
                        disabled={purchaseLabelMutation.isPending || Number(weight) === 0}
                        size="sm"
                        data-testid="button-print-buyer-rate"
                        title={Number(weight) === 0 ? 'Weight is required to buy a label' : ''}
                      >
                        <Printer size={14} className="mr-1" />
                        {purchaseLabelMutation.isPending ? 'Purchasing...' : 'Buy Label'}
                      </Button>
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-3">
                {estimates.map((estimate, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {estimate.carrier}
                        </Badge>
                        <span className="font-medium text-sm">{estimate.service}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {estimate.deliveryTime}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">${estimate.price}</p>
                      </div>
                      <Button
                        onClick={() => handlePrintLabel(estimate)}
                        disabled={purchaseLabelMutation.isPending || Number(weight) === 0}
                        size="sm"
                        data-testid={`button-print-${estimate.carrier.toLowerCase()}-${estimate.service.replace(/\s+/g, '-').toLowerCase()}`}
                        title={Number(weight) === 0 ? 'Weight is required to buy a label' : ''}
                      >
                        <Printer size={14} className="mr-1" />
                        {purchaseLabelMutation.isPending ? 'Purchasing...' : 'Buy Label'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          {(displayOrder.tracking_number || (isBundle && bundleOrders.some(order => order.tracking_number))) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Shipping Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isBundle ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Bundle Status</div>
                    {bundleOrders.filter(order => order.tracking_number).map((order, index) => (
                      <div key={order._id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div>
                          <p className="text-sm font-medium">Order #{order.invoice || order._id.slice(-8)}</p>
                          <p className="text-xs text-muted-foreground">
                            Tracking: {order.tracking_number}
                          </p>
                          {((order.seller_shipping_fee_pay ?? order.shipping_fee ?? 0) > 0) && (
                            <p className="text-xs text-muted-foreground">
                              Shipping Cost: ${(order.seller_shipping_fee_pay ?? order.shipping_fee ?? 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tracking Number: {displayOrder.tracking_number}</p>
                      {((displayOrder.seller_shipping_fee_pay ?? displayOrder.shipping_fee ?? 0) > 0) && (
                        <p className="text-sm text-muted-foreground">
                          Shipping Cost: ${(displayOrder.seller_shipping_fee_pay ?? displayOrder.shipping_fee ?? 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Badge>{displayOrder.status}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
    
    <BulkLabelDialog
      open={labelDialogOpen}
      onOpenChange={setLabelDialogOpen}
      orderCount={1}
      onConfirm={confirmLabelPurchase}
      isPending={purchaseLabelMutation.isPending}
    />
  </>
  );
}