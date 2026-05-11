import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/admin-layout";
import { Users, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminReferralLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const adminToken = localStorage.getItem('adminAccessToken');
    const userToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (adminToken) headers['x-admin-token'] = adminToken;
    if (userToken) headers['x-access-token'] = userToken;
    if (userData) headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
    return headers;
  };

  const { data, isLoading } = useQuery<any>({
    queryKey: ['admin-referral-logs', page, appliedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      if (appliedSearch.trim()) {
        params.append('username', appliedSearch.trim());
      }
      const response = await fetch(`/api/admin/referral-logs?${params.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch referral logs');
      return response.json();
    },
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 0;
  const totalRecords = data?.totalRecords || 0;

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setAppliedSearch("");
    setPage(1);
  };

  return (
    <AdminLayout title="Referral Logs" icon={<Users className="h-5 w-5" />}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Referral Logs</CardTitle>
              <Badge variant="secondary">{totalRecords} total</Badge>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} size="sm">Search</Button>
              {appliedSearch && (
                <Button onClick={clearSearch} variant="ghost" size="sm">
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No referral logs found.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Credit Redeemed</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-medium">
                          {log.referrerId?.userName || log.referrerId?._id || '-'}
                        </TableCell>
                        <TableCell>
                          {log.referredUserId?.userName || log.referredUserId?._id || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.ip || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.referredUserId?.awarded_referal_credit ? "default" : "secondary"}>
                            {log.referredUserId?.awarded_referal_credit ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
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
    </AdminLayout>
  );
}
