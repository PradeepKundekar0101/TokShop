import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, TrendingUp, CalendarIcon, CreditCard, Filter, X, ChevronLeft, ChevronRight, ChevronDown, Wallet, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminApplicationFees() {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    limit: '50',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string>('shipping_deduction');
  const [pendingFromDate, setPendingFromDate] = useState<Date | undefined>(undefined);
  const [pendingToDate, setPendingToDate] = useState<Date | undefined>(undefined);
  const [transferringType, setTransferringType] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const transferMutation = useMutation({
    mutationFn: async ({ type, amount }: { type: string; amount: number }) => {
      const response = await fetch('/api/admin/shipping-service-transfer', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, amount }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Transfer failed');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Transfer initiated",
        description: `${variables.type === 'shipping_deduction' ? 'Shipping deduction' : 'Service fee'} transfer of $${variables.amount.toFixed(2)} submitted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-service-pending'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTransferringType(null);
    },
  });

  const handleTransfer = (type: string, amount: number) => {
    setTransferringType(type);
    transferMutation.mutate({ type, amount });
  };

  // Build query string for revenue
  const buildRevenueQueryString = () => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (currentPage > 1) params.append('page', currentPage.toString());
    return params.toString();
  };

  const revenueQueryString = buildRevenueQueryString();

  // Fetch revenue data from /stripe/revenue
  const { data: revenueData, isLoading: revenueLoading } = useQuery<any>({
    queryKey: ['/api/admin/revenue', revenueQueryString],
    queryFn: async () => {
      const response = await fetch(`/api/admin/revenue?${revenueQueryString}`);
      if (!response.ok) throw new Error('Failed to fetch revenue');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
  });

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const adminToken = localStorage.getItem('adminAccessToken');
    const userToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (adminToken) headers['x-admin-token'] = adminToken;
    if (userToken) headers['x-access-token'] = userToken;
    if (userData) headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
    return headers;
  };

  const pendingFrom = pendingFromDate ? format(pendingFromDate, 'yyyy-MM-dd') : '';
  const pendingTo = pendingToDate ? format(pendingToDate, 'yyyy-MM-dd') : '';

  const buildPendingParams = (type: string) => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (pendingFrom) params.append('from', pendingFrom);
    if (pendingTo) params.append('to', pendingTo);
    return params.toString();
  };

  const { data: pendingData, isLoading: pendingLoading } = useQuery<any>({
    queryKey: ['admin-shipping-service-pending', pendingType, pendingFrom, pendingTo],
    queryFn: async () => {
      const response = await fetch(`/api/admin/shipping-service-pending?${buildPendingParams(pendingType)}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pending data');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const revenue = revenueData?.data || {};
  const revenueTransactions = revenue.transactions || [];
  const paginationData = revenue.pagination || {};
  const totalPages = paginationData.pages || 1;
  const totalCount = paginationData.total || 0;
  const isLoading = revenueLoading;

  const formatCurrency = (amount: number, fromCents = false) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatCurrencyFromCents = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      from: fromDate ? format(fromDate, 'yyyy-MM-dd') : '',
      to: toDate ? format(toDate, 'yyyy-MM-dd') : '',
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFilters({
      from: '',
      to: '',
      limit: '50',
    });
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const activeFiltersCount = [filters.from, filters.to].filter(f => f).length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading revenue...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Revenue</h2>
          <p className="text-muted-foreground">Platform revenue and financial overview</p>
        </div>

        <Card className="mb-6">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setPendingOpen(!pendingOpen)}
            data-testid="button-toggle-pending"
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pending Transfers</CardTitle>
                <CardDescription>Pending shipping deductions and service fees</CardDescription>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", pendingOpen && "rotate-180")} />
            </div>
          </CardHeader>
          {pendingOpen && (
            <CardContent onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Type</Label>
                    <Select value={pendingType} onValueChange={(val) => { setPendingType(val); }}>
                      <SelectTrigger className="w-[220px]" data-testid="select-pending-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipping_deduction">Shipping Deduction</SelectItem>
                        <SelectItem value="service_fee">Service Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !pendingFromDate && "text-muted-foreground")} data-testid="button-pending-from-date">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {pendingFromDate ? format(pendingFromDate, 'MMM dd, yyyy') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pendingFromDate} onSelect={setPendingFromDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !pendingToDate && "text-muted-foreground")} data-testid="button-pending-to-date">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {pendingToDate ? format(pendingToDate, 'MMM dd, yyyy') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pendingToDate} onSelect={setPendingToDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {(pendingFromDate || pendingToDate) && (
                    <Button variant="ghost" size="sm" onClick={() => { setPendingFromDate(undefined); setPendingToDate(undefined); }} data-testid="button-clear-pending-dates">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {pendingType === 'shipping_deduction' ? (
                        <DollarSign className="h-5 w-5 text-primary" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {pendingType === 'shipping_deduction' ? 'Pending Shipping Deduction' : 'Pending Service Fee'}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">{pendingType}</Badge>
                      <p className="text-2xl font-bold" data-testid="text-pending-value">
                        {pendingLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          `$${parseFloat(String(pendingData?.total ?? 0)).toFixed(2)}`
                        )}
                      </p>
                      {!pendingLoading && pendingData?.count > 0 && (
                        <p className="text-xs text-muted-foreground">{pendingData.count} pending</p>
                      )}
                    </div>
                  </div>
                  <Button
                    data-testid="button-transfer"
                    className="gap-2"
                    disabled={transferringType === pendingType || pendingLoading || !pendingData?.total}
                    onClick={() => handleTransfer(pendingType, parseFloat(String(pendingData?.total ?? 0)))}
                  >
                    {transferringType === pendingType ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                    Transfer
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stripe Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-available-balance">
                {formatCurrency(revenue.balance?.stripe_available_balance || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stripe Pending Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-balance">
                {formatCurrency(revenue.balance?.stripe_pending_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Processing payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Fees</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <div className="text-lg font-bold text-green-600" data-testid="text-available-service-fee">
                    {formatCurrency(revenue.serviceFees?.available || 0)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <div className="text-lg font-bold text-orange-600" data-testid="text-pending-service-fee">
                    {formatCurrency(revenue.serviceFees?.pending || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payouts</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <div className="text-lg font-bold text-green-600" data-testid="text-available-payouts">
                    {formatCurrency(revenue.payouts?.available || 0)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <div className="text-lg font-bold text-orange-600" data-testid="text-pending-payouts">
                    {formatCurrency(revenue.payouts?.pending || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Transaction Filters</CardTitle>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
                        data-testid="button-from-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                        data-testid="button-to-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {toDate ? format(toDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit-filter">Results per page</Label>
                  <Select
                    value={filters.limit}
                    onValueChange={(value) => setFilters({ ...filters, limit: value })}
                  >
                    <SelectTrigger id="limit-filter" data-testid="select-limit-filter">
                      <SelectValue placeholder="50" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyFilters} data-testid="button-apply-filters">
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
          </CardContent>
        </Card>

        {/* Revenue Transactions Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Revenue from platform transactions</CardDescription>
          </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">From</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">To</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Service Fee</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueTransactions.map((transaction: any) => (
                      <tr 
                        key={transaction._id} 
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="capitalize text-sm">{transaction.type?.replace(/_/g, ' ') || 'N/A'}</span>
                            {transaction.type === 'order' && (
                              <>
                                {transaction.orderId && (
                                  <span className="text-xs text-muted-foreground">{transaction.orderId}</span>
                                )}
                                {(transaction.invoiceNumber || transaction.invoice_number) && (
                                  <span className="text-xs text-muted-foreground">Invoice: {transaction.invoiceNumber || transaction.invoice_number}</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{transaction.from?.userName || 'Unknown'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{transaction.to?.userName || 'Unknown'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600 text-sm">
                            {formatCurrency(transaction.serviceFee || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <Badge 
                              variant={transaction.status === 'Pending' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {transaction.status || 'Unknown'}
                            </Badge>
                            {transaction.status === 'Pending' && (transaction.availableOn || transaction.available_on) && (
                              <span className="text-xs text-muted-foreground mt-1">
                                Available {new Date(transaction.availableOn || transaction.available_on).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {revenueTransactions.length} of {totalCount} transaction{totalCount !== 1 ? 's' : ''}
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

      </div>
    </AdminLayout>
  );
}
