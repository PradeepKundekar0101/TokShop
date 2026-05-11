import { z } from "zod";

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userName: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  phone: z.string().optional().refine((phone) => {
    if (!phone || phone === '') return true; // Optional field
    // Basic phone validation: at least 10 digits, can contain +, spaces, dashes, parentheses
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,6}$|^[\+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number"),
  country: z.string().min(1, "Country is required"),
});

export const socialAuthSchema = z.object({
  email: z.string().optional(), // Apple might not provide email initially
  firstName: z.string().optional(), // Apple might not provide name initially
  lastName: z.string().optional(),
  type: z.enum(["google", "apple"], { errorMap: () => ({ message: "Auth type must be 'google' or 'apple'" }) }),
  profilePhoto: z.string().optional(),
  userName: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  uid: z.string().optional(), // Firebase UID (will be overridden by verified UID)
  idToken: z.string().min(1, "Firebase ID token is required for authentication"), // Required for verification
  providerToken: z.string().optional(), // OAuth provider token (Google accessToken or Apple identityToken) for backend decoding
  provider: z.string().optional(), // Firebase provider info
  profilePicture: z.string().optional(), // Profile picture URL
}).refine((data) => {
  // For Google, require email and firstName
  if (data.type === 'google') {
    return !!data.email && !!data.firstName;
  }
  // For Apple, we'll handle missing fields in the completion flow
  return true;
}, {
  message: "Google authentication requires email and first name",
  path: ["firstName"]
});

export const socialAuthCompleteSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userName: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional().refine((phone) => {
    if (!phone || phone === '') return true; // Optional field
    // Basic phone validation: at least 10 digits, can contain +, spaces, dashes, parentheses
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,6}$|^[\+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number"),
  gender: z.string().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type SocialAuthData = z.infer<typeof socialAuthSchema>;
export type SocialAuthCompleteData = z.infer<typeof socialAuthCompleteSchema>;

export const authResponseSchema = z.object({
  token: z.string().optional(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().optional(),
  }).optional(),
  message: z.string().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Tokshop API authentication response types
export const tokshopAuthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any(), // User data from Tokshop API
  accessToken: z.string().optional(),
  authtoken: z.string().optional(), // Also returned by API
  newuser: z.boolean().optional(), // For signup responses
});

export const tokshopApiErrorResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string(),
  error: z.string().optional(),
  details: z.any().optional(),
});

export type TokshopAuthResponse = z.infer<typeof tokshopAuthResponseSchema>;
export type TokshopApiErrorResponse = z.infer<typeof tokshopApiErrorResponseSchema>;

