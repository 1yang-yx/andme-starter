# src/api

网络请求相关代码。

## 放什么

- request.ts — uni.request 的统一封装(拦截器、错误处理、类型)
- adapters/ — 后端适配器(Mock / Supabase / 自定义)
- endpoints/ — 按业务模块组织的 API 函数

## 不放什么

- Vue 组件、composables —— 去 components/ 或 composables/
- 纯函数工具(格式化、校验) —— 去 utils/
- 请求返回的类型定义 —— 去 types/(或就近声明)
