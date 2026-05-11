import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";

export function AgeVerificationDialog() {
  const { showAgeVerification, confirmAge, declineAge } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await confirmAge();
      toast({
        title: "Age Verified",
        description: "Thank you for confirming your age.",
      });
    } catch (error) {
      console.error('Failed to confirm age:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify your age. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      toast({
        title: "Age Requirement Not Met",
        description: "You must be at least 18 years old to use this platform.",
        variant: "destructive",
      });
      await declineAge();
    } catch (error) {
      console.error('Failed to decline age:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={showAgeVerification}>
      <AlertDialogContent className="max-w-md" data-testid="dialog-age-verification">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl">Age Verification Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            {settings.app_name || 'This platform'} contains age-restricted content. By continuing, you confirm that you are 18 years of age or older.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            If you are under 18, you will be logged out and unable to access this content.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleDecline} 
            disabled={isLoading}
            data-testid="button-age-decline"
          >
            I am under 18
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={isLoading}
            data-testid="button-age-confirm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'I am 18 or older'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
