import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import { type Server } from "http";

/** Resolve packages from marketplace-app/admin-app (cwd), not shared-backend/node_modules. */
function appRequire<T = unknown>(specifier: string): T {
  return createRequire(path.join(process.cwd(), "package.json"))(
    specifier,
  ) as T;
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = appRequire<{
    createServer: (opts: Record<string, unknown>) => Promise<{
      middlewares: Express["request handler"] extends infer H ? H : unknown;
      transformIndexHtml: (url: string, template: string) => Promise<string>;
      ssrFixStacktrace: (e: Error) => void;
    }>;
    createLogger: () => {
      info: (msg: string, options?: { timestamp?: boolean }) => void;
      warn: (msg: string, options?: { timestamp?: boolean }) => void;
      error: (msg: string, options?: unknown) => void;
    };
  }>("vite");
  const { nanoid } = appRequire<{ nanoid: (size?: number) => string }>("nanoid");

  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const clientRoot = path.resolve(process.cwd(), "client");
  console.log("[Vite] Using client root:", clientRoot);

  const appRoot = process.cwd();
  const viteConfigPath = path.resolve(appRoot, "vite.config.ts");

  const vite = await createViteServer({
    root: clientRoot,
    configFile: viteConfigPath,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use((_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
