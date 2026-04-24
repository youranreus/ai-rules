# ai-rules

这是一个用于沉淀和分发 AI 编码助手能力的仓库，当前重点提供 `frontend-code-helper` 插件。该插件把前端相关技能统一打包为一个共享内容源，并兼容 `Cursor`、`Codex`、`CodeBuddy` 和 `Claude Code`。

## 仓库作用

本仓库主要用于：

- 维护可复用的 AI 技能内容，例如 Vue 组件规范、hooks 编写规范、Pinia store 拆分规范等。
- 以插件方式分发这些技能，减少不同工具之间的重复维护。
- 作为本地开发、测试、发布的统一源码仓库。

当前插件：

- `frontend-code-helper`

## 当前目录结构

```txt
.
├── .agents/plugins/marketplace.json
├── .claude-plugin/marketplace.json
├── .codebuddy-plugin/marketplace.json
├── .cursor-plugin/marketplace.json
├── .cursor/rules/user-rules.md
├── AGENTS.md
└── plugins/
    └── frontend-code-helper/
        ├── .claude-plugin/plugin.json
        ├── .codebuddy-plugin/plugin.json
        ├── .codex-plugin/plugin.json
        ├── .cursor-plugin/plugin.json
        ├── CHANGELOG.md
        ├── README.md
        └── skills/
```

说明：

- `plugins/frontend-code-helper/` 是唯一插件运行时根目录。
- 技能内容只维护在 `plugins/frontend-code-helper/skills/`。
- 仓库根目录的 `skills/` 不再作为运行时来源。
- `AGENTS.md` 提供跨代理、跨编辑器的通用项目规则。
- `.cursor/rules/user-rules.md` 提供 Cursor 侧的项目规则补充。

## 插件包含的技能

`frontend-code-helper` 当前包含以下技能：

- `frontend-practice`：前端基础实践指南。
- `vue-component`：指导构建 Vue 3 SFC 组件。
- `vue-hooks`：指导构建 Vue 3 组件 hooks。
- `vue-store-composition`：指导在 Vue 3 + Pinia 中拆分和组合 store。
- `stock-report`：生成 A 股市场每日复盘与明日策略报告。

## 各端入口

### Cursor

- 项目规则入口：`AGENTS.md`
- Cursor 规则补充：`.cursor/rules/user-rules.md`
- 仓库级 marketplace：`.cursor-plugin/marketplace.json`
- 插件级 manifest：`plugins/frontend-code-helper/.cursor-plugin/plugin.json`

### Codex

- 仓库级 marketplace：`.agents/plugins/marketplace.json`
- 插件级 manifest：`plugins/frontend-code-helper/.codex-plugin/plugin.json`

### CodeBuddy

- 仓库级 marketplace：`.codebuddy-plugin/marketplace.json`
- 插件级 manifest：`plugins/frontend-code-helper/.codebuddy-plugin/plugin.json`

### Claude Code

- 仓库级 marketplace：`.claude-plugin/marketplace.json`
- 插件级 manifest：`plugins/frontend-code-helper/.claude-plugin/plugin.json`

## 使用方式

### Cursor

如果以项目规则方式使用，打开仓库即可读取 `AGENTS.md` 和 `.cursor/rules/` 下的规则文件。

如果以插件仓库方式分发，使用仓库根的 `.cursor-plugin/marketplace.json`，插件目录保持为 `plugins/frontend-code-helper/`。

### Codex

本仓库已经提供 Codex marketplace 文件：

- `.agents/plugins/marketplace.json`

如果 Codex 环境支持读取当前仓库的 marketplace，就可以直接发现该插件。

### CodeBuddy

本仓库已经提供 CodeBuddy marketplace 文件：

- `.codebuddy-plugin/marketplace.json`

本地开发时，可把仓库根作为 marketplace 路径添加，例如：

```bash
/plugin marketplace add .
```

也可以直接指定 marketplace 文件：

```bash
/plugin marketplace add ./.codebuddy-plugin/marketplace.json
```

### Claude Code

本地开发加载：

```bash
claude --plugin-dir ./plugins/frontend-code-helper
```

启动后，可以通过 namespaced skill 调用，例如：

```txt
/frontend-code-helper:vue-component
/frontend-code-helper:vue-hooks
/frontend-code-helper:frontend-practice
```

校验插件：

```bash
claude plugin validate plugins/frontend-code-helper
claude plugin validate .claude-plugin/marketplace.json
```

## 开发与维护约定

为了保持多端兼容，请遵守以下约束：

- 新增技能时，只往 `plugins/frontend-code-helper/skills/` 下添加。
- 不要恢复仓库根目录旧的 `skills/` 运行时结构。
- 每个 skill 目录保持 `skills/<skill-id>/SKILL.md` 形式。
- `SKILL.md` 的 `name` 应与目录名一致。
- 修改技能内容或分发结构后，检查各端 manifest、README 与 `CHANGELOG.md` 是否仍然一致。

## 相关文件

- 插件说明：`plugins/frontend-code-helper/README.md`
- 插件变更记录：`plugins/frontend-code-helper/CHANGELOG.md`
- Cursor marketplace：`.cursor-plugin/marketplace.json`
- Codex marketplace：`.agents/plugins/marketplace.json`
- CodeBuddy marketplace：`.codebuddy-plugin/marketplace.json`
- Claude marketplace：`.claude-plugin/marketplace.json`

## 版本策略

- 当前稳定版本为 `1.0.0`。
- 后续遵循语义化版本管理。
- 如果插件结构、skill 命名或安装方式发生不兼容变更，应提升主版本号。
