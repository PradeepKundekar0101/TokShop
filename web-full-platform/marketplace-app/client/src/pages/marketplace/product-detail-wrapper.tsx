import { useParams, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { MobileAppRedirect } from "@/components/mobile-app-redirect";
import { Loader2 } from "lucide-react";

const ProductDetail = lazy(() => import("./product-detail"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ProductDetailWrapper() {
  const params = useParams<{ productId: string }>();
  const [, setLocation] = useLocation();
  
  const urlParams = new URLSearchParams(window.location.search);
  const queryId = urlParams.get('id');
  const productId = params.productId || queryId || '';
  
  useEffect(() => {
    if (queryId && !params.productId) {
      setLocation(`/product/${queryId}`, { replace: true });
    }
  }, [queryId, params.productId, setLocation]);
  
  if (!productId) {
    return <LoadingSpinner />;
  }

  return (
    <MobileAppRedirect type="product" id={productId}>
      <Suspense fallback={<LoadingSpinner />}>
        <ProductDetail />
      </Suspense>
    </MobileAppRedirect>
  );
}
