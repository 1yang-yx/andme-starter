# src/components

跨页面复用的共享组件。

## 放什么

- 多个页面都会用到的组件(如 AmEmpty、AmLoading、AmErrorRetry)
- 无业务耦合的通用 UI 组件

## 不放什么

- 只在单个页面使用的组件 —— 放到 src/pages/xxx/components/(就近原则)
- 三方 UI 库 —— 装依赖,不复制到这里

## 命名约定

- 组件目录用 PascalCase(如 AmEmpty/)
- 组件文件用 index.vue 作为入口
- 前缀 Am 避免与三方库冲突
