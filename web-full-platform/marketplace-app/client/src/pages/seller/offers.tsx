import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Tag, Check, X, ArrowUpDown, Clock, ChevronDown, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  countered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const ITEMS_PER_PAGE = 10;

export default function Offers() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ offer: any; action: 'accept' | 'decline' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();

  const userId = (user as any)?._id || user?.id;

  const { data: offersResponse, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['/api/offers', 'seller', userId, statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('user', userId);
      params.set('role', 'seller');
      params.set('page', currentPage.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const response = await fetch(`/api/offers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch offers');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const products = offersResponse?.products || [];
  const pagination = offersResponse?.pagination;
  const totalItems = pagination?.total || products.length;
  const totalPages = pagination?.pages || 1;

  const toggleProduct = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return await apiRequest('POST', '/api/offers/accept', { 
        offerId, 
        usertype: 'seller' 
      });
    },
    onSuccess: () => {
      toast({ title: "Offer accepted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to accept offer", description: error.message, variant: "destructive" });
    },
  });

  const declineOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return await apiRequest('POST', '/api/offers/reject', { 
        offerId, 
        usertype: 'seller' 
      });
    },
    onSuccess: () => {
      toast({ title: "Offer declined" });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to decline offer", description: error.message, variant: "destructive" });
    },
  });

  const counterOfferMutation = useMutation({
    mutationFn: async ({ offerId, amount }: { offerId: string; amount: number }) => {
      return await apiRequest('POST', '/api/offers/counter', { 
        offerId, 
        counterPrice: amount 
      });
    },
    onSuccess: () => {
      toast({ title: "Counter offer sent" });
      setCounterDialogOpen(false);
      setSelectedOffer(null);
      setCounterAmount("");
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to send counter offer", description: error.message, variant: "destructive" });
    },
  });

  const handleAccept = (offer: any) => {
    setConfirmAction({ offer, action: 'accept' });
  };

  const handleDecline = (offer: any) => {
    setConfirmAction({ offer, action: 'decline' });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const offerId = confirmAction.offer._id || confirmAction.offer.id;
    
    if (confirmAction.action === 'accept') {
      acceptOfferMutation.mutate(offerId, {
        onSettled: () => setConfirmAction(null),
      });
    } else {
      declineOfferMutation.mutate(offerId, {
        onSettled: () => setConfirmAction(null),
      });
    }
  };

  const isConfirmPending = acceptOfferMutation.isPending || declineOfferMutation.isPending;

  const handleOpenCounter = (offer: any, product: any) => {
    setSelectedOffer({ ...offer, product });
    setCounterAmount((offer.offeredPrice || offer.offerAmount)?.toString() || "");
    setCounterDialogOpen(true);
  };

  const handleSubmitCounter = () => {
    if (!selectedOffer || !counterAmount) return;
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    const offerId = selectedOffer._id || selectedOffer.id;
    counterOfferMutation.mutate({ offerId, amount });
  };

  const filteredProducts = products.filter((product: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const productName = product.name?.toLowerCase() || '';
      const hasMatchingOffer = product.offers?.some((offer: any) => {
        const buyerName = (offer.buyer?.userName || offer.buyer?.firstName || '').toLowerCase();
        return buyerName.includes(query);
      });
      if (!productName.includes(query) && !hasMatchingOffer) {
        return false;
      }
    }
    return true;
  });

  const getProductImage = (product: any) => {
    const images = product.images || product.productimages || [];
    return images[0] || '/placeholder-product.png';
  };

  const getBuyerInitials = (offer: any) => {
    const name = offer.buyer?.userName || offer.buyer?.firstName || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getPendingCount = (product: any) => {
    return (product.offers || []).filter((o: any) => o.status === 'pending').length;
  };

  const getTotalOffersCount = (product: any) => {
    return (product.offers || []).length;
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Offers</h1>
          <p className="text-muted-foreground mt-1">Manage offers from buyers</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Offers</h1>
        <p className="text-muted-foreground mt-1">Manage offers from buyers on your products</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product or buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-offers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="countered">Countered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No offers yet</h3>
            <p className="text-muted-foreground">
              When buyers make offers on your products, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product: any) => {
            const productId = product._id || product.id;
            const isExpanded = expandedProducts.has(productId);
            const pendingCount = getPendingCount(product);
            const totalCount = getTotalOffersCount(product);
            const offers = product.offers || [];

            return (
              <Card key={productId} data-testid={`card-product-${productId}`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleProduct(productId)}>
                  <CollapsibleTrigger asChild>
                    <div className="cursor-pointer hover-elevate">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getProductImage(product)}
                            alt={product.name || 'Product'}
                            className="h-16 w-16 rounded-lg object-cover bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate" data-testid="text-product-name">
                              {product.name || 'Unknown Product'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              List Price: ${product.price?.toFixed(2) || '0.00'}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                              {product.createdAt && (
                                <span>Listed: {format(new Date(product.createdAt), "MMM d, yyyy")}</span>
                              )}
                              {product.expiresAt && (
                                <span className={new Date(product.expiresAt) < new Date() ? 'text-red-500' : ''}>
                                  Expires: {format(new Date(product.expiresAt), "MMM d, yyyy")}
                                  {new Date(product.expiresAt) < new Date() && ' (Expired)'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                {pendingCount > 0 && (
                                  <Badge className={statusColors.pending}>
                                    {pendingCount} pending
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {totalCount} offer{totalCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <Separator />
                    <div className="bg-muted/30">
                      {offers.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No offers for this product
                        </div>
                      ) : (
                        <div className="divide-y">
                          {offers.map((offer: any) => {
                            const offerId = offer._id || offer.id;
                            const offerPrice = offer.offeredPrice || offer.offerAmount || 0;
                            const discount = product.price ? Math.round((1 - offerPrice / product.price) * 100) : 0;
                            
                            return (
                              <div 
                                key={offerId} 
                                className="p-4 hover:bg-muted/50 transition-colors"
                                data-testid={`offer-row-${offerId}`}
                              >
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={offer.buyer?.profilePhoto} />
                                    <AvatarFallback>{getBuyerInitials(offer)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="font-medium text-foreground">
                                          @{offer.buyer?.userName || offer.buyer?.firstName || 'User'}
                                        </p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                          <span className="text-lg font-bold text-foreground" data-testid="text-offer-amount">
                                            ${offerPrice.toFixed(2)}
                                          </span>
                                          {discount > 0 && (
                                            <span className="text-sm text-muted-foreground">
                                              ({discount}% off)
                                            </span>
                                          )}
                                        </div>
                                        {offer.counterPrice && (
                                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                            Your counter: ${offer.counterPrice.toFixed(2)}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-2">
                                          Offered {offer.createdAt ? formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true }) : 'N/A'}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <Badge className={statusColors[offer.status] || statusColors.pending}>
                                          {formatStatus(offer.status)}
                                        </Badge>
                                        {offer.status === 'pending' && (
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDecline(offer);
                                              }}
                                              disabled={declineOfferMutation.isPending}
                                              data-testid={`button-decline-${offerId}`}
                                            >
                                              <X className="h-4 w-4 mr-1" />
                                              Decline
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCounter(offer, product);
                                              }}
                                              data-testid={`button-counter-${offerId}`}
                                            >
                                              <ArrowUpDown className="h-4 w-4 mr-1" />
                                              Counter
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAccept(offer);
                                              }}
                                              disabled={acceptOfferMutation.isPending}
                                              data-testid={`button-accept-${offerId}`}
                                            >
                                              <Check className="h-4 w-4 mr-1" />
                                              Accept
                                            </Button>
                                          </div>
                                        )}
                                        {offer.status === 'countered' && (
                                          <p className="text-xs text-muted-foreground">
                                            Waiting for buyer response
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
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

      <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Counter Offer</DialogTitle>
            <DialogDescription>
              Enter a new price to counter the buyer's offer of ${(selectedOffer?.offeredPrice || selectedOffer?.offerAmount || 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {selectedOffer?.product && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <img
                    src={getProductImage(selectedOffer.product)}
                    alt={selectedOffer.product.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium">{selectedOffer.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      List Price: ${selectedOffer.product.price?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="counter-amount">Your Counter Price ($)</Label>
                <Input
                  id="counter-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Enter counter price"
                  data-testid="input-counter-amount"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitCounter}
              disabled={counterOfferMutation.isPending}
              data-testid="button-submit-counter"
            >
              {counterOfferMutation.isPending ? "Sending..." : "Send Counter Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !isConfirmPending && !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'accept' ? 'Accept Offer?' : 'Decline Offer?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'accept' 
                ? `Accept this offer of $${(confirmAction?.offer.offeredPrice || confirmAction?.offer.offerAmount || 0).toFixed(2)}? An order will be created automatically.`
                : "Are you sure you want to decline this offer?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmPending} data-testid="button-cancel-action">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={isConfirmPending}
              data-testid="button-confirm-action"
            >
              {isConfirmPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmAction?.action === 'accept' ? 'Accept' : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