// Tokshop API Response types
export const tokshopOrderSchema = z.object({
  _id: z.string(),
  customer: z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    userName: z.string().optional(),
    email: z.string(),
    profilePhoto: z.string().optional(),
    address: z.object({
      _id: z.string(),
      name: z.string(),
      addrress1: z.string(),
      city: z.string(),
      state: z.string(),
      zipcode: z.string(),
      phone: z.string(),
      email: z.string(),
    }).optional(),
  }),
  seller: z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    userName: z.string().optional(),
    email: z.string(),
  }),
  need_label: z.boolean(),
  giveaway: z.object({
    _id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number(),
    images: z.array(z.string()).optional(),
    category: z.object({
      _id: z.string(),
      name: z.string(),
    }).optional(),
    shipping_profile: z.object({
      _id: z.string(),
      weight: z.number(),
      name: z.string(),
      scale: z.string(),
    }).optional(),
    height: z.string().optional(),
    width: z.string().optional(),
    length: z.string().optional(),
    status: z.string().optional(),
    participants: z.array(z.string()).optional(),
  }).optional(),
  // Order type and items
  ordertype: z.string().optional(),
  items: z.array(z.object({
    _id: z.string().optional(),
    orderId: z.string().optional(),
    productId: z.object({
      _id: z.string().optional(),
      name: z.string().optional(),
      images: z.array(z.string()).optional(),
      category: z.object({
        _id: z.string().optional(),
        name: z.string().optional(),
      }).optional(),
    }).optional(),
    quantity: z.number().optional(),
    price: z.number().optional(),
    shipping_fee: z.number().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    width: z.string().optional(),
    length: z.string().optional(),
    scale: z.string().optional(),
    order_reference: z.string().optional(),
    status: z.string().optional(),
  })).optional(),
  // Financial fields
  total: z.number().optional(), // Items total/subtotal amount
  servicefee: z.number().optional(), // Legacy field - kept for backward compatibility
  service_fee: z.number().optional(), // Commission/platform fee charged by the platform
  stripe_fees: z.number().optional(), // Payment processing fees charged by Stripe
  tax: z.number().optional(),
  shipping_fee: z.number().optional(),
  seller_shipping_fee_pay: z.number().optional(), // Seller's shipping cost (always use this for total shipping)
  total_shipping_cost: z.number().optional(), // Total shipping cost for bundle
  discount: z.number().optional(),
  invoice: z.number().optional(),
  // Status and tracking
  status: z.string().optional(),
  tracking_number: z.string().optional(),
  label: z.string().optional(),
  weight: z.union([z.number(), z.string()]).optional(), // Order weight
  // Dates  
  date: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Bundling
  bundleId: z.string().optional().nullable(),
  // Show/Room association
  tokshow: z.object({
    _id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  length: z.string().optional(),
  scale: z.string().optional(),
});

export const tokshopOrdersResponseSchema = z.object({
  orders: z.array(tokshopOrderSchema),
  limits: z.number(),
  pages: z.number(),
  total: z.number(),
});

export type TokshopOrder = z.infer<typeof tokshopOrderSchema>;
export type TokshopOrdersResponse = z.infer<typeof tokshopOrdersResponseSchema>;

export const tokshopDashboardResponseSchema = z.object({
  totalOrder: z.number(),
  totalAmount: z.string(),
  todayOrder: z.array(z.any()),
  totalAmountOfThisMonth: z.string(),
  totalPendingOrder: z.object({
    total: z.number(),
    count: z.number(),
  }).optional(),
  totalDeliveredOrder: z.number(),
  orders: z.array(z.any()),
  weeklySaleReport: z.array(z.any()),
});

export type TokshopDashboardResponse = z.infer<typeof tokshopDashboardResponseSchema>;

// Tokshop Product API Response types
export const tokshopProductSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  quantity: z.number(),
  images: z.array(z.string()).optional(),
  category: z.object({
    _id: z.string(),
    name: z.string(),
  }).optional(),
  seller: z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    userName: z.string().optional(),
    email: z.string(),
  }),
  status: z.string().optional(),
  weight: z.union([z.number(), z.string()]).optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  length: z.string().optional(),
  scale: z.string().optional(),
  shipping_profile: z.object({
    _id: z.string(),
    weight: z.number(),
    name: z.string(),
    scale: z.string(),
  }).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const tokshopProductsResponseSchema = z.object({
  products: z.array(tokshopProductSchema),
  limits: z.number(),
  pages: z.number(),
  totalDoc: z.number(),
});

export type TokshopProduct = z.infer<typeof tokshopProductSchema>;
export type TokshopProductsResponse = z.infer<typeof tokshopProductsResponseSchema>;

// External API Category schema
export const tokshopCategorySchema: z.ZodType<any> = z.lazy(() => z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  icon: z.string().optional(),
  type: z.string().optional(),
  subCategories: z.array(tokshopCategorySchema).optional(),
}));

export const tokshopCategoriesResponseSchema = z.object({
  categories: z.array(tokshopCategorySchema),
  limits: z.number().optional(),
  pages: z.number().optional(),
  total: z.number().optional(),
});

export type TokshopCategory = z.infer<typeof tokshopCategorySchema>;
export type TokshopCategoriesResponse = z.infer<typeof tokshopCategoriesResponseSchema>;

