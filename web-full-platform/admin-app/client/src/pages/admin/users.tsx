import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Search, Eye, ChevronLeft, ChevronRight, Wallet, ShieldBan, CheckCircle, Ban, MoreVertical, Clock, CalendarIcon, Loader2, Filter, Trash2, LogIn, Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<any>(null);
  const [suspendEndDate, setSuspendEndDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<any>(null);

  // Redirect if not admin (in useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (!user?.admin) {
      setLocation("/");
    }
  }, [user?.admin, setLocation]);

  const { data: usersData, isLoading } = useQuery<{ 
    success: boolean; 
    data: {
      users: any[];
      totalDoc: number;
      limits: number;
      pages: number;
    };
  }>({
    queryKey: ['/api/admin/users', page, limit, searchQuery, typeFilter],
    queryFn: async () => {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));
      if (searchQuery) queryParams.set('title', searchQuery);
      if (typeFilter !== 'all') queryParams.set('type', typeFilter);
      
      const url = `/api/admin/users?${queryParams.toString()}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
  });

  const { data: userStatsData } = useQuery<{
    success: boolean;
    data: any;
  }>({
    queryKey: ['/api/admin/users/stats/all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users/stats/all', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return await response.json();
    },
  });

  const userStats = userStatsData?.data;

  const allUsers = usersData?.data?.users || [];
  
  const users = allUsers.filter((u: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "suspended") return u.suspended === true;
    if (statusFilter === "blocked") return u.system_blocked === true;
    return true;
  });
  
  const pagination = usersData?.data ? {
    currentPage: page,
    totalPages: usersData.data.pages,
    totalItems: usersData.data.totalDoc,
    hasNextPage: page < usersData.data.pages,
    hasPrevPage: page > 1
  } : undefined;

  // Block/Unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/block`, { blocked });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: `User ${variables.blocked ? 'blocked' : 'unblocked'} successfully`,
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${variables.blocked ? 'block' : 'unblock'} user`,
        variant: "destructive",
      });
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, suspended, suspend_end }: { userId: string; suspended: boolean; suspend_end: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/suspend`, { suspended, suspend_end });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setSuspendDialogOpen(false);
      setSelectedUserForSuspend(null);
      setSuspendEndDate(undefined);
      toast({
        title: "Success",
        description: variables.suspended ? "User suspended successfully" : "User unsuspended successfully",
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${variables.suspended ? 'suspend' : 'unsuspend'} user`,
        variant: "destructive",
      });
    },
  });

  const handleOpenSuspendDialog = (userToSuspend: any) => {
    setSelectedUserForSuspend(userToSuspend);
    setSuspendEndDate(undefined);
    setSuspendDialogOpen(true);
  };

  const handleSuspendUser = () => {
    if (!selectedUserForSuspend || !suspendEndDate) return;
    suspendUserMutation.mutate({
      userId: selectedUserForSuspend._id || selectedUserForSuspend.id,
      suspended: true,
      suspend_end: suspendEndDate.toISOString(),
    });
  };

  const handleUnsuspendUser = (userToUnsuspend: any) => {
    suspendUserMutation.mutate({
      userId: userToUnsuspend._id || userToUnsuspend.id,
      suspended: false,
      suspend_end: new Date().toISOString(),
    });
  };

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setDeleteDialogOpen(false);
      setSelectedUserForDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleOpenDeleteDialog = (userToDelete: any) => {
    setSelectedUserForDelete(userToDelete);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (!selectedUserForDelete) return;
    deleteUserMutation.mutate(selectedUserForDelete._id || selectedUserForDelete.id);
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">
                {userStats?.totalUsers ?? pagination?.totalItems ?? users.length}
              </div>
              <p className="text-xs text-muted-foreground">All registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-customers-count">
                {userStats?.totalCustomers ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">Total customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-active-sellers">
                {userStats?.activeSellers ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">Approved sellers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Sellers</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-sellers">
                {userStats?.pendingSellers ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-blocked-users">
                {userStats?.blockedUsers ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">Blocked accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="seller">Sellers</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">User</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Username</TableHead>
                        <TableHead className="hidden xl:table-cell">Country</TableHead>
                        <TableHead className="hidden lg:table-cell">Joined</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right">Wallet</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Pending</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow key={user._id || user.id} data-testid={`row-user-${user._id || user.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={user.profilePhoto} />
                                <AvatarFallback>
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-muted-foreground md:hidden truncate">{user.email}</div>
                                <div className="text-sm text-muted-foreground hidden md:block">{user.phone || 'No phone'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell" data-testid={`text-email-${user._id || user.id}`}>
                            <div className="max-w-[200px] truncate">{user.email}</div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell" data-testid={`text-username-${user._id || user.id}`}>{user.userName || 'N/A'}</TableCell>
                          <TableCell className="hidden xl:table-cell">{user.country || 'N/A'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {(user.createdAt || user.created_at) ? new Date(user.createdAt || user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.seller ? "default" : "secondary"}>
                              {user.seller ? "Seller" : "Customer"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-col items-start gap-1">
                              <Badge 
                                variant={user.suspended ? "outline" : user.system_blocked ? "destructive" : "secondary"}
                                data-testid={`badge-status-${user._id || user.id}`}
                                className={user.suspended ? "border-orange-500 text-orange-600" : ""}
                              >
                                {user.suspended ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Suspended
                                  </>
                                ) : user.system_blocked ? (
                                  <>
                                    <ShieldBan className="h-3 w-3 mr-1" />
                                    Blocked
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                )}
                              </Badge>
                              {user.suspended && user.suspend_end && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.max(0, Math.ceil((new Date(user.suspend_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right" data-testid={`text-wallet-${user._id || user.id}`}>
                            <div className="flex items-center justify-end gap-1 font-medium">
                              <Wallet className="h-3 w-3 text-muted-foreground" />
                              <span>${(user.wallet || 0).toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell" data-testid={`text-wallet-pending-${user._id || user.id}`}>
                            <span className="text-muted-foreground">${(user.walletPending || 0).toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-actions-${user._id || user.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/admin/users/${user._id || user.id}`)}
                                  data-testid={`menu-view-user-${user._id || user.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {user.seller && (
                                  <DropdownMenuItem
                                    onClick={() => setLocation(`/admin/users/${user._id || user.id}/shipments`)}
                                    data-testid={`menu-view-shipments-${user._id || user.id}`}
                                  >
                                    <Truck className="h-4 w-4 mr-2" />
                                    View Shipments
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {user.suspended ? (
                                  <DropdownMenuItem
                                    onClick={() => handleUnsuspendUser(user)}
                                    disabled={suspendUserMutation.isPending}
                                    data-testid={`menu-unsuspend-user-${user._id || user.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Unsuspend User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenSuspendDialog(user)}
                                    data-testid={`menu-suspend-user-${user._id || user.id}`}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    blockUserMutation.mutate({
                                      userId: user._id || user.id,
                                      blocked: !user.system_blocked,
                                    });
                                  }}
                                  disabled={blockUserMutation.isPending}
                                  data-testid={`menu-block-user-${user._id || user.id}`}
                                  className={user.system_blocked ? "" : "text-destructive focus:text-destructive"}
                                >
                                  {user.system_blocked ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Unblock User
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Block User
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleOpenDeleteDialog(user)}
                                  disabled={deleteUserMutation.isPending}
                                  data-testid={`menu-delete-user-${user._id || user.id}`}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {pagination && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      <span className="hidden sm:inline">Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total users)</span>
                      <span className="sm:hidden">{pagination.currentPage} / {pagination.totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={!pagination.hasPrevPage}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasNextPage}
                        data-testid="button-next-page"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4 sm:ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Schedule a suspension period for {selectedUserForSuspend?.firstName} {selectedUserForSuspend?.lastName}. 
              The user will be blocked during this time period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Suspension End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {suspendEndDate ? format(suspendEndDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={suspendEndDate}
                    onSelect={setSuspendEndDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSuspendUser}
              disabled={!suspendEndDate || suspendUserMutation.isPending}
            >
              {suspendUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Suspend User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedUserForDelete?.firstName} {selectedUserForDelete?.lastName}? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
