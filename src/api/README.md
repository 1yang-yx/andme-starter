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

## 快速上手

### 基础用法

```ts
import { request, setBaseURL } from '@/api/request'

// 在 app 启动时设置 baseURL(通常写在 main.ts)
setBaseURL('https://api.example.com')

// GET 请求
const user = await request.get<User>('/user/profile')

// POST 请求
const result = await request.post<CreateResult>('/user/create', {
  name: 'Alice',
  email: 'a@example.com'
})
```

### 错误处理

所有错误都通过 `try/catch` 捕获,`err` 是 `RequestError` 实例:

```ts
import { request } from '@/api/request'
import { RequestError } from '@/api/request.types'

try {
  const data = await request.get<User>('/user/profile')
} catch (err) {
  if (err instanceof RequestError) {
    switch (err.type) {
      case 'network':
      case 'timeout':
        uni.showToast({ title: '网络异常,请重试', icon: 'none' })
        break
      case 'http':
        uni.showToast({ title: '服务器异常', icon: 'none' })
        break
      case 'business':
        uni.showToast({ title: err.message, icon: 'none' })
        break
    }
  }
}
```

### 自定义拦截器

```ts
import { requestInterceptors } from '@/api/request'

// 给每个请求注入 token
requestInterceptors.use((config) => {
  const token = uni.getStorageSync('token')
  if (token) {
    config.header = { ...config.header, Authorization: `Bearer ${token}` }
  }
  return config
})
```

### 约定

- 后端默认返回 `{ code, data, message }` 结构,响应拦截器自动拆包为 `data`
- `code === 0` 视为成功,其他视为业务错误(可用 `setSuccessCode` 修改)
- 业务代码拿到的返回值就是 `data` 字段本身,**不需要再写 `.data`**

完整示例见 [example.ts](./example.ts)。
