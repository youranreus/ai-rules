import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { NotionStatusClient } from "./notion/client.js";
import { registerQueryStatusCountsTool } from "./tools/query-status-counts.js";

export function createServer(notionToken: string, databaseId: string): McpServer {
  const server = new McpServer({
    name: "notion-status-mcp",
    version: "0.1.0",
  });

  const notionClient = new NotionStatusClient(notionToken);
  registerQueryStatusCountsTool(server, notionClient, databaseId);

  return server;
}
