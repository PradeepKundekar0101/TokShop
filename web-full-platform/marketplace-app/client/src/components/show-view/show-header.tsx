import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShowHeaderProps {
  show?: any;
}

// Independent component - can be commented out without affecting the page
export function ShowHeader({ show }: ShowHeaderProps) {
  if (!show) return null;

  const shippingOptions = show?.shippingoptions || {};
  const hasFreePickup = shippingOptions.free_in_person_pickup || shippingOptions.freeInPersonPickup;
  const hasBuyerCap = shippingOptions.reduced_shipping_rate || shippingOptions.reducedShippingRate;
  const hasExplicitContent = show?.explicit_content || false;

  return (
    <>
      {/* Show Ended Alert */}
      {show?.ended && (
        <Alert className="rounded-none border-x-0 border-t-0 border-b border-zinc-800 bg-red-900/20 border-red-800/30 flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-sm text-red-200">
            This show has already ended
          </AlertDescription>
        </Alert>
      )}

    </>
  );
}
