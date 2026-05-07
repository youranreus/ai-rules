import { z } from "zod";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { extractDatabaseId, NotionStatusClient } from "../notion/client.js";
import type { AddMessageArgs } from "../types.js";

function formatSummary(
  pageId: string,
  title: string,
  username: string,
  createdTime: string,
  status: string,
  icon?: string,
): string {
  const lines = [
    `留言已创建`,
    `页面 ID：${pageId}`,
    `标题：${title}`,
    `用户名：${username}`,
    `创建时间：${createdTime}`,
    `完成状态：${status}`,
  ];

  if (icon) {
    lines.push(`页面图标：${icon}`);
  }

  return lines.join("\n");
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
        title: z.string().describe("留言标题，由模型自动生成简短概括"),
        username: z.string().describe("留言用户名"),
        content: z.string().describe("留言内容"),
        icon: z.string().optional().describe("页面图标emoji，由模型根据内容自动选择，可为空"),
      },
      outputSchema: {
        page_id: z.string(),
        title: z.string(),
        username: z.string(),
        created_time: z.string(),
        status: z.string(),
        icon: z.string().optional(),
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
        input.title,
        input.username,
        input.content,
        input.icon,
      );

      return {
        content: [
          {
            type: "text",
            text: formatSummary(
              structuredContent.page_id,
              structuredContent.title,
              structuredContent.username,
              structuredContent.created_time,
              structuredContent.status,
              structuredContent.icon,
            ),
          },
        ],
        structuredContent,
      };
    },
  );
}