// External API Shipping Profile schema
export const tokshopShippingProfileSchema = z.object({
  _id: z.string(),
  name: z.string(),
  weight: z.number(),
  scale: z.string(),
  description: z.string().optional(),
});

export const tokshopShippingProfilesResponseSchema = z.array(tokshopShippingProfileSchema);

export type TokshopShippingProfile = z.infer<typeof tokshopShippingProfileSchema>;
export type TokshopShippingProfilesResponse = z.infer<typeof tokshopShippingProfilesResponseSchema>;

// Product form schemas
export const listingTypeSchema = z.enum(['auction', 'buy_now', 'giveaway']);

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.coerce.number().optional().nullable(),
  quantity: z.coerce.number({ invalid_type_error: "Quantity is required" }).int().min(1, "Quantity must be at least 1"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(['active', 'inactive', 'out_of_stock', 'draft']).optional().default('active'),
  listingType: listingTypeSchema,
  shippingProfile: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  // Physical attributes (used in inventory form)
  weight: z.string().optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  length: z.string().optional(),
  scale: z.string().optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  // Auction-specific fields
  startingPrice: z.coerce.number().optional().nullable(),
  duration: z.coerce.number().int().optional().nullable(),
  sudden: z.boolean().optional().default(false),
  list_individually: z.boolean().optional().default(false),
  // Featured auction scheduling fields
  startTime: z.string().optional().nullable(), // ISO datetime string
  endTime: z.string().optional().nullable(), // ISO datetime string
  // Buy Now-specific fields
  featured: z.boolean().optional().default(false),
  acceptsOffers: z.boolean().optional().default(false),
  // Flash sale fields (for buy_now products)
  flash_sale: z.boolean().optional().default(false),
  flash_sale_discount_type: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  flash_sale_discount_value: z.coerce.number().optional().default(0),
  flash_sale_buy_limit: z.coerce.number().int().optional().default(1), // max purchases per buyer
  flash_sale_duration: z.coerce.number().int().optional().default(60), // duration in seconds
  flash_sale_available_full_price: z.boolean().optional().default(false), // available at full price outside flash sale
  flash_live_reserved: z.boolean().optional().default(true), // reserve quantity for live flash sale
  // Giveaway-specific fields
  whocanenter: z.enum(['everyone', 'followers']).optional().default('everyone'),
  // Room association
  tokshow: z.string().optional(),
}).refine((data) => {
  // For auction, startingPrice is required
  if (data.listingType === 'auction') {
    return data.startingPrice !== undefined && data.startingPrice !== null && data.startingPrice > 0;
  }
  return true;
}, {
  message: "Starting price must be greater than 0",
  path: ["startingPrice"],
}).refine((data) => {
  // For non-featured auctions (live show auctions), duration is required
  if (data.listingType === 'auction' && !data.featured) {
    return data.duration !== undefined && data.duration !== null && data.duration > 0;
  }
  return true;
}, {
  message: "Duration must be selected",
  path: ["duration"],
}).refine((data) => {
  // For featured auctions, startTime and endTime are required
  if (data.listingType === 'auction' && data.featured) {
    return data.startTime !== undefined && data.startTime !== null && data.startTime !== '';
  }
  return true;
}, {
  message: "Auction start time is required for featured auctions",
  path: ["startTime"],
}).refine((data) => {
  // For featured auctions, endTime is required
  if (data.listingType === 'auction' && data.featured) {
    return data.endTime !== undefined && data.endTime !== null && data.endTime !== '';
  }
  return true;
}, {
  message: "Auction end time is required for featured auctions",
  path: ["endTime"],
}).refine((data) => {
  // For buy_now, price is required
  if (data.listingType === 'buy_now') {
    return data.price !== undefined && data.price !== null && data.price > 0;
  }
  return true;
}, {
  message: "Price must be greater than 0",
  path: ["price"],
}).refine((data) => {
  // For non-featured auctions (live show auctions), a show must be selected
  if (data.listingType === 'auction' && !data.featured) {
    return data.tokshow !== undefined && data.tokshow !== null && data.tokshow !== '' && data.tokshow !== 'general';
  }
  return true;
}, {
  message: "Live show auctions must be assigned to a show",
  path: ["tokshow"],
});

