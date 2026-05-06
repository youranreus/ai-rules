import cors from "cors";
import express from "express";

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

interface HttpServerOptions {
  port: number;
  corsOrigin: string;
  apiKey: string;
}

function getRequestApiKey(req: express.Request): string | undefined {
  const authorization = req.header("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return req.header("x-api-key") ?? undefined;
}

function requireApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const configuredApiKey = req.app.get("apiKey") as string;

  if (getRequestApiKey(req) === configuredApiKey) {
    next();
    return;
  }

  res.status(401).json({
    jsonrpc: "2.0",
    error: {
      code: -32001,
      message: "Unauthorized.",
    },
    id: null,
  });
}

function sendMethodNotAllowed(res: express.Response): void {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed.",
    },
    id: null,
  });
}

export async function startHttpServer(
  createServer: () => McpServer,
  options: HttpServerOptions,
): Promise<void> {
  const app = createMcpExpressApp();
  app.set("apiKey", options.apiKey);
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: options.corsOrigin,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/mcp", requireApiKey, async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    const cleanup = async (): Promise<void> => {
      await Promise.allSettled([transport.close(), server.close()]);
    };

    res.on("close", () => {
      void cleanup();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      await cleanup();

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", requireApiKey, (_req, res) => {
    sendMethodNotAllowed(res);
  });

  app.delete("/mcp", requireApiKey, (_req, res) => {
    sendMethodNotAllowed(res);
  });

  await new Promise<void>((resolve, reject) => {
    const httpServer = app.listen(options.port, () => {
      resolve();
    });

    httpServer.on("error", reject);
  });
}
