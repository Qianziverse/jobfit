# 🎯 JobFit

**让岗位匹配更清晰，让简历优化更有方向。**

*Explore opportunities. Understand the gaps. Improve your resume.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-6D4AFF?style=flat-square)](https://qianziverse.github.io/jobfit/)
[![Deploy](https://github.com/Qianziverse/jobfit/actions/workflows/deploy.yml/badge.svg)](https://github.com/Qianziverse/jobfit/actions/workflows/deploy.yml)

**JobFit** 是一款面向大学生与初入职场求职者的求职辅助 Web 应用原型，将**岗位探索、规则匹配、简历诊断和优化报告**整合到一条使用流程中。

项目希望帮助用户更有条理地了解目标岗位要求，识别自身经历与岗位描述之间的差距，并制定下一步改进计划。

> **当前为公开演示版（Prototype）**：可体验完整的前端交互，但岗位数据、分析建议与匹配评分主要来自本地示例数据和规则/模板逻辑，尚未接入实时招聘 API、真实大模型或账户后端。

## 🔗 在线体验

**[▶ 立即体验 JobFit](https://qianziverse.github.io/jobfit/)**

项目仓库：[Qianziverse/jobfit](https://github.com/Qianziverse/jobfit)

## ✨ 核心功能

| 模块 | 当前可体验的能力 |
| --- | --- |
| 🧭 求职导航 | 招聘节点、行业方向及求职信息展示 |
| 🔎 岗位探索与筛选 | 岗位关键词搜索、类型筛选与排序 |
| 🎯 规则化岗位匹配 | 行业、职能和技能关键词匹配 |
| 📝 简历优化建议 | 能力评分、差距分析与改进建议 |
| 🪄 岗位定制展示 | 基于模板的简历模块优化交互 |
| 📄 报告导出 | PDF / DOCX 优化报告生成 |
| 👤 学生档案 | 求职偏好填写与浏览器本地保存 |

## 🛠️ 技术栈

| 类别 | 技术 |
| --- | --- |
| 前端 | React 18、TypeScript 5 |
| 页面路由 | React Router 6 |
| 样式与交互 | Tailwind CSS 3、CSS 动画、Font Awesome |
| 图表展示 | 自定义 SVG 雷达图 |
| 文档导出 | jsPDF、html2canvas、docx |
| 工程化 | Webpack 5、Babel、npm |
| 部署 | GitHub Actions、GitHub Pages |

## 🚀 本地启动

环境要求：Node.js 20+、npm。

```bash
git clone https://github.com/Qianziverse/jobfit.git
cd jobfit
npm ci
npm run dev
```

默认开发地址：`http://localhost:3015`

生产构建：`npm run build`。

## 📁 项目结构

```text
jobfit/
├── .github/workflows/deploy.yml
├── src/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── pages/
│   ├── styles/
│   ├── App.tsx
│   └── index.tsx
├── index.html
├── package.json
├── package-lock.json
└── webpack.config.js
```

## 🗺️ 后续计划

- [ ] 完善 PDF / DOCX 简历文本解析
- [ ] 接入真实招聘数据 API
- [ ] 集成大模型驱动的简历分析能力
- [ ] 完善匹配算法的可解释性与公平性
- [ ] 增加自动化测试和错误处理
- [ ] 补充产品截图与演示视频

## 🤝 反馈与交流

欢迎通过 [GitHub Issues](https://github.com/Qianziverse/jobfit/issues) 提交问题或功能建议。

## 📜 版权与使用许可

当前仓库尚未添加开源许可证。公开可见不代表已获得复制、修改或再分发授权。待确认代码及素材的版权归属后，可增加合适的 LICENSE 文件。

---

**JobFit** · Build a clearer path from your resume to your next opportunity.
