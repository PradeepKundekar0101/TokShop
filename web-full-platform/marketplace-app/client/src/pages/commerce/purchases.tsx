import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Filter, MoreHorizontal, Package, Printer, Truck, Ship, X } from "lucide-react";
import type { TokshopOrder, TokshopOrdersResponse } from "@shared/schema";
import { calculateOrderTotal, formatCurrency, getOrderBreakdown } from "@shared/pricing";
import { format } from "date-fns";
import { CompletePagination } from "@/components/ui/pagination";

const statusColors = {
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ended: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const itemStatusColors = {
  "pending cancellation": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "progressing": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "cancelled": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "shipped": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusPriority = {
  processing: 1,
  shipped: 2,
  delivered: 3,
  ended: 4,
  cancelled: 5,
};

// Format status text: remove underscores and capitalize words
const formatStatus = (status: string | undefined): string => {
  if (!status) return "Unknown";
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function Purchases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("status");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState<TokshopOrder | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [cancelItemDialogOpen, setCancelItemDialogOpen] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<{ orderId: string; itemId: string } | null>(null);
  const [selectedItemCancelReason, setSelectedItemCancelReason] = useState("");
  const [customItemCancelReason, setCustomItemCancelReason] = useState("");
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();

  const { data: orderResponse, isLoading, error: ordersError, isError, refetch } = useQuery<TokshopOrdersResponse>({
    queryKey: ["external-purchases", user?.id, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) {
        // Always use customer parameter for purchases page
        params.set("customer", user.id);
      }
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      // Add pagination parameters
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      const response = await fetch(
        `/api/orders?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Check if we should open order details from navigation (e.g., from thank you page)
  useEffect(() => {
    const orderToOpen = sessionStorage.getItem('openPurchaseOrder');
    if (orderToOpen) {
      try {
        const order = JSON.parse(orderToOpen);
        setSelectedOrder(order);
        setIsDetailsDialogOpen(true);
        sessionStorage.removeItem('openPurchaseOrder');
      } catch (error) {
        console.error('Failed to parse order from sessionStorage:', error);
        sessionStorage.removeItem('openPurchaseOrder');
      }
    }
  }, []);

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason: string;
    }) => {
      const response = await fetch(`/api/orders/cancel/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: orderId,
          relist: false,
          initiator: "buyer",
          type: "order",
          description: reason,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate all purchases queries
      await queryClient.invalidateQueries({ queryKey: ["external-purchases"] });
      // Also invalidate the /api/orders endpoint
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({ title: "Order cancelled successfully" });
      setIsDetailsDialogOpen(false);
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      setSelectedCancelReason("");
      setCustomCancelReason("");
    },
    onError: () => {
      toast({ title: "Failed to cancel order", variant: "destructive" });
    },
  });

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      const reason = selectedCancelReason === "Other" ? customCancelReason : selectedCancelReason;
      cancelOrderMutation.mutate({
        orderId: orderToCancel,
        reason: reason,
      });
    }
  };

  // Cancel item mutation
  const cancelItemMutation = useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      reason,
    }: {
      orderId: string;
      itemId: string;
      reason: string;
    }) => {
      const response = await fetch(`/api/orders/cancel/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: orderId,
          relist: false,
          initiator: "buyer",
          type: "item",
          description: reason,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel item');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate all purchases queries
      await queryClient.invalidateQueries({ queryKey: ["external-purchases"] });
      // Also invalidate the /api/orders endpoint
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({ title: "Item cancelled successfully" });
      setCancelItemDialogOpen(false);
      setItemToCancel(null);
      setSelectedItemCancelReason("");
      setCustomItemCancelReason("");
      
      // Wait a moment for the invalidation to trigger refetch
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update selected order with fresh data from cache
      if (selectedOrder) {
        const freshData = queryClient.getQueryData<TokshopOrdersResponse>(["external-purchases", user?.id, statusFilter, currentPage, itemsPerPage]);
        const updatedOrder = freshData?.orders?.find(o => o._id === selectedOrder._id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }
    },
    onError: () => {
      toast({ title: "Failed to cancel item", variant: "destructive" });
    },
  });

  const handleCancelItem = (orderId: string, itemId: string | undefined) => {
    if (!itemId) {
      toast({ 
        title: "Cannot cancel item", 
        description: "Item ID is missing",
        variant: "destructive" 
      });
      return;
    }
    console.log('Cancel item clicked:', { orderId, itemId });
    setItemToCancel({ orderId, itemId });
    setCancelItemDialogOpen(true);
  };

  const handleConfirmItemCancel = () => {
    if (itemToCancel) {
      const reason = selectedItemCancelReason === "Other" ? customItemCancelReason : selectedItemCancelReason;
      cancelItemMutation.mutate({
        orderId: itemToCancel.orderId,
        itemId: itemToCancel.itemId,
        reason: reason,
      });
    }
  };

  // Process and filter data
  const orders: TokshopOrder[] = orderResponse?.orders || [];
  const totalOrders = orderResponse?.total || orders.length;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  // Filter orders based on search
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchTerm || 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.items || []).some(item => 
        item.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "total-high":
        return calculateOrderTotal(b) - calculateOrderTotal(a);
      case "total-low":
        return calculateOrderTotal(a) - calculateOrderTotal(b);
      case "status":
        const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 999;
        const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 999;
        return priorityA - priorityB;
      default:
        return 0;
    }
  });

  // Action handlers
  const trackOrder = (order: TokshopOrder) => {
    if (!order.tracking_number) {
      toast({
        title: "No Tracking Available",
        description: "This order doesn't have a tracking number yet.",
        variant: "destructive",
      });
      return;
    }
    
    // Use a generic tracking aggregator URL
    const trackingUrl = `https://parcelsapp.com/en/tracking/${order.tracking_number}`;
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  const viewOrderDetails = (order: TokshopOrder) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const printReceipt = (order: TokshopOrder) => {
    const orderBreakdown = getOrderBreakdown(order);
    
    // Create printable HTML content
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
            <h1>Purchase Receipt</h1>
            <p>${settings.app_name}</p>
          </div>
          
          <div class="order-info">
            <h3>Order #${order.invoice || order._id?.slice(-8) || 'N/A'}</h3>
            <p><strong>Date:</strong> ${order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a") : "Date unknown"}</p>
            <p><strong>Status:</strong> ${formatStatus(order.status)}</p>
            <p><strong>Customer:</strong> ${order.customer?.firstName || ""} ${order.customer?.lastName || ""}</p>
            <p><strong>Email:</strong> ${order.customer?.email || ""}</p>
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
              ${(order.items || []).map(item => `
                <tr>
                  <td>${item.productId?.name || "Unknown Product"}${item.order_reference ? ` ${item.order_reference}` : ''}</td>
                  <td>${item.quantity || 0}</td>
                  <td>$${(item.price || 0).toFixed(2)}</td>
                  <td>$${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(orderBreakdown.subtotal)}</span>
            </div>
            ${orderBreakdown.serviceFee > 0 ? `
              <div class="total-line">
                <span>Service Fee:</span>
                <span>${formatCurrency(orderBreakdown.serviceFee)}</span>
              </div>
            ` : ''}
            ${orderBreakdown.tax > 0 ? `
              <div class="total-line">
                <span>Tax:</span>
                <span>${formatCurrency(orderBreakdown.tax)}</span>
              </div>
            ` : ''}
            ${orderBreakdown.shippingFee > 0 ? `
              <div class="total-line">
                <span>Shipping:</span>
                <span>${formatCurrency(orderBreakdown.shippingFee)}</span>
              </div>
            ` : ''}
            ${orderBreakdown.discount > 0 ? `
              <div class="total-line" style="color: hsl(var(--primary))">
                <span>Discount:</span>
                <span>-${formatCurrency(orderBreakdown.discount)}</span>
              </div>
            ` : ''}
            <div class="total-line final-total">
              <span>Total:</span>
              <span>${formatCurrency(orderBreakdown.total)}</span>
            </div>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()">Print Receipt</button>
            <button onclick="window.close()" style="margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;

    // Open in new window and print
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Auto-print after content loads
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

  // Event handlers
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6" data-testid="page-purchases">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full p-4 sm:p-6" data-testid="page-purchases">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Unable to load purchases
          </h3>
          <p className="text-muted-foreground mb-4">
            {ordersError?.message ||
              "There was an error loading your purchases. Please try again."}
          </p>
          <Button onClick={() => refetch()} data-testid="button-retry-purchases">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6" data-testid="page-purchases">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-foreground"
            data-testid="text-page-title"
          >
            My Purchases
          </h1>
          <p
            className="text-sm text-muted-foreground"
            data-testid="text-page-description"
          >
            Track your order history and purchase status ({totalOrders} purchases)
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-purchases"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger
              className="w-[140px]"
              data-testid="select-status-filter"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total-high">Total: High to Low</SelectItem>
              <SelectItem value="total-low">Total: Low to High</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Purchases Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No purchases found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "You haven't made any purchases yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const productName = order.items?.[0]?.productId?.name || 'N/A';
                  const orderReference = order.items?.[0]?.order_reference || '';
                  const orderId = order.invoice || order._id.slice(-8);
                  const sellerName = order.seller?.userName || `${order.seller?.firstName || ''} ${order.seller?.lastName || ''}`.trim() || 'Unknown';
                  const itemQuantity = order.items?.length || 0;
                  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
                  const orderStatus = order.status || 'processing';

                  return (
                    <tr 
                      key={order._id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      data-testid={`row-purchase-${order._id}`}
                      onClick={() => viewOrderDetails(order)}
                    >
                      {/* Order column - product name + order reference + order ID */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {productName}{orderReference ? ` ${orderReference}` : ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Order #{orderId}
                        </div>
                      </td>

                      {/* Date column */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {format(orderDate, "dd MMM yyyy")}
                      </td>

                      {/* Seller column */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="text-foreground hover:text-primary">
                          {sellerName}
                        </span>
                      </td>

                      {/* Items column */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {itemQuantity}
                      </td>

                      {/* Price column */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        US${calculateOrderTotal(order).toFixed(2)}
                      </td>

                      {/* Status column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={statusColors[orderStatus as keyof typeof statusColors]}>
                          {formatStatus(orderStatus)}
                        </Badge>
                      </td>

                      {/* Actions column */}
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-actions-${order._id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => viewOrderDetails(order)}>
                              <Package className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => printReceipt(order)}>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Receipt
                            </DropdownMenuItem>
                            {order.status === 'shipped' && (
                              <DropdownMenuItem onSelect={() => trackOrder(order)}>
                                <Truck className="h-4 w-4 mr-2" />
                                Track Package
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'processing' || order.status === 'unfulfilled') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onSelect={() => handleCancelOrder(order._id)}
                                  data-testid={`button-cancel-order-${order._id}`}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {sortedOrders.length > 0 && (
        <CompletePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalOrders}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showingText="purchases"
          className="bg-white dark:bg-gray-950 rounded-lg border p-4"
        />
      )}
      
      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex-1 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid={`text-details-order-id`}>
                    Order #{selectedOrder.invoice || selectedOrder._id?.slice(-8) || 'N/A'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Date:</strong> {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "MMM d, yyyy 'at' h:mm a") : "Date unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Status:</strong> 
                    <Badge className={`ml-2 ${statusColors[selectedOrder.status as keyof typeof statusColors]}`}>
                      {formatStatus(selectedOrder.status)}
                    </Badge>
                  </p>
                  {selectedOrder.tracking_number && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Tracking:</strong> {selectedOrder.tracking_number}
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Name:</strong> {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Email:</strong> {selectedOrder.customer?.email}
                  </p>
                  {selectedOrder.customer?.address && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Shipping Address:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.customer.address.name}<br/>
                        {selectedOrder.customer.address.addrress1}<br/>
                        {selectedOrder.customer.address.city}, {selectedOrder.customer.address.state} {selectedOrder.customer.address.zipcode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Product</th>
                        <th className="text-center p-3">Quantity</th>
                        <th className="text-right p-3">Price</th>
                        <th className="text-right p-3">Total</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {item.productId?.images && item.productId.images.length > 0 ? (
                                <img
                                  src={item.productId.images[0]}
                                  alt={item.productId?.name || "Product"}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.productId?.name || "Unknown Product"}{item.order_reference ? ` ${item.order_reference}` : ''}</p>
                                {item.productId?.category?.name && (
                                  <p className="text-sm text-muted-foreground">{item.productId.category.name}</p>
                                )}
                                {item.status && (
                                  <Badge 
                                    className={`mt-1 text-xs ${itemStatusColors[item.status.toLowerCase() as keyof typeof itemStatusColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}
                                    data-testid={`badge-item-status-${index}`}
                                  >
                                    {item.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">{item.quantity || 0}</td>
                          <td className="p-3 text-right">{formatCurrency(item.price || 0)}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency((item.quantity || 0) * (item.price || 0))}
                          </td>
                          <td className="p-3 text-right">
                            {(selectedOrder.status === 'processing' || selectedOrder.status === 'unfulfilled') && 
                             item.status?.toLowerCase() !== 'pending_cancellation' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    data-testid={`button-item-actions-${index}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onSelect={() => {
                                      handleCancelItem(selectedOrder._id, item._id);
                                    }}
                                    data-testid={`button-cancel-item-${index}`}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel Item
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Totals */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Order Summary</h4>
                {(() => {
                  const breakdown = getOrderBreakdown(selectedOrder);
                  return (
                    <div className="space-y-2 max-w-sm ml-auto">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(breakdown.subtotal)}</span>
                      </div>
                      {breakdown.serviceFee > 0 && (
                        <div className="flex justify-between">
                          <span>Service Fee:</span>
                          <span>{formatCurrency(breakdown.serviceFee)}</span>
                        </div>
                      )}
                      {breakdown.tax > 0 && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(breakdown.tax)}</span>
                        </div>
                      )}
                      {breakdown.shippingFee > 0 && (
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>{formatCurrency(breakdown.shippingFee)}</span>
                        </div>
                      )}
                      {breakdown.discount > 0 && (
                        <div className="flex justify-between" style={{ color: 'hsl(var(--primary))' }}>
                          <span>Discount:</span>
                          <span>-{formatCurrency(breakdown.discount)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(breakdown.total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                {selectedOrder.status === 'shipped' && selectedOrder.tracking_number && (
                  <Button variant="outline" onClick={() => trackOrder(selectedOrder)}>
                    <Truck className="h-4 w-4 mr-2" />
                    Track Package
                  </Button>
                )}
                <Button variant="outline" onClick={() => printReceipt(selectedOrder)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent data-testid="dialog-cancel-order">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please select a reason for cancelling this order. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Reason for Cancellation</Label>
              <RadioGroup
                value={selectedCancelReason}
                onValueChange={setSelectedCancelReason}
                data-testid="radio-cancel-reasons"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Accidental purchase" id="reason-accidental" data-testid="radio-reason-accidental" />
                  <Label htmlFor="reason-accidental" className="font-normal cursor-pointer">
                    Accidental purchase
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ordered the wrong item" id="reason-wrong-item" data-testid="radio-reason-wrong-item" />
                  <Label htmlFor="reason-wrong-item" className="font-normal cursor-pointer">
                    Ordered the wrong item
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Shipping taking too long" id="reason-shipping" data-testid="radio-reason-shipping" />
                  <Label htmlFor="reason-shipping" className="font-normal cursor-pointer">
                    Shipping taking too long
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="reason-other" data-testid="radio-reason-other" />
                  <Label htmlFor="reason-other" className="font-normal cursor-pointer">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {selectedCancelReason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-cancel-reason">Please specify</Label>
                <Textarea
                  id="custom-cancel-reason"
                  placeholder="Enter your reason..."
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  rows={3}
                  data-testid="textarea-custom-cancel-reason"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setOrderToCancel(null);
                setSelectedCancelReason("");
                setCustomCancelReason("");
              }}
              disabled={cancelOrderMutation.isPending}
              data-testid="button-cancel-dialog-close"
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelOrderMutation.isPending || !selectedCancelReason || (selectedCancelReason === "Other" && !customCancelReason.trim())}
              data-testid="button-confirm-cancel"
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Item Dialog */}
      <Dialog open={cancelItemDialogOpen} onOpenChange={(open) => {
        setCancelItemDialogOpen(open);
        if (!open) {
          // Reset state when dialog is closed
          setItemToCancel(null);
          setSelectedItemCancelReason("");
          setCustomItemCancelReason("");
        }
      }}>
        <DialogContent data-testid="dialog-cancel-item">
          <DialogHeader>
            <DialogTitle>Cancel Item</DialogTitle>
            <DialogDescription>
              Please select a reason for cancelling this item. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Reason for Cancellation</Label>
              <RadioGroup
                value={selectedItemCancelReason}
                onValueChange={setSelectedItemCancelReason}
                data-testid="radio-cancel-item-reasons"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Accidental purchase" id="item-reason-accidental" data-testid="radio-item-reason-accidental" />
                  <Label htmlFor="item-reason-accidental" className="font-normal cursor-pointer">
                    Accidental purchase
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ordered the wrong item" id="item-reason-wrong-item" data-testid="radio-item-reason-wrong-item" />
                  <Label htmlFor="item-reason-wrong-item" className="font-normal cursor-pointer">
                    Ordered the wrong item
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Shipping taking too long" id="item-reason-shipping" data-testid="radio-item-reason-shipping" />
                  <Label htmlFor="item-reason-shipping" className="font-normal cursor-pointer">
                    Shipping taking too long
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="item-reason-other" data-testid="radio-item-reason-other" />
                  <Label htmlFor="item-reason-other" className="font-normal cursor-pointer">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {selectedItemCancelReason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-item-cancel-reason">Please specify</Label>
                <Textarea
                  id="custom-item-cancel-reason"
                  placeholder="Enter your reason..."
                  value={customItemCancelReason}
                  onChange={(e) => setCustomItemCancelReason(e.target.value)}
                  rows={3}
                  data-testid="textarea-custom-item-cancel-reason"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelItemDialogOpen(false);
                setItemToCancel(null);
                setSelectedItemCancelReason("");
                setCustomItemCancelReason("");
              }}
              disabled={cancelItemMutation.isPending}
              data-testid="button-cancel-item-dialog-close"
            >
              Keep Item
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmItemCancel}
              disabled={cancelItemMutation.isPending || !selectedItemCancelReason || (selectedItemCancelReason === "Other" && !customItemCancelReason.trim())}
              data-testid="button-confirm-cancel-item"
            >
              {cancelItemMutation.isPending ? "Cancelling..." : "Cancel Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}