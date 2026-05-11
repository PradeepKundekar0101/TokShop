import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Info, Loader2, Plus, Trash2, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Payouts() {
  const { user } = useAuth();
  const { appName } = useSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBankSettings, setShowBankSettings] = useState(false);
  const limit = 20;

  const userId = (user as any)?._id || user?.id;

  const { data: freshUserData } = useQuery<any>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    gcTime: 0,
  });

  const currentUser = freshUserData || user;
  const walletBalance = (currentUser as any)?.wallet || 0;
  const walletPending = (currentUser as any)?.walletPending || (currentUser as any)?.wallet_pending || (currentUser as any)?.pendingBalance || (currentUser as any)?.pending_balance || 0;

  const { data: banksData } = useQuery<any>({
    queryKey: ['user-banks', userId],
    queryFn: async () => {
      const response = await fetch('/api/user/banks', { credentials: 'include' });
      if (!response.ok) return { banks: [] };
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled: !!userId,
    retry: false,
  });

  const banks = Array.isArray(banksData) ? banksData : (banksData?.banks || banksData?.data || []);
  const stripeConnectAccount = (currentUser as any)?.stripeConnectAccount || (currentUser as any)?.stripe_connect_account;

  const { data: payoutsData, isLoading } = useQuery<any>({
    queryKey: ['seller-payouts', userId, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      const response = await fetch(`/api/user/payouts?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch payouts');
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled: !!userId,
  });

  const allPayouts = payoutsData?.payouts || payoutsData?.data || [];
  const totalPages = payoutsData?.pages || payoutsData?.totalPages || 1;

  const formatDateTime = (dateString: string | number) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'number' 
        ? new Date(dateString * 1000) 
        : new Date(dateString);
      return format(date, "MMM d, yyyy, h:mm a 'GMT'xxx");
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: string) => {
    const isCompleted = status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'completed';
    return (
      <span className={`flex items-center gap-1 ${isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
        {isCompleted ? 'Completed' : status}
        <Info className="h-3 w-3" />
      </span>
    );
  };

  const handleStartPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }

    if (amount > walletBalance) {
      toast({
        title: "Insufficient balance",
        description: "You cannot withdraw more than your available balance",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create payout');
      }

      toast({
        title: "Payout initiated",
        description: `$${amount.toFixed(2)} is being sent to your bank account`,
      });

      setPayoutAmount("");
      queryClient.invalidateQueries({ queryKey: ['seller-payouts'] });
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${userId}`] });
    } catch (error: any) {
      toast({
        title: "Payout failed",
        description: error.message || "Failed to initiate payout",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-4 sm:py-6">
      <div className="px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Account Balance</CardTitle>
              <div className="text-3xl font-bold">${walletBalance.toFixed(2)}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="font-medium">${walletBalance.toFixed(2)} available for payout</div>
                <div className="text-sm text-muted-foreground">These funds are available to initiate payout to your bank account.</div>
              </div>
              <div className="text-sm text-muted-foreground">
                ${walletPending.toFixed(2)} processing
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payout Options</CardTitle>
              <div className="text-sm text-muted-foreground">We'll send your payout to the selected bank account.</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account</label>
                {banks.length > 0 ? (
                  <Select defaultValue={banks[0]?.id || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank: any) => (
                        <SelectItem key={bank.id || bank._id} value={bank.id || bank._id}>
                          {bank.bank_name || bank.bankName || 'Bank Account'} ****{bank.last4}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : stripeConnectAccount ? (
                  <div className="border rounded-md p-2 text-sm bg-muted/50">
                    Stripe Connect Account
                  </div>
                ) : (
                  <div className="border rounded-md p-2 text-sm text-muted-foreground bg-muted/50">
                    No payout account linked
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="pl-7"
                    min="0"
                    max={walletBalance}
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowBankSettings(true)}
                >
                  Edit Payout Settings
                </Button>
                <Button 
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                  onClick={handleStartPayout}
                  disabled={isSubmitting || !payoutAmount || parseFloat(payoutAmount) <= 0 || walletBalance <= 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Start Payout'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Once you've started a payout, funds typically arrive within 1-2 business days.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Payout History</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : allPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payouts yet
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Amount</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Date Initiated</TableHead>
                      <TableHead>Arrival Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayouts.map((payout: any) => {
                      const payoutId = payout._id || payout.id;
                      const amount = payout.amount 
                        ? (typeof payout.amount === 'number' 
                          ? (payout.amount > 100 ? payout.amount / 100 : payout.amount) 
                          : parseFloat(payout.amount))
                        : 0;
                      const destination = payout.destination?.bank_name || payout.bank_name || payout.method || 'Bank';
                      
                      return (
                        <TableRow key={payoutId}>
                          <TableCell className="font-medium">${amount.toFixed(2)}</TableCell>
                          <TableCell>{destination}</TableCell>
                          <TableCell>{formatDateTime(payout.created || payout.createdAt)}</TableCell>
                          <TableCell>{formatDateTime(payout.arrival_date || payout.arrivalDate || payout.completedAt)}</TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={showBankSettings} onOpenChange={setShowBankSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payout Settings</DialogTitle>
            <DialogDescription>
              Manage your bank accounts for receiving payouts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Your Bank Accounts</h4>
              {banks.length > 0 ? (
                <div className="space-y-2">
                  {banks.map((bank: any) => (
                    <div 
                      key={bank.id || bank._id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {bank.bank_name || bank.bankName || 'Bank Account'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ****{bank.last4}
                          </div>
                        </div>
                      </div>
                      {bank.default_for_currency && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No bank accounts linked</p>
                  <p className="text-xs mt-1">Add a bank account to receive payouts</p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-3">
                To add a new bank account, go to the {appName} mobile app under Payouts.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowBankSettings(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
