# PRD: Notion 工作状态统计 MCP Server

## 1. 概述

### 1.1 产品名称
`notion-status-mcp` — Notion 工作状态统计 MCP 服务

### 1.2 产品定位
一个基于 MCP (Model Context Protocol) 协议的服务端，对 Notion API 进行再封装，专注于从 Notion 数据库中提取工作需求的状态统计信息。用户通过自然语言即可查询当前工作负载、需求处理进度等关键指标。

### 1.3 目标用户
- 使用 Notion 管理个人工作需求/任务的知识工作者
- 希望通过 AI 助手快速获取工作状态概览的用户

### 1.4 核心价值
- 无需打开 Notion 即可通过 AI 助手获取工作状态
- 提供结构化的统计数据，而非原始数据库内容
- 简化交互，聚焦于"状态统计"这一高频场景

---

## 2. 背景与动机

### 2.1 问题描述
用户在 Notion 中维护了一个工作需求管理数据库，包含多条需求记录及其状态（如"处理中"、"已完成"、"待处理"等）。当前获取状态概览需要：
1. 打开 Notion
2. 切换到对应数据库视图
3. 手动统计各状态的需求数量

这个流程繁琐，尤其在需要频繁检查工作负载时效率低下。

### 2.2 解决方案
通过 MCP Server 封装 Notion API，提供专注于状态统计的工具能力，使 AI 助手可以直接查询并返回结构化的统计结果。

---

## 3. 功能需求

### 3.1 核心功能：数据库状态统计

#### Tool: `query_status_counts`

**描述：** 查询指定 Notion 数据库中，按状态列分组统计的需求数量。

**输入参数：**

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `database_id` | string | 是 | Notion 数据库的 ID |
| `status_property` | string | 否 | 状态属性列名称，默认值为 `"状态"` |
| `filter_status` | string[] | 否 | 仅统计指定状态的数量；为空时统计所有状态 |

**输出：**

```json
{
  "total": 25,
  "counts_by_status": {
    "处理中": 5,
    "已完成": 15,
    "待处理": 3,
    "已搁置": 2
  },
  "database_title": "工作需求管理",
  "last_updated": "2026-05-06T10:30:00Z"
}
```

---

### 3.2 扩展功能：按条件筛选统计

#### Tool: `query_filtered_count`

**描述：** 查询符合特定条件的需求数量（支持多条件组合）。

**输入参数：**

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `database_id` | string | 是 | Notion 数据库的 ID |
| `filters` | object[] | 是 | 筛选条件数组 |
| `filters[].property` | string | 是 | 属性列名称 |
| `filters[].operator` | string | 是 | 操作符：`equals`, `not_equals`, `contains` 等 |
| `filters[].value` | string | 是 | 筛选值 |

**输出：**

```json
{
  "count": 5,
  "filters_applied": [
    { "property": "状态", "operator": "equals", "value": "处理中" }
  ],
  "database_title": "工作需求管理"
}
```

---

### 3.3 辅助功能：获取数据库元信息

#### Tool: `get_database_schema`

**描述：** 获取指定数据库的属性结构，帮助用户了解可用的属性列及其类型/选项。

**输入参数：**

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `database_id` | string | 是 | Notion 数据库的 ID |

**输出：**

```json
{
  "database_title": "工作需求管理",
  "properties": [
    {
      "name": "状态",
      "type": "status",
      "options": ["待处理", "处理中", "已完成", "已搁置"]
    },
    {
      "name": "优先级",
      "type": "select",
      "options": ["P0", "P1", "P2", "P3"]
    },
    {
      "name": "负责人",
      "type": "people",
      "options": null
    }
  ]
}
```

---

## 4. 非功能需求

### 4.1 性能
- 单次查询响应时间 < 3 秒（受 Notion API 速率限制影响）
- 支持数据库最大 10,000 条记录的统计（Notion API 分页处理）

### 4.2 安全性
- Notion Integration Token 通过环境变量传入，不硬编码
- 仅支持读取操作，不提供写入/修改能力
- MCP Server 不缓存敏感数据

### 4.3 可靠性
- 优雅处理 Notion API 错误（rate limit、权限不足、数据库不存在等）
- 返回清晰的错误信息，便于用户排查

