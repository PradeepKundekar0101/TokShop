import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Search, X, Printer, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Transactions() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const limit = 20;

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const { data: transactionsData, isLoading } = useQuery<any>({
    queryKey: ['user-transactions', currentPage, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/user/transactions?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
  });

  const { data: settingsData } = useQuery<any>({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const response = await fetch('/api/public/settings', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const result = await response.json();
      return result.success ? result.data : result;
    },
  });

  const allTransactions = transactionsData?.transactions || transactionsData?.data || [];
  const totalPages = transactionsData?.pages || transactionsData?.totalPages || 1;
  const totalTransactions = transactionsData?.total || transactionsData?.totalRecords || 0;
  
  const supportEmail = settingsData?.support_email || '';
  const settingsStripeFee = settingsData?.stripe_fee || '0';
  const settingsExtraCharges = settingsData?.extra_charges || '0';

  const filteredTransactions = allTransactions.filter((transaction: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction._id?.toLowerCase().includes(searchLower) ||
      transaction.type?.toLowerCase().includes(searchLower) ||
      transaction.status?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewReceipt = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      completed: { label: "Completed", variant: "default" },
      pending: { label: "Pending", variant: "secondary" },
      failed: { label: "Failed", variant: "destructive" },
      refunded: { label: "Refunded", variant: "outline" },
    };
    const config = statusMap[status?.toLowerCase()] || { label: status || 'Unknown', variant: "outline" };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      payment: { label: "Payment", variant: "default" },
      refund: { label: "Refund", variant: "secondary" },
      payout: { label: "Payout", variant: "outline" },
    };
    const config = typeMap[type?.toLowerCase()] || { label: type || 'Unknown', variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="py-4 sm:py-6">
      <div className="px-4 sm:px-6 md:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2" data-testid="text-transactions-title">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
            My Transactions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            View your transaction history and receipts
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>All your payments, refunds, and payouts</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-9"
                      data-testid="input-search"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchTerm("")}
                        data-testid="button-clear-search"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                {statusFilter !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusFilterChange("all")}
                    data-testid="button-clear-filter"
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" ? "No transactions found" : "No transactions yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction._id} data-testid={`row-transaction-${transaction._id}`}>
                          <TableCell className="font-medium">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{transaction.reason || '-'}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {(() => {
                              const txUserId = user?.id || user?._id;
                              const isPurchase = transaction.type === 'order' || transaction.type === 'sale' || transaction.type === 'purchase';
                              const fromId = typeof transaction.from === 'object' ? transaction.from?._id : transaction.from;
                              const isBuyer = txUserId && fromId === txUserId;

                              if (isPurchase && isBuyer && parseFloat(transaction.total) > 0) {
                                const orderTotal = (parseFloat(transaction.total) || 0) + (parseFloat(transaction.shippingFee) || 0) - (parseFloat(transaction.discount) || 0);
                                return <span>${orderTotal.toFixed(2)}</span>;
                              }

                              return (
                                <div>
                                  <span>${(parseFloat(transaction.amount) || 0).toFixed(2)}</span>
                                  {transaction.type === 'payout' && transaction.bank_name && (
                                    <div className="text-xs text-muted-foreground">
                                      {transaction.bank_name}
                                    </div>
                                  )}
                                  {isPurchase && !isBuyer && (transaction.available_on || transaction.availableOn) && Number(transaction.available_on || transaction.availableOn) > 0 && (
                                    <div className="text-xs text-teal-600">
                                      Available {new Date(Number(transaction.available_on || transaction.availableOn)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(transaction)}
                              data-testid={`button-view-receipt-${transaction._id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Showing page {currentPage} of {totalPages} ({totalTransactions} total)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div id="receipt-content-user-transactions" className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">Receipt</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Transaction ID: <span className="font-mono">{selectedTransaction._id}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(selectedTransaction.createdAt)}
                </p>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{selectedTransaction.type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{selectedTransaction.status || 'N/A'}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                {(() => {
                  const isPurchaseTransaction = selectedTransaction.type === 'sale' || 
                                                selectedTransaction.type === 'purchase' ||
                                                selectedTransaction.type === 'order';
                  
                  if (!isPurchaseTransaction) {
                    const isPayout = selectedTransaction.type?.toLowerCase() === 'payout';
                    return (
                      <>
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Amount:</span>
                          <span className={isPayout ? 'text-red-500' : ''}>{isPayout ? '-' : ''}${(parseFloat(selectedTransaction.amount) || 0).toFixed(2)}</span>
                        </div>
                        {isPayout && selectedTransaction.bank_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span>{selectedTransaction.bank_name}</span>
                          </div>
                        )}
                        {isPayout && selectedTransaction.balance_after_payout !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Balance After Payout:</span>
                            <span className="text-teal-600">${parseFloat(String(selectedTransaction.balance_after_payout || 0)).toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    );
                  }

                  const total = parseFloat(selectedTransaction.total) || 0;
                  const stripeFee = parseFloat(selectedTransaction.stripe_fee) || 0;
                  const serviceFee = parseFloat(selectedTransaction.serviceFee) || 0;
                  const shippingFee = parseFloat(selectedTransaction.shippingFee) || 0;
                  const discount = parseFloat(selectedTransaction.discount) || 0;
                  const extraCharges = parseFloat(selectedTransaction.extra_charges) || 0;
                  const amount = parseFloat(selectedTransaction.amount) || 0;

                  const receiptUserId = user?.id || user?._id;
                  const receiptFromId = typeof selectedTransaction.from === 'object' ? selectedTransaction.from?._id : selectedTransaction.from;
                  const isBuyer = receiptUserId && receiptFromId === receiptUserId;

                  if (isBuyer) {
                    const totalPaid = total + shippingFee;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                        {shippingFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping:</span>
                            <span>${shippingFee.toFixed(2)}</span>
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="flex justify-between" style={{ color: 'hsl(var(--primary))' }}>
                            <span>Discount:</span>
                            <span>-${discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                          <span>Total Paid:</span>
                          <span>${(totalPaid - discount).toFixed(2)}</span>
                        </div>
                      </>
                    );
                  }

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                      {shippingFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping Fee:</span>
                          <span>${shippingFee.toFixed(2)}</span>
                        </div>
                      )}
                      {stripeFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transaction Fee:</span>
                          <span className="text-destructive">-${stripeFee.toFixed(2)}</span>
                        </div>
                      )}
                      {serviceFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Fee:</span>
                          <span className="text-destructive">-${serviceFee.toFixed(2)}</span>
                        </div>
                      )}
                      {extraCharges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Extra Charges:</span>
                          <span className="text-destructive">-${extraCharges.toFixed(2)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between" style={{ color: 'hsl(var(--primary))' }}>
                          <span>Discount:</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                        <span>Earnings:</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                      {(selectedTransaction.available_on || selectedTransaction.availableOn) && Number(selectedTransaction.available_on || selectedTransaction.availableOn) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available On:</span>
                          <span className="text-teal-600">{new Date(Number(selectedTransaction.available_on || selectedTransaction.availableOn)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>Thank you for your business!</p>
                <p>For support, please contact {supportEmail}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowReceipt(false)} data-testid="button-close-receipt">
              Close
            </Button>
            <Button 
              onClick={() => {
                const content = document.getElementById('receipt-content-user-transactions');
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
                            .text-destructive { color: #dc2626; }
                          </style>
                        </head>
                        <body>
                          ${content.innerHTML}
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }
              }}
              data-testid="button-print"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
