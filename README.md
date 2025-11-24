<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/10ba0o3dnjd3lYItuzaGEvZWxRrAGyCFW

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `env.example` to `.env.local` and set `VITE_GEMINI_API_KEY`
3. Run the app:
   `npm run dev`

## Vercel 部署

1. 本地模拟 Vercel 运行时：
   `npm run vercel:dev`
2. 首次运行会提示登录或关联 Vercel 项目，请按 CLI 指引完成
3. 设置 Vercel 项目的 `VITE_GEMINI_API_KEY` 环境变量
4. 将代码推送到连接的仓库或执行 `vercel --prod` 触发正式部署
