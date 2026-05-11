import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Package2,
  CalendarIcon,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  unfulfilled: "bg-yellow-100 text-yellow-800",
  processing: "bg-yellow-100 text-yellow-800",
  progressing: "bg-yellow-100 text-yellow-800",
  ready_to_ship: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  shipping: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
  payment_failed: "bg-red-100 text-red-800",
  pending_cancellation: "bg-orange-100 text-orange-800",
  pickup: "bg-purple-100 text-purple-800",
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default function AdminSellerShipments() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/users/:userId/shipments");
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = params?.userId;

  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.admin) setLocation("/");
  }, [user?.admin, setLocation]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  const { data: userData } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: showsData, isLoading: loadingShows } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}/shows`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}/shows?limit=200`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: metricsData, isLoading: loadingMetrics } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}/shipping-metrics`, selectedShowId, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (selectedShowId !== "all") {
        if (selectedShowId === "marketplace") p.set("marketplace", "true");
        else p.set("tokshow", selectedShowId);
      }
      if (dateFrom) p.set("startDate", format(dateFrom, "yyyy-MM-dd"));
      if (dateTo) p.set("endDate", format(dateTo, "yyyy-MM-dd"));
      const qs = p.toString() ? `?${p.toString()}` : "";
      const res = await apiRequest("GET", `/api/admin/users/${userId}/shipping-metrics${qs}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}/seller-orders`, selectedShowId, statusFilter, debouncedSearch, currentPage, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (selectedShowId !== "all") {
        if (selectedShowId === "marketplace") p.set("marketplace", "true");
        else p.set("tokshow", selectedShowId);
      }
      if (statusFilter !== "all") p.set("status", statusFilter);
      if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
      if (dateFrom) p.set("startDate", format(dateFrom, "yyyy-MM-dd"));
      if (dateTo) p.set("endDate", format(dateTo, "yyyy-MM-dd"));
      p.set("page", String(currentPage));
      p.set("limit", "20");
      const res = await apiRequest("GET", `/api/admin/users/${userId}/seller-orders?${p.toString()}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const sellerInfo = userData?.data;
  const sellerName = sellerInfo ? `${sellerInfo.firstName || ""} ${sellerInfo.lastName || ""}`.trim() || sellerInfo.userName || sellerInfo.email : "Seller";
  const sellerShows: any[] = showsData?.data || [];
  const metrics = metricsData || null;
  const orders: any[] = ordersData?.orders || ordersData?.data?.orders || ordersData?.data || [];
  const totalOrders = ordersData?.total || ordersData?.totalDoc || 0;
  const totalPages = ordersData?.totalPages || Math.ceil(totalOrders / 20) || 1;

  const showMetrics = selectedShowId !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  const handleResetFilters = () => {
    setSelectedShowId("all");
    setStatusFilter("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getOrderTotal = (order: any) => {
    let subtotal = 0;
    if (order.items?.length > 0) {
      subtotal = order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1) * (item.price || 0), 0);
    }
    return (subtotal + (order.tax || 0) + (order.shipping_fee || 0)).toFixed(2);
  };

  const getOrderWeight = (order: any) => {
    if (order.weight) return `${order.weight}${order.scale || "oz"}`;
    let totalWeight = 0;
    let scale = "oz";
    if (order.items?.length > 0) {
      order.items.forEach((item: any) => {
        if (item.weight) {
          totalWeight += Number(item.weight) * (item.quantity || 1);
          scale = item.scale || "oz";
        }
      });
    }
    return totalWeight > 0 ? `${totalWeight}${scale}` : "-";
  };

  const getCustomerName = (order: any) => {
    const c = order.customer;
    if (!c) return "Unknown";
    if (typeof c === "object") return c.userName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || "Unknown";
    return String(c);
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          {/* Back button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/admin/users/${userId}`)}
              data-testid="button-back-to-seller"
              className="px-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {sellerName}
            </Button>
          </div>

          {/* Page Header */}
          <div className="mb-6 sm:mb-8 flex items-start gap-4">
            {sellerInfo && (
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={sellerInfo.profilePhoto} />
                <AvatarFallback>{sellerName?.[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-shipments-title">
                Shipments
              </h1>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <p className="text-sm text-muted-foreground">
                  {sellerName} — View shipments by live show or marketplace
                </p>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {format(new Date(), "MM/dd/yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          {showMetrics && (
            <div className="mb-6 sm:mb-8">
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <Card className="border-2 border-accent bg-accent/10">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-lg font-bold text-foreground" data-testid="metric-total-sold">
                      {loadingMetrics ? "..." : `$${metrics?.totalSold || "0"}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Sold</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-lg font-bold text-foreground" data-testid="metric-total-earned">
                      {loadingMetrics ? "..." : `$${metrics?.totalEarned || "0"}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Earned (Paid Out)</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-lg font-bold text-foreground" data-testid="metric-shipping-spend">
                      {loadingMetrics ? "..." : `$${metrics?.totalShippingSpend || "0"}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Shipping Spend</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-lg font-bold text-foreground" data-testid="metric-items-sold">
                      {loadingMetrics ? "..." : (metrics?.itemsSold || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Items sold</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-lg font-bold text-foreground" data-testid="metric-total-delivered">
                      {loadingMetrics ? "..." : (metrics?.totalDelivered || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Delivered</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-lg font-bold text-foreground" data-testid="metric-pending-delivery">
                      {loadingMetrics ? "..." : (metrics?.pendingDelivery || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending Delivery</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search shipments by product name, customer, order reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search-shipments"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Show Filter */}
              <div className="w-full sm:w-auto sm:min-w-64 sm:max-w-md">
                <Select value={selectedShowId} onValueChange={(v) => { setSelectedShowId(v); setCurrentPage(1); }}>
                  <SelectTrigger data-testid="select-show">
                    <Video className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <SelectValue placeholder="Filter by show..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shows & Marketplace</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    {loadingShows ? (
                      <SelectItem value="_loading" disabled>Loading shows...</SelectItem>
                    ) : (
                      sellerShows.map((show: any) => {
                        const showDate = show.date || show.startDate || show.createdAt;
                        const formattedDate = showDate ? ` • ${format(new Date(showDate), "d MMM • HH:mm")}` : "";
                        const showTitle = show.title || `Show #${(show._id || show.id).slice(-8)}`;
                        return (
                          <SelectItem key={show._id || show.id} value={show._id || show.id}>
                            <span className="font-medium">{showTitle}</span>
                            {formattedDate && <span className="text-xs text-muted-foreground">{formattedDate}</span>}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-64">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Filter by status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                    <SelectItem value="processing">Need Label</SelectItem>
                    <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-[150px] justify-start text-left font-normal" data-testid="button-date-from">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setCurrentPage(1); }} initialFocus />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-[150px] justify-start text-left font-normal" data-testid="button-date-to">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setCurrentPage(1); }} initialFocus />
                </PopoverContent>
              </Popover>

              {/* Reset */}
              <Button variant="outline" onClick={handleResetFilters} data-testid="button-reset-filters" className="w-full sm:w-auto">
                <X size={16} className="mr-1" />
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Order count */}
          <div className="mb-4 text-sm text-muted-foreground">
            {loadingOrders ? "Loading..." : `${totalOrders} shipment${totalOrders !== 1 ? "s" : ""}`}
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap w-8" />
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Customer</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Date</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Items</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Total</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Dimensions</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap hidden lg:table-cell">Show</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loadingOrders ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                        <p className="text-muted-foreground">Loading shipments...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Package2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No shipments found</h3>
                      <p className="text-muted-foreground">
                        {statusFilter !== "all" || selectedShowId !== "all" || debouncedSearch
                          ? "Try adjusting your filters or search"
                          : "No orders found for this seller"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const orderId = order._id || order.id;
                    const isExpanded = expandedOrders.includes(orderId);
                    const items: any[] = order.items || [];
                    const showName = order.room?.title || order.tokshow?.title || order.show?.title || null;

                    return (
                      <>
                        <tr
                          key={orderId}
                          data-testid={`row-shipment-${orderId}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleExpand(orderId)}
                        >
                          <td className="px-3 py-3">
                            <Button variant="ghost" size="sm" className="p-1 h-5 w-5" data-testid={`button-expand-${orderId}`}>
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </Button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {typeof order.customer === "object" && order.customer?.profilePhoto && (
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                  <AvatarImage src={order.customer.profilePhoto} />
                                  <AvatarFallback className="text-xs">{getCustomerName(order)?.[0]}</AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <div className="text-sm font-medium text-foreground">{getCustomerName(order)}</div>
                                {order.order_reference && (
                                  <div className="text-xs text-muted-foreground">{order.order_reference}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "—"}
                          </td>
                          <td className="px-3 py-3 text-center text-sm text-foreground font-medium">
                            {items.length || 1}
                          </td>
                          <td className="px-3 py-3 text-center text-sm text-muted-foreground">
                            ${getOrderTotal(order)}
                          </td>
                          <td className="px-3 py-3 text-center text-xs text-muted-foreground">
                            <div>{getOrderWeight(order)}</div>
                            {order.length && order.width && order.height
                              ? <div>{order.height}×{order.width}×{order.length}"</div>
                              : null}
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} text-xs border-0`}
                              data-testid={`shipment-status-${orderId}`}
                            >
                              {order.status ? formatStatus(order.status) : "Unknown"}
                            </Badge>
                            {order.tracking_number && (
                              <div
                                className="text-xs text-primary font-mono mt-1 cursor-pointer hover:bg-primary/10 px-1 py-0.5 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(order.tracking_number);
                                  toast({ title: "Copied!", description: "Tracking number copied to clipboard" });
                                }}
                                title="Click to copy tracking number"
                                data-testid={`tracking-number-${orderId}`}
                              >
                                {order.tracking_number}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell">
                            {showName ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-[140px]">
                                <Video className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{showName}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Marketplace</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded row — items list */}
                        {isExpanded && (
                          <tr key={`${orderId}-expanded`} className="bg-muted/30">
                            <td colSpan={8} className="px-6 py-4">
                              {items.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No item details available</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Order Items</p>
                                  {items.map((item: any, i: number) => {
                                    const product = item.product || item.productId || {};
                                    const title = product.title || item.title || item.name || `Item ${i + 1}`;
                                    const photo = product.photos?.[0] || item.photo || item.image || product.photo;
                                    return (
                                      <div key={i} className="flex items-center gap-3">
                                        {photo ? (
                                          <img src={photo} alt={title} className="h-10 w-10 object-cover rounded border flex-shrink-0" />
                                        ) : (
                                          <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                                            <Package2 className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{title}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity || 1} · ${(item.price || 0).toFixed(2)} each
                                            {item.weight ? ` · ${item.weight}${item.scale || "oz"}` : ""}
                                          </p>
                                        </div>
                                        <Badge
                                          className={`${statusColors[item.status] || "bg-gray-100 text-gray-800"} text-xs border-0 flex-shrink-0`}
                                        >
                                          {item.status ? formatStatus(item.status) : "—"}
                                        </Badge>
                                      </div>
                                    );
                                  })}

                                  {/* Shipping address */}
                                  {order.address && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Ship to</p>
                                      <p className="text-sm text-foreground">
                                        {[order.address.line1 || order.address.street, order.address.city, order.address.state, order.address.zip || order.address.postalCode, order.address.country].filter(Boolean).join(", ")}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalOrders} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
