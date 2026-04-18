/**
 * request 模块内部类型定义
 *
 * 这些类型仅供 request.ts 内部使用,不面向业务层。
 * 业务层应该引用 src/types/api.ts 里的通用协议类型。
 *
 * @module api/request.types
 */

/**
 * HTTP 方法。
 * 限定为 uni.request 官方支持的方法集合,避免拼写错误。
 */
export type RequestMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE'
  | 'CONNECT'

/**
 * 请求配置。
 *
 * 是 uni.request 参数的子集 + 扩展字段,屏蔽平台差异。
 * 不直接暴露 uni.request 的类型,防止 uni-app 版本升级导致破坏性变更。
 */
export interface RequestConfig {
  /** 请求 URL。可以是绝对路径(http://...)或相对路径(配合 baseURL) */
  url: string
  /** HTTP 方法,默认 GET */
  method?: RequestMethod
  /** URL query 参数,GET 时自动拼到 url 后面 */
  params?: Record<string, unknown>
  /** 请求体,POST/PUT/DELETE 时使用 */
  data?: unknown
  /** 请求头 */
  header?: Record<string, string>
  /** 超时时间(毫秒),默认 10000 */
  timeout?: number
  /** 是否跳过默认的响应拦截器(拿原始响应)。默认 false */
  skipResponseInterceptor?: boolean
  /** 是否跳过默认的错误拦截器(业务自己处理错误)。默认 false */
  skipErrorInterceptor?: boolean
}

/**
 * 错误类型分类。
 *
 * 业务层可以根据 type 做不同处理:
 * - network: 断网、域名解析失败等,通常提示"网络异常"
 * - timeout: 超时,通常提示"请求超时,请重试"
 * - http: HTTP 状态码非 2xx,通常提示"服务器异常"
 * - business: HTTP 200 但业务 code 非成功,使用 message 提示
 * - unknown: 未分类错误,兜底
 */
export type RequestErrorType = 'network' | 'timeout' | 'http' | 'business' | 'unknown'

/**
 * 统一错误类。
 *
 * 所有从 request 抛出的错误都是此类实例,业务层可用 instanceof 判断。
 * 继承自 Error,保留 stack trace,方便开发阶段定位问题。
 */
export class RequestError extends Error {
  /** 错误类型分类 */
  readonly type: RequestErrorType
  /** HTTP 状态码(http 类型错误时有值) */
  readonly statusCode?: number
  /** 业务错误码(business 类型错误时有值) */
  readonly code?: number
  /** 原始响应数据,便于调试 */
  readonly raw?: unknown

  constructor(
    type: RequestErrorType,
    message: string,
    options?: {
      statusCode?: number
      code?: number
      raw?: unknown
    }
  ) {
    super(message)
    this.name = 'RequestError'
    this.type = type
    this.statusCode = options?.statusCode
    this.code = options?.code
    this.raw = options?.raw
  }
}

/**
 * 请求拦截器。
 *
 * 在请求发出前执行,可修改 config(如注入 token、添加统一 header)。
 * 必须返回 config(同步或异步)。若抛错,请求会被中断并走错误链。
 *
 * @example
 * ```ts
 * requestInterceptors.use((config) => {
 *   const token = uni.getStorageSync('token')
 *   if (token) config.header = { ...config.header, Authorization: `Bearer ${token}` }
 *   return config
 * })
 * ```
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>

/**
 * 响应拦截器。
 *
 * 在响应返回后、Promise resolve 前执行。可用于拆包(取 data)、
 * 业务错误检测(抛 RequestError)、数据转换等。
 *
 * 入参是"HTTP 传输层的原始响应"(含 statusCode/data/header),
 * 出参是"业务层看到的数据"(通常是拆包后的 data 字段)。
 *
 * 多个拦截器按注册顺序串行执行,前一个的返回值是后一个的输入。
 */
export type ResponseInterceptor = (
  response: RawResponse,
  config: RequestConfig
) => unknown | Promise<unknown>

/**
 * 错误拦截器。
 *
 * 在错误即将抛给业务层前执行。可用于:
 * - token 过期自动刷新并重试
 * - 统一上报错误到监控系统
 * - 全局错误提示(但 v0.1 不推荐,应由业务决定)
 *
 * 必须返回 RequestError 或 throw。返回的错误是最终抛给业务的错误。
 */
export type ErrorInterceptor = (
  error: RequestError,
  config: RequestConfig
) => RequestError | Promise<RequestError>

/**
 * HTTP 传输层原始响应。
 *
 * 对 uni.request 响应的抽象,只保留业务关心的字段。
 * 不直接暴露 UniApp.RequestSuccessCallbackResult,隔离平台耦合。
 */
export interface RawResponse<T = unknown> {
  statusCode: number
  data: T
  header: Record<string, string>
}
