---
name: vue-store-composition
description: 指导在 Vue3 + Pinia 项目中按 composition 拆分和组合 store。用于用户提到 store 编写、store 重构、Pinia 模块化、composite 目录。
---

# Vue Store Composition

## 目标

为 Pinia store 提供稳定的组合式分层规范：

- `index.ts` 只做组合与导出，不承载具体业务细节。
- 具体业务能力放到 `composite/` 下的 composition 函数中。
- 每个 composition 的内部组织参考 `vue-hooks`：状态定义区 -> 业务逻辑区 -> 生命周期或初始化区 -> 返回区。

## 触发场景

当用户提到以下内容时优先应用本技能：

- store 设计、store 重构、Pinia 模块化
- `useAdminStore`、`composite` 目录、子服务拆分
- “把业务逻辑从 store 主文件拆出去”
- “给 store 增加新功能但保持可维护”

## 目录约定

默认以单个 store 目录为单位组织：

```txt
useXxxStore/
├── index.ts
└── composite/
    ├── useXxxFooService.ts
    └── useXxxBarService.ts
```

约束：

1. `index.ts` 只实例化与组合子模块，返回聚合对象。
2. `composite/` 中一个文件只负责一个明确业务领域，例如列表、表单、权限、统计等。
3. 命名统一为 `use<StoreName><Domain>Service`。

## 编写流程

按以下步骤执行并在输出中体现：

1. 明确业务边界，把需求拆成 1 到 N 个独立子领域。
2. 先写 `composite`，每个子领域一个 composition。
3. 再写 `index.ts`，组合各 composition 并统一导出。
4. 最后自检，确认接口清晰且避免跨模块状态污染。

## 单个 Composition 结构

优先参考 `vue-hooks` skill，其次参考以下结构。每个 composition 按固定顺序组织：

1. 状态定义区
   使用 `ref` 或 `reactive` 定义内部状态。
   对外优先返回 `computed` 或 `readonly` 状态，避免外部直接改写。
   复杂结构提取到类型文件，例如 `types.ts`。
2. 业务逻辑区
   所有状态变更通过显式 action 函数完成。
   API 请求、参数组装、错误处理集中在此区域。
   与当前模块无关的纯工具函数提取到 `utils`，不要塞进 composition。
3. 生命周期或初始化区
   只做组合调用，例如 `init`、`resetAndFetch`，避免堆叠复杂分支。
   若需要初始化加载，提供清晰入口函数，例如 `initialize` 或 `refresh`。
4. 返回区
   按“状态 -> 派生状态 -> 行为函数”顺序导出。
   导出面保持最小必要，避免泄漏内部细节。

## `index.ts` 组合规范

`index.ts` 仅做聚合，不实现业务细节：

```ts
import { defineStore } from 'pinia'
import { useAdminPostListService } from './composite/useAdminPostListService'

export const useAdminStore = defineStore('admin', () => {
  const postListService = useAdminPostListService()

  return {
    postListService,
  }
})
```

要求：

- 不在 `index.ts` 里写具体查询参数处理、接口调用、分页逻辑。
- 新增业务时优先新增 composition，而不是持续膨胀 `index.ts`。

## Composition 模板

```ts
import { computed, ref, readonly } from 'vue'

/**
 * Xxx 子模块
 * 说明：一句话描述职责边界与主要流程
 */
export function useXxxService() {
  // 1) 状态定义区
  const query = ref({ page: 1, limit: 10 })
  const loading = ref(false)
  const data = ref<string[]>([])

  const list = computed(() => data.value)

  const setQuery = (patch: Partial<{ page: number; limit: number }>) => {
    query.value = { ...query.value, ...patch }
  }

  // 2) 业务逻辑区
  const refresh = async (): Promise<void> => {
    loading.value = true
    try {
      // 请求逻辑
    } finally {
      loading.value = false
    }
  }

  // 3) 生命周期/初始化区
  const initialize = async (): Promise<void> => {
    await refresh()
  }

  // 4) 返回区
  return {
    query: readonly(query),
    loading: readonly(loading),
    list,
    setQuery,
    refresh,
    initialize,
  }
}
```

## 质量检查清单

- [ ] `index.ts` 只做组合，无业务细节
- [ ] 每个 composition 职责单一，文件名语义清晰
- [ ] composition 内部结构符合：状态 -> 业务 -> 生命周期 -> 返回
- [ ] 状态修改经由 action，不暴露可变内部状态
- [ ] 函数有 JSDoc，且说明边界与流程
- [ ] 异步统一使用 `async/await`，避免混用 `.then()`
