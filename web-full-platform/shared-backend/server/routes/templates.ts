import type { Express } from "express";
import { BASE_URL } from "../utils";

export function registerTemplateRoutes(app: Express) {
  // Get all email templates
  app.get("/api/templates", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found",
        });
      }

      const url = `${BASE_URL}/templates`;
      console.log(`Fetching email templates from: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`Failed to fetch templates from API (${response.status}): ${errorText}`);
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch email templates",
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: data,
      });
    } catch (error: any) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch email templates",
        details: error.message,
      });
    }
  });

  // Get single email template by ID
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      const { id } = req.params;
      
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found",
        });
      }

      const url = `${BASE_URL}/templates/${id}`;
      console.log(`Fetching email template ${id} from: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch email template",
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: data,
      });
    } catch (error: any) {
      console.error("Error fetching email template:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch email template",
        details: error.message,
      });
    }
  });

  // Create email template
  app.post("/api/templates", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found",
        });
      }

      const url = `${BASE_URL}/templates`;
      console.log(`Creating email template at: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Template creation error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: "Failed to create email template",
          details: errorData,
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: data,
      });
    } catch (error: any) {
      console.error("Error creating email template:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create email template",
        details: error.message,
      });
    }
  });

  // Update email template
  app.put("/api/templates/:id", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      const { id } = req.params;
      
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found",
        });
      }

      const url = `${BASE_URL}/templates/${id}`;
      console.log(`Updating email template ${id} at: ${url}`);
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Template update error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: "Failed to update email template",
          details: errorData,
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: data,
      });
    } catch (error: any) {
      console.error("Error updating email template:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update email template",
        details: error.message,
      });
    }
  });

  // Delete email template
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const accessToken = req.session?.accessToken;
      const { id } = req.params;
      
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "No access token found",
        });
      }

      const url = `${BASE_URL}/templates/${id}`;
      console.log(`Deleting email template ${id} at: ${url}`);
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Template deletion error:", errorData);
        return res.status(response.status).json({
          success: false,
          error: "Failed to delete email template",
          details: errorData,
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: data,
      });
    } catch (error: any) {
      console.error("Error deleting email template:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete email template",
        details: error.message,
      });
    }
  });
}
