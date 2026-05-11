import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin-layout";
import { Banknote, Search, Calendar, ChevronLeft, ChevronRight, Filter, X, Clock, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

export default function AdminPayouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("stripe");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [startingAfter, setStartingAfter] = useState<string>("");
  const itemsPerPage = 10;
  
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<{
    amount: number;
    userId: string;
    userName: string;
  } | null>(null);

  // Build query params for filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    params.append('limit', itemsPerPage.toString());
    params.append('page', currentPage.toString());
    return params.toString();
  };

  const queryParams = buildQueryParams();

  const { data: payoutsData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/stripe-payouts', statusFilter, dateFrom, dateTo, currentPage],
    queryFn: async () => {
      const url = `/api/admin/stripe-payouts${queryParams ? '?' + queryParams : ''}`;
      console.log('Fetching payouts from:', url);
      const response = await fetch(url, { credentials: 'include' });
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: pendingPayoutsData, isLoading: pendingLoading } = useQuery<any>({
    queryKey: ['pending-payouts', pendingPage],
    queryFn: async () => {
      const response = await fetch(`/api/users/payouts/pending?page=${pendingPage}&limit=10`, { 
        credentials: 'include' 
      });
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Extract payout transactions from the new data structure
  // Backend returns: {success, data: [...], transactions: [...], totalDocuments, totalPages, currentPage}
  const payouts = payoutsData?.transactions || payoutsData?.data || [];
  const totalPages = payoutsData?.totalPages || 1;
  const totalDocuments = payoutsData?.totalDocuments || payouts.length;
  
  const rawPendingData = pendingPayoutsData?.data;
  const rawPendingPayouts = Array.isArray(rawPendingData) 
    ? rawPendingData 
    : rawPendingData?.total || rawPendingData?.payouts || pendingPayoutsData?.payouts || [];
  const pendingPayouts = Array.isArray(rawPendingPayouts) ? rawPendingPayouts : [];
  const pendingTotalPages = pendingPayoutsData?.totalPages || rawPendingData?.totalPages || 1;

  // Filter payouts by bank name or payout ID
  const filteredPayouts = payouts.filter((payout: any) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const bankName = (payout.bank_name || '').toLowerCase();
      const payoutId = (payout._id || payout.payoutId || '').toLowerCase();
      if (!bankName.includes(searchLower) && !payoutId.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  // Reset to page 1 when search term changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter || dateFrom || dateTo;

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Handle previous page
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Payouts</h2>
          <p className="text-muted-foreground">Manage payout transactions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="stripe">Stripe Payouts</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="stripe">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  data-testid="button-reset-filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  data-testid="input-date-from"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  data-testid="input-date-to"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle>Payout Transactions</CardTitle>
                <CardDescription>Stripe payout history</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bank or ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-payouts"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading payouts...</p>
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="text-center py-12">
                <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No payouts found matching your search' : 'No payouts found'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Bank</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Balance After</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout: any) => {
                      const payoutId = payout._id || payout.payoutId;
                      const amount = Number(payout.amount) || 0;
                      const createdDate = payout.createdAt || payout.date;
                      const bankName = payout.bank_name || 'Bank Account';
                      const balanceAfter = payout.balance_after_payout;
                      const payoutType = payout.payout_type || 'Stripe';
                      const status = payout.status || 'Pending';
                      
                      const getStatusVariant = (s: string) => {
                        switch (s?.toLowerCase()) {
                          case 'paid': return 'default';
                          case 'pending': return 'secondary';
                          case 'processing': return 'outline';
                          case 'failed': return 'destructive';
                          default: return 'secondary';
                        }
                      };
                      
                      return (
                        <TableRow key={payoutId} data-testid={`row-payout-${payoutId}`}>
                          <TableCell data-testid={`text-bank-${payoutId}`}>
                            <div className="max-w-[200px]">
                              <div className="font-medium text-sm">{bankName}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600" data-testid={`text-amount-${payoutId}`}>
                            -${amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {balanceAfter !== undefined ? `$${Number(balanceAfter).toFixed(2)}` : 'N/A'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {createdDate ? new Date(createdDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payoutType}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={getStatusVariant(status)}>
                              {status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalDocuments} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
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
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Pending Payouts</CardTitle>
                  <CardDescription>
                    View all pending payout requests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="text-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading pending payouts...</p>
                </div>
              ) : pendingPayouts.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending payouts found</p>
                </div>
              ) : (
                <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayouts.map((payout: any, index: number) => {
                        const payoutId = payout._id || payout.id || payout.userId || `pending-${index}`;
                        const amount = payout.total || payout.amount || 0;
                        const userId = payout.userId || payout.user?._id || payout.user?.id;
                        const userName = payout.userName || payout.user?.userName || payout.user?.firstName || 'Unknown';
                        const email = payout.email || payout.user?.email;
                        const count = payout.count || 0;
                        
                        return (
                          <TableRow key={payoutId}>
                            <TableCell>
                              <div className="font-medium">{userName}</div>
                              {email && (
                                <div className="text-xs text-muted-foreground">{email}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${Number(amount).toFixed(2)}
                              {count > 0 && (
                                <div className="text-xs text-muted-foreground">{count} transactions</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {payout.status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedTransfer({ amount, userId, userName });
                                  setTransferDialogOpen(true);
                                }}
                              >
                                Transfer
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {pendingTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {pendingPage} of {pendingTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                        disabled={pendingPage <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingPage(p => Math.min(pendingTotalPages, p + 1))}
                        disabled={pendingPage >= pendingTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer <strong>${selectedTransfer ? Number(selectedTransfer.amount).toFixed(2) : '0.00'}</strong> to <strong>{selectedTransfer?.userName || 'Unknown'}</strong>?
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transferLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={transferLoading}
              onClick={async (e) => {
                e.preventDefault();
                if (!selectedTransfer) return;
                
                setTransferLoading(true);
                try {
                  const response = await fetch('/api/stripe/transfer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ 
                      amount: selectedTransfer.amount, 
                      user: selectedTransfer.userId 
                    })
                  });
                  const result = await response.json();
                  if (result.success) {
                    setTransferDialogOpen(false);
                    toast({
                      title: "Transfer Successful",
                      description: `$${Number(selectedTransfer.amount).toFixed(2)} has been transferred to ${selectedTransfer.userName}`,
                    });
                    queryClient.invalidateQueries({ queryKey: ['pending-payouts'] });
                  } else {
                    toast({
                      title: "Transfer Failed",
                      description: result.error || 'An error occurred during the transfer',
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  toast({
                    title: "Transfer Failed",
                    description: 'Failed to initiate transfer',
                    variant: "destructive",
                  });
                } finally {
                  setTransferLoading(false);
                }
              }}
            >
              {transferLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
