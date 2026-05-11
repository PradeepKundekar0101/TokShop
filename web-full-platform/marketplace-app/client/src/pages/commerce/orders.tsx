import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreHorizontal, Package, Printer, Truck, Ship, X, MessageSquare, Info } from "lucide-react";
import type { TokshopOrder, TokshopOrdersResponse } from "@shared/schema";
import { calculateOrderTotal, formatCurrency, calculateOrderSubtotal } from "@shared/pricing";
import { useSettings } from "@/lib/settings-context";
import { format } from "date-fns";
import { CompletePagination } from "@/components/ui/pagination";
import { OrderDetailsDrawer } from "@/components/orders/order-details-drawer";
import { getOrCreateChat } from "@/lib/firebase-chat";

const statusColors = {
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ended: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const statusPriority = {
  processing: 1,
  shipped: 2,
  delivered: 3,
  ended: 4,
  cancelled: 5,
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState<TokshopOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();
  const [messagingOrderId, setMessagingOrderId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [relistOption, setRelistOption] = useState(false);

  // Debounce search query - only update after 500ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query key with parameters for proper caching
  const ordersQueryKey = ['/api/orders/items/all', user?.id, statusFilter, selectedShowId, debouncedSearchQuery, currentPage, itemsPerPage];
  
  const { data: orderResponse, isLoading, error: ordersError, isError, refetch } = useQuery<TokshopOrdersResponse>({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) {
        params.set("seller", user.id);
      }
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (selectedShowId && selectedShowId !== "all") {
        if (selectedShowId !== "marketplace") {
          params.set("tokshow", selectedShowId);
        }
      }
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.set("search", debouncedSearchQuery.trim());
      }
      // Add pagination parameters
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      const response = await fetch(`/api/orders/items/all?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id, // Only run query when user ID is available
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Fetch ended shows for filter dropdown
  const { data: endedShowsResponse } = useQuery({
    queryKey: ["/api/rooms", "ended", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "ended");
      if (user?.id) {
        params.set("hostId", user.id);
      }
      const response = await fetch(`/api/rooms?${params}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const endedShows = endedShowsResponse?.rooms || [];

  // Ship order mutation
  const shipOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "shipped",
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark order as shipped');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/items/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Order marked as shipped" });
    },
    onError: () => {
      toast({ title: "Failed to mark order as shipped", variant: "destructive" });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, relist }: { orderId: string; relist: boolean }) => {
      const response = await fetch("/api/orders/cancel/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: orderId,
          initiator: "seller",
          type: "item",
          relist: relist,
          description: "Order cancelled by seller"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/items/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Order cancelled" });
      setDrawerOpen(false);
      setSelectedOrder(null);
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      setRelistOption(false);
    },
    onError: () => {
      toast({ title: "Failed to cancel order", variant: "destructive" });
    },
  });


  const handlePrintLabel = (order: TokshopOrder) => {
    if (order.label) {
      window.open(order.label, '_blank');
    } else {
      toast({ title: "No shipping label available", variant: "destructive" });
    }
  };

  const handleTrackPackage = (order: TokshopOrder) => {
    if (order.tracking_number) {
      // TODO: Open tracking modal or navigate to tracking page
      toast({ title: `Tracking: ${order.tracking_number}` });
    } else {
      toast({ title: "No tracking number available", variant: "destructive" });
    }
  };

  const handleShipOrder = (orderId: string) => {
    shipOrderMutation.mutate(orderId);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setDrawerOpen(false);
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = () => {
    if (orderToCancel) {
      cancelOrderMutation.mutate({ 
        orderId: orderToCancel,
        relist: relistOption
      });
    }
  };

  // Handle message buyer from table
  const handleMessageBuyer = async (order: TokshopOrder) => {
    const buyerId = order.customer?._id;
    const currentUserId = (user as any)?._id || (user as any)?.id;
    
    if (!buyerId || !currentUserId) {
      toast({
        title: "Error",
        description: "Unable to start chat. User information is missing.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setMessagingOrderId(order._id);
      
      const currentUserData = {
        firstName: (user as any)?.firstName || '',
        lastName: (user as any)?.lastName || '',
        userName: (user as any)?.userName || '',
        profilePhoto: (user as any)?.profilePhoto || ''
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
      
      setLocation('/inbox/' + chatId);
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMessagingOrderId(null);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset pagination when filters change
  const resetPaginationOnFilterChange = () => {
    setCurrentPage(1);
  };

  // Update filters to reset pagination
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    resetPaginationOnFilterChange();
  };

  const handleShowFilterChange = (newShowId: string) => {
    setSelectedShowId(newShowId);
    resetPaginationOnFilterChange();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetPaginationOnFilterChange();
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSelectedShowId("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Extract order items array from the response (API returns { items, page, totalPages, totalDocuments })
  const orderItems = (orderResponse as any)?.items || orderResponse?.orders || [];

  // Use centralized calculation function
  const calculateTotal = calculateOrderTotal;

  // Calculate net earnings for an order item
  const calculateNetEarnings = (item: any) => {
    // If it's a giveaway, earnings are 0
    if (item.giveaway || item.ordertype === 'giveaway' || item.orderId?.ordertype === 'giveaway') {
      return 0;
    }
    
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    const subtotal = price * quantity;
    const serviceFee = item.service_fee ?? item.servicefee ?? 0;
    const processingFee = item.stripe_fees ?? 0;
    const sellerShippingCost = item.seller_shipping_fee_pay ?? 0;
    const discount = item.discount ?? 0;
    return subtotal - serviceFee - processingFee - sellerShippingCost - discount;
  };

  // Order items are now filtered server-side, just sort by newest first
  const filteredOrders = [...orderItems].sort((a: any, b: any) => {
    const aDate = a.date ? new Date(a.date) : new Date(a.createdAt || 0);
    const bDate = b.date ? new Date(b.date) : new Date(b.createdAt || 0);
    return bDate.getTime() - aDate.getTime();
  });

  // Calculate pagination data (API returns totalDocuments and totalPages)
  const totalOrders = (orderResponse as any)?.totalDocuments || orderResponse?.total || 0;
  const totalPages = (orderResponse as any)?.totalPages || orderResponse?.pages || 0;

  // Only show full-page loading on initial load (no data yet)
  const isInitialLoading = isLoading && !orderResponse;

  if (isInitialLoading) {
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-8"></div>
            <div className="grid grid-cols-5 gap-4 mb-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (isError) {
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <Card className="max-w-md mx-auto mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-destructive text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Failed to Load Orders
                </h2>
                <p className="text-muted-foreground mb-4">
                  {ordersError?.message || "Something went wrong while loading your orders. Please try again."}
                </p>
                <Button 
                  onClick={() => refetch()}
                  data-testid="button-retry-orders"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-orders-title">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage and track all your customer orders
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          {/* Search Field */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders by product name, customer, order reference..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full"
              data-testid="input-search-orders"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Show Filter */}
            <div className="w-full sm:w-auto sm:min-w-64 sm:max-w-md">
              <Select
                value={selectedShowId}
                onValueChange={handleShowFilterChange}
              >
                <SelectTrigger data-testid="select-show">
                  <SelectValue placeholder="Filter by show..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shows & Marketplace</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  {endedShows.map((show: any) => {
                    const showDate = show.date || show.startDate || show.createdAt;
                    const formattedDate = showDate 
                      ? ` • ${format(new Date(showDate), "d MMM • HH:mm")}` 
                      : "";
                    
                    const showTitle = show.title || `Show #${show._id.slice(-8)}`;
                    
                    return (
                      <SelectItem key={show._id} value={show._id}>
                        <span className="block">
                          <span className="font-medium">{showTitle}</span>
                          {formattedDate && (
                            <>
                              <br />
                              <span className="text-xs text-muted-foreground">{formattedDate}</span>
                            </>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-64">
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              data-testid="button-reset-filters"
              className="w-full sm:w-auto"
            >
              <X size={16} className="mr-1" />
              Reset Filters
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mt-4">
            Showing {filteredOrders.length} of {totalOrders} orders
          </div>
        </div>


        {/* Orders Table */}
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
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sales Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  {user?.seller !== false && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Earnings
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No orders found</h3>
                      <p className="text-muted-foreground">
                        {statusFilter !== "all" || selectedShowId !== "all"
                          ? "Try adjusting your filters" 
                          : "Orders will appear here when customers make purchases"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((item: any) => {
                    const productName = item.productId?.name || item.giveaway?.name || '';
                    const orderReference = item.order_reference || '';
                    const orderId = item.orderId?.invoice || item.orderId?._id?.slice(-8) || item._id?.slice(-8);
                    const customerUsername = item.customer?.userName || 'Unknown';
                    const itemQuantity = item.quantity || 1;
                    const orderDate = item.date ? new Date(item.date) : new Date(item.createdAt || Date.now());
                    const price = (item.price || 0) * (item.quantity || 1);
                    const earnings = calculateNetEarnings(item);
                    const orderStatus = item.status || 'processing';
                    const isFromShow = !!item.tokshow;

                    return (
                      <tr 
                        key={item._id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        data-testid={`row-order-${item._id}`}
                        onClick={() => {
                          setSelectedOrder(item);
                          setDrawerOpen(true);
                        }}
                      >
                        {/* Order column - product name + order reference + order ID */}
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-foreground">
                            {productName ? `${productName}${orderReference ? ` ${orderReference}` : ''}` : (orderReference || 'Item')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Order #{orderId}
                          </div>
                        </td>

                        {/* Date column */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {format(orderDate, "dd MMM yyyy")}
                        </td>

                        {/* Customer column - username as link */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div 
                            className="text-sm text-primary cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.customer?._id) {
                                setLocation('/profile/' + item.customer._id);
                              }
                            }}
                          >
                            {customerUsername}
                          </div>
                        </td>

                        {/* Items column */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          {itemQuantity}
                        </td>

                        {/* Sales Channel column */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          {isFromShow ? 'Show' : 'Marketplace'}
                        </td>

                        {/* Price column - US$ format */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          US${price.toFixed(2)}
                        </td>

                        {/* Order Status column */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge 
                            className={statusColors[orderStatus as keyof typeof statusColors]}
                            data-testid={`order-status-${orderStatus}`}
                          >
                            {formatStatus(orderStatus)}
                          </Badge>
                        </td>

                        {/* Earnings column - seller only */}
                        {user?.seller !== false && (
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-foreground">
                              ${earnings.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>{formatStatus(orderStatus)}</span>
                            </div>
                          </td>
                        )}

                        {/* Actions column - message icon */}
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`button-message-customer-${item._id}`}
                            disabled={messagingOrderId === item._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageBuyer(item);
                            }}
                          >
                            <MessageSquare size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination Controls */}
        <div className="mt-6">
          <CompletePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalOrders}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={[10, 20, 50, 100]}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            showingText="orders"
            className="bg-white dark:bg-gray-950 rounded-lg border p-4"
          />
        </div>
      </div>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCancelOrder={handleCancelOrder}
        cancelLoading={cancelOrderMutation.isPending}
        onViewShipment={(order) => {
          // Store order data for shipments page to open the drawer
          sessionStorage.setItem('openShipmentDrawer', JSON.stringify(order));
          setDrawerOpen(false);
          setLocation('/shipping');
        }}
        onMessageBuyer={(order) => {
          // TODO: Implement messaging functionality
          toast({ title: "Messaging feature coming soon!" });
        }}
      />

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={(open) => {
        setCancelDialogOpen(open);
        if (!open) {
          setOrderToCancel(null);
          setRelistOption(false);
        }
      }}>
        <AlertDialogContent data-testid="dialog-cancel-order">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Checkbox
              id="relist-cancel-order"
              checked={relistOption}
              onCheckedChange={(checked) => setRelistOption(Boolean(checked === true))}
              data-testid="checkbox-relist-cancel-order"
            />
            <Label htmlFor="relist-cancel-order" className="text-sm cursor-pointer">
              Relist this order for future processing
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCancelDialogOpen(false);
                setOrderToCancel(null);
                setRelistOption(false);
              }}
              data-testid="button-keep-order"
            >
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              data-testid="button-confirm-cancel-order"
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
