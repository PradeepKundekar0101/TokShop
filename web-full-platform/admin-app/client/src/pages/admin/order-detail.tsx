import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck, Store, Gift, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function AdminOrderDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/orders/:orderId");
  const orderId = params?.orderId;
  const { toast } = useToast();

  // Refund dialog state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundItem, setRefundItem] = useState<{ itemId: string; name: string; total: number } | null>(null);
  const [refundAmount, setRefundAmount] = useState("");

  const { data: orderData, isLoading } = useQuery<any>({
    queryKey: [`admin-order-${orderId}`],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled: !!orderId,
  });

  const order = orderData?.order || orderData?.data || orderData;

  // Refund item mutation
  const refundItemMutation = useMutation({
    mutationFn: async ({ itemId, amount }: { itemId: string; amount: number }) => {
      return apiRequest("PUT", `/api/admin/refund/${itemId}`, { type: 'order', orderId, itemId, amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`admin-order-${orderId}`] });
      setRefundDialogOpen(false);
      setRefundItem(null);
      setRefundAmount("");
      toast({
        title: "Success",
        description: "Item refund processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    },
  });

  const openRefundDialog = (itemId: string, name: string, total: number) => {
    setRefundItem({ itemId, name, total });
    setRefundAmount(total.toFixed(2));
    setRefundDialogOpen(true);
  };

  const handleRefundSubmit = () => {
    if (!refundItem) return;
    const amount = refundItem.total;
    refundItemMutation.mutate({ itemId: refundItem.itemId, amount });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Order not found</p>
            <Button onClick={() => setLocation('/admin/orders')} className="mt-4">
              Back to Orders
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const customerName = order.customer && typeof order.customer === 'object'
    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.userName || order.customer.email || 'Unknown'
    : 'Unknown';

  const customerEmail = order.customer && typeof order.customer === 'object' ? order.customer.email : '';

  // Calculate totals from items
  const calculateSubtotal = () => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum: number, item: any) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingFee = order.shipping_fee || order.shippingFee || order.shipping || 0;
  const tax = order.tax || 0;
  const discount = order.discount || 0;
  const total = subtotal + shippingFee + tax - discount;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin/orders')}
            className="mb-4"
            data-testid="button-back-to-orders"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Order Details</h2>
              <p className="text-muted-foreground">Order ID: {order.invoice || orderId}</p>
            </div>
            <Badge variant={getStatusColor(order.status)} className="text-lg py-2 px-4 w-fit" data-testid="badge-order-status">
              {order.status || 'pending'}
            </Badge>
          </div>
        </div>

        {/* Invoice Style Layout */}
        <Card>
          <CardContent className="p-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b">
              {/* Order Info */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">ORDER INFO</h3>
                <p className="font-medium">Invoice: {order.invoice || orderId}</p>
                <p className="text-sm text-muted-foreground">Date: {formatDate(order.createdAt || order.orderDate)}</p>
                {order.tracking_number && (
                  <p className="text-sm text-muted-foreground">Tracking: {order.tracking_number}</p>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">CUSTOMER</h3>
                <p className="font-medium">{customerName}</p>
                {customerEmail && <p className="text-sm text-muted-foreground">{customerEmail}</p>}
                {order.customer?.address && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {order.customer.address.street && <p>{order.customer.address.street}</p>}
                    {order.customer.address.city && (
                      <p>{order.customer.address.city}{order.customer.address.state && `, ${order.customer.address.state}`} {order.customer.address.zipcode || order.customer.address.zipCode}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">SELLER</h3>
                {order.seller && (
                  <>
                    <p className="font-medium">
                      {typeof order.seller === 'object'
                        ? `${order.seller.firstName || ''} ${order.seller.lastName || ''}`.trim() || order.seller.userName || order.seller.email
                        : order.seller}
                    </p>
                    {typeof order.seller === 'object' && order.seller.email && (
                      <p className="text-sm text-muted-foreground">{order.seller.email}</p>
                    )}
                  </>
                )}
                {order.shippingAddress && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                    {order.shippingAddress.city && (
                      <p>{order.shippingAddress.city}{order.shippingAddress.state && `, ${order.shippingAddress.state}`} {order.shippingAddress.zipCode}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Giveaway Info - Show for giveaway orders */}
            {order.platform_order && order.giveaway && (
              <div className="py-6 border-b">
                <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                  <Gift className="h-5 w-5 text-primary mt-1" />
                  {order.giveaway.image && (
                    <img
                      src={order.giveaway.image}
                      alt={order.giveaway.title || 'Giveaway'}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{order.giveaway.title || order.giveaway.name || 'Giveaway'}</p>
                    {order.giveaway.description && (
                      <p className="text-sm text-muted-foreground mt-1">{order.giveaway.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.giveaway.status && <Badge variant="outline">{order.giveaway.status}</Badge>}
                      {order.giveaway.type && <Badge variant="secondary">{order.giveaway.type}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items Table */}
            {!order.platform_order && order.items && order.items.length > 0 && (
              <div className="py-6">
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Shipping</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item: any, index: number) => {
                        const baseName = item.giveawayId?.name || item.giveawayId?.title || item.productId?.name || item.productId?.title || item.name || item.title || 'Unknown Product';
                        const orderRef = item.order_reference || '';
                        const productName = orderRef ? orderRef : baseName;
                        const productImage = item.giveawayId?.image || item.giveawayId?.images?.[0] || item.productId?.image || item.productId?.images?.[0] || item.image || item.images?.[0];
                        const quantity = item.quantity || 1;
                        const price = item.price || 0;
                        const itemShipping = item.shipping_fee || item.shippingFee || item.shipping || 0;
                        const itemId = item._id || item.id || `item-${index}`;
                        const isRefunded = item.status === 'refunded' || item.refunded;

                        return (
                          <TableRow key={index} data-testid={`order-item-${index}`}>
                            <TableCell>
                              {productImage && (
                                <img
                                  src={productImage}
                                  alt={productName}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{productName}</p>
                              {isRefunded && <Badge variant="destructive" className="mt-1">Refunded</Badge>}
                            </TableCell>
                            <TableCell className="text-center">{quantity}</TableCell>
                            <TableCell className="text-right">${price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${itemShipping.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">${(price * quantity + itemShipping).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {!isRefunded && item.status === 'processing' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRefundDialog(itemId, productName, price * quantity + itemShipping)}
                                  disabled={refundItemMutation.isPending}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Refund
                                </Button>
                              ) : (
                                <Badge variant="secondary" className="capitalize">{item.status}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="pt-6 border-t">
              <div className="flex justify-end">
                <div className="w-64 space-y-2" data-testid="order-summary">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>${shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--primary))' }}>
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span data-testid="text-order-total">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refund Confirmation Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Item</DialogTitle>
            <DialogDescription>
              {refundItem && `Refund for: ${refundItem.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="refundAmount">Refund Amount ($)</Label>
            <Input
              id="refundAmount"
              type="number"
              value={refundAmount}
              readOnly
              className="mt-2 bg-muted"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Item total: ${refundItem?.total.toFixed(2) || '0.00'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRefundSubmit}
              disabled={refundItemMutation.isPending}
            >
              {refundItemMutation.isPending ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
