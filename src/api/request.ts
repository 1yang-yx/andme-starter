/**
 * 统一请求封装
 *
 * 基于 uni.request 的 Promise 化封装,提供拦截器、类型安全和统一错误处理。
 * 这是 HTTP 传输层,不关心数据源切换(v0.2 的适配器层关心)。
 *
 * 设计原则:
 * 1. 业务代码写 const user = await request.get<User>('/user'),不写 .data
 *    (响应拦截器自动拆包 ApiResponse)
 * 2. 错误走 reject,业务用 try/catch,符合 JS 习惯
 * 3. 不耦合 UI(不内置 showToast/showLoading),由调用方或错误拦截器决定
 * 4. 为 v0.2 适配器预留扩展点:baseURL 可配置、拦截器可替换、rawRequest 可用
 *
 * @module api/request
 */

import type {
  ErrorInterceptor,
  RawResponse,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor
} from './request.types'
import { RequestError } from './request.types'
import type { ApiResponse } from '@/types/api'

// ============================================================
// 全局配置
// ============================================================

/** 基础 URL,所有相对路径请求会自动拼接 */
let baseURL = ''

/** 默认超时时间(毫秒) */
let defaultTimeout = 10000

/** 业务成功码,响应拦截器用此判断业务是否成功 */
let successCode: number = 0

/**
 * 设置基础 URL。
 * 通常在 app 启动时调用一次(如 main.ts),或 v0.2 适配器切换时调用。
 */
export function setBaseURL(url: string): void {
  baseURL = url
}

/** 设置默认超时时间(毫秒) */
export function setDefaultTimeout(ms: number): void {
  defaultTimeout = ms
}

/**
 * 设置业务成功码。
 * 默认为 0。如果后端约定 200 为成功,调用 setSuccessCode(200)。
 */
export function setSuccessCode(code: number): void {
  successCode = code
}

// ============================================================
// 拦截器注册中心
// ============================================================

const requestInterceptorList: RequestInterceptor[] = []
const responseInterceptorList: ResponseInterceptor[] = []
const errorInterceptorList: ErrorInterceptor[] = []

/** 请求拦截器管理器。用 .use(fn) 注册 */
export const requestInterceptors = {
  use(fn: RequestInterceptor): void {
    requestInterceptorList.push(fn)
  },
  /** 清空所有拦截器(主要用于测试和适配器切换) */
  clear(): void {
    requestInterceptorList.length = 0
  }
}

/** 响应拦截器管理器 */
export const responseInterceptors = {
  use(fn: ResponseInterceptor): void {
    responseInterceptorList.push(fn)
  },
  clear(): void {
    responseInterceptorList.length = 0
  }
}

/** 错误拦截器管理器 */
export const errorInterceptors = {
  use(fn: ErrorInterceptor): void {
    errorInterceptorList.push(fn)
  },
  clear(): void {
    errorInterceptorList.length = 0
  }
}

// ============================================================
// 内部工具
// ============================================================

/** 把 URL query 参数对象拼到 URL 后面 */
function buildUrl(url: string, params?: Record<string, unknown>): string {
  const fullUrl = /^https?:\/\//.test(url) ? url : `${baseURL}${url}`
  if (!params || Object.keys(params).length === 0) return fullUrl

  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')

  if (!query) return fullUrl
  return fullUrl.includes('?') ? `${fullUrl}&${query}` : `${fullUrl}?${query}`
}

/** 串行执行请求拦截器 */
async function runRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
  let current = config
  for (const fn of requestInterceptorList) {
    current = await fn(current)
  }
  return current
}

/** 串行执行响应拦截器 */
async function runResponseInterceptors(
  response: RawResponse,
  config: RequestConfig
): Promise<unknown> {
  let current: unknown = response
  for (const fn of responseInterceptorList) {
    current = await fn(current as RawResponse, config)
  }
  return current
}

/** 串行执行错误拦截器 */
async function runErrorInterceptors(
  error: RequestError,
  config: RequestConfig
): Promise<RequestError> {
  let current = error
  for (const fn of errorInterceptorList) {
    current = await fn(current, config)
  }
  return current
}

// ============================================================
// 核心:Promise 化的 uni.request
// ============================================================

/**
 * 原始请求(不走任何拦截器)。
 *
 * 导出给高级场景使用:
 * - v0.2 适配器在实现自己的拦截器时,可能需要绕开默认链路
 * - 第三方 API 请求(如直接调用 OSS / 地图 API)不想走项目拦截器
 *
 * 业务代码绝大多数情况应该用 request(),而不是 rawRequest()。
 */
