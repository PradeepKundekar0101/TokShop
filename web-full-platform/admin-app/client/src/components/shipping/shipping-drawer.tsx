import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  Printer, 
  RefreshCw,
  Truck,
  DollarSign,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShippingDrawerProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShippingEstimate {
  objectId: string;
  carrier: string;
  service: string;
  price: string;
  deliveryTime: string;
  estimatedDays?: number;
}

export function AdminShippingDrawer({ order, open, onOpenChange }: ShippingDrawerProps) {
  const [dimensions, setDimensions] = useState({
    length: "10",
    width: "8",
    height: "3",
  });
  const [weight, setWeight] = useState("16");
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<ShippingEstimate | null>(null);
  const [labelFileType, setLabelFileType] = useState("PDF");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch full order data to get items and complete details
  const { data: fullOrderData, isLoading: orderLoading } = useQuery({
    queryKey: ['/api/orders', order?._id],
    queryFn: async () => {
      if (!order?._id) return null;
      const response = await fetch(`/api/orders/${order._id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch order details');
      const data = await response.json();
      return data.data || data;
    },
    enabled: open && !!order?._id,
    staleTime: 30000,
  });

  // Use full order data if available, otherwise fall back to passed order
  const orderData = fullOrderData || order;

  useEffect(() => {
    if (orderData && open) {
      setDimensions({
        length: orderData.length?.toString() || "10",
        width: orderData.width?.toString() || "8",
        height: orderData.height?.toString() || "3",
      });
      setWeight(orderData.weight?.toString() || "16");
    }
  }, [orderData, open]);

  const hasValidDimensions = Boolean(
    dimensions.length && dimensions.width && dimensions.height && weight
  );

  const getOwnerId = () => {
    // For giveaway orders, owner comes from giveaway.user (the giveaway creator)
    if (orderData?.giveaway?.user?._id) return orderData.giveaway.user._id;
    if (orderData?.giveaway?.user && typeof orderData.giveaway.user === 'string') return orderData.giveaway.user;
    // Fallback to seller for regular orders
    if (orderData?.seller?._id) return orderData.seller._id;
    if (orderData?.seller && typeof orderData.seller === 'string') return orderData.seller;
    return 'admin';
  };

  const getCustomerId = () => {
    if (orderData?.customer?._id) return orderData.customer._id;
    if (orderData?.customer && typeof orderData.customer === 'string') return orderData.customer;
    return '';
  };

  const shippingEstimatesQuery = useQuery({
    queryKey: ['/api/shipping/profiles/estimate/rates', {
      weight,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      orderId: order?._id,
    }],
    queryFn: async () => {
      const ownerId = getOwnerId();
      const customerId = getCustomerId();
      
      const requestData = {
        weight: weight,
        unit: orderData?.giveaway?.shipping_profile?.scale || orderData?.scale || "oz",
        product: orderData?.giveaway?._id || orderData?.items?.[0]?.productId?._id || orderData?._id,
        update: true,
        owner: ownerId,
        customer: customerId,
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        isGiveaway: !!orderData?.giveaway,
      };

      const response = await fetch(`/api/shipping/profiles/estimate/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shipping estimates: ${response.status}`);
      }
      
      return await response.json() as ShippingEstimate[];
    },
    enabled: hasValidDimensions && open && !!orderData && !!getCustomerId(),
    retry: 1,
  });

  const estimates = shippingEstimatesQuery.data || [];

  const handleRefreshEstimates = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/shipping/profiles/estimate/rates'] 
    });
    toast({ title: "Refreshing shipping estimates..." });
  };

  const purchaseLabelMutation = useMutation({
    mutationFn: async (estimate: ShippingEstimate & { labelFileType?: string }) => {
      const requestData = {
        rate_id: estimate.objectId,
        order: orderData._id,
        isBundle: false,
        shipping_fee: parseFloat(estimate.price),
        servicelevel: `${estimate.carrier} ${estimate.service}`,
        carrier: estimate.carrier,
        deliveryTime: estimate.deliveryTime,
        label_file_type: estimate.labelFileType,
        weight: parseFloat(weight),
        weight_unit: orderData?.giveaway?.shipping_profile?.scale || orderData?.scale || "oz",
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        estimate_data: {
          price: estimate.price,
          carrier: estimate.carrier,
          service: estimate.service,
          deliveryTime: estimate.deliveryTime,
          estimatedDays: estimate.estimatedDays,
          weight: parseFloat(weight),
          weight_unit: orderData?.giveaway?.shipping_profile?.scale || orderData?.scale || "oz",
          length: parseFloat(dimensions.length),
          width: parseFloat(dimensions.width),
          height: parseFloat(dimensions.height),
        }
      };

      const response = await apiRequest('POST', '/api/shipping/profiles/buy/label', requestData);
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        if (response.data.label_url) {
          window.open(response.data.label_url, '_blank');
        }

        queryClient.invalidateQueries({ queryKey: ['admin-giveaway-orders'] });
        queryClient.invalidateQueries({ predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-shipments'
        });

        toast({
          title: "Shipping label purchased!",
          description: `${response.data.carrier} ${response.data.service} - $${response.data.cost}\nTracking: ${response.data.tracking_number}`,
        });

        onOpenChange(false);
      } else {
        toast({
          title: "Label purchase failed",
          description: response.message || "Unable to purchase shipping label",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to purchase shipping label",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handlePrintLabel = (estimate: ShippingEstimate) => {
    if (!estimate.objectId || estimate.objectId.trim() === '') {
      toast({
        title: "Cannot purchase label",
        description: "Invalid shipping rate. Please refresh estimates and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedEstimate(estimate);
    setLabelDialogOpen(true);
  };

  const confirmLabelPurchase = () => {
    if (!selectedEstimate) return;
    purchaseLabelMutation.mutate({ ...selectedEstimate, labelFileType });
    setLabelDialogOpen(false);
  };

  if (!order) return null;

  const customerName = typeof orderData.customer === 'object' && orderData.customer
    ? `${orderData.customer.firstName || ''} ${orderData.customer.lastName || ''}`.trim() || orderData.customer.userName || 'Unknown'
    : 'Unknown';

  const giveawayTitle = orderData.giveaway?.title || orderData.giveaway?.name || 'Giveaway Item';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package size={20} />
              Ship Order {orderData.invoice || orderData._id?.slice(-8)}
            </SheetTitle>
            <SheetDescription>
              Purchase a shipping label for this order
            </SheetDescription>
          </SheetHeader>

          {orderLoading ? (
            <div className="mt-6 flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <div className="mt-6 space-y-6 pb-6">
            {/* Order Items Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {orderData?.items && orderData.items.length > 0 ? (
                  orderData.items.map((item: any, idx: number) => {
                    const itemName = item.productId?.name 
                      ? `${item.productId.name}${item.order_reference ? ` ${item.order_reference}` : ''}` 
                      : (item.order_reference || 'Item');
                    const itemImage = item.productId?.images?.[0];
                    
                    return (
                      <div key={item._id || idx} className="flex items-center gap-2 py-2 px-2 bg-muted/50 rounded text-xs">
                        {itemImage ? (
                          <img 
                            src={itemImage} 
                            alt={itemName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {itemName}
                          </p>
                          <p className="text-muted-foreground">
                            {item.ordertype || 'Item'} · Qty: {item.quantity || 1}
                            {item.weight && ` · ${item.weight}${item.scale || 'oz'}`}
                          </p>
                        </div>
                        <p className="font-medium">${parseFloat(item.price || 0).toFixed(2)}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-2">No items found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Package Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Length (in)</Label>
                    <Input
                      type="number"
                      value={dimensions.length}
                      onChange={(e) => setDimensions(prev => ({ ...prev, length: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Width (in)</Label>
                    <Input
                      type="number"
                      value={dimensions.width}
                      onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (in)</Label>
                    <Input
                      type="number"
                      value={dimensions.height}
                      onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weight (oz)</Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck size={16} />
                    Shipping Options
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshEstimates}
                    disabled={shippingEstimatesQuery.isFetching}
                  >
                    <RefreshCw className={`h-4 w-4 ${shippingEstimatesQuery.isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {shippingEstimatesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading rates...</span>
                  </div>
                ) : shippingEstimatesQuery.isError ? (
                  <div className="flex items-center gap-2 text-destructive py-4">
                    <AlertCircle className="h-5 w-5" />
                    <span>Failed to load shipping rates</span>
                  </div>
                ) : estimates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No shipping options available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {estimates.map((estimate, index) => (
                      <div
                        key={estimate.objectId || index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {estimate.carrier} {estimate.service}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {estimate.deliveryTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600">
                            ${parseFloat(estimate.price).toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handlePrintLabel(estimate)}
                            disabled={purchaseLabelMutation.isPending}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Buy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Label Format</DialogTitle>
            <DialogDescription>
              Choose the file format for your shipping label
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={labelFileType} onValueChange={setLabelFileType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PDF" id="pdf" />
                <Label htmlFor="pdf">PDF (Recommended)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PNG" id="png" />
                <Label htmlFor="png">PNG Image</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ZPLII" id="zpl" />
                <Label htmlFor="zpl">ZPL (Thermal Printer)</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabelDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmLabelPurchase}
              disabled={purchaseLabelMutation.isPending}
            >
              {purchaseLabelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-1" />
                  Purchase Label
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
