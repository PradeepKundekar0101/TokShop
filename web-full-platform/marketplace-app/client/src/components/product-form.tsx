import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Switch } from "@/components/ui/switch";
import { uploadImagesToFirebase } from "@/lib/upload-images";
import { useState, useEffect } from "react";
import {
  productFormSchema,
  type ProductFormData,
  type TokshopCategoriesResponse,
  type ListingType,
  type TokshopCategory,
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight, Clock, Zap, Percent, DollarSign } from "lucide-react";

interface ProductFormProps {
  listingType?: ListingType;
  roomId?: string;
  existingProduct?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
}

export function ProductForm({
  listingType = 'buy_now',
  roomId,
  existingProduct,
  onSuccess,
  onCancel,
  submitButtonText = "Create Product",
  showCancelButton = false,
}: ProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 1,
      quantity: 1,
      category: "",
      listingType: listingType,
      shippingProfile: "",
      images: [],
      startingPrice: 1,
      duration: 5,
      sudden: false,
      featured: false,
      list_individually: false,
      whocanenter: 'everyone',
      tokshow: roomId || "",
      acceptsOffers: false,
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

  // Watch the listing type from the form
  // Use useWatch to ensure proper re-rendering when value changes
  const currentListingType = useWatch({ control: form.control, name: 'listingType' });
  const isFeatured = useWatch({ control: form.control, name: 'featured' });

  // Force featured to false when listing type is giveaway
  useEffect(() => {
    if (currentListingType === 'giveaway') {
      form.setValue('featured', false);
    }
  }, [currentListingType, form]);

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

  // Pre-fill form and images when editing
  useEffect(() => {
    if (existingProduct && !loadingShippingProfiles) {
      console.log('Existing product data:', existingProduct);
      
      // Extract values with proper fallbacks
      const categoryId = existingProduct.category?._id || existingProduct.category || "";
      // Handle both camelCase and snake_case, and extract _id if it's an object
      const shippingProfileData = existingProduct.shippingProfile || existingProduct.shipping_profile;
      const shippingProfileId = typeof shippingProfileData === 'object' && shippingProfileData?._id 
        ? shippingProfileData._id 
        : (typeof shippingProfileData === 'string' && shippingProfileData !== 'skip' ? shippingProfileData : "");
      
      // For auction products, check both top level and auction object
      const productQuantity = existingProduct.quantity || existingProduct.auction?.quantity || 1;
      const productStartingPrice = existingProduct.startingPrice || existingProduct.price || existingProduct.auction?.baseprice || 0;
      const productDuration = existingProduct.auction?.duration || existingProduct.duration || 5;
      const productSudden = existingProduct.auction?.sudden || existingProduct.sudden || false;
      
      // API returns 'offer' field, but form uses 'acceptsOffers'
      const acceptsOffersValue = existingProduct.offer ?? existingProduct.acceptsOffers ?? false;
      
      // Flash sale fields
      const flashSaleEnabled = existingProduct.flash_sale ?? false;
      const flashSaleDiscountType = existingProduct.flash_sale_discount_type ?? 'percentage';
      const flashSaleDiscountValue = existingProduct.flash_sale_discount_value ?? 0;
      const flashSaleBuyLimit = existingProduct.flash_sale_buy_limit ?? 1;
      const flashSaleDuration = existingProduct.flash_sale_duration ?? 60;
      const flashSaleAvailableFullPrice = existingProduct.flash_sale_available_full_price ?? false;
      const flashLiveReserved = existingProduct.flash_live_reserved ?? true;
      
      console.log('Form values being set:', {
        name: existingProduct.name,
        quantity: productQuantity,
        startingPrice: productStartingPrice,
        duration: productDuration,
        sudden: productSudden,
        shippingProfile: shippingProfileId,
        category: categoryId,
        acceptsOffers: acceptsOffersValue,
        flash_sale: flashSaleEnabled,
        flash_sale_discount_type: flashSaleDiscountType,
        flash_sale_discount_value: flashSaleDiscountValue,
        flash_sale_buy_limit: flashSaleBuyLimit,
        flash_sale_duration: flashSaleDuration,
        flash_sale_available_full_price: flashSaleAvailableFullPrice,
        flash_live_reserved: flashLiveReserved,
      });
      
      // Reset form with existing product data
      // Force empty string for shippingProfile if it's "skip" or invalid
      const validShippingProfile = shippingProfileId && shippingProfileId !== 'skip' ? shippingProfileId : "";
      
      form.reset({
        name: existingProduct.name || "",
        description: existingProduct.description || "",
        price: existingProduct.price || 0,
        quantity: productQuantity,
        category: categoryId,
        listingType: listingType,
        shippingProfile: validShippingProfile,
        images: existingProduct.images || [],
        startingPrice: productStartingPrice,
        duration: productDuration,
        sudden: productSudden,
        tokshow: roomId || existingProduct.tokshow || "",
        acceptsOffers: acceptsOffersValue,
        flash_sale: flashSaleEnabled,
        flash_sale_discount_type: flashSaleDiscountType,
        flash_sale_discount_value: flashSaleDiscountValue,
        flash_sale_buy_limit: flashSaleBuyLimit,
        flash_sale_duration: flashSaleDuration,
        flash_sale_available_full_price: flashSaleAvailableFullPrice,
        flash_live_reserved: flashLiveReserved,
      });
      
      // Set preview images
      if (existingProduct.images && existingProduct.images.length > 0) {
        setPreviewUrls(existingProduct.images);
      }
    }
  }, [existingProduct, form, listingType, roomId, loadingShippingProfiles]);

  // Create/Update product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const isEditing = !!existingProduct;
      const productId = existingProduct?._id || existingProduct?.id;
      const isGiveaway = productData.listingType === 'giveaway';
      
      let url: string;
      let method: string;
      
      if (isGiveaway) {
        // For giveaways, use the giveaways endpoint
        url = isEditing ? `/api/giveaways/${productId}` : `/api/giveaways`;
        method = isEditing ? "PUT" : "POST";
      } else {
        // For regular products (buy_now, auction)
        url = isEditing 
          ? `/api/products/${productId}` 
          : `/api/products/${user?.id}`;
        method = isEditing ? "PATCH" : "POST";
      }
      
      console.log('🔍 Mutation - URL:', url);
      console.log('🔍 Mutation - Method:', method);
      console.log('🔍 Mutation - User ID:', user?.id);
      console.log('🔍 Mutation - Product Data:', productData);
      
      // Use apiRequest which includes authentication headers
      const response = await apiRequest(method, url, productData);

      console.log('🔍 Mutation - Response status:', response.status);
      console.log('🔍 Mutation - Response OK:', response.ok);
      
      const responseData = await response.json();
      console.log('✅ Mutation - Success data:', responseData);
      return responseData;
    },
    onSuccess: (data, variables) => {
      const isGiveaway = variables.listingType === 'giveaway';
      // Invalidate all product queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["external-products"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/products"], refetchType: 'all' });
      // Also invalidate show queries to update pinned product data
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"], refetchType: 'all' });
      if (isGiveaway) {
        queryClient.invalidateQueries({ queryKey: ["/api/giveaways"], refetchType: 'all' });
      }
      if (!existingProduct) {
        form.reset();
      }
      onSuccess?.();
    },
    onError: (error: Error, variables) => {
      const isGiveaway = variables.listingType === 'giveaway';
      toast({
        title: existingProduct ? (isGiveaway ? "Failed to Update Giveaway" : "Failed to Update Product") : (isGiveaway ? "Failed to Create Giveaway" : "Failed to Create Product"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      console.log('📦 Form submission - shippingProfile value:', data.shippingProfile);
      
      // Check if shipping profile is selected (required for all product types)
      if (!data.shippingProfile || data.shippingProfile === '' || data.shippingProfile === 'skip') {
        console.log('❌ Shipping profile validation failed:', data.shippingProfile);
        toast({
          title: "Shipping Profile Required",
          description: "All products must have a shipping profile. Please select a shipping profile to continue.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Shipping profile validation passed:', data.shippingProfile);
      
      // Check if it's a giveaway without a show assigned
      if (data.listingType === 'giveaway' && (!data.tokshow || data.tokshow === '')) {
        toast({
          title: "Show Required",
          description: "Giveaways must be assigned to a show. Please assign a show to continue.",
          variant: "destructive",
        });
        return;
      }
      
      // Upload images to Firebase first if there are any
      let imageUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        setIsUploadingImages(true);
        
        try {
          // Generate a temporary product ID for Firebase storage path
          const tempProductId = `${user?.id}_${Date.now()}`;
          
          const uploadResults = await uploadImagesToFirebase(selectedFiles, tempProductId);
          imageUrls = uploadResults.map(result => result.url);
        } finally {
          setIsUploadingImages(false);
        }
      }
      
      // Build submit data based on listing type
      const submitData: any = {
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        category: data.category,
        tokshow: data.tokshow,
        images: imageUrls.length > 0 ? imageUrls : (existingProduct?.images || data.images),
        listingType: data.listingType,
      };
      
      // Add type-specific fields
      console.log('🔍 BEFORE adding type-specific fields - data.shippingProfile:', data.shippingProfile);
      
      if (currentListingType === 'buy_now') {
        submitData.price = data.price;
        submitData.shippingProfile = data.shippingProfile;
        // Featured is true if trending is enabled OR (flash sale + available for full price)
        submitData.featured = data.featured || (data.flash_sale && data.flash_sale_available_full_price);
        // Map acceptsOffers to offer for the backend API (same as inventory form)
        submitData.offer = data.acceptsOffers ?? false;
        
        // Flash sale fields
        submitData.flash_sale = data.flash_sale ?? false;
        submitData.flash_sale_discount_type = data.flash_sale_discount_type ?? 'percentage';
        submitData.flash_sale_discount_value = data.flash_sale_discount_value ?? 0;
        submitData.flash_sale_buy_limit = data.flash_sale_buy_limit ?? 1;
        submitData.flash_sale_duration = data.flash_sale_duration ?? 60;
        submitData.flash_sale_available_full_price = data.flash_sale_available_full_price ?? false;
        submitData.flash_live_reserved = data.flash_live_reserved ?? true;
        
        console.log('🛒 Buy Now - setting shippingProfile to:', data.shippingProfile);
        console.log('🛒 Buy Now - setting offer (acceptsOffers) to:', data.acceptsOffers);
        console.log('⚡ Flash Sale fields:', {
          flash_sale: submitData.flash_sale,
          flash_sale_discount_type: submitData.flash_sale_discount_type,
          flash_sale_discount_value: submitData.flash_sale_discount_value,
          flash_sale_buy_limit: submitData.flash_sale_buy_limit,
          flash_sale_duration: submitData.flash_sale_duration,
          flash_sale_available_full_price: submitData.flash_sale_available_full_price,
          flash_live_reserved: submitData.flash_live_reserved,
        });
      } else if (currentListingType === 'auction') {
        submitData.startingPrice = data.startingPrice;
        submitData.price = data.startingPrice; // Backend expects price
        submitData.duration = data.duration;
        submitData.sudden = data.sudden;
        submitData.list_individually = data.list_individually;
        submitData.shippingProfile = data.shippingProfile;
        console.log('🎯 Auction - setting shippingProfile to:', data.shippingProfile);
        console.log('🎯 Auction - list_individually:', data.list_individually);
      } else if (currentListingType === 'giveaway') {
        submitData.duration = 300; // Giveaway duration: 5 minutes (300 seconds)
        submitData.whocanenter = data.whocanenter;
        submitData.shippingProfile = data.shippingProfile;
        submitData.featured = false; // Giveaways cannot be featured
        submitData.type = 'show'; // Giveaways created during a show have type 'show'
        console.log('🎁 Giveaway - setting shippingProfile to:', data.shippingProfile);
      }
      
      console.log('📦 FINAL submitData being sent to mutation:', JSON.stringify(submitData, null, 2));
      console.log('📦 submitData.shippingProfile =', submitData.shippingProfile);
      
      createProductMutation.mutate(submitData);
    } catch (error) {
      setIsUploadingImages(false);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Display validation errors
  const handleInvalidSubmit = () => {
    const errors = form.formState.errors;
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast({
        title: "Validation Error",
        description: firstError.message as string,
        variant: "destructive",
      });
    }
  };

  const categories = categoriesResponse?.categories || [];
  const shippingProfiles = shippingProfilesResponse || [];

  // Category dialog state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<TokshopCategory | null>(null);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);

  // Load recent categories on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentCategories');
    if (stored) {
      try {
        setRecentCategories(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent categories:', e);
      }
    }
  }, []);

  // Save category to recent when selected
  const handleCategorySelect = (category: TokshopCategory, parentName?: string) => {
    form.setValue('category', category._id);
    
    // Update recent categories
    const updated = [category._id, ...recentCategories.filter(id => id !== category._id)].slice(0, 5);
    setRecentCategories(updated);
    localStorage.setItem('recentCategories', JSON.stringify(updated));
    
    // Close dialog
    setShowCategoryDialog(false);
    setSelectedParentCategory(null);
  };

  // Flatten categories to include subcategories
  const flattenCategories = (cats: any[]): any[] => {
    const result: any[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.subCategories && cat.subCategories.length > 0) {
        result.push(...cat.subCategories.map((sub: any) => ({ ...sub, parentName: cat.name })));
      }
    });
    return result;
  };

  const allCategories = flattenCategories(categories);
  const recentCategoryItems = recentCategories
    .map(id => allCategories.find(cat => cat._id === id))
    .filter(Boolean);
  
  // Get selected category name
  const selectedCategoryName = allCategories.find(cat => cat._id === form.watch('category'))?.name || allCategories.find(cat => cat._id === form.watch('category'))?.parentName;

  const handleFormSubmit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const isValid = await form.trigger();
    if (isValid) {
      onSubmit(form.getValues());
    } else {
      handleInvalidSubmit();
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleFormSubmit();
        }} 
        className="space-y-3"
      >
        {/* Listing Type Selector */}
        <FormField
          control={form.control}
          name="listingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-medium">Listing Type</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => field.onChange('buy_now')}
                    className={`
                      px-4 py-2.5 rounded-md text-sm font-medium transition-all
                      ${field.value === 'buy_now'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }
                    `}
                    data-testid="button-listing-type-buy-now"
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('auction')}
                    className={`
                      px-4 py-2.5 rounded-md text-sm font-medium transition-all
                      ${field.value === 'auction'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }
                    `}
                    data-testid="button-listing-type-auction"
                  >
                    Auction
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('giveaway')}
                    className={`
                      px-4 py-2.5 rounded-md text-sm font-medium transition-all
                      ${field.value === 'giveaway'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }
                    `}
                    data-testid="button-listing-type-giveaway"
                  >
                    Giveaway
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Images - Compact */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-medium">Product Images</FormLabel>
              <FormControl>
                <div 
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-zinc-600 transition-colors"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (e: any) => {
                      const files = Array.from(e.target.files || []) as File[];
                      const newFiles = files.slice(0, 3 - selectedFiles.length);
                      
                      // Store actual file objects
                      const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 3);
                      setSelectedFiles(updatedFiles);
                      
                      // Create preview URLs for display
                      const newUrls = newFiles.map(f => URL.createObjectURL(f));
                      const updatedUrls = [...previewUrls, ...newUrls].slice(0, 3);
                      setPreviewUrls(updatedUrls);
                      
                      // Update form value (will be replaced with Firebase URLs on submit)
                      field.onChange(updatedUrls);
                    };
                    input.click();
                  }}
                >
                  {previewUrls.length > 0 ? (
                    <div className="flex gap-2 flex-wrap justify-center">
                      {previewUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="" className="w-16 h-16 object-cover rounded" />
                      ))}
                      {previewUrls.length < 3 && (
                        <div className="w-16 h-16 border border-zinc-700 rounded flex items-center justify-center text-zinc-500 text-xs">
                          +
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-400 text-sm">
                      <div className="mb-1">📷</div>
                      <div>Upload product images</div>
                      <div className="text-xs text-zinc-500 mt-1">JPG, PNG, GIF up to 5MB each</div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-medium">Product Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter product name" 
                  {...field} 
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                  data-testid="input-product-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-medium">Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter product description" 
                  {...field} 
                  rows={2}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                  data-testid="textarea-product-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white font-medium">Category</FormLabel>
              <FormControl>
                <div
                  onClick={() => setShowCategoryDialog(true)}
                  className="bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 cursor-pointer hover:bg-zinc-750 transition-colors"
                  data-testid="button-select-category"
                >
                  {selectedCategoryName || <span className="text-zinc-400">Select category</span>}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Selection Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedParentCategory ? selectedParentCategory.name : 'Select Category'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="max-h-96 overflow-y-auto">
              {!selectedParentCategory ? (
                <div className="space-y-1">
                  {/* Recently Used */}
                  {recentCategoryItems.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-zinc-400 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Recently Used
                      </div>
                      {recentCategoryItems.map((category: any) => (
                        <button
                          key={`recent-${category._id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCategorySelect(category, category.parentName);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-md transition-colors"
                        >
                          <div className="text-sm text-white">
                            {category.parentName ? `${category.parentName} > ` : ''}{category.name}
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-zinc-800 my-2"></div>
                    </>
                  )}
                  
                  {/* No Category */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.setValue('category', '');
                      setShowCategoryDialog(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <div className="text-sm text-zinc-400">No Category</div>
                  </button>
                  
                  {/* All Categories */}
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (category.subCategories && category.subCategories.length > 0) {
                          setSelectedParentCategory(category);
                        } else {
                          handleCategorySelect(category);
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-md transition-colors flex items-center justify-between"
                    >
                      <div className="text-sm text-white">{category.name}</div>
                      {category.subCategories && category.subCategories.length > 0 && (
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Back button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedParentCategory(null);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-md transition-colors text-sm text-zinc-400"
                  >
                    ← Back
                  </button>
                  
                  {/* Parent category option */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCategorySelect(selectedParentCategory);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <div className="text-sm text-white">{selectedParentCategory.name} (All)</div>
                  </button>
                  
                  <div className="border-t border-zinc-800 my-2"></div>
                  
                  {/* Subcategories */}
                  {selectedParentCategory.subCategories?.map((sub) => (
                    <button
                      key={sub._id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCategorySelect(sub, selectedParentCategory.name);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      <div className="text-sm text-white">{sub.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Starting Price / Price */}
        {currentListingType === 'auction' ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="startingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Starting Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="1"
                      placeholder="1.00" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? '' : parseFloat(value));
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                      data-testid="input-product-starting-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="1" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? '' : parseInt(value));
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                      data-testid="input-product-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : currentListingType === 'buy_now' ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="Price" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? '' : parseFloat(value));
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                      data-testid="input-product-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="1" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? '' : parseFloat(value));
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                      data-testid="input-product-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : currentListingType === 'giveaway' ? (
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="1" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? '' : parseInt(value));
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                    data-testid="input-giveaway-quantity"
                  />
                </FormControl>
                <FormDescription className="text-xs text-zinc-400">
                  Number of winners for this giveaway
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {/* Auction-specific: Duration */}
        {currentListingType === 'auction' && (
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Duration</FormLabel>
                <FormControl>
                  <div className="flex gap-2 flex-wrap">
                    {[2, 3, 5, 10, 15, 20, 30].map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        onClick={() => field.onChange(seconds)}
                        className={`
                          w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all
                          ${field.value === seconds 
                            ? 'border-primary bg-primary text-primary-foreground' 
                            : 'border-zinc-700 bg-zinc-800 text-white hover:border-zinc-600'
                          }
                        `}
                        data-testid={`button-duration-${seconds}`}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* List Individually toggle for non-featured auctions */}
        {currentListingType === 'auction' && !isFeatured && (
          <FormField
            control={form.control}
            name="list_individually"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                <div className="space-y-0.5">
                  <FormLabel className="text-white font-medium">List Individually</FormLabel>
                  <FormDescription className="text-xs text-zinc-400">
                    Turn this on if you want to create {form.watch('quantity') || 1} instances of the same listing
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

        {/* Shipping Profile */}
        <FormField
          control={form.control}
          name="shippingProfile"
          render={({ field }) => {
            // Force empty value if current value is "skip" or not in the list of profiles
            const validProfileIds = shippingProfiles.map(p => p._id);
            const currentValue = field.value && field.value !== 'skip' && validProfileIds.includes(field.value) 
              ? field.value 
              : "";
            
            return (
              <FormItem>
                <FormLabel className="text-white font-medium">
                  Shipping Profile <span className="text-red-500">*</span>
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={currentValue}
                  disabled={loadingShippingProfiles}
                  data-testid="select-shipping-profile"
                >
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select shipping profile" className="text-zinc-400" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" className="z-[10000]">
                    {shippingProfiles.map((profile) => (
                      <SelectItem key={profile._id} value={profile._id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Auction-specific: Sudden Death */}
        {currentListingType === 'auction' && (
          <FormField
            control={form.control}
            name="sudden"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm text-white font-medium">Sudden Death</FormLabel>
                  <FormDescription className="text-xs text-zinc-300">
                    Auction ends immediately when someone bids
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-sudden-death"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Buy Now-specific: Accept Offers (hidden when flash sale is enabled) */}
        {currentListingType === 'buy_now' && !isFlashSaleEnabled && (
          <FormField
            control={form.control}
            name="acceptsOffers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm text-white font-medium">Accept Offers</FormLabel>
                  <FormDescription className="text-xs text-zinc-300">
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

        {/* Buy Now-specific: Flash Sale Configuration */}
        {currentListingType === 'buy_now' && (
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="flash_sale"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-yellow-500/30 p-3 bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm text-white font-medium">Enable Flash Sale</FormLabel>
                      <FormDescription className="text-xs text-zinc-300">
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
              <div className="space-y-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Flash Sale Settings</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="flash_sale_discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">Discount Type</FormLabel>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange('percentage')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                            field.value === 'percentage'
                              ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
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
                              ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
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
                      <FormLabel className="text-white font-medium text-sm">
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
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 pr-10"
                            data-testid="input-flash-sale-discount"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                            {flashSaleDiscountType === 'percentage' ? '%' : '$'}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-zinc-400">
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
                      <span className="text-sm text-yellow-400">Flash Sale Price:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400 line-through">${Number(productPrice).toFixed(2)}</span>
                        <span className="text-lg font-bold text-yellow-400">${flashSalePrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="flash_sale_buy_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">Buy Limit (per buyer)</FormLabel>
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
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                          data-testid="input-flash-sale-buy-limit"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-zinc-400">
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
                      <FormLabel className="text-white font-medium text-sm">Flash Sale Duration</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
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
                      <FormDescription className="text-xs text-zinc-400">
                        How long the flash sale will run when started
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="flash_sale_available_full_price"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white font-medium text-sm">Available For Full Price</FormLabel>
                        <FormDescription className="text-xs text-zinc-400">
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white font-medium text-sm">Reserve for Live</FormLabel>
                        <FormDescription className="text-xs text-zinc-400">
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

        {/* Buy Now-specific: Featured (hidden when flash sale is enabled) */}
        {currentListingType === 'buy_now' && !isFlashSaleEnabled && (
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm text-white font-medium">List to trending products</FormLabel>
                  <FormDescription className="text-xs text-zinc-300">
                    This item will be listed to trending products
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-featured"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Giveaway-specific: Who Can Enter */}
        {currentListingType === 'giveaway' && (
          <div className="space-y-3">
            <FormLabel className="text-white font-medium">Who can enter</FormLabel>
            <FormField
              control={form.control}
              name="whocanenter"
              render={({ field }) => (
                <>
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm text-white font-medium">Everyone</FormLabel>
                      <FormDescription className="text-xs text-zinc-300">
                        Everyone can enter this giveaway
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'everyone'}
                        onCheckedChange={(checked) => {
                          if (checked) field.onChange('everyone');
                        }}
                        data-testid="switch-whocanenter-everyone"
                      />
                    </FormControl>
                  </FormItem>
                  
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-3 bg-zinc-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm text-white font-medium">Followers</FormLabel>
                      <FormDescription className="text-xs text-zinc-300">
                        Only followers can enter this giveaway
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'followers'}
                        onCheckedChange={(checked) => {
                          if (checked) field.onChange('followers');
                        }}
                        data-testid="switch-whocanenter-followers"
                      />
                    </FormControl>
                  </FormItem>
                </>
              )}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {showCancelButton && onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              disabled={createProductMutation.isPending}
              className="flex-1 bg-secondary text-secondary-foreground"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            disabled={createProductMutation.isPending || isUploadingImages}
            onClick={handleFormSubmit}
            className="flex-1 bg-primary text-primary-foreground font-medium"
            data-testid="button-submit-product"
          >
            {(createProductMutation.isPending || isUploadingImages) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isUploadingImages ? "Uploading Images..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Add default export for lazy loading compatibility
export default ProductForm;
