# src/composables

Vue 3 组合式函数(composables),即中文社区常说的 hooks。使用 Vue 3 官方术语。

## 放什么

- 封装响应式状态 + 生命周期 + 副作用的函数
- 以 use 开头命名(如 useList、useDetail、useForm)
- 返回值通常是 ref / reactive / 方法的组合

## 不放什么

- 无状态的纯函数 —— 去 utils/
- 网络请求封装 —— 去 api/(composables 可以调用 api,但不要在这里写 fetch 逻辑)
- Vue 组件 —— 去 components/

## 参考

Vue 3 官方文档:https://vuejs.org/guide/reusability/composables.html
