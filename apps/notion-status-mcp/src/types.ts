export type TransportMode = "stdio" | "http";

export interface AppConfig {
  notionToken: string;
  databaseId: string;
  apiKey?: string;
  host: string;
  port: number;
  corsOrigin: string;
  transport: TransportMode;
}

export interface QueryStatusCountsArgs {
  filter_status?: string[];
}

export interface NotionPageLike {
  id: string;
  last_edited_time: string;
  properties: Record<string, NotionPropertyLike>;
}

export type NotionPropertyLike =
  | { type: "status"; status: { name: string } | null }
  | { type: "select"; select: { name: string } | null }
  | { type: "multi_select"; multi_select: Array<{ name: string }> }
  | { type: string; [key: string]: unknown };

export interface DataSourceMetadata {
  id: string;
  title: string;
  lastEditedTime: string;
}

export interface StatusCountsResult {
  [key: string]: unknown;
  total: number;
  counts_by_status: Record<string, number>;
  database_title: string;
  last_updated: string;
}
