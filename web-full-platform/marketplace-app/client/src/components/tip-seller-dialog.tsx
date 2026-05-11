import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, 
  ChevronRight,
  Loader2,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";

interface TipSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller: any;
  onOpenPaymentMethods?: () => void;
}

// Predefined tip amounts
const TIP_AMOUNTS = [5, 10, 20, 50, 100];

export function TipSellerDialog({ 
  open, 
  onOpenChange, 
  seller,
  onOpenPaymentMethods
}: TipSellerDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTip, setSelectedTip] = useState<number>(10);
  const [customTip, setCustomTip] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  const userId = (user as any)?._id || (user as any)?.id || user?.id;

  // Fetch default payment method
  const { data: defaultPaymentData } = useQuery({
    queryKey: [`/api/users/paymentmethod/default/${userId}`],
    enabled: open && !!userId,
  });

  // Extract payment method - API may return it wrapped in .data or directly
  const defaultPayment = (defaultPaymentData as any)?.data 
    ? (defaultPaymentData as any).data 
    : (defaultPaymentData || null);

  // Payment processing fee (matching Flutter: AppConfig.tipProcessing)
  const PROCESSING_FEE = 0.30; // $0.30 fixed fee
  
  const tipAmount = isCustom 
    ? (parseFloat(customTip) || 0) 
    : selectedTip;
  const subtotal = tipAmount;
  const total = subtotal + PROCESSING_FEE;

  const tipMutation = useMutation({
    mutationFn: async () => {
      const sellerId = seller._id || seller.id;
      
      const payload = {
        amount: tipAmount.toString(),
        from: userId,
        to: sellerId,
        note: "tip",
      };
      
      // POST to tip endpoint
      return await apiRequest('POST', '/users/tip', payload);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Tip Sent!",
        description: `Successfully sent $${tipAmount.toFixed(2)} to ${seller.userName || seller.username || 'seller'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/users/tip'] });
      onOpenChange(false);
      // Reset to default
      setSelectedTip(10);
      setCustomTip("");
      setIsCustom(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.error || error?.message || "Failed to send tip";
      toast({
        title: "Tip Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSendTip = () => {
    // Validation checks
    if (!defaultPayment) {
      toast({
        title: "No Payment Method",
        description: "Please add a payment method first",
        variant: "destructive",
      });
      return;
    }
    if (tipAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount",
        variant: "destructive",
      });
      return;
    }
    tipMutation.mutate();
  };

  const handleCustomTipChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    setCustomTip(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Send a Tip</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Seller Info */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg">
            {seller?.profileImage && (
              <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-zinc-800">
                <img 
                  src={seller.profileImage} 
                  alt={seller.userName || seller.username}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-base">
                {seller?.userName || seller?.username || 'Seller'}
              </p>
              <p className="text-sm text-zinc-400">Tip your favorite seller</p>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Tip Amount Selection */}
          <div>
            <p className="text-sm font-semibold mb-3">Select Tip Amount</p>
            <div className="grid grid-cols-3 gap-2">
              {TIP_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={!isCustom && selectedTip === amount ? "default" : "outline"}
                  className={`h-12 ${
                    !isCustom && selectedTip === amount
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                  onClick={() => {
                    setSelectedTip(amount);
                    setIsCustom(false);
                    setCustomTip("");
                  }}
                  data-testid={`button-tip-${amount}`}
                >
                  ${amount}
                </Button>
              ))}
            </div>
            
            {/* Custom Amount */}
            <div className="mt-3">
              <Button
                variant={isCustom ? "default" : "outline"}
                className={`w-full h-12 mb-2 ${
                  isCustom
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
                onClick={() => setIsCustom(true)}
                data-testid="button-tip-custom"
              >
                Custom Amount
              </Button>
              {isCustom && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={customTip}
                    onChange={(e) => handleCustomTipChange(e.target.value)}
                    className="pl-7 h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    data-testid="input-custom-tip"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Payment Method */}
          <div>
            <p className="text-sm font-semibold mb-2">Payment Method</p>
            <button
              onClick={onOpenPaymentMethods}
              className="w-full flex items-center justify-between py-3 hover:bg-zinc-800/50 rounded-lg px-2 transition-colors"
              data-testid="button-payment-method"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-zinc-400" />
                {defaultPayment ? (
                  <div className="text-left">
                    <p className="text-sm">{defaultPayment.brand?.toUpperCase()} •••• {defaultPayment.last4}</p>
                    {defaultPayment.exp_month && defaultPayment.exp_year && (
                      <p className="text-xs text-zinc-400">
                        Expires {String(defaultPayment.exp_month).padStart(2, '0')}/{defaultPayment.exp_year}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">Add payment method</span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Price Breakdown */}
          <div className="space-y-2 bg-zinc-800/30 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Tip Amount</span>
              <span className="font-medium">${tipAmount.toFixed(2)}</span>
            </div>
            
            {/* Processing Fee Info */}
            <div className="flex justify-between text-sm items-start">
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Payment Processing Fee</span>
                <Info className="h-3 w-3 text-zinc-500" />
              </div>
              <span className="font-medium">${PROCESSING_FEE.toFixed(2)}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              A small fee to cover payment processing costs
            </p>
            
            <Separator className="bg-zinc-700 my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={() => onOpenChange(false)}
              disabled={tipMutation.isPending}
              data-testid="button-cancel-tip"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleSendTip}
              disabled={tipMutation.isPending || !defaultPayment || tipAmount <= 0}
              data-testid="button-send-tip"
            >
              {tipMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send Tip - $${total.toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add default export for lazy loading compatibility
export default TipSellerDialog;