export type ListingType = z.infer<typeof listingTypeSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;

// Computed Bundle type (not persisted in DB)
export const bundleSchema = z.object({
  id: z.string(), // Generated hash from sorted orderIds
  customerId: z.string(),
  customerName: z.string(),
  orderIds: z.array(z.string()),
  count: z.number(),
  weight: z.string().optional(), // Aggregated weight
  dimensions: z.string().optional(), // Aggregated dimensions  
  totalValue: z.number(), // Sum of order totals
  status: z.enum(["pending", "labeled"]).optional().default("pending"),
  createdAt: z.string().optional(),
});

export type Bundle = z.infer<typeof bundleSchema>;

// Address type for Tokshop API
export type Address = {
  _id: string;
  name: string;
  addrress1: string; // Note: keeping the typo as in original Tokshop API schema
  primary?: boolean;
  addrress2?: string;
  city?: string;
  countryCode?: string;
  cityCode?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  zipcode?: string;
  street?: string;
  phone?: string;
  email?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

// Address API request/response schemas
export const createAddressSchema = z.object({
  name: z.string().min(1, "Address name is required"),
  addrress1: z.string().min(1, "Street address is required"), // Keep typo as in original schema
  addrress2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  stateCode: z.string().optional().default(""), // Add state code
  cityCode: z.string().optional().default(""), // Add city code (may not always be available)
  zipcode: z.string().min(1, "ZIP code is required"),
  countryCode: z.string().min(1, "Country is required"),
  country: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please enter a valid email address"),
  userId: z.string().min(1, "User ID is required"),
});

export const updateAddressSchema = createAddressSchema.partial().extend({
  name: z.string().min(1, "Address name is required").optional(),
  addrress1: z.string().min(1, "Street address is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  zipcode: z.string().min(1, "ZIP code is required").optional(),
  countryCode: z.string().min(1, "Country is required").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
});

export const makePrimaryAddressSchema = z.object({
  primary: z.boolean(),
  userId: z.string().min(1, "User ID is required"),
});

export type CreateAddressRequest = z.infer<typeof createAddressSchema>;
export type UpdateAddressRequest = z.infer<typeof updateAddressSchema>;
export type MakePrimaryAddressRequest = z.infer<typeof makePrimaryAddressSchema>;

// Shipping estimates schema
export const shippingEstimateRequestSchema = z.object({
  weight: z.union([z.string(), z.number()]).transform(String),
  unit: z.string().optional().default("oz"),
  product: z.string(),
  update: z.boolean().optional().default(true),
  owner: z.string(),
  customer: z.string(),
  length: z.union([z.string(), z.number()]).transform(Number),
  width: z.union([z.string(), z.number()]).transform(Number),
  height: z.union([z.string(), z.number()]).transform(Number),
  buying_label: z.boolean().optional().default(true),
  order_id: z.string().optional(),
});

export const shippingEstimateResponseSchema = z.object({
  carrier: z.string(),
  service: z.string(),
  price: z.string(),
  deliveryTime: z.string(),
  objectId: z.string().min(1, "Rate ID is required"), // Rate ID from external API
});

export type ShippingEstimateRequest = z.infer<typeof shippingEstimateRequestSchema>;
export type ShippingEstimateResponse = z.infer<typeof shippingEstimateResponseSchema>;

// Shipping label purchase schemas
export const shippingLabelPurchaseRequestSchema = z.object({
  rate_id: z.string().min(1, "Rate ID is required"),
  order: z.union([z.string(), z.object({
    _id: z.string(),
    customer: z.object({
      _id: z.string(),
      firstName: z.string(),
      lastName: z.string().optional(),
      email: z.string().email(),
      address: z.object({
        name: z.string(),
        addrress1: z.string(),
        city: z.string(),
        state: z.string(),
        zipcode: z.string(),
        phone: z.string(),
        email: z.string().email(),
      }).optional(),
    }),
    seller: z.object({
      _id: z.string(),
      firstName: z.string(),
      lastName: z.string().optional(),
      email: z.string().email(),
    }),
  })]),
  isBundle: z.boolean().optional(), // Add explicit bundle flag
  shipping_fee: z.union([z.string(), z.number()]).transform(Number),
  servicelevel: z.string().min(1, "Service level is required"),
  carrier: z.string().optional(),
  deliveryTime: z.string().optional(),
});

export const shippingLabelPurchaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    tracking_number: z.string(),
    label_url: z.string().optional(),
    label_data: z.string().optional(), // Base64 encoded label
    carrier: z.string(),
    service: z.string(),
    cost: z.string(),
    delivery_time: z.string(),
    purchased_at: z.string(),
  }).optional(),
  error: z.string().optional(),
});

