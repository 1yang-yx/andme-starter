\# andme-starter



> 开箱即用的微信小程序业务模板 — 跳过重复搭建,直接写业务。



\*\*当前版本:v0.1.0-alpha(脚手架阶段)\*\*



工程骨架已就绪,业务模块正在开发。路线图见 \[RFC 0001](./docs/rfcs/0001-project-vision.md)。



\## 快速开始



\### 环境要求



\- Node.js >= 18.12(推荐 20.x)

\- pnpm >= 8

\- 微信开发者工具



\### 安装与启动



&#x20;   git clone https://github.com/1yang-yx/andme-starter.git

&#x20;   cd andme-starter

&#x20;   pnpm install

&#x20;   pnpm dev



编译完成后,用微信开发者工具导入 dist/dev/mp-weixin 目录。



\### 常用命令



\- `pnpm dev` — 微信小程序开发模式

\- `pnpm dev:h5` — H5 本地调试

\- `pnpm build` — 构建生产包

\- `pnpm type-check` — TypeScript 类型检查

\- `pnpm lint` — ESLint 检查

\- `pnpm format` — Prettier 格式化



\## 技术栈



uni-app + Vue 3 + Vite + TypeScript + pnpm + SCSS,ESLint + Prettier 做代码规范。



\## 项目结构



src 下五个目录:api(请求)、components(共享组件)、composables(组合式函数)、types(共享类型)、utils(纯函数工具)。每个目录有 README 说明职责边界。



\## 路线图



\- v0.1 工程骨架

\- v0.2 Mock 适配器 + 微信登录

\- v0.3 useList / useDetail / useForm

\- v0.4 样板页 + 食谱 Demo

\- v0.5 过审 checklist

\- v1.0 正式发布

\- v2.0 多端适配



\## 协议



\[MIT](./LICENSE) © 2026 1yang-yx

