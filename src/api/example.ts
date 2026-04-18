/**
 * request 封装使用示例
 *
 * 本文件演示 src/api/request.ts 的典型用法,同时作为"活文档"。
 * 请求的是 httpbin.org 的公开 echo 服务,不依赖本地后端。
 *
 * 生产环境中,业务代码应该:
 * 1. 在 app 启动时调用 setBaseURL 指向真实后端
 * 2. 将 api 调用按模块组织到 src/api/modules/ 下,不直接在页面里调 request
 * 3. 定义业务数据类型(如 User、Article),通过泛型 T 获得类型提示
 *
 * @module api/example
 */

import { request, setBaseURL } from './request'
import type { ApiResponse } from '@/types/api'

// ============================================================
// 初始化(真实项目应在 main.ts 调用,这里仅作演示)
// ============================================================

/**
 * 初始化 request,指向 httpbin.org 作为测试服务。
 *
 * httpbin.org/anything 会把你发送的请求原样返回,
 * 非常适合验证请求封装是否工作正常,不需要自己搭后端。
 */
export function initRequestForDemo(): void {
  setBaseURL('https://httpbin.org')
}

// ============================================================
// 示例 1:GET 请求
// ============================================================

/** httpbin.org 的 /anything echo 接口返回的结构(部分字段) */
interface HttpbinEcho {
  url: string
  method: string
  args: Record<string, string>
  headers: Record<string, string>
  data?: string
  json?: unknown
}

/**
 * 示例 1:发送一个带 query 参数的 GET 请求。
 *
 * 注意:httpbin.org 不遵循 ApiResponse 约定(没有 code/data/message),
 * 所以默认响应拦截器会"原样返回"(见 request.ts 里的兜底逻辑)。
 * 真实后端如果遵循 ApiResponse 约定,返回值会被自动拆包为 data 字段。
 */
export async function exampleGet(): Promise<HttpbinEcho> {
  initRequestForDemo()
  const result = await request.get<HttpbinEcho>('/anything', {
    keyword: 'hello',
    page: 1
  })
  return result
}

// ============================================================
// 示例 2:POST 请求(JSON body)
// ============================================================

interface CreateUserParams {
  name: string
  email: string
}

/**
 * 示例 2:POST 一个 JSON body。
 *
 * 真实后端场景:提交表单、创建资源。
 */
export async function examplePost(): Promise<HttpbinEcho> {
  initRequestForDemo()
  const params: CreateUserParams = { name: 'Alice', email: 'a@example.com' }
  const result = await request.post<HttpbinEcho>('/anything', params)
  return result
}

// ============================================================
// 示例 3:错误处理
// ============================================================

/**
 * 示例 3:演示错误的 try/catch 处理方式。
 *
 * /status/500 会返回 HTTP 500,request 会抛出 type='http' 的 RequestError。
 * 业务代码应该用 try/catch 捕获并做相应处理。
 */
export async function exampleError(): Promise<void> {
  initRequestForDemo()
  try {
    await request.get('/status/500')
  } catch (err) {
    // 真实业务中,这里应判断 err.type 做不同处理:
    // - 'network' / 'timeout': 提示"网络异常"
    // - 'http': 提示"服务器异常"
    // - 'business': 用 err.message 显示后端文案
    console.error('[request demo] got error:', err)
  }
}

// ============================================================
// 示例 4:配合 ApiResponse 的真实后端用法(说明性代码,不可执行)
// ============================================================

/**
 * 示例 4:真实后端场景。
 *
 * 如果后端返回 { code: 0, data: {...}, message: 'ok' },
 * 默认响应拦截器会自动拆包,request.get 直接得到 data 字段。
 *
 * 这段代码假设后端约定,仅作为类型推导的演示,不在本文件运行。
 */
interface User {
  id: number
  name: string
  avatar: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _realBackendDemo(): Promise<void> {
  // 注意返回类型是 User 而不是 ApiResponse<User>
  // 因为响应拦截器已经拆过包了
  const user = await request.get<User>('/user/profile')
  console.log(user.name) // 有完整类型提示

  // 如果业务需要拿到原始包络(极少数场景):
  const raw = await request.get<ApiResponse<User>>('/user/profile', undefined, {
    skipResponseInterceptor: true
  })
  console.log(raw.code, raw.data, raw.message)
}
