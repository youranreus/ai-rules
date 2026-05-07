import { APIErrorCode, Client, isFullPage, isNotionClientError } from "@notionhq/client";

import type { AddMessageResult, DataSourceMetadata, NotionPageLike } from "../types.js";

function richTextToPlainText(items: Array<{ plain_text: string }>): string {
  return items.map((item) => item.plain_text).join("").trim();
}

export function extractDatabaseId(input: string): string {
  const compactIdMatch = input.match(/[0-9a-f]{32}/i);

  if (compactIdMatch) {
    return compactIdMatch[0];
  }

  const uuidMatch = input.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );

  if (uuidMatch) {
    return uuidMatch[0].replaceAll("-", "");
  }

  throw new Error("无法从 WORKING_DATABASE_ID 中解析 Notion database id。");
}

function toReadableError(error: unknown): Error {
  if (!isNotionClientError(error)) {
    return error instanceof Error ? error : new Error("Unknown Notion error");
  }

  switch (error.code) {
    case APIErrorCode.ObjectNotFound:
      return new Error("Notion database id 不存在，或当前集成没有访问权限。");
    case APIErrorCode.Unauthorized:
      return new Error("NOTION_TOKEN 无效或已失效。");
    case APIErrorCode.RestrictedResource:
      return new Error("当前 Notion 集成没有该数据库的读取权限。");
    case APIErrorCode.RateLimited:
      return new Error("Notion API 触发限流，请稍后重试。");
    default:
      return new Error(`Notion API error: ${error.message}`);
  }
}

export class NotionStatusClient {
  private readonly client: Client;
  private readonly dataSourceIdCache = new Map<string, string>();

  constructor(auth: string) {
    this.client = new Client({ auth });
  }

  async resolvePrimaryDataSourceId(databaseIdOrUrl: string): Promise<string> {
    const databaseId = extractDatabaseId(databaseIdOrUrl);
    const cached = this.dataSourceIdCache.get(databaseId);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.client.databases.retrieve({
        database_id: databaseId,
      });

      if (!("data_sources" in response) || response.data_sources.length === 0) {
        throw new Error("Notion database 没有关联的 data source。");
      }

      const dataSourceId = response.data_sources[0]?.id;

      if (!dataSourceId) {
        throw new Error("无法从 Notion database 中读取 data source id。");
      }

      this.dataSourceIdCache.set(databaseId, dataSourceId);

      return dataSourceId;
    } catch (error) {
      throw toReadableError(error);
    }
  }

  async getDataSourceMetadata(dataSourceId: string): Promise<DataSourceMetadata> {
    try {
      const response = await this.client.dataSources.retrieve({
        data_source_id: dataSourceId,
      });

      if (!("title" in response)) {
        throw new Error("Notion data source metadata is incomplete.");
      }

      return {
        id: response.id,
        title: richTextToPlainText(response.title) || "Untitled",
        lastEditedTime: response.last_edited_time,
      };
    } catch (error) {
      throw toReadableError(error);
    }
  }

  async listPages(dataSourceId: string): Promise<NotionPageLike[]> {
    try {
      const results: NotionPageLike[] = [];
      let nextCursor: string | undefined;

      while (true) {
        const response = await this.client.dataSources.query({
          data_source_id: dataSourceId,
          page_size: 100,
          start_cursor: nextCursor,
        });

        for (const item of response.results) {
          if (!isFullPage(item)) {
            continue;
          }

          results.push({
            id: item.id,
            last_edited_time: item.last_edited_time,
            properties: item.properties,
          });
        }

        if (!response.has_more || !response.next_cursor) {
          break;
        }

        nextCursor = response.next_cursor;
      }

      return results;
    } catch (error) {
      throw toReadableError(error);
    }
  }

  async createMessagePage(
    databaseIdOrUrl: string,
    title: string,
    username: string,
    content: string,
    icon?: string,
  ): Promise<AddMessageResult> {
    const databaseId = extractDatabaseId(databaseIdOrUrl);

    try {
      const page = await this.client.pages.create({
        parent: {
          type: "database_id",
          database_id: databaseId,
        },
        ...(icon ? { icon: { type: "emoji", emoji: icon } } : {}),
        properties: {
          标题: {
            rich_text: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
          用户名: {
            title: [
              {
                text: {
                  content: username,
                },
              },
            ],
          },
          留言内容: {
            rich_text: [
              {
                text: {
                  content,
                },
              },
            ],
          },
          留言时间: {
            date: {
              start: new Date().toISOString(),
            },
          },
          完成状态: {
            status: {
              name: "未开始",
            },
          },
        },
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: { content },
                },
              ],
            },
          },
        ],
      });

      return {
        page_id: page.id,
        title,
        username,
        created_time:
          "created_time" in page ? page.created_time : new Date().toISOString(),
        status: "未开始",
        icon,
      };
    } catch (error) {
      throw toReadableError(error);
    }
  }
}
