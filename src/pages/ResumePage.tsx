import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RadarChart from '../components/RadarChart';
import { industries } from '../data/jobTaxonomy';
import { analyzeResume, buildOriginalContentFromAnalysis, ResumeAnalysisResult } from '../data/resumeAnalyzer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

interface ResumeSuggestion {
  category: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  level: 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
  /** 适用行业 id，'general' 表示通用兜底 */
  industryId: 'internet' | 'education' | 'finance' | 'consulting' | 'general';
}

interface ActionItem {
  icon: string;
  iconBg: string;
  iconColor: string;
  text: string;
  timeframe: string;
}

interface CustomSection {
  title: string;
  originalContent: string;
  customizedContent: string;
  changeType: 'enhanced' | 'added' | 'rewritten';
}

/** 完整简历中的一个模块，sectionKey 用于与 customSectionsMap 中的 title 对应 */
interface FullResumeSection {
  sectionKey: string;
  title: string;
  content: string;
}

const mockSuggestions: ResumeSuggestion[] = [
  // ── 互联网/科技 ──────────────────────────────────────────────
  {
    industryId: 'internet',
    category: '项目经验',
    icon: 'fa-code',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '项目描述过于简单，缺乏量化数据',
    suggestion: '用 STAR 法则重写每段项目经历。例如："负责前端性能优化（S），通过代码分割与懒加载（T/A），将页面 LCP 从 3.2s 降至 1.1s，用户留存率提升 15%（R）"。每个项目至少包含 1 个可量化结果。',
  },
  {
    industryId: 'internet',
    category: '技术栈深度',
    icon: 'fa-layer-group',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '技术栈广度有余、深度不足，HR 无法判断真实水平',
    suggestion: '选择 2-3 个核心技术重点展示深度，如"深入理解 React Fiber 调度机制，曾排查并修复生产环境 concurrent mode 下的 tearing 问题"，比罗列 20 个技术名词更有说服力。',
  },
  {
    industryId: 'internet',
    category: '技能描述',
    icon: 'fa-wrench',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    level: 'medium',
    issue: '技能栏仅列举技术名称，未体现熟练程度',
    suggestion: '按"精通 / 熟练 / 了解"三级分层描述，并附上佐证，如"熟练掌握 React 18 + TypeScript（2 年项目经验，主导过 3 个从 0 到 1 的项目）；了解 Node.js，可独立完成 BFF 层接口开发"。',
  },
  {
    industryId: 'internet',
    category: '实习/项目经历',
    icon: 'fa-briefcase',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    level: 'medium',
    issue: '经历描述偏向职责，缺少个人贡献和成果',
    suggestion: '将"负责 XX 功能开发"改为"独立完成 XX 功能从需求评审到灰度上线的全流程，该功能上线后 DAU 增长 20%，获 PM 和 TL 双重认可"。突出"独立"、"主导"等主动性词汇。',
  },
  {
    industryId: 'internet',
    category: '开源/个人作品',
    icon: 'fa-github',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    level: 'medium',
    issue: '缺少可验证的个人技术作品，简历可信度低',
    suggestion: '补充 GitHub 主页链接，并挑选 1-2 个代表性项目重点介绍：说明技术选型理由、解决了什么问题、Star 数或使用量。没有开源项目可将课程大作业整理上传并补充详细 README。',
  },
  {
    industryId: 'internet',
    category: '算法能力',
    icon: 'fa-brain',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    level: 'medium',
    issue: '未体现算法与数据结构能力，大厂笔试易被刷',
    suggestion: '补充算法竞赛或刷题经历，如"LeetCode 已解题 300+，周赛最高排名前 8%"或"ACM 校队成员，获区域赛铜奖"。同时在项目中体现算法应用，如"使用 Trie 树优化搜索联想，响应时间从 200ms 降至 15ms"。',
  },
  {
    industryId: 'internet',
    category: '自我评价',
    icon: 'fa-user',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    level: 'low',
    issue: '自我评价内容空泛，与岗位关联性弱',
    suggestion: '删除"认真负责、积极主动"等通用描述，改为具体的技术标签与软实力，如"具备完整前端工程化思维，关注性能与可访问性细节；活跃于技术社区，掘金累计阅读量 3 万+；能在跨时区远程团队中高效协作"。',
  },
  {
    industryId: 'internet',
    category: '简历结构',
    icon: 'fa-list-ol',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    level: 'low',
    issue: '简历超过 2 页或排版混乱，HR 扫描成本高',
    suggestion: '互联网岗位简历控制在 1 页（应届）或 2 页（3 年以内）。使用统一字体、对齐方式和项目符号。将最亮眼的经历放在前 1/3 屏，确保 HR 6 秒扫描即可抓住核心亮点。',
  },
  {
    industryId: 'internet',
    category: '教育背景',
    icon: 'fa-graduation-cap',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    level: 'low',
    issue: '未列出与岗位相关的核心课程及学术成果',
    suggestion: '补充相关课程（数据结构、算法设计、操作系统、计算机网络）及成绩亮点，如"GPA 3.7/4.0，专业前 10%"。若有论文、专利或竞赛获奖，单独列出，可有效弥补工作经验不足。',
  },

  // ── 教培/教育 ──────────────────────────────────────────────
  {
    industryId: 'education',
    category: '教学经历',
    icon: 'fa-chalkboard-teacher',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '教学实践描述流于形式，缺乏具体成果',
    suggestion: '用 STAR 法则量化教学成果，例如"独立设计并讲授 8 节高一数学复习课（S），针对学生薄弱点定制专项练习（A），课后测试平均分从 62 提升至 74 分（R）"。每段经历必须有可量化的学生进步数据。',
  },
  {
    industryId: 'education',
    category: '资格证书',
    icon: 'fa-certificate',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    level: 'high',
    issue: '证书信息未突出展示，位置靠后',
    suggestion: '将教师资格证、普通话等级证书（语文教师需二甲以上）、学科竞赛辅导资质等放在简历顶部"证书与资质"模块。教培行业这是硬性门槛，HR 首先核查，位置靠后等于主动降低通过率。',
  },
  {
    industryId: 'education',
    category: '课堂管理能力',
    icon: 'fa-users',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '未体现课堂管理与学生激励能力',
    suggestion: '补充课堂管理案例，如"管理 45 人班级，通过积分制激励机制将课堂参与率从 60% 提升至 90%；处理过 3 起学习障碍学生的个性化辅导案例，均在期末考试中达到班级平均分以上"。',
  },
  {
    industryId: 'education',
    category: '教学设计',
    icon: 'fa-book-open',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    level: 'medium',
    issue: '缺少课程设计作品集，无法体现教学能力',
    suggestion: '补充课程设计成果，如"设计并实施『概率统计单元』探究式教学方案，获校级教学设计比赛二等奖"。如有条件，附上教案或课件链接（Google Drive/腾讯文档），让面试官直接感受教学水平。',
  },
  {
    industryId: 'education',
    category: '家校沟通',
    icon: 'fa-comments',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    level: 'medium',
    issue: '未体现家校沟通与家长关系维护能力',
    suggestion: '教培机构极看重续费率，补充相关经历，如"负责 30 名学员的家长沟通，每月发送学习报告，续费率达 85%，高于部门平均 20 个百分点"。体现你能为机构带来稳定的营收贡献。',
  },
  {
    industryId: 'education',
    category: '数字化教学',
    icon: 'fa-laptop',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    level: 'medium',
    issue: '未体现在线教学与数字化工具使用能力',
    suggestion: '补充在线教学经验，如"熟练使用钉钉直播、ClassIn、Zoom 等平台进行在线授课，累计直播课时 200+；掌握 Canva、PPT 动画制作，课件获学生好评率 96%"。后疫情时代线上能力是加分项。',
  },
  {
    industryId: 'education',
    category: '自我评价',
    icon: 'fa-user',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    level: 'low',
    issue: '自我评价通用，未体现教育行业专业性',
    suggestion: '改为具体的教育理念与能力标签，如"热爱教育事业，熟悉新课标要求，有 300+ 小时一对一面授经验；擅长因材施教，曾将偏科严重的学生数学成绩从 40 分提升至 90 分；具备较强的家长沟通与信任建立能力"。',
  },
  {
    industryId: 'education',
    category: '教育背景',
    icon: 'fa-graduation-cap',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    level: 'low',
    issue: '未列出与教育岗位相关的核心课程及荣誉',
    suggestion: '补充主修课程（教育学原理、教育心理学、学科教学论、班级管理）及荣誉，如"师范专业排名前 5%，获优秀毕业生称号；参与省级教育科研课题 1 项"。体现专业系统性与学术积累。',
  },

  // ── 金融/银行 ──────────────────────────────────────────────
  {
    industryId: 'finance',
    category: '实习经历',
    icon: 'fa-briefcase',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '实习成果描述模糊，缺乏数据支撑',
    suggestion: '用数据量化每段实习成果，例如"实习期间独立完成 15 份企业信用评估报告，覆盖制造、零售、科技 3 个行业板块；参与 2 个 IPO 项目尽调，整理核查文件 200+ 份，零差错率"。',
  },
  {
    industryId: 'finance',
    category: '专业资质',
    icon: 'fa-certificate',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    level: 'high',
    issue: '证书信息未放在显眼位置或尚未备考',
    suggestion: '将 CPA/CFA/FRM/证券从业/银行从业资格证放在简历顶部"证书与资质"模块。尚未取得的可写"备考中，预计 XX 年通过"。金融行业 HR 首先筛查资质，无证书等于主动放弃竞争优势。',
  },
  {
    industryId: 'finance',
    category: '财务建模能力',
    icon: 'fa-table',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '缺少财务建模与估值分析的具体经历',
    suggestion: '补充建模经历，如"独立搭建某消费品公司 DCF 估值模型，测算合理估值区间，作为毕业论文核心内容获优秀论文奖"或"实习期间协助搭建 LBO 模型，参与 2 个并购项目的财务尽调"。',
  },
  {
    industryId: 'finance',
    category: '数据分析能力',
    icon: 'fa-chart-line',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    level: 'medium',
    issue: '缺少金融数据处理相关经历',
    suggestion: '补充量化分析经历，如"使用 Python（Pandas/Matplotlib）完成毕业论文中的 A 股市场动量因子研究，处理 50 万条行情数据，回测年化超额收益 8.3%"。Wind/Bloomberg 操作经验也要明确列出。',
  },
  {
    industryId: 'finance',
    category: '行业研究能力',
    icon: 'fa-magnifying-glass-chart',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    level: 'medium',
    issue: '未体现对金融市场和行业的持续关注与研究能力',
    suggestion: '补充自主研究经历，如"持续跟踪新能源行业，独立撰写 3 篇行业深度报告（共 6 万字），覆盖产业链分析、竞争格局与投资逻辑"。体现主动学习与研究热情，这是研究岗的核心竞争力。',
  },
  {
    industryId: 'finance',
    category: '自我评价',
    icon: 'fa-user',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    level: 'low',
    issue: '自我评价未体现金融行业专业素养',
    suggestion: '改为"对金融市场有持续关注，每日阅读财经资讯并维护个人投资组合；熟悉 Wind/Bloomberg 终端操作；具备较强的数据敏感度与风险意识；英语可流利阅读英文研报，CET-6 分数 580+"。',
  },
  {
    industryId: 'finance',
    category: '沟通与表达',
    icon: 'fa-comments',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    level: 'low',
    issue: '未体现客户沟通与路演汇报能力',
    suggestion: '金融岗位高度依赖沟通能力，补充相关经历，如"参与 3 次客户路演，负责制作 PPT 并进行 10 分钟产品介绍，获客户正面反馈"或"在校期间参加模拟联合国，担任主席团成员，英语演讲能力强"。',
  },
  {
    industryId: 'finance',
    category: '教育背景',
    icon: 'fa-graduation-cap',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    level: 'low',
    issue: '未列出金融相关核心课程及学术成果',
    suggestion: '补充主修课程（金融学原理、公司金融、金融风险管理、证券投资学、计量经济学）及成绩亮点。若 GPA 优秀（3.5+）务必标注；有论文发表或竞赛获奖（如 CFA 研究挑战赛）单独列出。',
  },

  // ── 咨询/审计 ──────────────────────────────────────────────
  {
    industryId: 'consulting',
    category: '项目经历',
    icon: 'fa-file-alt',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '项目经历描述缺乏结构化，无法体现咨询思维',
    suggestion: '用"背景—问题—方法—结论"四段式描述，例如"针对某快消品牌华南市场份额下滑问题（背景），通过渠道调研与竞品分析定位根因（方法），搭建市场规模测算模型，输出 30 页策略报告，建议被客户采纳并落地（结论）"。',
  },
  {
    industryId: 'consulting',
    category: '结构化思维',
    icon: 'fa-sitemap',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '简历未体现 MECE 原则和金字塔结构思维',
    suggestion: '在项目描述中主动展示结构化拆解，如"将问题拆解为市场规模、竞争格局、客户需求、内部能力四个维度（MECE），逐一分析后得出核心结论"。咨询公司面试官会从简历写法判断候选人的思维方式。',
  },
  {
    industryId: 'consulting',
    category: '技能描述',
    icon: 'fa-table',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    level: 'high',
    issue: 'Excel/PPT 能力未具体说明，缺乏说服力',
    suggestion: '具体化工具能力，如"精通 Excel（数据透视表/VLOOKUP/Power Query/VBA），可独立搭建含敏感性分析的财务模型；PPT 设计遵循麦肯锡金字塔原则，单页信息密度高且逻辑清晰，曾独立制作 50 页客户交付报告"。',
  },
  {
    industryId: 'consulting',
    category: '实习经历',
    icon: 'fa-briefcase',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    level: 'medium',
    issue: '实习描述停留在"参与"层面，未体现个人贡献',
    suggestion: '将"参与项目调研"改为"作为 3 人小组核心成员，独立完成 5 个竞品深度访谈与分析，产出 15 页竞争格局报告，结论直接被纳入最终客户交付物"。用"独立完成""主导""负责"替代"参与""协助"。',
  },
  {
    industryId: 'consulting',
    category: '英语能力',
    icon: 'fa-language',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    level: 'medium',
    issue: '英语能力未具体说明，外资咨询公司高度看重',
    suggestion: '明确列出英语水平证明，如"CET-6 分数 620+，可流利阅读英文研报；参与过全英文客户会议，负责会议纪要整理"。有 GMAT/GRE 成绩或海外交换经历务必标注，这是外资咨询的重要筛选维度。',
  },
  {
    industryId: 'consulting',
    category: '案例竞赛',
    icon: 'fa-trophy',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    level: 'medium',
    issue: '缺少案例分析竞赛经历，无法证明咨询能力',
    suggestion: '补充案例竞赛经历，如"参加麦肯锡 Problem Solving Game，进入全国前 5%；获 BCG 校园挑战赛华南区决赛资格，独立完成 48 小时案例分析并路演"。这是咨询公司最认可的能力证明之一。',
  },
  {
    industryId: 'consulting',
    category: '自我评价',
    icon: 'fa-user',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    level: 'low',
    issue: '自我评价未体现咨询行业核心竞争力',
    suggestion: '改为"具备顶级咨询实习经验，擅长结构化拆解复杂商业问题；数据驱动决策，熟练使用 Excel/Python 进行量化分析；英语商务沟通流利（CET-6 620+）；能在高压、快节奏环境下高质量交付，曾连续 3 周 deadline 零延误"。',
  },
  {
    industryId: 'consulting',
    category: '教育背景',
    icon: 'fa-graduation-cap',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    level: 'low',
    issue: 'GPA、排名和学术成果未突出展示',
    suggestion: '咨询行业对学历背景极为看重，务必突出"GPA 3.8/4.0，专业排名前 5%，获国家奖学金"。有海外交换、双学位、顶刊论文等经历单独列出。学校名气不够可用竞赛奖项和实习经历弥补。',
  },

  // ── 通用兜底 ──────────────────────────────────────────────
  {
    industryId: 'general',
    category: '实习/项目经历',
    icon: 'fa-briefcase',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '经历描述偏向职责，缺少个人贡献和量化成果',
    suggestion: '用 STAR 法则重写每段经历：情境（S）→ 任务（T）→ 行动（A）→ 结果（R）。结果必须量化，如"提升 XX%""节省 XX 小时""覆盖 XX 用户"。没有数据的经历在 HR 眼中等于没有价值。',
  },
  {
    industryId: 'general',
    category: '专业技能',
    icon: 'fa-wrench',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    level: 'high',
    issue: '技能描述未分级，与目标岗位关联性不明确',
    suggestion: '按"精通 / 熟练 / 了解"三级分层，只保留与目标岗位直接相关的技能，删除无关技能。每项技能附上使用场景或成果，如"熟练使用 Tableau（曾为部门制作月度销售看板，节省人工汇报 4 小时/周）"。',
  },
  {
    industryId: 'general',
    category: '简历针对性',
    icon: 'fa-crosshairs',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    level: 'high',
    issue: '简历未针对目标岗位定制，关键词匹配度低',
    suggestion: '每投一家公司前，对照 JD 逐条检查：JD 中出现 3 次以上的关键词必须在简历中自然出现；JD 要求的核心技能必须有对应的经历佐证。ATS 系统会自动过滤关键词不匹配的简历。',
  },
  {
    industryId: 'general',
    category: '资格证书',
    icon: 'fa-certificate',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    level: 'medium',
    issue: '行业相关证书未列出或位置不显眼',
    suggestion: '将行业硬性资质证书（执业医师/法律职业资格/注册安全工程师/注册会计师等）放在简历顶部。软性证书（英语四六级/计算机二级等）放在末尾。正在备考的证书可注明"备考中，预计 XX 年通过"。',
  },
  {
    industryId: 'general',
    category: '排版与可读性',
    icon: 'fa-align-left',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    level: 'medium',
    issue: '简历排版混乱，HR 扫描成本高，关键信息被淹没',
    suggestion: '遵循"6 秒原则"：HR 平均只花 6 秒扫描简历。使用统一字体（中文宋体/微软雅黑，英文 Calibri）、一致的项目符号和对齐方式。最重要的经历放在前 1/3 屏，每条经历不超过 3 行。',
  },
  {
    industryId: 'general',
    category: '自我评价',
    icon: 'fa-user',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    level: 'medium',
    issue: '自我评价内容空泛，与岗位关联性弱',
    suggestion: '删除"认真负责、积极主动、学习能力强"等 HR 最厌倦的通用描述。改为 2-3 句具体的能力标签，每句都要有事实支撑，如"具备 XX 行业 X 年经验，擅长 XX（有 XX 成果佐证）；XX 软实力（有 XX 场景证明）"。',
  },
  {
    industryId: 'general',
    category: '数字与成果',
    icon: 'fa-chart-bar',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    level: 'low',
    issue: '全文缺少数字，无法让 HR 感知你的工作量级',
    suggestion: '系统性地为每段经历添加数字：规模（管理 XX 人团队）、时间（在 XX 天内完成）、比例（提升 XX%）、绝对值（覆盖 XX 用户）。哪怕是估算数字也比没有数字强，但要确保合理可信。',
  },
  {
    industryId: 'general',
    category: '教育背景',
    icon: 'fa-graduation-cap',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    level: 'low',
    issue: '未列出与目标岗位相关的核心课程及学术成果',
    suggestion: '补充与目标岗位相关的核心课程（3-5 门即可），让 HR 了解你的专业知识储备。若 GPA 优秀（3.5+/4.0 或专业前 20%）务必标注。有竞赛获奖、论文发表、科研项目经历单独列出，可有效弥补工作经验不足。',
  },
];