export function rawRequest<T = unknown>(config: RequestConfig): Promise<RawResponse<T>> {
  return new Promise((resolve, reject) => {
    const url = buildUrl(config.url, config.params)
    const timeout = config.timeout ?? defaultTimeout

    uni.request({
      url,
      method: config.method ?? 'GET',
      data: config.data as string | AnyObject | ArrayBuffer | undefined,
      header: config.header,
      timeout,
      success: (res) => {
        resolve({
          statusCode: res.statusCode,
          data: res.data as T,
          header: (res.header ?? {}) as Record<string, string>
        })
      },
      fail: (err) => {
        // uni.request 失败:网络错误或超时
        const msg = err?.errMsg ?? 'request failed'
        const isTimeout = msg.includes('timeout')
        reject(new RequestError(isTimeout ? 'timeout' : 'network', msg, { raw: err }))
      }
    })
  })
}

// ============================================================
// 主入口:request()
// ============================================================

/**
 * 发起请求。
 *
 * 流程:请求拦截器 → 发出 HTTP → HTTP 错误则走错误拦截器 →
 * HTTP 成功则走响应拦截器 → 响应拦截器抛错则走错误拦截器 → 返回业务数据
 *
 * 返回值是"业务层数据"(拆包后的 T),不是 ApiResponse<T>。
 * 拆包逻辑由响应拦截器实现,见 installDefaultInterceptors()。
 */
export async function request<T = unknown>(config: RequestConfig): Promise<T> {
  let finalConfig: RequestConfig
  try {
    finalConfig = await runRequestInterceptors(config)
  } catch (err) {
    const e =
      err instanceof RequestError
        ? err
        : new RequestError('unknown', 'request interceptor failed', {
            raw: err
          })
    throw await runErrorInterceptors(e, config)
  }

  let raw: RawResponse
  try {
    raw = await rawRequest(finalConfig)
  } catch (err) {
    const e =
      err instanceof RequestError
        ? err
        : new RequestError('unknown', 'network layer failed', { raw: err })
    if (finalConfig.skipErrorInterceptor) throw e
    throw await runErrorInterceptors(e, finalConfig)
  }

  // HTTP 状态码非 2xx
  if (raw.statusCode < 200 || raw.statusCode >= 300) {
    const e = new RequestError('http', `HTTP ${raw.statusCode}`, {
      statusCode: raw.statusCode,
      raw: raw.data
    })
    if (finalConfig.skipErrorInterceptor) throw e
    throw await runErrorInterceptors(e, finalConfig)
  }

  // 跳过响应拦截器,直接返回原始响应
  if (finalConfig.skipResponseInterceptor) {
    return raw as unknown as T
  }

  try {
    const result = await runResponseInterceptors(raw, finalConfig)
    return result as T
  } catch (err) {
    const e =
      err instanceof RequestError
        ? err
        : new RequestError('unknown', 'response interceptor failed', {
            raw: err
          })
    if (finalConfig.skipErrorInterceptor) throw e
    throw await runErrorInterceptors(e, finalConfig)
  }
}

// ============================================================
// 语法糖
// ============================================================

request.get = <T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: Omit<RequestConfig, 'url' | 'method' | 'params'>
): Promise<T> => request<T>({ ...config, url, method: 'GET', params })

request.post = <T = unknown>(
  url: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
): Promise<T> => request<T>({ ...config, url, method: 'POST', data })

request.put = <T = unknown>(
  url: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
): Promise<T> => request<T>({ ...config, url, method: 'PUT', data })

request.delete = <T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: Omit<RequestConfig, 'url' | 'method' | 'params'>
): Promise<T> => request<T>({ ...config, url, method: 'DELETE', params })

// ============================================================
// 默认拦截器(业务约定)
// ============================================================

/**
 * 安装默认拦截器:
 * - 响应拦截器:假设后端返回 ApiResponse<T> 结构,拆包 data 字段
 *
 * v0.2 适配器如果后端结构不同(如 Supabase),可以:
 * 1. 调用 responseInterceptors.clear() 清空
 * 2. 注册自己的响应拦截器
 *
 * 默认在模块加载时自动安装。如不需要,可在 main.ts 顶部清空。
 */
export function installDefaultInterceptors(): void {
  responseInterceptors.use((response, _config) => {
    const data = (response as RawResponse).data as ApiResponse<unknown>

    // 不符合 ApiResponse 结构,原样返回(兼容第三方 API)
    if (!data || typeof data !== 'object' || !('code' in data) || !('data' in data)) {
      return (response as RawResponse).data
    }

    // 业务成功,拆包返回 data
    if (data.code === successCode) {
      return data.data
    }

    // 业务失败,抛 business 错误
    throw new RequestError('business', data.message || 'business error', {
      code: data.code,
      raw: data,
      statusCode: (response as RawResponse).statusCode
    })
  })
}

// 自动安装默认拦截器
installDefaultInterceptors()
