import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  shippingEstimate?: any;
  onContinueWithOffer?: (offerPrice: number) => void;
}

type OfferOption = "-20%" | "-15%" | "-10%" | "-5%" | "custom";

export function MakeOfferDialog({ 
  open, 
  onOpenChange, 
  product,
  shippingEstimate,
  onContinueWithOffer
}: MakeOfferDialogProps) {
  const { theme } = useSettings();
  const [selectedOption, setSelectedOption] = useState<OfferOption>("-10%");
  const [customPrice, setCustomPrice] = useState<string>("");
  
  // Convert AARRGGBB format to CSS hex color
  const getHexColor = (color: string): string => {
    if (!color) return '';
    // Remove alpha channel if present (AARRGGBB -> RRGGBB)
    if (color.length === 8) {
      return `#${color.substring(2)}`;
    }
    return color.startsWith('#') ? color : `#${color}`;
  };
  
  const buttonBgColor = getHexColor(theme.button_color);
  const buttonTextColor = getHexColor(theme.button_text_color);

  const productPrice = product?.price || 0;

  const shippingCost = shippingEstimate?.shippingCost || shippingEstimate?.shipping_cost || shippingEstimate?.amount || 0;
  const tax = shippingEstimate?.tax || 0;

  const percentageOptions: { value: OfferOption; label: string; discount: number }[] = [
    { value: "-20%", label: "-20%", discount: 0.20 },
    { value: "-15%", label: "-15%", discount: 0.15 },
    { value: "-10%", label: "-10%", discount: 0.10 },
    { value: "-5%", label: "-5%", discount: 0.05 },
  ];

  const calculateOfferAmount = (): number => {
    if (selectedOption === "custom") {
      return parseFloat(customPrice) || 0;
    }
    const option = percentageOptions.find(opt => opt.value === selectedOption);
    if (option) {
      return Math.round((productPrice * (1 - option.discount)) * 100) / 100;
    }
    return productPrice;
  };

  const offerAmount = calculateOfferAmount();

  useEffect(() => {
    if (open) {
      setSelectedOption("-10%");
      setCustomPrice("");
    }
  }, [open]);

  const handleContinue = () => {
    if (offerAmount > 0 && onContinueWithOffer) {
      onOpenChange(false);
      onContinueWithOffer(offerAmount);
    }
  };

  const handleOptionClick = (option: OfferOption) => {
    setSelectedOption(option);
    if (option !== "custom") {
      setCustomPrice("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader className="mb-0 pb-0">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Select offer amount
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose a discount percentage or enter a custom offer amount
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 mt-4">
            {percentageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  selectedOption === option.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
                data-testid={`button-offer-${option.value}`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => handleOptionClick("custom")}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                selectedOption === "custom"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
              data-testid="button-offer-custom"
            >
              Custom
            </button>
          </div>

          {selectedOption === "custom" && (
            <div className="mt-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter your offer"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="pl-8"
                  data-testid="input-custom-offer-price"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <span className="text-muted-foreground">You Pay:</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground line-through">
                US${productPrice.toFixed(2)}
              </span>
              <span className="text-green-600 font-bold text-lg">
                US${offerAmount.toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm">
                + shipping & taxes
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 border-t bg-background">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6"
            data-testid="button-cancel-offer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!offerAmount || offerAmount <= 0}
            className="flex-1 font-semibold"
            style={{
              backgroundColor: buttonBgColor || '#FACC15',
              color: buttonTextColor || '#000000',
            }}
            data-testid="button-continue-offer"
          >
            Continue With Offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MakeOfferDialog;
