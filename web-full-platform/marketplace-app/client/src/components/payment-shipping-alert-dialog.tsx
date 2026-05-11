import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface PaymentShippingAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddInfo: () => void;
}

export function PaymentShippingAlertDialog({
  open,
  onOpenChange,
  onAddInfo,
}: PaymentShippingAlertDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto left-0 right-0 lg:left-96 lg:right-72 rounded-t-3xl"
        data-testid="sheet-payment-shipping-alert"
      >
        <div className="py-5 px-4">
          <SheetHeader className="space-y-3">
            <SheetTitle className="text-center text-lg leading-tight">
              To purchase in live shows we need your payment and shipping info
            </SheetTitle>
            <SheetDescription className="text-center text-muted-foreground text-xs leading-relaxed">
              Welcome to show! In order to bid on auctions you need to add a payment method and shipping address. All bids and purchases are final.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-5">
            <Button
              onClick={() => {
                onOpenChange(false);
                onAddInfo();
              }}
              className="w-full h-12 rounded-2xl text-sm font-medium"
              data-testid="button-add-info"
            >
              Add Info
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
