import { describe, expect, it } from "vitest";

import { extractDatabaseId } from "../src/notion/client.js";
import { buildStatusCountsResult } from "../src/tools/query-status-counts.js";
import type { DataSourceMetadata, NotionPageLike } from "../src/types.js";

const metadata: DataSourceMetadata = {
  id: "ds-1",
  title: "工作需求管理",
  lastEditedTime: "2026-05-06T09:00:00.000Z",
};

describe("buildStatusCountsResult", () => {
  it("统计 status 属性", () => {
    const pages: NotionPageLike[] = [
      {
        id: "1",
        last_edited_time: "2026-05-06T10:00:00.000Z",
        properties: {
          完成情况: { type: "status", status: { name: "处理中" } },
        },
      },
      {
        id: "2",
        last_edited_time: "2026-05-06T11:00:00.000Z",
        properties: {
          完成情况: { type: "status", status: { name: "完成" } },
        },
      },
      {
        id: "3",
        last_edited_time: "2026-05-06T12:00:00.000Z",
        properties: {
          完成情况: { type: "status", status: null },
        },
      },
    ];

    expect(buildStatusCountsResult(pages, metadata, {})).toEqual({
      total: 3,
      counts_by_status: {
        完成: 1,
      },
      database_title: "工作需求管理",
      last_updated: "2026-05-06T12:00:00.000Z",
    });
  });

  it("支持 multi_select 并按每个选项累计", () => {
    const pages: NotionPageLike[] = [
      {
        id: "1",
        last_edited_time: "2026-05-06T10:00:00.000Z",
        properties: {
          完成情况: {
            type: "multi_select",
            multi_select: [{ name: "处理中" }, { name: "高优先级" }],
          },
        },
      },
      {
        id: "2",
        last_edited_time: "2026-05-06T11:00:00.000Z",
        properties: {
          完成情况: {
            type: "multi_select",
            multi_select: [{ name: "处理中" }],
          },
        },
      },
    ];

    expect(
      buildStatusCountsResult(pages, metadata, {
        filter_status: ["处理中"],
      }),
    ).toEqual({
      total: 2,
      counts_by_status: {
        处理中: 2,
      },
      database_title: "工作需求管理",
      last_updated: "2026-05-06T11:00:00.000Z",
    });
  });

  it("支持 filter_status 并保留 0 计数结果", () => {
    const pages: NotionPageLike[] = [
      {
        id: "1",
        last_edited_time: "2026-05-06T10:00:00.000Z",
        properties: {
          完成情况: { type: "select", select: { name: "处理中" } },
        },
      },
    ];

    expect(
      buildStatusCountsResult(pages, metadata, {
        filter_status: ["处理中", "未开始"],
      }),
    ).toEqual({
      total: 1,
      counts_by_status: {
        处理中: 1,
        未开始: 0,
      },
      database_title: "工作需求管理",
      last_updated: "2026-05-06T10:00:00.000Z",
    });
  });

  it("在属性缺失时抛出明确错误", () => {
    const pages: NotionPageLike[] = [
      {
        id: "1",
        last_edited_time: "2026-05-06T10:00:00.000Z",
        properties: {},
      },
    ];

    expect(() =>
      buildStatusCountsResult(pages, metadata, {}),
    ).toThrow("找不到 `完成情况` 属性列");
  });
});

describe("extractDatabaseId", () => {
  it("支持从 Notion URL 中提取 database id", () => {
    expect(
      extractDatabaseId(
        "https://www.notion.so/youranreus/1f1c440e480543aeae436dbb637c66d9?v=250b55fd890140b3bc354cf454f39e38",
      ),
    ).toBe("1f1c440e480543aeae436dbb637c66d9");
  });

  it("支持 UUID 形式的 database id", () => {
    expect(extractDatabaseId("1f1c440e-4805-43ae-ae43-6dbb637c66d9")).toBe(
      "1f1c440e480543aeae436dbb637c66d9",
    );
  });
});