### 4.4 兼容性
- 支持 Notion 数据库中 `status`、`select`、`multi_select` 类型的属性列作为分组依据
- 兼容 MCP 协议标准，可被 Claude Code、Claude Desktop 等 MCP 客户端调用
- 同时支持 stdio 和 HTTP 两种传输协议，覆盖本地与远程使用场景

### 4.5 HTTP 模式安全性
- 支持可选的 API Key 鉴权，防止未授权访问
- 支持 CORS 配置，控制浏览器端跨域访问
- HTTP 模式下 Notion Token 仅存于服务端，不暴露给客户端

---

## 5. 技术方案

### 5.1 技术栈
- **运行时：** Node.js (TypeScript)
- **MCP SDK：** `@modelcontextprotocol/sdk`
- **Notion 客户端：** `@notionhq/client`
- **HTTP 框架：** Express（用于 HTTP+SSE 传输）
- **传输协议：** 同时支持 stdio 和 HTTP (Streamable HTTP / SSE)

### 5.2 传输协议设计

本 MCP Server 支持两种传输模式，适配不同使用场景：

#### 5.2.1 stdio 模式（本地直连）
- 适用于 Claude Code、Claude Desktop 等本地 MCP 客户端
- 通过标准输入/输出通信，零网络开销
- 启动方式：`node dist/index.js --transport stdio`

#### 5.2.2 HTTP 模式（远程/网络访问）
- 适用于远程客户端、Web 应用、多客户端共享等场景
- 基于 MCP 的 Streamable HTTP 传输协议
- 提供 HTTP 端点，支持 SSE (Server-Sent Events) 进行服务端推送
- 启动方式：`node dist/index.js --transport http --port 3000`

**HTTP 端点设计：**

| 端点 | 方法 | 描述 |
|------|------|------|
| `/mcp` | POST | MCP JSON-RPC 请求入口（Streamable HTTP） |
| `/sse` | GET | SSE 连接端点（兼容旧版 SSE 传输） |
| `/health` | GET | 健康检查端点 |

**HTTP 模式特性：**
- 支持无状态请求（单次 POST 请求-响应）
- 支持有状态 SSE 流式连接（长连接，服务端主动推送）
- 支持 CORS 配置，便于浏览器端调用
- 可选的 API Key 鉴权（通过 `Authorization: Bearer <token>` 头）

### 5.3 架构图

```
模式 1: stdio（本地）
┌─────────────┐     stdio (JSON-RPC)    ┌──────────────────┐     Notion API     ┌─────────┐
│  AI Client  │ ◄─────────────────────► │ notion-status-mcp │ ◄────────────────► │  Notion │
│ (Claude等)  │                         │     Server        │     (HTTPS)        │   API   │
└─────────────┘                         └──────────────────┘                     └─────────┘

模式 2: HTTP（远程/网络）
┌─────────────┐   HTTP POST / SSE       ┌──────────────────┐     Notion API     ┌─────────┐
│  AI Client  │ ◄─────────────────────► │ notion-status-mcp │ ◄────────────────► │  Notion │
│ (远程客户端) │   (Streamable HTTP)     │   Server (HTTP)   │     (HTTPS)        │   API   │
└─────────────┘                         └──────────────────┘                     └─────────┘

┌─────────────┐   HTTP POST / SSE       ┌──────────────────┐
│  Web App    │ ◄─────────────────────► │ notion-status-mcp │  (多客户端共享同一实例)
│  其他工具   │                         │   Server (HTTP)   │
└─────────────┘                         └──────────────────┘
```

### 5.4 项目结构

```
notion-status-mcp/
├── src/
│   ├── index.ts              # 入口：解析启动参数，选择传输模式
│   ├── server.ts             # MCP Server 核心逻辑（与传输无关）
│   ├── transports/
│   │   ├── stdio.ts          # stdio 传输适配
│   │   └── http.ts           # HTTP + SSE 传输适配（Express）
│   ├── tools/
│   │   ├── query-status-counts.ts
│   │   ├── query-filtered-count.ts
│   │   └── get-database-schema.ts
│   ├── notion/
│   │   └── client.ts         # Notion API 封装
│   └── types.ts              # 类型定义
├── package.json
├── tsconfig.json
├── Dockerfile                # 容器化部署支持
└── README.md
```

### 5.5 配置方式

#### stdio 模式配置（Claude Code / Claude Desktop）

