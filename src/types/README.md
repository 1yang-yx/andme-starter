# src/types

跨模块共享的 TypeScript 类型定义。

## 放什么

- 业务领域模型(如 User、Recipe、Order)
- 通用 API 响应结构(如 ApiResponse<T>、PageResult<T>)
- 多个文件共享的枚举、联合类型

## 不放什么

- 只在单个文件内使用的类型 —— 就近声明在该文件顶部
- 组件 props 类型 —— 就近声明在组件内
- uni-app / Vue 的框架类型 —— 已由 @dcloudio/types 和 Vue 自带,无需重复