export type ShippingLabelPurchaseRequest = z.infer<typeof shippingLabelPurchaseRequestSchema>;
export type ShippingLabelPurchaseResponse = z.infer<typeof shippingLabelPurchaseResponseSchema>;

// Bundle label purchase schemas
export const bundleLabelPurchaseRequestSchema = z.object({
  orderIds: z.array(z.string().min(1, "Order ID cannot be empty")).min(1, "At least one order ID is required"),
  service: z.string().min(1, "Service level is required").optional().default("Ground Advantage"),
  rate_id: z.string().min(1, "Rate ID is required"),
});

export const bundleLabelPurchaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    tracking_number: z.string(),
    label_url: z.string().optional(),
    cost: z.number(),
    carrier: z.string(),
    service: z.string(),
    affected_orders: z.array(z.string()),
    update_results: z.array(z.object({
      orderId: z.string(),
      success: z.boolean(),
      error: z.string().optional(),
      data: z.any().optional(),
    })),
    aggregated_weight: z.string().optional(),
    aggregated_dimensions: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
});

export type BundleLabelPurchaseRequest = z.infer<typeof bundleLabelPurchaseRequestSchema>;
export type BundleLabelPurchaseResponse = z.infer<typeof bundleLabelPurchaseResponseSchema>;

// Landing Page Content schemas
export const heroSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  primaryButtonText: z.string().min(1, "Primary button text is required"),
  primaryButtonLink: z.string().min(1, "Primary button link is required"),
  secondaryButtonText: z.string().min(1, "Secondary button text is required"),
  heroImage: z.string().url("Must be a valid URL"),
  heroImageAlt: z.string().optional().default("Live shopping experience"),
  liveViewers: z.string().optional().default("12.5K watching"),
});

export const howItWorksStepSchema = z.object({
  icon: z.enum(['Play', 'Zap', 'Shield', 'Star', 'TrendingUp']),
  title: z.string().min(1, "Step title is required"),
  description: z.string().min(1, "Step description is required"),
});

export const featureItemSchema = z.object({
  icon: z.enum(['Play', 'Zap', 'Shield', 'Star', 'TrendingUp']),
  title: z.string().min(1, "Feature title is required"),
  description: z.string().min(1, "Feature description is required"),
});

export const categoryItemSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  image: z.string().url("Must be a valid URL"),
});

export const brandItemSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  logo: z.string().optional(),
});

