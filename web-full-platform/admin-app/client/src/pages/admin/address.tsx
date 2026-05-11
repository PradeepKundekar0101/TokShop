import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Save, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";

interface Address {
  _id?: string;
  name: string;
  phone: string;
  email: string;
  addrress1: string;
  addrress2?: string;
  city: string;
  state: string;
  zipcode: string;
  countryCode: string;
}

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export default function AdminAddress() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Address>({
    name: "",
    phone: "",
    email: "",
    addrress1: "",
    addrress2: "",
    city: "",
    state: "",
    zipcode: "",
    countryCode: "US",
  });
  const { toast } = useToast();

  const userId = user?.id || user?._id;

  const { data: addressData, isLoading } = useQuery<any>({
    queryKey: ['/api/address/all', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/address/all/${userId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch address');
      }
      return response.json();
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  useEffect(() => {
    if (addressData && addressData.length > 0) {
      const addr = addressData.find((a: any) => a.primary) || addressData[0];
      setFormData({
        _id: addr._id,
        name: addr.name || "",
        phone: addr.phone || "",
        email: addr.email || "",
        addrress1: addr.addrress1 || "",
        addrress2: addr.addrress2 || "",
        city: addr.city || "",
        state: addr.state || addr.stateCode || "",
        zipcode: addr.zipcode || addr.zip || "",
        countryCode: addr.countryCode || "US",
      });
    }
  }, [addressData]);

  const saveMutation = useMutation({
    mutationFn: async (data: Address) => {
      const adminToken = localStorage.getItem('adminAccessToken');
      const userToken = localStorage.getItem('accessToken');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminToken) headers['x-admin-token'] = adminToken;
      if (userToken) {
        headers['x-access-token'] = userToken;
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const stateInfo = US_STATES.find(s => s.value === data.state);
      
      const payload = {
        userId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        addrress1: data.addrress1,
        addrress2: data.addrress2 || "",
        city: data.city,
        state: stateInfo?.label || data.state,
        stateCode: data.state,
        zipcode: data.zipcode,
        country: "United States",
        countryCode: data.countryCode,
      };

      const response = await fetch('/api/address', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to save address');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/address/all', userId] });
      toast({
        title: "Success",
        description: "Business address saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Business name is required", variant: "destructive" });
      return;
    }
    if (!formData.phone.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }
    if (!formData.addrress1.trim()) {
      toast({ title: "Error", description: "Street address is required", variant: "destructive" });
      return;
    }
    if (!formData.city.trim()) {
      toast({ title: "Error", description: "City is required", variant: "destructive" });
      return;
    }
    if (!formData.state) {
      toast({ title: "Error", description: "State is required", variant: "destructive" });
      return;
    }
    if (!formData.zipcode.trim()) {
      toast({ title: "Error", description: "ZIP code is required", variant: "destructive" });
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Business Address</h1>
            <p className="text-muted-foreground">
              Enter your valid business address for shipping and fulfillment
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Address Details</CardTitle>
            <CardDescription>
              This address will be validated and used as the return address for shipping labels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your business or company name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="business@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="addrress1">Street Address *</Label>
                  <Input
                    id="addrress1"
                    value={formData.addrress1}
                    onChange={(e) => setFormData(prev => ({ ...prev, addrress1: e.target.value }))}
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <Label htmlFor="addrress2">Address Line 2</Label>
                  <Input
                    id="addrress2"
                    value={formData.addrress2}
                    onChange={(e) => setFormData(prev => ({ ...prev, addrress2: e.target.value }))}
                    placeholder="Suite, unit, building, floor, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zipcode">ZIP Code *</Label>
                    <Input
                      id="zipcode"
                      value={formData.zipcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipcode: e.target.value }))}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="countryCode">Country</Label>
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                  >
                    <SelectTrigger id="countryCode">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={saveMutation.isPending} className="w-full">
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating & Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Address
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
