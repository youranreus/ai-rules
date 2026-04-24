# Frontend Code Helper

`frontend-code-helper` is a shared plugin package for `Cursor`, `Codex`, `CodeBuddy`, and `Claude Code`. It keeps one source of truth for skills and ships per-ecosystem manifests so the same plugin directory can be reused across all four tools.

## Included Skills

- `frontend-practice`: 前端基础实践指南，强调单一职责、类型拆分、常量提取和工具选型。
- `vue-component`: 指导构建 Vue 3 SFC 组件，采用分层目录与明确的脚本、模板、样式组织方式。
- `vue-hooks`: 指导构建 Vue 3 组件 hooks，强调状态、业务逻辑、生命周期和返回区的稳定结构。
- `vue-store-composition`: 指导在 Vue 3 + Pinia 中按 composition 拆分和组合 store。
- `stock-report`: 生成 A 股市场每日复盘与明日策略报告。

## Repository Layout

All runtime plugin assets live under this directory:

```txt
plugins/frontend-code-helper/
├── .claude-plugin/plugin.json
├── .codebuddy-plugin/plugin.json
├── .codex-plugin/plugin.json
├── .cursor-plugin/plugin.json
├── skills/
├── CHANGELOG.md
└── README.md
```

New skills must be added under `plugins/frontend-code-helper/skills/`. Do not add new runtime skills to the repository root.

## Ecosystem Entry Points

### Cursor

- Marketplace: `.cursor-plugin/marketplace.json` at repository root
- Plugin manifest: `plugins/frontend-code-helper/.cursor-plugin/plugin.json`

### Codex

- Marketplace: `.agents/plugins/marketplace.json` at repository root
- Plugin manifest: `plugins/frontend-code-helper/.codex-plugin/plugin.json`

### CodeBuddy

- Marketplace: `.codebuddy-plugin/marketplace.json` at repository root
- Plugin manifest: `plugins/frontend-code-helper/.codebuddy-plugin/plugin.json`

### Claude Code

- Marketplace: `.claude-plugin/marketplace.json` at repository root
- Plugin manifest: `plugins/frontend-code-helper/.claude-plugin/plugin.json`

## Local Development

Keep the plugin directory at:

```txt
plugins/frontend-code-helper
```

The same `skills/` directory is shared by all supported ecosystems.

## Claude Code

For local development, load the plugin directly from this repository:

```bash
claude --plugin-dir ./plugins/frontend-code-helper
```

After Claude Code starts, the skills are available with namespaced commands such as:

```txt
/frontend-code-helper:vue-component
/frontend-code-helper:vue-hooks
/frontend-code-helper:frontend-practice
```

## CodeBuddy

For local marketplace testing, add the repository root or the marketplace file:

```bash
/plugin marketplace add .
/plugin marketplace add ./.codebuddy-plugin/marketplace.json
```

## Release Notes

- Stable releases start at `1.0.0`.
- Follow semantic versioning for every published update.
- Update manifests, marketplace files, and `CHANGELOG.md` whenever distribution metadata changes.
