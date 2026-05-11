import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Gift, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Eye, Calendar, Users, Image as ImageIcon, Upload, Loader2, X, Bookmark, Truck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useApiConfig, getImageUrl } from "@/lib/use-api-config";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { uploadGiveawayImage } from "@/lib/upload-images";

interface Giveaway {
  _id: string;
  name: string;
  description?: string;
  duration?: number;
  whocanenter?: string;
  quantity?: number;
  reference?: string;
  tokshow?: any;
  images?: string[];
  category?: any;
  user?: any;
  startedtime?: string;
  endedtime?: string;
  status?: string;
  winner?: any;
  participants?: any[];
  shipping_profile?: any;
  createdAt?: string;
  bookmarked?: any[];
}

export default function AdminGiveaways() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [giveawayToDelete, setGiveawayToDelete] = useState<string | null>(null);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startedtime: "",
    endedtime: "",
    quantity: 1,
    images: [] as string[],
    shipping_profile: "",
  });
  const { externalApiUrl } = useApiConfig();
  const { toast } = useToast();
  const limit = 10;
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // Use Firebase Storage to upload image
      const url = await uploadGiveawayImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('page', page.toString());
    params.append('type', 'icona');
    if (searchName) params.append('name', searchName);
    return params.toString();
  };

  const queryString = buildQueryString();
  const { data: giveawaysData, isLoading } = useQuery<any>({
    queryKey: ['/api/giveaways', queryString],
    queryFn: async () => {
      const response = await fetch(`/api/giveaways?${queryString}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch giveaways');
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const giveaways = Array.isArray(giveawaysData?.giveaways) 
    ? giveawaysData.giveaways 
    : Array.isArray(giveawaysData?.data) 
      ? giveawaysData.data 
      : Array.isArray(giveawaysData) 
        ? giveawaysData 
        : [];
  const totalPages = giveawaysData?.totalPages || giveawaysData?.pages || 1;
  const totalDocs = giveawaysData?.totalDocuments || giveawaysData?.total || giveaways.length || 0;

  const handleSearch = () => {
    setSearchName(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchName("");
    setPage(1);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startedtime: "",
      endedtime: "",
      quantity: 1,
      images: [],
      shipping_profile: "",
    });
  };

  // Fetch general shipping profiles
  const { data: shippingData } = useQuery<any>({
    queryKey: ['/api/shipping/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/shipping/profiles', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch shipping profiles');
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });
  
  const shippingProfiles = Array.isArray(shippingData?.data) 
    ? shippingData.data 
    : Array.isArray(shippingData) 
      ? shippingData 
      : shippingData?._id 
        ? [shippingData] 
        : [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const adminToken = localStorage.getItem('adminAccessToken');
      const userToken = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminToken) headers['x-admin-token'] = adminToken;
      if (userToken) {
        headers['x-access-token'] = userToken;
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      if (userData) {
        headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
      }

      const response = await fetch('/api/giveaways', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create giveaway');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/giveaways'] });
      toast({
        title: "Success",
        description: "Giveaway created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create giveaway",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const adminToken = localStorage.getItem('adminAccessToken');
      const userToken = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminToken) headers['x-admin-token'] = adminToken;
      if (userToken) {
        headers['x-access-token'] = userToken;
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      if (userData) {
        headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
      }

      const response = await fetch(`/api/giveaways/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update giveaway');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/giveaways'] });
      toast({
        title: "Success",
        description: "Giveaway updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedGiveaway(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update giveaway",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const adminToken = localStorage.getItem('adminAccessToken');
      const userToken = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminToken) headers['x-admin-token'] = adminToken;
      if (userToken) {
        headers['x-access-token'] = userToken;
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      if (userData) {
        headers['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
      }

      const response = await fetch(`/api/giveaways/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete giveaway');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/giveaways'] });
      toast({
        title: "Success",
        description: "Giveaway deleted successfully",
      });
      setGiveawayToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete giveaway",
        variant: "destructive",
      });
    },
  });

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 300;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(durationMs / 1000));
  };

  const formatDateTimeLocal = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const getMinDateTime = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Giveaway name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startedtime || !formData.endedtime) {
      toast({
        title: "Error",
        description: "Start and end times are required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.shipping_profile) {
      toast({
        title: "Error",
        description: "Shipping profile is required",
        variant: "destructive",
      });
      return;
    }

    const duration = calculateDuration(formData.startedtime, formData.endedtime);
    
    // Convert local datetime to ISO string for the API
    const startedtimeISO = new Date(formData.startedtime).toISOString();
    const endedtimeISO = new Date(formData.endedtime).toISOString();

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      startedtime: startedtimeISO,
      endedtime: endedtimeISO,
      duration,
      quantity: formData.quantity,
      images: formData.images,
      type: "icona",
      ...(formData.shipping_profile && { shipping_profile: formData.shipping_profile }),
    });
  };

  const handleEdit = () => {
    if (!selectedGiveaway) return;
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Giveaway name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.shipping_profile) {
      toast({
        title: "Error",
        description: "Shipping profile is required",
        variant: "destructive",
      });
      return;
    }

    const duration = calculateDuration(formData.startedtime, formData.endedtime);
    
    // Convert local datetime to ISO string for the API
    const startedtimeISO = formData.startedtime ? new Date(formData.startedtime).toISOString() : undefined;
    const endedtimeISO = formData.endedtime ? new Date(formData.endedtime).toISOString() : undefined;

    updateMutation.mutate({
      id: selectedGiveaway._id,
      data: {
        name: formData.name,
        description: formData.description,
        startedtime: startedtimeISO,
        endedtime: endedtimeISO,
        duration,
        quantity: formData.quantity,
        images: formData.images,
        ...(formData.shipping_profile && { shipping_profile: formData.shipping_profile }),
      },
    });
  };

  const openEditDialog = (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    const shippingProfileId = typeof giveaway.shipping_profile === 'object' 
      ? giveaway.shipping_profile?._id 
      : giveaway.shipping_profile || "";
    setFormData({
      name: giveaway.name || "",
      description: giveaway.description || "",
      startedtime: formatDateTimeLocal(giveaway.startedtime),
      endedtime: formatDateTimeLocal(giveaway.endedtime),
      quantity: giveaway.quantity || 1,
      images: giveaway.images || [],
      shipping_profile: shippingProfileId,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (giveaway: Giveaway) => {
    const status = giveaway.status || "active";
    if (status === "ended" || status === "completed") {
      return <Badge variant="secondary">Ended</Badge>;
    }
    if (status === "pending") {
      return <Badge variant="outline">Pending</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Giveaways</h1>
            <p className="text-muted-foreground">
              Create and manage giveaways for your marketplace
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Giveaway
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              All Giveaways
            </CardTitle>
            <CardDescription>
              Total: {totalDocs} giveaways
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
              {searchName && (
                <Button onClick={handleClearSearch} variant="outline">
                  Clear
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : giveaways.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No giveaways found</p>
                <p className="text-sm">Create your first giveaway to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {giveaways.map((giveaway: Giveaway) => (
                  <div
                    key={giveaway._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {giveaway.images?.[0] ? (
                          <img
                            src={getImageUrl(giveaway.images[0], externalApiUrl)}
                            alt={giveaway.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <Gift className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{giveaway.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {giveaway.startedtime && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(giveaway.startedtime), 'MMM d, yyyy h:mm a')}
                              {giveaway.endedtime && ` - ${format(new Date(giveaway.endedtime), 'MMM d, yyyy h:mm a')}`}
                            </span>
                          )}
                          {giveaway.participants && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {giveaway.participants.length} participants
                            </span>
                          )}
                          {giveaway.bookmarked && (
                            <span className="flex items-center gap-1">
                              <Bookmark className="h-3 w-3" />
                              {giveaway.bookmarked.length} bookmarked
                            </span>
                          )}
                        </div>
                        {giveaway.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {giveaway.description.substring(0, 50)}{giveaway.description.length > 50 ? '...' : ''}
                          </p>
                        )}
                        {giveaway.winner && (
                          <div 
                            className="flex items-center gap-2 mt-1 cursor-pointer hover:opacity-80"
                            onClick={(e) => {
                              e.stopPropagation();
                              const winnerId = typeof giveaway.winner === 'object' ? giveaway.winner._id : giveaway.winner;
                              if (winnerId) navigate(`/admin/users/${winnerId}`);
                            }}
                          >
                            {typeof giveaway.winner === 'object' && giveaway.winner.profilePhoto && (
                              <img 
                                src={giveaway.winner.profilePhoto} 
                                alt="Winner" 
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            )}
                            <p className="text-sm text-green-600 font-medium hover:underline">
                              Winner: {typeof giveaway.winner === 'object' ? giveaway.winner.userName : giveaway.winner}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(giveaway)}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(giveaway)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(giveaway)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setGiveawayToDelete(giveaway._id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages >= 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {giveaways.length} of {totalDocs} giveaways (Page {page} of {totalPages})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Giveaway</DialogTitle>
              <DialogDescription>
                Create a new giveaway for your marketplace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter giveaway name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the giveaway"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startedtime">Start Time *</Label>
                  <Input
                    id="startedtime"
                    type="datetime-local"
                    value={formData.startedtime}
                    min={getMinDateTime()}
                    onChange={(e) => setFormData(prev => ({ ...prev, startedtime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endedtime">End Time *</Label>
                  <Input
                    id="endedtime"
                    type="datetime-local"
                    value={formData.endedtime}
                    min={formData.startedtime || getMinDateTime()}
                    onChange={(e) => setFormData(prev => ({ ...prev, endedtime: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                  className="w-32"
                />
              </div>
              <div>
                <Label htmlFor="shipping-profile">Shipping Profile *</Label>
                <Select
                  value={formData.shipping_profile}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shipping_profile: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shipping profile" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {shippingProfiles.length === 0 ? (
                      <SelectItem value="none" disabled>No shipping profiles available</SelectItem>
                    ) : (
                      shippingProfiles.map((profile: any) => (
                        <SelectItem key={profile._id} value={profile._id}>
                          {profile.name} {profile.weight && `(${profile.weight} ${profile.scale || 'oz'})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border bg-muted">
                        <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="mx-auto w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Add Image'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                        disabled={isUploading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Giveaway"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Giveaway</DialogTitle>
              <DialogDescription>
                Update giveaway details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter giveaway name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the giveaway"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startedtime">Start Time *</Label>
                  <Input
                    id="edit-startedtime"
                    type="datetime-local"
                    value={formData.startedtime}
                    min={getMinDateTime()}
                    onChange={(e) => setFormData(prev => ({ ...prev, startedtime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endedtime">End Time *</Label>
                  <Input
                    id="edit-endedtime"
                    type="datetime-local"
                    value={formData.endedtime}
                    min={formData.startedtime || getMinDateTime()}
                    onChange={(e) => setFormData(prev => ({ ...prev, endedtime: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                  className="w-32"
                />
              </div>
              <div>
                <Label htmlFor="edit-shipping-profile">Shipping Profile *</Label>
                <Select
                  value={formData.shipping_profile}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shipping_profile: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shipping profile" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {shippingProfiles.length === 0 ? (
                      <SelectItem value="none" disabled>No shipping profiles available</SelectItem>
                    ) : (
                      shippingProfiles.map((profile: any) => (
                        <SelectItem key={profile._id} value={profile._id}>
                          {profile.name} {profile.weight && `(${profile.weight} ${profile.scale || 'oz'})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border bg-muted">
                        <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="mx-auto w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Add Image'}
                      </Button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                        disabled={isUploading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedGiveaway?.name}</DialogTitle>
            </DialogHeader>
            {selectedGiveaway && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedGiveaway)}
                  {selectedGiveaway.participants && (
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedGiveaway.participants.length} participants
                    </Badge>
                  )}
                </div>
                {selectedGiveaway.description && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Description</h4>
                    <p>{selectedGiveaway.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {selectedGiveaway.startedtime && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Start Time</h4>
                      <p>{format(new Date(selectedGiveaway.startedtime), 'PPP p')}</p>
                    </div>
                  )}
                  {selectedGiveaway.endedtime && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">End Time</h4>
                      <p>{format(new Date(selectedGiveaway.endedtime), 'PPP p')}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Quantity</h4>
                  <p>{selectedGiveaway.quantity || 1}</p>
                </div>
                {selectedGiveaway.images && selectedGiveaway.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Images</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedGiveaway.images.map((img, index) => (
                        <img 
                          key={index}
                          src={img} 
                          alt={`${selectedGiveaway.name} ${index + 1}`} 
                          className="h-20 w-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {selectedGiveaway.winner && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Winner</h4>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                      onClick={() => {
                        const winnerId = typeof selectedGiveaway.winner === 'object' ? selectedGiveaway.winner._id : selectedGiveaway.winner;
                        if (winnerId) navigate(`/admin/users/${winnerId}`);
                      }}
                    >
                      {typeof selectedGiveaway.winner === 'object' && selectedGiveaway.winner.profilePhoto && (
                        <img 
                          src={selectedGiveaway.winner.profilePhoto} 
                          alt="Winner" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <p className="text-green-600 font-medium hover:underline">
                        {typeof selectedGiveaway.winner === 'object' ? selectedGiveaway.winner.userName : selectedGiveaway.winner}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => { setIsViewDialogOpen(false); if (selectedGiveaway) openEditDialog(selectedGiveaway); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!giveawayToDelete} onOpenChange={() => setGiveawayToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Giveaway</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this giveaway? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => giveawayToDelete && deleteMutation.mutate(giveawayToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
