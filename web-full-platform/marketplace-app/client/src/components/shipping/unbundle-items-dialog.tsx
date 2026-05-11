import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";
import type { TokshopOrder } from "@shared/schema";

interface UnbundleItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: TokshopOrder | null;
  onUnbundle: (itemIds: string[]) => void;
  isPending: boolean;
}

export function UnbundleItemsDialog({
  open,
  onOpenChange,
  order,
  onUnbundle,
  isPending,
}: UnbundleItemsDialogProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Reset selections when dialog opens or order changes
  useEffect(() => {
    if (open) {
      setSelectedItemIds([]);
    }
  }, [open, order]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (!order?.items) return;
    if (selectedItemIds.length === order.items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(order.items.map((item) => item._id).filter((id): id is string => !!id));
    }
  };

  const handleUnbundle = () => {
    if (selectedItemIds.length === 0) return;
    onUnbundle(selectedItemIds);
    setSelectedItemIds([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedItemIds([]);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedItemIds([]);
    }
    onOpenChange(newOpen);
  };

  if (!order?.items) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Select Items to Unbundle</DialogTitle>
          <DialogDescription className="text-sm">
            Choose items to split into separate orders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {selectedItemIds.length} of {order.items.length} selected
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              data-testid="button-select-all-items"
              className="h-7 text-xs"
            >
              {selectedItemIds.length === order.items.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          <div className="space-y-1.5">
            {order.items.filter(item => item._id).map((item) => {
              const itemId = item._id!;
              const isSelected = selectedItemIds.includes(itemId);

              return (
                <Card
                  key={itemId}
                  className={`p-2.5 cursor-pointer transition-colors hover-elevate ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleToggleItem(itemId)}
                  data-testid={`item-card-${itemId}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleItem(itemId)}
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`checkbox-item-${itemId}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {item.productId?.name || "Item"}{item.order_reference ? ` ${item.order_reference}` : ''}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>Quantity: {item.quantity || 1}</span>
                            <span>Price: ${(item.price || 0).toFixed(2)} each</span>
                            {item.weight && (
                              <span>Weight: {item.weight}{item.scale || "oz"}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm">
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            data-testid="button-cancel-unbundle"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnbundle}
            disabled={selectedItemIds.length === 0 || isPending}
            data-testid="button-confirm-unbundle"
          >
            {isPending ? "Unbundling..." : `Unbundle ${selectedItemIds.length} Item${selectedItemIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
