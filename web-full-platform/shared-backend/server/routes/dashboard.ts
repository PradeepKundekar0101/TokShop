import type { Express } from "express";
import fetch from "node-fetch";
import { BASE_URL } from "../utils";

export function registerDashboardRoutes(app: Express) {
  // Dashboard metrics proxy
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      console.log('Proxying dashboard metrics request to Tokshop API');
      const response = await fetch(`${BASE_URL}/orders/dashboard/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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
      console.error('Dashboard metrics proxy error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics from Tokshop API" });
    }
  });
}