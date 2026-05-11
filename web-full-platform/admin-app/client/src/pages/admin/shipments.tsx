import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  Search,
  ChevronDown,
  ChevronRight,
  Package2,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCw,
  X,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { AdminShippingDrawer } from "@/components/shipping/shipping-drawer";
import { AdminShipmentDetailsDrawer } from "@/components/shipping/shipment-details-drawer";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CompletePagination } from "@/components/ui/pagination";

const statusColors: Record<string, string> = {
  unfulfilled:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  progressing:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ready_to_ship:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipping: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending_cancellation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  pickup:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

type SortColumn = 'customer' | 'orderDate' | 'items' | 'total' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export default function AdminShipments() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [searchBy, setSearchBy] = useState<"customer" | "seller">("customer");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [shippingDrawerOpen, setShippingDrawerOpen] = useState(false);
  const [shippingDrawerOrder, setShippingDrawerOrder] = useState<any>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsDrawerOrder, setDetailsDrawerOrder] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const { user } = useAuth();

  const { toast } = useToast();


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const resetPaginationOnFilterChange = () => {
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    resetPaginationOnFilterChange();
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    resetPaginationOnFilterChange();
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    resetPaginationOnFilterChange();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchClick = () => {
    setDebouncedSearchQuery(searchQuery);
    resetPaginationOnFilterChange();
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setSearchBy("customer");
    setDateFrom(undefined);
    setDateTo(undefined);
    resetPaginationOnFilterChange();
  };

  const { data: orderResponse, isLoading: ordersLoading, error: ordersError, isError: ordersIsError, refetch: refetchOrders } =
    useQuery<any>({
      queryKey: ["admin-shipments", statusFilter, debouncedSearchQuery, searchBy, currentPage, itemsPerPage, dateFrom?.toISOString(), dateTo?.toISOString()],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
          params.set("search", debouncedSearchQuery.trim());
          params.set("searchBy", searchBy);
        }
        if (dateFrom) {
          params.set("startDate", format(dateFrom, "yyyy-MM-dd"));
        }
        if (dateTo) {
          params.set("endDate", format(dateTo, "yyyy-MM-dd"));
        }
        params.set("page", currentPage.toString());
        params.set("limit", itemsPerPage.toString());

        const response = await fetch(
          `/api/orders?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      },
      enabled: !!user?.admin,
      staleTime: 0,
      refetchOnMount: true,
    });

  const ordersRaw = orderResponse?.data || orderResponse?.orders || [];
  const orders = Array.isArray(ordersRaw) ? ordersRaw : [];
  const totalOrders = orderResponse?.total || orderResponse?.pagination?.total || 0;
  const totalPages = orderResponse?.pages || orderResponse?.pagination?.pages || 1;

  const displayItems = [...orders].sort((a: any, b: any) => {
    if (sortColumn && sortDirection) {
      let compareValue = 0;
      
      if (sortColumn === 'customer') {
        const nameA = typeof a.customer === 'object'
          ? a.customer?.userName || `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`.trim()
          : '';
        const nameB = typeof b.customer === 'object'
          ? b.customer?.userName || `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim()
          : '';
        compareValue = nameA.localeCompare(nameB);
      } else if (sortColumn === 'orderDate') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        compareValue = dateA - dateB;
      } else if (sortColumn === 'items') {
        const itemsA = (a.items?.length || 0) + (a.giveaway && a.giveaway._id ? 1 : 0);
        const itemsB = (b.items?.length || 0) + (b.giveaway && b.giveaway._id ? 1 : 0);
        compareValue = itemsA - itemsB;
      } else if (sortColumn === 'total') {
        const totalA = (a.total || 0) + (a.tax || 0) + (a.shipping_fee || 0);
        const totalB = (b.total || 0) + (b.tax || 0) + (b.shipping_fee || 0);
        compareValue = totalA - totalB;
      } else if (sortColumn === 'status') {
        const statusA = a.status || '';
        const statusB = b.status || '';
        compareValue = statusA.localeCompare(statusB);
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue;
    }
    
    const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const orderIds = orders.map((order: any) => order._id);
      setSelectedOrders(orderIds);
    } else {
      setSelectedOrders([]);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    if (expandedOrders.includes(orderId)) {
      setExpandedOrders(expandedOrders.filter((id) => id !== orderId));
    } else {
      setExpandedOrders([...expandedOrders, orderId]);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const isInitialLoading = ordersLoading && !orderResponse;

  if (isInitialLoading) {
    return (
      <AdminLayout>
        <div className="py-6">
          <div className="px-4 sm:px-6 md:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-8"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (ordersIsError) {
    return (
      <AdminLayout>
        <div className="py-6">
          <div className="px-4 sm:px-6 md:px-8">
            <Card className="max-w-md mx-auto mt-8">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-destructive text-5xl mb-4">⚠️</div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Failed to Load Shipments
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {ordersError?.message || "Something went wrong. Please try again."}
                  </p>
                  <Button onClick={() => refetchOrders()} data-testid="button-retry">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1
              className="text-xl sm:text-2xl font-bold text-foreground"
              data-testid="text-shipments-title"
            >
              Shipments
            </h1>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
              <p className="text-sm text-muted-foreground">
                View and manage all shipments across sellers
              </p>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {format(new Date(), "MM/dd/yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            {/* Search Field with Search By Filter */}
            <div className="flex gap-2 mb-4">
              <div className="w-32 sm:w-36">
                <Select
                  value={searchBy}
                  onValueChange={(value: "customer" | "seller") => {
                    setSearchBy(value);
                    resetPaginationOnFilterChange();
                  }}
                >
                  <SelectTrigger data-testid="select-search-by">
                    <SelectValue placeholder="Search by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={`Search by ${searchBy}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchClick();
                    }
                  }}
                  className="pl-10 w-full"
                  data-testid="input-search-shipments"
                />
              </div>
              <Button
                onClick={handleSearchClick}
                data-testid="button-search"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
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
                    <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                    <SelectItem value="processing">Need Label</SelectItem>
                    <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-[160px] justify-start text-left font-normal"
                      data-testid="button-date-from"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={handleDateFromChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To Filter */}
              <div className="w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-[160px] justify-start text-left font-normal"
                      data-testid="button-date-to"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={handleDateToChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
          </div>

          {/* Actions */}
          <div className="mb-6">
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  1-{displayItems.length} of {totalOrders}
                </div>
                {selectedOrders.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {selectedOrders.length} selected
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipments Table */}
            <Card className="shadow border border-border w-full">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse divide-y divide-border text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-3 text-left w-10">
                          <Checkbox
                            checked={
                              selectedOrders.length === orders.length &&
                              orders.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                            data-testid="checkbox-select-all-shipments"
                          />
                        </th>
                        <th 
                          className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                          onClick={() => handleSort('customer')}
                        >
                          <div className="flex items-center gap-1">
                            Customer
                            {sortColumn === 'customer' ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-50" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                          onClick={() => handleSort('orderDate')}
                        >
                          <div className="flex items-center gap-1">
                            Order Date
                            {sortColumn === 'orderDate' ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-50" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                          onClick={() => handleSort('items')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Items
                            {sortColumn === 'items' ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-50" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                          onClick={() => handleSort('total')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Total
                            {sortColumn === 'total' ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-50" />
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                          Dimensions
                        </th>
                        <th 
                          className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {sortColumn === 'status' ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-50" />
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {ordersLoading ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                              <p className="text-muted-foreground">Loading shipments...</p>
                            </div>
                          </td>
                        </tr>
                      ) : displayItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center">
                            <Package2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No shipments found</h3>
                            <p className="text-muted-foreground">
                              {statusFilter !== "all" || debouncedSearchQuery
                                ? "Try adjusting your filters or search" 
                                : "Shipments will appear here when there are orders to ship"}
                            </p>
                          </td>
                        </tr>
                      ) : displayItems.map((order: any) => {
                        return (
                          <React.Fragment key={order._id}>
                            <tr 
                              data-testid={`row-shipment-${order._id}`}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('button') || target.closest('input') || target.closest('[role="menuitem"]')) {
                                  return;
                                }
                                if (order.label) {
                                  setDetailsDrawerOrder(order);
                                  setDetailsDrawerOpen(true);
                                } else {
                                  setShippingDrawerOrder(order);
                                  setShippingDrawerOpen(true);
                                }
                              }}
                            >
                              <td className="px-3 py-3">
                                <Checkbox
                                  checked={selectedOrders.includes(order._id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectOrder(
                                      order._id,
                                      checked as boolean,
                                    )
                                  }
                                  data-testid={`checkbox-shipment-${order._id}`}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      toggleOrderExpansion(order._id)
                                    }
                                    className="p-1 h-5 w-5 mr-1"
                                    data-testid={`button-expand-${order._id}`}
                                  >
                                    {expandedOrders.includes(order._id) ? (
                                      <ChevronDown size={12} />
                                    ) : (
                                      <ChevronRight size={12} />
                                    )}
                                  </Button>
                                  <div>
                                    <div className="flex items-center">
                                      {order.status === "delivered" && (
                                        <div className="text-xs bg-accent text-accent-foreground px-1 rounded mr-1">
                                          NEW
                                        </div>
                                      )}
                                      <span className="text-sm font-medium text-foreground">
                                        {typeof order.customer === "object"
                                          ? order.customer?.userName || `${order.customer?.firstName || "Unknown"} ${order.customer?.lastName || ""}`.trim()
                                          : "Unknown Customer"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-sm text-muted-foreground">
                                  {order.createdAt
                                    ? format(
                                        new Date(order.createdAt),
                                        "MMM dd, yyyy",
                                      )
                                    : format(
                                        new Date(order.date || 0),
                                        "MMM dd, yyyy",
                                      )}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-center">
                                  <div className="text-sm text-foreground font-medium">
                                    {(order.items?.length || 0) + (order.giveaway && order.giveaway._id && !order.items?.some((item: any) => item.giveawayId === order.giveaway?._id || item.giveawayId?._id === order.giveaway?._id || (item.type === 'giveaway' && item._id === order.giveaway?._id)) ? 1 : 0)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">
                                    $
                                    {(() => {
                                      let subtotal = 0;
                                      if (order.items && order.items.length > 0) {
                                        subtotal += order.items.reduce((sum: number, item: any) => {
                                          const quantity = item.quantity || 0;
                                          const price = item.price || 0;
                                          return sum + (quantity * price);
                                        }, 0);
                                      }
                                      return (subtotal + (order.tax || 0) + (order.shipping_fee || 0)).toFixed(2);
                                    })()}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-center text-sm text-muted-foreground">
                                  <div className="text-xs">
                                    {(() => {
                                      if (order.weight) {
                                        return `${order.weight}${order.scale || "oz"}`;
                                      }
                                      let totalWeight = 0;
                                      let scale = "oz";
                                      if (order.items && order.items.length > 0) {
                                        order.items.forEach((item: any) => {
                                          if (item.weight) {
                                            totalWeight += Number(item.weight) * (item.quantity || 1);
                                            scale = item.scale || "oz";
                                          }
                                        });
                                      }
                                      if (order.giveaway?.shipping_profile?.weight) {
                                        totalWeight += Number(order.giveaway.shipping_profile.weight);
                                        scale = order.giveaway.shipping_profile.scale || "oz";
                                      }
                                      return totalWeight > 0 ? `${totalWeight}${scale}` : "-";
                                    })()}
                                  </div>
                                  <div className="text-xs">
                                    {order.length && order.width && order.height
                                      ? `${order.height}×${order.width}×${order.length}"`
                                      : order.giveaway
                                        ? ""
                                        : order.items &&
                                            order.items.length > 0 &&
                                            order.items[0].height &&
                                            order.items[0].width &&
                                            order.items[0].length
                                          ? `${order.items[0].height}×${order.items[0].width}×${order.items[0].length}"`
                                          : ""}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div>
                                  <Badge
                                    className={`${statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"} text-xs`}
                                    data-testid={`shipment-status-${order.status}`}
                                  >
                                    {order.status === "delivered"
                                      ? "Delivered"
                                      : order.status
                                        ? order.status
                                            .replaceAll("_", " ")
                                            .charAt(0)
                                            .toUpperCase() +
                                          order.status
                                            .replaceAll("_", " ")
                                            .slice(1)
                                        : "Unknown"}
                                  </Badge>
                                  {order.tracking_number && (
                                    <div
                                      className="text-xs text-primary font-mono mt-1 cursor-pointer hover:bg-primary/10 px-1 py-0.5 rounded transition-colors"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          order.tracking_number!,
                                        );
                                        toast({
                                          title: "Copied!",
                                          description:
                                            "Tracking number copied to clipboard",
                                        });
                                      }}
                                      title="Click to copy tracking number"
                                      data-testid={`tracking-number-${order._id}`}
                                    >
                                      {order.tracking_number}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        data-testid={`button-order-menu-${order._id}`}
                                      >
                                        <MoreHorizontal size={16} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (order.label) {
                                            setDetailsDrawerOrder(order);
                                            setDetailsDrawerOpen(true);
                                          } else {
                                            setShippingDrawerOrder(order);
                                            setShippingDrawerOpen(true);
                                          }
                                        }}
                                      >
                                        <Eye size={14} className="mr-2" />
                                        View Details
                                      </DropdownMenuItem>

                                      {order.status === "ready_to_ship" && order.label && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            window.open(order.label, '_blank');
                                          }}
                                          data-testid={`menu-view-label-${order._id}`}
                                        >
                                          <Printer size={14} className="mr-2" />
                                          View Label
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded row showing item details */}
                            {expandedOrders.includes(order._id) && (
                              <tr
                                className="bg-muted/50"
                                data-testid={`expanded-row-${order._id}`}
                              >
                                <td colSpan={8} className="px-3 py-3">
                                  <div className="bg-card rounded-lg p-4 border">
                                    <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                                      Items in this order:
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b">
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Listing</th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Qty</th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Weight</th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Price</th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Shipping</th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                                              <HoverCard>
                                                <HoverCardTrigger asChild>
                                                  <div className="flex items-center gap-1 cursor-help">
                                                    S. Shipping
                                                    <Info size={12} className="text-muted-foreground" />
                                                  </div>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-64">
                                                  <p className="text-xs">Shipping seller is paying</p>
                                                </HoverCardContent>
                                              </HoverCard>
                                            </th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Type</th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {order.giveaway && order.giveaway._id && !order.items?.some((item: any) => item.giveawayId === order.giveaway?._id || item.giveawayId?._id === order.giveaway?._id || (item.type === 'giveaway' && item._id === order.giveaway?._id)) && (
                                            <tr className="border-b">
                                              <td className="py-2 px-2">
                                                <div className="flex items-center gap-2">
                                                  {order.giveaway.images && order.giveaway.images[0] ? (
                                                    <img 
                                                      src={order.giveaway.images[0]} 
                                                      alt={order.giveaway.name}
                                                      className="w-10 h-10 object-cover rounded"
                                                    />
                                                  ) : (
                                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                                      <Package2 size={16} className="text-muted-foreground" />
                                                    </div>
                                                  )}
                                                  <div>
                                                    <p className="font-medium">{order.giveaway.name}{order.order_reference ? ` ${order.order_reference}` : ''}</p>
                                                    <p className="text-xs text-muted-foreground lowercase">{order.giveaway.category?.name || '-'}</p>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="py-2 px-2">{order.giveaway.quantity || 1}</td>
                                              <td className="py-2 px-2">{order.giveaway.shipping_profile?.weight ? `${order.giveaway.shipping_profile.weight} ${order.giveaway.shipping_profile.scale || ''}` : '-'}</td>
                                              <td className="py-2 px-2">$0.00</td>
                                              <td className="py-2 px-2">${(order.shipping_fee || 0).toFixed(2)}</td>
                                              <td className="py-2 px-2 text-center">
                                                {order.seller_shipping_fee_pay && order.seller_shipping_fee_pay > 0 
                                                  ? `$${order.seller_shipping_fee_pay.toFixed(2)}`
                                                  : '-'}
                                              </td>
                                              <td className="py-2 px-2">Giveaway</td>
                                              <td className="py-2 px-2 text-xs text-muted-foreground">
                                                {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                                              </td>
                                              <td className="py-2 px-2">
                                                <span className={`px-2 py-1 rounded-md text-xs ${statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
                                                  {order.status || 'unfulfilled'}
                                                </span>
                                              </td>
                                            </tr>
                                          )}
                                          {order.items && order.items.length > 0 && (
                                            order.items.map((item: any, idx: number) => {
                                              const itemStatus = item.status || order.status;
                                              return (
                                              <tr key={`${order._id}-${idx}`} className="border-b">
                                                <td className="py-2 px-2">
                                                  <div className="flex items-center gap-2">
                                                    {item.productId?.images && item.productId.images[0] ? (
                                                      <img 
                                                        src={item.productId.images[0]} 
                                                        alt={item.productId.name}
                                                        className="w-10 h-10 object-cover rounded"
                                                      />
                                                    ) : (
                                                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                                        <Package2 size={16} className="text-muted-foreground" />
                                                      </div>
                                                    )}
                                                    <div>
                                                      <p className="font-medium">{item.productId?.name ? `${item.productId.name}${item.order_reference ? ` ${item.order_reference}` : ''}` : (item.order_reference ? `${item.order_reference}` : 'Item')}</p>
                                                      <p className="text-xs text-muted-foreground lowercase">{item.productId?.category?.name || '-'}</p>
                                                    </div>
                                                  </div>
                                                </td>
                                                <td className="py-2 px-2">{item.quantity || 1}</td>
                                                <td className="py-2 px-2">{item.weight ? `${item.weight} ${item.scale || ''}` : '-'}</td>
                                                <td className="py-2 px-2">${(item.price || 0).toFixed(2)}</td>
                                                <td className="py-2 px-2">${(item.shipping_fee || 0).toFixed(2)}</td>
                                                <td className="py-2 px-2 text-center">
                                                  {item.seller_shipping_fee_pay && item.seller_shipping_fee_pay > 0 
                                                    ? `$${item.seller_shipping_fee_pay.toFixed(2)}`
                                                    : '-'}
                                                </td>
                                                <td className="py-2 px-2">{item.orderType || (order.tokshow ? 'Show' : 'Marketplace')}</td>
                                                <td className="py-2 px-2 text-xs text-muted-foreground">
                                                  {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="py-2 px-2">
                                                  <span className={`px-2 py-1 rounded-md text-xs ${statusColors[itemStatus as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
                                                    {itemStatus?.replace(/_/g, ' ') || 'unfulfilled'}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                            })
                                          )}
                                          {!order.giveaway && (!order.items || order.items.length === 0) && (
                                            <tr className="border-b">
                                              <td colSpan={9} className="py-4 px-2 text-center text-muted-foreground">
                                                No items available
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

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
              showingText="shipping items"
              className="bg-white dark:bg-gray-950 rounded-lg border p-4"
            />
          </div>

          {/* Shipping Drawer */}
          {shippingDrawerOrder && (
            <AdminShippingDrawer
              order={shippingDrawerOrder}
              open={shippingDrawerOpen}
              onOpenChange={setShippingDrawerOpen}
            />
          )}

          {/* Shipment Details Drawer (for orders with labels) */}
          {detailsDrawerOrder && (
            <AdminShipmentDetailsDrawer
              order={detailsDrawerOrder}
              open={detailsDrawerOpen}
              onOpenChange={setDetailsDrawerOpen}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
