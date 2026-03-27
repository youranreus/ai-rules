# ai-rules

这是一个用于沉淀和分发 AI 编码助手能力的仓库，当前重点提供 `frontend-code-helper` 插件。该插件把前端相关的技能规则统一打包为一个共享内容源，同时适配 Codex 和 Claude Code。

## 仓库作用

本仓库主要用于：

- 维护可复用的 AI 技能内容，例如 Vue 组件规范、hooks 编写规范、Pinia store 拆分规范等。
- 以插件方式分发这些技能，减少不同工具之间的重复维护。
- 作为本地开发、测试、发布的统一源码仓库。

当前已经完成的插件：

- `frontend-code-helper`

## 当前目录结构

仓库当前的核心结构如下：

```txt
.
├── .agents/plugins/marketplace.json
├── .claude-plugin/marketplace.json
├── plugins/
│   └── frontend-code-helper/
│       ├── .claude-plugin/plugin.json
│       ├── .codex-plugin/plugin.json
│       ├── CHANGELOG.md
│       ├── README.md
│       └── skills/
└── .cursor/rules/user-rules.md
```

说明：

- `plugins/frontend-code-helper/` 是插件的唯一运行时根目录。
- `skills/` 内容只保留一份，供 Codex 和 Claude Code 共用。
- `.agents/plugins/marketplace.json` 是 Codex 侧的本地 marketplace 入口。
- `.claude-plugin/marketplace.json` 是 Claude Code 侧的本地 marketplace 入口。

## 插件包含的技能

`frontend-code-helper` 当前包含以下技能：

- `frontend-practice`：前端基础实践指南。
- `vue-component`：指导构建 Vue 3 SFC 组件。
- `vue-hooks`：指导构建 Vue 3 组件 hooks。
- `vue-store-composition`：指导在 Vue 3 + Pinia 中拆分和组合 store。
- `stock-report`：生成 A 股市场每日复盘与明日策略报告。

## 如何在 Codex 中使用

### 1. 仓库内开发使用

本仓库已经提供 Codex marketplace 文件：

- [`.agents/plugins/marketplace.json`](/Users/asherliao/Projects/ai-rules/.agents/plugins/marketplace.json)

插件目录为：

- [`plugins/frontend-code-helper`](/Users/asherliao/Projects/ai-rules/plugins/frontend-code-helper)

如果你的 Codex 环境支持读取当前仓库的 marketplace，就可以直接发现这个插件。

### 2. 用户级安装

如果希望在多个项目中复用，推荐把插件目录复制或软链接到用户目录，例如：

```bash
mkdir -p ~/plugins
ln -s /Users/asherliao/Projects/ai-rules/plugins/frontend-code-helper ~/plugins/frontend-code-helper
```

然后在用户级 marketplace 中注册：

```json
{
  "name": "my-plugins",
  "interface": {
    "displayName": "My Plugins"
  },
  "plugins": [
    {
      "name": "frontend-code-helper",
      "source": {
        "source": "local",
        "path": "./plugins/frontend-code-helper"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Developer Tools"
    }
  ]
}
```

## 如何在 Claude Code 中使用

### 1. 本地开发加载

在仓库根目录执行：

```bash
claude --plugin-dir ./plugins/frontend-code-helper
```

启动后，可以通过 namespaced skill 调用，例如：

```txt
/frontend-code-helper:vue-component
/frontend-code-helper:vue-hooks
/frontend-code-helper:frontend-practice
```

### 2. 校验插件

可以使用 Claude Code 自带的校验命令：

```bash
claude plugin validate plugins/frontend-code-helper
claude plugin validate .claude-plugin/marketplace.json
```

### 3. 通过 marketplace 安装

本仓库已经包含 Claude Code 的 marketplace 清单：

- [`.claude-plugin/marketplace.json`](/Users/asherliao/Projects/ai-rules/.claude-plugin/marketplace.json)

发布后可通过官方命令安装：

```bash
claude plugin install frontend-code-helper@<marketplace> --scope user
claude plugin install frontend-code-helper@<marketplace> --scope project
claude plugin install frontend-code-helper@<marketplace> --scope local
```

## 开发与维护约定

为了保持双端兼容，请遵守以下约束：

- 新增技能时，只往 `plugins/frontend-code-helper/skills/` 下添加。
- 不要再恢复仓库根目录旧的 `skills/` 运行时结构。
- 每个 skill 目录保持 `skills/<skill-id>/SKILL.md` 形式。
- `SKILL.md` 的 `name` 应与目录名一致。
- 修改技能内容后，记得同步更新插件版本和 `CHANGELOG.md`。

## 相关文件

- 插件说明：[plugins/frontend-code-helper/README.md](/Users/asherliao/Projects/ai-rules/plugins/frontend-code-helper/README.md)
- 插件变更记录：[plugins/frontend-code-helper/CHANGELOG.md](/Users/asherliao/Projects/ai-rules/plugins/frontend-code-helper/CHANGELOG.md)
- Codex marketplace：[.agents/plugins/marketplace.json](/Users/asherliao/Projects/ai-rules/.agents/plugins/marketplace.json)
- Claude marketplace：[.claude-plugin/marketplace.json](/Users/asherliao/Projects/ai-rules/.claude-plugin/marketplace.json)

## 版本策略

- 当前插件首个稳定版本为 `1.0.0`。
- 后续遵循语义化版本管理。
- 如果插件结构、skill 命名或安装方式发生不兼容变更，应提升主版本号。
