# Frontend Code Helper

`frontend-code-helper` is a shared plugin package for Codex and Claude Code. It keeps one source of truth for the skills and ships dual manifests so the same plugin directory can be used by both tools.

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
├── .codex-plugin/plugin.json
├── skills/
├── CHANGELOG.md
└── README.md
```

New skills must be added under `plugins/frontend-code-helper/skills/`. Do not add new runtime skills to the repository root.

## Codex

This repository exposes the plugin through the Codex marketplace file at [`.agents/plugins/marketplace.json`](/Users/asherliao/Projects/ai-rules/.agents/plugins/marketplace.json).

For repo-local development, keep the plugin at:

```txt
/Users/asherliao/Projects/ai-rules/plugins/frontend-code-helper
```

For user-level installation in a local Codex environment, copy or symlink the plugin to `~/plugins/frontend-code-helper` and register it in `~/.agents/plugins/marketplace.json` with `./plugins/frontend-code-helper` as the source path.

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

For persistent installation after publishing through a marketplace, use the official CLI:

```bash
claude plugin marketplace add .
claude plugin install frontend-code-helper@<marketplace> --scope user
claude plugin install frontend-code-helper@<marketplace> --scope project
claude plugin install frontend-code-helper@<marketplace> --scope local
```

This repository also includes a Claude marketplace manifest at `.claude-plugin/marketplace.json`, so the repository root can act as a local marketplace during development.

## Release Notes

- Start stable releases at `1.0.0`.
- Follow semantic versioning for every published update.
- Update both plugin manifests and [CHANGELOG.md](/Users/asherliao/Projects/ai-rules/plugins/frontend-code-helper/CHANGELOG.md) whenever skill content changes.
