import type { Express } from "express";
import fetch from "node-fetch";
import https from 'https';
import { URL } from 'url';
import { BASE_URL, getAccessToken } from "../utils";
import type { 
  TokshopOrdersResponse, 
  ShippingEstimateRequest, 
  ShippingEstimateResponse,
  ShippingLabelPurchaseRequest,
  ShippingLabelPurchaseResponse,
  BundleLabelPurchaseRequest,
  BundleLabelPurchaseResponse,
  TokshopOrder
} from "../../shared/schema";
import { 
  shippingEstimateRequestSchema,
  shippingEstimateResponseSchema,
  shippingLabelPurchaseRequestSchema,
  bundleLabelPurchaseRequestSchema
} from "../../shared/schema";

// Utility function to make GET requests with body using https.request
function makeGetWithBody(url: string, payload: any, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const body = JSON.stringify(payload);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
        ...headers
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(body);
    req.end();
  });
}

export function registerShippingRoutes(app: Express) {
  // Get all general shipping profiles (admin)
  app.get("/api/shipping/profiles", async (req, res) => {
    try {
      console.log('Fetching general shipping profiles');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const url = `${BASE_URL}/shipping/general/profiles`;
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
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('General shipping profiles fetch error:', error);
      res.status(500).json({ error: "Failed to fetch shipping profiles" });
    }
  });

  // Create general shipping profile (admin)
  app.post("/api/shipping/profiles", async (req, res) => {
    try {
      const payload = { ...req.body, type: "general" };
      console.log('Creating general shipping profile:', payload);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/shipping/general/profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Create shipping profile error:', errorData);
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Create general shipping profile error:', error);
      res.status(500).json({ error: "Failed to create shipping profile" });
    }
  });

  // Shipping profiles for user (with /user/ prefix)
  app.get("/api/shipping/profiles/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('Proxying shipping profiles request to Tokshop API for user:', userId);
      
      const url = `${BASE_URL}/shipping/profiles/user/${userId}`;
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
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Shipping profiles proxy error:', error);
      res.status(500).json({ error: "Failed to fetch shipping profiles from Tokshop API" });
    }
  });

  // Shipping profiles for user (legacy route)
  app.get("/api/shipping/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('Proxying shipping profiles request to Tokshop API for user:', userId);
      
      // Build the URL for the external API
      const url = `${BASE_URL}/shipping/profiles/${userId}`;
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
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Shipping profiles proxy error:', error);
      res.status(500).json({ error: "Failed to fetch shipping profiles from Tokshop API" });
    }
  });

  // Create shipping profile
  app.post("/api/shipping/profiles/:id", async (req, res) => {
    try {
      const { id: userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      console.log('Creating shipping profile via Tokshop API for user:', userId);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/shipping/profiles/${userId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Create shipping profile error:', error);
      res.status(500).json({ error: "Failed to create shipping profile" });
    }
  });

  // Update shipping profile
  app.put("/api/shipping/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('Updating shipping profile via Tokshop API:', id);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/shipping/profiles/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(req.body)
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Update shipping profile error:', error);
      res.status(500).json({ error: "Failed to update shipping profile" });
    }
  });

  // Delete shipping profile
  app.delete("/api/shipping/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('Deleting shipping profile via Tokshop API:', id);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/shipping/profiles/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Delete shipping profile error:', error);
      res.status(500).json({ error: "Failed to delete shipping profile" });
    }
  });

  // Shipping metrics - proxy to external API
  app.get("/api/shipping/metrics", async (req, res) => {
    try {
      const { userId, startDate, endDate, tokshow, marketplace } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId parameter is required" });
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build query string with filters
      const params = new URLSearchParams();
      if (startDate) {
        params.set("startDate", startDate as string);
      }
      if (endDate) {
        params.set("endDate", endDate as string);
      }
      if (tokshow) {
        params.set("tokshow", tokshow as string);
      }
      if (marketplace) {
        params.set("marketplace", marketplace as string);
      }
      const queryString = params.toString() ? `?${params.toString()}` : "";

      const response = await fetch(`${BASE_URL}/orders/shipments/metrics/${userId}${queryString}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`External API returned ${response.status}: ${response.statusText}`);
      }
      
      const metrics = await response.json();
      res.json(metrics);
    } catch (error) {
      console.error('Shipping metrics error:', error);
      res.status(500).json({ error: "Failed to fetch shipping metrics" });
    }
  });

  // Simple shipping estimate (for auction started events)
  app.post("/api/shipping/estimate", async (req, res) => {
    try {
      console.log('Fetching shipping estimate for auction:', req.body);
      
      const requestBody = {
        weight: req.body.weight,
        unit: req.body.unit,
        product: req.body.product,
        update: req.body.update,
        owner: req.body.owner,
        customer: req.body.customer,
        tokshow: req.body.tokshow,
        buying_label: req.body.buying_label ?? true,
      };

      const accessToken = getAccessToken(req);
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const estimate = await makeGetWithBody(`${BASE_URL}/shipping/profiles/estimate/rates`, requestBody, headers);
      console.log('Shipping estimate response:', estimate);
      
      if (estimate && typeof estimate === 'object') {
        // Check for various error indicators from Tokshop API
        const errorMessage = estimate.message || estimate.error || estimate.msg;
        const hasError = estimate.success === false || estimate.error || estimate.status === 'error';
        
        if (hasError && errorMessage) {
          // Check if it's an identical address error
          const lowerMsg = String(errorMessage).toLowerCase();
          if (lowerMsg.includes('identical') || 
              lowerMsg.includes('same address') || 
              lowerMsg.includes('same location') ||
              lowerMsg.includes('shipping to yourself')) {
            console.log('⚠️ Identical address detected:', errorMessage);
            return res.json({
              success: false,
              message: "You cannot ship to yourself. Please use a different shipping address.",
              error: true
            });
          }
          
          // Return other API errors
          console.log('⚠️ Shipping estimate API error:', errorMessage);
          return res.json({
            success: false,
            message: errorMessage,
            error: true
          });
        }
      }
      
      res.json(estimate);
    } catch (error) {
      console.error('Shipping estimate error:', error);
      
      // Check if error message contains identical address info
      const errorMsg = error instanceof Error ? error.message : String(error);
      const lowerMsg = errorMsg.toLowerCase();
      
      if (lowerMsg.includes('identical') || 
          lowerMsg.includes('same address') || 
          lowerMsg.includes('same location') ||
          lowerMsg.includes('shipping to yourself')) {
        return res.json({
          success: false,
          message: "You cannot ship to yourself. Please use a different shipping address.",
          error: true
        });
      }
      
      res.status(500).json({ error: "Failed to get shipping estimate" });
    }
  });

  // Shipping estimates
  app.post("/api/shipping/profiles/estimate/rates", async (req, res) => {
    try {
      // Parse request body and validate using Zod schema
      const validatedData = shippingEstimateRequestSchema.parse(req.body);

      console.log('Fetching shipping estimates from external API:', `${BASE_URL}/shipping/profiles/estimate/rates`);
      
      // Send data in request body using GET method with https.request
      const requestBody: Record<string, any> = {
        weight: validatedData.weight,
        unit: validatedData.unit,
        product: validatedData.product,
        update: validatedData.update,
        owner: validatedData.owner,
        customer: validatedData.customer,
        length: validatedData.length,
        width: validatedData.width,
        height: validatedData.height,
        buying_label: validatedData.buying_label ?? true,
      };
      
      // Add order_id if provided
      if (validatedData.order_id) {
        requestBody.order_id = validatedData.order_id;
      }

      // Build auth headers
      const headers: Record<string, string> = {};
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const rawEstimate = await makeGetWithBody(`${BASE_URL}/shipping/profiles/estimate/rates`, requestBody, headers);
      console.log('External API shipping estimates:', rawEstimate);
      
      // Transform single estimate object into array format expected by frontend
      const estimates = Array.isArray(rawEstimate) ? rawEstimate : [rawEstimate];
      
      // Transform API response format to match frontend expectations
      const transformedEstimates = estimates.map((estimate: any) => {
        const transformed = {
          // Include original data for reference first
          ...estimate,
          // Then override with normalized fields
          carrier: estimate.provider || 'Unknown',
          service: estimate.servicelevel?.name || 'Standard',
          price: estimate.amount || '0.00',
          deliveryTime: estimate.durationTerms || 'Standard delivery',
          estimatedDays: estimate.estimatedDays || 3,
          objectId: typeof estimate.objectId === 'string' ? estimate.objectId.trim() : '',
        };
        
        // Validate against schema to ensure objectId is present
        try {
          shippingEstimateResponseSchema.parse(transformed);
          return transformed;
        } catch (validationError) {
          console.error('Invalid estimate response - missing objectId:', estimate);
          // Skip estimates without valid objectId
          return null;
        }
      }).filter(Boolean);
      
      if (transformedEstimates.length === 0) {
        return res.status(500).json({ 
          error: "No valid shipping estimates available", 
          message: "Unable to get valid shipping rates. Please check package details and try again." 
        });
      }
      
      res.json(transformedEstimates);
    } catch (error) {
      console.error('Shipping estimates error:', error);
      
      // If it's a Zod validation error, return 400
      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({ 
          error: "Invalid shipping data", 
          message: "Missing or invalid weight/dimensions data", 
          details: error.message 
        });
      }
      
      // For calculation errors or other issues, return 500
      res.status(500).json({ 
        error: "Failed to calculate shipping estimates", 
        message: "Unable to calculate shipping costs. Please check package details." 
      });
    }
  });

  // Purchase shipping label
  app.post("/api/shipping/profiles/buy/label", async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validatedData = shippingLabelPurchaseRequestSchema.parse(req.body);
      
      console.log('Processing shipping label purchase:', {
        rate_id: validatedData.rate_id,
        order: validatedData.order,
        carrier: validatedData.carrier,
        servicelevel: validatedData.servicelevel,
        shipping_fee: validatedData.shipping_fee,
        label_file_type: (req.body as any).label_file_type
      });

      // Fetch the order to check if it has a bundleId
      // Note: If the order ID is already a bundle ID, this will fail gracefully
      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        fetchHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      let orderIdToSend = validatedData.order;

      try {
        const orderResponse = await fetch(`${BASE_URL}/orders/${validatedData.order}`, {
          method: 'GET',
          headers: fetchHeaders
        });

        if (orderResponse.ok) {
          const orderData = await orderResponse.json() as any;
          // If order has a bundleId, use that instead
          if (orderData && orderData.bundleId) {
            orderIdToSend = orderData.bundleId;
            console.log(`Order ${validatedData.order} belongs to bundle ${orderData.bundleId}, using bundle ID`);
          }
        } else {
          console.log(`Could not fetch order ${validatedData.order} (might already be a bundle ID), using as-is`);
        }
      } catch (fetchError) {
        console.log(`Error fetching order ${validatedData.order}, using order ID as provided:`, fetchError);
      }

      // Build rates array format expected by external API
      const rates = [{
        rate_id: validatedData.rate_id,
        label_file_type: (req.body as any).label_file_type || 'PDF_4x6',
        order: orderIdToSend,
        // Include new estimate data if provided
        ...((req.body as any).estimate_data && {
          estimate_data: (req.body as any).estimate_data
        })
      }];

      console.log('Calling external shipping API:', `${BASE_URL}/shipping/profiles/buy/label`);
      console.log('Request body being sent to external API:', { rates });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/shipping/profiles/buy/label`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rates })
      });

      console.log(`External API response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('External API error response:', errorText);
        
        let errorMessage = 'Failed to purchase label';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        return res.status(response.status).json({
          success: false,
          message: errorMessage,
          error: errorText
        } as ShippingLabelPurchaseResponse);
      }

      const apiResponseData = await response.json() as any;
      console.log('External API response data:', apiResponseData);

      // Extract result from results array (first item for single label purchase)
      const result = apiResponseData.results?.[0];
      
      if (!result) {
        return res.status(500).json({
          success: false,
          message: 'No label data returned from API'
        } as ShippingLabelPurchaseResponse);
      }

      // Transform external API response to match frontend expectations
      const transformedResponse: ShippingLabelPurchaseResponse = {
        success: true,
        data: {
          tracking_number: result.tracking_number || '',
          cost: validatedData.shipping_fee.toString(),
          carrier: validatedData.carrier || 'Unknown',
          service: validatedData.servicelevel || 'Standard',
          label_url: result.label || '',
          delivery_time: 'Standard delivery',
          purchased_at: new Date().toISOString(),
        },
        message: 'Label purchased successfully'
      };

      res.status(200).json(transformedResponse);

    } catch (error) {
      console.error('Shipping label purchase error:', error);
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "Invalid request data for label purchase",
          error: error.message
        } as ShippingLabelPurchaseResponse);
      }

      // Handle other errors
      if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          message: "Failed to purchase shipping label",
          error: error.message
        } as ShippingLabelPurchaseResponse);
      }

      // Fallback error response
      res.status(500).json({
        success: false,
        message: "An unexpected error occurred while purchasing the shipping label",
        error: "Internal server error"
      } as ShippingLabelPurchaseResponse);
    }
  });

  // Refund shipping label
  app.post("/api/shipping/refund/label", async (req, res) => {
    try {
      const { shipment_id } = req.body;
      
      if (!shipment_id) {
        return res.status(400).json({
          success: false,
          message: "shipment_id is required"
        });
      }

      console.log('Refunding shipping label for shipment:', shipment_id);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/shipping/refund/label/shippo`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ shipment_id })
      });

      console.log(`Refund API response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Refund API error response:', errorText);
        
        let errorMessage = 'Failed to refund label';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        return res.status(response.status).json({
          success: false,
          message: errorMessage
        });
      }

      const data = await response.json();
      console.log('Refund API response data:', data);

      res.status(200).json({
        success: true,
        data,
        message: 'Label refunded successfully'
      });

    } catch (error) {
      console.error('Shipping label refund error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to refund shipping label"
      });
    }
  });

  // Purchase shipping label for bundle (multiple orders)
  app.post("/api/shipping/labels/bundle", async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validatedData = bundleLabelPurchaseRequestSchema.parse(req.body);
      const { orderIds, service, rate_id } = validatedData;

      console.log('Processing bundle label purchase for orders:', orderIds);

      // Fetch all orders to validate and aggregate data
      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        fetchHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      const orderFetchPromises = orderIds.map(async (orderId: string) => {
        const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
          method: 'GET',
          headers: fetchHeaders
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order ${orderId}: ${response.status} ${response.statusText}`);
        }
        
        return response.json() as Promise<TokshopOrder>;
      });

      const orders = await Promise.all(orderFetchPromises);
      console.log(`Fetched ${orders.length} orders for bundling`);

      // Validate orders belong to same customer and have same shipping address
      const firstOrder = orders[0];
      const customerId = firstOrder.customer._id;
      const customerAddress = firstOrder.customer.address;

      if (!customerAddress) {
        return res.status(400).json({
          success: false,
          message: "First order has no shipping address",
          error: "Cannot bundle orders without shipping address"
        } as BundleLabelPurchaseResponse);
      }

      for (const order of orders) {
        // Validate same customer
        if (order.customer._id !== customerId) {
          return res.status(400).json({
            success: false,
            message: "All orders must belong to the same customer",
            error: `Order ${order._id} belongs to different customer`
          } as BundleLabelPurchaseResponse);
        }

        // Validate same shipping address
        const orderAddress = order.customer.address;
        if (!orderAddress || 
            orderAddress.addrress1 !== customerAddress.addrress1 || 
            orderAddress.city !== customerAddress.city ||
            orderAddress.state !== customerAddress.state ||
            orderAddress.zipcode !== customerAddress.zipcode) {
          return res.status(400).json({
            success: false,
            message: "All orders must have the same shipping address",
            error: `Order ${order._id} has different shipping address`
          } as BundleLabelPurchaseResponse);
        }

        // Validate order status is compatible for shipping
        const validStatuses = ['pending', 'processing', 'unfulfilled', 'ready_to_ship'];
        if (order.status && !validStatuses.includes(order.status)) {
          return res.status(400).json({
            success: false,
            message: `Order ${order._id} has incompatible status: ${order.status}`,
            error: "Orders must have compatible status for bundling"
          } as BundleLabelPurchaseResponse);
        }
      }

      // Aggregate weight and dimensions server-side
      let totalWeightOz = 0;
      let maxLength = 0;
      let maxWidth = 0;
      let totalHeight = 0;

      for (const order of orders) {
        // Get weight from giveaway shipping profile or items
        let orderWeight = 0;
        if (order.giveaway?.shipping_profile?.weight) {
          const weight = order.giveaway.shipping_profile.weight;
          const scale = order.giveaway.shipping_profile.scale?.toLowerCase() || 'oz';
          orderWeight = scale === 'lb' ? weight * 16 : weight; // Convert to oz
        } else if (order.items) {
          // Sum weights from individual items
          for (const item of order.items) {
            if (item.weight) {
              const itemWeight = parseFloat(item.weight);
              const itemScale = item.scale?.toLowerCase() || 'oz';
              const weightInOz = itemScale === 'lb' ? itemWeight * 16 : itemWeight;
              orderWeight += weightInOz * (item.quantity || 1);
            }
          }
        }
        totalWeightOz += orderWeight;

        // Get dimensions from giveaway or items
        let orderLength = 0, orderWidth = 0, orderHeight = 0;
        if (order.giveaway) {
          orderLength = parseFloat(order.giveaway.length || '0');
          orderWidth = parseFloat(order.giveaway.width || '0');
          orderHeight = parseFloat(order.giveaway.height || '0');
        } else if (order.items && order.items.length > 0) {
          // Use dimensions from first item as approximation
          const firstItem = order.items[0];
          orderLength = parseFloat(firstItem.length || '0');
          orderWidth = parseFloat(firstItem.width || '0');
          orderHeight = parseFloat(firstItem.height || '0');
        }

        // Aggregate dimensions (max length/width, sum height for stacking)
        maxLength = Math.max(maxLength, orderLength);
        maxWidth = Math.max(maxWidth, orderWidth);
        totalHeight += orderHeight;
      }

      // Set minimum dimensions if none provided
      if (maxLength === 0) maxLength = 12; // 12 inches default
      if (maxWidth === 0) maxWidth = 12;   // 12 inches default  
      if (totalHeight === 0) totalHeight = 4; // 4 inches default
      if (totalWeightOz === 0) totalWeightOz = 8; // 8 oz default

      const aggregatedWeight = `${totalWeightOz}`;
      const aggregatedDimensions = `${maxLength}x${maxWidth}x${totalHeight}`;

      console.log('Aggregated parcel data:', {
        weight: `${totalWeightOz} oz`,
        dimensions: aggregatedDimensions,
        orders: orderIds.length
      });

      // Create aggregate order object for label purchase
      const aggregateOrder = {
        _id: `bundle_${orderIds.join('_')}`,
        customer: firstOrder.customer,
        seller: firstOrder.seller,
        items: orderIds.map((id: string) => ({ _id: id, bundled: true }))
      };

      // Calculate estimated shipping cost (this should ideally come from rate_id validation)
      const estimatedCost = Math.max(5.99, totalWeightOz * 0.15); // Basic estimation

      // Prepare label purchase request using rates array format
      const bundleId = `bundle_${orderIds.join('_')}`;
      const rates = [{
        rate_id: rate_id,
        label_file_type: 'PDF_4x6',  // Default format for bundles
        order: bundleId
      }];

      console.log('Creating bundle label with Tokshop API');
      console.log('Bundle request:', { rates });
      
      const labelHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        labelHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      // Purchase label from external API
      const labelResponse = await fetch(`${BASE_URL}/shipping/profiles/buy/label`, {
        method: 'POST',
        headers: labelHeaders,
        body: JSON.stringify({ rates })
      });

      if (!labelResponse.ok) {
        const errorText = await labelResponse.text();
        console.error('Bundle label purchase failed:', errorText);
        return res.status(labelResponse.status).json({
          success: false,
          message: `Failed to create bundle label: ${labelResponse.status}`,
          error: errorText
        } as BundleLabelPurchaseResponse);
      }

      const labelResult = await labelResponse.json() as any;
      console.log('Bundle label created successfully:', labelResult);

      // Extract tracking number and label data from results array
      const result = labelResult.results?.[0];
      const trackingNumber = result?.tracking_number;
      const labelUrl = result?.label;

      if (!trackingNumber) {
        return res.status(500).json({
          success: false,
          message: "Label created but no tracking number received",
          error: "Missing tracking number in API response"
        } as BundleLabelPurchaseResponse);
      }

      // Propagate tracking number to all orders in bundle
      console.log(`Updating ${orderIds.length} orders with tracking number: ${trackingNumber}`);
      
      const updateHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        updateHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      const updatePromises = orderIds.map(async (orderId: string) => {
        try {
          const updateResponse = await fetch(`${BASE_URL}/orders/${orderId}`, {
            method: 'PATCH',
            headers: updateHeaders,
            body: JSON.stringify({
              tracking_number: trackingNumber,
              label_url: labelUrl, // Use correct field name
              status: 'ready_to_ship'
            })
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`Failed to update order ${orderId}:`, updateResponse.status, errorText);
            return { 
              orderId, 
              success: false, 
              error: `HTTP ${updateResponse.status}: ${errorText}` 
            };
          }

          const updatedOrder = await updateResponse.json();
          console.log(`Order ${orderId} updated with tracking number`);
          return { orderId, success: true, data: updatedOrder };
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error);
          return { 
            orderId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });

      const updateResults = await Promise.all(updatePromises);
      const failedUpdates = updateResults.filter(result => !result.success);
      const successfulUpdates = updateResults.filter(result => result.success);

      console.log(`Bundle label results: ${successfulUpdates.length} successful, ${failedUpdates.length} failed`);

      // Determine response status based on update results
      let responseStatus = 200;
      let message = `Bundle label created successfully for ${orderIds.length} orders`;

      if (failedUpdates.length > 0) {
        if (successfulUpdates.length === 0) {
          // Complete failure - label created but no orders updated
          responseStatus = 500;
          message = "Label created but failed to update any orders";
        } else {
          // Partial success
          responseStatus = 207; // Multi-Status
          message = `Label created with partial success: ${successfulUpdates.length}/${orderIds.length} orders updated`;
        }
      }

      // Return structured response
      const response: BundleLabelPurchaseResponse = {
        success: failedUpdates.length === 0,
        message,
        data: {
          tracking_number: trackingNumber,
          label_url: labelUrl,
          cost: estimatedCost,
          carrier: 'USPS',
          service: service,
          affected_orders: orderIds,
          update_results: updateResults,
          aggregated_weight: aggregatedWeight,
          aggregated_dimensions: aggregatedDimensions
        }
      };

      res.status(responseStatus).json(response);

    } catch (error) {
      console.error('Bundle label purchase error:', error);
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "Invalid bundle label request data",
          error: error.message
        } as BundleLabelPurchaseResponse);
      }

      // Handle other errors
      const errorResponse: BundleLabelPurchaseResponse = {
        success: false,
        message: "Failed to purchase bundle label",
        error: error instanceof Error ? error.message : "Internal server error"
      };

      res.status(500).json(errorResponse);
    }
  });

  // Bulk label purchase for multiple selected orders
  app.post("/api/shipping/bulk-labels", async (req, res) => {
    try {
      const { rates } = req.body;

      console.log(`Processing bulk label purchase with ${rates?.length || 0} rates`);
      console.log('Rates received:', JSON.stringify(rates, null, 2));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Send directly to external API - same as single label purchase
      console.log('API URL:', `${BASE_URL}/shipping/profiles/buy/label`);
      
      const labelResponse = await fetch(`${BASE_URL}/shipping/profiles/buy/label`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rates })
      });
      
      console.log('Label API response status:', labelResponse.status);

      if (!labelResponse.ok) {
        const errorText = await labelResponse.text();
        console.error('External API error:', errorText);
        return res.status(labelResponse.status).json({
          success: false,
          message: errorText
        });
      }

      const labelData = await labelResponse.json();
      console.log('Label API response data:', JSON.stringify(labelData, null, 2));
      
      return res.json(labelData);
    } catch (error) {
      console.error('Bulk label purchase error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to process bulk label purchase"
      });
    }
  });

  // Generate scan form (USPS manifest)
  app.post("/api/shipping/generate/manifest", async (req, res) => {
    try {
      const { tokshow, carrierAccount, ownerId, type, platform_order } = req.body;

      // For giveaway type, tokshow is not required
      // Allow null for marketplace orders, but reject undefined or missing for non-giveaway types
      if (type !== 'giveaway' && tokshow === undefined) {
        return res.status(400).json({ 
          success: false,
          message: "tokshow parameter is required" 
        });
      }

      console.log('Generating scan form for type:', type, 'tokshow:', tokshow, 'with carrierAccount:', carrierAccount, 'ownerId:', ownerId, 'platform_order:', platform_order);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build request body - for giveaway type, pass type instead of tokshow
      const requestBody: Record<string, any> = { carrierAccount, ownerId };
      if (type === 'giveaway') {
        requestBody.type = 'giveaway';
      } else {
        requestBody.tokshow = tokshow;
      }
      if (platform_order) {
        requestBody.platform_order = true;
      }

      const response = await fetch(`${BASE_URL}/shipping/generate/manifest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Scan form generation failed:', data);
        return res.status(response.status).json(data);
      }

      console.log('Scan form generated successfully:', data);
      return res.json(data);
    } catch (error) {
      console.error('Scan form generation error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate scan form"
      });
    }
  });

  // View existing scan forms (GET request to external API)
  app.post("/api/shipping/generate/manifest/view", async (req, res) => {
    try {
      const { type, tokshow, status } = req.body;

      console.log('Viewing scan forms with params:', { type, tokshow, status });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build query parameters for external API
      const params = new URLSearchParams();
      
      if (type === 'marketplace') {
        params.set('type', 'marketplace');
      } else if (type === 'giveaway') {
        params.set('type', 'giveaway');
      } else if (tokshow) {
        params.set('tokshow', tokshow);
      }
      
      if (status) {
        params.set('status', status);
      }

      // Call external API to get scan forms
      const response = await fetch(`${BASE_URL}/shipping/generate/manifest?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Scan form view failed:', data);
        return res.status(response.status).json(data);
      }

      console.log('Scan forms retrieved successfully:', data);
      return res.json(data);
    } catch (error) {
      console.error('Scan form view error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to retrieve scan forms"
      });
    }
  });

  // Fetch scan form by manifest ID
  app.get("/api/shipping/generate/manifest/:manifestId", async (req, res) => {
    try {
      const { manifestId } = req.params;
      const { tokshow, type } = req.query;

      if (!manifestId) {
        return res.status(400).json({ 
          success: false,
          message: "manifest_id parameter is required" 
        });
      }

      // For giveaway type, tokshow is not required
      if (type !== 'giveaway' && tokshow === undefined) {
        return res.status(400).json({ 
          success: false,
          message: "tokshow parameter is required" 
        });
      }

      console.log('Fetching scan form for manifest_id:', manifestId, 'type:', type, 'tokshow:', tokshow);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build query params - for giveaway type, pass type instead of tokshow
      const params = new URLSearchParams();
      if (type === 'giveaway') {
        params.set('type', 'giveaway');
      } else {
        params.set('tokshow', tokshow as string);
      }

      const response = await fetch(`${BASE_URL}/shipping/generate/manifest/${manifestId}?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Scan form fetch failed:', data);
        return res.status(response.status).json(data);
      }

      console.log('Scan form fetched successfully:', data);
      return res.json(data);
    } catch (error) {
      console.error('Scan form fetch error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch scan form"
      });
    }
  });
}