import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Truck, CreditCard, ExternalLink, MoreHorizontal, Video, DollarSign, Package, ShoppingBag, CheckCircle2, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUserDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/users/:userId");
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const userId = params?.userId;
  const [activeTab, setActiveTab] = useState<string>("addresses");

  // Shows & Shipments tab state
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const [orderSearch, setOrderSearch] = useState<string>("");

  // Redirect if not admin (in useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (!user?.admin) {
      setLocation("/");
    }
  }, [user?.admin, setLocation]);

  // Mutation to approve user as seller
  const approveSellerMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/approve-seller`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "Success",
        description: "User approved as seller successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve seller",
        variant: "destructive",
      });
    },
  });

  // Mutation to update user details (for revoking seller status)
  const updateUserMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Mutation to impersonate user (open as seller in marketplace)
  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/impersonate/user`, { userId });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.accessToken) {
        // Get the marketplace URL from settings or use default
        const marketplaceUrl = settings?.website_url || window.location.origin.replace('admin', 'marketplace');
        
        // Build URL with impersonation token
        const impersonateUrl = new URL(marketplaceUrl);
        impersonateUrl.pathname = '/';
        impersonateUrl.searchParams.set('impersonate', 'true');
        impersonateUrl.searchParams.set('token', data.accessToken);
        impersonateUrl.searchParams.set('authtoken', data.authtoken || '');
        impersonateUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(data.data)));
        
        // Open in new tab
        window.open(impersonateUrl.toString(), '_blank');
        
        toast({
          title: "Opening Marketplace",
          description: `Opening marketplace as ${userInfo?.userName || userInfo?.email}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to get impersonation tokens",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to impersonate user",
        variant: "destructive",
      });
    },
  });

  const handleSellerToggle = (checked: boolean) => {
    if (checked) {
      // Use approve seller endpoint when enabling seller status
      const userEmail = userInfo?.email || '';
      approveSellerMutation.mutate(userEmail);
    } else {
      // Use update endpoint when disabling seller status
      updateUserMutation.mutate({ seller: false });
    }
  };

  // Fetch user details - always fetch fresh data from users/:id endpoint
  const { data: userData, isLoading: loadingUser } = useQuery<{ success: boolean; data: any }>({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Fetch user addresses
  const { data: addressesData, isLoading: loadingAddresses } = useQuery<any>({
    queryKey: [`/api/address/all/${userId}`],
    enabled: !!userId,
  });

  // Fetch user shipping profiles
  const { data: shippingData, isLoading: loadingShipping } = useQuery<any>({
    queryKey: [`/api/shipping/profiles/user/${userId}`],
    enabled: !!userId,
  });

  // Fetch user payment methods - only when Payment Methods tab is active
  const { data: paymentMethodsData, isLoading: loadingPaymentMethods } = useQuery<any>({
    queryKey: [`/users/paymentmethod/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/users/paymentmethod/${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      return await response.json();
    },
    enabled: !!userId && activeTab === 'payment-methods',
  });

  // Fetch seller shows - only when Shows tab is active
  const { data: showsData, isLoading: loadingShows } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}/shows`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/users/${userId}/shows?limit=100`);
      return await response.json();
    },
    enabled: !!userId && activeTab === 'shows-shipments',
  });

  // Fetch shipping metrics - only when Shows tab is active
  const { data: metricsData, isLoading: loadingMetrics } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}/shipping-metrics`, selectedShowId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedShowId && selectedShowId !== 'all') {
        if (selectedShowId === 'marketplace') {
          params.set('marketplace', 'true');
        } else {
          params.set('tokshow', selectedShowId);
        }
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await apiRequest('GET', `/api/admin/users/${userId}/shipping-metrics${qs}`);
      return await response.json();
    },
    enabled: !!userId && activeTab === 'shows-shipments',
  });

  // Fetch seller orders - only when Shows tab is active
  const { data: sellerOrdersData, isLoading: loadingSellerOrders } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}/seller-orders`, selectedShowId, orderStatusFilter, ordersPage, orderSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedShowId && selectedShowId !== 'all') {
        if (selectedShowId === 'marketplace') {
          params.set('marketplace', 'true');
        } else {
          params.set('tokshow', selectedShowId);
        }
      }
      if (orderStatusFilter && orderStatusFilter !== 'all') params.set('status', orderStatusFilter);
      if (orderSearch.trim()) params.set('search', orderSearch.trim());
      params.set('page', String(ordersPage));
      params.set('limit', '20');
      const response = await apiRequest('GET', `/api/admin/users/${userId}/seller-orders?${params.toString()}`);
      return await response.json();
    },
    enabled: !!userId && activeTab === 'shows-shipments',
  });

  const userInfo = userData?.data;
  const addresses = addressesData?.data || addressesData || [];
  const shippingProfiles = shippingData?.data || shippingData || [];
  const paymentMethods = paymentMethodsData?.data || paymentMethodsData || [];
  const sellerShows = showsData?.data || [];
  const metrics = metricsData || null;
  const sellerOrders = sellerOrdersData?.orders || sellerOrdersData?.data?.orders || sellerOrdersData?.data || [];
  const sellerOrdersTotal = sellerOrdersData?.total || sellerOrdersData?.totalDoc || 0;
  const sellerOrdersTotalPages = sellerOrdersData?.totalPages || Math.ceil(sellerOrdersTotal / 20) || 1;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'unfulfilled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingUser) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!userInfo) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">User not found</p>
            <Button onClick={() => setLocation("/admin")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            data-testid="button-back-to-admin"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        {/* User Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Complete user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userInfo.profilePhoto} />
                <AvatarFallback className="text-2xl">
                  {userInfo.firstName?.[0]}{userInfo.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium" data-testid="text-user-name">
                    {userInfo.firstName} {userInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium" data-testid="text-user-email">{userInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium" data-testid="text-user-username">{userInfo.userName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{userInfo.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{userInfo.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Payment Method</p>
                  <p className="font-medium" data-testid="text-default-payment-method">
                    {typeof userInfo.defaultpaymentmethod === 'object' && userInfo.defaultpaymentmethod
                      ? `${(userInfo.defaultpaymentmethod.type || 'Card').replace(/_/g, ' ')} ending in ${userInfo.defaultpaymentmethod.last4 || '****'}`
                      : userInfo.defaultpaymentmethod ? String(userInfo.defaultpaymentmethod).replace(/_/g, ' ') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <Badge variant={userInfo.seller ? "default" : "secondary"}>
                    {userInfo.seller ? "Seller" : "Customer"}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Admin Controls */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-4">Admin Controls</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between max-w-md">
                  <div className="space-y-0.5">
                    <Label htmlFor="seller-toggle" className="text-base">
                      Seller Account
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow this user to sell products on the platform
                    </p>
                  </div>
                  <Switch
                    id="seller-toggle"
                    checked={userInfo.seller}
                    onCheckedChange={handleSellerToggle}
                    disabled={approveSellerMutation.isPending || updateUserMutation.isPending}
                    data-testid="switch-seller-status"
                  />
                </div>
                
                {/* Open as Seller button */}
                {userInfo.seller && (
                  <div className="flex items-center justify-between max-w-md">
                    <div className="space-y-0.5">
                      <Label className="text-base">
                        View as Seller
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Open the marketplace as this seller in a new tab
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => impersonateMutation.mutate()}
                      disabled={impersonateMutation.isPending}
                      data-testid="button-impersonate-user"
                    >
                      {impersonateMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open as Seller
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different data sections */}
        <Tabs defaultValue="addresses" className="w-full" onValueChange={(v) => { setActiveTab(v); setOrdersPage(1); }}>
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className={`inline-flex w-full min-w-max sm:w-full sm:min-w-0 sm:grid ${userInfo?.seller ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
              <TabsTrigger value="addresses" data-testid="tab-addresses" className="flex-shrink-0 sm:flex-shrink">
                <MapPin className="h-4 w-4 mr-2 hidden sm:inline" />
                Addresses ({addresses.length})
              </TabsTrigger>
              {userInfo?.seller && (
                <TabsTrigger value="shipping" data-testid="tab-shipping" className="flex-shrink-0 sm:flex-shrink">
                  <Truck className="h-4 w-4 mr-2 hidden sm:inline" />
                  Shipping Profiles ({shippingProfiles.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="payment-methods" data-testid="tab-payment-methods" className="flex-shrink-0 sm:flex-shrink">
                <CreditCard className="h-4 w-4 mr-2 hidden sm:inline" />
                Payment Methods
              </TabsTrigger>
              {userInfo?.seller && (
                <TabsTrigger value="shows-shipments" data-testid="tab-shows-shipments" className="flex-shrink-0 sm:flex-shrink">
                  <Video className="h-4 w-4 mr-2 hidden sm:inline" />
                  Shows & Shipments
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>User Addresses</CardTitle>
                <CardDescription>All saved addresses for this user</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAddresses ? (
                  <div className="text-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No addresses found</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {addresses.length > 0 && Object.keys(addresses[0])
                            .filter(key => !['_id', '__v', 'userId', 'user', 'createdAt', 'updatedAt', 'cityCode', 'stateCode', 'countryCode', 'street'].includes(key))
                            .map((key) => (
                              <TableHead key={key} className="capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {addresses.map((address: any, idx: number) => (
                          <TableRow key={address._id || idx} data-testid={`address-${idx}`}>
                            {Object.entries(address)
                              .filter(([key]) => !['_id', '__v', 'userId', 'user', 'createdAt', 'updatedAt', 'cityCode', 'stateCode', 'countryCode', 'street'].includes(key))
                              .map(([key, value]: [string, any]) => (
                                <TableCell key={key} className="whitespace-nowrap">
                                  {value === null || value === undefined ? (
                                    <span className="text-muted-foreground">N/A</span>
                                  ) : typeof value === 'boolean' ? (
                                    <Badge variant={value ? "default" : "secondary"}>
                                      {value ? 'Yes' : 'No'}
                                    </Badge>
                                  ) : typeof value === 'object' ? (
                                    <span className="text-xs font-mono max-w-[200px] truncate block" title={JSON.stringify(value)}>
                                      {JSON.stringify(value)}
                                    </span>
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Profiles Tab */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Profiles</CardTitle>
                <CardDescription>User's shipping configurations</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingShipping ? (
                  <div className="text-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading shipping profiles...</p>
                  </div>
                ) : shippingProfiles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No shipping profiles found</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {shippingProfiles.length > 0 && Object.keys(shippingProfiles[0])
                            .filter(key => !['_id', '__v', 'userId', 'user', 'taxCode', 'createdAt', 'updatedAt'].includes(key))
                            .map((key) => (
                              <TableHead key={key} className="capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingProfiles.map((profile: any, idx: number) => (
                          <TableRow key={profile._id || idx} data-testid={`shipping-profile-${idx}`}>
                            {Object.entries(profile)
                              .filter(([key]) => !['_id', '__v', 'userId', 'user', 'taxCode', 'createdAt', 'updatedAt'].includes(key))
                              .map(([key, value]: [string, any]) => (
                                <TableCell key={key} className="whitespace-nowrap">
                                  {value === null || value === undefined ? (
                                    <span className="text-muted-foreground">N/A</span>
                                  ) : typeof value === 'boolean' ? (
                                    <Badge variant={value ? "default" : "secondary"}>
                                      {value ? 'Yes' : 'No'}
                                    </Badge>
                                  ) : typeof value === 'object' ? (
                                    <span className="text-xs font-mono max-w-[200px] truncate block" title={JSON.stringify(value)}>
                                      {JSON.stringify(value)}
                                    </span>
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>All saved payment methods for this user</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPaymentMethods ? (
                  <div className="text-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading payment methods...</p>
                  </div>
                ) : !Array.isArray(paymentMethods) || paymentMethods.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payment methods found</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {paymentMethods.length > 0 && Object.keys(paymentMethods[0])
                            .filter(key => !['_id', '__v', 'cardid', 'cardId', 'customerid', 'customerId', 'token', 'paymentMethodId', 'walletType', 'userid', 'userId', 'type'].includes(key))
                            .map((key) => (
                              <TableHead key={key} className="capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                              </TableHead>
                            ))}
                          <TableHead className="whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentMethods.map((method: any, idx: number) => (
                          <TableRow key={method._id || method.id || method.paymentMethodId || idx} data-testid={`payment-method-${method._id || method.id || idx}`}>
                            {Object.entries(method)
                              .filter(([key]) => !['_id', '__v', 'cardid', 'cardId', 'customerid', 'customerId', 'token', 'paymentMethodId', 'walletType', 'userid', 'userId'].includes(key))
                              .map(([key, value]: [string, any]) => (
                                <TableCell key={key} className="whitespace-nowrap">
                                  {value === null || value === undefined ? (
                                    <span className="text-muted-foreground">N/A</span>
                                  ) : typeof value === 'boolean' ? (
                                    <Badge variant={value ? "default" : "secondary"}>
                                      {value ? 'Yes' : 'No'}
                                    </Badge>
                                  ) : typeof value === 'object' ? (
                                    <span className="text-xs font-mono max-w-[200px] truncate block" title={JSON.stringify(value)}>
                                      {JSON.stringify(value)}
                                    </span>
                                  ) : key.toLowerCase().includes('date') || key === 'createdAt' || key === 'updatedAt' ? (
                                    new Date(value).toLocaleDateString()
                                  ) : key === 'created' && typeof value === 'number' ? (
                                    new Date(value * 1000).toLocaleDateString()
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                            <TableCell className="whitespace-nowrap">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const isCurrentlyPrimary = method.primary === true;
                                      try {
                                        const response = await fetch(`/users/paymentmethod/${method._id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ primary: !isCurrentlyPrimary })
                                        });
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: [`/users/paymentmethod/${userId}`] });
                                          toast({ title: "Success", description: isCurrentlyPrimary ? "Removed from default" : "Payment method set as default" });
                                        } else {
                                          const data = await response.json();
                                          toast({ title: "Error", description: data.error || "Failed to update default", variant: "destructive" });
                                        }
                                      } catch (error: any) {
                                        toast({ title: "Error", description: error.message || "Failed to update default", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    {method.primary === true ? 'Remove Default' : 'Make Default'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const isCurrentlyBlocked = method.status === 'blocked';
                                      try {
                                        const response = await fetch(`/users/paymentmethod/${method._id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ status: isCurrentlyBlocked ? 'active' : 'blocked' })
                                        });
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: [`/users/paymentmethod/${userId}`] });
                                          toast({ title: "Success", description: `Payment method ${isCurrentlyBlocked ? 'activated' : 'deactivated'}` });
                                        } else {
                                          const data = await response.json();
                                          toast({ title: "Error", description: data.error || "Failed to update status", variant: "destructive" });
                                        }
                                      } catch (error: any) {
                                        toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    {method.status === 'blocked' ? 'Activate' : 'Deactivate'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={async () => {
                                      if (!confirm('Are you sure you want to delete this payment method?')) return;
                                      try {
                                        const response = await fetch(`/users/paymentmethod/${method._id}`, {
                                          method: 'DELETE',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                        });
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: [`/users/paymentmethod/${userId}`] });
                                          toast({ title: "Success", description: "Payment method deleted" });
                                        } else {
                                          const data = await response.json();
                                          toast({ title: "Error", description: data.error || "Failed to delete", variant: "destructive" });
                                        }
                                      } catch (error: any) {
                                        toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shows & Shipments Tab */}
          {userInfo?.seller && (
            <TabsContent value="shows-shipments">
              <div className="space-y-6">
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Select
                      value={selectedShowId}
                      onValueChange={(v) => { setSelectedShowId(v); setOrdersPage(1); }}
                    >
                      <SelectTrigger data-testid="select-show-filter">
                        <Video className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Shows" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Shows</SelectItem>
                        <SelectItem value="marketplace">Marketplace (No Show)</SelectItem>
                        {loadingShows ? (
                          <SelectItem value="_loading" disabled>Loading shows...</SelectItem>
                        ) : (
                          sellerShows.map((show: any) => (
                            <SelectItem key={show._id || show.id} value={show._id || show.id}>
                              {show.title || show.name || 'Untitled Show'} — {show.createdAt ? new Date(show.createdAt).toLocaleDateString() : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select
                    value={orderStatusFilter}
                    onValueChange={(v) => { setOrderStatusFilter(v); setOrdersPage(1); }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => { setOrderSearch(e.target.value); setOrdersPage(1); }}
                      className="pl-10"
                      data-testid="input-order-search"
                    />
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {loadingMetrics ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="pt-6">
                          <div className="h-8 bg-muted animate-pulse rounded" />
                          <div className="h-4 bg-muted animate-pulse rounded mt-2 w-2/3" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Total Sold</span>
                          </div>
                          <p className="text-2xl font-bold" data-testid="metric-total-sold">${metrics?.totalSold || '0'}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-muted-foreground">Total Earned</span>
                          </div>
                          <p className="text-2xl font-bold" data-testid="metric-total-earned">${metrics?.totalEarned || '0'}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-4 w-4 text-orange-500" />
                            <span className="text-xs text-muted-foreground">Shipping Spend</span>
                          </div>
                          <p className="text-2xl font-bold" data-testid="metric-shipping-spend">${metrics?.totalShippingSpend || '0'}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-muted-foreground">Items Sold</span>
                          </div>
                          <p className="text-2xl font-bold" data-testid="metric-items-sold">{metrics?.itemsSold || 0}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Delivered</span>
                          </div>
                          <p className="text-2xl font-bold" data-testid="metric-delivered">{metrics?.totalDelivered || 0}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">Pending</span>
                          </div>
                          <p className="text-2xl font-bold" data-testid="metric-pending">{metrics?.pendingDelivery || 0}</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Orders Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>
                      {sellerOrdersTotal > 0 ? `${sellerOrdersTotal} orders found` : 'Order list for this seller'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingSellerOrders ? (
                      <div className="text-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading orders...</p>
                      </div>
                    ) : !Array.isArray(sellerOrders) || sellerOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No orders found</p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead className="hidden md:table-cell">Order ID</TableHead>
                                <TableHead className="hidden lg:table-cell">Show</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sellerOrders.map((order: any) => {
                                const orderId = order._id || order.id;
                                const buyer = order.buyer || order.user || {};
                                const buyerName = buyer.firstName
                                  ? `${buyer.firstName} ${buyer.lastName || ''}`.trim()
                                  : buyer.userName || buyer.email || 'Unknown';
                                const items: any[] = order.items || order.products || [];
                                const showName = order.room?.title || order.show?.title || order.tokshow?.title || null;
                                return (
                                  <TableRow key={orderId} data-testid={`row-order-${orderId}`}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                          <AvatarImage src={buyer.profilePhoto} />
                                          <AvatarFallback className="text-xs">{buyerName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm truncate max-w-[120px]">{buyerName}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                                      {String(orderId).slice(-8).toUpperCase()}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm">
                                      {showName ? (
                                        <span className="flex items-center gap-1">
                                          <Video className="h-3 w-3 text-muted-foreground" />
                                          <span className="truncate max-w-[120px]">{showName}</span>
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">Marketplace</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-1">
                                        {items.slice(0, 2).map((item: any, i: number) => (
                                          <div key={i} className="flex items-center gap-1 text-xs">
                                            {(item.product?.photos?.[0] || item.photo || item.image) && (
                                              <img
                                                src={item.product?.photos?.[0] || item.photo || item.image}
                                                className="h-5 w-5 rounded object-cover flex-shrink-0"
                                                alt=""
                                              />
                                            )}
                                            <span className="truncate max-w-[80px]">{item.product?.title || item.title || item.name || 'Item'}</span>
                                            {item.quantity > 1 && <span className="text-muted-foreground">x{item.quantity}</span>}
                                          </div>
                                        ))}
                                        {items.length > 2 && (
                                          <span className="text-xs text-muted-foreground">+{items.length - 2} more</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      ${(order.total || order.totalAmount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status || 'Unknown'}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {sellerOrdersTotalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                              Page {ordersPage} of {sellerOrdersTotalPages} ({sellerOrdersTotal} orders)
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                                disabled={ordersPage <= 1}
                                data-testid="button-orders-prev"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOrdersPage(p => Math.min(sellerOrdersTotalPages, p + 1))}
                                disabled={ordersPage >= sellerOrdersTotalPages}
                                data-testid="button-orders-next"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
