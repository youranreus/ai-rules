import { z } from "zod";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type {
  DataSourceMetadata,
  NotionPageLike,
  NotionPropertyLike,
  QueryStatusCountsArgs,
  StatusCountsResult,
} from "../types.js";
import { NotionStatusClient } from "../notion/client.js";

const STATUS_PROPERTY = "完成情况";
const EMPTY_STATUS = "未设置";

function getStatusNames(property: NotionPropertyLike | undefined): string[] {
  if (!property) {
    throw new Error("找不到 `完成情况` 属性列，请确认 Notion 数据库结构是否正确。");
  }

  switch (property.type) {
    case "status": {
      const statusProperty = property as { status?: { name?: string } | null };
      return [statusProperty.status?.name ?? EMPTY_STATUS];
    }
    case "select": {
      const selectProperty = property as { select?: { name?: string } | null };
      return [selectProperty.select?.name ?? EMPTY_STATUS];
    }
    case "multi_select": {
      const multiSelectProperty = property as {
        multi_select?: Array<{ name: string }>;
      };
      const values = multiSelectProperty.multi_select ?? [];

      return values.length > 0
        ? values.map((item) => item.name)
        : [EMPTY_STATUS];
    }
    default:
      throw new Error(
        `属性列类型 \`${property.type}\` 不受支持，仅支持 status/select/multi_select。`,
      );
  }
}

function getLastUpdated(
  metadata: DataSourceMetadata,
  pages: NotionPageLike[],
): string {
  const timestamps = [metadata.lastEditedTime, ...pages.map((page) => page.last_edited_time)];

  return timestamps.reduce((latest, current) =>
    new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
  );
}

export function buildStatusCountsResult(
  pages: NotionPageLike[],
  metadata: DataSourceMetadata,
  args: QueryStatusCountsArgs,
): StatusCountsResult {
  const requestedStatuses = args.filter_status?.length
    ? new Set(args.filter_status)
    : null;
  const countsByStatus: Record<string, number> = {};

  if (requestedStatuses) {
    for (const status of requestedStatuses) {
      countsByStatus[status] = 0;
    }
  }

  for (const page of pages) {
    const property = page.properties[STATUS_PROPERTY];
    const statusNames = getStatusNames(property);

    for (const name of statusNames) {
      if (requestedStatuses && !requestedStatuses.has(name)) {
        continue;
      }

      countsByStatus[name] = (countsByStatus[name] ?? 0) + 1;
    }
  }

  return {
    total: pages.length,
    counts_by_status: countsByStatus,
    database_title: metadata.title,
    last_updated: getLastUpdated(metadata, pages),
  };
}

function formatSummary(result: StatusCountsResult): string {
  const parts = Object.entries(result.counts_by_status)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  return [
    `数据库：${result.database_title}`,
    `总数：${result.total}`,
    `状态统计：${parts || "无匹配结果"}`,
    `最后更新时间：${result.last_updated}`,
  ].join("\n");
}

export function registerQueryStatusCountsTool(
  server: McpServer,
  notionClient: NotionStatusClient,
  databaseId: string,
): void {
  server.registerTool(
    "query_status_counts",
    {
      description: "按状态列统计指定 Notion 数据库中的需求数量。",
      inputSchema: {
        filter_status: z
          .array(z.string().min(1))
          .optional()
          .describe("仅统计指定完成情况；为空时统计全部完成情况"),
      },
      outputSchema: {
        total: z.number().int().nonnegative(),
        counts_by_status: z.record(z.string(), z.number().int().nonnegative()),
        database_title: z.string(),
        last_updated: z.string(),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => {
      const [metadata, pages] = await Promise.all([
        notionClient.getDataSourceMetadata(databaseId),
        notionClient.listPages(databaseId),
      ]);

      const structuredContent = buildStatusCountsResult(
        pages,
        metadata,
        args as QueryStatusCountsArgs,
      );

      return {
        content: [
          {
            type: "text",
            text: formatSummary(structuredContent),
          },
        ],
        structuredContent,
      };
    },
  );
}
