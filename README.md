# JobFit — 求职岗位匹配与简历辅助平台（演示版）

JobFit 是使用 **React 18 + TypeScript + Webpack 5 + Tailwind CSS** 开发的前端网站，提供求职导航、岗位筛选、简历关键词分析、简历优化展示、学生档案等功能。

> **演示项目，不是线上招聘或真实 AI 服务。** 当前岗位来自仓库的静态示例数据；匹配评分和简历分析使用本地规则；登录/注册没有真正的账号后端，公开演示版已改为免登录入口。不要依赖示例岗位的有效性，也不要把匹配分当作真实录用概率。

## 1. 快速公开部署：GitHub Pages（免费）

1. 确认你有权公开发布这份代码和所涉及的内容（尤其是代码曾在公司内部环境运行时）。
2. 在 [GitHub 新建仓库](https://github.com/new)，建议仓库名为 `jobfit`，可设为 **Public**，默认分支使用 `main`。
3. 将此项目的**解压后的全部文件和文件夹**上传到仓库根目录，必须包含 `.github/workflows/deploy.yml`、`src/`、`package.json`、`package-lock.json`；**不能只上传 ZIP 文件**。使用 GitHub Desktop 或下方 Git 命令最可靠。
4. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
5. 打开 **Actions** 标签，查看 `Deploy JobFit to GitHub Pages` 的状态。部署成功后网站通常是 `https://<你的用户名>.github.io/jobfit/`；也可以在 **Settings → Pages** 查看准确网址。

**在本地使用 Git 命令上传**（先创建空仓库、解压本项目并在该目录打开终端）：

```bash
git init
git branch -M main
git add .
git commit -m "Prepare JobFit for GitHub Pages"
git remote add origin https://github.com/<你的用户名>/jobfit.git
git push -u origin main
```

如果你的仓库不叫 `jobfit`，请把命令中的仓库名换成实际名称，网站地址也要相应改变。GitHub 可能要求通过登录凭据/浏览器授权；请勿将密码或令牌加入代码中。

## 2. 本地运行

电脑需有 Node.js 20+ 和 npm。

```bash
npm ci
npm run dev
```

访问终端给出的地址（当前开发端口默认为 `3015`）。构建网站：

```bash
npm run build
```

构建输出在 `dist/`。本项目使用 `HashRouter`，因此在 GitHub Pages 的仓库子路径下也能正常跳转页面，无需服务器端路由配置。

## 3. 功能边界及下一步开发

- **岗位信息**：`src/data/mockJobs.ts` 为模拟数据，里面的一些申请链接仅作展示，不代表真实有效的岗位。若需要实时岗位，必须合法接入第三方数据源或后端 API。
- **简历解析**：`src/data/resumeAnalyzer.ts` 为关键词规则算法，**不是实际大模型调用**。`txt` 可按文本读取；当前 `PDF/DOC/DOCX` 并没有可靠提取正文，会出现基于文件名或默认值分析的情况，结果不应当作真实简历诊断。
- **登录注册**：原始版本的表单只有模拟成功动画，没有验证/存储账号。公开版移除了这种假登录交互，默认无需登录；如需真实账号系统应另行接入 Auth 服务及后端。
- **用户数据**：部分信息使用浏览器 `localStorage`/`sessionStorage` 保存；建议仅使用测试简历与虚构身份进行演示。站点本身不会通过此代码将简历发送到 JobFit 后端，但浏览器的本地数据并非受保护的账户云存储。
- **GitHub Pages**：只托管静态网站，不提供数据库、安全的服务端密钥、账户系统或后端计算。

## 4. 发布前检查

- 代码曾在内部平台运行：请确认**著作权与公开发布许可**，并独立复核是否包含公司内部逻辑、未公开数据或第三方受限资源。
- 从原始压缩包排除了 `.microcompact/`、`.oneday/`、`.plan/`、`.assets_mapping` 和内部专用 `.npmrc`；`package-lock.json` 的内网依赖地址已更换为公网 npm。
- 源码默认没有开源许可文件。**公开仓库不自动等于获得开源授权**。在确认你有权许可这份代码后，可选择 MIT、Apache-2.0 等许可证，并在仓库增加 `LICENSE` 文件。

## 技术栈

React · TypeScript · React Router (HashRouter) · Webpack · Tailwind CSS · Recharts