export const landingContentSchema = z.object({
  // Hero Section
  hero: heroSectionSchema,
  // How It Works Section
  howItWorks: z.object({
    title: z.string().min(1, "Section title is required"),
    subtitle: z.string().min(1, "Section subtitle is required"),
    steps: z.array(howItWorksStepSchema).length(3, "Must have exactly 3 steps"),
  }),
  // Join In the Fun Section
  joinFun: z.object({
    title: z.string().min(1, "Section title is required"),
    subtitle: z.string().min(1, "Section subtitle is required"),
    image: z.string().url("Must be a valid URL"),
    imageAlt: z.string().optional().default("Auction excitement"),
    features: z.array(featureItemSchema).min(1, "Must have at least 1 feature"),
    buttonText: z.string().min(1, "Button text is required"),
    buttonLink: z.string().min(1, "Button link is required"),
  }),
  // Categories Section
  categories: z.object({
    title: z.string().min(1, "Section title is required"),
    subtitle: z.string().min(1, "Section subtitle is required"),
    items: z.array(categoryItemSchema).min(1, "Must have at least 1 category"),
    buttonText: z.string().min(1, "Button text is required"),
    buttonLink: z.string().min(1, "Button link is required"),
  }),
  // Brands Section
  brands: z.object({
    title: z.string().min(1, "Section title is required"),
    subtitle: z.string().min(1, "Section subtitle is required"),
    items: z.array(brandItemSchema).min(1, "Must have at least 1 brand"),
    image: z.string().url("Must be a valid URL"),
    imageAlt: z.string().optional().default("Brand products"),
    buttonText: z.string().min(1, "Button text is required"),
    buttonLink: z.string().min(1, "Button link is required"),
  }),
  // Final CTA Section
  finalCTA: z.object({
    title: z.string().min(1, "CTA title is required"),
    subtitle: z.string().min(1, "CTA subtitle is required"),
    buttonText: z.string().min(1, "Button text is required"),
    buttonLink: z.string().min(1, "Button link is required"),
  }),
  // Footer
  footer: z.object({
    copyrightText: z.string().optional(),
  }),
});

export type HeroSection = z.infer<typeof heroSectionSchema>;
export type HowItWorksStep = z.infer<typeof howItWorksStepSchema>;
export type FeatureItem = z.infer<typeof featureItemSchema>;
export type CategoryItem = z.infer<typeof categoryItemSchema>;
export type BrandItem = z.infer<typeof brandItemSchema>;
export type LandingContent = z.infer<typeof landingContentSchema>;

// Page Type Enum - defines all available editable pages
export const pageTypeEnum = z.enum([
  "landing",
  "faq",
  "about",
  "privacy",
  "terms",
  "contact",
]);

export type PageType = z.infer<typeof pageTypeEnum>;

// FAQ Page Schema
export const faqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const faqContentSchema = z.object({
  title: z.string().min(1, "Page title is required"),
  subtitle: z.string().optional(),
  faqs: z.array(faqItemSchema).min(1, "Must have at least 1 FAQ item"),
});

export type FAQItem = z.infer<typeof faqItemSchema>;
export type FAQContent = z.infer<typeof faqContentSchema>;

// About Us / Privacy / Terms Page Schema (Section-based with rich content)
export const contentSectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  content: z.string().min(1, "Section content is required"),
  order: z.number().optional(),
});

export const sectionBasedPageSchema = z.object({
  title: z.string().min(1, "Page title is required"),
  subtitle: z.string().optional(),
  sections: z.array(contentSectionSchema).min(1, "Must have at least 1 section"),
});

export type ContentSection = z.infer<typeof contentSectionSchema>;
export type SectionBasedPage = z.infer<typeof sectionBasedPageSchema>;

// Contact Page Schema
export const contactInfoSchema = z.object({
  email: z.string().email("Must be a valid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const contactContentSchema = z.object({
  title: z.string().min(1, "Page title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  contactInfo: contactInfoSchema,
  showContactForm: z.boolean().optional().default(true),
  sections: z.array(contentSectionSchema).optional(),
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type ContactContent = z.infer<typeof contactContentSchema>;

// Help Article Schema (for General/Help Center pages)
export const helpArticleSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt/description is required"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["general", "seller", "buyer", "payments", "shipping", "other"]).default("general"),
  published: z.boolean().default(true),
  order: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createHelpArticleSchema = helpArticleSchema.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateHelpArticleSchema = helpArticleSchema.partial().omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type HelpArticle = z.infer<typeof helpArticleSchema>;
export type CreateHelpArticle = z.infer<typeof createHelpArticleSchema>;
export type UpdateHelpArticle = z.infer<typeof updateHelpArticleSchema>;
