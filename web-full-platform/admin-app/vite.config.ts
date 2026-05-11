import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Compatible with older Node.js versions
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine zod location: check local node_modules first, then root
import { existsSync } from 'fs';
const localZodPath = path.resolve(__dirname, "node_modules/zod");
const rootZodPath = path.resolve(__dirname, "../node_modules/zod");
const zodPath = existsSync(localZodPath) ? localZodPath : rootZodPath;

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "../shared-backend/shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
      // Smart zod resolution: works in both Replit (root) and production (local)
      "zod": zodPath,
    },
    // Ensure dependencies are resolved from app's node_modules
    preserveSymlinks: false,
  },
  optimizeDeps: {
    // Pre-bundle zod so it's available when importing from @shared
    include: ['zod'],
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    allowedHosts: true,
    fs: {
      strict: true,
      allow: [
        path.resolve(__dirname, "client"),
        path.resolve(__dirname, "../shared-backend"),
        path.resolve(__dirname, "../attached_assets"),
        path.resolve(__dirname, "../node_modules"),
      ],
      deny: ["**/.*"],
    },
  },
});
