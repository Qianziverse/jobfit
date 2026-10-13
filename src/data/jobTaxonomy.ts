/**
 * 行业 × 职能 二维岗位分类体系
 *
 * industry: 行业维度（横轴）
 * functions: 该行业下的典型职能岗位
 * companies: 典型招聘公司，用于展示参考
 */

export interface IndustryFunction {
  /** 职能名称 */
  label: string;
  /** 职能图标 */
  icon: string;
}

export interface Industry {
  id: string;
  label: string;
  icon: string;
  /** 行业标签色系 */
  color: {
    activeBg: string;
    activeText: string;
    activeBorder: string;
    iconColor: string;
    tagBg: string;
    tagText: string;
    tagBorder: string;
  };
  /** 典型公司 */
  companies: string[];
  /** 该行业下的职能列表 */
  functions: IndustryFunction[];
  /** 特殊标注（如公考节奏不同） */
  note?: string;
}

export const industries: Industry[] = [
  {
    id: 'internet',
    label: '互联网/科技',
    icon: 'fa-laptop-code',
    color: {
      activeBg: 'bg-violet-50',
      activeText: 'text-violet-700',
      activeBorder: 'border-violet-300',
      iconColor: 'text-violet-500',
      tagBg: 'bg-violet-50',
      tagText: 'text-violet-700',
      tagBorder: 'border-violet-200',
    },
    companies: ['字节跳动', '腾讯', '阿里巴巴', '美团', '百度', '京东', '网易', '快手'],
    functions: [
      { label: '前端开发', icon: 'fa-code' },
      { label: '后端开发', icon: 'fa-server' },
      { label: '全栈开发', icon: 'fa-layer-group' },
      { label: '算法/AI', icon: 'fa-brain' },
      { label: '数据开发', icon: 'fa-database' },
      { label: '测试开发', icon: 'fa-vial' },
      { label: 'DevOps', icon: 'fa-gears' },
      { label: '产品经理', icon: 'fa-pen-ruler' },
      { label: '数据分析', icon: 'fa-chart-bar' },
      { label: '运营', icon: 'fa-chart-line' },
      { label: 'UI/UX 设计', icon: 'fa-pen-nib' },
      { label: '市场/商务', icon: 'fa-handshake' },
    ],
  },
  {
    id: 'education',
    label: '教培/教育',
    icon: 'fa-graduation-cap',
    color: {
      activeBg: 'bg-sky-50',
      activeText: 'text-sky-700',
      activeBorder: 'border-sky-300',
      iconColor: 'text-sky-500',
      tagBg: 'bg-sky-50',
      tagText: 'text-sky-700',
      tagBorder: 'border-sky-200',
    },
    companies: ['新东方', '好未来', '猿辅导', '学而思', '作业帮', '各地公立学校'],
    functions: [
      { label: '学科教师', icon: 'fa-chalkboard-teacher' },
      { label: '课程设计', icon: 'fa-book-open' },
      { label: '教研', icon: 'fa-microscope' },
      { label: '教务管理', icon: 'fa-clipboard-list' },
      { label: '辅导老师', icon: 'fa-user-graduate' },
      { label: '教育产品', icon: 'fa-pen-ruler' },
      { label: '教育运营', icon: 'fa-chart-line' },
      { label: '招生/销售', icon: 'fa-bullhorn' },
    ],
  },
  {
    id: 'finance',
    label: '金融/银行',
    icon: 'fa-building-columns',
    color: {
      activeBg: 'bg-amber-50',
      activeText: 'text-amber-700',
      activeBorder: 'border-amber-300',
      iconColor: 'text-amber-500',
      tagBg: 'bg-amber-50',
      tagText: 'text-amber-700',
      tagBorder: 'border-amber-200',
    },
    companies: ['工农中建交', '招商银行', '中信银行', '四大会计师事务所', '中金', '中信证券', '华泰证券'],
    functions: [
      { label: '柜员/客户经理', icon: 'fa-user-tie' },
      { label: '风控/合规', icon: 'fa-shield-halved' },
      { label: '投行分析师', icon: 'fa-chart-line' },
      { label: '行业研究员', icon: 'fa-magnifying-glass-chart' },
      { label: '量化/算法', icon: 'fa-calculator' },
      { label: '审计', icon: 'fa-file-invoice' },
      { label: '税务', icon: 'fa-receipt' },
      { label: '资产管理', icon: 'fa-sack-dollar' },
      { label: '精算', icon: 'fa-percent' },
    ],
  },
  {
    id: 'medical',
    label: '医疗/医药',
    icon: 'fa-hospital',
    color: {
      activeBg: 'bg-emerald-50',
      activeText: 'text-emerald-700',
      activeBorder: 'border-emerald-300',
      iconColor: 'text-emerald-500',
      tagBg: 'bg-emerald-50',
      tagText: 'text-emerald-700',
      tagBorder: 'border-emerald-200',
    },
    companies: ['药明康德', '恒瑞医药', '迈瑞医疗', '三甲医院', '阿斯利康', '辉瑞', '强生'],
    functions: [
      { label: '临床医师', icon: 'fa-stethoscope' },
      { label: '医药代表', icon: 'fa-briefcase-medical' },
      { label: '研发工程师', icon: 'fa-flask' },
      { label: '注册/法规', icon: 'fa-file-medical' },
      { label: '临床监察 CRA', icon: 'fa-clipboard-check' },
      { label: '医学事务', icon: 'fa-notes-medical' },
      { label: '生物信息', icon: 'fa-dna' },
      { label: '质量控制 QC', icon: 'fa-magnifying-glass' },
    ],
  },
  {
    id: 'manufacturing',
    label: '制造/工程',
    icon: 'fa-industry',
    color: {
      activeBg: 'bg-orange-50',
      activeText: 'text-orange-700',
      activeBorder: 'border-orange-300',
      iconColor: 'text-orange-500',
      tagBg: 'bg-orange-50',
      tagText: 'text-orange-700',
      tagBorder: 'border-orange-200',
    },
    companies: ['中建集团', '中车', '比亚迪', '宁德时代', '华为（制造）', '富士康', '三一重工'],
    functions: [
      { label: '机械工程师', icon: 'fa-gears' },
      { label: '电气工程师', icon: 'fa-bolt' },
      { label: '项目管理', icon: 'fa-diagram-project' },
      { label: '供应链/采购', icon: 'fa-truck' },
      { label: '工艺工程师', icon: 'fa-wrench' },
      { label: '质量控制', icon: 'fa-circle-check' },
      { label: '生产管理', icon: 'fa-industry' },
      { label: '安全工程师', icon: 'fa-helmet-safety' },
    ],
  },
  {
    id: 'legal',
    label: '法律',
    icon: 'fa-scale-balanced',
    color: {
      activeBg: 'bg-slate-50',
      activeText: 'text-slate-700',
      activeBorder: 'border-slate-300',
      iconColor: 'text-slate-500',
      tagBg: 'bg-slate-50',
      tagText: 'text-slate-700',
      tagBorder: 'border-slate-200',
    },
    companies: ['金杜律师事务所', '方达律师事务所', '君合律师事务所', '中伦', '企业法务部'],
    functions: [
      { label: '律师助理', icon: 'fa-user-tie' },
      { label: '企业法务', icon: 'fa-building' },
      { label: '合规专员', icon: 'fa-shield-halved' },
      { label: '知识产权', icon: 'fa-lightbulb' },
      { label: '诉讼/仲裁', icon: 'fa-gavel' },
      { label: '并购/交易', icon: 'fa-handshake' },
    ],
  },
  {
    id: 'fmcg',
    label: '快消/零售',
    icon: 'fa-cart-shopping',
    color: {
      activeBg: 'bg-pink-50',
      activeText: 'text-pink-700',
      activeBorder: 'border-pink-300',
      iconColor: 'text-pink-500',
      tagBg: 'bg-pink-50',
      tagText: 'text-pink-700',
      tagBorder: 'border-pink-200',
    },
    companies: ['宝洁', '联合利华', '欧莱雅', '玛氏', '伊利', '蒙牛', '农夫山泉'],
    functions: [
      { label: '管培生', icon: 'fa-star' },
      { label: '市场营销', icon: 'fa-bullhorn' },
      { label: '渠道/销售', icon: 'fa-store' },
      { label: '采购', icon: 'fa-boxes-stacked' },
      { label: '供应链', icon: 'fa-truck-fast' },
      { label: '品牌管理', icon: 'fa-tag' },
      { label: '电商运营', icon: 'fa-shop' },
      { label: '财务分析', icon: 'fa-chart-pie' },
    ],
  },
  {
    id: 'realestate',
    label: '地产/建筑',
    icon: 'fa-building',
    color: {
      activeBg: 'bg-teal-50',
      activeText: 'text-teal-700',
      activeBorder: 'border-teal-300',
      iconColor: 'text-teal-500',
      tagBg: 'bg-teal-50',
      tagText: 'text-teal-700',
      tagBorder: 'border-teal-200',
    },
    companies: ['万科', '龙湖', '中建', '保利', '华润置地', '绿城', '招商蛇口'],
    functions: [
      { label: '工程管理', icon: 'fa-hard-hat' },
      { label: '投资/拓展', icon: 'fa-chart-line' },
      { label: '造价工程师', icon: 'fa-calculator' },
      { label: '建筑设计', icon: 'fa-drafting-compass' },
      { label: '营销策划', icon: 'fa-bullhorn' },
      { label: '物业管理', icon: 'fa-key' },
      { label: '项目管理', icon: 'fa-diagram-project' },
    ],
  },
  {
    id: 'consulting',
    label: '咨询/审计',
    icon: 'fa-briefcase',
    color: {
      activeBg: 'bg-indigo-50',
      activeText: 'text-indigo-700',
      activeBorder: 'border-indigo-300',
      iconColor: 'text-indigo-500',
      tagBg: 'bg-indigo-50',
      tagText: 'text-indigo-700',
      tagBorder: 'border-indigo-200',
    },
    companies: ['麦肯锡', 'BCG', '贝恩', '四大（德勤/普华/毕马威/安永）', '埃森哲', 'IBM咨询'],
    functions: [
      { label: '管理咨询顾问', icon: 'fa-lightbulb' },
      { label: '审计', icon: 'fa-file-invoice' },
      { label: '税务咨询', icon: 'fa-receipt' },
      { label: '交易服务', icon: 'fa-handshake' },
      { label: '战略分析', icon: 'fa-chess' },
      { label: 'IT 咨询', icon: 'fa-laptop' },
      { label: '人力资源咨询', icon: 'fa-people-group' },
    ],
  },
  {
    id: 'civil',
    label: '公考/事业编',
    icon: 'fa-landmark',
    color: {
      activeBg: 'bg-red-50',
      activeText: 'text-red-700',
      activeBorder: 'border-red-300',
      iconColor: 'text-red-500',
      tagBg: 'bg-red-50',
      tagText: 'text-red-700',
      tagBorder: 'border-red-200',
    },
    companies: ['各地政府机关', '事业单位', '国有企业', '央企', '军队文职'],
    functions: [
      { label: '国考/省考公务员', icon: 'fa-landmark' },
      { label: '事业单位', icon: 'fa-building-flag' },
      { label: '央企/国企', icon: 'fa-industry' },
      { label: '教师编制', icon: 'fa-chalkboard-teacher' },
      { label: '医院编制', icon: 'fa-hospital' },
      { label: '军队文职', icon: 'fa-shield' },
    ],
    note: '招聘节奏与流程和市场化岗位完全不同，国考通常 10 月报名、11 月笔试',
  },
  {
    id: 'newenergy',
    label: '新能源/新材料',
    icon: 'fa-solar-panel',
    color: {
      activeBg: 'bg-lime-50',
      activeText: 'text-lime-700',
      activeBorder: 'border-lime-300',
      iconColor: 'text-lime-600',
      tagBg: 'bg-lime-50',
      tagText: 'text-lime-700',
      tagBorder: 'border-lime-200',
    },
    companies: ['宁德时代', '隆基绿能', '晶澳科技', '蔚来', '比亚迪', '阳光电源', '天合光能'],
    functions: [
      { label: '研发工程师', icon: 'fa-flask' },
      { label: '工艺工程师', icon: 'fa-wrench' },
      { label: '电池/材料研发', icon: 'fa-atom' },
      { label: '技术支持', icon: 'fa-headset' },
      { label: '测试工程师', icon: 'fa-vial' },
      { label: '项目管理', icon: 'fa-diagram-project' },
      { label: '销售/商务', icon: 'fa-handshake' },
    ],
  },
];

/** 根据行业 id 查找行业 */
export function findIndustryById(id: string): Industry | undefined {
  return industries.find((industry) => industry.id === id);
}
