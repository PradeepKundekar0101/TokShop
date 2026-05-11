import type { Express } from "express";
import fetch from "node-fetch";
import { BASE_URL, getAccessToken } from "../utils";
import { z } from "zod";
import { deleteImagesFromStorage } from "../firebase-admin";

// Product creation schema for validation
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().optional(),
  price: z.coerce.number({ invalid_type_error: "Price must be a number" }).positive("Price must be a positive number").optional(),
  quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" }).int().min(0, "Quantity must be a non-negative integer").optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  listingType: z.enum(["auction", "buy_now", "giveaway"]).optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  length: z.string().optional(),
  scale: z.string().optional(),
  shippingProfile: z.string().optional(),
  images: z.array(z.string()).optional(),
  discountedPrice: z.coerce.number().optional(),
  startingPrice: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
  sudden: z.boolean().optional(),
  list_individually: z.boolean().optional(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  reserved: z.boolean().optional(),
  tokshow: z.union([z.boolean(), z.string(), z.null()]).optional(),
  featured: z.boolean().optional().default(false),
  started: z.boolean().optional().default(false),
  userId: z.string().optional(),
  flash_sale: z.boolean().optional(),
  flash_sale_discount_type: z.enum(["percentage", "fixed"]).optional(),
  flash_sale_discount_value: z.coerce.number().optional(),
  flash_sale_buy_limit: z.coerce.number().optional(),
  flash_sale_duration: z.coerce.number().optional(),
  flash_sale_available_full_price: z.boolean().optional(),
  flash_live_reserved: z.boolean().optional(),
});

