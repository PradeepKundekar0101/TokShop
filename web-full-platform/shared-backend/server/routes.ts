import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerDashboardRoutes } from "./routes/dashboard";
import { registerOrderRoutes } from "./routes/orders";
import { registerShowRoutes } from "./routes/shows";
import { registerShippingRoutes } from "./routes/shipping";
import { registerBundleRoutes } from "./routes/bundles";
import { registerReportRoutes } from "./routes/reports";
import { registerAuthRoutes } from "./routes/auth";
import { registerProductRoutes } from "./routes/products";
import { registerCategoryRoutes } from "./routes/categories";
import { registerAddressRoutes } from "./routes/addresses";
import { registerPaymentMethodRoutes } from "./routes/payment-methods";
import { registerAdminRoutes } from "./routes/admin";
import { registerSettingsRoutes } from "./routes/settings";
import { registerTemplateRoutes } from "./routes/templates";
import { registerGiveawayRoutes } from "./routes/giveaways";
import { registerStripeRoutes } from "./routes/stripe";
import { registerContentRoutes } from "./routes/content";
import { registerOfferRoutes } from "./routes/offers";
import { registerContactRoutes } from "./routes/contact";
import auctionRoutes from "./routes/auctions";
import { BASE_URL } from "./utils";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuration endpoint - exposes external API URL for Socket.IO connections
  app.get('/api/config', (req, res) => {
    res.json({
      success: true,
      data: {
        externalApiUrl: BASE_URL
      }
    });
  });

  // Register all route modules
  registerContentRoutes(app);
  registerSettingsRoutes(app);
  registerTemplateRoutes(app);
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerStripeRoutes(app);
  registerCategoryRoutes(app);
  registerProductRoutes(app);
  registerAddressRoutes(app);
  registerPaymentMethodRoutes(app);
  registerDashboardRoutes(app);
  registerOrderRoutes(app);
  registerShowRoutes(app);
  registerGiveawayRoutes(app);
  registerShippingRoutes(app);
  registerBundleRoutes(app);
  registerReportRoutes(app);
  registerOfferRoutes(app);
  registerContactRoutes(app);
  app.use('/api/auction', auctionRoutes);

  const httpServer = createServer(app);
  
  return httpServer;
}
