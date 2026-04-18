/**
 * 通用 API 响应结构类型
 *
 * 适用于后端返回 { code, data, message } 约定的场景。
 * 如果你的后端结构不同(如 Supabase、REST 标准、GraphQL),
 * 可在 src/api/request.ts 的响应拦截器中做适配,本类型保持稳定。
 *
 * @module types/api
 */

/**
 * 通用响应包络。
 *
 * 约定:
 * - code === 0 视为业务成功(可在 request.ts 中配置)
 * - data 为业务数据,泛型 T 指定其具体类型
 * - message 用于错误提示或成功提示
 *
 * @example
 * ```ts
 * interface User { id: number; name: string }
 * const res: ApiResponse<User> = { code: 0, data: { id: 1, name: 'Alice' }, message: 'ok' }
 * ```
 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

/**
 * 分页列表响应结构。
 *
 * 用于所有列表接口的 data 字段。hasMore 字段冗余 total/page/pageSize 的计算,
 * 供 useList hook 直接使用,避免每个调用方重复计算"是否还有下一页"。
 *
 * @example
 * ```ts
 * const res: ApiResponse<PageResult<Article>> = await request.get('/articles', { page: 1, pageSize: 10 })
 * ```
 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * 分页请求参数。
 *
 * 所有列表接口的入参基础结构。业务可通过索引签名扩展自定义字段
 * (如 keyword、category、sortBy 等)。
 *
 * @example
 * ```ts
 * const params: PageParams = { page: 1, pageSize: 10, keyword: 'hello' }
 * ```
 */
export interface PageParams {
  page: number
  pageSize: number
  [key: string]: unknown
}