export function registerProductRoutes(app: Express) {
  // Search products endpoint
  app.get("/api/products/search", async (req, res) => {
    try {
      const queryParams = req.query;
      console.log("Proxying product search request to Tokshop API with params:", queryParams);

      if (!queryParams.q || typeof queryParams.q !== 'string') {
        return res.json({
          query: queryParams.q || '',
          results: { products: [], rooms: [], users: [] },
          pagination: { page: 1, limit: 20, total: 0, pages: 0 }
        });
      }

      // Build query parameters - forward all query params from frontend
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value && typeof value === 'string') {
          params.set(key, value);
        }
      }

      const url = `${BASE_URL}/products/search?${params.toString()}`;
      console.log("Final search API URL being called:", url);

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Log data structure for debugging
      if (data?.results?.users && data.results.users.length > 0) {
        console.log("Sample user from search results:", JSON.stringify(data.results.users[0], null, 2));
      }
      if (data?.results?.products && data.results.products.length > 0) {
        console.log("Sample product from search results:", JSON.stringify(data.results.products[0], null, 2));
      }

      res.json(data);
    } catch (error) {
      console.error("Product search proxy error:", error);
      res.status(500).json({ error: "Failed to search products from Tokshop API", products: [] });
    }
  });

  // Get individual product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(
        "Proxying individual product request to Tokshop API for product:",
        id,
      );

      // Use the correct endpoint structure for product details
      const url = `${BASE_URL}/products/products/${id}`;

      console.log("Final API URL being called:", url);

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Individual product proxy error:", error);
      res.status(500).json({ error: "Failed to fetch product from Tokshop API" });
    }
  });

  // Products proxy for GET requests (list all products)
  app.get("/api/products", async (req, res) => {
    try {
      console.log("Proxying products request to Tokshop API");
      console.log("Query params received:", req.query);

      // Build query parameters in specific order for Tokshop API
      const queryParts: string[] = [];

      // Add userId parameter (this is the key parameter for filtering user's products)
      // Check both userId and userid (camelCase and lowercase)
      if (req.query.userId !== undefined || req.query.userid !== undefined) {
        queryParts.push(`userid=${encodeURIComponent((req.query.userId || req.query.userid) as string)}`);
      }

      // Add roomId parameter - always include even if empty
      if (req.query.roomId !== undefined || req.query.roomid !== undefined) {
        queryParts.push(`roomid=${encodeURIComponent((req.query.roomId || req.query.roomid || '') as string)}`);
      }

      // Add type parameter - always include even if empty
      if (req.query.type !== undefined) {
        queryParts.push(`type=${encodeURIComponent(req.query.type as string)}`);
      }

      // Add saletype parameter - always include even if empty
      if (req.query.saletype !== undefined) {
        queryParts.push(`saletype=${encodeURIComponent(req.query.saletype as string)}`);
      }

      // Add category - always include even if empty (check both categoryId and category)
      if (req.query.categoryId !== undefined || req.query.category !== undefined) {
        queryParts.push(`category=${encodeURIComponent((req.query.categoryId || req.query.category || '') as string)}`);
      }

      // Add page
      if (req.query.page !== undefined) {
        queryParts.push(`page=${encodeURIComponent(req.query.page as string)}`);
      }

      // Add limit
      if (req.query.limit !== undefined) {
        queryParts.push(`limit=${encodeURIComponent(req.query.limit as string)}`);
      }

      // Add featured
      if (req.query.featured !== undefined) {
        queryParts.push(`featured=${encodeURIComponent(req.query.featured as string)}`);
      }

      // Add status
      if (req.query.status !== undefined) {
        queryParts.push(`status=${encodeURIComponent(req.query.status as string)}`);
      }

      // Add title if provided
      if (req.query.title !== undefined) {
        queryParts.push(`title=${encodeURIComponent(req.query.title as string)}`);
      }

      const queryString = queryParts.join('&');
      const url = `${BASE_URL}/products/${queryString ? "?" + queryString : ""}`;

      console.log("Final API URL being called:", url);

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data: any = await response.json();

      res.json(data);
    } catch (error) {
      console.error("Products proxy error:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch products from Tokshop API" });
    }
  });

  // Create product endpoint
  app.post("/api/products/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Creating product via Tokshop API for user:", userId);
      console.log("Product data received:", req.body);

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Validate the request body
      const validationResult = createProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation failed:", JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({
          error: "Invalid product data",
          details: validationResult.error.errors,
        });
      }

      const productData = validationResult.data;

      // Prepare data for Tokshop API with correct field mapping
      const tokshopProductData = {
        name: productData.name,
        ...(productData.price && { price: productData.price }),
        quantity: productData.quantity,
        userId: userId,
        description: productData.description,
        category: productData.category,
        listing_type: productData.listingType,
        status: productData.status || "draft",
        featured: productData.featured || false,
        started: (productData.featured && productData.listingType === 'auction') || false,
        // Only include optional fields if they have values (filter out empty strings)
        ...(req.body.images && { images: req.body.images }),
        ...(req.body.discountedPrice && {
          discountedPrice: req.body.discountedPrice,
        }),
        ...(req.body.startingPrice && {
          startingPrice: req.body.startingPrice,
        }),
        ...(req.body.duration && { duration: req.body.duration }),
        ...(req.body.sudden !== undefined && { sudden: req.body.sudden }),
        ...(req.body.list_individually !== undefined && { list_individually: req.body.list_individually }),
        ...(req.body.startTimeTimestamp && {
          start_time_date: req.body.startTimeTimestamp
        }),
        ...(req.body.endTimeTimestamp && {
          end_time_date: req.body.endTimeTimestamp
        }),
        ...(req.body.colors && { colors: req.body.colors }),
        ...(req.body.sizes && { sizes: req.body.sizes }),
        ...(req.body.reserved !== undefined && { reserved: req.body.reserved }),
        ...(req.body.tokshow !== undefined && { tokshow: req.body.tokshow }),
        ...(req.body.offer !== undefined && { offer: req.body.offer }),
        ...(() => {
          // Handle shippingProfile - could be string or object, could be camelCase or snake_case
          const shippingProfile = req.body.shippingProfile || req.body.shipping_profile;
          if (!shippingProfile) return {};

          // If it's a string, use it directly
          if (typeof shippingProfile === 'string') {
            return shippingProfile.trim() ? { shipping_profile: shippingProfile } : {};
          }

          // If it's an object, extract the ID
          if (typeof shippingProfile === 'object' && shippingProfile.id) {
            return { shipping_profile: shippingProfile.id };
          }

          return {};
        })(),
        ...(req.body.weight &&
          req.body.weight.trim() && { weight: req.body.weight }),
        ...(req.body.height &&
          req.body.height.trim() && { height: req.body.height }),
        ...(req.body.width &&
          req.body.width.trim() && { width: req.body.width }),
        ...(req.body.length &&
          req.body.length.trim() && { length: req.body.length }),
        ...(req.body.scale &&
          req.body.scale.trim() && { scale: req.body.scale }),
        ...(req.body.flash_sale !== undefined && { flash_sale: req.body.flash_sale }),
        ...(req.body.flash_sale_discount_type && { flash_sale_discount_type: req.body.flash_sale_discount_type }),
        ...(req.body.flash_sale_discount_value !== undefined && { flash_sale_discount_value: req.body.flash_sale_discount_value }),
        ...(req.body.flash_sale_buy_limit !== undefined && { flash_sale_buy_limit: req.body.flash_sale_buy_limit }),
        ...(req.body.flash_sale_duration !== undefined && { flash_sale_duration: req.body.flash_sale_duration }),
        ...(req.body.flash_sale_available_full_price !== undefined && { flash_sale_available_full_price: req.body.flash_sale_available_full_price }),
        ...(req.body.flash_live_reserved !== undefined && { flash_live_reserved: req.body.flash_live_reserved }),
      };

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      console.log("Session data:", {
        hasSession: !!req.session,
        hasAccessToken: !!req.session?.accessToken,
        tokenPreview: req.session?.accessToken
          ? req.session.accessToken.substring(0, 20) + "..."
          : "NO TOKEN",
      });

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
        console.log("Authorization header added");
      } else {
        console.log("WARNING: No access token found in session");
      }

      console.log(
        "Sending to Tokshop API:",
        JSON.stringify(tokshopProductData, null, 2),
      );

      const response = await fetch(`${BASE_URL}/products/${userId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(tokshopProductData),
      });

      console.log("External API response status:", response.status);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        console.log("External API error response:", JSON.stringify(errorData, null, 2));
        throw new Error(
          errorData.message ||
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("External API success response:", JSON.stringify(data, null, 2));
      res.json(data);
    } catch (error: any) {
      console.error("Product creation error:", error);
      res.status(500).json({
        error: "Failed to create product",
        message: error.message || "Unknown error occurred",
      });
    }
  });

  // Bulk add products endpoint
  app.post("/api/products/bulkadd/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Bulk adding products via Tokshop API for user:", userId);
      console.log(
        "Number of products received:",
        req.body.products?.length || 0,
      );

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!req.body.products || !Array.isArray(req.body.products)) {
        return res.status(400).json({ error: "Products array is required" });
      }

      // Validate each product in the array
      const validationErrors: any[] = [];
      const validatedProducts = [];

      for (let i = 0; i < req.body.products.length; i++) {
        const product = req.body.products[i];
        const validationResult = createProductSchema.safeParse(product);

        if (!validationResult.success) {
          validationErrors.push({
            index: i,
            product: product,
            errors: validationResult.error.errors,
          });
        } else {
          validatedProducts.push(validationResult.data);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid product data",
          validationErrors: validationErrors,
        });
      }

      // Prepare products for Tokshop API
      const tokshopProducts = validatedProducts.map((productData) => ({
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity,
        ownerId: userId,
        description: productData.description,
        category: productData.category,
        listing_type: productData.listingType || "buy_now",
        status: productData.status || "active",
        featured: productData.featured || false,
        weight: productData.weight || "",
      }));

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
        console.log("Authorization header added for bulk upload");
      } else {
        console.log(
          "WARNING: No access token found in session for bulk upload",
        );
      }

      console.log("Sending bulk products to Tokshop API:", {
        endpoint: `${BASE_URL}/products/products/bulkadd`,
        productCount: tokshopProducts.length,
      });

      console.log("Actual payload being sent:", JSON.stringify({ products: tokshopProducts }, null, 2));

      const response = await fetch(
        `${BASE_URL}/products/products/bulkadd`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ products: tokshopProducts }),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          errorData.message ||
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as any;
      console.log("Bulk products created successfully:", {
        successful: data.successful || 0,
        failed: data.failed || 0,
      });
      res.json(data);
    } catch (error: any) {
      console.error("Bulk product creation error:", error);
      res.status(500).json({
        error: "Failed to bulk create products",
        message: error.message || "Unknown error occurred",
      });
    }
  });

  // Update product images endpoint
  app.post("/api/products/images/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      console.log("Updating product images via Tokshop API:", productId);

      const { images } = req.body;
      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ error: "Images array is required" });
      }

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${BASE_URL}/products/images/${productId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ images }),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          errorData.message ||
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Product images updated successfully:", data);
      res.json(data);
    } catch (error: any) {
      console.error("Product images update error:", error);
      res.status(500).json({
        error: "Failed to update product images",
        message: error.message || "Unknown error occurred",
      });
    }
  });


  // Update product endpoint
  app.patch("/api/products/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      console.log("Updating product via Tokshop API:", productId);
      console.log("Raw request body featured field:", req.body.featured);
      console.log("Raw request body shippingProfile:", req.body.shippingProfile);

      // Validate the request body
      const validationResult = createProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation failed:", JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({
          error: "Invalid product data",
          details: validationResult.error.errors,
        });
      }

      const productData = validationResult.data;
      console.log("Validated featured field:", productData.featured);

      // Prepare update data with correct field mapping
      const tokshopUpdateData: any = {
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity,
        images: productData.images,
        userId: productData.userId,
        description: productData.description,
        category: productData.category,
        discountedPrice: productData.discountedPrice,
        startingPrice: productData.startingPrice,
        duration: productData.duration,
        sudden: productData.sudden,
        list_individually: productData.list_individually,
        colors: productData.colors,
        sizes: productData.sizes,
        reserved: productData.reserved,
        listing_type: productData.listingType,
        tokshow: productData.tokshow,
        featured: productData.featured || false,
        started: (productData.featured && productData.listingType === 'auction') || false,
        ...(req.body.offer !== undefined && { offer: req.body.offer }),
      };

      // Add scheduling fields for featured auctions (already converted to timestamps on frontend)
      if (req.body.startTimeTimestamp) {
        tokshopUpdateData.start_time_date = req.body.startTimeTimestamp;
      }
      if (req.body.endTimeTimestamp) {
        tokshopUpdateData.end_time_date = req.body.endTimeTimestamp;
      }

      // Only include shipping_profile if it has a valid value (and is not "skip")
      // Handle shippingProfile - could be string or object, could be camelCase or snake_case
      const shippingProfile = productData.shippingProfile || req.body.shippingProfile || req.body.shipping_profile;
      if (shippingProfile) {
        // If it's a string, use it directly
        if (typeof shippingProfile === 'string') {
          if (shippingProfile.trim() && shippingProfile !== 'skip') {
            tokshopUpdateData.shipping_profile = shippingProfile;
          } else if (shippingProfile === 'skip') {
            console.log('⚠️ Filtering out "skip" value for shipping_profile - this should not happen!');
          }
        }
        // If it's an object, extract the ID
        else if (typeof shippingProfile === 'object' && shippingProfile.id) {
          tokshopUpdateData.shipping_profile = shippingProfile.id;
        }
      }

      // Include auction ID if provided (for editing existing auctions)
      if (req.body.auction) {
        tokshopUpdateData.auction = req.body.auction;
        console.log("Sending to external API - auction ID:", tokshopUpdateData.auction);
      }

      // Flash sale fields
      if (req.body.flash_sale !== undefined) {
        tokshopUpdateData.flash_sale = req.body.flash_sale;
      }
      if (req.body.flash_sale_discount_type) {
        tokshopUpdateData.flash_sale_discount_type = req.body.flash_sale_discount_type;
      }
      if (req.body.flash_sale_discount_value !== undefined) {
        tokshopUpdateData.flash_sale_discount_value = req.body.flash_sale_discount_value;
      }
      if (req.body.flash_sale_buy_limit !== undefined) {
        tokshopUpdateData.flash_sale_buy_limit = req.body.flash_sale_buy_limit;
      }
      if (req.body.flash_sale_duration !== undefined) {
        tokshopUpdateData.flash_sale_duration = req.body.flash_sale_duration;
      }
      if (req.body.flash_sale_available_full_price !== undefined) {
        tokshopUpdateData.flash_sale_available_full_price = req.body.flash_sale_available_full_price;
      }
      if (req.body.flash_live_reserved !== undefined) {
        tokshopUpdateData.flash_live_reserved = req.body.flash_live_reserved;
      }

      console.log("Flash sale fields being sent:", {
        flash_sale: tokshopUpdateData.flash_sale,
        flash_sale_discount_type: tokshopUpdateData.flash_sale_discount_type,
        flash_sale_discount_value: tokshopUpdateData.flash_sale_discount_value,
        flash_sale_buy_limit: tokshopUpdateData.flash_sale_buy_limit,
        flash_sale_duration: tokshopUpdateData.flash_sale_duration,
        flash_sale_available_full_price: tokshopUpdateData.flash_sale_available_full_price,
        flash_live_reserved: tokshopUpdateData.flash_live_reserved,
      });

      console.log(
        "Sending to external API - featured field:",
        tokshopUpdateData.featured,
      );
      console.log("Sending to external API - sudden:", tokshopUpdateData.sudden);
      console.log("Sending to external API - duration:", tokshopUpdateData.duration);
      console.log("Sending to external API - shipping_profile:", tokshopUpdateData.shipping_profile);
      console.log("Full tokshopUpdateData being sent:", JSON.stringify(tokshopUpdateData, null, 2));

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${BASE_URL}/products/products/${productId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(tokshopUpdateData),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          errorData.message ||
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Product update error:", error);
      res.status(500).json({
        error: "Failed to update product",
        message: error.message || "Unknown error occurred",
      });
    }
  });

  // Delete product endpoint (soft delete with PUT)
  app.put("/api/products/:productId/delete", async (req, res) => {
    try {
      const { productId } = req.params;

      console.log("Soft deleting product via Tokshop API:", productId);

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Step 1: Fetch the product to get its images
      console.log("Fetching product details to get images:", productId);
      const productResponse = await fetch(
        `${BASE_URL}/products/products/${productId}`,
        {
          method: "GET",
          headers,
        },
      );

      if (productResponse.ok) {
        const productData = await productResponse.json();
        const images = productData?.images || [];

        // Step 2: Delete images from storage
        if (images.length > 0) {
          console.log(`Found ${images.length} images to delete from storage`);
          try {
            await deleteImagesFromStorage(images);
            console.log("✅ Successfully deleted product images from storage");
          } catch (storageError) {
            // Log error but continue with product deletion
            console.error("⚠️ Error deleting images from storage:", storageError);
          }
        } else {
          console.log("No images to delete from storage");
        }
      } else {
        console.warn("Could not fetch product details for image cleanup");
      }

      // Step 3: Soft delete the product
      const response = await fetch(
        `${BASE_URL}/products/products/${productId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ deleted: true }),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          errorData.message ||
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Product deletion error:", error);
      res.status(500).json({
        error: "Failed to delete product",
        message: error.message || "Unknown error occurred",
      });
    }
  });

  // Bulk edit products endpoint (proxies to Tokshop API)
  app.put("/api/products/bulkedit", async (req, res) => {
    try {
      const { productIds, updates } = req.body;

      if (
        !productIds ||
        !Array.isArray(productIds) ||
        productIds.length === 0
      ) {
        return res.status(400).json({ error: "productIds array is required" });
      }

      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "updates object is required" });
      }

      console.log(`Bulk editing ${productIds.length} products:`, { productIds, updates });

      // Map camelCase to snake_case for Tokshop API
      const tokshopUpdates = {
        ...updates,
        // Map shippingProfile to shipping_profile if present
        ...(updates.shippingProfile && {
          shipping_profile: updates.shippingProfile,
          shippingProfile: undefined
        })
      };

      // Remove undefined fields
      Object.keys(tokshopUpdates).forEach(key => {
        if (tokshopUpdates[key] === undefined) {
          delete tokshopUpdates[key];
        }
      });

      const payload = {
        productIds,
        updates: tokshopUpdates
      };

      console.log("Sending to Tokshop API:", JSON.stringify(payload, null, 2));

      // Include authentication token from session
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
        console.log("Authorization header added for bulk edit");
      } else {
        console.log("WARNING: No access token found in session for bulk edit");
      }

      const response = await fetch(`${BASE_URL}/products/products/bulkedit/all`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      console.log(`Tokshop API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        console.error("Tokshop API error:", errorData);
        throw new Error(
          errorData.message ||
          `Tokshop API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Bulk edit successful:", data);
      res.json(data);
    } catch (error: any) {
      console.error("Bulk edit error:", error);
      res.status(500).json({
        error: "Failed to bulk edit products",
        message: error.message || "Unknown error occurred",
      });
    }
  });

  // Bulk delete products - proxy to external API
  app.delete("/api/products/deletemany", async (req, res) => {
    try {
      const { ids } = req.body;
      console.log("Bulk deleting products:", ids);

      const accessToken = getAccessToken(req);
      if (!accessToken) {
        return res.status(401).json({ error: "Unauthorized - no access token" });
      }

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No product IDs provided" });
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      };

      const url = `${BASE_URL}/products/deletemany`;
      console.log("DELETE request to:", url, "with ids:", ids);

      const response = await fetch(url, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ ids }),
      });

      console.log(`Tokshop API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Failed to delete products" };
        }
        console.error("Tokshop API error:", errorData);
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      console.log("Products deleted successfully:", data);
      res.json(data);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      res.status(500).json({
        error: "Failed to delete products",
        message: error.message || "Unknown error occurred",
      });
    }
  });

  // Delete product by ID - proxy to external API
  app.delete("/api/products/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Deleting product:", id);

      const accessToken = getAccessToken(req);
      if (!accessToken) {
        return res.status(401).json({ error: "Unauthorized - no access token" });
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      };

      const url = `${BASE_URL}/products/products/${id}`;
      console.log("DELETE request to:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      });

      console.log(`Tokshop API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Failed to delete product" };
        }
        console.error("Tokshop API error:", errorData);
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      console.log("Product deleted successfully:", data);
      res.json(data);
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({
        error: "Failed to delete product",
        message: error.message || "Unknown error occurred",
      });
    }
  });

}
