import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Truck, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPaymentMethods?: () => void;
  onOpenShippingAddresses?: () => void;
}

export function WalletDialog({
  open,
  onOpenChange,
  onOpenPaymentMethods,
  onOpenShippingAddresses
}: WalletDialogProps) {
  const { user } = useAuth();
  
  // Get payment method and address directly from user object
  const defaultPayment = user?.defaultpaymentmethod;
  const defaultAddress = user?.address;

  const handlePaymentClick = () => {
    onOpenChange(false);
    if (onOpenPaymentMethods) {
      onOpenPaymentMethods();
    }
  };

  const handleAddressClick = () => {
    onOpenChange(false);
    if (onOpenShippingAddresses) {
      onOpenShippingAddresses();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Wallet</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4 min-w-0">
          {/* Payment Method Section */}
          <button
            onClick={handlePaymentClick}
            className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-colors text-left"
            data-testid="button-wallet-payment"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">Payment method</h3>
              {defaultPayment ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {(() => {
                      const brand = defaultPayment.brand || defaultPayment.name;
                      if (brand) {
                        return brand.charAt(0).toUpperCase() + brand.slice(1) + ' •••• ';
                      }
                      return '•••• ';
                    })()}{defaultPayment.last4}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Add payment method</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </button>

          {/* Shipping Address Section */}
          <button
            onClick={handleAddressClick}
            className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-colors text-left"
            data-testid="button-wallet-address"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Truck className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">Shipping address</h3>
              {defaultAddress ? (
                <p className="text-sm text-muted-foreground truncate">
                  {(() => {
                    const parts = [];
                    if (defaultAddress.name) parts.push(defaultAddress.name);
                    if (defaultAddress.addrress1 || defaultAddress.address1) {
                      parts.push(defaultAddress.addrress1 || defaultAddress.address1);
                    }
                    if (defaultAddress.city) parts.push(defaultAddress.city);
                    if (defaultAddress.state) parts.push(defaultAddress.state);
                    if (defaultAddress.zipcode) parts.push(defaultAddress.zipcode);
                    return parts.join(', ') || 'Address on file';
                  })()}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Add shipping address</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WalletDialog;
