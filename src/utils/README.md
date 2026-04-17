# src/utils

纯函数工具库。

## 严格定义

放进来的每个函数必须满足三个条件:

1. 确定性:输入相同,输出一定相同
2. 无副作用:不修改外部状态,不发起 I/O
3. 无框架依赖:不依赖 Vue 响应式、不依赖 uni API

## 放什么示例

- formatDate(date: Date): string
- debounce(fn, ms) / throttle(fn, ms)
- parsePrice(cents: number): string
- validatePhone(str: string): boolean

## 不放什么

- 网络请求(有副作用)—— 去 api/
- Vue 响应式逻辑 —— 去 composables/
- 操作 uni storage —— 有副作用,放 api/ 或 composables/

## 为什么这么严?

没有约束的 utils/ 会变成垃圾桶。大公司仓库烂掉的第一步,往往就是 utils 里什么都塞。
