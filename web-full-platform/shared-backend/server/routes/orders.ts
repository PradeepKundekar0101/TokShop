import type { Express } from "express";
import fetch from "node-fetch";
import { BASE_URL, getAccessToken } from "../utils";
import { z } from "zod";

export function registerOrderRoutes(app: Express) {
  // Get all order items for a show (tokshow)
  app.get("/api/orders/items/all", async (req, res) => {
    try {
      console.log('Fetching order items');
      console.log('Query params received:', req.query);
      
      const queryParams = new URLSearchParams();
      
      if (req.query.tokshow) {
        queryParams.set('tokshow', req.query.tokshow as string);
      }
      if (req.query.seller) {
        queryParams.set('seller', req.query.seller as string);
      }
      if (req.query.customer) {
        queryParams.set('customer', req.query.customer as string);
      }
      if (req.query.status) {
        queryParams.set('status', req.query.status as string);
      }
      if (req.query.page) {
        queryParams.set('page', req.query.page as string);
      }
      if (req.query.limit) {
        queryParams.set('limit', req.query.limit as string);
      }
      if (req.query.search) {
        queryParams.set('search', req.query.search as string);
      }
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/orders/items/all${queryString ? `?${queryString}` : ''}`;
      console.log('Final API URL being called:', url);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json() as any;
      console.log('Order items response keys:', Object.keys(data));
      if (data.items && data.items.length > 0) {
        console.log('First item keys:', Object.keys(data.items[0]));
        console.log('First item sample:', JSON.stringify(data.items[0], null, 2).substring(0, 500));
      }
      
      res.json(data);
    } catch (error) {
      console.error('Order items fetch error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch order items from Tokshop API" 
      });
    }
  });

  // Get single order by ID (must be before general orders route)
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      console.log('Fetching single order:', orderId);
      
      // Use proper path parameter for single order
      const url = `${BASE_URL}/orders/${orderId}`;
      console.log('Final API URL being called:', url);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json() as any;
      console.log('Order data structure:', Object.keys(data));
      
      // Handle both direct order response and wrapped response
      const order = data.order || data.data || data;
      
      if (!order || !order._id) {
        return res.status(404).json({
          success: false,
          error: "Order not found"
        });
      }
      
      console.log('Order fields:', Object.keys(order));
      console.log('Order items:', order.items?.length || 0);
      if (order.items && order.items[0]) {
        console.log('First item fields:', Object.keys(order.items[0]));
      }
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Single order fetch error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch order from Tokshop API" 
      });
    }
  });

  // Orders proxy
  app.get("/api/orders", async (req, res) => {
    try {
      console.log('Proxying orders request to Tokshop API');
      console.log('Query params received:', req.query);
      
      // Build query parameters for Tokshop API
      const queryParams = new URLSearchParams();
      
      // Add userId parameter (this is the key parameter for filtering user's orders)
      if (req.query.userId) {
        queryParams.set('userId', req.query.userId as string);
      }
      
      if (req.query.status && req.query.status !== 'all') {
        queryParams.set('status', req.query.status as string);
      }
      if (req.query.page) {
        queryParams.set('page', req.query.page as string);
      }
      if (req.query.limit) {
        queryParams.set('limit', req.query.limit as string);
      }
      if (req.query.invoice) {
        queryParams.set('invoice', req.query.invoice as string);
      }
      if (req.query.customer) {
        queryParams.set('customer', req.query.customer as string);
      }
      if (req.query.customerId) {
        queryParams.set('customerId', req.query.customerId as string);
      }
      if (req.query.day) {
        queryParams.set('day', req.query.day as string);
      }
      if (req.query.tokshow) {
        queryParams.set('tokshow', req.query.tokshow as string);
      }
      if (req.query.marketplace) {
        queryParams.set('marketplace', req.query.marketplace as string);
      }
      // Add date filter parameters
      if (req.query.startDate) {
        queryParams.set('startDate', req.query.startDate as string);
      }
      if (req.query.endDate) {
        queryParams.set('endDate', req.query.endDate as string);
      }
      // Add platform_order filter for giveaway orders
      if (req.query.platform_order) {
        queryParams.set('platform_order', req.query.platform_order as string);
      }
      if (req.query.search) {
        queryParams.set('search', req.query.search as string);
      }
      if (req.query.searchBy) {
        queryParams.set('searchBy', req.query.searchBy as string);
      }
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/orders${queryString ? '?' + queryString : ''}`;
      
      console.log('Final API URL being called:', url);
      console.log('[Orders] Session accessToken:', req.session?.accessToken ? 'present' : 'missing');
      console.log('[Orders] Headers x-access-token:', req.headers['x-access-token'] ? 'present' : 'missing');
      console.log('[Orders] Headers x-user-data:', req.headers['x-user-data'] ? 'present' : 'missing');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('[Orders] Adding Authorization header to external API request');
      } else {
        console.warn('[Orders] No session accessToken found - request will fail!');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json() as any;
      
      // API returns: { orders: [...], total: number, limits: number, pages: currentPage }
      const total = data.total || 0;
      const limits = data.limits || 20;
      const totalPages = total > 0 ? Math.ceil(total / limits) : 1;
      
      res.json({
        ...data,
        total: total,
        pages: totalPages,
        currentPage: data.pages || 1,
      });
    } catch (error) {
      console.error('Orders proxy error:', error);
      res.status(500).json({ error: "Failed to fetch orders from Tokshop API" });
    }
  });

  // Create order (checkout) endpoint
  app.post("/api/orders/:id", async (req, res) => {
    try {
      console.log('Creating order (checkout) with payload:', JSON.stringify(req.body, null, 2));
      
      const checkoutSchema = z.object({
        product: z.string(),
        status: z.string().default('processing'),
        shippingFee: z.union([z.string(), z.number()]),
        servicelevel: z.string().optional(),
        rate_id: z.string().optional(),
        bundleId: z.string().optional(),
        totalWeightOz: z.union([z.string(), z.number()]).optional(),
        seller_shipping_fee_pay: z.union([z.string(), z.number()]).optional(),
        carrierAccount: z.string().optional(),
        subtotal: z.union([z.string(), z.number()]),
        tax: z.union([z.string(), z.number()]),
        seller: z.string(),
        buyer: z.string(),
        quantity: z.number(),
        total: z.union([z.string(), z.number()]),
        color: z.string().optional(),
        size: z.string().optional(),
        tokshow: z.string().optional(),
        referralDiscount: z.union([z.string(), z.number()]).optional(),
        referredBy: z.string().optional(),
      });

      const orderData = checkoutSchema.parse(req.body);
      console.log('Validated order data:', orderData);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/orders/${req.params.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create order in Tokshop API:', response.status, errorText);
        return res.status(response.status).json({ 
          success: false,
          error: `Failed to create order: ${response.status}`,
          details: errorText
        });
      }

      const createdOrder = await response.json();
      console.log('Order created successfully:', createdOrder);
      
      res.json({
        success: true,
        data: createdOrder
      });

    } catch (error) {
      console.error('Order creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid order data",
          details: error.errors 
        });
      }
      res.status(500).json({ 
        success: false,
        error: "Failed to create order" 
      });
    }
  });

  // Update order endpoint
  app.patch("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;

      console.log('Updating order:', orderId, 'with data:', updateData);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update order in Tokshop API:', response.status, errorText);
        return res.status(response.status).json({ 
          error: `Failed to update order: ${response.status}`,
          details: errorText
        });
      }

      const updatedOrder = await response.json();
      console.log('Order updated successfully:', updatedOrder);
      res.json(updatedOrder);

    } catch (error) {
      console.error('Order update error:', error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // PUT endpoint for order updates (including cancellation)
  app.put("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;

      console.log('PUT updating order:', orderId, 'with data:', updateData);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to PUT update order in Tokshop API:', response.status, errorText);
        return res.status(response.status).json({ 
          error: `Failed to update order: ${response.status}`,
          details: errorText
        });
      }

      const updatedOrder = await response.json();
      console.log('Order PUT updated successfully:', updatedOrder);
      res.json(updatedOrder);

    } catch (error) {
      console.error('Order PUT update error:', error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Mark all orders in a bundle as shipped
  app.post("/api/orders/bundle/:idParam/ship", async (req, res) => {
    try {
      const { idParam } = req.params;
      console.log('Marking bundle as shipped, received ID:', idParam);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch all orders for this user
      const userId = req.body.userId || req.query.userId;
      if (!userId) {
        return res.status(400).json({ 
          success: false,
          error: "User ID is required" 
        });
      }

      const ordersResponse = await fetch(`${BASE_URL}/orders?userId=${userId}`, {
        method: 'GET',
        headers
      });

      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const ordersData = await ordersResponse.json() as any;
      const allOrders = ordersData.orders || [];

      // The parameter might be an order ID or a bundleId
      // First, check if it's an order ID
      const orderById = allOrders.find((order: any) => order._id === idParam);
      
      // If we found an order, use its bundleId. Otherwise, assume idParam is already a bundleId
      const bundleId = orderById?.bundleId || idParam;
      console.log(`Resolved bundleId: ${bundleId} (from ${orderById ? 'order' : 'direct bundleId'})`);

      // Find all orders with this bundleId
      const bundleOrders = allOrders.filter((order: any) => order.bundleId === bundleId);

      if (bundleOrders.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No orders found with this bundleId"
        });
      }

      console.log(`Found ${bundleOrders.length} orders to ship for bundle ${bundleId}`);

      // Ship each order with proper format
      const shipPromises = bundleOrders.map((order: any) =>
        fetch(`${BASE_URL}/orders/${order._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ 
            status: 'shipped',
            relist: false,
            bundleId: bundleId
          })
        })
      );

      const results = await Promise.all(shipPromises);
      const failedShipments = results.filter((response) => !response.ok);

      if (failedShipments.length > 0) {
        return res.status(500).json({
          success: false,
          error: `Failed to ship ${failedShipments.length} orders in bundle`
        });
      }

      res.json({
        success: true,
        shippedOrders: bundleOrders.length
      });

    } catch (error) {
      console.error('Bundle ship error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to ship bundle" 
      });
    }
  });

  // Bundle orders endpoint - assigns bundle ID to selected orders
  app.post("/api/orders/bundle/orders", async (req, res) => {
    try {
      const bundleRequestSchema = z.object({
        orderIds: z.array(z.string().min(1, "Order ID cannot be empty")).min(1, "At least one order ID is required"),
      });

      const { orderIds } = bundleRequestSchema.parse(req.body);
      console.log('Creating bundle for orders:', orderIds);

      // Call external API bundling endpoint
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`${BASE_URL}/orders/bundle/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create bundle via external API" })) as { message?: string };
        console.error('External API bundle creation failed:', response.status, errorData);
        return res.status(response.status).json({
          success: false,
          message: errorData.message || "Failed to create bundle via external API"
        });
      }

      const bundleResult = await response.json();
      console.log('Bundle created successfully via external API:', bundleResult);

      // Return the result from external API
      res.json({
        success: true,
        message: "Bundle created successfully",
        data: bundleResult
      });

    } catch (error) {
      console.error('Bundle creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create bundle" });
    }
  });

  // Unbundle orders endpoint - unbundles items from an order
  app.post("/api/orders/unbundle/orders", async (req, res) => {
    try {
      console.log('=== UNBUNDLE ENDPOINT CALLED ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const unbundleRequestSchema = z.object({
        orderId: z.string().min(1, "Order ID is required"),
        itemIds: z.array(z.string().min(1, "Item ID cannot be empty")).min(1, "At least one item ID is required"),
      });

      const { orderId, itemIds } = unbundleRequestSchema.parse(req.body);
      console.log('Unbundling items from order:', orderId, 'Items:', itemIds);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Call external API unbundling endpoint
      const response = await fetch(`${BASE_URL}/orders/unbundle/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, itemIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to unbundle items via external API" })) as { message?: string };
        console.error('External API unbundle failed:', response.status, errorData);
        return res.status(response.status).json({
          success: false,
          message: errorData.message || "Failed to unbundle items via external API"
        });
      }

      const unbundleResult = await response.json();
      console.log('Items unbundled successfully via external API:', unbundleResult);

      // Return the result from external API
      res.json({
        success: true,
        message: "Items unbundled successfully",
        data: unbundleResult
      });

    } catch (error) {
      console.error('Unbundle error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to unbundle items" });
    }
  });

  // Cancel order endpoint - POST /api/orders/cancel/order
  app.post("/api/orders/cancel/order", async (req, res) => {
    try {
      const { order, relist, initiator, type, description } = req.body;

      console.log('Cancelling order:', { order, relist, initiator, type, description });

      if (!order) {
        return res.status(400).json({ 
          success: false,
          error: "Order ID is required" 
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/orders/cancel/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order,
          relist: relist || false,
          initiator: initiator || 'buyer',
          type: type || 'order',
          description: description || ''
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to cancel order in Tokshop API:', response.status, errorText);
        return res.status(response.status).json({ 
          success: false,
          error: `Failed to cancel order: ${response.status}`,
          details: errorText
        });
      }

      const result = await response.json();
      console.log('Order cancelled successfully:', result);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Order cancellation error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to cancel order" 
      });
    }
  });

  // Approve cancellation request endpoint - POST /api/orders/cancel/approve
  app.post("/api/orders/cancel/approve", async (req, res) => {
    try {
      const { order, item, description, relist } = req.body;

      console.log('Approving cancellation request:', { order, item, description, relist });

      if (!order) {
        return res.status(400).json({ 
          success: false,
          error: "Order ID is required" 
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const payload: any = {
        order: item || order,  // Use item ID if present, otherwise order ID
        action: 'approve',
        type: item ? 'item' : 'order',
        initiator: 'seller',
        description: description || 'Cancellation approved by seller',
        relist: relist || false
      };

      const response = await fetch(`${BASE_URL}/orders/cancel/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to approve cancellation in Tokshop API:', response.status, errorText);
        return res.status(response.status).json({ 
          success: false,
          error: `Failed to approve cancellation: ${response.status}`,
          details: errorText
        });
      }

      const result = await response.json();
      console.log('Cancellation approved successfully:', result);
      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Approve cancellation error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to approve cancellation" 
      });
    }
  });

  // Decline cancellation request endpoint - POST /api/orders/cancel/decline
  app.post("/api/orders/cancel/decline", async (req, res) => {
    try {
      const { order, item, description } = req.body;

      console.log('Declining cancellation request:', { order, item, description });

      if (!order) {
        return res.status(400).json({ 
          success: false,
          error: "Order ID is required" 
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const payload: any = {
        order: item || order,  // Use item ID if present, otherwise order ID
        action: 'reject',
        type: item ? 'item' : 'order',
        initiator: 'seller',
        description: description || (item 
          ? 'Item cancellation declined by seller' 
          : 'Order cancellation declined by seller')
      };

      console.log('Sending REJECT payload to Tokshop API:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${BASE_URL}/orders/cancel/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to decline cancellation in Tokshop API:', response.status, errorText);
        return res.status(response.status).json({ 
          success: false,
          error: `Failed to decline cancellation: ${response.status}`,
          details: errorText
        });
      }

      const result = await response.json();
      console.log('Cancellation declined successfully:', result);
      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Decline cancellation error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to decline cancellation" 
      });
    }
  });
}