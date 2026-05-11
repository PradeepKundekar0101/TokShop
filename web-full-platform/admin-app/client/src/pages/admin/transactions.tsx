import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/admin-layout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CreditCard, Search, X, Printer, MoreVertical, DollarSign, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/lib/settings-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminTransactions() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [refundsPage, setRefundsPage] = useState(1);
  const [initiatePage, setInitiatePage] = useState(1);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const adminToken = localStorage.getItem('adminAccessToken');
    const userToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    console.log('[Transactions] getAuthHeaders:', {
      adminToken: adminToken ? 'present' : 'missing',
      userToken: userToken ? 'present' : 'missing',
      userData: userData ? 'present' : 'missing',
    });
    
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
    if (userToken) {
      headers['x-access-token'] = userToken;
    }
    if (userData) {
      headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
    }
    return headers;
  };

  const { data: transactionsData, isLoading } = useQuery<any>({
    queryKey: ['admin-transactions', transactionsPage, appliedSearch, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '10');
      params.append('page', String(transactionsPage));
      params.append('usertype', 'admin');
      if (appliedSearch.trim()) {
        params.append('username', appliedSearch.trim());
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      const response = await fetch(`/api/admin/transactions?${params.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
  });

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setTransactionsPage(1);
    queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
  };

  const { data: refundsData, isLoading: refundsLoading } = useQuery<any>({
    queryKey: ['admin-refunds', refundsPage],
    queryFn: async () => {
      const response = await fetch(`/api/admin/transactions?limit=10&page=${refundsPage}&status=Refunded&usertype=admin`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch refunds');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
  });

  const { data: initiateData, isLoading: initiateLoading } = useQuery<any>({
    queryKey: ['admin-initiate-transactions', initiatePage],
    queryFn: async () => {
      const response = await fetch(`/api/admin/transactions?limit=10&page=${initiatePage}&type=initiate&usertype=admin`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch initiate transactions');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
  });

  const { data: settingsData } = useQuery<any>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
  });

  const allTransactions = transactionsData?.transactions || transactionsData?.data || [];
  const supportEmail = settingsData?.support_email || '';
  const settingsStripeFee = settingsData?.stripe_fee || '0';
  const settingsExtraCharges = settingsData?.extra_charges || '0';

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'order' | 'transaction' }) => {
      toast({
        title: "Processing",
        description: "Processing refund...",
      });
      return apiRequest("PUT", `/api/admin/refund/${id}`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Transactions are now filtered by the API
  const filteredTransactions = allTransactions;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setAppliedSearch("");
    setTypeFilter("all");
    setTransactionsPage(1);
  };

  const hasActiveFilters = appliedSearch || typeFilter !== "all";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground">Transactions</h2>
            <p className="text-muted-foreground">Monitor all financial transactions</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Transactions</h2>
          <p className="text-muted-foreground">Monitor all financial transactions and refunds</p>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="refunds" data-testid="tab-refunds">
              Refunds
            </TabsTrigger>
            <TabsTrigger value="initiate" data-testid="tab-initiate">
              Initiate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    {transactionsData?.totalDocuments || allTransactions.length} transactions
                    {hasActiveFilters && ` (filtered${appliedSearch ? ` by: ${appliedSearch}` : ''}${typeFilter !== 'all' ? `, type: ${typeFilter.replace(/_/g, ' ')}` : ''})`}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex gap-2 items-center flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-9"
                    data-testid="input-search-transactions"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value);
                    setTransactionsPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="select-type-all">All</SelectItem>
                    <SelectItem value="shipping_deduction" data-testid="select-type-shipping">Shipping Deduction</SelectItem>
                    <SelectItem value="service_fee" data-testid="select-type-service-fee">Service Fee</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSearch}
                  data-testid="button-search-transactions"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? "No transactions match your filters" : "No transactions found"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Info</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: any) => {
                      const transactionId = transaction._id || transaction.id;
                      
                      const fromUser = typeof transaction.from === 'object' && transaction.from
                        ? transaction.from.userName || ''
                        : '';
                      const toUser = typeof transaction.to === 'object' && transaction.to
                        ? transaction.to.userName || ''
                        : '';
                      
                      const amount = Math.round((Number(transaction.amount) || 0) * 100) / 100;
                      const status = transaction.status || 'pending';

                      return (
                        <TableRow key={transactionId}>
                          <TableCell className="font-mono text-xs" data-testid={`text-transaction-id-${transactionId}`}>
                            {String(transactionId).slice(-8)}
                          </TableCell>
                          <TableCell data-testid={`text-info-${transactionId}`}>
                            <div className="space-y-1">
                              {fromUser && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground shrink-0">From:</span>
                                  <span className="text-sm">{fromUser}</span>
                                </div>
                              )}
                              {toUser && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground shrink-0">To:</span>
                                  <span className="text-sm">{toUser}</span>
                                </div>
                              )}
                              {transaction.reason && (
                                <div className="text-xs text-muted-foreground">{transaction.reason}</div>
                              )}
                              {!fromUser && !toUser && !transaction.reason && (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-amount-${transactionId}`}>
                            <div>
                              {(() => {
                                const formattedAmount = parseFloat(String(transaction.amount || 0)).toFixed(2);
                                return (
                                  <span className={transaction.deducting ? "text-red-600" : ""}>
                                    {transaction.deducting ? `-$${formattedAmount}` : `$${formattedAmount}`}
                                  </span>
                                );
                              })()}
                              {transaction.type === 'payout' && transaction.bank_name && (
                                <div className="text-xs text-muted-foreground">
                                  {transaction.bank_name}
                                </div>
                              )}
                              {transaction.type === 'payout' && transaction.balance_after_payout !== undefined && (
                                <div className="text-xs text-teal-600">
                                  Balance: ${parseFloat(String(transaction.balance_after_payout || 0)).toFixed(2)}
                                </div>
                              )}
                              {transaction.type !== 'payout' && (transaction.available_on || transaction.availableOn) && Number(transaction.available_on || transaction.availableOn) > 0 && (
                                <div className="text-xs text-teal-600">
                                  Available on {formatDate(transaction.available_on || transaction.availableOn)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-date-${transactionId}`}>
                            {formatDate(transaction.createdAt || transaction.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(status)} data-testid={`badge-status-${transactionId}`}>
                              {status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-actions-${transactionId}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (transaction.receipt) {
                                      window.open(transaction.receipt, '_blank');
                                    } else {
                                      setSelectedTransaction(transaction);
                                      setShowReceipt(true);
                                    }
                                  }}
                                  data-testid={`menu-print-receipt-${transactionId}`}
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print Receipt
                                </DropdownMenuItem>
                                {transaction.type !== 'service_fee' && transaction.type !== 'shipping_deduction' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const confirmed = window.confirm(
                                          `Are you sure you want to refund this transaction?\n\nTransaction ID: ${String(transactionId).slice(-8)}\nAmount: $${parseFloat(String(transaction.amount || 0)).toFixed(2)}\n\nThis action cannot be undone.`
                                        );
                                        if (confirmed) {
                                          refundMutation.mutate({ id: transactionId, type: 'transaction' });
                                        }
                                      }}
                                      disabled={refundMutation.isPending}
                                      data-testid={`menu-refund-transaction-${transactionId}`}
                                      className="text-orange-600 focus:text-orange-600"
                                    >
                                      <DollarSign className="h-4 w-4 mr-2" />
                                      Refund Transaction
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
                
                {/* Pagination */}
                {transactionsData?.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {transactionsData.currentPage || transactionsPage} of {transactionsData.totalPages} ({transactionsData.totalDocuments} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                        disabled={transactionsPage <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionsPage(p => Math.min(transactionsData.totalPages, p + 1))}
                        disabled={transactionsPage >= transactionsData.totalPages}
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

        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Refunds</CardTitle>
                  <CardDescription>
                    View all processed refunds
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {refundsLoading ? (
                <div className="text-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading refunds...</p>
                </div>
              ) : !refundsData?.data || refundsData.data.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No refunds found</p>
                </div>
              ) : (
                <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refundsData.data.map((refund: any) => {
                        const refundId = refund._id || refund.id;
                        const amount = Math.round((Number(refund.amount) || 0) * 100) / 100;
                        const fromUser = typeof refund.from === 'object' && refund.from
                          ? refund.from.userName || ''
                          : '';
                        const toUser = typeof refund.to === 'object' && refund.to
                          ? refund.to.userName || ''
                          : '';
                        
                        return (
                          <TableRow key={refundId}>
                            <TableCell className="font-mono text-xs" data-testid={`text-refund-id-${refundId}`}>
                              {String(refundId).slice(-8)}
                            </TableCell>
                            <TableCell data-testid={`text-info-${refundId}`}>
                              <div className="space-y-1">
                                {fromUser && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground shrink-0">From:</span>
                                    <span className="text-sm">{fromUser}</span>
                                  </div>
                                )}
                                {toUser && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground shrink-0">To:</span>
                                    <span className="text-sm">{toUser}</span>
                                  </div>
                                )}
                                {refund.reason && (
                                  <div className="text-xs text-muted-foreground">{refund.reason}</div>
                                )}
                                {!fromUser && !toUser && !refund.reason && (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-amount-${refundId}`}>
                              ${amount.toFixed(2)}
                            </TableCell>
                            <TableCell data-testid={`text-date-${refundId}`}>
                              {formatDate(refund.createdAt || refund.created)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(refund.status)} data-testid={`badge-status-${refundId}`}>
                                {refund.status?.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {refundsData?.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {refundsData.currentPage || refundsPage} of {refundsData.totalPages} ({refundsData.totalDocuments} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRefundsPage(p => Math.max(1, p - 1))}
                        disabled={refundsPage <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRefundsPage(p => Math.min(refundsData.totalPages, p + 1))}
                        disabled={refundsPage >= refundsData.totalPages}
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

        <TabsContent value="initiate">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Initiate Transactions</CardTitle>
                  <CardDescription>
                    View all transactions with type initiate
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {initiateLoading ? (
                <div className="text-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading initiate transactions...</p>
                </div>
              ) : !(initiateData?.transactions || initiateData?.data) || (initiateData?.transactions || initiateData?.data || []).length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No initiate transactions found</p>
                </div>
              ) : (
                <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(initiateData?.transactions || initiateData?.data || []).map((txn: any) => {
                        const txnId = txn._id || txn.id;
                        const amount = Math.round((Number(txn.amount) || 0) * 100) / 100;
                        const fromUser = typeof txn.from === 'object' && txn.from
                          ? txn.from.userName || ''
                          : '';
                        const toUser = typeof txn.to === 'object' && txn.to
                          ? txn.to.userName || ''
                          : '';

                        return (
                          <TableRow key={txnId}>
                            <TableCell className="font-mono text-xs" data-testid={`text-initiate-id-${txnId}`}>
                              {String(txnId).slice(-8)}
                            </TableCell>
                            <TableCell data-testid={`text-initiate-info-${txnId}`}>
                              <div className="space-y-1">
                                {fromUser && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground shrink-0">From:</span>
                                    <span className="text-sm">{fromUser}</span>
                                  </div>
                                )}
                                {toUser && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground shrink-0">To:</span>
                                    <span className="text-sm">{toUser}</span>
                                  </div>
                                )}
                                {txn.reason && (
                                  <div className="text-xs text-muted-foreground">{txn.reason}</div>
                                )}
                                {!fromUser && !toUser && !txn.reason && (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-initiate-amount-${txnId}`}>
                              ${amount.toFixed(2)}
                            </TableCell>
                            <TableCell data-testid={`text-initiate-date-${txnId}`}>
                              {formatDate(txn.createdAt || txn.date)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(txn.status)} data-testid={`badge-initiate-status-${txnId}`}>
                                {txn.status?.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {initiateData?.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {initiateData.currentPage || initiatePage} of {initiateData.totalPages} ({initiateData.totalDocuments} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInitiatePage(p => Math.max(1, p - 1))}
                        disabled={initiatePage <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInitiatePage(p => Math.min(initiateData.totalPages, p + 1))}
                        disabled={initiatePage >= initiateData.totalPages}
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

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction?.type === 'shipping_deduction' ? 'Shipping Deduction Receipt' :
               selectedTransaction?.type === 'service_fee' ? 'Service Fee Receipt' :
               'Transaction Receipt'}
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div id="receipt-content" className="space-y-4 p-4">
              {(() => {
                const txType = (selectedTransaction.type || '').toLowerCase();
                const receiptFromName = typeof selectedTransaction.from === 'object' && selectedTransaction.from
                  ? `${selectedTransaction.from.firstName || ''} ${selectedTransaction.from.lastName || ''}`.trim() || 
                    selectedTransaction.from.userName || 
                    selectedTransaction.from.email || ''
                  : '';
                const receiptToName = typeof selectedTransaction.to === 'object' && selectedTransaction.to
                  ? `${selectedTransaction.to.firstName || ''} ${selectedTransaction.to.lastName || ''}`.trim() || 
                    selectedTransaction.to.userName || 
                    selectedTransaction.to.email || ''
                  : '';
                const amount = parseFloat(selectedTransaction.amount) || 0;

                if (txType === 'shipping_deduction') {
                  return (
                    <>
                      <div className="text-center border-b pb-4">
                        <h2 className="text-2xl font-bold">{settings.app_name}</h2>
                        <p className="text-sm text-muted-foreground">Shipping Deduction Receipt</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transaction ID:</span>
                          <span className="font-mono text-xs break-all">{String(selectedTransaction._id || selectedTransaction.id)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{formatDate(selectedTransaction.createdAt || selectedTransaction.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="capitalize">Shipping Deduction</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={getStatusColor(selectedTransaction.status || 'pending')}>
                            {(selectedTransaction.status || 'pending').replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        {selectedTransaction.reason && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reason:</span>
                            <span>{selectedTransaction.reason}</span>
                          </div>
                        )}
                      </div>
                      {(receiptFromName || receiptToName) && (
                        <div className="border-t pt-4 space-y-2 text-sm">
                          {receiptFromName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Charged To:</span>
                              <span className="font-medium">{receiptFromName}</span>
                            </div>
                          )}
                          {receiptToName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Shipping Provider:</span>
                              <span className="font-medium">{receiptToName}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="border-t pt-4 space-y-2 text-sm">
                        {selectedTransaction.shippingFee && parseFloat(selectedTransaction.shippingFee) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping Cost:</span>
                            <span>${parseFloat(selectedTransaction.shippingFee).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                          <span>Amount Deducted:</span>
                          <span className="text-destructive">-${amount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-center text-xs text-muted-foreground border-t pt-4">
                        <p>Shipping cost deducted from seller balance.</p>
                        <p>For support, please contact {supportEmail}</p>
                      </div>
                    </>
                  );
                }

                if (txType === 'service_fee') {
                  return (
                    <>
                      <div className="text-center border-b pb-4">
                        <h2 className="text-2xl font-bold">{settings.app_name}</h2>
                        <p className="text-sm text-muted-foreground">Service Fee Receipt</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transaction ID:</span>
                          <span className="font-mono text-xs break-all">{String(selectedTransaction._id || selectedTransaction.id)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{formatDate(selectedTransaction.createdAt || selectedTransaction.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="capitalize">Platform Commission</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={getStatusColor(selectedTransaction.status || 'pending')}>
                            {(selectedTransaction.status || 'pending').replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        {selectedTransaction.reason && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reason:</span>
                            <span>{selectedTransaction.reason}</span>
                          </div>
                        )}
                      </div>
                      {(receiptFromName || receiptToName) && (
                        <div className="border-t pt-4 space-y-2 text-sm">
                          {receiptFromName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Seller:</span>
                              <span className="font-medium">{receiptFromName}</span>
                            </div>
                          )}
                          {receiptToName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Platform:</span>
                              <span className="font-medium">{receiptToName}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="border-t pt-4 space-y-2 text-sm">
                        {selectedTransaction.total && parseFloat(selectedTransaction.total) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Order Total:</span>
                            <span>${parseFloat(selectedTransaction.total).toFixed(2)}</span>
                          </div>
                        )}
                        {selectedTransaction.serviceFee && parseFloat(selectedTransaction.serviceFee) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission Rate:</span>
                            <span>${parseFloat(selectedTransaction.serviceFee).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                          <span>Commission Collected:</span>
                          <span>${amount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-center text-xs text-muted-foreground border-t pt-4">
                        <p>Platform commission deducted from seller earnings.</p>
                        <p>For support, please contact {supportEmail}</p>
                      </div>
                    </>
                  );
                }

                return (
                  <>
                    <div className="text-center border-b pb-4">
                      <h2 className="text-2xl font-bold">{settings.app_name}</h2>
                      <p className="text-sm text-muted-foreground">Transaction Receipt</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono text-xs break-all">{String(selectedTransaction._id || selectedTransaction.id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{formatDate(selectedTransaction.createdAt || selectedTransaction.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="capitalize">{(selectedTransaction.type || 'N/A').replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={getStatusColor(selectedTransaction.status || 'pending')}>
                          {(selectedTransaction.status || 'pending').replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                    {(receiptFromName || receiptToName) && (
                      <div className="border-t pt-4 space-y-2 text-sm">
                        {receiptFromName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">From:</span>
                            <span className="font-medium">{receiptFromName}</span>
                          </div>
                        )}
                        {receiptToName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">To:</span>
                            <span className="font-medium">{receiptToName}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="border-t pt-4 space-y-2 text-sm">
                      {(() => {
                        const total = parseFloat(selectedTransaction.total) || 0;
                        const shippingFee = parseFloat(selectedTransaction.shippingFee) || 0;
                        const discount = parseFloat(selectedTransaction.discount) || 0;
                        const totalWithShipping = total + shippingFee;
                        const stripeFee = parseFloat(selectedTransaction.stripe_fee) || 0;
                        const extraCharges = parseFloat(selectedTransaction.extra_charges) || 0;
                        const combined = stripeFee + extraCharges;
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total:</span>
                              <span>${totalWithShipping.toFixed(2)}</span>
                            </div>
                            {combined > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Service Charge{parseFloat(settingsStripeFee) > 0 || parseFloat(settingsExtraCharges) > 0 ? ` (${settingsStripeFee}% + ${settingsExtraCharges}%)` : ''}:</span>
                                <span className="text-destructive">-${combined.toFixed(2)}</span>
                              </div>
                            )}
                            {selectedTransaction.serviceFee && parseFloat(selectedTransaction.serviceFee) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Service Fee:</span>
                                <span className="text-destructive">-${parseFloat(selectedTransaction.serviceFee).toFixed(2)}</span>
                              </div>
                            )}
                            {shippingFee > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping Fee:</span>
                                <span className="text-destructive">-${shippingFee.toFixed(2)}</span>
                              </div>
                            )}
                            {discount > 0 && (
                              <div className="flex justify-between">
                                <span style={{ color: 'hsl(var(--primary))' }}>Discount:</span>
                                <span style={{ color: 'hsl(var(--primary))' }}>-${discount.toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                        <span>Amount:</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-center text-xs text-muted-foreground border-t pt-4">
                      <p>Thank you for your business!</p>
                      <p>For support, please contact {supportEmail}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowReceipt(false)} data-testid="button-close-receipt">
              Close
            </Button>
            <Button 
              onClick={() => {
                const content = document.getElementById('receipt-content');
                if (content) {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Receipt</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                            .space-y-4 > * + * { margin-top: 1rem; }
                            .space-y-2 > * + * { margin-top: 0.5rem; }
                            .flex { display: flex; }
                            .justify-between { justify-content: space-between; }
                            .items-center { align-items: center; }
                            .text-center { text-align: center; }
                            .border-b { border-bottom: 1px solid #ddd; padding-bottom: 1rem; }
                            .border-t { border-top: 1px solid #ddd; padding-top: 1rem; }
                            .text-muted-foreground { color: #666; }
                            .font-mono { font-family: monospace; }
                            .font-bold { font-weight: bold; }
                            .font-medium { font-weight: 500; }
                            .text-lg { font-size: 1.125rem; }
                            .text-2xl { font-size: 1.5rem; }
                            .text-xs { font-size: 0.75rem; }
                            .text-sm { font-size: 0.875rem; }
                            .capitalize { text-transform: capitalize; }
                          </style>
                        </head>
                        <body>
                          ${content.innerHTML}
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                }
              }}
              data-testid="button-print-receipt-dialog"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
