import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';
import {
  CitySelect,
  CountrySelect,
  StateSelect,
} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  address?: any;
}

export function AddAddressDialog({
  open,
  onOpenChange,
  onSuccess,
  address,
}: AddAddressDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const userData = user as any;
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!address;

  const [streetAddress, setStreetAddress] = useState("");
  const [streetAddress2, setStreetAddress2] = useState("");
  const [countryid, setCountryid] = useState(0);
  const [stateid, setStateid] = useState(0);
  const [cityid, setCityid] = useState(0);
  
  const [countryData, setCountryData] = useState<any>(null);
  const [stateData, setStateData] = useState<any>(null);
  const [cityData, setCityData] = useState<any>(null);
  
  const [zipCode, setZipCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;

    if (address) {
      setName(address.name || "");
      setStreetAddress(address.addrress1 || address.address1 || "");
      setStreetAddress2(address.addrress2 || address.address2 || "");
      setZipCode(address.zipcode || address.zip || "");
      setPhoneNumber(address.phone || "");
    } else {
      setName("");
      setStreetAddress("");
      setStreetAddress2("");
      setCountryid(0);
      setStateid(0);
      setCityid(0);
      setCountryData(null);
      setStateData(null);
      setCityData(null);
      setZipCode("");
      setPhoneNumber("");
    }
  }, [address, open]);

  const handleAddAddress = async () => {
    if (!streetAddress || !countryData || !stateData || !cityData || !zipCode || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const addressData = {
        name: name || userData?.firstName || 'Default',
        addrress1: streetAddress,
        addrress2: streetAddress2,
        country: countryData.name,
        city: cityData.name,
        countryCode: countryData.iso2,
        zipcode: zipCode,
        state: stateData.name,
        stateCode: stateData.state_code,
        userId: userData?.id,
        phone: phoneNumber.trim().replace(/\s/g, ''),
        email: userData?.email || '',
        primary: address?.primary || false,
        applying: false,
      };

      if (isEditing && address._id) {
        await apiRequest('PUT', `/api/address/${address._id}`, addressData);
        toast({
          title: "Address Updated",
          description: "Your shipping address has been updated successfully.",
        });
      } else {
        await apiRequest('POST', '/api/address', addressData);
        toast({
          title: "Address Added",
          description: "Your shipping address has been saved successfully.",
        });
      }

      setStreetAddress("");
      setStreetAddress2("");
      setCountryid(0);
      setStateid(0);
      setCityid(0);
      setCountryData(null);
      setStateData(null);
      setCityData(null);
      setZipCode("");
      setPhoneNumber("");
      setName("");

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to add/update address:', error);

      let errorMessage = isEditing
        ? "Failed to update address. Please try again."
        : "Failed to add address. Please try again.";

      if (error?.text) {
        try {
          const errorData = JSON.parse(error.text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          if (typeof error.text === 'string') {
            errorMessage = error.text;
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-add-address">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your shipping address." : "Add a new shipping or billing address."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="street-address">Street Address</Label>
            <Input
              id="street-address"
              placeholder="123 Main Street"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              data-testid="input-street-address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street-address-2">Street Address 2 (Optional)</Label>
            <Input
              id="street-address-2"
              placeholder="Apt, Suite, Unit, etc."
              value={streetAddress2}
              onChange={(e) => setStreetAddress2(e.target.value)}
              data-testid="input-street-address-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <CountrySelect
              onChange={(e: any) => {
                setCountryid(e.id);
                setCountryData(e);
                setStateid(0);
                setCityid(0);
                setStateData(null);
                setCityData(null);
              }}
              placeHolder="Select Country"
              containerClassName="w-full"
              inputClassName="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>State/Province</Label>
              <StateSelect
                countryid={countryid}
                onChange={(e: any) => {
                  setStateid(e.id);
                  setStateData(e);
                  setCityid(0);
                  setCityData(null);
                }}
                placeHolder="Select State"
                containerClassName="w-full"
                inputClassName="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <CitySelect
                countryid={countryid}
                stateid={stateid}
                onChange={(e: any) => {
                  setCityid(e.id);
                  setCityData(e);
                }}
                placeHolder="Select City"
                containerClassName="w-full"
                inputClassName="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP/Postal Code</Label>
            <Input
              id="zip"
              placeholder="10001"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              data-testid="input-zip"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              data-testid="input-phone"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            data-testid="button-cancel"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddAddress}
            disabled={isLoading}
            data-testid="button-add-address"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Address" : "Add Address")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddAddressDialog;
