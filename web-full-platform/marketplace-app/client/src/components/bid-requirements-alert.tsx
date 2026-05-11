import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Package } from 'lucide-react';

interface BidRequirementsAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPayment: () => void;
  onAddAddress: () => void;
  hasPayment: boolean;
  hasAddress: boolean;
}

export function BidRequirementsAlert({
  open,
  onOpenChange,
  onAddPayment,
  onAddAddress,
  hasPayment,
  hasAddress,
}: BidRequirementsAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md" data-testid="alert-bid-requirements">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Add Required Information
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            To bid on this auction, you need to add the following:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3 py-4">
          {!hasPayment && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onAddPayment();
              }}
              className="w-full h-12 justify-start gap-3"
              variant="outline"
              data-testid="button-add-payment-method"
            >
              <CreditCard className="h-5 w-5" />
              <span>Add Payment Method</span>
            </Button>
          )}
          
          {!hasAddress && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onAddAddress();
              }}
              className="w-full h-12 justify-start gap-3"
              variant="outline"
              data-testid="button-add-shipping-address"
            >
              <Package className="h-5 w-5" />
              <span>Add Shipping Address</span>
            </Button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
