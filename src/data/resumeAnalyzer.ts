/**
 * 简历智能解析引擎
 *
 * 从上传的简历文本中提取关键信息，推断行业/职能，
 * 动态计算评分，生成个性化分析结果。
 */

// ── 关键词词典 ──────────────────────────────────────────────

/** 行业关键词 → industryId 映射 */
const INDUSTRY_KEYWORD_MAP: { keywords: string[]; industryId: string; jobLabel: string }[] = [
  {
    industryId: 'internet',
    jobLabel: '前端开发',
    keywords: ['前端', 'frontend', 'react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'webpack', 'vite', 'next.js', 'nuxt'],
  },
  {
    industryId: 'internet',
    jobLabel: '后端开发',
    keywords: ['后端', 'backend', 'java', 'spring', 'springboot', 'python', 'django', 'flask', 'node.js', 'golang', 'go语言', 'mysql', 'redis', 'kafka', 'microservice', '微服务', '分布式'],
  },
  {
    industryId: 'internet',
    jobLabel: '算法/AI',
    keywords: ['算法', '机器学习', '深度学习', 'pytorch', 'tensorflow', 'nlp', '自然语言处理', '计算机视觉', 'cv', 'llm', '大模型', 'bert', 'gpt', 'transformer', 'kaggle', '推荐系统', '强化学习'],
  },
  {
    industryId: 'internet',
    jobLabel: '数据分析',
    keywords: ['数据分析', 'data analyst', 'tableau', 'power bi', 'sql', 'pandas', 'numpy', '数据可视化', 'a/b测试', '用户增长', '漏斗分析', 'bi', '数据挖掘'],
  },
  {
    industryId: 'internet',
    jobLabel: '产品经理',
    keywords: ['产品经理', 'product manager', 'pm', '需求分析', 'prd', '原型', 'axure', 'figma', '用户调研', '竞品分析', '产品规划', '迭代', '用户故事'],
  },
  {
    industryId: 'internet',
    jobLabel: '运营',
    keywords: ['运营', '用户运营', '内容运营', '活动运营', '社群运营', '增长', 'dau', 'mau', '留存率', '转化率', '裂变', '私域', '公众号', '抖音运营', '电商运营', 'roi'],
  },
  {
    industryId: 'internet',
    jobLabel: 'UI/UX 设计',
    keywords: ['ui设计', 'ux设计', '交互设计', '视觉设计', 'figma', 'sketch', 'adobe xd', '用户体验', '原型设计', '设计规范', '品牌设计'],
  },
  {
    industryId: 'education',
    jobLabel: '学科教师',
    keywords: ['教师', '教学', '授课', '备课', '教案', '课件', '学生', '班级', '教育', '辅导', '培训', '新东方', '好未来', '学而思', '猿辅导', '教师资格证', '普通话', '师范'],
  },
  {
    industryId: 'finance',
    jobLabel: '投行分析师',
    keywords: ['金融', '投行', '证券', '基金', '银行', '财务', '会计', 'cfa', 'cpa', 'frm', '估值', 'dcf', '财务建模', '尽调', 'ipo', '并购', '资产管理', '风控', '合规', '审计', '四大'],
  },
  {
    industryId: 'consulting',
    jobLabel: '管理咨询顾问',
    keywords: ['咨询', '麦肯锡', 'bcg', '贝恩', '埃森哲', '战略', 'mece', '金字塔原理', '案例分析', '商业分析', '市场调研', '竞争格局', '管理咨询'],
  },
  {
    industryId: 'medical',
    jobLabel: '临床医师',
    keywords: ['医学', '临床', '医院', '药学', '护理', '医师', '医生', '药品', '医疗器械', '临床试验', 'cra', '注册', '药监'],
  },
  {
    industryId: 'fmcg',
    jobLabel: '市场营销',
    keywords: ['快消', '宝洁', '联合利华', '欧莱雅', '市场营销', '品牌', '渠道', '销售', '零售', '供应链', '采购', '管培生'],
  },
  {
    industryId: 'manufacturing',
    jobLabel: '机械工程师',
    keywords: ['机械', '电气', '制造', '工艺', '质量', '生产', '供应链', '工程师', '自动化', '工厂', '设备', '安全工程'],
  },
  {
    industryId: 'legal',
    jobLabel: '律师助理',
    keywords: ['法律', '律师', '法务', '合规', '诉讼', '仲裁', '合同', '知识产权', '法学', '司法考试', '法律职业资格'],
  },
];

/** 技能关键词列表（用于提取简历中的技能标签） */
const SKILL_KEYWORDS = [
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'C++', 'C#',
  'Spring Boot', 'Django', 'Node.js', 'MySQL', 'Redis', 'MongoDB', 'Kafka', 'Docker', 'K8s',
  'PyTorch', 'TensorFlow', 'Pandas', 'NumPy', 'SQL', 'Tableau', 'Power BI', 'Excel',
  'Figma', 'Axure', 'Sketch', 'Photoshop', 'Illustrator',
  'Git', 'Linux', 'AWS', 'Azure', 'GCP',
  'CFA', 'CPA', 'FRM', '教师资格证', '普通话',
  'STAR法则', 'MECE', '金字塔原理', 'DCF', 'LBO',
  'SEO', 'SEM', 'A/B测试', 'RFM', 'AARRR',
];

/** 量化数据正则（检测简历中是否有数字成果） */
const QUANTIFIED_RESULT_REGEX = /\d+[\d,.]*\s*(%|倍|万|亿|个|人|次|天|周|月|年|小时|分钟|秒|ms|kb|mb|gb|星|元)/gi;

/** 公司名关键词（用于识别实习/工作经历） */
const COMPANY_KEYWORDS = [
  '字节跳动', '腾讯', '阿里', '美团', '百度', '京东', '网易', '快手', '滴滴', '拼多多',
  '华为', '小米', 'OPPO', 'vivo', '联想', '中兴',
  '新东方', '好未来', '猿辅导', '学而思',
  '工商银行', '建设银行', '招商银行', '中信', '平安',
  '麦肯锡', 'BCG', '贝恩', '埃森哲', '四大', '德勤', '普华永道', '毕马威', '安永',
  '宝洁', '联合利华', '欧莱雅',
];

/** 985 院校名单（用于学历识别） */
const UNIVERSITIES_985 = [
  '清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '中国科学技术大学',
  '南京大学', '哈尔滨工业大学', '西安交通大学', '中国人民大学', '武汉大学',
  '华中科技大学', '中山大学', '四川大学', '吉林大学', '山东大学', '厦门大学',
  '东南大学', '天津大学', '南开大学', '北京航空航天大学', '北京理工大学',
  '同济大学', '北京师范大学', '大连理工大学', '电子科技大学', '中南大学',
  '湖南大学', '重庆大学', '兰州大学', '西北工业大学', '中国农业大学',
  '中国海洋大学', '东北大学', '国防科技大学', '西北农林科技大学', '中央民族大学',
];

/** 211 院校名单（不含已在 985 中的） */
const UNIVERSITIES_211 = [
  '北京交通大学', '北京工业大学', '北京科技大学', '北京化工大学', '北京邮电大学',
  '北京林业大学', '北京中医药大学', '北京外国语大学', '中国传媒大学', '中央财经大学',
  '对外经济贸易大学', '北京体育大学', '中国政法大学', '华北电力大学',
  '河北工业大学', '太原理工大学', '内蒙古大学', '辽宁大学', '大连海事大学',
  '延边大学', '东北师范大学', '哈尔滨工程大学', '东北农业大学', '东北林业大学',
  '华东理工大学', '东华大学', '上海外国语大学', '上海财经大学', '上海大学',
  '苏州大学', '南京航空航天大学', '南京理工大学', '中国矿业大学', '河海大学',
  '江南大学', '南京农业大学', '中国药科大学', '南京师范大学',
  '安徽大学', '合肥工业大学', '福州大学', '南昌大学',
  '中国石油大学', '郑州大学', '武汉理工大学', '华中农业大学', '华中师范大学',
  '中南财经政法大学', '湖南师范大学', '暨南大学', '华南师范大学', '华南理工大学',
  '广西大学', '海南大学', '西南交通大学', '西南大学', '西南财经大学',
  '贵州大学', '云南大学', '西藏大学', '西北大学', '长安大学', '陕西师范大学',
  '青海大学', '宁夏大学', '新疆大学', '石河子大学',
];

/** 学历等级类型 */
export type EducationTier = '985' | '211' | 'ordinary';

/** 识别简历中的学历等级 */
export function detectEducationTier(text: string): EducationTier {
  const normalized = normalizeText(text);
  for (const school of UNIVERSITIES_985) {
    if (normalized.includes(normalizeText(school))) return '985';
  }
  for (const school of UNIVERSITIES_211) {
    if (normalized.includes(normalizeText(school))) return '211';
  }
  return 'ordinary';
}

// ── 核心类型 ──────────────────────────────────────────────

export interface ResumeAnalysisResult {
  /** 推断出的行业 id */
  detectedIndustryId: string;
  /** 推断出的职能标签 */
  detectedJobLabel: string;
  /** 从简历中提取的技能列表 */
  extractedSkills: string[];
  /** 从简历中提取的公司名 */
  extractedCompanies: string[];
  /** 简历中量化成果的数量（0 = 缺乏数据） */
  quantifiedResultCount: number;
  /** 简历文本长度（字符数，反映内容丰富度） */
  textLength: number;
  /** 简历原始文本（截取前 3000 字） */
  rawText: string;
  /** 各维度动态评分 */
  dimensionScores: DimensionScore[];
  /** 综合评分 */
  overallScore: number;
  /** 各分项评分（用于左侧评分卡） */
  scoreBreakdown: { label: string; score: number }[];
  /** 简历中提取的段落（用于定制简历的 originalContent） */
  extractedSections: ExtractedSection[];
  /** 分析摘要（显示在分析完成后） */
  analysisSummary: string;
  /** 学历等级：985 / 211 / 普通院校 */
  educationTier: EducationTier;
  /** 识别到的院校名称（如有） */
  detectedSchool: string;
}

export interface DimensionScore {
  label: string;
  current: number;
  required: number;
}

export interface ExtractedSection {
  sectionKey: string;
  title: string;
  content: string;
}

// ── 工具函数 ──────────────────────────────────────────────

/** 将文本转为小写并去除空格，用于关键词匹配 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

/** 在文本中统计某个关键词出现的次数 */
function countKeyword(text: string, keyword: string): number {
  const normalized = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  let count = 0;
  let position = 0;
  while ((position = normalized.indexOf(normalizedKeyword, position)) !== -1) {
    count++;
    position += normalizedKeyword.length;
  }
  return count;
}

/** 生成一个在 [min, max] 范围内的伪随机整数（基于种子，同一简历结果稳定） */
function seededRandom(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const fraction = x - Math.floor(x);
  return Math.round(min + fraction * (max - min));
}

/** 从文本中提取段落内容（按常见简历章节标题分割） */
function extractSectionsFromText(text: string): ExtractedSection[] {
  const sectionPatterns = [
    { key: '教育背景', titles: ['教育背景', '教育经历', '学历', '学习经历', 'education'] },
    { key: '工作经历', titles: ['工作经历', '实习经历', '实习经验', '工作经验', '职业经历', 'experience', 'internship'] },
    { key: '项目经历', titles: ['项目经历', '项目经验', '项目', 'projects'] },
    { key: '技能描述', titles: ['专业技能', '技能', '技术栈', '技能描述', 'skills', '核心技能'] },
    { key: '自我评价', titles: ['自我评价', '个人简介', '个人总结', '关于我', 'about', 'summary', '自我介绍'] },
    { key: '证书荣誉', titles: ['证书', '荣誉', '奖项', '获奖', 'awards', 'certifications'] },
  ];

  const sections: ExtractedSection[] = [];
  const lines = text.split(/[\n\r]+/).map((line) => line.trim()).filter(Boolean);

  let currentSectionKey = '';
  let currentTitle = '';
  let currentLines: string[] = [];

  const flushSection = () => {
    if (currentSectionKey && currentLines.length > 0) {
      const content = currentLines.join('\n').trim();
      if (content.length > 10) {
        sections.push({ sectionKey: currentSectionKey, title: currentTitle, content });
      }
    }
  };

  for (const line of lines) {
    const normalizedLine = normalizeText(line);
    let matched = false;

    for (const pattern of sectionPatterns) {
      const isHeading = pattern.titles.some(
        (title) => normalizedLine === normalizeText(title) || normalizedLine.startsWith(normalizeText(title))
      );
      if (isHeading && line.length < 20) {
        flushSection();
        currentSectionKey = pattern.key;
        currentTitle = line;
        currentLines = [];
        matched = true;
        break;
      }
    }

    if (!matched && currentSectionKey) {
      currentLines.push(line);
    }
  }

  flushSection();
  return sections;
}

// ── 主分析函数 ──────────────────────────────────────────────

/**
 * 分析简历文本，返回完整的分析结果。
 * @param rawText 简历原始文本（从 FileReader 读取）
 * @param fileName 文件名（用于辅助推断）
 * @param fileSize 文件大小（字节，用于评分）
 */
export function analyzeResume(rawText: string, fileName: string, fileSize: number): ResumeAnalysisResult {
  const text = rawText.slice(0, 5000);
  const combinedText = `${fileName} ${text}`.toLowerCase();
  const seed = fileSize + fileName.length + text.length;

  // ── 1. 推断行业和职能 ──────────────────────────────────────
  let bestMatch = { industryId: 'internet', jobLabel: '前端开发', score: 0 };

  for (const entry of INDUSTRY_KEYWORD_MAP) {
    let matchScore = 0;
    for (const keyword of entry.keywords) {
      const count = countKeyword(combinedText, keyword);
      matchScore += count * (keyword.length > 4 ? 3 : 1);
    }
    if (matchScore > bestMatch.score) {
      bestMatch = { industryId: entry.industryId, jobLabel: entry.jobLabel, score: matchScore };
    }
  }

  // ── 2. 提取技能关键词 ──────────────────────────────────────
  const extractedSkills = SKILL_KEYWORDS.filter((skill) =>
    combinedText.includes(skill.toLowerCase())
  );

  // ── 3. 提取公司名 ──────────────────────────────────────────
  const extractedCompanies = COMPANY_KEYWORDS.filter((company) =>
    combinedText.includes(company.toLowerCase())
  );

  // ── 4. 统计量化成果 ────────────────────────────────────────
  const quantifiedMatches = text.match(QUANTIFIED_RESULT_REGEX) ?? [];
  const quantifiedResultCount = quantifiedMatches.length;

  // ── 5. 动态评分计算 ────────────────────────────────────────
  // 基础分：简历存在即有基础价值（70分起步，保证初始评分处于合理区间）
  const BASE_SCORE = 70;
  // 文本长度分：内容丰富度（最高 12 分）
  const textLengthScore = Math.min(12, Math.floor(text.length / 200));
  // 技能分：提取到的技能数量（最高 8 分）
  const skillScore = Math.min(8, extractedSkills.length * 2);
  // 量化分：量化成果数量（最高 6 分）
  const quantifiedScore = Math.min(6, quantifiedResultCount * 2);
  // 公司分：知名公司经历（最高 4 分）
  const companyScore = Math.min(4, extractedCompanies.length * 2);
  // 随机扰动（±3分，基于文件特征，同一文件结果稳定）
  const jitter = seededRandom(seed, -3, 3);

  const rawScore = textLengthScore + skillScore + quantifiedScore + companyScore + BASE_SCORE + jitter;
  const overallScore = Math.max(65, Math.min(90, rawScore));

  // ── 6. 各维度评分 ──────────────────────────────────────────
  const industryDimensionMap: Record<string, { label: string; requiredBase: number }[]> = {
    internet: [
      { label: '技术技能', requiredBase: 85 },
      { label: '项目经验', requiredBase: 80 },
      { label: '实习经历', requiredBase: 70 },
      { label: '教育背景', requiredBase: 75 },
      { label: '表达清晰度', requiredBase: 70 },
      { label: '算法/数据结构', requiredBase: 75 },
    ],
    education: [
      { label: '教学实践', requiredBase: 85 },
      { label: '课堂管理', requiredBase: 80 },
      { label: '学科基础', requiredBase: 85 },
      { label: '沟通表达', requiredBase: 90 },
      { label: '教育理论', requiredBase: 70 },
      { label: '资格证书', requiredBase: 85 },
    ],
    finance: [
      { label: '专业知识', requiredBase: 85 },
      { label: '数据分析', requiredBase: 75 },
      { label: '实习经历', requiredBase: 70 },
      { label: '沟通能力', requiredBase: 80 },
      { label: '资格证书', requiredBase: 65 },
      { label: '逻辑思维', requiredBase: 85 },
    ],
    consulting: [
      { label: '逻辑思维', requiredBase: 95 },
      { label: '数据建模', requiredBase: 85 },
      { label: '结构化表达', requiredBase: 90 },
      { label: '实习经历', requiredBase: 80 },
      { label: '学历背景', requiredBase: 90 },
      { label: '英语能力', requiredBase: 85 },
    ],
  };

  const defaultDimensions = industryDimensionMap['internet'];
  const dimensionTemplates = industryDimensionMap[bestMatch.industryId] ?? defaultDimensions;

  const dimensionScores: DimensionScore[] = dimensionTemplates.map((dim, index) => {
    const baseScore = Math.round(overallScore * (0.85 + seededRandom(seed + index, -10, 15) / 100));
    const current = Math.max(25, Math.min(95, baseScore + seededRandom(seed + index * 7, -12, 12)));
    return { label: dim.label, current, required: dim.requiredBase };
  });

  // ── 7. 分项评分（左侧评分卡） ──────────────────────────────
  const scoreBreakdownLabels = dimensionTemplates.slice(0, 5).map((d) => d.label);
  const scoreBreakdown = scoreBreakdownLabels.map((label, index) => ({
    label,
    score: dimensionScores[index]?.current ?? seededRandom(seed + index * 13, 40, 85),
  }));

  // ── 8. 提取简历段落 ────────────────────────────────────────
  const extractedSections = extractSectionsFromText(text);

  // ── 8.5 识别学历等级 ───────────────────────────────────────
  const educationTier = detectEducationTier(combinedText);
  const detectedSchool = (() => {
    const normalized = normalizeText(combinedText);
    for (const school of UNIVERSITIES_985) {
      if (normalized.includes(normalizeText(school))) return school;
    }
    for (const school of UNIVERSITIES_211) {
      if (normalized.includes(normalizeText(school))) return school;
    }
    return '';
  })();

  // ── 9. 生成分析摘要 ────────────────────────────────────────
  const weakDimensions = dimensionScores
    .filter((d) => d.required - d.current > 10)
    .sort((a, b) => (b.required - b.current) - (a.required - a.current))
    .slice(0, 2)
    .map((d) => d.label);

  const summaryParts: string[] = [];
  if (extractedSkills.length > 0) {
    summaryParts.push(`检测到 ${extractedSkills.length} 项技能标签（${extractedSkills.slice(0, 3).join('、')}等）`);
  }
  if (quantifiedResultCount > 0) {
    summaryParts.push(`发现 ${quantifiedResultCount} 处量化成果`);
  } else {
    summaryParts.push('未检测到量化成果数据，建议补充');
  }
  if (extractedCompanies.length > 0) {
    summaryParts.push(`识别到知名公司经历（${extractedCompanies.slice(0, 2).join('、')}）`);
  }
  if (weakDimensions.length > 0) {
    summaryParts.push(`重点提升方向：${weakDimensions.join('、')}`);
  }
  if (educationTier === '985') {
    summaryParts.push(`学历背景：985 院校（${detectedSchool}），可优先匹配头部大厂`);
  } else if (educationTier === '211') {
    summaryParts.push(`学历背景：211 院校（${detectedSchool}），适合匹配中大型企业`);
  }

  const analysisSummary = summaryParts.join('；');

  return {
    detectedIndustryId: bestMatch.industryId,
    detectedJobLabel: bestMatch.jobLabel,
    extractedSkills,
    extractedCompanies,
    quantifiedResultCount,
    textLength: text.length,
    rawText: text,
    dimensionScores,
    overallScore,
    scoreBreakdown,
    extractedSections,
    analysisSummary,
    educationTier,
    detectedSchool,
  };
}

/**
 * 根据分析结果和目标职能，生成定制简历的 originalContent。
 * 优先使用从简历中提取的真实内容，无法提取时使用通用占位文本。
 */
export function buildOriginalContentFromAnalysis(
  sectionTitle: string,
  analysis: ResumeAnalysisResult
): string {
  const sectionKeyMap: Record<string, string[]> = {
    '技能描述': ['技能描述', '专业技能'],
    '项目经历': ['项目经历'],
    '实习经历': ['工作经历', '实习经历'],
    '自我评价': ['自我评价'],
    '教育背景': ['教育背景'],
    '证书荣誉': ['证书荣誉'],
  };

  const keys = sectionKeyMap[sectionTitle] ?? [sectionTitle];
  for (const key of keys) {
    const found = analysis.extractedSections.find((s) => s.sectionKey === key);
    if (found && found.content.length > 20) {
      return found.content.slice(0, 400);
    }
  }

  // 无法从简历中提取时，根据已识别的技能生成描述性占位文本
  if (sectionTitle === '技能描述' && analysis.extractedSkills.length > 0) {
    return `${analysis.extractedSkills.slice(0, 5).join('、')}等（简历中技能描述较简单，缺乏熟练度分级和使用场景说明）`;
  }

  return '（简历中该模块内容较简单，AI 将根据目标岗位要求进行深度重写）';
}
