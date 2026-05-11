import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useApiConfig, getImageUrl } from "@/lib/use-api-config";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Tag,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Offer {
  _id: string;
  buyer: {
    _id: string;
    userName?: string;
    profilePhoto?: string;
  };
  seller: {
    _id: string;
    userName?: string;
    profilePhoto?: string;
  };
  product: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
  };
  offeredPrice: number;
  counterPrice?: number;
  status: string;
  createdAt: string;
  expiresAt?: string;
}

interface OffersResponse {
  message: string;
  offers: Offer[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  countered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  accepted: CheckCircle,
  rejected: XCircle,
  countered: RefreshCw,
  expired: AlertCircle,
  completed: CheckCircle,
};

function formatStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Declined",
    countered: "Counter",
    expired: "Expired",
    completed: "Completed",
  };
  return statusLabels[status] || status;
}

const ITEMS_PER_PAGE = 10;

export default function BuyerOffers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [actionOffer, setActionOffer] = useState<{ offer: Offer; action: 'accept' | 'reject' | 'cancel' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { externalApiUrl } = useApiConfig();

  const userId = (user as any)?._id || user?.id;

  const { data, isLoading, error, refetch } = useQuery<OffersResponse>({
    queryKey: ['/api/offers', { user: userId, role: 'buyer', page: currentPage, limit: ITEMS_PER_PAGE }],
    queryFn: async () => {
      const response = await fetch(`/api/offers?user=${userId}&role=buyer&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    },
    enabled: !!userId,
  });

  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest('POST', '/api/offers/accept', { offerId, usertype: 'buyer' });
    },
    onSuccess: () => {
      toast({
        title: "Counter offer accepted",
        description: "You can now proceed to checkout.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept counter offer",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest('POST', '/api/offers/reject', { offerId, usertype: 'buyer' });
    },
    onSuccess: () => {
      toast({
        title: "Counter offer declined",
        description: "The offer has been withdrawn.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline counter offer",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest('POST', '/api/offers/cancel', { offerId });
    },
    onSuccess: () => {
      toast({
        title: "Offer cancelled",
        description: "Your offer has been withdrawn.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel offer",
        variant: "destructive",
      });
    },
  });

  const handleConfirmAction = () => {
    if (!actionOffer) return;
    
    if (actionOffer.action === 'accept') {
      acceptMutation.mutate(actionOffer.offer._id, {
        onSettled: () => setActionOffer(null),
      });
    } else if (actionOffer.action === 'reject') {
      rejectMutation.mutate(actionOffer.offer._id, {
        onSettled: () => setActionOffer(null),
      });
    } else if (actionOffer.action === 'cancel') {
      cancelMutation.mutate(actionOffer.offer._id, {
        onSettled: () => setActionOffer(null),
      });
    }
  };
  
  const isDialogPending = acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  const getProductImage = (product: Offer['product']) => {
    if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0], externalApiUrl) || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image';
    }
    return 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image';
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5" />
          <h1 className="text-xl font-bold">My Offers</h1>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5" />
          <h1 className="text-xl font-bold">My Offers</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">Failed to load offers</p>
            <Button size="sm" onClick={() => refetch()} data-testid="button-retry">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offers = data?.offers || [];
  const pagination = data?.pagination;
  const totalItems = pagination?.total || offers.length;
  const totalPages = pagination?.pages || 1;
  const isPending = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          <h1 className="text-xl font-bold">My Offers</h1>
          <span className="text-sm text-muted-foreground">({totalItems})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No offers yet</h3>
            <p className="text-sm text-muted-foreground mb-3">
              When you make offers on products, they'll appear here.
            </p>
            <Button size="sm" onClick={() => setLocation('/')} data-testid="button-browse">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Product</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">List</TableHead>
                <TableHead className="text-right">Offer</TableHead>
                <TableHead className="text-right">Counter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const StatusIcon = statusIcons[offer.status] || Clock;
                return (
                  <TableRow key={offer._id} data-testid={`row-offer-${offer._id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={getProductImage(offer.product)}
                          alt={offer.product.name}
                          className="h-10 w-10 rounded object-cover bg-muted cursor-pointer"
                          onClick={() => setLocation(`/product/${offer.product._id}`)}
                        />
                        <span 
                          className="font-medium truncate max-w-[200px] cursor-pointer hover:text-primary"
                          onClick={() => setLocation(`/product/${offer.product._id}`)}
                          data-testid="text-product-name"
                        >
                          {offer.product.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={offer.seller?.profilePhoto} />
                          <AvatarFallback className="text-[10px]">
                            {offer.seller?.userName?.[0]?.toUpperCase() || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                          {offer.seller?.userName || 'Seller'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${offer.product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${offer.offeredPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {offer.counterPrice ? (
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          ${offer.counterPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[offer.status] || statusColors.pending} text-xs`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {formatStatus(offer.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {offer.createdAt ? formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {offer.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => setActionOffer({ offer, action: 'cancel' })}
                            disabled={isPending}
                            data-testid="button-cancel-offer"
                          >
                            Cancel
                          </Button>
                        )}
                        {offer.status === 'countered' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => setActionOffer({ offer, action: 'accept' })}
                              disabled={isPending}
                              data-testid="button-accept-counter"
                            >
                              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setActionOffer({ offer, action: 'reject' })}
                              disabled={isPending}
                              data-testid="button-decline-counter"
                            >
                              Decline
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!actionOffer} onOpenChange={(open) => !isDialogPending && !open && setActionOffer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionOffer?.action === 'accept' 
                ? 'Accept Counter Offer?' 
                : actionOffer?.action === 'cancel'
                ? 'Cancel Offer?'
                : 'Decline Counter Offer?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionOffer?.action === 'accept' 
                ? `Accept the seller's counter of $${actionOffer?.offer.counterPrice?.toFixed(2)}?`
                : actionOffer?.action === 'cancel'
                ? "This will withdraw your offer. You can make a new offer later if you change your mind."
                : "This will withdraw your offer."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDialogPending} data-testid="button-cancel">Go Back</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={isDialogPending}
              data-testid="button-confirm"
            >
              {isDialogPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionOffer?.action === 'accept' 
                ? 'Accept' 
                : actionOffer?.action === 'cancel'
                ? 'Cancel Offer'
                : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
