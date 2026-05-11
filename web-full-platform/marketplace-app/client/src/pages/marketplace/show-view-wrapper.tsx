import { useParams, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { MobileAppRedirect } from "@/components/mobile-app-redirect";
import { Loader2 } from "lucide-react";

const ShowView = lazy(() => import("./show-view"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ShowViewWrapper() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const urlParams = new URLSearchParams(window.location.search);
  const queryId = urlParams.get('id');
  const showId = params.id || queryId || '';
  
  useEffect(() => {
    if (queryId && !params.id) {
      setLocation(`/show/${queryId}`, { replace: true });
    }
  }, [queryId, params.id, setLocation]);
  
  if (!showId) {
    return <LoadingSpinner />;
  }

  return (
    <MobileAppRedirect type="show" id={showId}>
      <Suspense fallback={<LoadingSpinner />}>
        <ShowView />
      </Suspense>
    </MobileAppRedirect>
  );
}
