import { z } from "zod";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { extractDatabaseId, NotionStatusClient } from "../notion/client.js";
import type { AddMessageArgs } from "../types.js";

function formatSummary(pageId: string, username: string, createdTime: string, status: string): string {
  return [
    `留言已创建`,
    `页面 ID：${pageId}`,
    `用户名：${username}`,
    `创建时间：${createdTime}`,
    `完成状态：${status}`,
  ].join("\n");
}

export function registerAddMessageTool(
  server: McpServer,
  notionClient: NotionStatusClient,
  databaseId: string,
): void {
  server.registerTool(
    "add_message",
    {
      description: "向留言数据库添加一条留言",
      inputSchema: {
        username: z.string().describe("留言用户名"),
        content: z.string().describe("留言内容"),
      },
      outputSchema: {
        page_id: z.string(),
        username: z.string(),
        created_time: z.string(),
        status: z.string(),
      },
      annotations: {
        readOnlyHint: false,
      },
    },
    async (args) => {
      const input = args as AddMessageArgs;
      const resolvedDatabaseId = extractDatabaseId(databaseId);
      const structuredContent = await notionClient.createMessagePage(
        resolvedDatabaseId,
        input.username,
        input.content,
      );

      return {
        content: [
          {
            type: "text",
            text: formatSummary(
              structuredContent.page_id,
              structuredContent.username,
              structuredContent.created_time,
              structuredContent.status,
            ),
          },
        ],
        structuredContent,
      };
    },
  );
}
