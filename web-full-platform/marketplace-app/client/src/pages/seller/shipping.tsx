import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Edit,
  Printer,
  Search,
  ChevronDown,
  ChevronRight,
  Package2,
  Unlink2,
  X,
  Eye,
  MoreHorizontal,
  Ship,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PanelRightOpen,
  Download,
  RotateCw,
  Info,
  Truck,
  FileText,
  CheckCircle,
  XCircle,
  Video,
} from "lucide-react";
import type {
  TokshopOrder,
  TokshopOrdersResponse,
} from "@shared/schema";

// Temporary type for shipment bundles (not exported from schema)
type ShipmentBundle = any;
import { format, startOfDay, endOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { ShippingDrawer } from "@/components/shipping/shipping-drawer";
import { SelectiveUnbundleDialog } from "@/components/shipping/selective-unbundle-dialog";
import { BulkLabelDialog } from "@/components/shipping/bulk-label-dialog";
import { ShipmentDetailsDrawer } from "@/components/shipping/shipment-details-drawer";
import { ScanFormViewerDialog } from "@/components/shipping/scan-form-viewer-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CompletePagination } from "@/components/ui/pagination";

const statusColors = {
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
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  payment_failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending_cancellation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  pickup:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

interface ShipmentMetrics {
  totalSold: string;
  totalEarned: string;
  totalShippingSpend: string;
  totalCouponSpend: string;
  itemsSold: number;
  totalDelivered: number;
  pendingDelivery: number;
}

type SortColumn = 'customer' | 'orderDate' | 'items' | 'total' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export default function Shipping() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [bundleName, setBundleName] = useState("");

  // Debounce search query - only update after 500ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [showBundleDialog, setShowBundleDialog] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [relistOption, setRelistOption] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [unbundleDialogOpen, setUnbundleDialogOpen] = useState(false);
  const [unbundleBundleId, setUnbundleBundleId] = useState<string | null>(null);
  const [unbundleOrderDialogOpen, setUnbundleOrderDialogOpen] = useState(false);
  const [unbundleOrderId, setUnbundleOrderId] = useState<string | null>(null);
  const [bulkLabelDialogOpen, setBulkLabelDialogOpen] = useState(false);
  const [shipmentDetailsOpen, setShipmentDetailsOpen] = useState(false);
  const [shipmentDetailsOrder, setShipmentDetailsOrder] = useState<TokshopOrder | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [scanFormDialogOpen, setScanFormDialogOpen] = useState(false);
  const [scanFormError, setScanFormError] = useState<string | null>(null);
  const [generatedManifestId, setGeneratedManifestId] = useState<string | null>(null);
  const [shippingActionsOpen, setShippingActionsOpen] = useState(false);
  const [scanFormViewerOpen, setScanFormViewerOpen] = useState(false);
  const [scanForms, setScanForms] = useState<any[]>([]);
  const [isLoadingScanForms, setIsLoadingScanForms] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [cancellationItemId, setCancellationItemId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [approveRelistOption, setApproveRelistOption] = useState(false);
  const [shippingDrawerOpen, setShippingDrawerOpen] = useState(false);
  const [shippingDrawerOrder, setShippingDrawerOrder] = useState<TokshopOrder | null>(null);
  const [cancelAlertOpen, setCancelAlertOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [videoReceiptUrl, setVideoReceiptUrl] = useState<string | null>(null);
  const [videoReceiptDialogOpen, setVideoReceiptDialogOpen] = useState(false);
  const { user } = useAuth();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      relist,
    }: {
      orderId: string;
      relist: boolean;
    }) => {
      const response = await fetch("/api/orders/cancel/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          order: orderId,
          initiator: "seller",
          type: "order",
          relist: relist,
          description: "Order cancelled by seller"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Order cancelled successfully" });
      setCancelOrderId(null);
      setRelistOption(false);
    },
    onError: () => {
      toast({ title: "Failed to cancel order", variant: "destructive" });
    },
  });

  const handleCancelOrder = () => {
    if (cancelOrderId) {
      cancelOrderMutation.mutate({
        orderId: cancelOrderId,
        relist: relistOption,
      });
    }
  };

  // Mark as shipped mutation
  const markAsShippedMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "shipped" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark order as shipped");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Order marked as shipped" });
    },
    onError: () => {
      toast({ title: "Failed to mark order as shipped", variant: "destructive" });
    },
  });

  const handleMarkAsShipped = (orderId: string) => {
    markAsShippedMutation.mutate(orderId);
  };

  const canCancelOrder = (order: TokshopOrder) => {
    // Can't cancel if already cancelled, shipped, delivered, or ended
    if (
      order.status === "cancelled" ||
      order.status === "shipped" ||
      order.status === "delivered" ||
      order.status === "ended"
    ) {
      return false;
    }
    
    // Can't cancel if a shipping label has been printed (has tracking number)
    if (order.tracking_number || (order as any).tracking_url) {
      return false;
    }
    
    return true;
  };

  // Approve cancellation mutation
  const approveCancellationMutation = useMutation({
    mutationFn: async ({ orderId, itemId, relist }: { orderId: string; itemId?: string; relist: boolean }) => {
      const payload: any = {
        order: orderId,
        description: itemId 
          ? "Item cancellation approved by seller" 
          : "Order cancellation approved by seller",
        relist: relist,
      };

      if (itemId) {
        payload.item = itemId;
      }

      const response = await fetch("/api/orders/cancel/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to approve cancellation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Cancellation request approved" });
      setApproveDialogOpen(false);
      setCancellationOrderId(null);
      setCancellationItemId(null);
      setApproveRelistOption(false);
    },
    onError: () => {
      toast({ title: "Failed to approve cancellation", variant: "destructive" });
    },
  });

  // Decline cancellation mutation
  const declineCancellationMutation = useMutation({
    mutationFn: async ({ orderId, itemId, reason }: { orderId: string; itemId?: string; reason: string }) => {
      const payload: any = {
        order: orderId,
        description: reason || (itemId 
          ? "Item cancellation declined by seller" 
          : "Order cancellation declined by seller"),
      };

      if (itemId) {
        payload.item = itemId;
      }

      const response = await fetch("/api/orders/cancel/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to decline cancellation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Cancellation request declined" });
      setDeclineDialogOpen(false);
      setCancellationOrderId(null);
      setCancellationItemId(null);
      setDeclineReason("");
    },
    onError: () => {
      toast({ title: "Failed to decline cancellation", variant: "destructive" });
    },
  });

  const handleApproveCancellation = () => {
    if (cancellationOrderId) {
      approveCancellationMutation.mutate({
        orderId: cancellationOrderId,
        itemId: cancellationItemId || undefined,
        relist: approveRelistOption,
      });
    }
  };

  const handleDeclineCancellation = () => {
    if (cancellationOrderId) {
      declineCancellationMutation.mutate({
        orderId: cancellationOrderId,
        itemId: cancellationItemId || undefined,
        reason: declineReason,
      });
    }
  };

  // Unbundle items mutation
  const unbundleItemsMutation = useMutation({
    mutationFn: async ({ orderId, itemIds }: { orderId: string; itemIds: string[] }) => {
      const response = await fetch('/api/orders/unbundle/orders', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, itemIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to unbundle items");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({ 
        title: "Items unbundled successfully",
        description: "Selected items have been created as separate orders"
      });
      setUnbundleOrderId(null);
      setUnbundleOrderDialogOpen(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to unbundle items", 
        variant: "destructive" 
      });
    },
  });

  const handleUnbundleItems = (itemIds: string[]) => {
    if (unbundleOrderId && itemIds.length > 0) {
      unbundleItemsMutation.mutate({ orderId: unbundleOrderId, itemIds });
    }
  };

  // Generate scan form mutation
  const generateScanFormMutation = useMutation({
    mutationFn: async ({ tokshow, carrierAccount, ownerId }: { tokshow: string; carrierAccount?: string; ownerId?: string }) => {
      const response = await fetch('/api/shipping/generate/manifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokshow, carrierAccount, ownerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data (targets exact key tuples used by shipping/show queries)
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", "ended", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["show-orders-all", user?.id, selectedShowId] });
      
      // Clear any previous errors
      setScanFormError(null);
      
      // Store manifest_id if provided in response
      if (data.manifest_id) {
        setGeneratedManifestId(data.manifest_id);
        toast({
          title: "Scan form generation started",
          description: data.message || "SCAN Form generation has been initiated",
        });
      } else if (data.manifest?.object_state !== "VALID") {
        // Scan form is being generated, show info message
        toast({
          title: "Scan form generation in progress",
          description: data.message || "SCAN Form is being generated, retry later",
        });
      } else {
        // Scan form successfully generated
        toast({
          title: "Success",
          description: data.message || "SCAN Form generated successfully",
        });
      }
      
      setScanFormDialogOpen(false);
    },
    onError: (error: Error) => {
      // Set error state for dialog display
      setScanFormError(error.message);
      
      // Also show toast for immediate feedback
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch scan form by manifest ID mutation
  const fetchScanFormMutation = useMutation({
    mutationFn: async ({ manifestId, tokshow, orderIds, type, status }: { manifestId: string; tokshow: string; orderIds?: string[]; type?: 'show' | 'marketplace'; status?: string }) => {
      const params = new URLSearchParams();
      params.set('tokshow', tokshow);
      
      // Add type parameter to indicate show or marketplace
      if (type) {
        params.set('type', type);
      }
      
      // Add status filter
      if (status) {
        params.set('status', status);
      }
      
      // Add order IDs as array for marketplace orders
      if (orderIds && orderIds.length > 0) {
        params.set('orderIds', JSON.stringify(orderIds));
      }
      
      const response = await fetch(`/api/shipping/generate/manifest/${manifestId}?${params.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to fetch scan form");
      }

      return data;
    },
    onSuccess: (data) => {
      // If we got a scan form URL, open it
      if (data.scan_form_url) {
        window.open(data.scan_form_url, '_blank');
      } else {
        toast({
          title: "Scan form not ready",
          description: data.message || "The scan form is still being generated. Please try again in a moment.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    // When marketplace is selected, set date filters to current day
    if (newShowId === 'marketplace') {
      const today = new Date();
      setDateFrom(startOfDay(today));
      setDateTo(endOfDay(today));
    }
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
    resetPaginationOnFilterChange();
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSelectedShowId("all");
    setSearchQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
    resetPaginationOnFilterChange();
  };

  // Fetch ended shows for filter dropdown
  const { data: endedShowsResponse } = useQuery({
    queryKey: ["/api/rooms", "ended", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "ended");
      if (user?.id) {
        params.set("userid", user.id);
      }
      const response = await fetch(`/api/rooms?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch ended shows");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const endedShows = endedShowsResponse?.rooms || [];

  // Get selected show data from list
  const selectedShow = endedShows.find((show: any) => show._id === selectedShowId);
  
  // For marketplace, always show view button (API will handle if scan form exists)
  const isMarketplaceSelected = selectedShowId === 'marketplace';

  // Handler for opening the generation dialog
  const handleOpenScanFormDialog = () => {
    // Only allow action if a specific show or marketplace is selected (not all)
    if (!selectedShowId || selectedShowId === 'all') {
      toast({
        title: "Cannot generate scan form",
        description: "Please select a specific show or marketplace to generate a scan form",
        variant: "destructive",
      });
      return;
    }

    setShippingActionsOpen(false); // Close the drawer first
    setScanFormError(null);
    setScanFormDialogOpen(true);
  };

  // Handler for actually generating the scan form (called from dialog confirm button)
  const handleGenerateScanForm = () => {
    if (selectedShowId && selectedShowId !== 'all') {
      // For marketplace orders, send null as tokshow value
      const tokshowValue = selectedShowId === 'marketplace' ? null : selectedShowId;
      const carrierAccount = selectedShow?.carrierAccount;
      const ownerId = selectedShow?.owner?._id || selectedShow?.owner || user?.id || '';
      generateScanFormMutation.mutate({ tokshow: tokshowValue, carrierAccount, ownerId });
    }
  };

  // Handler for viewing existing scan forms
  const handleViewScanForm = async () => {
    // Only allow action if a specific show or marketplace is selected (not all)
    if (!selectedShowId || selectedShowId === 'all') {
      toast({
        title: "Cannot view scan form",
        description: "Please select a specific show or marketplace",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingScanForms(true);
      setScanFormViewerOpen(true);

      const isMarketplace = selectedShowId === 'marketplace';
      
      // Build request body based on selection
      const requestBody: any = {};
      
      if (isMarketplace) {
        requestBody.type = 'marketplace';
      } else {
        requestBody.tokshow = selectedShowId;
      }
      
      // Add status if filtered
      if (statusFilter !== 'all') {
        requestBody.status = statusFilter;
      }

      // Call POST /api/shipping/generate/manifest/view
      const response = await fetch('/api/shipping/generate/manifest/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to fetch scan forms");
      }

      // Extract forms from response
      const forms = data.forms || [];
      setScanForms(forms);
    } catch (error) {
      toast({
        title: "Failed to fetch scan forms",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setScanForms([]);
      setScanFormViewerOpen(false);
    } finally {
      setIsLoadingScanForms(false);
    }
  };

  // Reset generated manifest ID when show changes
  useEffect(() => {
    setGeneratedManifestId(null);
  }, [selectedShowId]);

  const { data: metrics, isLoading: metricsLoading, error: metricsError, isError: metricsIsError, refetch: refetchMetrics } =
    useQuery<ShipmentMetrics>({
      queryKey: ["/api/shipping/metrics", user?.id, dateFrom?.toISOString(), dateTo?.toISOString(), selectedShowId],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (user?.id) {
          params.set("userId", user.id);
        }
        // Add date filter parameters (use YYYY-MM-DD format to avoid timezone issues)
        if (dateFrom) {
          params.set("startDate", format(dateFrom, "yyyy-MM-dd"));
        }
        if (dateTo) {
          params.set("endDate", format(dateTo, "yyyy-MM-dd"));
        }
        // Add show filter parameters
        if (selectedShowId && selectedShowId !== "all") {
          if (selectedShowId === "marketplace") {
            params.set("marketplace", "true");
          } else {
            params.set("tokshow", selectedShowId);
          }
        }

        const response = await fetch(`/api/shipping/metrics?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`External API error: ${response.status}`);
        }
        return response.json();
      },
      enabled: !!user?.id,
      staleTime: 0, // Always fetch fresh data
      refetchOnMount: true, // Refetch when component mounts
    });

  const { data: orderResponse, isLoading: ordersLoading, error: ordersError, isError: ordersIsError, refetch: refetchOrders } =
    useQuery<TokshopOrdersResponse>({
      queryKey: ["external-orders", user?.id, statusFilter, selectedShowId, debouncedSearchQuery, currentPage, itemsPerPage, dateFrom?.toISOString(), dateTo?.toISOString()],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (user?.id) {
          params.set("userId", user.id);
        }
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (selectedShowId && selectedShowId !== "all") {
          if (selectedShowId === "marketplace") {
            params.set("marketplace", "true");
          } else {
            params.set("tokshow", selectedShowId);
          }
        }
        if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
          params.set("search", debouncedSearchQuery.trim());
        }
        // Add date filter parameters (use YYYY-MM-DD format to avoid timezone issues)
        if (dateFrom) {
          params.set("startDate", format(dateFrom, "yyyy-MM-dd"));
        }
        if (dateTo) {
          params.set("endDate", format(dateTo, "yyyy-MM-dd"));
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
      enabled: !!user?.id, // Only run query when user ID is available
      staleTime: 0, // Always fetch fresh data
      refetchOnMount: true, // Refetch when component mounts
    });

  // Extract orders array from the response
  const orders = orderResponse?.orders || [];
  
  // Extract pagination data from response (backend calculates totalPages)
  const totalOrders = orderResponse?.total || 0;
  const totalPages = orderResponse?.pages || 1;

  // Check if all orders on current page have shipment_id (for scan form validation)
  const ordersWithoutShipmentId = orders.filter((order: any) => !(order as any).shipment_id);
  const allOrdersHaveShipmentId = orders.length > 0 && ordersWithoutShipmentId.length === 0;

  // Check if any order has manifest_id (scan form was generated)
  const orderWithManifestId = orders.find((order: any) => (order as any).manifest_id && (order as any).manifest_id.trim() !== '');
  const hasManifestId = !!orderWithManifestId;
  const manifestIdFromOrder = (orderWithManifestId as any)?.manifest_id || null;
  
  // Check for scan_form_url on orders
  const orderWithScanForm = orders.find((order: any) => (order as any).scan_form_url && (order as any).scan_form_url.trim() !== '');
  const hasScanForm = !!orderWithScanForm;
  
  // Show view button if a specific show or marketplace is selected (not 'all')
  const shouldShowViewButton = selectedShowId && selectedShowId !== 'all';

  // Handler to check status when manifest exists but URL not ready
  const handleCheckScanFormStatus = () => {
    // Use manifest ID from orders first, then fall back to recently generated
    const manifestId = manifestIdFromOrder || generatedManifestId;
    if (manifestId) {
      fetchScanFormMutation.mutate({ manifestId, tokshow: selectedShowId });
    } else {
      toast({
        title: "No manifest found",
        description: "Unable to check status",
        variant: "destructive",
      });
    }
  };

  const { data: bundles, isLoading: bundlesLoading, error: bundlesError, isError: bundlesIsError, refetch: refetchBundles } = useQuery<
    ShipmentBundle[]
  >({
    queryKey: ["/api/bundles", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID required");
      const response = await fetch(`/api/bundles?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch bundles");
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Check if we should open shipment details drawer from navigation
  useEffect(() => {
    const orderToOpen = sessionStorage.getItem('openShipmentDrawer');
    if (orderToOpen) {
      try {
        const order = JSON.parse(orderToOpen);
        setShipmentDetailsOrder(order);
        setShipmentDetailsOpen(true);
        sessionStorage.removeItem('openShipmentDrawer');
      } catch (error) {
        console.error('Failed to parse order from sessionStorage:', error);
        sessionStorage.removeItem('openShipmentDrawer');
      }
    }
  }, []);

  // Use orders directly - the API returns what it should return
  const displayItems: TokshopOrder[] = (orders || []).sort((a, b) => {
    // Apply custom sorting if a sort column is selected
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
    
    // Default sorting by date (newest first)
    const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    // Only allow selection of orders with 'processing' status
    const order = orders?.find((o) => o._id === orderId);
    if (checked && order?.status !== "processing") {
      toast({
        title: "Only processing orders can be bundled",
        variant: "destructive",
      });
      return;
    }

    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all processing orders from the entire orders array (includes both unbundled and multi-item orders)
      const processingOrderIds = orders
        .filter((order) => order.status === "processing")
        .map((order) => order._id);
      setSelectedOrders(processingOrderIds);
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
      // Cycle through: asc -> desc -> null
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

  const createBundleMutation = useMutation({
    mutationFn: async (data: { orderIds: string[] }) => {
      if (!user?.id) throw new Error("User ID required");

      const response = await fetch("/api/orders/bundle/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create bundle" }));
        throw new Error(errorData.message || "Failed to create bundle");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      setSelectedOrders([]);
      setBundleName("");
      setShowBundleDialog(false);
      toast({ title: "Bundle created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create bundle", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const unbundleMutation = useMutation({
    mutationFn: async ({ bundleId, orderIds }: { bundleId: string; orderIds?: string[] }) => {
      if (!user?.id) throw new Error("User ID required");
      const response = await fetch(
        `/api/bundles/${bundleId}?userId=${user.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: orderIds ? JSON.stringify({ orderIds }) : undefined,
        },
      );
      if (!response.ok) throw new Error("Failed to unbundle orders");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({ title: "Orders unbundled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to unbundle orders", variant: "destructive" });
    },
  });

  const cancelBundleMutation = useMutation({
    mutationFn: async ({
      bundleId,
      relist,
    }: {
      bundleId: string;
      relist: boolean;
    }) => {
      if (!user?.id) throw new Error("User ID required");

      // Get all orders in the bundle from current page
      const bundleOrders =
        orders?.filter((order) => order.bundleId === bundleId) || [];

      // Cancel each order in the bundle with relist option
      const cancelPromises = bundleOrders.map((order) =>
        fetch(`/api/orders/${order._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "cancelled",
            relist,
          }),
        }),
      );

      const results = await Promise.all(cancelPromises);
      const failedCancellations = results.filter((response) => !response.ok);

      if (failedCancellations.length > 0) {
        throw new Error(
          `Failed to cancel ${failedCancellations.length} orders in bundle`,
        );
      }

      return { cancelledOrders: bundleOrders.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({
        title: `Bundle cancelled - ${data.cancelledOrders} orders cancelled`,
      });
      setCancelOrderId(null);
      setRelistOption(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel bundle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        const errorData = await response.json().catch(() => ({ message: "Failed to mark order as shipped" }));
        throw new Error(errorData.message || "Failed to mark order as shipped");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({ title: "Order marked as shipped" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark order as shipped",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const shipBundleMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      if (!user?.id) throw new Error("User ID required");

      // Call backend endpoint to mark all orders in bundle as shipped
      const response = await fetch(`/api/orders/bundle/${bundleId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: "Failed to mark bundle as shipped" 
        }));
        throw new Error(errorData.error || "Failed to mark bundle as shipped");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({
        title: `Bundle shipped - ${data.shippedOrders} orders marked as shipped`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to ship bundle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBundle = () => {
    if (selectedOrders.length < 2) {
      toast({
        title: "Select at least 2 orders to bundle",
        variant: "destructive",
      });
      return;
    }
    setShowBundleDialog(true);
  };

  const confirmCreateBundle = () => {
    createBundleMutation.mutate({ orderIds: selectedOrders });
  };

  const handleUnbundle = (orderId: string) => {
    // Since we're using item count, orderId is the bundle identifier
    setUnbundleBundleId(orderId);
    setUnbundleDialogOpen(true);
  };

  const confirmUnbundle = async (itemsByOrder: Record<string, string[]>) => {
    if (!unbundleBundleId) return;
    
    // Call unbundle endpoint for each order with its items
    const orderIds = Object.keys(itemsByOrder);
    
    try {
      for (const orderId of orderIds) {
        const itemIds = itemsByOrder[orderId];
        
        const response = await fetch('/api/orders/unbundle/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, itemIds }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to unbundle items from order ${orderId}` }));
          throw new Error(errorData.message || `Failed to unbundle items from order ${orderId}`);
        }
      }
      
      // Invalidate queries after successful unbundling
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      
      toast({ 
        title: "Items unbundled successfully",
        description: `${Object.values(itemsByOrder).flat().length} items unbundled from ${orderIds.length} order(s)`
      });
      
      setUnbundleDialogOpen(false);
      setUnbundleBundleId(null);
    } catch (error) {
      toast({ 
        title: "Failed to unbundle items", 
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive" 
      });
    }
  };

  const handleCancelBundle = (bundleId: string) => {
    cancelBundleMutation.mutate({ bundleId, relist: relistOption });
  };

  // Bulk label purchase mutation
  const bulkLabelMutation = useMutation({
    mutationFn: async ({ rates }: { rates: Array<{ rate_id: string; label_file_type: string; order: string }> }) => {
      const response = await fetch("/api/shipping/bulk-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to purchase labels" }));
        throw new Error(errorData.message || "Failed to purchase labels");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["show-orders-all", user?.id, selectedShowId] });
      setSelectedOrders([]);
      setBulkLabelDialogOpen(false);
      toast({ 
        title: `${data.successCount || selectedOrders.length} label(s) purchased successfully`,
        description: data.failureCount ? `${data.failureCount} label(s) failed` : undefined
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to purchase labels", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleBulkLabelPurchase = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to purchase labels",
        variant: "destructive",
      });
      return;
    }
    setBulkLabelDialogOpen(true);
  };

  const confirmBulkLabelPurchase = (labelFileType: string) => {
    // Build rates array in the format expected by external API
    const rates = selectedOrders.map(orderId => {
      const order = orders?.find(o => o._id === orderId);
      return {
        rate_id: order?.rate_id || '',
        label_file_type: labelFileType,
        order: order?.bundleId || orderId
      };
    });
    
    bulkLabelMutation.mutate({ rates });
  };

  // Only show full-page loading on initial load (no data yet)
  const isInitialLoading = (metricsLoading || ordersLoading || bundlesLoading) && !orderResponse && !metrics;

  if (isInitialLoading) {
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (metricsIsError || ordersIsError || bundlesIsError) {
    const errors = [];
    if (metricsIsError) errors.push("metrics");
    if (ordersIsError) errors.push("orders");
    if (bundlesIsError) errors.push("bundles");
    
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <Card className="max-w-md mx-auto mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-destructive text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Failed to Load Shipping Data
                </h2>
                <p className="text-muted-foreground mb-4">
                  {ordersError?.message || metricsError?.message || bundlesError?.message || 
                   `Something went wrong while loading your ${errors.join(", ")}. Please try again.`}
                </p>
                <div className="flex gap-2 justify-center">
                  {metricsIsError && (
                    <Button 
                      onClick={() => refetchMetrics()}
                      variant="outline"
                      size="sm"
                      data-testid="button-retry-metrics"
                    >
                      Retry Metrics
                    </Button>
                  )}
                  {ordersIsError && (
                    <Button 
                      onClick={() => refetchOrders()}
                      variant="outline"
                      size="sm"
                      data-testid="button-retry-orders"
                    >
                      Retry Orders
                    </Button>
                  )}
                  {bundlesIsError && (
                    <Button 
                      onClick={() => refetchBundles()}
                      variant="outline"
                      size="sm"
                      data-testid="button-retry-bundles"
                    >
                      Retry Bundles
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      refetchMetrics();
                      refetchOrders();
                      refetchBundles();
                    }}
                    data-testid="button-retry-all"
                  >
                    Retry All
                  </Button>
                </div>
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
          <h1
            className="text-xl sm:text-2xl font-bold text-foreground"
            data-testid="text-shipments-title"
          >
            Shipments
          </h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <p className="text-sm text-muted-foreground">
              View shipments by live show or marketplace
            </p>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {format(new Date(), "MM/dd/yyyy 'at' h:mm a")} • Shipping Complete
            </div>
          </div>
        </div>

        {/* Metrics Cards - Hidden when all filters are at default (all shows & all status) */}
        {!(selectedShowId === "all" && statusFilter === "all") && (
          <div className="mb-6 sm:mb-8">
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <Card className="border-2 border-accent bg-accent/10">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="metric-total-sold"
                  >
                    ${metrics?.totalSold || "0"}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Sold</div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="metric-total-earned"
                  >
                    ${metrics?.totalEarned || "0"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Earned (Paid Out)
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="metric-shipping-spend"
                  >
                    ${metrics?.totalShippingSpend || "0"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Shipping Spend
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="metric-items-sold"
                  >
                    {metrics?.itemsSold || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Items sold</div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="metric-total-delivered"
                  >
                    {metrics?.totalDelivered || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Delivered
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="metric-pending-delivery"
                  >
                    {metrics?.pendingDelivery || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pending Delivery
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6">
          {/* Search Field */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search shipments by product name, customer, order reference..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full"
              data-testid="input-search-shipments"
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

            {/* Shipping Actions Sidebar - Only show for "Unfulfilled" status */}
            {statusFilter === 'unfulfilled' && (
              <div className="w-full sm:w-auto sm:ml-auto">
                <Button
                  variant="default"
                  disabled={!selectedShowId || selectedShowId === 'all'}
                  onClick={() => setShippingActionsOpen(true)}
                  data-testid="button-open-shipping-actions"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  {shouldShowViewButton ? (
                    <>
                      <Eye size={16} className="mr-1" />
                      View SCAN Form
                    </>
                  ) : (
                    <>
                      <PanelRightOpen size={16} className="mr-1" />
                      Shipping Actions
                    </>
                  )}
                </Button>

                {/* Shipping Actions Sheet */}
                <Sheet open={shippingActionsOpen} onOpenChange={setShippingActionsOpen}>
                  <SheetContent className="w-full sm:max-w-md overflow-y-auto" data-testid="sheet-shipping-actions">
                    <SheetHeader className="mb-6">
                      <SheetTitle>Shipping Actions</SheetTitle>
                    </SheetHeader>

                    <div className="space-y-4">
                      {/* Shipping Actions Section */}
                      <div className="border border-border rounded-md p-4">
                        <h3 className="font-semibold text-base mb-2">Shipping actions</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          These actions apply to all shipments in your {selectedShowId === 'marketplace' ? 'marketplace' : 'show'}.
                        </p>

                        <div className="space-y-2">
                          {/* View USPS SCAN Form - shown when scan form exists or marketplace is selected */}
                          {shouldShowViewButton && (
                            <Button
                              variant="default"
                              className="w-full justify-start"
                              onClick={handleViewScanForm}
                              data-testid="button-view-scan"
                            >
                              <Eye size={16} className="mr-2" />
                              View USPS SCAN Form
                            </Button>
                          )}

                          {/* Generate USPS SCAN Form - shown when no scan form exists */}
                          {!hasScanForm && !hasManifestId && !generatedManifestId && (
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={handleOpenScanFormDialog}
                              data-testid="button-generate-scan"
                            >
                              <RotateCw size={16} className="mr-2" />
                              Generate USPS SCAN Form
                            </Button>
                          )}

                          {/* Mark All Packages As Shipped */}
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            data-testid="button-mark-all-shipped"
                          >
                            <Truck size={16} className="mr-2" />
                            Mark All Packages As Shipped
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>

        {/* Scan Form Dialog - Placed outside Sheet to fix z-index */}
        <AlertDialog open={scanFormDialogOpen} onOpenChange={setScanFormDialogOpen}>
          <AlertDialogContent data-testid="dialog-scan-form">
                  <AlertDialogHeader>
                    <AlertDialogTitle data-testid="text-scan-form-title">Generate USPS Scan Form</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3" data-testid="text-scan-form-warning">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            ⚠️ Important: This scan form can only be generated once and cannot be regenerated.
                          </p>
                        </div>

                        {ordersLoading && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3" data-testid="text-scan-form-loading">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                              Loading order information...
                            </p>
                          </div>
                        )}

                        {ordersIsError && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="text-scan-form-fetch-error">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                              Failed to load order information
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              {ordersError?.message || 'Unable to fetch orders'}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refetchOrders()}
                              className="mt-2"
                              data-testid="button-retry-orders"
                            >
                              Retry
                            </Button>
                          </div>
                        )}

                        {!ordersLoading && !ordersIsError && !allOrdersHaveShipmentId && orders.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="text-scan-form-error">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                              ⚠️ Cannot generate scan form: {ordersWithoutShipmentId.length} order{ordersWithoutShipmentId.length !== 1 ? 's' : ''} {ordersWithoutShipmentId.length !== 1 ? 'do' : 'does'} not have shipping labels purchased yet.
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              Please purchase shipping labels for all orders before generating a scan form.
                            </p>
                          </div>
                        )}

                        {scanFormError && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="text-scan-form-generation-error">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                              ⚠️ Failed to generate scan form
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              {scanFormError}
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <span className="text-sm font-medium text-foreground">Show:</span>
                            <span className="text-sm text-muted-foreground text-right" data-testid="text-scan-form-show-name">
                              {selectedShowId === 'marketplace'
                                ? <div className="font-medium">Marketplace Orders</div>
                                : selectedShowId && selectedShowId !== 'all'
                                  ? (() => {
                                      const show = endedShows.find((s: any) => s._id === selectedShowId);
                                      const showDate = show?.date || show?.startDate || show?.createdAt;
                                      const formattedDate = showDate 
                                        ? format(new Date(showDate), "d MMM yyyy • HH:mm") 
                                        : "";
                                      const showTitle = show?.title || `Show #${selectedShowId.slice(-8)}`;
                                      return (
                                        <>
                                          <div className="font-medium">{showTitle}</div>
                                          {formattedDate && <div className="text-xs">{formattedDate}</div>}
                                        </>
                                      );
                                    })()
                                  : '-'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-sm font-medium text-foreground">Total Orders:</span>
                            <span className="text-sm text-muted-foreground" data-testid="text-scan-form-total-orders">{totalOrders}</span>
                          </div>

                          {!allOrdersHaveShipmentId && (
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-sm font-medium text-foreground">Orders without labels:</span>
                              <span className="text-sm text-red-600 dark:text-red-400 font-medium" data-testid="text-scan-form-orders-without-labels">{ordersWithoutShipmentId.length}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground" data-testid="text-scan-form-description">
                          This will generate a USPS scan form for all {selectedShowId === 'marketplace' ? 'marketplace orders' : 'orders in this show'}. 
                          Make sure all shipping labels have been purchased before proceeding.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-scan-form">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleGenerateScanForm}
                      disabled={ordersLoading || ordersIsError || orders.length === 0 || !allOrdersHaveShipmentId || generateScanFormMutation.isPending || !!scanFormError}
                      data-testid="button-confirm-scan-form"
                    >
                      {generateScanFormMutation.isPending ? "Generating..." : "Generate Scan Form"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Actions */}
        <div className="mb-6">
          <div className="w-full flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                1-{displayItems.length} of {displayItems.length}
              </div>
              {selectedOrders.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {selectedOrders.length} selected
                  </span>
                  <Dialog
                    open={showBundleDialog}
                    onOpenChange={setShowBundleDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCreateBundle}
                        disabled={selectedOrders.length < 2}
                        data-testid="button-create-bundle"
                      >
                        <Package2 size={14} className="mr-1" />
                        Bundle ({selectedOrders.length})
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Shipment Bundle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label
                          htmlFor="bundleName"
                          className="text-sm font-medium"
                        >
                          Bundle Name
                        </label>
                        <Input
                          id="bundleName"
                          value={bundleName}
                          onChange={(e) => setBundleName(e.target.value)}
                          placeholder="Enter bundle name"
                          className="mt-1"
                          data-testid="input-bundle-name"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowBundleDialog(false)}
                          data-testid="button-cancel-bundle"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={confirmCreateBundle}
                          disabled={createBundleMutation.isPending}
                          data-testid="button-confirm-bundle"
                        >
                          Create Bundle
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleBulkLabelPurchase}
                    disabled={selectedOrders.length === 0}
                    data-testid="button-buy-labels"
                  >
                    <Printer size={14} className="mr-1" />
                    Buy Labels ({selectedOrders.length})
                  </Button>
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
                          selectedOrders.length ===
                            orders.filter(
                              (order) => order.status === "processing",
                            ).length &&
                          orders.filter(
                            (order) => order.status === "processing",
                          ).length > 0
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
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                          <p className="text-muted-foreground">Loading shipments...</p>
                        </div>
                      </td>
                    </tr>
                  ) : displayItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <Package2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No shipments found</h3>
                        <p className="text-muted-foreground">
                          {statusFilter !== "all" || selectedShowId !== "all" || debouncedSearchQuery
                            ? "Try adjusting your filters or search" 
                            : "Shipments will appear here when you have orders to ship"}
                        </p>
                      </td>
                    </tr>
                  ) : displayItems.map((order) => {
                    return (
                      <React.Fragment key={order._id}>
                        <tr 
                          data-testid={`row-shipment-${order._id}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={(e) => {
                            // Don't open drawer if clicking on checkbox, button, or dropdown
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('input') || target.closest('[role="menuitem"]')) {
                              return;
                            }
                            // Open appropriate drawer based on order status
                            if (order.status === "ready_to_ship" || order.status === "shipped") {
                              setShipmentDetailsOrder(order);
                              setShipmentDetailsOpen(true);
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
                              disabled={order.status !== "processing"}
                              className={
                                order.status !== "processing"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
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
                                  // Add items total if present
                                  if (order.items && order.items.length > 0) {
                                    subtotal += order.items.reduce((sum, item) => {
                                      const quantity = item.quantity || 0;
                                      const price = item.price || 0;
                                      return sum + (quantity * price);
                                    }, 0);
                                  }
                                  // Giveaways are $0, so no need to add anything for them
                                  return (subtotal + (order.tax || 0) + (order.shipping_fee || 0)).toFixed(2);
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-center text-sm text-muted-foreground">
                              <div className="text-xs">
                                {(() => {
                                  // If order has weight at top level, use it
                                  if (order.weight) {
                                    return `${order.weight}${order.scale || "oz"}`;
                                  }
                                  // Calculate total weight from items + giveaway
                                  let totalWeight = 0;
                                  let scale = "oz";
                                  if (order.items && order.items.length > 0) {
                                    order.items.forEach(item => {
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
                                className={`${statusColors[order.status as keyof typeof statusColors]} text-xs`}
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
                                  {/* View & Unbundle option for multi-item orders (not ready_to_ship and no label) */}
                                  {!order.giveaway && order.items && order.items.length > 1 && order.status !== "ready_to_ship" && !(order as any).shipment_id && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setUnbundleOrderId(order._id);
                                        setUnbundleOrderDialogOpen(true);
                                      }}
                                      data-testid={`menu-unbundle-${order._id}`}
                                    >
                                      <Unlink2 size={14} className="mr-2" />
                                      View & Unbundle
                                    </DropdownMenuItem>
                                  )}

                                  {/* Edit/Ship Label option for processing orders */}
                                  {order.status === "processing" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setShippingDrawerOrder(order);
                                        setShippingDrawerOpen(true);
                                      }}
                                    >
                                      <Eye size={14} className="mr-2" />
                                      Edit/Ship Label
                                    </DropdownMenuItem>
                                  )}

                                  {/* Approve/Decline cancellation options for pending_cancellation orders */}
                                  {order.status === "pending_cancellation" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setCancellationOrderId(order._id);
                                          setApproveDialogOpen(true);
                                        }}
                                        data-testid={`menu-approve-cancellation-${order._id}`}
                                        className="text-green-600"
                                      >
                                        <CheckCircle size={14} className="mr-2" />
                                        Approve Cancellation
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setCancellationOrderId(order._id);
                                          setDeclineDialogOpen(true);
                                        }}
                                        data-testid={`menu-decline-cancellation-${order._id}`}
                                        className="text-red-600"
                                      >
                                        <XCircle size={14} className="mr-2" />
                                        Decline Cancellation
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}

                                  {/* Options for ready_to_ship orders */}
                                  {order.status === "ready_to_ship" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (order.label) {
                                            window.open(order.label, '_blank');
                                          } else {
                                            toast({
                                              title: "No label available",
                                              description: "This order doesn't have a shipping label",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                        data-testid={`menu-view-label-${order._id}`}
                                      >
                                        <Eye size={14} className="mr-2" />
                                        View Label
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setShipmentDetailsOrder(order);
                                          setShipmentDetailsOpen(true);
                                        }}
                                        data-testid={`menu-view-details-${order._id}`}
                                      >
                                        <Package2 size={14} className="mr-2" />
                                        View Shipment Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          handleMarkAsShipped(order._id);
                                        }}
                                        data-testid={`menu-mark-shipped-${order._id}`}
                                      >
                                        <Ship size={14} className="mr-2" />
                                        Mark as Shipped
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* Reprint option for shipped orders */}
                                  {(order.status === "shipped" ||
                                    order.status === "delivered") && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setShippingDrawerOrder(order);
                                        setShippingDrawerOpen(true);
                                      }}
                                    >
                                      <Printer size={14} className="mr-2" />
                                      Reprint Label
                                    </DropdownMenuItem>
                                  )}

                                  {/* Cancel order option for non-cancelled/shipped/failed orders */}
                                  {order.status !== "cancelled" &&
                                    order.status !== "shipped" &&
                                    order.status !== "failed" &&
                                    order.status !== "payment_failed" &&
                                    !order.tracking_number &&
                                    !(order as any).tracking_url && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          data-testid={`menu-cancel-${order._id}`}
                                          onClick={() => {
                                            setCancelOrderId(order._id);
                                            setCancelAlertOpen(true);
                                          }}
                                        >
                                          <X size={14} className="mr-2" />
                                          Cancel Order
                                        </DropdownMenuItem>
                                      </>
                                    )
                                  }
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
                                        <th className="text-center py-2 px-2 font-medium text-muted-foreground">Actions</th>
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
                                          <td className="py-2 px-2 text-center">
                                            {(order.giveaway as any)?.status === 'pending_cancellation' ? (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    data-testid={`button-giveaway-actions-${order.giveaway._id}`}
                                                  >
                                                    <MoreHorizontal size={16} />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem
                                                    onClick={() => {
                                                      setCancellationOrderId(order._id);
                                                      setCancellationItemId((order.giveaway as any)._id || null);
                                                      setApproveDialogOpen(true);
                                                    }}
                                                    data-testid={`button-approve-item-${order.giveaway._id}`}
                                                    className="text-green-600"
                                                  >
                                                    <CheckCircle size={14} className="mr-2" />
                                                    Approve
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => {
                                                      setCancellationOrderId(order._id);
                                                      setCancellationItemId((order.giveaway as any)._id || null);
                                                      setDeclineDialogOpen(true);
                                                    }}
                                                    data-testid={`button-decline-item-${order.giveaway._id}`}
                                                    className="text-red-600"
                                                  >
                                                    <XCircle size={14} className="mr-2" />
                                                    Reject
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            ) : '-'}
                                          </td>
                                        </tr>
                                      )}
                                      {order.items && order.items.length > 0 && (
                                        order.items.map((item, idx) => {
                                          const itemStatus = (item as any).status || order.status;
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
                                                  <p className="font-medium">{item.productId?.name ? `${item.productId.name}${(item as any).order_reference ? ` ${(item as any).order_reference}` : ''}` : ((item as any).order_reference ? `${(item as any).order_reference}` : 'Item')}</p>
                                                  <p className="text-xs text-muted-foreground lowercase">{item.productId?.category?.name || '-'}</p>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="py-2 px-2">{item.quantity || 1}</td>
                                            <td className="py-2 px-2">{item.weight ? `${item.weight} ${item.scale || ''}` : '-'}</td>
                                            <td className="py-2 px-2">${(item.price || 0).toFixed(2)}</td>
                                            <td className="py-2 px-2">${(item.shipping_fee || 0).toFixed(2)}</td>
                                            <td className="py-2 px-2 text-center">
                                              {(item as any).seller_shipping_fee_pay && (item as any).seller_shipping_fee_pay > 0 
                                                ? `$${(item as any).seller_shipping_fee_pay.toFixed(2)}`
                                                : '-'}
                                            </td>
                                            <td className="py-2 px-2">{(item as any).orderType || (order.tokshow ? 'Show' : 'Marketplace')}</td>
                                            <td className="py-2 px-2 text-xs text-muted-foreground">
                                              {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="py-2 px-2">
                                              <span className={`px-2 py-1 rounded-md text-xs ${statusColors[itemStatus as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
                                                {itemStatus?.replace(/_/g, ' ') || 'unfulfilled'}
                                              </span>
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                              {(itemStatus === 'pending_cancellation' || (item as any).videoReceipt) ? (
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      data-testid={`button-item-actions-${item._id || idx}`}
                                                    >
                                                      <MoreHorizontal size={16} />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    {(item as any).videoReceipt && (
                                                      <DropdownMenuItem
                                                        onClick={() => {
                                                          setVideoReceiptUrl((item as any).videoReceipt);
                                                          setVideoReceiptDialogOpen(true);
                                                        }}
                                                        data-testid={`button-video-receipt-${item._id || idx}`}
                                                      >
                                                        <Video size={14} className="mr-2" />
                                                        Video Receipt
                                                      </DropdownMenuItem>
                                                    )}
                                                    {itemStatus === 'pending_cancellation' && (
                                                      <>
                                                        {(item as any).videoReceipt && <DropdownMenuSeparator />}
                                                        <DropdownMenuItem
                                                          onClick={() => {
                                                            setCancellationOrderId(order._id);
                                                            setCancellationItemId(item._id || null);
                                                            setApproveDialogOpen(true);
                                                          }}
                                                          data-testid={`button-approve-item-${item._id || idx}`}
                                                          className="text-green-600"
                                                        >
                                                          <CheckCircle size={14} className="mr-2" />
                                                          Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                          onClick={() => {
                                                            setCancellationOrderId(order._id);
                                                            setCancellationItemId(item._id || null);
                                                            setDeclineDialogOpen(true);
                                                          }}
                                                          data-testid={`button-decline-item-${item._id || idx}`}
                                                          className="text-red-600"
                                                        >
                                                          <XCircle size={14} className="mr-2" />
                                                          Reject
                                                        </DropdownMenuItem>
                                                      </>
                                                    )}
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              ) : '-'}
                                            </td>
                                          </tr>
                                        );
                                        })
                                      )}
                                      {!order.giveaway && (!order.items || order.items.length === 0) && (
                                        <tr className="border-b">
                                          <td colSpan={10} className="py-4 px-2 text-center text-muted-foreground">
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

        {/* Unbundle Dialog */}
        <SelectiveUnbundleDialog
          open={unbundleOrderDialogOpen}
          onOpenChange={setUnbundleOrderDialogOpen}
          bundleOrders={
            unbundleOrderId
              ? [orders.find(o => o._id === unbundleOrderId)].filter(Boolean) as TokshopOrder[]
              : []
          }
          onUnbundle={async (itemsByOrder: Record<string, string[]>) => {
            const orderIds = Object.keys(itemsByOrder);
            for (const orderId of orderIds) {
              handleUnbundleItems(itemsByOrder[orderId]);
            }
          }}
          isPending={unbundleItemsMutation.isPending}
        />

        {/* Bulk Label Purchase Dialog */}
        <BulkLabelDialog
          open={bulkLabelDialogOpen}
          onOpenChange={setBulkLabelDialogOpen}
          orderCount={selectedOrders.length}
          onConfirm={confirmBulkLabelPurchase}
          isPending={bulkLabelMutation.isPending}
        />

        {/* Scan Form Viewer Dialog */}
        <ScanFormViewerDialog
          open={scanFormViewerOpen}
          onOpenChange={setScanFormViewerOpen}
          scanForms={scanForms}
          isLoading={isLoadingScanForms}
        />

        {/* Video Receipt Dialog */}
        <Dialog open={videoReceiptDialogOpen} onOpenChange={(open) => {
          setVideoReceiptDialogOpen(open);
          if (!open) setVideoReceiptUrl(null);
        }}>
          <DialogContent className="sm:max-w-2xl" data-testid="dialog-video-receipt">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video size={20} />
                Video Receipt
              </DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              {videoReceiptUrl && (
                <video
                  src={videoReceiptUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  data-testid="video-receipt-player"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Shipment Details Drawer */}
        <ShipmentDetailsDrawer
          open={shipmentDetailsOpen}
          onOpenChange={setShipmentDetailsOpen}
          order={shipmentDetailsOrder}
        />

        {/* Approve Cancellation Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent data-testid="dialog-approve-cancellation">
            <DialogHeader>
              <DialogTitle>Approve {cancellationItemId ? 'Item' : 'Order'} Cancellation Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this {cancellationItemId ? 'item' : 'order'} cancellation request? {cancellationItemId ? 'The item' : 'The order'} will be cancelled and the buyer will be refunded.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between space-x-2 py-4">
              <Label htmlFor="relist-switch" className="flex flex-col space-y-1">
                <span>Relist {cancellationItemId ? 'item' : 'product'}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Make the {cancellationItemId ? 'item' : 'product'} available for sale again after cancellation
                </span>
              </Label>
              <Switch
                id="relist-switch"
                checked={approveRelistOption}
                onCheckedChange={setApproveRelistOption}
                data-testid="switch-approve-relist"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setApproveDialogOpen(false);
                  setCancellationOrderId(null);
                  setCancellationItemId(null);
                  setApproveRelistOption(false);
                }}
                disabled={approveCancellationMutation.isPending}
                data-testid="button-cancel-approve"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveCancellation}
                disabled={approveCancellationMutation.isPending}
                data-testid="button-confirm-approve"
              >
                {approveCancellationMutation.isPending ? "Approving..." : "Approve Cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Cancellation Dialog */}
        <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
          <DialogContent data-testid="dialog-decline-cancellation">
            <DialogHeader>
              <DialogTitle>Decline {cancellationItemId ? 'Item' : 'Order'} Cancellation Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for declining this {cancellationItemId ? 'item' : 'order'} cancellation request. The buyer will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="decline-reason">Reason (Optional)</Label>
                <Textarea
                  id="decline-reason"
                  placeholder="Enter your reason for declining..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                  data-testid="textarea-decline-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeclineDialogOpen(false);
                  setCancellationOrderId(null);
                  setCancellationItemId(null);
                  setDeclineReason("");
                }}
                disabled={declineCancellationMutation.isPending}
                data-testid="button-cancel-decline"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeclineCancellation}
                disabled={declineCancellationMutation.isPending}
                data-testid="button-confirm-decline"
              >
                {declineCancellationMutation.isPending ? "Declining..." : "Decline Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Controlled Shipping Drawer */}
        {shippingDrawerOrder && (
          <ShippingDrawer
            order={shippingDrawerOrder}
            currentTab={statusFilter}
            open={shippingDrawerOpen}
            onOpenChange={(open) => {
              setShippingDrawerOpen(open);
              if (!open) {
                setShippingDrawerOrder(null);
              }
            }}
          />
        )}

        {/* Controlled Cancel Order Alert Dialog */}
        {cancelOrderId && (
          <AlertDialog
            open={cancelAlertOpen}
            onOpenChange={(open) => {
              setCancelAlertOpen(open);
              if (!open) {
                setCancelOrderId(null);
                setRelistOption(false);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel order #
                  {orders.find(o => o._id === cancelOrderId)?.invoice ||
                    cancelOrderId.slice(-8)}
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="flex items-center space-x-2 my-4">
                <Checkbox
                  id="relist-order"
                  checked={relistOption}
                  onCheckedChange={(checked) =>
                    setRelistOption(Boolean(checked === true))
                  }
                  data-testid="checkbox-relist"
                />
                <label htmlFor="relist-order" className="text-sm">
                  Relist this order for future processing
                </label>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setCancelOrderId(null);
                    setRelistOption(false);
                    setCancelAlertOpen(false);
                  }}
                  data-testid="button-keep-order"
                >
                  Keep Order
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelOrder}
                  disabled={cancelOrderMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                  data-testid="button-confirm-cancel"
                >
                  {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
