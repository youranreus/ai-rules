import { getConfig } from "./config.js";
import { createServer } from "./server.js";
import { startHttpServer } from "./transports/http.js";
import { startStdioServer } from "./transports/stdio.js";

async function main(): Promise<void> {
  const config = getConfig();

  if (config.transport === "http") {
    if (!config.apiKey) {
      throw new Error("API_KEY is required for HTTP transport. Run `pnpm run init` first.");
    }

    await startHttpServer(
      () => createServer(config.notionToken, config.databaseId, config.messageDatabaseId),
      {
        host: config.host,
        port: config.port,
        corsOrigin: config.corsOrigin,
        apiKey: config.apiKey,
      },
    );
    console.error(`notion-status-mcp listening on http://${config.host}:${config.port}`);
    return;
  }

  const server = createServer(config.notionToken, config.databaseId, config.messageDatabaseId);
  await startStdioServer(server);
  console.error("notion-status-mcp running on stdio");
}

main().catch((error) => {
  console.error("Failed to start notion-status-mcp:", error);
  process.exit(1);
});
