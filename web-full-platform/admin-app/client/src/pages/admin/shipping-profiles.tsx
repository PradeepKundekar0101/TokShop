import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Trash2, Edit, Search, ChevronLeft, ChevronRight, Package, Scale, Ruler } from "lucide-react";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShippingProfile {
  _id: string;
  name: string;
  description?: string;
  weight?: number;
  scale?: string;
  length?: number;
  width?: number;
  height?: number;
  user?: any;
  createdAt?: string;
}

export default function AdminShippingProfiles() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ShippingProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    weight: "",
    scale: "oz",
    length: "",
    width: "",
    height: "",
  });
  const { toast } = useToast();

  const { data: profilesData, isLoading } = useQuery<any>({
    queryKey: ['/api/shipping/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/shipping/profiles', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch shipping profiles');
      return response.json();
    },
  });

  const profiles = Array.isArray(profilesData?.data) 
    ? profilesData.data 
    : Array.isArray(profilesData) 
      ? profilesData 
      : profilesData?._id 
        ? [profilesData] 
        : [];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      weight: "",
      scale: "oz",
      length: "",
      width: "",
      height: "",
    });
  };

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

      const response = await fetch('/api/shipping/profiles', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create shipping profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/profiles'] });
      toast({
        title: "Success",
        description: "Shipping profile created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipping profile",
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

      const response = await fetch(`/api/shipping/profiles/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update shipping profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/profiles'] });
      toast({
        title: "Success",
        description: "Shipping profile updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedProfile(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shipping profile",
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

      const response = await fetch(`/api/shipping/profiles/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete shipping profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/profiles'] });
      toast({
        title: "Success",
        description: "Shipping profile deleted successfully",
      });
      setProfileToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shipping profile",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Profile name is required",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      scale: formData.scale,
      length: formData.length ? parseFloat(formData.length) : undefined,
      width: formData.width ? parseFloat(formData.width) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
    });
  };

  const handleEdit = () => {
    if (!selectedProfile) return;
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Profile name is required",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: selectedProfile._id,
      data: {
        name: formData.name,
        description: formData.description,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        scale: formData.scale,
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
      },
    });
  };

  const openEditDialog = (profile: ShippingProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name || "",
      description: profile.description || "",
      weight: profile.weight?.toString() || "",
      scale: profile.scale || "oz",
      length: profile.length?.toString() || "",
      width: profile.width?.toString() || "",
      height: profile.height?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shipping Profiles</h1>
            <p className="text-muted-foreground">
              Manage general shipping profiles for giveaways and products
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shipping Profile
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              All Shipping Profiles
            </CardTitle>
            <CardDescription>
              {profiles.length} shipping profile{profiles.length !== 1 ? 's' : ''} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shipping profiles found</p>
                <p className="text-sm">Create your first shipping profile to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile: ShippingProfile) => (
                  <div
                    key={profile._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{profile.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {profile.weight && (
                            <span className="flex items-center gap-1">
                              <Scale className="h-3 w-3" />
                              {profile.weight} {profile.scale || 'oz'}
                            </span>
                          )}
                          {(profile.length || profile.width || profile.height) && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              {profile.length || 0} × {profile.width || 0} × {profile.height || 0} in
                            </span>
                          )}
                        </div>
                        {profile.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {profile.description.substring(0, 50)}{profile.description.length > 50 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(profile)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProfileToDelete(profile._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Shipping Profile</DialogTitle>
              <DialogDescription>
                Add a new general shipping profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Small Package"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="scale">Unit</Label>
                  <Select
                    value={formData.scale}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, scale: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Dimensions (inches)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.length}
                    onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                    placeholder="L"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.width}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="W"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="H"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Profile"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Shipping Profile</DialogTitle>
              <DialogDescription>
                Update shipping profile details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Small Package"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-weight">Weight</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-scale">Unit</Label>
                  <Select
                    value={formData.scale}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, scale: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Dimensions (inches)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.length}
                    onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                    placeholder="L"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.width}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="W"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="H"
                  />
                </div>
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

        <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shipping Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this shipping profile? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => profileToDelete && deleteMutation.mutate(profileToDelete)}
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
