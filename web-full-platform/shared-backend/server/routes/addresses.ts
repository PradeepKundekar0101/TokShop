import type { Express } from "express";
import fetch from "node-fetch";
import { BASE_URL } from "../utils";
import { 
  createAddressSchema, 
  updateAddressSchema, 
  makePrimaryAddressSchema 
} from "../../shared/schema";

export function registerAddressRoutes(app: Express) {
  // Get all addresses for a user
  app.get("/api/address/all/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('Fetching addresses for user:', userId);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Check for token in session or headers
      const token = req.session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/address/all/${userId}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json() as any[];
      
      if (data && data.length > 0) {
        console.log('======= ADDRESS API RESPONSE =======');
        console.log('Full address object:', JSON.stringify(data[0], null, 2));
        console.log('Country:', data[0].country);
        console.log('CountryCode:', data[0].countryCode);
        console.log('State:', data[0].state);
        console.log('StateCode:', data[0].stateCode);
        console.log('City:', data[0].city);
        console.log('CityCode:', data[0].cityCode);
        console.log('=====================================');
      }
      
      // Transform API response: ICONA stores in 'zip' but frontend expects 'zipcode'
      const transformedData = data.map((address: any) => ({
        ...address,
        zipcode: address.zip || address.zipcode || "", // Map zip to zipcode for frontend
      }));
      
      res.json(transformedData);
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  // Get default address for a user
  app.get("/api/address/default/address/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('Fetching default address for user:', userId);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Check for token in session or headers
      const token = req.session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch all addresses and find the primary one
      const response = await fetch(`${BASE_URL}/address/all/${userId}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }
      
      const addresses = await response.json() as any[];
      console.log(`Fetched ${addresses?.length || 0} addresses for user ${userId}`);
      
      // Find the primary address
      const defaultAddress = addresses?.find((addr: any) => addr.primary === true);
      console.log('Default address found:', defaultAddress ? 'YES' : 'NO');
      
      // If no default address exists, return empty response
      if (!defaultAddress) {
        return res.json({ address: null });
      }
      
      // Transform API response: ICONA stores in 'zip' but frontend expects 'zipcode'
      const transformedData = {
        address: {
          ...defaultAddress,
          zipcode: defaultAddress.zip || defaultAddress.zipcode || "", // Map zip to zipcode for frontend
        }
      };
      
      res.json(transformedData);
    } catch (error) {
      console.error('Get default address error:', error);
      res.status(500).json({ error: "Failed to fetch default address" });
    }
  });

  // Create new address
  app.post("/api/address", async (req, res) => {
    try {
      // Validate request body
      const validationResult = createAddressSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        });
      }
      
      const validatedData = validationResult.data;
      console.log('Creating address via Tokshop API for user:', validatedData.userId);
      
      // Transform and clean the request body according to specified format
      const transformedBody = {
        userId: validatedData.userId,
        name: validatedData.name,
        addrress1: validatedData.addrress1,
        addrress2: validatedData.addrress2,
        city: validatedData.city,
        state: validatedData.state,
        stateCode: validatedData.stateCode || "", // Add state code
        cityCode: validatedData.cityCode || "", // Add city code
        zip: validatedData.zipcode, // ICONA stores in 'zip' field
        zipcode: validatedData.zipcode, // Also send zipcode for compatibility
        country: validatedData.country || validatedData.countryCode, // Use country name if available, fallback to code
        countryCode: validatedData.countryCode,
        street1: validatedData.addrress1,
        phone: validatedData.phone,
        email: validatedData.email,
        validate: true,
      };
      
      console.log('Sending to Tokshop API:', JSON.stringify(transformedBody, null, 2));
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Check for token in session or headers
      const token = req.session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/address`, {
        method: 'POST',
        headers,
        body: JSON.stringify(transformedBody)
      });
      
      const responseText = await response.text();
      console.log('Tokshop API response status:', response.status);
      console.log('Tokshop API response body:', responseText);
      
      // Check if this is actually an error (external API returns 400 even on success)
      let isActualError = !response.ok;
      try {
        const jsonCheck = JSON.parse(responseText);
        if (jsonCheck.success === true) {
          isActualError = false; // API returned success:true, so treat as success
        }
      } catch (e) {
        // If not JSON, proceed with normal error handling
      }
      
      if (isActualError) {
        console.error(`Tokshop API error ${response.status}:`, responseText);
        
        // Parse the API error response and return the actual validation message
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          console.log('Parsed API error message:', apiMessage);
          
          return res.status(response.status).json({ 
            error: apiMessage, // Return the actual API validation message
            details: errorJson,
            sentData: transformedBody 
          });
        } catch (e) {
          // If response is not JSON, return the raw response as the error
          return res.status(response.status).json({ 
            error: responseText || "Address validation failed",
            details: responseText,
            sentData: transformedBody 
          });
        }
      }
      
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({ 
        error: "Failed to create address", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update address
  app.put("/api/address/:addressId", async (req, res) => {
    try {
      const { addressId } = req.params;
      
      // Validate request body
      const validationResult = updateAddressSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        });
      }
      
      const validatedData = validationResult.data;
      console.log('Updating address via Tokshop API:', addressId);
      
      // Transform and clean the request body according to specified format (same as POST)
      const transformedBody = {
        userId: validatedData.userId,
        name: validatedData.name,
        addrress1: validatedData.addrress1,
        addrress2: validatedData.addrress2,
        city: validatedData.city,
        state: validatedData.state,
        stateCode: validatedData.stateCode || "", // Add state code
        cityCode: validatedData.cityCode || "", // Add city code
        zip: validatedData.zipcode, // ICONA stores in 'zip' field
        zipcode: validatedData.zipcode, // Also send zipcode for compatibility
        country: validatedData.country || validatedData.countryCode, // Use country name if available, fallback to code
        countryCode: validatedData.countryCode,
        street1: validatedData.addrress1,
        phone: validatedData.phone,
        email: validatedData.email,
        validate: true,
      };
      
      console.log('Sending to Tokshop API:', JSON.stringify(transformedBody, null, 2));
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Check for token in session or headers
      const token = req.session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/address/${addressId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(transformedBody)
      });
      
      const responseText = await response.text();
      console.log('Tokshop API response status:', response.status);
      console.log('Tokshop API response body:', responseText);
      
      // Check if this is actually an error (external API returns 400 even on success)
      let isActualError = !response.ok;
      try {
        const jsonCheck = JSON.parse(responseText);
        if (jsonCheck.success === true) {
          isActualError = false; // API returned success:true, so treat as success
        }
      } catch (e) {
        // If not JSON, proceed with normal error handling
      }
      
      if (isActualError) {
        console.error(`Tokshop API error ${response.status}:`, responseText);
        
        // Parse the API error response and return the actual validation message
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          console.log('Parsed API error message:', apiMessage);
          
          return res.status(response.status).json({ 
            error: apiMessage, // Return the actual API validation message
            details: errorJson,
            sentData: transformedBody 
          });
        } catch (e) {
          // If response is not JSON, return the raw response as the error
          return res.status(response.status).json({ 
            error: responseText || "Address validation failed",
            details: responseText,
            sentData: transformedBody 
          });
        }
      }
      
      const data = JSON.parse(responseText);
      
      // Transform the API response back to our expected format if needed
      if (data.data) {
        // If the API response wraps data in a 'data' property, extract it
        const responseData = data.data;
        
        // Ensure zipcode is properly set if zip was provided
        if (transformedBody.zip && !responseData.zipcode) {
          responseData.zipcode = transformedBody.zip;
        }
        
        res.json(responseData);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  // Set address as primary (PUT endpoint for client compatibility)
  app.put("/api/address/primary/:addressId", async (req, res) => {
    try {
      const { addressId } = req.params;
      const { userId } = req.body;
      
      console.log('Setting address as primary via PUT:', addressId, 'for user:', userId);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = req.session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/address/${addressId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ primary: true, userId })
      });
      
      const responseText = await response.text();
      console.log('Tokshop API response status:', response.status);
      console.log('Tokshop API response body:', responseText);
      
      if (!response.ok) {
        console.error(`Tokshop API error ${response.status}:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          return res.status(response.status).json({ 
            success: false,
            error: errorJson.message || errorJson.error || "Failed to set primary address"
          });
        } catch (e) {
          return res.status(response.status).json({ 
            success: false,
            error: responseText || "Failed to set primary address"
          });
        }
      }
      
      const data = JSON.parse(responseText);
      res.json({ success: true, data: data.data || data });
    } catch (error) {
      console.error('Set primary address error:', error);
      res.status(500).json({ success: false, error: "Failed to set primary address" });
    }
  });

  // Make address primary
  app.patch("/api/address/:addressId", async (req, res) => {
    try {
      const { addressId } = req.params;
      
      // Validate request body
      const validationResult = makePrimaryAddressSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        });
      }
      
      const validatedData = validationResult.data;
      console.log('Setting address as primary via Tokshop API:', addressId);
      
      const requestBody = { primary: validatedData.primary, userId: validatedData.userId };
      console.log('Sending to Tokshop API:', JSON.stringify(requestBody, null, 2));
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Check for token in session or headers
      const token = req.session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/address/${addressId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      const responseText = await response.text();
      console.log('Tokshop API response status:', response.status);
      console.log('Tokshop API response body:', responseText);
      
      if (!response.ok) {
        console.error(`Tokshop API error ${response.status}:`, responseText);
        
        // Parse the API error response and return the actual validation message
        try {
          const errorJson = JSON.parse(responseText);
          const apiMessage = errorJson.message || errorJson.error || errorJson;
          console.log('Parsed API error message:', apiMessage);
          
          return res.status(response.status).json({ 
            error: apiMessage, // Return the actual API validation message
            details: errorJson,
            sentData: requestBody 
          });
        } catch (e) {
          // If response is not JSON, return the raw response as the error
          return res.status(response.status).json({ 
            error: responseText || "Address validation failed",
            details: responseText,
            sentData: requestBody 
          });
        }
      }
      
      const data = JSON.parse(responseText);
      
      // Transform the API response back to our expected format if needed
      if (data.data) {
        // If the API response wraps data in a 'data' property, extract it
        res.json(data.data);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error('Update address primary status error:', error);
      res.status(500).json({ error: "Failed to update address primary status" });
    }
  });

  // Delete address
  app.delete("/api/address/:addressId", async (req, res) => {
    try {
      const { addressId } = req.params;
      console.log('Deleting address via Tokshop API:', addressId);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Check for token in session or headers
      const token = req.session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/address/${addressId}`, {
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
      console.error('Delete address error:', error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });
}