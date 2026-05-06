# notion-status-mcp

一个聚焦 Notion 工作状态统计的 MCP Server。

当前实现为 P0 MVP，包含：

- `query_status_counts`
- Notion 分页读取
- `stdio` 传输
- HTTP `/mcp` 与 `/health`
- HTTP `/mcp` 简易 API Key 鉴权

## 目录

```txt
apps/notion-status-mcp/
├── src/
├── test/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 环境变量

```bash
NOTION_TOKEN=ntn_xxx
DEFAULT_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_KEY=
PORT=3000
CORS_ORIGIN=*
```

说明：

- `NOTION_TOKEN` 必填。
- `DEFAULT_DATABASE_ID` 必填，当前 Notion SDK 使用 `data source` API，因此这里实际应填对应 data source id。
- `API_KEY` 必填，HTTP `/mcp` 请求需通过 `Authorization: Bearer <API_KEY>` 或 `x-api-key` 传入。
- `PORT` 仅在 `http` 模式下生效。
- `CORS_ORIGIN` 默认 `*`。

## 初始化

生成 `.env` 并自动填充随机 `API_KEY`：

```bash
pnpm run init
```

脚本会先检查 `.env` 是否存在；如果不存在，会复制 `.env.example` 到 `.env`。当 `API_KEY` 缺失或为空时，会写入新的随机 key；如果已有非空 `API_KEY`，会保持不变。

## 运行

安装依赖：

```bash
pnpm install --registry https://registry.npmjs.org
```

stdio 模式：

```bash
NOTION_TOKEN=ntn_xxx DEFAULT_DATABASE_ID=xxx pnpm start -- --transport stdio
```

HTTP 模式：

```bash
pnpm start -- --transport http --port 3000
```

健康检查：

```bash
curl http://127.0.0.1:3000/health
```

MCP HTTP 请求需要鉴权：

```bash
curl -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Tool

### `query_status_counts`

输入：

```json
{
  "filter_status": ["处理中", "待处理"]
}
```

输出：

```json
{
  "total": 25,
  "counts_by_status": {
    "处理中": 5,
    "待处理": 3
  },
  "database_title": "工作需求管理",
  "last_updated": "2026-05-06T10:30:00.000Z"
}
```

说明：

- `query_status_counts` 不接收 `database_id`，固定读取环境变量 `DEFAULT_DATABASE_ID`。
- `query_status_counts` 不接收 `status_property`，固定统计 `完成情况` 属性列。
- `完成情况` 支持 `status`、`select`、`multi_select`。
- 空值会统计为 `未设置`。

## 开发

```bash
pnpm test
pnpm build
```

## 暂未实现

- `query_filtered_count`
- `get_database_schema`
- 旧版 SSE 兼容
- Docker 部署