const actionItemsByIndustry: Record<string, ActionItem[]> = {
  internet: [
    { icon: 'fa-laptop-code', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', text: '用 React + TypeScript 做一个完整项目（含登录、CRUD、部署），上传 GitHub 并补充详细 README，作为简历可验证作品', timeframe: '2-3 周' },
    { icon: 'fa-brain', iconBg: 'bg-rose-50', iconColor: 'text-rose-500', text: '每天刷 2 道 LeetCode，重点攻克数组/链表/树/动态规划四大类，目标 3 个月内解题 150+，周赛排名进入前 20%', timeframe: '持续进行' },
    { icon: 'fa-github', iconBg: 'bg-gray-100', iconColor: 'text-gray-600', text: '将 3 个课程大作业整理上传 GitHub，每个项目补充 README（项目背景、技术选型、运行方式、截图），让 HR 能直接看到成果', timeframe: '3 天' },
    { icon: 'fa-certificate', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', text: '备考阿里云 ACA 或 AWS Cloud Practitioner 认证，增加云原生技术背书，这是大厂后端/DevOps 岗的加分项', timeframe: '1 个月' },
    { icon: 'fa-pen-nib', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', text: '在掘金/CSDN 发布 3 篇技术总结文章（项目踩坑记录、源码分析、性能优化实践），积累技术影响力，简历中可量化引用', timeframe: '3 周' },
    { icon: 'fa-users', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', text: '参加 1 次黑客马拉松或开源贡献活动（如给知名开源项目提 PR），体现团队协作与实战能力，是大厂面试的高频话题', timeframe: '1-2 个月' },
    { icon: 'fa-chart-line', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', text: '用 STAR 法则逐条重写简历中的每段经历，为每条经历补充至少 1 个量化数据（如"提升性能 40%""日活用户 800+"），完成后请同学或前辈 review', timeframe: '1 周' },
    { icon: 'fa-magnifying-glass', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', text: '研究目标公司近 3 个月的技术博客和开源项目，了解其技术栈偏好，在简历和面试中主动对齐，体现对公司的深度了解', timeframe: '3 天/家' },
  ],
  education: [
    { icon: 'fa-chalkboard-teacher', iconBg: 'bg-sky-50', iconColor: 'text-sky-500', text: '主动申请 1 次完整的教学实习机会（至少 4 周），记录每节课的教学目标、学生反馈和改进措施，积累可量化的教学成果数据', timeframe: '1 个月' },
    { icon: 'fa-certificate', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', text: '尽快取得教师资格证（笔试+面试），语文教师同步备考普通话二甲，这是教培行业的硬性门槛，无证书基本无法通过初筛', timeframe: '3-6 个月' },
    { icon: 'fa-book-open', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', text: '设计 1 套完整的单元教学方案（含教学目标、教案、课件、练习题、评估方式），参加校级或省级教学设计比赛，获奖后写入简历', timeframe: '1 个月' },
    { icon: 'fa-comments', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', text: '主动承担 10-20 名学员的家长沟通工作，建立每月学习报告模板，记录续费率数据，这是教培机构最看重的商业价值体现', timeframe: '持续进行' },
    { icon: 'fa-laptop', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', text: '学习使用 ClassIn 或钉钉直播进行在线授课，录制 3 节示范课上传至网盘，面试时可直接展示，大幅提升说服力', timeframe: '2 周' },
    { icon: 'fa-star', iconBg: 'bg-rose-50', iconColor: 'text-rose-500', text: '收集 5-10 条学生或家长的真实好评截图（可脱敏），整理成"教学成果集"，面试时作为辅助材料展示，体现口碑与信任度', timeframe: '持续积累' },
    { icon: 'fa-pen-nib', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', text: '用 STAR 法则重写每段教学经历，为每条经历补充学生成绩提升数据或课堂参与率数据，没有数据的教学经历说服力极弱', timeframe: '3 天' },
    { icon: 'fa-users', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', text: '参加 1 次教育行业招聘宣讲会或教师技能大赛，了解行业最新需求，同时积累竞赛经历写入简历', timeframe: '1-2 个月' },
  ],
  finance: [
    { icon: 'fa-certificate', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', text: '立即报名证券从业资格考试（基础科目+专业科目），这是金融行业最基础的敲门砖，考试难度不高但必须有，建议 2 个月内拿证', timeframe: '2 个月' },
    { icon: 'fa-table', iconBg: 'bg-rose-50', iconColor: 'text-rose-500', text: '完成 1 个完整的 DCF 或 LBO 财务建模练习（可用上市公司公开数据），写成 2000 字分析报告，作为简历附件或面试展示材料', timeframe: '3 周' },
    { icon: 'fa-chart-line', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', text: '用 Python（Pandas + Matplotlib）完成 1 个金融数据分析项目（如 A 股因子回测、基金业绩归因），上传 GitHub，量化展示数据处理能力', timeframe: '1 个月' },
    { icon: 'fa-magnifying-glass-chart', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', text: '选择 1 个感兴趣的行业（如新能源/消费/医药），独立撰写 5000 字行业深度研究报告，覆盖产业链、竞争格局、投资逻辑，面试时作为核心展示材料', timeframe: '3 周' },
    { icon: 'fa-briefcase', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', text: '主动申请 1 段金融行业实习（券商/基金/银行/四大），哪怕是无薪实习也值得，实习经历是金融行业简历的核心竞争力', timeframe: '持续申请' },
    { icon: 'fa-newspaper', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', text: '每天阅读 Wind 资讯、财联社、Bloomberg 等财经媒体，建立个人投资组合（模拟盘即可），面试时能流利讨论市场动态是重要加分项', timeframe: '持续进行' },
    { icon: 'fa-language', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', text: '每周精读 2 篇英文研报（高盛/摩根/麦肯锡），积累金融英语词汇，目标 3 个月内能流利阅读并提炼核心观点，外资机构面试必考', timeframe: '持续进行' },
    { icon: 'fa-pen-nib', iconBg: 'bg-rose-50', iconColor: 'text-rose-500', text: '用数据量化重写每段实习经历（完成 XX 份报告、覆盖 XX 行业、零差错率），删除所有"参与""协助"等被动描述，改为"独立完成""主导"', timeframe: '3 天' },
  ],
  consulting: [
    { icon: 'fa-trophy', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', text: '报名参加麦肯锡 Problem Solving Game 或 BCG 校园挑战赛，这是咨询公司最认可的能力证明，进入决赛即可写入简历', timeframe: '关注报名时间' },
    { icon: 'fa-sitemap', iconBg: 'bg-rose-50', iconColor: 'text-rose-500', text: '阅读《金字塔原理》并完成书中所有练习，用 MECE 原则重写简历中的每段项目经历，让面试官从简历写法就能感受到你的结构化思维', timeframe: '2 周' },
    { icon: 'fa-table', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', text: '完成 1 个完整的市场规模测算（TAM/SAM/SOM）或竞争格局分析，用 Excel 搭建模型，输出 10 页 PPT，作为面试展示材料', timeframe: '2 周' },
    { icon: 'fa-briefcase', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', text: '主动申请咨询公司实习（四大/埃森哲/本土咨询均可），哪怕是 1 个月的短期实习也能大幅提升简历竞争力，重点展示独立贡献', timeframe: '持续申请' },
    { icon: 'fa-language', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', text: '每周精读 1 篇麦肯锡/BCG/贝恩的英文报告，积累商业英语词汇，目标 2 个月内能流利进行全英文 case interview，外资咨询必备', timeframe: '持续进行' },
    { icon: 'fa-users', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', text: '找 2-3 位同学组成 case 练习小组，每周互相出题模拟 case interview，重点练习结构化拆解、数学估算和最终建议输出', timeframe: '持续进行' },
    { icon: 'fa-file-alt', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', text: '用"背景—问题—方法—结论"四段式重写每段项目经历，确保每段经历都有明确的商业问题和可量化的结论，删除所有流水账式描述', timeframe: '3 天' },
    { icon: 'fa-graduation-cap', iconBg: 'bg-rose-50', iconColor: 'text-rose-500', text: '如 GPA 低于 3.5，重点用竞赛奖项和实习经历弥补；如 GPA 优秀，务必在简历顶部突出标注，咨询公司对学历背景的筛选极为严格', timeframe: '立即调整' },
  ],
  general: [
    { icon: 'fa-pen-nib', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', text: '用 STAR 法则逐条重写简历中的每段经历，为每条经历补充至少 1 个量化数据，完成后请 3 位不同背景的人（同学/前辈/HR 朋友）review', timeframe: '1 周' },
    { icon: 'fa-crosshairs', iconBg: 'bg-rose-50', iconColor: 'text-rose-500', text: '针对每家目标公司的 JD，逐条对照检查简历关键词匹配度，将 JD 中出现 3 次以上的关键词自然融入简历，提升 ATS 系统通过率', timeframe: '1 天/家' },
    { icon: 'fa-certificate', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', text: '立即备考目标行业的核心资质证书，这是 HR 初筛的硬性门槛。正在备考的证书也可在简历中注明"备考中，预计 XX 年通过"', timeframe: '3-6 个月' },
    { icon: 'fa-briefcase', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', text: '主动申请 1 段目标行业的实习或兼职，哪怕是短期项目也能积累行业经验，实习经历是应届生简历最核心的竞争力来源', timeframe: '持续申请' },
    { icon: 'fa-users', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', text: '参加 1 次目标行业的校园宣讲会或行业论坛，与从业者建立联系，了解行业最新动态，同时积累可写入简历的活动经历', timeframe: '1-2 个月' },
    { icon: 'fa-chart-bar', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', text: '系统梳理过去所有经历，为每段经历挖掘可量化的数字（规模、时间、比例、绝对值），没有数字的经历在 HR 眼中等于没有价值', timeframe: '3 天' },
    { icon: 'fa-align-left', iconBg: 'bg-gray-100', iconColor: 'text-gray-600', text: '用专业简历模板（如 Canva/超级简历）重新排版，确保字体统一、对齐一致、重点突出，遵循"6 秒原则"让 HR 快速抓住核心亮点', timeframe: '1 天' },
    { icon: 'fa-magnifying-glass', iconBg: 'bg-violet-50', iconColor: 'text-violet-500', text: '研究 3-5 家目标公司的官网、公众号和招聘页面，了解其文化价值观和业务重点，在简历和求职信中主动对齐，体现对公司的深度了解', timeframe: '3 天' },
  ],
};

const radarDimensionsByIndustry: Record<string, { label: string; current: number; required: number }[]> = {
  internet: [
    { label: '技术技能', current: 78, required: 85 },
    { label: '项目经验', current: 55, required: 80 },
    { label: '实习经历', current: 40, required: 70 },
    { label: '教育背景', current: 85, required: 75 },
    { label: '表达清晰度', current: 70, required: 70 },
    { label: '算法/数据结构', current: 60, required: 75 },
  ],
  education: [
    { label: '教学实践', current: 60, required: 85 },
    { label: '课堂管理', current: 50, required: 80 },
    { label: '学科基础', current: 82, required: 85 },
    { label: '沟通表达', current: 75, required: 90 },
    { label: '教育理论', current: 65, required: 70 },
    { label: '资格证书', current: 40, required: 85 },
  ],
  finance: [
    { label: '专业知识', current: 80, required: 85 },
    { label: '数据分析', current: 55, required: 75 },
    { label: '实习经历', current: 40, required: 70 },
    { label: '沟通能力', current: 70, required: 80 },
    { label: '资格证书', current: 30, required: 65 },
    { label: '逻辑思维', current: 75, required: 85 },
  ],
  consulting: [
    { label: '逻辑思维', current: 75, required: 95 },
    { label: '数据建模', current: 50, required: 85 },
    { label: '结构化表达', current: 60, required: 90 },
    { label: '实习经历', current: 35, required: 80 },
    { label: '学历背景', current: 85, required: 90 },
    { label: '英语能力', current: 65, required: 85 },
  ],
};

const levelConfig = {
  high: { label: '高优先级', color: 'bg-rose-50 text-rose-600 border-rose-200' },
  medium: { label: '中优先级', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  low: { label: '低优先级', color: 'bg-blue-50 text-blue-600 border-blue-200' },
};

const scoreBreakdown = [
  { label: '项目经验', score: 55 },
  { label: '技能匹配', score: 78 },
  { label: '实习经历', score: 40 },
  { label: '教育背景', score: 85 },
  { label: '表达清晰度', score: 70 },
];

const customSectionsMap: Record<string, CustomSection[]> = {
  '前端开发工程师': [
    {
      title: '技能描述',
      originalContent: '熟悉 HTML、CSS、JavaScript，了解 React 框架，有一定的前端开发经验。',
      customizedContent: '熟练掌握 React 18 + TypeScript，具备组件化开发与性能优化经验（Lighthouse 评分从 62 提升至 91）；熟悉 Webpack 构建配置与 CI/CD 流程；了解 Node.js，可独立完成 BFF 层接口开发。',
      changeType: 'rewritten',
    },
    {
      title: '项目经历',
      originalContent: '参与开发了一个电商网站，负责前端页面开发。',
      customizedContent: '主导开发校园二手交易平台（React + Ant Design），独立完成商品列表虚拟滚动优化，将 10000 条数据渲染耗时从 2.3s 降至 180ms；实现基于 WebSocket 的实时聊天功能，日活用户 800+；封装 15 个通用组件，代码复用率提升 60%。',
      changeType: 'enhanced',
    },
    {
      title: '实习经历',
      originalContent: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 参与公司官网改版，负责部分页面的前端开发\n• 协助完成组件库文档的整理与更新',
      customizedContent: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 独立负责官网改版中 4 个核心页面的前端开发，按时交付，0 线上 Bug\n• 主导组件库文档重构，新增 20+ 组件示例与使用说明，文档完整度从 40% 提升至 95%\n• 参与团队 Code Review，提出 3 个性能优化建议均被采纳，页面首屏加载时间缩短 30%',
      changeType: 'enhanced',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强，有团队合作精神。',
      customizedContent: '具备完整的前端工程化思维，关注性能与可访问性细节；活跃于开源社区，GitHub 累计 Star 200+，掘金技术文章阅读量 3 万+；能快速上手新技术栈，在团队中主动承担技术方案评审与新人 Mentor 职责。',
      changeType: 'rewritten',
    },
    {
      title: '教育背景',
      originalContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
      customizedContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0，专业排名前 15%　|　主修课程：数据结构、算法设计、操作系统、计算机网络、编译原理\n获奖：校级优秀学生奖学金（2021、2022）；ACM 校内赛三等奖',
      changeType: 'enhanced',
    },
  ],
  '产品经理': [
    {
      title: '项目经历',
      originalContent: '参与开发了一个电商网站，负责前端页面开发。',
      customizedContent: '主导校园二手交易平台从 0 到 1 的产品设计：完成用户调研（深度访谈 30+ 用户，问卷回收 200+），输出竞品分析报告与 PRD；使用 Figma 完成全部原型设计（共 40 个页面）；上线后 30 天 DAU 突破 500，用户留存率 62%，获校级创新创业大赛二等奖。',
      changeType: 'rewritten',
    },
    {
      title: '技能描述',
      originalContent: '熟悉 HTML、CSS、JavaScript，了解 React 框架，有一定的前端开发经验。',
      customizedContent: '熟练使用 Axure / Figma 进行原型设计（可独立完成从线框图到高保真的全流程）；掌握 SQL 基础，可独立完成数据分析与漏斗拆解；了解 A/B 测试方法论，有 Google Analytics 与神策数据分析经验；具备基础技术背景，能与研发高效沟通，减少需求返工。',
      changeType: 'rewritten',
    },
    {
      title: '实习经历',
      originalContent: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 参与公司官网改版，负责部分页面的前端开发\n• 协助完成组件库文档的整理与更新',
      customizedContent: '某互联网公司　产品运营实习生　2023.07 — 2023.09\n• 独立负责 2 个功能模块的需求调研与 PRD 撰写，推动研发按时上线\n• 通过数据分析发现用户流失节点，提出 3 项产品优化建议，其中 2 项被采纳，次月留存率提升 8%\n• 协调设计、研发、测试三方资源，确保项目里程碑零延误',
      changeType: 'rewritten',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强，有团队合作精神。',
      customizedContent: '具备用户同理心与数据驱动决策能力，习惯用数据验证产品假设；善于在用户需求、技术可行性、商业目标之间寻找最优平衡点；有跨职能团队协作经验，能高效推动项目从立项到上线全流程落地，沟通成本低。',
      changeType: 'rewritten',
    },
    {
      title: '教育背景',
      originalContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
      customizedContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0，专业排名前 15%　|　辅修：工商管理（市场营销方向）\n主修课程：人机交互、用户研究方法、数据库原理、软件工程\n获奖：校级创新创业大赛二等奖；互联网+大学生创新创业大赛省级铜奖',
      changeType: 'rewritten',
    },
  ],
  '数据分析师': [
    {
      title: '技能描述',
      originalContent: '熟悉 HTML、CSS、JavaScript，了解 React 框架，有一定的前端开发经验。',
      customizedContent: '熟练掌握 Python（Pandas / NumPy / Matplotlib / Seaborn）进行数据清洗、分析与可视化；熟悉 SQL 多表关联查询、窗口函数与存储过程；了解机器学习基础算法（线性回归、决策树、XGBoost、聚类），有 Kaggle 竞赛经验（Top 15%）；熟悉 Tableau / Power BI 制作数据看板。',
      changeType: 'rewritten',
    },
    {
      title: '项目经历',
      originalContent: '参与开发了一个电商网站，负责前端页面开发。',
      customizedContent: '基于电商平台用户行为数据（50 万+条）构建用户流失预测模型：完成数据清洗与特征工程（处理缺失值、异常值、类别编码），使用 XGBoost 算法，AUC 达 0.87，优于 Baseline 12 个百分点；通过 RFM 模型对用户分层，制定差异化运营策略，帮助业务团队将 30 天复购率提升 12%。',
      changeType: 'rewritten',
    },
    {
      title: '实习经历',
      originalContent: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 参与公司官网改版，负责部分页面的前端开发\n• 协助完成组件库文档的整理与更新',
      customizedContent: '某互联网公司　数据分析实习生　2023.07 — 2023.09\n• 独立完成用户增长漏斗分析，定位 3 个关键流失节点，提出优化建议后次月注册转化率提升 9%\n• 搭建日活/留存/付费率自动化数据看板（Python + Tableau），节省人工汇报 6 小时/周\n• 参与 A/B 测试方案设计与结果分析，支持 2 个功能迭代决策',
      changeType: 'rewritten',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强，有团队合作精神。',
      customizedContent: '具备从业务问题出发、拆解指标、设计分析方案到输出可落地结论的完整数据分析思维；善于用可视化图表向非技术同学传递数据洞察，沟通效率高；对数字敏感，有较强的逻辑推理能力；持续关注数据领域新技术，有 Kaggle 竞赛经验。',
      changeType: 'rewritten',
    },
    {
      title: '教育背景',
      originalContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
      customizedContent: '北京大学　统计学　本科　2020.09 — 2024.06\nGPA：3.6/4.0，专业排名前 10%　|　主修课程：概率论与数理统计、计量经济学、机器学习、数据库原理、Python 数据分析\n获奖：国家励志奖学金；全国大学生数学建模竞赛省级一等奖',
      changeType: 'rewritten',
    },
  ],
  '学科教师': [
    {
      title: '教育背景',
      originalContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
      customizedContent: '北京师范大学　数学与应用数学（师范）　本科　2020.09 — 2024.06\nGPA：3.6/4.0，专业排名前 10%　|　主修课程：教育学原理、教育心理学、数学课程与教学论、班级管理\n获奖：师范生技能大赛校级一等奖；优秀毕业生',
      changeType: 'rewritten',
    },
    {
      title: '实习经历',
      originalContent: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 参与公司官网改版，负责部分页面的前端开发\n• 协助完成组件库文档的整理与更新',
      customizedContent: '某中学　数学教师实习生　2023.09 — 2024.01\n• 独立承担高一数学 2 个班级（共 90 人）的日常教学，完成 60 节课时\n• 设计并实施"函数与导数"单元探究式教学方案，期末测试班级平均分较上学期提升 11 分\n• 担任班主任助理，处理 5 起学生心理辅导案例，家长满意度 100%',
      changeType: 'rewritten',
    },
    {
      title: '技能描述',
      originalContent: '熟悉 HTML、CSS、JavaScript，了解 React 框架，有一定的前端开发经验。',
      customizedContent: '持有教师资格证（高中数学）、普通话二级甲等证书；熟练使用 ClassIn、钉钉直播进行在线授课，累计直播课时 150+；掌握 Canva、PPT 动画制作，课件获学生好评率 95%；了解新课标要求，熟悉高考命题趋势。',
      changeType: 'rewritten',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强，有团队合作精神。',
      customizedContent: '热爱教育事业，熟悉新课标要求，有 200+ 小时一对一面授经验；擅长因材施教，曾将偏科严重的学生数学成绩从 42 分提升至 88 分；具备较强的家长沟通与信任建立能力，所带班级续费率达 88%。',
      changeType: 'rewritten',
    },
    {
      title: '项目经历',
      originalContent: '校园二手交易平台（个人项目）　2023.03 — 2023.06\n参与开发了一个电商网站，负责前端页面开发。',
      customizedContent: '教学设计作品集　2022.09 — 至今\n• 独立设计"概率统计单元"探究式教学方案（含 8 节课教案、配套练习、评估量表），获校级教学设计比赛二等奖\n• 录制 5 节示范课视频（总时长 300 分钟），上传至网盘供学生课后复习，好评率 97%\n• 参与省级教育科研课题"项目式学习在高中数学中的应用研究"，负责数据收集与分析',
      changeType: 'rewritten',
    },
  ],
  '投行分析师': [
    {
      title: '教育背景',
      originalContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
      customizedContent: '北京大学　金融学　本科　2020.09 — 2024.06\nGPA：3.8/4.0，专业排名前 5%，获国家奖学金　|　主修课程：公司金融、证券投资学、金融风险管理、计量经济学、财务报表分析\nCFA Level 1 通过（2023.11）；证券从业资格证（2022.06）',
      changeType: 'rewritten',
    },
    {
      title: '实习经历',
      originalContent: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 参与公司官网改版，负责部分页面的前端开发\n• 协助完成组件库文档的整理与更新',
      customizedContent: '某头部券商投行部　分析师实习生　2023.07 — 2023.09\n• 参与 2 个 IPO 项目尽职调查，独立整理核查财务文件 200+ 份，零差错率\n• 独立完成 3 份行业研究报告（新能源/消费/医药），合计 3 万字，被项目组直接引用\n• 协助搭建 DCF 估值模型，参与路演 PPT 制作（共 60 页），获项目负责人高度评价',
      changeType: 'rewritten',
    },
    {
      title: '技能描述',
      originalContent: '熟悉 HTML、CSS、JavaScript，了解 React 框架，有一定的前端开发经验。',
      customizedContent: '精通 Excel（数据透视表/VLOOKUP/Power Query），可独立搭建 DCF/LBO/可比公司分析等财务模型；熟悉 Wind/Bloomberg 终端操作，可高效提取行情与财务数据；Python 基础（Pandas/Matplotlib），可完成量化数据分析；英语流利（CET-6 620+），可阅读英文研报并参与全英文会议。',
      changeType: 'rewritten',
    },
    {
      title: '项目经历',
      originalContent: '校园二手交易平台（个人项目）　2023.03 — 2023.06\n参与开发了一个电商网站，负责前端页面开发。',
      customizedContent: '新能源行业深度研究报告　2023.03 — 2023.05\n• 独立完成宁德时代 vs 比亚迪竞争格局分析，覆盖产业链、技术路线、财务对比三个维度\n• 搭建 DCF 估值模型，测算两家公司合理估值区间，结论与市场主流观点高度吻合\n• 输出 25 页研究报告，在校内金融社团路演，获评"最佳研究报告"',
      changeType: 'rewritten',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强，有团队合作精神。',
      customizedContent: '对金融市场有持续深度关注，每日阅读财联社、Bloomberg 并维护个人模拟投资组合（年化收益 15%+）；具备较强的数据敏感度与风险意识；英语商务沟通流利，可独立撰写英文研报摘要；能在高压、快节奏环境下高质量交付，实习期间连续 6 周无延误。',
      changeType: 'rewritten',
    },
  ],
  '管理咨询顾问': [
    {
      title: '教育背景',
      originalContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
      customizedContent: '北京大学　工商管理　本科　2020.09 — 2024.06\nGPA：3.8/4.0，专业排名前 5%，获国家奖学金　|　主修课程：战略管理、公司金融、市场营销、运营管理、商业分析\n海外交换：新加坡国立大学（2022.08 — 2023.01）；GMAT 720',
      changeType: 'rewritten',
    },
    {
      title: '实习经历',
      originalContent: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 参与公司官网改版，负责部分页面的前端开发\n• 协助完成组件库文档的整理与更新',
      customizedContent: '某头部管理咨询公司　咨询顾问实习生　2023.07 — 2023.09\n• 作为 3 人项目组核心成员，参与某零售客户华南市场进入策略项目\n• 独立完成 5 个竞品深度访谈与分析，产出 15 页竞争格局报告，结论被纳入最终交付物\n• 搭建市场规模测算模型（TAM/SAM/SOM），协助输出 40 页客户 PPT，获项目经理高度评价',
      changeType: 'rewritten',
    },
    {
      title: '技能描述',
      originalContent: '熟悉 HTML、CSS、JavaScript，了解 React 框架，有一定的前端开发经验。',
      customizedContent: '精通 Excel（数据透视表/VLOOKUP/Power Query/VBA），可独立搭建含敏感性分析的财务模型；PPT 设计遵循麦肯锡金字塔原则，曾独立制作 50 页客户交付报告；Python 基础（Pandas/Matplotlib），可完成数据分析；英语流利（GMAT 720，CET-6 630+），可参与全英文客户会议。',
      changeType: 'rewritten',
    },
    {
      title: '项目经历',
      originalContent: '校园二手交易平台（个人项目）　2023.03 — 2023.06\n参与开发了一个电商网站，负责前端页面开发。',
      customizedContent: 'BCG 校园挑战赛华南区决赛　2023.04\n• 48 小时内独立完成某快消品牌渠道优化策略分析\n• 将问题拆解为渠道效率、消费者触达、成本结构三个维度（MECE），搭建量化评估模型\n• 输出 20 页 PPT 并路演，获评委"逻辑清晰、数据扎实"，进入华南区前 10 名',
      changeType: 'rewritten',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强，有团队合作精神。',
      customizedContent: '具备顶级咨询实习经验，擅长用 MECE 原则结构化拆解复杂商业问题；数据驱动决策，熟练使用 Excel/Python 进行量化分析；英语商务沟通流利（GMAT 720），可独立主导全英文客户会议；能在高压、快节奏环境下高质量交付，实习期间连续 8 周 deadline 零延误。',
      changeType: 'rewritten',
    },
  ],
};

const customSectionsMapExtra: Record<string, CustomSection[]> = {
  '后端开发': [
    {
      title: '技能描述',
      originalContent: '熟悉 Java，了解 Spring 框架，有一定的后端开发经验。',
      customizedContent: '熟练掌握 Java 17 + Spring Boot 3，具备高并发系统设计经验（QPS 5000+）；熟悉 MySQL 索引优化与慢查询分析，单表查询性能提升 60%；掌握 Redis 缓存设计（缓存穿透/雪崩/击穿防护）；了解 Kafka 消息队列，有分布式事务处理经验；熟悉 Docker + K8s 容器化部署。',
      changeType: 'rewritten',
    },
    {
      title: '项目经历',
      originalContent: '参与开发了一个电商系统，负责后端接口开发。',
      customizedContent: '主导开发高并发秒杀系统（Spring Boot + Redis + Kafka）：设计令牌桶限流算法，支持 10000 QPS 峰值流量；通过 Redis 预减库存 + 异步下单，将接口响应时间从 800ms 降至 50ms；引入分布式锁（Redisson）解决超卖问题，系统稳定运行 6 个月零事故。',
      changeType: 'rewritten',
    },
    {
      title: '实习经历',
      originalContent: '某互联网公司　后端开发实习生　2023.07 — 2023.09\n• 参与公司后台系统开发\n• 协助完成接口文档整理',
      customizedContent: '某互联网公司　后端开发实习生　2023.07 — 2023.09\n• 独立负责用户权限模块重构（RBAC 模型），支持细粒度接口级权限控制，覆盖 200+ 接口\n• 优化核心查询接口，通过索引调优和 SQL 重写，响应时间从 1.2s 降至 120ms，QPS 提升 3 倍\n• 编写单元测试（JUnit 5 + Mockito），核心模块覆盖率从 30% 提升至 85%，上线后 Bug 率下降 40%',
      changeType: 'enhanced',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强，有团队合作精神。',
      customizedContent: '具备完整的后端工程化思维，关注系统性能与稳定性；熟悉分布式系统设计原则（CAP/BASE），能在高并发场景下做出合理的技术选型；有代码洁癖，坚持 Clean Code 原则，Code Review 通过率 95%+；持续关注 Java 生态新技术，有 Spring Native 和 GraalVM 实践经验。',
      changeType: 'rewritten',
    },
    {
      title: '教育背景',
      originalContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
      customizedContent: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0，专业排名前 15%　|　主修课程：数据结构、算法设计、操作系统、计算机网络、数据库原理、分布式系统\n获奖：校级优秀学生奖学金（2021、2022）；蓝桥杯 Java 组省级二等奖',
      changeType: 'enhanced',
    },
    {
      title: '开源/个人作品',
      originalContent: '',
      customizedContent: 'GitHub 主页：github.com/example（Star 300+）\n• mini-rpc：基于 Netty 实现的轻量级 RPC 框架，支持服务注册发现（Zookeeper）、负载均衡、熔断降级，Star 180+\n• blog-system：Spring Boot + Vue 3 全栈博客系统，支持 Markdown 编辑、标签分类、全文搜索（Elasticsearch），已部署上线',
      changeType: 'added',
    },
  ],
  '算法/AI': [
    {
      title: '技能描述',
      originalContent: '了解机器学习，会用 Python。',
      customizedContent: '熟练掌握 Python（PyTorch / TensorFlow / Scikit-learn）；深入理解 Transformer 架构，有 LLM 微调（LoRA/QLoRA）实践经验；熟悉计算机视觉（目标检测 YOLO 系列、图像分割）和 NLP（BERT/GPT 系列）；掌握模型压缩与推理加速（量化/剪枝/蒸馏），有 TensorRT 部署经验；熟悉 CUDA 编程基础。',
      changeType: 'rewritten',
    },
    {
      title: '项目经历',
      originalContent: '做了一个图像分类项目。',
      customizedContent: '基于 LLaMA-2 的领域知识问答系统（RAG + LoRA 微调）：构建 10 万条领域语料，使用 LoRA 微调 LLaMA-2-7B，BLEU 分数提升 23%；设计 RAG 检索增强框架（FAISS 向量库 + BM25 混合检索），幻觉率降低 35%；使用 vLLM 部署推理服务，吞吐量提升 4 倍，P99 延迟 < 200ms。',
      changeType: 'rewritten',
    },
    {
      title: '竞赛经历',
      originalContent: '',
      customizedContent: 'Kaggle 竞赛经历：\n• 2023 年 Kaggle NLP 竞赛（文本分类赛道）：Top 8%，使用 DeBERTa-v3 + 集成学习，F1 分数 0.923\n• 2022 年全国大学生数学建模竞赛：省级一等奖，负责模型设计与代码实现\n• LeetCode 解题 400+，周赛最高排名前 5%，擅长动态规划与图论',
      changeType: 'added',
    },
    {
      title: '实习经历',
      originalContent: '某公司　算法实习生　2023.07 — 2023.09\n• 参与模型训练',
      customizedContent: '某大厂 AI 实验室　算法实习生　2023.07 — 2023.09\n• 独立负责推荐系统召回模块优化，将双塔模型替换为 DSSM + 负采样策略，Recall@100 提升 12%\n• 设计并实现特征工程 Pipeline（用户行为序列 + 上下文特征），训练数据规模 5 亿条\n• 使用 TensorRT 对线上模型进行量化压缩，模型体积减少 60%，推理延迟从 8ms 降至 3ms',
      changeType: 'rewritten',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，学习能力强。',
      customizedContent: '对 AI 前沿技术保持高度热情，每周精读 2-3 篇 arXiv 论文并复现核心实验；具备从问题定义到模型上线的完整工程能力；擅长将学术成果工程化落地，注重推理效率与成本控制；有较强的数学基础（线性代数/概率论/最优化），能深入理解模型原理而非仅调参。',
      changeType: 'rewritten',
    },
  ],
  '运营': [
    {
      title: '项目经历',
      originalContent: '参与了一些运营活动。',
      customizedContent: '主导校园社区 App 增长运营（DAU 从 200 → 1500）：设计"邀请有礼"裂变活动，7 天新增用户 800+，获客成本降低 60%；通过用户分层运营（RFM 模型），将 30 天留存率从 22% 提升至 41%；策划 3 场线上直播活动，单场峰值在线 300+，带动 GMV 增长 35%。',
      changeType: 'rewritten',
    },
    {
      title: '技能描述',
      originalContent: '熟悉 Office，会做 PPT。',
      customizedContent: '熟练使用神策数据/GrowingIO 进行用户行为分析与漏斗拆解；掌握 SQL 基础，可独立完成数据提取与分析；熟悉 A/B 测试方法论，有完整的实验设计与结果分析经验；精通 Excel（数据透视表/VLOOKUP），可独立制作运营日报/周报；了解 SEO/SEM 基础，有内容运营和社群运营经验。',
      changeType: 'rewritten',
    },
    {
      title: '实习经历',
      originalContent: '某公司　运营实习生　2023.07 — 2023.09\n• 参与活动策划\n• 协助内容运营',
      customizedContent: '某互联网公司　用户增长运营实习生　2023.07 — 2023.09\n• 独立策划并执行"暑期打卡"活动，参与用户 5000+，带动 DAU 提升 18%，活动 ROI 达 3.2\n• 通过数据分析定位用户流失节点（注册→首次使用转化率仅 35%），提出 3 项产品优化建议，次月转化率提升至 52%\n• 负责微信社群运营（20 个群，共 4000+ 用户），月均活跃率维持在 65% 以上',
      changeType: 'rewritten',
    },
    {
      title: '自我评价',
      originalContent: '认真负责，有创意，喜欢运营。',
      customizedContent: '具备数据驱动的运营思维，习惯用数据验证运营假设，而非凭感觉决策；善于从用户视角出发设计活动和内容，有较强的用户同理心；执行力强，能在有限资源下创造超预期结果；对增长黑客方法论有深入研究，熟悉 AARRR 模型和 PMF 验证方法。',
      changeType: 'rewritten',
    },
    {
      title: '教育背景',
      originalContent: '某大学　市场营销　本科　2020.09 — 2024.06',
      customizedContent: '某大学　市场营销　本科　2020.09 — 2024.06\nGPA：3.4/4.0，专业排名前 20%　|　主修课程：消费者行为学、数字营销、数据分析与决策、品牌管理\n获奖：校级优秀学生干部；互联网+大学生创新创业大赛校级铜奖',
      changeType: 'enhanced',
    },
  ],
};

const changeTypeConfig = {
  enhanced: { label: '强化', color: 'bg-violet-50 text-violet-600 border-violet-200' },
  added: { label: '新增', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rewritten: { label: '重写', color: 'bg-pink-50 text-pink-600 border-pink-200' },
};

/**
 * 完整简历模拟数据。
 * 每个模块的 sectionKey 与 customSectionsMap 中的 title 对应，
 * 导出时 AI 优化内容会替换对应模块的 content。
 */
const fullResumeSections: FullResumeSection[] = [
  {
    sectionKey: '个人信息',
    title: '个人信息',
    content: '姓名：张三　|　电话：138-0000-0000　|　邮箱：zhangsan@example.com　|　求职意向：互联网/科技 · 前端开发',
  },
  {
    sectionKey: '教育背景',
    title: '教育背景',
    content: '北京大学　计算机科学与技术　本科　2020.09 — 2024.06\nGPA：3.5/4.0　|　主修课程：数据结构、算法设计、操作系统、计算机网络',
  },
  {
    sectionKey: '技能描述',
    title: '专业技能',
    content: '熟悉 HTML、CSS、JavaScript，了解 React 框架，有一定的前端开发经验。',
  },
  {
    sectionKey: '实习经历',
    title: '实习经历',
    content: '某互联网公司　前端开发实习生　2023.07 — 2023.09\n• 参与公司官网改版，负责部分页面的前端开发\n• 协助完成组件库文档的整理与更新',
  },
  {
    sectionKey: '项目经历',
    title: '项目经历',
    content: '校园二手交易平台（个人项目）　2023.03 — 2023.06\n参与开发了一个电商网站，负责前端页面开发。',
  },
  {
    sectionKey: '自我评价',
    title: '自我评价',
    content: '认真负责，学习能力强，有团队合作精神。',
  },
];

/** 分析步骤列表，用于 analyzing 状态的逐步动画 */
const ANALYSIS_STEPS = [
  '读取简历文件内容...',
  '识别行业与目标职能...',
  '提取技能关键词标签...',
  '检测量化成果数据...',
  '识别实习/工作经历...',
  '计算各维度能力评分...',
  '生成个性化优化建议...',
  '完成分析报告...',
];

const SESSION_KEY_RESUME_STATE = 'resumePage_uploadState';
const SESSION_KEY_RESUME_NAME = 'resumePage_resumeFileName';
const SESSION_KEY_RESUME_ANALYSIS = 'resumePage_analysisResult';
const SESSION_KEY_RESUME_INDUSTRY = 'resumePage_selectedIndustryId';
const SESSION_KEY_RESUME_JOB = 'resumePage_selectedJob';

function loadSavedAnalysis(): ResumeAnalysisResult | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY_RESUME_ANALYSIS);
    if (saved) return JSON.parse(saved) as ResumeAnalysisResult;
  } catch {
    // ignore
  }
  return null;
}

export default function ResumePage() {
  const navigate = useNavigate();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>(() => {
    const saved = sessionStorage.getItem(SESSION_KEY_RESUME_STATE);
    if (saved === 'done') return 'done';
    return 'idle';
  });
  const [resumeFileName, setResumeFileName] = useState(
    () => sessionStorage.getItem(SESSION_KEY_RESUME_NAME) || ''
  );
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(
    () => loadSavedAnalysis()
  );
  const [analysisStep, setAnalysisStep] = useState(0);
  const [selectedIndustryId, setSelectedIndustryId] = useState(
    () => sessionStorage.getItem(SESSION_KEY_RESUME_INDUSTRY) || 'internet'
  );
  const [selectedJob, setSelectedJob] = useState(
    () => sessionStorage.getItem(SESSION_KEY_RESUME_JOB) || '前端开发'
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [activeTab, setActiveTab] = useState<'suggestions' | 'radar' | 'actions' | 'customize'>('suggestions');
  const [customizingState, setCustomizingState] = useState<'idle' | 'generating' | 'done'>('idle');
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [regeneratingSections, setRegeneratingSections] = useState<Set<number>>(new Set());
  const [regeneratedContents, setRegeneratedContents] = useState<Record<number, string>>({});
  const [jdText, setJdText] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [jdInputMode, setJdInputMode] = useState<'paste' | 'upload'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const selectedIndustry = industries.find((ind) => ind.id === selectedIndustryId) ?? industries[0];

  // 状态变化时持久化到 sessionStorage，切换页面后恢复
  useEffect(() => {
    if (uploadState === 'done' && analysisResult) {
      sessionStorage.setItem(SESSION_KEY_RESUME_STATE, 'done');
      sessionStorage.setItem(SESSION_KEY_RESUME_NAME, resumeFileName);
      sessionStorage.setItem(SESSION_KEY_RESUME_ANALYSIS, JSON.stringify(analysisResult));
      sessionStorage.setItem(SESSION_KEY_RESUME_INDUSTRY, selectedIndustryId);
      sessionStorage.setItem(SESSION_KEY_RESUME_JOB, selectedJob);
    }
  }, [uploadState, analysisResult, resumeFileName, selectedIndustryId, selectedJob]);

  // 分析步骤动画：analyzing 状态下逐步推进步骤指示器
  useEffect(() => {
    if (uploadState !== 'analyzing') {
      setAnalysisStep(0);
      return;
    }
    const totalSteps = ANALYSIS_STEPS.length;
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep += 1;
      setAnalysisStep(currentStep);
      if (currentStep >= totalSteps - 1) {
        clearInterval(stepInterval);
      }
    }, 280);
    return () => clearInterval(stepInterval);
  }, [uploadState]);

  /**
   * 读取文件文本内容（支持 txt；pdf/doc 无法直接读取时使用文件名作为分析依据）
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const isTextReadable = file.type === 'text/plain' || file.name.endsWith('.txt');
      if (isTextReadable) {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(typeof event.target?.result === 'string' ? event.target.result : '');
        };
        reader.onerror = () => resolve('');
        reader.readAsText(file, 'utf-8');
      } else {
        // PDF/Word 无法在纯前端直接解析文本，使用文件名作为分析依据
        resolve('');
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFileName(file.name);
    setUploadState('uploading');

    // 短暂的上传动画后进入分析阶段
    await new Promise((resolve) => setTimeout(resolve, 800));
    setUploadState('analyzing');

    // 读取文件内容（txt 可读，pdf/doc 降级为文件名分析）
    const rawText = await readFileAsText(file);

    // 模拟 AI 分析耗时（与步骤动画同步）
    await new Promise((resolve) => setTimeout(resolve, ANALYSIS_STEPS.length * 280 + 400));

    // 执行简历分析
    const result = analyzeResume(rawText, file.name, file.size);
    setAnalysisResult(result);

    // 自动切换到检测到的行业和职能
    const detectedIndustry = industries.find((ind) => ind.id === result.detectedIndustryId);
    if (detectedIndustry) {
      setSelectedIndustryId(result.detectedIndustryId);
      // 在该行业的职能列表中找最匹配的职能
      const matchedFunction = detectedIndustry.functions.find(
        (fn) => fn.label === result.detectedJobLabel
      );
      setSelectedJob(matchedFunction?.label ?? detectedIndustry.functions[0]?.label ?? '');
    }

    setUploadState('done');
    setCustomizingState('idle');
  };

  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJdFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setJdText(text.slice(0, 3000));
      }
    };
    reader.readAsText(file);
  };

  const handleClearJd = () => {
    setJdText('');
    setJdFileName('');
    if (jdFileInputRef.current) jdFileInputRef.current.value = '';
  };

  const handleGenerateCustom = () => {
    setCustomizingState('generating');
    setRegeneratedContents({});
    setTimeout(() => {
      setCustomizingState('done');
      setExpandedSection(0);
    }, 2500);
  };

  const handleRegenerateSection = (index: number, originalContent: string) => {
    setRegeneratingSections((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setTimeout(() => {
      const variations: Record<number, string[]> = {
        0: [
          '精通 React 18 + TypeScript 全栈开发，主导过 3 个从 0 到 1 的项目；深入理解 Webpack 打包优化，构建速度提升 40%；熟悉微前端架构（qiankun），有跨团队协作落地经验。',
          '熟练掌握 Vue 3 + Composition API，具备大型 SPA 应用架构设计能力；精通 CSS 动画与响应式布局，移动端适配经验丰富；了解 GraphQL，可与后端高效协作。',
        ],
        1: [
          '独立负责企业级后台管理系统前端架构（React + Ant Design Pro），封装 30+ 通用组件，代码复用率提升 60%；引入 E2E 自动化测试（Cypress），线上 Bug 率下降 35%。',
          '主导开发在线教育平台直播功能（WebRTC + Socket.io），支持 500 人同时在线；优化首屏加载策略（懒加载 + CDN），LCP 从 4.2s 降至 1.8s，用户满意度提升 28%。',
        ],
        2: [
          '热爱技术分享，在掘金发布 15 篇前端技术文章，累计阅读量 5 万+；持续关注前端新技术动态，能快速将新技术落地到实际项目；在团队中主动承担新人 Mentor 职责。',
          '具备产品思维，不仅关注代码实现，更关注用户体验与业务价值；善于跨部门沟通，能将技术方案用非技术语言清晰表达；有远程协作经验，能在分布式团队中高效工作。',
        ],
      };
      const options = variations[index] ?? ['已根据最新 JD 关键词重新优化，突出与岗位的匹配度，强化量化成果表达。'];
      const currentContent = regeneratedContents[index];
      const nextContent = options.find((opt) => opt !== currentContent) ?? options[0];
      setRegeneratedContents((prev) => ({ ...prev, [index]: nextContent }));
      setRegeneratingSections((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 1500);
  };

  const jdIsReady = jdText.trim().length > 20;

  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [exportToastVisible, setExportToastVisible] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const fallbackCopyText = (text: string): boolean => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (_err) {
      success = false;
    }
    document.body.removeChild(textArea);
    return success;
  };

  const handleCopyAllContent = () => {
    const currentSections = customSectionsMap[selectedJob] || customSectionsMap['前端开发工程师'];
    const allText = currentSections
      .map((section, index) => {
        const content = regeneratedContents[index] ?? section.customizedContent;
        return `【${section.title}】\n${content}`;
      })
      .join('\n\n');

    const showCopySuccess = () => {
      setCopyToastVisible(true);
      setTimeout(() => setCopyToastVisible(false), 2500);
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(allText).then(showCopySuccess).catch(() => {
        fallbackCopyText(allText);
        showCopySuccess();
      });
    } else {
      fallbackCopyText(allText);
      showCopySuccess();
    }
  };

  const buildReportSections = () => {
    const currentDimensions = radarDimensionsByIndustry[selectedIndustryId] ?? radarDimensionsByIndustry['internet'];
    const currentSuggestions = mockSuggestions.filter((s) => {
      const industryKeys = ['internet', 'education', 'finance', 'consulting'];
      const matchingId = industryKeys.includes(selectedIndustryId) ? selectedIndustryId : 'general';
      return s.industryId === matchingId;
    });
    return { dimensions: currentDimensions, suggestions: currentSuggestions };
  };

  const buildReportPdfHtml = (): string => {
    const dateStr = new Date().toLocaleDateString('zh-CN');
    const { dimensions, suggestions } = buildReportSections();

    const dimensionsHtml = dimensions.map((dim) => {
      const gap = dim.required - dim.current;
      return `
        <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 12px;">
          <span style="width: 80px; font-size: 12px; color: #6b7280; flex-shrink: 0;">${dim.label}</span>
          <div style="flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; position: relative;">
            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${dim.required}%; background: #fca5a5; border-radius: 4px;"></div>
            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${dim.current}%; background: #7c3aed; border-radius: 4px;"></div>
          </div>
          <span style="font-size: 12px; color: ${gap > 0 ? '#f97316' : '#10b981'}; width: 60px; text-align: right; flex-shrink: 0;">
            ${gap > 0 ? `差 ${gap} 分` : '已达标'}
          </span>
        </div>
      `;
    }).join('');

    const suggestionsHtml = suggestions.map((s) => `
      <div style="margin-bottom: 16px; padding: 12px 14px; background: #fafafa; border-left: 3px solid #7c3aed; border-radius: 0 8px 8px 0;">
        <p style="font-size: 13px; font-weight: 700; color: #b91c1c; margin: 0 0 4px 0;">[${s.category}] ${s.issue}</p>
        <p style="font-size: 12px; color: #374151; margin: 0; line-height: 1.7;">→ ${s.suggestion}</p>
      </div>
    `).join('');

    const reportBaseStyle = `
      font-family: "PingFang SC","Microsoft YaHei","Hiragino Sans GB","WenQuanYi Micro Hei",sans-serif;
      font-size: 13px; color: #1f2937; line-height: 1.7;
      padding: 40px 48px; width: 794px; box-sizing: border-box; background: #ffffff;
    `;
    return `
      <div style="${reportBaseStyle}">
        <h1 style="font-size: 20px; font-weight: 800; color: #4c1d95; margin: 0 0 6px 0;">简历优化报告 — ${selectedJobLabel}</h1>
        <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0;">生成时间：${dateStr}</p>
        <hr style="border: none; border-top: 2px solid #ede9fe; margin-bottom: 24px;" />
        <div style="margin-bottom: 20px; padding: 16px; background: #faf5ff; border-radius: 10px; text-align: center;">
          <span style="font-size: 36px; font-weight: 900; color: #f59e0b;">${analysisResult?.overallScore ?? 68}</span>
          <span style="font-size: 14px; color: #6b7280;"> / 100　综合评分</span>
        </div>
        <h2 style="font-size: 15px; font-weight: 700; color: #5b21b6; margin: 0 0 12px 0;">能力差距分析</h2>
        ${dimensionsHtml}
        <h2 style="font-size: 15px; font-weight: 700; color: #5b21b6; margin: 24px 0 12px 0;">优化建议</h2>
        ${suggestionsHtml}
      </div>
    `;
  };

  const exportReportAsPdf = async () => {
    const htmlContent = buildReportPdfHtml();

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '794px';
    container.style.zIndex = '-1';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
      pdf.save(`优化报告_${selectedJob}_${dateStr}.pdf`);
      setExportToastVisible(true);
      setTimeout(() => setExportToastVisible(false), 2500);
    } finally {
      document.body.removeChild(container);
    }
  };

  const exportReportAsDocx = async () => {
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        text: `简历优化报告 — ${selectedJobLabel}`,
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [new TextRun({ text: `生成时间：${new Date().toLocaleDateString('zh-CN')}`, size: 18, color: '888888' })],
        spacing: { after: 200 },
      }),
      new Paragraph({ text: '综合评分：68 / 100', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
      new Paragraph({ text: '能力差距分析', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
    );

    const { dimensions, suggestions } = buildReportSections();
    dimensions.forEach((dim) => {
      const gap = dim.required - dim.current;
      children.push(new Paragraph({
        children: [new TextRun({ text: `${dim.label}：当前 ${dim.current} / 要求 ${dim.required}  ${gap > 0 ? `（差 ${gap} 分）` : '（已达标）'}`, size: 20 })],
        spacing: { after: 80 },
      }));
    });

    children.push(new Paragraph({ text: '优化建议', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    suggestions.forEach((s) => {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `[${s.category}] ${s.issue}`, bold: true, size: 20, color: 'B91C1C' })], spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: `→ ${s.suggestion}`, size: 20 })], spacing: { after: 160 } }),
      );
    });

    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBlob(doc);
    const url = URL.createObjectURL(buffer);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `优化报告_${selectedJob}_${dateStr}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportToastVisible(true);
    setTimeout(() => setExportToastVisible(false), 2500);
  };

  const handleExportReport = () => {
    setShowExportModal(true);
  };

  const handleConfirmExport = (format: 'pdf' | 'docx') => {
    setShowExportModal(false);
    if (format === 'pdf') {
      exportReportAsPdf();
    } else {
      exportReportAsDocx();
    }
  };

  const industrySpecificSuggestions = mockSuggestions.filter((s) => {
    const industryKeys = ['internet', 'education', 'finance', 'consulting'];
    const matchingIndustryId = industryKeys.includes(selectedIndustryId) ? selectedIndustryId : 'general';
    return s.industryId === matchingIndustryId;
  });

  // 雷达图维度：优先使用分析结果中的动态评分，否则使用静态数据
  const radarDimensions = analysisResult
    ? analysisResult.dimensionScores
    : (radarDimensionsByIndustry[selectedIndustryId] ?? radarDimensionsByIndustry['internet']);

  const filteredSuggestions = industrySpecificSuggestions.filter(
    (s) => activeFilter === 'all' || s.level === activeFilter
  );

  const selectedJobLabel = `${selectedIndustry.label} · ${selectedJob}`;

  const resolveCustomSections = (): CustomSection[] => {
    if (customSectionsMap[selectedJob]) return customSectionsMap[selectedJob];
    if (customSectionsMapExtra[selectedJob]) return customSectionsMapExtra[selectedJob];
    const jobKeyMap: Record<string, string> = {
      '前端开发': '前端开发工程师',
      '全栈开发': '前端开发工程师',
      '测试开发': '前端开发工程师',
      'DevOps': '前端开发工程师',
      '数据开发': '数据分析师',
      '数据分析': '数据分析师',
      '产品经理': '产品经理',
      '学科教师': '学科教师',
      '辅导老师': '学科教师',
      '课程设计': '学科教师',
      '教研': '学科教师',
      '教务管理': '学科教师',
      '教育产品': '产品经理',
      '投行分析师': '投行分析师',
      '行业研究员': '投行分析师',
      '量化/算法': '投行分析师',
      '审计': '投行分析师',
      '风控/合规': '投行分析师',
      '资产管理': '投行分析师',
      '管理咨询顾问': '管理咨询顾问',
      '战略分析': '管理咨询顾问',
      'IT 咨询': '管理咨询顾问',
      '税务咨询': '管理咨询顾问',
      '交易服务': '管理咨询顾问',
    };
    const mappedKey = jobKeyMap[selectedJob];
    if (mappedKey && customSectionsMap[mappedKey]) return customSectionsMap[mappedKey];
    if (selectedIndustryId === 'internet') return customSectionsMap['前端开发工程师'];
    if (selectedIndustryId === 'education') return customSectionsMap['学科教师'];
    if (selectedIndustryId === 'finance') return customSectionsMap['投行分析师'];
    if (selectedIndustryId === 'consulting') return customSectionsMap['管理咨询顾问'];
    return customSectionsMap['前端开发工程师'];
  };

  /**
   * 将定制简历模板中的 originalContent 替换为从简历中提取的真实内容。
   * 如果没有分析结果，保留模板中的示例文本。
   */
  const buildCustomSectionsWithRealContent = (templateSections: CustomSection[]): CustomSection[] => {
    if (!analysisResult) return templateSections;
    return templateSections.map((section) => ({
      ...section,
      originalContent: buildOriginalContentFromAnalysis(section.title, analysisResult) || section.originalContent,
    }));
  };

  const customSections = buildCustomSectionsWithRealContent(resolveCustomSections());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 复制成功 Toast */}
      {copyToastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl shadow-xl animate-slide-up">
          <i className="fa-solid fa-circle-check text-emerald-400 text-xs" />
          内容已复制到剪贴板
        </div>
      )}
      {/* 导出成功 Toast */}
      {exportToastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl shadow-xl animate-slide-up">
          <i className="fa-solid fa-circle-check text-emerald-400 text-xs" />
          文件已开始下载
        </div>
      )}

      {/* 导出格式选择弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold text-base">选择导出格式</h3>
              <button onClick={() => setShowExportModal(false)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-xmark text-gray-500 text-xs"></i>
              </button>
            </div>
            <p className="text-gray-400 text-xs mb-5">
              导出「优化报告」，包含能力差距分析与优化建议
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleConfirmExport('pdf')}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 border-rose-200 bg-rose-50 hover:border-rose-400 hover:bg-rose-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <i className="fa-solid fa-file-pdf text-rose-500 text-lg"></i>
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-semibold text-sm">PDF 格式</p>
                  <p className="text-gray-400 text-xs mt-0.5">适合直接投递</p>
                </div>
              </button>
              <button
                onClick={() => handleConfirmExport('docx')}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <i className="fa-solid fa-file-word text-blue-500 text-lg"></i>
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-semibold text-sm">Word 格式</p>
                  <p className="text-gray-400 text-xs mt-0.5">适合继续编辑</p>
                </div>
              </button>
            </div>
            <p className="text-gray-300 text-xs text-center mt-4">内容基于 AI 优化结果，原始内容保留对比</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">简历智能优化</h1>
        <p className="text-gray-400">选择目标岗位，上传简历，AI 深度分析并给出针对性修改建议</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          {uploadState === 'idle' && (
            <div
              className="border-2 border-dashed border-violet-200 rounded-2xl p-8 text-center hover:border-violet-400 hover:bg-violet-50/50 transition-all cursor-pointer group bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-100 transition-colors">
                <i className="fa-solid fa-file-arrow-up text-violet-500 text-xl"></i>
              </div>
              <p className="text-gray-700 font-medium mb-1">上传简历</p>
              <p className="text-gray-400 text-xs">PDF / Word，≤10MB</p>
            </div>
          )}

          {uploadState === 'uploading' && (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin mx-auto mb-3"></div>
              <p className="text-gray-700 font-medium text-sm">上传中...</p>
              <p className="text-gray-400 text-xs mt-1 truncate max-w-full px-2">{resumeFileName}</p>
            </div>
          )}

          {uploadState === 'analyzing' && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-wand-magic-sparkles text-violet-500 animate-pulse"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium text-sm truncate">{resumeFileName}</p>
                  <p className="text-violet-500 text-xs">AI 深度分析中...</p>
                </div>
              </div>
              <div className="space-y-2">
                {ANALYSIS_STEPS.map((step, index) => {
                  const isDone = index < analysisStep;
                  const isActive = index === analysisStep;
                  return (
                    <div key={step} className={`flex items-center gap-2 text-xs transition-all duration-300 ${isDone ? 'text-emerald-600' : isActive ? 'text-violet-600 font-medium' : 'text-gray-300'}`}>
                      {isDone ? (
                        <i className="fa-solid fa-circle-check text-emerald-500 text-xs flex-shrink-0"></i>
                      ) : isActive ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin flex-shrink-0"></div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 flex-shrink-0"></div>
                      )}
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {uploadState === 'done' && analysisResult && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <i className="fa-solid fa-file-check text-emerald-500"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium text-sm truncate">{resumeFileName}</p>
                  <p className="text-gray-400 text-xs">分析完成 · 已识别 {analysisResult.extractedSkills.length} 项技能</p>
                </div>
                <button
                  onClick={() => {
                    setUploadState('idle');
                    setResumeFileName('');
                    setAnalysisResult(null);
                    setCustomizingState('idle');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    sessionStorage.removeItem(SESSION_KEY_RESUME_STATE);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_NAME);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_ANALYSIS);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_INDUSTRY);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_JOB);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 text-xs font-medium transition-all flex-shrink-0"
                >
                  <i className="fa-solid fa-rotate-right text-xs"></i>
                  重新上传
                </button>
              </div>

              <div className="text-center mb-4">
                <div className={`text-5xl font-black mb-1 ${analysisResult.overallScore >= 75 ? 'text-emerald-500' : analysisResult.overallScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {analysisResult.overallScore}
                </div>
                <div className="text-gray-400 text-sm">综合评分 / 100</div>
                <div className="text-xs text-gray-400 mt-0.5">针对「{selectedJobLabel}」</div>
              </div>

              {/* 分析摘要 */}
              {analysisResult.analysisSummary && (
                <div className="mb-3 p-2.5 bg-violet-50 border border-violet-100 rounded-xl">
                  <p className="text-violet-600 text-xs leading-relaxed">
                    <i className="fa-solid fa-robot text-xs mr-1"></i>
                    {analysisResult.analysisSummary}
                  </p>
                </div>
              )}

              <div className="space-y-2.5">
                {analysisResult.scoreBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{item.label}</span>
                      <span className={`font-medium ${item.score >= 75 ? 'text-emerald-600' : item.score >= 55 ? 'text-amber-600' : 'text-rose-500'}`}>
                        {item.score}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${item.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 提取到的技能标签 */}
              {analysisResult.extractedSkills.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-gray-400 text-xs mb-1.5">检测到的技能标签</p>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.extractedSkills.slice(0, 8).map((skill) => (
                      <span key={skill} className="text-xs px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-600 rounded-lg">
                        {skill}
                      </span>
                    ))}
                    {analysisResult.extractedSkills.length > 8 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-400 rounded-lg">
                        +{analysisResult.extractedSkills.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-gray-700 font-medium mb-3 flex items-center gap-2">
              <i className="fa-solid fa-crosshairs text-violet-500 text-sm"></i>
              目标岗位
            </h3>

            {/* 行业维度（第一维） */}
            <p className="text-gray-400 text-xs mb-2 font-medium">① 选行业</p>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {industries.map((industry) => {
                const isActive = selectedIndustryId === industry.id;
                return (
                  <button
                    key={industry.id}
                    onClick={() => {
                      setSelectedIndustryId(industry.id);
                      setSelectedJob(industry.functions[0]?.label ?? '');
                      setCustomizingState('idle');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all text-left ${
                      isActive
                        ? `${industry.color.activeBg} ${industry.color.activeText} border-${industry.color.activeBorder.replace('border-', '')}`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-600'
                    }`}
                  >
                    <i className={`fa-solid ${industry.icon} text-xs flex-shrink-0 ${isActive ? industry.color.iconColor : 'text-gray-400'}`}></i>
                    <span className="truncate">{industry.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 职能维度（第二维） */}
            <p className="text-gray-400 text-xs mb-2 font-medium">② 选职能</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedIndustry.functions.map((fn) => {
                const isActive = selectedJob === fn.label;
                return (
                  <button
                    key={fn.label}
                    onClick={() => { setSelectedJob(fn.label); setCustomizingState('idle'); }}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      isActive
                        ? `${selectedIndustry.color.tagBg} ${selectedIndustry.color.tagText} ${selectedIndustry.color.tagBorder}`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-600'
                    }`}
                  >
                    <i className={`fa-solid ${fn.icon} text-xs`}></i>
                    {fn.label}
                  </button>
                );
              })}
            </div>

            {/* 典型公司参考 */}
            <div className="pt-2.5 border-t border-gray-100">
              <p className="text-gray-400 text-xs mb-1.5">典型公司</p>
              <div className="flex flex-wrap gap-1">
                {selectedIndustry.companies.slice(0, 5).map((company) => (
                  <span key={company} className="text-xs px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg">
                    {company}
                  </span>
                ))}
              </div>
            </div>

            {/* 公考特殊提示 */}
            {selectedIndustry.note && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-700 text-xs flex items-start gap-1.5">
                  <i className="fa-solid fa-circle-info text-xs mt-0.5 flex-shrink-0"></i>
                  {selectedIndustry.note}
                </p>
              </div>
            )}

            {selectedJob && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-violet-500 text-xs"></i>
                <span className="text-gray-400 text-xs">已选：</span>
                <span className="text-violet-600 text-xs font-medium">{selectedJobLabel}</span>
              </div>
            )}
          </div>

          {uploadState === 'done' && analysisResult && (
            <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-2xl p-4">
              <h3 className="text-gray-700 font-medium mb-2 flex items-center gap-2 text-sm">
                <i className="fa-solid fa-lightbulb text-amber-500 text-xs"></i>
                快速提升建议
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                针对 <span className="text-violet-600 font-medium">{selectedJobLabel}</span>，
                {analysisResult.quantifiedResultCount === 0
                  ? '简历中未检测到量化成果，优先为每段经历补充数字（如提升 XX%、覆盖 XX 用户），'
                  : `已检测到 ${analysisResult.quantifiedResultCount} 处量化数据，继续强化项目成果描述，`}
                可将评分从 {analysisResult.overallScore} 提升至 {Math.max(85, Math.min(96, analysisResult.overallScore + 12))}+。
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {uploadState !== 'done' ? (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center min-h-80">
              {uploadState === 'analyzing' ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-wand-magic-sparkles text-violet-400 text-2xl animate-pulse"></i>
                  </div>
                  <p className="text-gray-600 text-lg font-medium mb-2">AI 正在深度分析你的简历...</p>
                  <p className="text-gray-400 text-sm">识别行业、提取技能、计算匹配度</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-file-pen text-violet-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-600 text-lg font-medium mb-2">上传简历后查看优化建议</p>
                  <p className="text-gray-400 text-sm">
                    已选目标岗位：<span className="text-violet-600 ml-1 font-medium">{selectedJobLabel}</span>
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {/* 顶部状态栏：文件名 + 重新上传按钮 */}
              <div className="card p-4 mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium text-sm">{resumeFileName}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      AI 识别：<span className="text-violet-600 font-medium">{analysisResult?.detectedJobLabel}</span>
                      <span className="mx-1.5">·</span>
                      目标：<span className="text-violet-600 font-medium">{selectedJobLabel}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadState('idle');
                    setResumeFileName('');
                    setAnalysisResult(null);
                    setCustomizingState('idle');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    sessionStorage.removeItem(SESSION_KEY_RESUME_STATE);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_NAME);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_ANALYSIS);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_INDUSTRY);
                    sessionStorage.removeItem(SESSION_KEY_RESUME_JOB);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 text-xs font-medium transition-all flex-shrink-0"
                >
                  <i className="fa-solid fa-rotate-right text-xs"></i>
                  重新上传
                </button>
              </div>

              <div className="flex gap-1 mb-5 bg-gray-50 border border-gray-200 rounded-xl p-1">
                {[
                  { key: 'suggestions', label: '优化建议', icon: 'fa-list-check' },
                  { key: 'radar', label: '差距雷达', icon: 'fa-chart-pie' },
                  { key: 'actions', label: '提升清单', icon: 'fa-rocket' },
                  { key: 'customize', label: '定制简历', icon: 'fa-wand-magic-sparkles' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-white text-violet-700 border border-violet-200 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} text-xs`}></i>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 2)}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'suggestions' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-gray-800 font-semibold">
                        优化建议
                        <span className="ml-2 text-gray-400 text-sm font-normal">针对「{selectedJobLabel}」</span>
                      </h2>
                      {analysisResult && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          基于你的简历分析 · 共 {filteredSuggestions.length} 条针对性建议
                          {analysisResult.extractedSkills.length > 0 && (
                            <span className="ml-1">· 已识别技能：{analysisResult.extractedSkills.slice(0, 3).join('、')}{analysisResult.extractedSkills.length > 3 ? '等' : ''}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {(['all', 'high', 'medium', 'low'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setActiveFilter(level)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                            activeFilter === level
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-violet-200'
                          }`}
                        >
                          {level === 'all' ? '全部' : levelConfig[level].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 简历检测摘要条 */}
                  {analysisResult && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex flex-wrap gap-x-4 gap-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <i className="fa-solid fa-magnifying-glass text-xs"></i>
                        <span>检测到 <strong>{analysisResult.extractedSkills.length}</strong> 项技能</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs ${analysisResult.quantifiedResultCount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        <i className={`fa-solid ${analysisResult.quantifiedResultCount > 0 ? 'fa-chart-bar' : 'fa-triangle-exclamation'} text-xs`}></i>
                        <span>量化成果 <strong>{analysisResult.quantifiedResultCount}</strong> 处{analysisResult.quantifiedResultCount === 0 ? '（严重不足）' : ''}</span>
                      </div>
                      {analysisResult.extractedCompanies.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-violet-600">
                          <i className="fa-solid fa-building text-xs"></i>
                          <span>识别到：{analysisResult.extractedCompanies.slice(0, 2).join('、')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <i className="fa-solid fa-file-lines text-xs"></i>
                        <span>简历内容 {analysisResult.textLength > 0 ? `${analysisResult.textLength} 字` : '（PDF/Word 格式，基于文件名分析）'}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {filteredSuggestions.map((suggestion, index) => (
                      <div key={index} className="card p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-9 h-9 rounded-xl ${suggestion.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <i className={`fa-solid ${suggestion.icon} ${suggestion.iconColor} text-sm`}></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-800 font-medium text-sm">{suggestion.category}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${levelConfig[suggestion.level].color}`}>
                                {levelConfig[suggestion.level].label}
                              </span>
                              {/* 量化成果不足时在对应建议上标注「已检测到此问题」 */}
                              {analysisResult && suggestion.category === '数字与成果' && analysisResult.quantifiedResultCount === 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                  <i className="fa-solid fa-circle-dot text-xs mr-1"></i>已在你的简历中检测到
                                </span>
                              )}
                            </div>
                            <p className="text-rose-500 text-sm flex items-start gap-1.5">
                              <i className="fa-solid fa-triangle-exclamation text-xs mt-0.5 flex-shrink-0"></i>
                              {suggestion.issue}
                            </p>
                          </div>
                        </div>
                        <div className="ml-12 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <p className="text-emerald-700 text-xs font-medium mb-1 flex items-center gap-1">
                            <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                            AI 修改建议
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">{suggestion.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'radar' && (
                <div>
                  <h2 className="text-gray-800 font-semibold mb-4">
                    能力差距分析
                    <span className="ml-2 text-gray-400 text-sm font-normal">
                      针对「{selectedJobLabel}」{analysisResult ? ' · 基于你的简历动态计算' : ''}
                    </span>
                  </h2>
                  <div className="card p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="flex-shrink-0">
                        <RadarChart dimensions={radarDimensions} size={240} />
                      </div>
                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex items-center gap-4 text-xs mb-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-1 bg-violet-500 rounded"></div>
                            <span className="text-gray-500">你的现状</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-1 bg-pink-400 rounded opacity-60"></div>
                            <span className="text-gray-500">岗位要求</span>
                          </div>
                        </div>
                        {radarDimensions.map((dim) => {
                          const gap = dim.required - dim.current;
                          return (
                            <div key={dim.label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">{dim.label}</span>
                                <span className={gap > 0 ? 'text-orange-500 font-medium' : 'text-emerald-600 font-medium'}>
                                  {gap > 0 ? `差 ${gap} 分` : '已达标 ✓'}
                                </span>
                              </div>
                              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-pink-200 rounded-full" style={{ width: `${dim.required}%` }}></div>
                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full" style={{ width: `${dim.current}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div>
                  <h2 className="text-gray-800 font-semibold mb-4">
                    可执行提升清单
                    <span className="ml-2 text-gray-400 text-sm font-normal">针对「{selectedJobLabel}」</span>
                  </h2>
                  <div className="space-y-3">
                    {(actionItemsByIndustry[selectedIndustryId] ?? actionItemsByIndustry['general']).map((item, index) => (
                      <div key={index} className="card p-4 flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <i className={`fa-solid ${item.icon} ${item.iconColor} text-base`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <i className="fa-regular fa-clock text-gray-400 text-xs"></i>
                            <span className="text-gray-400 text-xs">预计耗时：{item.timeframe}</span>
                          </div>
                        </div>
                        <button className="flex-shrink-0 w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-violet-50 hover:border-violet-300 transition-all">
                          <i className="fa-solid fa-check text-gray-300 hover:text-violet-500 text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                    <p className="text-violet-700 text-sm font-medium mb-1 flex items-center gap-2">
                      <i className="fa-solid fa-robot text-xs"></i>
                      AI 对话式优化
                    </p>
                    <p className="text-gray-500 text-xs mb-3">用自然语言告诉 AI 你的困惑，获取更个性化的建议</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="如：我投数据分析岗，简历哪里要改？"
                        className="flex-1 px-3 py-2 bg-white border border-violet-200 rounded-xl text-gray-700 placeholder-gray-400 text-xs focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />
                      <button className="px-3 py-2 bg-violet-500 text-white rounded-xl text-xs hover:bg-violet-600 transition-colors">
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'customize' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-gray-800 font-semibold">
                        定制简历
                        <span className="ml-2 text-gray-400 text-sm font-normal">针对「{selectedJobLabel}」</span>
                      </h2>
                      <p className="text-gray-400 text-xs mt-0.5">上传目标公司 JD，AI 逐字对齐关键词，重写简历关键模块</p>
                    </div>
                    {customizingState === 'done' && (
                      <button
                        onClick={() => { setCustomizingState('idle'); handleClearJd(); }}
                        className="btn-outline flex items-center gap-2 text-sm px-4 py-2"
                      >
                        <i className="fa-solid fa-rotate-right text-xs"></i>
                        换 JD 重新生成
                      </button>
                    )}
                  </div>

                  {customizingState === 'idle' && (
                    <div className="space-y-4">
                      {/* JD 输入卡片 */}
                      <div className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-gray-700 font-medium text-sm flex items-center gap-2">
                            <i className="fa-solid fa-file-lines text-violet-500 text-xs"></i>
                            粘贴或上传目标岗位 JD
                          </h3>
                          {/* 切换输入方式 */}
                          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                            {(['paste', 'upload'] as const).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => { setJdInputMode(mode); handleClearJd(); }}
                                className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                                  jdInputMode === mode
                                    ? 'bg-white text-violet-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                {mode === 'paste' ? (
                                  <><i className="fa-solid fa-clipboard text-xs mr-1"></i>粘贴文本</>
                                ) : (
                                  <><i className="fa-solid fa-file-arrow-up text-xs mr-1"></i>上传文件</>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {jdInputMode === 'paste' && (
                          <div className="relative">
                            <textarea
                              value={jdText}
                              onChange={(e) => setJdText(e.target.value)}
                              placeholder={`将招聘 JD 全文粘贴到这里……\n\n例如：\n岗位职责：\n1. 负责前端页面开发与维护\n2. 参与技术方案设计……\n\n任职要求：\n1. 熟练掌握 React/Vue\n2. 有 1 年以上项目经验……`}
                              rows={8}
                              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-300 text-sm leading-relaxed focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none"
                            />
                            {jdText && (
                              <button
                                onClick={handleClearJd}
                                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                              >
                                <i className="fa-solid fa-xmark text-gray-500 text-xs"></i>
                              </button>
                            )}
                            <div className="flex justify-between items-center mt-1.5">
                              <span className="text-gray-300 text-xs">建议粘贴完整 JD，包含岗位职责和任职要求</span>
                              <span className={`text-xs ${jdText.length > 2800 ? 'text-amber-500' : 'text-gray-300'}`}>
                                {jdText.length} / 3000
                              </span>
                            </div>
                          </div>
                        )}

                        {jdInputMode === 'upload' && (
                          <div>
                            <input
                              ref={jdFileInputRef}
                              type="file"
                              accept=".txt,.pdf,.doc,.docx"
                              className="hidden"
                              onChange={handleJdFileChange}
                            />
                            {!jdFileName ? (
                              <div
                                className="border-2 border-dashed border-violet-200 rounded-xl p-8 text-center hover:border-violet-400 hover:bg-violet-50/40 transition-all cursor-pointer group"
                                onClick={() => jdFileInputRef.current?.click()}
                              >
                                <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-100 transition-colors">
                                  <i className="fa-solid fa-file-arrow-up text-violet-400 text-lg"></i>
                                </div>
                                <p className="text-gray-600 text-sm font-medium mb-1">点击上传 JD 文件</p>
                                <p className="text-gray-400 text-xs">支持 TXT / PDF / Word，≤5MB</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                                <div className="w-9 h-9 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
                                  <i className="fa-solid fa-file-lines text-violet-500 text-sm"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-700 text-sm font-medium truncate">{jdFileName}</p>
                                  <p className="text-violet-500 text-xs">已读取 {jdText.length} 字符</p>
                                </div>
                                <button onClick={handleClearJd} className="text-gray-400 hover:text-gray-600 transition-colors">
                                  <i className="fa-solid fa-xmark text-sm"></i>
                                </button>
                              </div>
                            )}
                            {jdText && (
                              <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl max-h-32 overflow-y-auto">
                                <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap">{jdText.slice(0, 300)}{jdText.length > 300 ? '……' : ''}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 功能说明 + 生成按钮 */}
                      <div className="card p-5">
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
                          <div className="flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-check text-violet-400"></i>
                            提取 JD 关键词
                          </div>
                          <div className="flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-check text-violet-400"></i>
                            量化成果强化
                          </div>
                          <div className="flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-check text-violet-400"></i>
                            岗位语言对齐
                          </div>
                        </div>
                        {!jdIsReady ? (
                          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                            <i className="fa-solid fa-circle-info text-xs flex-shrink-0"></i>
                            请先粘贴或上传目标岗位 JD，AI 将根据 JD 内容精准定制简历
                          </div>
                        ) : (
                          <button
                            onClick={handleGenerateCustom}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                          >
                            <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                            根据 JD 开始定制简历
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {customizingState === 'generating' && (
                    <div className="card p-10 text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-700 font-medium mb-1">AI 正在深度定制简历...</p>
                      <p className="text-gray-400 text-sm">
                        {jdFileName ? `解析「${jdFileName}」` : '解析 JD 内容'}，逐字对齐关键词，重写 {customSections.length} 个模块
                      </p>
                      <div className="mt-6 space-y-2 max-w-xs mx-auto">
                        {[
                          '提取 JD 核心关键词与硬性要求',
                          '分析岗位技能匹配度缺口',
                          '匹配你的项目经历与成果',
                          '用 STAR 法则重写项目描述',
                          '量化成果数据强化',
                          '对齐岗位语言与关键词',
                          '重写技能描述与分级',
                          '优化自我评价与个人亮点',
                          '校验 ATS 关键词覆盖率',
                        ].map((step, i) => (
                          <div key={step} className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-4 h-4 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.12}s` }}></div>
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customizingState === 'done' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <i className="fa-solid fa-circle-check text-emerald-500 text-sm flex-shrink-0"></i>
                          <p className="text-emerald-700 text-sm">
                            已完成 <span className="font-bold">{customSections.length}</span> 个模块的深度定制，预计简历评分从 {analysisResult?.overallScore ?? 70} → <span className="font-bold">{Math.max(85, Math.min(96, (analysisResult?.overallScore ?? 70) + 12))}</span>，关键词覆盖率提升 <span className="font-bold">40%</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-6 mt-1">
                          <span className="text-emerald-600 text-xs flex items-center gap-1">
                            <i className="fa-solid fa-file-lines text-emerald-400 text-xs"></i>
                            JD 来源：{jdFileName ? jdFileName : '手动粘贴'}
                          </span>
                          <span className="text-emerald-400 text-xs">·</span>
                          <span className="text-emerald-600 text-xs">岗位：{selectedJobLabel}</span>
                          <span className="text-emerald-400 text-xs">·</span>
                          <span className="text-emerald-600 text-xs flex items-center gap-1">
                            <i className="fa-solid fa-wand-magic-sparkles text-emerald-400 text-xs"></i>
                            STAR 法则重写 · 量化成果强化 · 关键词对齐
                          </span>
                        </div>
                      </div>

                      {customSections.map((section, index) => (
                        <div key={index} className="card overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
                                <i className="fa-solid fa-file-lines text-violet-500 text-xs"></i>
                              </div>
                              <span className="text-gray-800 font-medium text-sm">{section.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${changeTypeConfig[section.changeType].color}`}>
                                {changeTypeConfig[section.changeType].label}
                              </span>
                            </div>
                            <i className={`fa-solid fa-chevron-${expandedSection === index ? 'up' : 'down'} text-gray-400 text-xs`}></i>
                          </button>

                          {expandedSection === index && (
                            <div className="px-4 pb-4 space-y-3">
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <p className="text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1">
                                  <i className="fa-solid fa-file text-xs"></i>
                                  原始内容
                                </p>
                                <p className="text-gray-500 text-sm leading-relaxed">{section.originalContent}</p>
                              </div>
                              <div className="flex items-center justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-violet-500">
                                  <i className="fa-solid fa-arrow-down"></i>
                                  AI 定制优化
                                </div>
                              </div>
                              <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
                                <p className="text-violet-600 text-xs font-medium mb-1.5 flex items-center gap-1">
                                  <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                                  定制后内容
                                </p>
                                {regeneratingSections.has(index) ? (
                                  <div className="flex items-center gap-2 py-2">
                                    <div className="w-3 h-3 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin flex-shrink-0"></div>
                                    <span className="text-violet-500 text-xs">重新生成中...</span>
                                  </div>
                                ) : (
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {regeneratedContents[index] ?? section.customizedContent}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const content = regeneratedContents[index] ?? section.customizedContent;
                                    const showToast = () => {
                                      setCopyToastVisible(true);
                                      setTimeout(() => setCopyToastVisible(false), 2500);
                                    };
                                    if (navigator.clipboard?.writeText) {
                                      navigator.clipboard.writeText(content).then(showToast).catch(() => {
                                        fallbackCopyText(content);
                                        showToast();
                                      });
                                    } else {
                                      fallbackCopyText(content);
                                      showToast();
                                    }
                                  }}
                                  disabled={regeneratingSections.has(index)}
                                  className="flex-1 py-2 text-xs bg-violet-500 text-white rounded-xl hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <i className="fa-solid fa-copy"></i>
                                  复制此内容
                                </button>
                                <button
                                  onClick={() => handleRegenerateSection(index, section.originalContent)}
                                  disabled={regeneratingSections.has(index)}
                                  className="flex-1 py-2 text-xs bg-white border border-gray-200 text-gray-600 rounded-xl hover:border-violet-200 hover:text-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <i className={`fa-solid fa-rotate-right ${regeneratingSections.has(index) ? 'animate-spin' : ''}`}></i>
                                  重新生成
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleCopyAllContent}
                          className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <i className="fa-solid fa-copy"></i>
                          复制全部内容
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab !== 'customize' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleExportReport}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-download"></i>
                    导出优化报告
                  </button>
                  <button
                    onClick={() => navigate('/match')}
                    className="btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-magnifying-glass"></i>
                    重新匹配岗位
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
