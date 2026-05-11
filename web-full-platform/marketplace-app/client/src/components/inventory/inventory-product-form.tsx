import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, X, Plus, Check, Calendar, Clock, Users, Search, Zap, Percent, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  productFormSchema,
  type ProductFormData,
  type TokshopProduct,
  type TokshopCategoriesResponse,
  type TokshopShippingProfilesResponse,
} from "@shared/schema";

// Predefined color options
const availableColors = [
  { name: "Red", color: "#f44336" },
  { name: "Blue", color: "#2196f3" },
  { name: "Green", color: "#4caf50" },
  { name: "Yellow", color: "#ffeb3b" },
  { name: "Black", color: "#000000" },
  { name: "White", color: "#ffffff" },
  { name: "Purple", color: "#9c27b0" },
  { name: "Orange", color: "#ff9800" },
  { name: "Gray", color: "#9e9e9e" },
];

interface InventoryProductFormProps {
  mode: "create" | "edit";
  product?: TokshopProduct;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function InventoryProductForm({
  mode,
  product,
  onSubmit,
  onCancel,
  isPending = false,
}: InventoryProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 1,
      category: "",
      listingType: "buy_now",
      weight: "",
      height: "",
      width: "",
      length: "",
      scale: "oz",
      shippingProfile: "",
      images: [],
      colors: [],
      sizes: [],
      featured: false,
      acceptsOffers: false,
      startingPrice: 1,
      duration: 5,
      sudden: false,
      list_individually: false,
      startTime: null,
      endTime: null,
      whocanenter: 'everyone',
      tokshow: "general",
      flash_sale: false,
      flash_sale_discount_type: 'percentage',
      flash_sale_discount_value: 0,
      flash_sale_buy_limit: 1,
      flash_sale_duration: 60,
      flash_sale_available_full_price: false,
      flash_live_reserved: true,
    },
  });

  // Watch flash sale enabled state
  const isFlashSaleEnabled = useWatch({ control: form.control, name: 'flash_sale' });
  const flashSaleDiscountType = useWatch({ control: form.control, name: 'flash_sale_discount_type' });
  const flashSaleDiscountValue = useWatch({ control: form.control, name: 'flash_sale_discount_value' });
  const productPrice = useWatch({ control: form.control, name: 'price' });

  // Calculate flash sale price
  const calculateFlashSalePrice = () => {
    const numPrice = Number(productPrice);
    const numDiscount = Number(flashSaleDiscountValue);
    if (!numPrice || numPrice <= 0 || !numDiscount || numDiscount <= 0) return null;
    if (flashSaleDiscountType === 'percentage') {
      const discount = (numPrice * numDiscount) / 100;
      return Math.max(0, numPrice - discount);
    } else {
      return Math.max(0, numPrice - numDiscount);
    }
  };
  const flashSalePrice = calculateFlashSalePrice();

  // Watch listing type and show selection to control form visibility
  // Use useWatch to ensure proper re-rendering when values change
  const listingType = useWatch({ control: form.control, name: 'listingType' });
  const selectedShow = useWatch({ control: form.control, name: 'tokshow' });
  const isFeatured = useWatch({ control: form.control, name: 'featured' });

  // Force featured to false when listing type is giveaway
  useEffect(() => {
    if (listingType === 'giveaway') {
      form.setValue('featured', false);
    }
  }, [listingType, form]);

  // Fetch categories
  const { data: categoriesResponse, isLoading: loadingCategories } = useQuery<TokshopCategoriesResponse>({
    queryKey: ["external-categories", user?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/categories?userId=${user?.id}&status=active&page=1&limit=100`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch shipping profiles
  const { data: shippingProfilesResponse, isLoading: loadingShippingProfiles } = useQuery<any[]>({
    queryKey: ["external-shipping-profiles", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID required");

      const response = await fetch(
        `/api/shipping/profiles/${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch shipping profiles: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch shows
  const { data: showsResponse, isLoading: loadingShows } = useQuery<{ rooms: Array<{ _id: string; title: string }> }>({
    queryKey: ["external-shows", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID required");

      const response = await fetch(
        `/api/rooms?userid=${user.id}&status=active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch shows: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const categories = categoriesResponse?.categories || [];
  const shippingProfiles = shippingProfilesResponse || [];
  const shows = showsResponse?.rooms || [];

  // Invalidate shows cache when dialog opens to fetch fresh data
  useEffect(() => {
    if (showDialogOpen && user?.id) {
      queryClient.invalidateQueries({ queryKey: ["external-shows", user.id] });
    }
  }, [showDialogOpen, user?.id]);

  // Update form when product data is loaded (edit mode)
  useEffect(() => {
    if (mode === "edit" && product && categoriesResponse) {
      // For auction products, get starting price from auction.baseprice or price field
      const getStartingPrice = () => {
        if ((product as any).listing_type === 'auction') {
          return (product as any).auction?.baseprice ?? product.price ?? 0;
        }
        return (product as any).startingPrice ?? 0;
      };
      
      form.reset({
        name: product.name || "",
        description: product.description || "",
        price: product.price ?? undefined,
        quantity: product.quantity ?? undefined,
        category: product.category?._id || "",
        listingType: (product as any).listing_type || "buy_now",
        weight: typeof product.weight === "string" ? product.weight : product.weight?.toString() || "",
        height: product.height || "",
        width: product.width || "",
        length: product.length || "",
        scale: product.scale || "oz",
        shippingProfile: product.shipping_profile?._id || "",
        images: product.images || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        featured: product.featured ?? false,
        acceptsOffers: (product as any).offer ?? (product as any).acceptsOffers ?? false,
        startTime: product.auction?.start_time_date
          ? new Date(product.auction.start_time_date).toISOString().slice(0, 16)
          : null,
        endTime: product.auction?.end_time_date
          ? new Date(product.auction.end_time_date).toISOString().slice(0, 16)
          : null,
        tokshow: (product as any).tokshow?._id || (product as any).tokshow || "general",
        startingPrice: getStartingPrice(),
        duration: (product as any).duration ?? 5,
        sudden: (product as any).sudden ?? false,
        list_individually: (product as any).list_individually ?? false,
        whocanenter: (product as any).whocanenter || 'everyone',
        flash_sale: (product as any).flash_sale ?? false,
        flash_sale_discount_type: (product as any).flash_sale_discount_type ?? 'percentage',
        flash_sale_discount_value: (product as any).flash_sale_discount_value ?? 0,
        flash_sale_buy_limit: (product as any).flash_sale_buy_limit ?? 1,
        flash_sale_duration: (product as any).flash_sale_duration ?? 60,
        flash_sale_available_full_price: (product as any).flash_sale_available_full_price ?? false,
        flash_live_reserved: (product as any).flash_live_reserved ?? true,
      });
    }
  }, [mode, product, categoriesResponse, form]);

  const handleSubmit = (data: ProductFormData) => {
    // Check if shipping profile is selected (required for all product types)
    if (!data.shippingProfile || data.shippingProfile === '' || data.shippingProfile === 'skip') {
      toast({
        title: "Shipping Profile Required",
        description: "All products must have a shipping profile. Please select a shipping profile to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if it's a live show auction without a show selected
    if (data.listingType === 'auction' && !data.featured && (!data.tokshow || data.tokshow === 'general')) {
      toast({
        title: "Show Required",
        description: "Live show auctions must be assigned to a show. Please select a show to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if it's a giveaway without a show selected
    if (data.listingType === 'giveaway' && (!data.tokshow || data.tokshow === 'general')) {
      toast({
        title: "Show Required",
        description: "Giveaways must be assigned to a show. Please select a show to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // If a show is selected, set featured to false
    // Also force featured to false for giveaways
    // Featured is true if trending is enabled OR (flash sale + available for full price)
    const baseFeature = data.featured || (data.flash_sale && data.flash_sale_available_full_price);
    const submitData: any = {
      ...data,
      featured: data.listingType === 'giveaway' ? false : (data.tokshow && data.tokshow !== 'general' ? false : baseFeature),
    };
    
    // Force duration to 300 seconds (5 minutes) for giveaways
    if (data.listingType === 'giveaway') {
      submitData.duration = 300;
    }
    
    // For auctions, harmonize price and startingPrice to be the same
    if (data.listingType === 'auction' && data.startingPrice !== undefined) {
      submitData.price = data.startingPrice;
      submitData.startingPrice = data.startingPrice;
    }
    
    // Convert datetime-local to timestamps in user's timezone before sending to server
    if (data.startTime) {
      submitData.startTimeTimestamp = new Date(data.startTime).getTime();
    }
    if (data.endTime) {
      submitData.endTimeTimestamp = new Date(data.endTime).getTime();
    }
    
    // Only include tokshow if it's not 'general'
    if (data.tokshow !== 'general') {
      submitData.tokshow = data.tokshow;
    } else {
      delete submitData.tokshow;
    }
    
    // Rename shippingProfile to shipping_profile for backend (only if provided)
    if (data.shippingProfile) {
      submitData.shipping_profile = data.shippingProfile;
    }
    delete submitData.shippingProfile;
    
    // Map acceptsOffers to offer for the backend API
    submitData.offer = data.acceptsOffers ?? false;
    delete submitData.acceptsOffers;
    
    // Ensure flash sale fields are explicitly included for buy_now products
    if (data.listingType === 'buy_now') {
      submitData.flash_sale = data.flash_sale ?? false;
      submitData.flash_sale_discount_type = data.flash_sale_discount_type ?? 'percentage';
      submitData.flash_sale_discount_value = data.flash_sale_discount_value ?? 0;
      submitData.flash_sale_buy_limit = data.flash_sale_buy_limit ?? 1;
      submitData.flash_sale_duration = data.flash_sale_duration ?? 60;
      submitData.flash_sale_available_full_price = data.flash_sale_available_full_price ?? false;
      submitData.flash_live_reserved = data.flash_live_reserved ?? true;
      
      console.log('⚡ Flash Sale fields being sent:', {
        flash_sale: submitData.flash_sale,
        flash_sale_discount_type: submitData.flash_sale_discount_type,
        flash_sale_discount_value: submitData.flash_sale_discount_value,
        flash_sale_buy_limit: submitData.flash_sale_buy_limit,
        flash_sale_duration: submitData.flash_sale_duration,
        flash_sale_available_full_price: submitData.flash_sale_available_full_price,
        flash_live_reserved: submitData.flash_live_reserved,
      });
    }
    
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential product details and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter product name" 
                          {...field} 
                          data-testid="input-product-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description" 
                          {...field} 
                          rows={4}
                          data-testid="textarea-product-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
                <CardDescription>
                  Set your product price and stock levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {listingType === 'buy_now' && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-product-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {listingType === 'auction' && (
                    <FormField
                      control={form.control}
                      name="startingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Price ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-starting-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-product-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Accept Offers - hidden when flash sale is enabled */}
                {listingType === 'buy_now' && !isFlashSaleEnabled && (
                  <FormField
                    control={form.control}
                    name="acceptsOffers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Accept Offers</FormLabel>
                          <FormDescription>
                            Allow buyers to make offers on this product
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-accepts-offers"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* Flash Sale Configuration for Buy Now products */}
                {listingType === 'buy_now' && (
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="flash_sale"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-yellow-500/30 p-4">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Flash Sale</FormLabel>
                              <FormDescription>
                                Pre-configure a flash sale discount for this product
                              </FormDescription>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-flash-sale"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {isFlashSaleEnabled && (
                      <div className="space-y-3 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-600">Flash Sale Settings</span>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="flash_sale_discount_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Type</FormLabel>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => field.onChange('percentage')}
                                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                                    field.value === 'percentage'
                                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-600'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                  }`}
                                >
                                  <Percent className="h-4 w-4" />
                                  <span className="text-sm">Percentage</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => field.onChange('fixed')}
                                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                                    field.value === 'fixed'
                                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-600'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                  }`}
                                >
                                  <DollarSign className="h-4 w-4" />
                                  <span className="text-sm">Fixed Amount</span>
                                </button>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="flash_sale_discount_value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {flashSaleDiscountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={flashSaleDiscountType === 'percentage' ? 100 : undefined}
                                    step={flashSaleDiscountType === 'percentage' ? 1 : 0.01}
                                    placeholder={flashSaleDiscountType === 'percentage' ? '20' : '5.00'}
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(value === '' ? 0 : parseFloat(value));
                                    }}
                                    className="pr-10"
                                    data-testid="input-flash-sale-discount"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                    {flashSaleDiscountType === 'percentage' ? '%' : '$'}
                                  </span>
                                </div>
                              </FormControl>
                              <FormDescription>
                                {flashSaleDiscountType === 'percentage' 
                                  ? 'Percentage off the original price (e.g., 20 = 20% off)'
                                  : 'Fixed dollar amount off the original price'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Flash Sale Price Preview */}
                        {flashSalePrice !== null && productPrice && Number(productPrice) > 0 && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-yellow-600">Flash Sale Price:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 line-through">${Number(productPrice).toFixed(2)}</span>
                                <span className="text-lg font-bold text-yellow-600">${flashSalePrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="flash_sale_buy_limit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Buy Limit (per buyer)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? 1 : parseInt(value));
                                  }}
                                  data-testid="input-flash-sale-buy-limit"
                                />
                              </FormControl>
                              <FormDescription>
                                Max items per buyer during flash sale
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="flash_sale_duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Flash Sale Duration</FormLabel>
                              <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="z-[10000]">
                                  <SelectItem value="10">10 sec</SelectItem>
                                  <SelectItem value="15">15 sec</SelectItem>
                                  <SelectItem value="20">20 sec</SelectItem>
                                  <SelectItem value="30">30 sec</SelectItem>
                                  <SelectItem value="45">45 sec</SelectItem>
                                  <SelectItem value="60">1 min</SelectItem>
                                  <SelectItem value="90">1 min 30 sec</SelectItem>
                                  <SelectItem value="120">2 min</SelectItem>
                                  <SelectItem value="150">2 min 30 sec</SelectItem>
                                  <SelectItem value="180">3 min</SelectItem>
                                  <SelectItem value="240">4 min</SelectItem>
                                  <SelectItem value="300">5 min</SelectItem>
                                  <SelectItem value="1200">20 min</SelectItem>
                                  <SelectItem value="1800">30 min</SelectItem>
                                  <SelectItem value="3600">1 hr</SelectItem>
                                  <SelectItem value="5400">1 hr 30 min</SelectItem>
                                  <SelectItem value="7200">2 hr</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                How long the flash sale will run when started
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="flash_sale_available_full_price"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Available For Full Price</FormLabel>
                                <FormDescription>
                                  Make this product available for full price outside of the flash sale
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-flash-sale-available-full-price"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="flash_live_reserved"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Reserve for Live</FormLabel>
                                <FormDescription>
                                  Reserve quantity for flash sale during live show
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-flash-live-reserved"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}

                {listingType === 'giveaway' && (
                  <>
                    <FormField
                      control={form.control}
                      name="whocanenter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Who Can Enter</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            data-testid="select-who-can-enter"
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select eligibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="everyone">Everyone</SelectItem>
                              <SelectItem value="followers">Followers Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Product Images Section */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload images of your product (up to 5 images)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploader
                          value={field.value || []}
                          onChange={field.onChange}
                          maxFiles={5}
                          maxFileSize={5 * 1024 * 1024} // 5MB
                          disabled={isPending}
                          allowFileStorage={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Column */}
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Category & Listing</CardTitle>
                <CardDescription>
                  Categorize your product and set listing type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Listing Type - FIRST because it controls other field visibility */}
                <FormField
                  control={form.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Type *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        data-testid="select-listing-type"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select listing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="buy_now">Buy Now</SelectItem>
                          <SelectItem value="auction">Auction</SelectItem>
                          <SelectItem value="giveaway">Giveaway</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how customers can purchase this product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={loadingCategories}
                        data-testid="select-product-category"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="skip">No Category</SelectItem>
                          {loadingCategories ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : categories && categories.length > 0 ? (
                            <>
                              {categories.map((category: any) => [
                                /* Parent Category */
                                <SelectItem key={category._id || category.id} value={category._id || category.id} className="font-semibold">
                                  {category.name}
                                </SelectItem>,
                                
                                /* Subcategories with indentation */
                                ...(category.subCategories && category.subCategories.length > 0 
                                  ? category.subCategories.map((subCategory: any) => (
                                      <SelectItem 
                                        key={subCategory._id || subCategory.id} 
                                        value={subCategory._id || subCategory.id}
                                        className="pl-6"
                                      >
                                        ↳ {subCategory.name}
                                      </SelectItem>
                                    ))
                                  : []
                                )
                              ])}
                            </>
                          ) : (
                            <SelectItem value="none" disabled>No categories available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hide show dropdown for featured auctions */}
                {!(listingType === 'auction' && isFeatured) && (
                  <FormField
                    control={form.control}
                    name="tokshow"
                    render={({ field }) => {
                      const selectedShow = shows?.find((s: any) => s._id === field.value);
                      const filteredShows = shows?.filter((show: any) => 
                        show.title?.toLowerCase().includes(searchQuery.toLowerCase())
                      ) || [];
                      
                      return (
                        <FormItem>
                          <FormLabel>
                            Assign to Show {(listingType === 'auction' && !isFeatured) || listingType === 'giveaway' ? <span className="text-destructive">*</span> : '(Optional)'}
                          </FormLabel>
                          {(listingType === 'auction' && !isFeatured) && (
                            <FormDescription>
                              Live show auctions must be assigned to a show
                            </FormDescription>
                          )}
                          {listingType === 'giveaway' && (
                            <FormDescription>
                              Giveaways must be assigned to a show
                            </FormDescription>
                          )}
                          <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              disabled={loadingShows}
                              data-testid="button-select-show"
                            >
                              {loadingShows ? (
                                "Loading shows..."
                              ) : field.value === "general" || !field.value ? (
                                "General Inventory"
                              ) : selectedShow ? (
                                <span className="flex items-center gap-2">
                                  {selectedShow.title}
                                  {((selectedShow as any).status === 'active' || (selectedShow as any).status === 'live') && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0">Live</Badge>
                                  )}
                                </span>
                              ) : (
                                "Select a show"
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Select Show</DialogTitle>
                              <DialogDescription>
                                Choose a show for this product or leave as general inventory
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search shows..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-9"
                                  data-testid="input-search-shows"
                                />
                              </div>
                              <ScrollArea className="h-[300px]">
                                <div className="space-y-2 pr-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange("general");
                                    setShowDialogOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className={`w-full max-w-full flex items-start justify-between gap-3 px-4 py-2.5 text-sm text-left rounded-md transition-colors ${
                                    field.value === "general" 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted hover:bg-muted/80"
                                  }`}
                                  data-testid="option-general-inventory"
                                >
                                  <span className="flex-1 min-w-0 whitespace-normal break-words font-medium">General Inventory</span>
                                  {field.value === "general" && <Check className="h-4 w-4 flex-shrink-0" />}
                                </button>
                                {loadingShows ? (
                                  <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                                ) : filteredShows.length > 0 ? (
                                  filteredShows.map((show: any) => {
                                    const isLive = (show as any).status === 'active' || (show as any).status === 'live';
                                    const isSelected = field.value === show._id;
                                    
                                    return (
                                      <button
                                        key={show._id}
                                        type="button"
                                        onClick={() => {
                                          field.onChange(show._id);
                                          setShowDialogOpen(false);
                                          setSearchQuery("");
                                        }}
                                        className={`w-full max-w-full flex items-start justify-between gap-3 px-4 py-2.5 text-sm text-left rounded-md transition-colors ${
                                          isSelected 
                                            ? "bg-primary text-primary-foreground" 
                                            : "bg-muted hover:bg-muted/80"
                                        }`}
                                        data-testid={`option-show-${show._id}`}
                                      >
                                        <span className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                                          <span className="whitespace-normal break-words font-medium">{show.title}</span>
                                          {isLive && (
                                            <Badge variant="destructive" className="text-xs px-1.5 py-0 flex-shrink-0">
                                              Live
                                            </Badge>
                                          )}
                                        </span>
                                        {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="py-8 text-center text-sm text-muted-foreground">
                                    {searchQuery ? "No shows found" : "No shows available"}
                                  </div>
                                )}
                                </div>
                              </ScrollArea>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <FormDescription>
                          Link this product to a specific show or leave as general inventory
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                  />
                )}

                {/* Only show Featured option when not a giveaway, not assigned to a specific show, and flash sale is not enabled */}
                {listingType !== 'giveaway' && selectedShow === 'general' && !isFlashSaleEnabled && (
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Featured Product</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                            className="flex flex-col space-y-1"
                            data-testid="radio-group-featured"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="featured-false" data-testid="radio-featured-false" />
                              <FormLabel htmlFor="featured-false" className="text-sm font-normal">
                                No
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="featured-true" data-testid="radio-featured-true" />
                              <FormLabel htmlFor="featured-true" className="text-sm font-normal">
                                Yes
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Mark this product as featured to highlight it
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* List Individually toggle for non-featured auctions */}
                {listingType === 'auction' && !isFeatured && (
                  <FormField
                    control={form.control}
                    name="list_individually"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">List Individually</FormLabel>
                          <FormDescription>
                            Turn this on if you want to create 25 instances of the same listing
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-list-individually"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* Show scheduling/duration fields for auctions */}
                {listingType === 'auction' && (
                  <div className="space-y-4 pt-4 border-t">
                    {selectedShow === 'general' && isFeatured ? (
                      <>
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Auction Start Time *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="datetime-local" 
                                  {...field}
                                  value={field.value || ''}
                                  data-testid="input-auction-start-time"
                                />
                              </FormControl>
                              <FormDescription>
                                When should this auction start?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Auction End Time *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="datetime-local" 
                                  {...field}
                                  value={field.value || ''}
                                  data-testid="input-auction-end-time"
                                />
                              </FormControl>
                              <FormDescription>
                                When should this auction end?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auction Duration (minutes) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                placeholder="5" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-auction-duration"
                              />
                            </FormControl>
                            <FormDescription>
                              How long the auction will run (for live show auctions)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Shipping</CardTitle>
                <CardDescription>
                  Configure shipping preferences for this product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="shippingProfile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Profile <span className="text-red-500">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={loadingShippingProfiles}
                        data-testid="select-shipping-profile"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shipping profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingProfiles.map((profile) => (
                            <SelectItem key={profile._id} value={profile._id}>
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            data-testid="button-save-product"
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isPending ? (mode === "create" ? "Creating..." : "Updating...") : (mode === "create" ? "Create Product" : "Update Product")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