```json
{
  "mcpServers": {
    "notion-status": {
      "command": "node",
      "args": ["path/to/notion-status-mcp/dist/index.js", "--transport", "stdio"],
      "env": {
        "NOTION_TOKEN": "ntn_xxxxxxxxxxxxx",
        "DEFAULT_DATABASE_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

#### HTTP 模式配置（远程 MCP 客户端）

```json
{
  "mcpServers": {
    "notion-status": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key-here"
      }
    }
  }
}
```

#### 环境变量

| 变量名 | 必填 | 描述 |
|--------|------|------|
| `NOTION_TOKEN` | 是 | Notion Integration Token |
| `DEFAULT_DATABASE_ID` | 否 | 默认数据库 ID，省去每次传参 |
| `PORT` | 否 | HTTP 模式监听端口，默认 `3000` |
| `API_KEY` | 否 | HTTP 模式的 API Key 鉴权，为空则不启用鉴权 |
| `CORS_ORIGIN` | 否 | 允许的 CORS 来源，默认 `*` |

### 5.6 部署方式

#### 本地运行（stdio）
```bash
NOTION_TOKEN=ntn_xxx node dist/index.js --transport stdio
```

#### 本地运行（HTTP）
```bash
NOTION_TOKEN=ntn_xxx PORT=3000 node dist/index.js --transport http
```

#### Docker 部署（HTTP，适合长期运行）
```bash
docker build -t notion-status-mcp .
docker run -d \
  -e NOTION_TOKEN=ntn_xxx \
  -e DEFAULT_DATABASE_ID=xxx \
  -e API_KEY=your-secret-key \
  -p 3000:3000 \
  notion-status-mcp
```

---

## 6. 用户交互示例

### 场景 1：查看工作概览
> 用户："我现在有多少个处理中的需求？"
>
> AI 调用 `query_status_counts` → 返回："你当前有 5 个处理中的需求，总共 25 个需求。"

### 场景 2：多维度查询
> 用户："帮我看看 P0 优先级里还有几个没处理完的？"
>
> AI 调用 `query_filtered_count` → 返回："P0 优先级中有 2 个需求仍在处理中。"

### 场景 3：了解数据库结构
> 用户："我的需求数据库有哪些字段？"
>
> AI 调用 `get_database_schema` → 返回数据库的属性列表及可用选项。

### 场景 4：通过 HTTP 远程查询
> 开发者通过 HTTP 客户端测试：
> ```bash
> curl -X POST http://localhost:3000/mcp \
>   -H "Content-Type: application/json" \
>   -H "Authorization: Bearer your-api-key" \
>   -d '{
>     "jsonrpc": "2.0",
>     "id": 1,
>     "method": "tools/call",
>     "params": {
>       "name": "query_status_counts",
>       "arguments": {
>         "database_id": "xxx-xxx-xxx"
>       }
>     }
>   }'
> ```

---

## 7. 里程碑与优先级

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| P0 - MVP | `query_status_counts` 工具实现 | 必须 |
| P0 - MVP | Notion API 客户端封装 & 分页处理 | 必须 |
| P0 - MVP | stdio 传输支持 | 必须 |
| P0 - MVP | HTTP (Streamable HTTP) 传输支持 | 必须 |
| P1 - 增强 | `query_filtered_count` 多条件筛选 | 重要 |
| P1 - 增强 | `get_database_schema` 元信息查询 | 重要 |
| P1 - 增强 | HTTP API Key 鉴权 | 重要 |
| P2 - 优化 | 错误处理与友好提示 | 一般 |
| P2 - 优化 | 支持配置默认 database_id | 一般 |
| P2 - 优化 | Docker 容器化部署 | 一般 |
| P2 - 优化 | 兼容旧版 SSE 传输协议 | 一般 |

---

## 8. 开放问题

1. **是否需要缓存层？** 如果用户频繁查询，是否增加短期缓存（如 30 秒 TTL）减少 Notion API 调用？
2. **是否支持多数据库？** 当前设计支持传入 database_id，是否需要提供"列出所有可访问数据库"的能力？
3. **是否需要 Resource 暴露？** 除了 Tool 之外，是否通过 MCP Resource 协议暴露数据库概览作为持久上下文？

---

## 9. 成功指标

- 用户可通过一句自然语言获取工作状态统计
- 查询响应时间 < 3 秒
- 错误场景有明确的提示信息（如 token 无效、数据库未授权等）
