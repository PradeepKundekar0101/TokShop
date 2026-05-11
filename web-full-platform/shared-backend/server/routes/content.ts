import type { Express, Request, Response, NextFunction } from "express";
import { pageTypeEnum, type PageType } from "../../shared/schema";
import { BASE_URL } from "../utils";

// Admin authorization middleware for content routes
function requireContentAdmin(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  if (!session?.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in again.",
    });
  }

  if (!session.user.admin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}

export function registerContentRoutes(app: Express) {
  // Get page content (public endpoint) - /api/content/:pageType
  // Proxies to external API: GET /content/:pageType
  app.get("/api/content/:pageType", async (req, res) => {
    try {
      const pageTypeValidation = pageTypeEnum.safeParse(req.params.pageType);
      
      if (!pageTypeValidation.success) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      const pageType = pageTypeValidation.data as PageType;

      // Proxy to external API
      const response = await fetch(`${BASE_URL}/content/${pageType}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error(`Error fetching ${req.params.pageType} content:`, error.message || error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch content. Please try again.",
        error: error.message,
      });
    }
  });

  // Update page content (admin endpoint) - /api/admin/content/:pageType
  // Proxies to external API: PUT /content/:pageType
  app.put("/api/admin/content/:pageType", requireContentAdmin, async (req, res) => {
    try {
      const session = req.session as any;
      
      const pageTypeValidation = pageTypeEnum.safeParse(req.params.pageType);
      
      if (!pageTypeValidation.success) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      const pageType = pageTypeValidation.data as PageType;

      // Prepare headers for external API
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Forward authentication token from session
      const token = session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Proxy to external API
      const response = await fetch(`${BASE_URL}/content/${pageType}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error(`Error updating ${req.params.pageType} content:`, error.message || error);
      res.status(500).json({
        success: false,
        message: `Failed to update ${req.params.pageType} content. Please try again.`,
        error: error.message,
      });
    }
  });

  // Reset page content to defaults (admin endpoint) - /api/admin/content/:pageType/reset
  // Proxies to external API: POST /content/:pageType/reset
  app.post("/api/admin/content/:pageType/reset", requireContentAdmin, async (req, res) => {
    try {
      const session = req.session as any;
      
      const pageTypeValidation = pageTypeEnum.safeParse(req.params.pageType);
      
      if (!pageTypeValidation.success) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      const pageType = pageTypeValidation.data as PageType;

      // Prepare headers for external API
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Forward authentication token from session
      const token = session?.accessToken || 
                   req.headers['x-access-token'] as string || 
                   (req.headers['authorization']?.startsWith('Bearer ') ? 
                     req.headers['authorization'].substring(7) : null);
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Proxy to external API
      const response = await fetch(`${BASE_URL}/content/${pageType}/reset`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error(`Error resetting ${req.params.pageType} content:`, error.message || error);
      res.status(500).json({
        success: false,
        message: `Failed to reset ${req.params.pageType} content. Please try again.`,
        error: error.message,
      });
    }
  });
}
