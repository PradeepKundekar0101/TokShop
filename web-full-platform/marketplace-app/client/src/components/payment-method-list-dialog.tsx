import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { CreditCard, Trash2, Loader2, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddPaymentDialog from './add-payment-dialog';

interface PaymentMethodListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PaymentMethodListDialog({
  open,
  onOpenChange,
  onSuccess,
}: PaymentMethodListDialogProps) {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  
  const userId = (user as any)?.id || (user as any)?._id;
  
  // Fetch all payment methods - always enabled to load immediately
  const { data: paymentMethods, isLoading, refetch } = useQuery({
    queryKey: [`/api/users/paymentmethod/${userId}`],
    enabled: !!userId,
  });
  
  // Refetch payment methods every time the dialog opens
  useEffect(() => {
    if (open && userId) {
      refetch();
    }
  }, [open, userId, refetch]);

  const handleAddNew = () => {
    setShowAddDialog(true);
  };

  const handlePaymentSuccess = async () => {
    setShowAddDialog(false);
    // Invalidate the cache to force a fresh fetch
    await queryClient.invalidateQueries({ 
      queryKey: [`/api/users/paymentmethod/${userId}`] 
    });
    await refetch(); // Refresh payment methods list
    await refreshUserData();
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!user) return;
    
    setSettingDefaultId(paymentMethodId);
    
    try {
      await apiRequest('PUT', '/stripe/default', {
        paymentMethodId,
        userid: userId,
      });

      toast({
        title: "Default Payment Set",
        description: "This payment method is now your default.",
      });

      await refetch();
      await refreshUserData();
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      
      toast({
        title: "Error",
        description: error?.message || "Failed to set default payment method.",
        variant: "destructive",
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!user) return;
    
    setDeletingId(paymentMethodId);
    
    try {
      await apiRequest('DELETE', '/stripe/remove', {
        paymentMethodId,
        userid: userId,
      });

      toast({
        title: "Payment Method Deleted",
        description: "Your payment method has been removed.",
      });

      await refetch();
      await refreshUserData();
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      
      toast({
        title: "Error",
        description: error?.message || "Failed to delete payment method.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const methods = Array.isArray(paymentMethods) ? paymentMethods : [];
  const hasPayment = methods.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md gap-0 [&>*]:min-w-0" data-testid="dialog-payment-methods">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Payment methods</DialogTitle>
          </DialogHeader>

          {/* Scrollable payment methods list */}
          <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6 mt-4">
            <div className="space-y-2">
              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading payment methods...</p>
                </div>
              )}

              {/* Payment Methods - Compact Design */}
              {!isLoading && hasPayment && methods.map((pm: any) => {
                const brand = pm.name || pm.brand || pm.card_type || pm.type || '';
                const last4 = pm.last4 || pm.lastFour || pm.last_four || '';
                const displayBrand = brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : '';
                
                return (
                  <div 
                    key={pm._id} 
                    className="flex flex-col gap-2 p-3 rounded-lg border border-border hover-elevate min-w-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-8 bg-muted rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm truncate">
                            {displayBrand || 'Card'} • {last4}
                          </p>
                          {pm.primary && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                              Default
                            </Badge>
                          )}
                        </div>
                        {pm.expiry && (
                          <p className="text-xs text-muted-foreground">
                            Expiry: {pm.expiry}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!pm.primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(pm._id)}
                          disabled={settingDefaultId === pm._id || deletingId === pm._id}
                          className="flex-1 h-8 text-xs"
                          data-testid={`button-set-default-${pm._id}`}
                        >
                          {settingDefaultId === pm._id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Setting...
                            </>
                          ) : (
                            'Make default'
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pm._id)}
                        disabled={deletingId === pm._id || settingDefaultId === pm._id}
                        className={`${pm.primary ? 'flex-1' : 'flex-1'} h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10`}
                        data-testid={`button-delete-payment-${pm._id}`}
                      >
                        {deletingId === pm._id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {!isLoading && !hasPayment && (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No payment methods added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleAddNew}
              className="w-full"
              data-testid="button-add-payment"
            >
              Add payment
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full"
              data-testid="button-back"
            >
              Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Add Payment Dialog */}
      <AddPaymentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

// Add default export for lazy loading compatibility
export default PaymentMethodListDialog;
