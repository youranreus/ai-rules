# ai-rules

## 通用约束

- 使用中文回复，保持简洁明了。
- 前端开发优先使用 TypeScript。
- 包管理器默认使用 `pnpm`，除非目标项目已经存在其他包管理器对应的 lock 文件。

## 仓库结构约定

- 运行时插件根目录是 `plugins/frontend-code-helper/`。
- 共享技能只维护在 `plugins/frontend-code-helper/skills/`。
- 不要把仓库根目录的 `skills/` 恢复为运行时来源。

## 插件维护约定

- 新增 skill 时，使用 `skills/<skill-id>/SKILL.md` 结构。
- `SKILL.md` 中的 `name` 应与目录名保持一致。
- 修改技能内容后，同步检查各端 manifest 与说明文档是否仍然一致。
- 如果发布内容发生变化，更新 `plugins/frontend-code-helper/CHANGELOG.md`。
