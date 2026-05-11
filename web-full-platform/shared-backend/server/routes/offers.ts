import type { Express } from "express";
import fetch from "node-fetch";
import { BASE_URL, getAccessToken } from "../utils";

export function registerOfferRoutes(app: Express) {
  // Create offer (POST /api/offers)
  app.post("/api/offers", async (req, res) => {
    try {
      console.log('Creating offer via Tokshop API');
      console.log('Offer payload:', req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/offers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json() as any;
      console.log('Offer creation response:', data);
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || data.message || "Failed to create offer"
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Offer creation error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to create offer" 
      });
    }
  });

  // Get offers (GET /api/offers)
  app.get("/api/offers", async (req, res) => {
    try {
      console.log('Fetching offers via Tokshop API');
      console.log('Query params:', req.query);
      
      const queryParams = new URLSearchParams();
      
      if (req.query.tokshowId) {
        queryParams.set('tokshowId', req.query.tokshowId as string);
      }
      if (req.query.user) {
        queryParams.set('user', req.query.user as string);
      }
      if (req.query.role) {
        queryParams.set('role', req.query.role as string);
      }
      if (req.query.page) {
        queryParams.set('page', req.query.page as string);
      }
      if (req.query.limit) {
        queryParams.set('limit', req.query.limit as string);
      }
      if (req.query.status) {
        queryParams.set('status', req.query.status as string);
      }
      
      const url = `${BASE_URL}/offers?${queryParams.toString()}`;
      console.log('Fetching offers from:', url);
      
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
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || data.message || "Failed to fetch offers"
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Offers fetch error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch offers" 
      });
    }
  });

  // Counter offer (POST /api/offers/counter)
  app.post("/api/offers/counter", async (req, res) => {
    try {
      console.log('Counter offer via Tokshop API');
      console.log('Counter offer payload:', req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/offers/counter`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || data.message || "Failed to counter offer"
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Counter offer error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to counter offer" 
      });
    }
  });

  // Accept offer (POST /api/offers/accept)
  app.post("/api/offers/accept", async (req, res) => {
    try {
      console.log('Accept offer via Tokshop API');
      console.log('Accept offer payload:', req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/offers/accept`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || data.message || "Failed to accept offer"
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Accept offer error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to accept offer" 
      });
    }
  });

  // Reject offer (POST /api/offers/reject)
  app.post("/api/offers/reject", async (req, res) => {
    try {
      console.log('Reject offer via Tokshop API');
      console.log('Reject offer payload:', req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/offers/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || data.message || "Failed to reject offer"
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Reject offer error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to reject offer" 
      });
    }
  });

  // Cancel offer (POST /api/offers/cancel)
  app.post("/api/offers/cancel", async (req, res) => {
    try {
      console.log('Cancel offer via Tokshop API');
      console.log('Cancel offer payload:', req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/offers/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || data.message || "Failed to cancel offer"
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Cancel offer error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to cancel offer" 
      });
    }
  });
}
