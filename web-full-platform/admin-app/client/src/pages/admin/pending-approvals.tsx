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
import { Clock, Search, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle, MoreVertical, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function AdminPendingApprovals() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

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
    queryKey: ['/api/admin/users', 'pending', page, limit, searchQuery],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));
      queryParams.set('status', 'pending');
      if (searchQuery) queryParams.set('title', searchQuery);
      
      const url = `/api/admin/users?${queryParams.toString()}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
  });

  const users = usersData?.data?.users || [];
  
  const pagination = usersData?.data ? {
    currentPage: page,
    totalPages: usersData.data.pages,
    totalItems: usersData.data.totalDoc,
    hasNextPage: page < usersData.data.pages,
    hasPrevPage: page > 1
  } : undefined;

  const approveUserMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/approve-seller`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User approved as seller successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/approve-seller`, { action: "reject" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User seller application rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-count">
                {pagination?.totalItems || users.length}
              </div>
              <p className="text-xs text-muted-foreground">Users awaiting seller approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On This Page</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-page-count">
                {users.length}
              </div>
              <p className="text-xs text-muted-foreground">Applications to review</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle>Pending Seller Approvals</CardTitle>
                <CardDescription>Review and approve users who have applied to become sellers</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-pending"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading pending approvals...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending approvals</p>
                <p className="text-sm text-muted-foreground mt-1">All seller applications have been reviewed</p>
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((pendingUser: any) => (
                        <TableRow key={pendingUser._id || pendingUser.id} data-testid={`row-pending-user-${pendingUser._id || pendingUser.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={pendingUser.profilePhoto} />
                                <AvatarFallback>
                                  {pendingUser.firstName?.[0]}{pendingUser.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{pendingUser.firstName} {pendingUser.lastName}</div>
                                <div className="text-sm text-muted-foreground md:hidden truncate">{pendingUser.email}</div>
                                <div className="text-sm text-muted-foreground hidden md:block">{pendingUser.phone || 'No phone'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell" data-testid={`text-email-${pendingUser._id || pendingUser.id}`}>
                            <div className="max-w-[200px] truncate">{pendingUser.email}</div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell" data-testid={`text-username-${pendingUser._id || pendingUser.id}`}>{pendingUser.userName || 'N/A'}</TableCell>
                          <TableCell className="hidden xl:table-cell">{pendingUser.country || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-actions-${pendingUser._id || pendingUser.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/admin/users/${pendingUser._id || pendingUser.id}`)}
                                  data-testid={`menu-view-user-${pendingUser._id || pendingUser.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    approveUserMutation.mutate({
                                      userId: pendingUser._id || pendingUser.id,
                                      email: pendingUser.email,
                                    });
                                  }}
                                  disabled={approveUserMutation.isPending}
                                  data-testid={`menu-approve-user-${pendingUser._id || pendingUser.id}`}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve Seller
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    rejectUserMutation.mutate({
                                      userId: pendingUser._id || pendingUser.id,
                                    });
                                  }}
                                  disabled={rejectUserMutation.isPending}
                                  data-testid={`menu-reject-user-${pendingUser._id || pendingUser.id}`}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject Application
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      <span className="hidden sm:inline">Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} pending)</span>
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
    </AdminLayout>
  );
}
