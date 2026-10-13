import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyDate {
  date: string;
  event: string;
  urgent: boolean;
  industryId: 'internet' | 'finance' | 'education' | 'fmcg' | 'civil' | 'energy';
}

const industryFilterOptions: { id: KeyDate['industryId']; label: string; icon: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  { id: 'internet', label: '互联网/科技', icon: 'fa-laptop-code', activeBg: 'bg-violet-50', activeText: 'text-violet-700', activeBorder: 'border-violet-300' },
  { id: 'finance', label: '金融/银行', icon: 'fa-landmark', activeBg: 'bg-amber-50', activeText: 'text-amber-700', activeBorder: 'border-amber-300' },
  { id: 'education', label: '教培/教育', icon: 'fa-graduation-cap', activeBg: 'bg-emerald-50', activeText: 'text-emerald-700', activeBorder: 'border-emerald-300' },
  { id: 'fmcg', label: '快消/零售', icon: 'fa-bag-shopping', activeBg: 'bg-pink-50', activeText: 'text-pink-700', activeBorder: 'border-pink-300' },
  { id: 'civil', label: '公考/事业编', icon: 'fa-building-columns', activeBg: 'bg-blue-50', activeText: 'text-blue-700', activeBorder: 'border-blue-300' },
  { id: 'energy', label: '新能源/新材料', icon: 'fa-bolt', activeBg: 'bg-orange-50', activeText: 'text-orange-700', activeBorder: 'border-orange-300' },
];

const jobStages = [
  { id: 'daily', label: '日常实习', icon: 'fa-sun', activeBg: 'bg-violet-50 border-violet-300 text-violet-700' },
  { id: 'summer', label: '暑期实习', icon: 'fa-umbrella-beach', activeBg: 'bg-violet-50 border-violet-300 text-violet-700' },
  { id: 'autumn', label: '秋招', icon: 'fa-leaf', activeBg: 'bg-violet-50 border-violet-300 text-violet-700' },
  { id: 'spring', label: '春招', icon: 'fa-seedling', activeBg: 'bg-violet-50 border-violet-300 text-violet-700' },
];

const dashboardItems = [
  { label: '简历完成度', value: 75, isPercent: true, icon: 'fa-file-lines', bg: 'bg-violet-50', iconColor: 'text-violet-500', textColor: 'text-violet-700' },
  { label: '匹配岗位', value: 10, isPercent: false, icon: 'fa-briefcase', bg: 'bg-violet-50', iconColor: 'text-violet-500', textColor: 'text-violet-700' },
  { label: '已投递', value: 3, isPercent: false, icon: 'fa-paper-plane', bg: 'bg-pink-50', iconColor: 'text-pink-500', textColor: 'text-pink-700' },
  { label: '面试中', value: 1, isPercent: false, icon: 'fa-comments', bg: 'bg-pink-50', iconColor: 'text-pink-500', textColor: 'text-pink-700' },
];

const keyDates: KeyDate[] = [
  { date: '09/01', event: '字节跳动秋招网申截止', urgent: true, industryId: 'internet' },
  { date: '09/05', event: '腾讯校招笔试', urgent: false, industryId: 'internet' },
  { date: '09/12', event: '阿里巴巴群面', urgent: false, industryId: 'internet' },
  { date: '10/15', event: 'Offer 比较截止', urgent: false, industryId: 'internet' },
  { date: '09/15', event: '工商银行秋招网申开放', urgent: false, industryId: 'finance' },
  { date: '09/20', event: '建设银行笔试', urgent: false, industryId: 'finance' },
  { date: '10/10', event: '招商银行管培生面试', urgent: false, industryId: 'finance' },
  { date: '11/30', event: '银行 Offer 发放', urgent: false, industryId: 'finance' },
  { date: '08/20', event: '新东方暑期实习转正答辩', urgent: true, industryId: 'education' },
  { date: '09/10', event: '好未来秋季校招开放', urgent: false, industryId: 'education' },
  { date: '03/15', event: '各地教育局教师招聘公告发布', urgent: false, industryId: 'education' },
  { date: '05/01', event: '教师编制考试', urgent: false, industryId: 'education' },
  { date: '09/01', event: '宝洁秋招网申开放', urgent: false, industryId: 'fmcg' },
  { date: '09/20', event: '联合利华网申截止', urgent: true, industryId: 'fmcg' },
  { date: '10/15', event: '欧莱雅群面', urgent: false, industryId: 'fmcg' },
  { date: '11/10', event: '玛氏 final 面试', urgent: false, industryId: 'fmcg' },
  { date: '11/30', event: '国家公务员考试笔试', urgent: true, industryId: 'civil' },
  { date: '01/08', event: '国考面试', urgent: false, industryId: 'civil' },
  { date: '03/15', event: '省考公告发布', urgent: false, industryId: 'civil' },
  { date: '04/20', event: '省考笔试', urgent: false, industryId: 'civil' },
  { date: '09/01', event: '宁德时代校招网申开放', urgent: false, industryId: 'energy' },
  { date: '09/20', event: '比亚迪校招截止', urgent: true, industryId: 'energy' },
  { date: '10/15', event: '隆基绿能笔试', urgent: false, industryId: 'energy' },
  { date: '11/01', event: '蔚来秋招面试', urgent: false, industryId: 'energy' },
];

// Q 版卡通头像 SVG 组件 — 6 个各具特色的中国学生形象
const AvatarXiaoLin = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="40" cy="40" r="40" fill="#ede9fe"/>
    {/* 脸 */}
    <ellipse cx="40" cy="44" rx="18" ry="20" fill="#fde8d0"/>
    {/* 短发 — 男生寸头 */}
    <ellipse cx="40" cy="28" rx="18" ry="14" fill="#2d1a0e"/>
    <rect x="22" y="28" width="36" height="8" rx="2" fill="#2d1a0e"/>
    {/* 耳朵 */}
    <ellipse cx="22" cy="44" rx="4" ry="5" fill="#fde8d0"/>
    <ellipse cx="58" cy="44" rx="4" ry="5" fill="#fde8d0"/>
    {/* 眼睛 */}
    <ellipse cx="33" cy="42" rx="3.5" ry="4" fill="#1a1a1a"/>
    <ellipse cx="47" cy="42" rx="3.5" ry="4" fill="#1a1a1a"/>
    <circle cx="34.5" cy="41" r="1.2" fill="white"/>
    <circle cx="48.5" cy="41" r="1.2" fill="white"/>
    {/* 眉毛 */}
    <path d="M29 37 Q33 35 37 37" stroke="#2d1a0e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M43 37 Q47 35 51 37" stroke="#2d1a0e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* 嘴巴 — 微笑 */}
    <path d="M35 52 Q40 56 45 52" stroke="#e07b6a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* 衬衫领子 */}
    <path d="M28 64 L40 58 L52 64" fill="#7c3aed" opacity="0.9"/>
  </svg>
);

const AvatarAWen = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="40" cy="40" r="40" fill="#fce7f3"/>
    {/* 脸 */}
    <ellipse cx="40" cy="45" rx="17" ry="19" fill="#fde8d0"/>
    {/* 长发 — 女生 */}
    <ellipse cx="40" cy="27" rx="18" ry="15" fill="#1a0a00"/>
    <rect x="22" y="27" width="5" height="28" rx="3" fill="#1a0a00"/>
    <rect x="53" y="27" width="5" height="28" rx="3" fill="#1a0a00"/>
    <ellipse cx="40" cy="24" rx="18" ry="10" fill="#1a0a00"/>
    {/* 耳朵 */}
    <ellipse cx="23" cy="44" rx="3.5" ry="4.5" fill="#fde8d0"/>
    <ellipse cx="57" cy="44" rx="3.5" ry="4.5" fill="#fde8d0"/>
    {/* 耳环 */}
    <circle cx="23" cy="49" r="2" fill="#f9a8d4" stroke="#ec4899" strokeWidth="0.8"/>
    {/* 眼睛 — 双眼皮 */}
    <ellipse cx="33" cy="43" rx="4" ry="3.5" fill="#1a1a1a"/>
    <ellipse cx="47" cy="43" rx="4" ry="3.5" fill="#1a1a1a"/>
    <circle cx="34.5" cy="42" r="1.3" fill="white"/>
    <circle cx="48.5" cy="42" r="1.3" fill="white"/>
    {/* 眉毛 — 细弯眉 */}
    <path d="M29 38 Q33 36 37 38" stroke="#1a0a00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M43 38 Q47 36 51 38" stroke="#1a0a00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* 腮红 */}
    <ellipse cx="28" cy="49" rx="5" ry="3" fill="#fca5a5" opacity="0.4"/>
    <ellipse cx="52" cy="49" rx="5" ry="3" fill="#fca5a5" opacity="0.4"/>
    {/* 嘴巴 */}
    <path d="M35 53 Q40 57 45 53" stroke="#e07b6a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* 上衣 */}
    <path d="M26 65 L40 59 L54 65" fill="#ec4899" opacity="0.85"/>
  </svg>
);

const AvatarDaZhuang = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="40" cy="40" r="40" fill="#ede9fe"/>
    {/* 脸 — 略宽 */}
    <ellipse cx="40" cy="45" rx="19" ry="20" fill="#fde8d0"/>
    {/* 寸头 */}
    <ellipse cx="40" cy="27" rx="19" ry="13" fill="#3d2b1f"/>
    <rect x="21" y="27" width="38" height="9" rx="2" fill="#3d2b1f"/>
    {/* 耳朵 */}
    <ellipse cx="21" cy="44" rx="4.5" ry="5.5" fill="#fde8d0"/>
    <ellipse cx="59" cy="44" rx="4.5" ry="5.5" fill="#fde8d0"/>
    {/* 眼睛 — 单眼皮 */}
    <ellipse cx="33" cy="43" rx="4" ry="3.5" fill="#1a1a1a"/>
    <ellipse cx="47" cy="43" rx="4" ry="3.5" fill="#1a1a1a"/>
    <circle cx="34.5" cy="42" r="1.3" fill="white"/>
    <circle cx="48.5" cy="42" r="1.3" fill="white"/>
    {/* 眉毛 — 粗平眉 */}
    <path d="M28 37.5 L37 37.5" stroke="#3d2b1f" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M43 37.5 L52 37.5" stroke="#3d2b1f" strokeWidth="2.5" strokeLinecap="round"/>
    {/* 嘴巴 — 咧嘴笑 */}
    <path d="M33 53 Q40 59 47 53" stroke="#e07b6a" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* 衬衫 */}
    <path d="M24 66 L40 59 L56 66" fill="#6366f1" opacity="0.9"/>
  </svg>
);

const AvatarXiaoChen = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="40" cy="40" r="40" fill="#d1fae5"/>
    {/* 脸 */}
    <ellipse cx="40" cy="45" rx="17" ry="19" fill="#fde8d0"/>
    {/* 马尾辫 */}
    <ellipse cx="40" cy="26" rx="18" ry="13" fill="#2d1a0e"/>
    <ellipse cx="40" cy="22" rx="18" ry="9" fill="#2d1a0e"/>
    {/* 马尾 */}
    <path d="M55 24 Q65 20 62 35 Q60 42 55 38" fill="#2d1a0e"/>
    {/* 发箍 */}
    <path d="M22 28 Q40 22 58 28" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none"/>
    {/* 耳朵 */}
    <ellipse cx="23" cy="44" rx="3.5" ry="4.5" fill="#fde8d0"/>
    <ellipse cx="57" cy="44" rx="3.5" ry="4.5" fill="#fde8d0"/>
    {/* 眼睛 */}
    <ellipse cx="33" cy="43" rx="3.8" ry="3.5" fill="#1a1a1a"/>
    <ellipse cx="47" cy="43" rx="3.8" ry="3.5" fill="#1a1a1a"/>
    <circle cx="34.2" cy="42" r="1.2" fill="white"/>
    <circle cx="48.2" cy="42" r="1.2" fill="white"/>
    {/* 眉毛 */}
    <path d="M29 38 Q33 36 37 38" stroke="#2d1a0e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M43 38 Q47 36 51 38" stroke="#2d1a0e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* 腮红 */}
    <ellipse cx="28" cy="49" rx="5" ry="3" fill="#6ee7b7" opacity="0.5"/>
    <ellipse cx="52" cy="49" rx="5" ry="3" fill="#6ee7b7" opacity="0.5"/>
    {/* 嘴巴 */}
    <path d="M35 53 Q40 57 45 53" stroke="#e07b6a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* 上衣 */}
    <path d="M26 65 L40 59 L54 65" fill="#059669" opacity="0.85"/>
  </svg>
);

const AvatarXiaoZhao = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="40" cy="40" r="40" fill="#fef3c7"/>
    {/* 脸 */}
    <ellipse cx="40" cy="44" rx="18" ry="20" fill="#fde8d0"/>
    {/* 发型 — 偏分 */}
    <ellipse cx="40" cy="27" rx="18" ry="14" fill="#1a0a00"/>
    <rect x="22" y="27" width="36" height="8" rx="2" fill="#1a0a00"/>
    {/* 偏分线 */}
    <path d="M32 18 Q36 26 34 32" stroke="#fde8d0" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* 耳朵 */}
    <ellipse cx="22" cy="44" rx="4" ry="5" fill="#fde8d0"/>
    <ellipse cx="58" cy="44" rx="4" ry="5" fill="#fde8d0"/>
    {/* 眼镜框 */}
    <rect x="27" y="39" width="11" height="9" rx="4" stroke="#92400e" strokeWidth="1.8" fill="none"/>
    <rect x="42" y="39" width="11" height="9" rx="4" stroke="#92400e" strokeWidth="1.8" fill="none"/>
    <line x1="38" y1="43.5" x2="42" y2="43.5" stroke="#92400e" strokeWidth="1.5"/>
    {/* 眼睛 */}
    <ellipse cx="32.5" cy="43.5" rx="2.8" ry="2.8" fill="#1a1a1a"/>
    <ellipse cx="47.5" cy="43.5" rx="2.8" ry="2.8" fill="#1a1a1a"/>
    <circle cx="33.5" cy="42.5" r="1" fill="white"/>
    <circle cx="48.5" cy="42.5" r="1" fill="white"/>
    {/* 眉毛 */}
    <path d="M29 37 Q33 35 37 37" stroke="#1a0a00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M43 37 Q47 35 51 37" stroke="#1a0a00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* 嘴巴 */}
    <path d="M35 53 Q40 57 45 53" stroke="#e07b6a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* 西装领 */}
    <path d="M27 65 L40 58 L53 65" fill="#d97706" opacity="0.9"/>
    <path d="M36 58 L40 63 L44 58" fill="white" opacity="0.7"/>
  </svg>
);

const AvatarXiaoYang = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="40" cy="40" r="40" fill="#e0f2fe"/>
    {/* 脸 */}
    <ellipse cx="40" cy="44" rx="18" ry="20" fill="#fde8d0"/>
    {/* 发型 — 商务短发 */}
    <ellipse cx="40" cy="27" rx="18" ry="13" fill="#1a0a00"/>
    <rect x="22" y="27" width="36" height="9" rx="2" fill="#1a0a00"/>
    {/* 两侧鬓角 */}
    <rect x="22" y="32" width="5" height="10" rx="2" fill="#1a0a00"/>
    <rect x="53" y="32" width="5" height="10" rx="2" fill="#1a0a00"/>
    {/* 耳朵 */}
    <ellipse cx="22" cy="44" rx="4" ry="5" fill="#fde8d0"/>
    <ellipse cx="58" cy="44" rx="4" ry="5" fill="#fde8d0"/>
    {/* 眼睛 */}
    <ellipse cx="33" cy="43" rx="3.8" ry="3.5" fill="#1a1a1a"/>
    <ellipse cx="47" cy="43" rx="3.8" ry="3.5" fill="#1a1a1a"/>
    <circle cx="34.2" cy="42" r="1.3" fill="white"/>
    <circle cx="48.2" cy="42" r="1.3" fill="white"/>
    {/* 眉毛 — 英气 */}
    <path d="M28 37 L37 36" stroke="#1a0a00" strokeWidth="2" strokeLinecap="round"/>
    <path d="M43 36 L52 37" stroke="#1a0a00" strokeWidth="2" strokeLinecap="round"/>
    {/* 嘴巴 — 自信微笑 */}
    <path d="M34 53 Q40 57.5 46 53" stroke="#e07b6a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* 西装 */}
    <path d="M25 66 L40 58 L55 66" fill="#0369a1" opacity="0.9"/>
    <path d="M36 58 L40 64 L44 58" fill="white" opacity="0.8"/>
    {/* 领带 */}
    <path d="M40 64 L38 70 L40 72 L42 70 Z" fill="#0ea5e9" opacity="0.9"/>
  </svg>
);

const storyAvatarComponents: Record<string, React.FC> = {
  '小林': AvatarXiaoLin,
  '阿雯': AvatarAWen,
  '大壮': AvatarDaZhuang,
  '小陈': AvatarXiaoChen,
  '小赵': AvatarXiaoZhao,
  '小杨': AvatarXiaoYang,
};

const successStories = [
  {
    name: '小林',
    school: '浙江大学 · 计算机',
    offer: '字节跳动前端',
    tip: '项目经历要量化，我把加载时间从3s优化到0.8s写进去，面试官直接问细节',
    color: 'border-violet-200 bg-violet-50/50',
    badge: 'bg-violet-100 text-violet-700',
  },
  {
    name: '阿雯',
    school: '武汉大学 · 信息管理',
    offer: '腾讯产品经理',
    tip: '没有实习也能拿大厂offer，关键是把课程项目包装成完整的产品案例',
    color: 'border-pink-200 bg-pink-50/50',
    badge: 'bg-pink-100 text-pink-700',
  },
  {
    name: '大壮',
    school: '同济大学 · 软件工程',
    offer: '美团数据分析',
    tip: '数学建模国奖比实习更有说服力，竞赛经历一定要放在显眼位置',
    color: 'border-violet-200 bg-violet-50/30',
    badge: 'bg-violet-100 text-violet-700',
  },
  {
    name: '小陈',
    school: '华东师范大学 · 汉语言文学',
    offer: '新东方语文教师',
    tip: '试讲环节最重要的是互动设计，我准备了 3 套不同风格的导入方案，面试官直接说有想法',
    color: 'border-emerald-200 bg-emerald-50/50',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: '小赵',
    school: '中南财经政法大学 · 金融学',
    offer: '招商银行管培生',
    tip: '银行面试特别看重数字敏感度，我把实习时的客户信用分析报告做了量化总结，群面直接脱颖而出',
    color: 'border-amber-200 bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    name: '小杨',
    school: '复旦大学 · 管理学',
    offer: '麦肯锡咨询顾问',
    tip: '咨询面试 case 是核心，我每天练 2 个 case，坚持了 3 个月，最后终面 case 题刚好练过类似的',
    color: 'border-sky-200 bg-sky-50/50',
    badge: 'bg-sky-100 text-sky-700',
  },
];

const recruitmentTimeline = [
  { month: '7月', label: '暑期实习', desc: '各大厂暑期实习开始转正考核', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  { month: '8月', label: '网申开放', desc: '秋招网申陆续开放，提前批截止', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { month: '9月', label: '笔试高峰', desc: '笔试密集期，注意时间冲突', color: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
  { month: '10月', label: '面试季', desc: '一面/二面/群面集中，HR面', color: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
  { month: '11月', label: 'Offer期', desc: 'Offer陆续发放，注意比较截止', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { month: '12月', label: '补录/春招', desc: '部分岗位补录，春招预热开始', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
];

const frequentInterviewQuestions = [
  { category: '自我介绍', icon: 'fa-user', color: 'text-violet-500', bg: 'bg-violet-50', questions: ['请用1分钟介绍自己', '你最大的优缺点是什么？', '为什么选择我们公司？'] },
  { category: '项目经历', icon: 'fa-code-branch', color: 'text-blue-500', bg: 'bg-blue-50', questions: ['介绍一个你最有挑战的项目', '遇到技术难点如何解决？', '项目中你的具体贡献是什么？'] },
  { category: '职业规划', icon: 'fa-road', color: 'text-emerald-500', bg: 'bg-emerald-50', questions: ['5年后你希望在哪个方向发展？', '为什么选择这个行业？', '你的短期目标是什么？'] },
  { category: '行为面试', icon: 'fa-people-group', color: 'text-pink-500', bg: 'bg-pink-50', questions: ['描述一次团队冲突及解决方式', '你如何在压力下工作？', '举例说明你的领导力'] },
];

const salarySummaryRows = [
  { industry: '互联网/科技', icon: 'fa-laptop-code', internship: '200-400/天', fulltime: '25-50K/月', color: 'text-violet-600', bg: 'bg-violet-50' },
  { industry: '金融/银行', icon: 'fa-landmark', internship: '150-300/天', fulltime: '10-18K/月', color: 'text-amber-600', bg: 'bg-amber-50' },
  { industry: '教培/教育', icon: 'fa-graduation-cap', internship: '120-200/天', fulltime: '8-15K/月', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { industry: '快消/零售', icon: 'fa-bag-shopping', internship: '150-250/天', fulltime: '12-20K/月', color: 'text-pink-600', bg: 'bg-pink-50' },
  { industry: '咨询/审计', icon: 'fa-chart-line', internship: '200-400/天', fulltime: '30-50K/月', color: 'text-blue-600', bg: 'bg-blue-50' },
  { industry: '新能源', icon: 'fa-bolt', internship: '180-300/天', fulltime: '15-25K/月', color: 'text-orange-600', bg: 'bg-orange-50' },
  { industry: '医疗/医药', icon: 'fa-kit-medical', internship: '150-250/天', fulltime: '8-14K/月', color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState('autumn');
  const [selectedIndustryFilters, setSelectedIndustryFilters] = useState<Set<KeyDate['industryId']>>(
    new Set(industryFilterOptions.map((opt) => opt.id))
  );

  const toggleIndustryFilter = (industryId: KeyDate['industryId']) => {
    setSelectedIndustryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(industryId)) {
        if (next.size === 1) return next;
        next.delete(industryId);
      } else {
        next.add(industryId);
      }
      return next;
    });
  };

  const toggleAllIndustries = () => {
    const allSelected = selectedIndustryFilters.size === industryFilterOptions.length;
    if (allSelected) {
      setSelectedIndustryFilters(new Set([industryFilterOptions[0].id]));
    } else {
      setSelectedIndustryFilters(new Set(industryFilterOptions.map((opt) => opt.id)));
    }
  };

  const filteredKeyDates = keyDates.filter((item) => selectedIndustryFilters.has(item.industryId));

  return (
    <div className="relative overflow-hidden">

      {/* Hero 价值主张区域 */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        {/* Hero 卡片容器 */}
        <div className="relative rounded-3xl overflow-hidden border border-violet-200/60 px-8 sm:px-14 py-14 sm:py-16"
          style={{
            background: 'linear-gradient(135deg, rgba(245,243,255,0.95) 0%, rgba(255,255,255,0.98) 40%, rgba(253,244,255,0.95) 100%)',
            boxShadow: '0 8px 48px rgba(124,58,237,0.1), 0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {/* 背景装饰 */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-300/15 rounded-full blur-3xl pointer-events-none animate-float" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-100/20 rounded-full blur-3xl pointer-events-none" />
          {/* 网格纹理 */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          {/* 顶部流光 */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 左侧文案 */}
            <div>
              {/* 品牌标识 */}
              <div className="flex items-center gap-2.5 mb-7 animate-slide-up">
                <div className="relative w-11 h-11">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 blur-sm opacity-50 animate-pulse-glow" />
                  <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-300/40">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                      <rect x="4" y="8" width="16" height="20" rx="2.5" fill="white" fillOpacity="0.95"/>
                      <rect x="6" y="11" width="10" height="1.8" rx="0.9" fill="#a78bfa"/>
                      <rect x="6" y="14.5" width="8" height="1.8" rx="0.9" fill="#c4b5fd"/>
                      <rect x="6" y="18" width="9" height="1.8" rx="0.9" fill="#c4b5fd"/>
                      <rect x="6" y="21.5" width="6" height="1.8" rx="0.9" fill="#ddd6fe"/>
                      <circle cx="23" cy="22" r="7" fill="#7c3aed"/>
                      <circle cx="23" cy="22" r="5.5" fill="white" fillOpacity="0.15"/>
                      <path d="M20 22 L22.2 24.2 L26.5 19.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-gray-900 font-black text-2xl tracking-tight">JobFit</span>
                  <span className="text-violet-400 font-medium" style={{ fontSize: '11px' }}>Where your resume meets the right job.</span>
                </div>
              </div>

              <div className="animate-slide-up-delay-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-200 text-xs font-medium mb-5"
                  style={{ background: 'linear-gradient(135deg, rgba(237,233,254,0.8), rgba(252,231,243,0.6))' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-violet-700">专为大学生打造的 AI 求职助手</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight animate-slide-up-delay-1">
                让简历找到
                <br />
                <span className="gradient-text">最适合你的岗位</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-500 mb-8 leading-relaxed max-w-lg animate-slide-up-delay-2">
                上传简历，AI 自动匹配 BOSS 直聘、实习僧等平台的在招岗位，
                并反向分析简历不足，助你高效求职。
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-slide-up-delay-2">
                <button
                  onClick={() => navigate('/match')}
                  className="btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base"
                >
                  <i className="fa-solid fa-upload text-sm" />
                  上传简历，开始匹配
                </button>
                <button
                  onClick={() => navigate('/resume')}
                  className="btn-outline flex items-center justify-center gap-2 px-6 py-3 text-base"
                >
                  <i className="fa-solid fa-file-pen text-sm" />
                  优化我的简历
                </button>
              </div>

              {/* 求职阶段选择 */}
              <div className="animate-slide-up-delay-3">
                <p className="text-gray-400 text-xs mb-2.5">你现在处于哪个求职阶段？</p>
                <div className="flex flex-wrap gap-2">
                  {jobStages.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => setSelectedStage(stage.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        selectedStage === stage.id
                          ? `${stage.activeBg} shadow-sm`
                          : 'bg-white/80 border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-600 hover:bg-violet-50/50'
                      }`}
                    >
                      <i className={`fa-solid ${stage.icon} text-xs`} />
                      {stage.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧产品预览卡片 */}
            <div className="relative hidden lg:block">
              <div className="relative w-full max-w-sm mx-auto space-y-3">
                {/* 装饰性旋转环 */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-violet-200/40 animate-spin-slow pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full border border-pink-200/40 animate-spin-reverse pointer-events-none" />

                <div className="card card-shine p-4 animate-float" style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-violet-200 shadow-md flex-shrink-0">
                      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
                        <circle cx="40" cy="40" r="40" fill="#ede9fe"/>
                        <ellipse cx="40" cy="44" rx="18" ry="20" fill="#fde8d0"/>
                        <ellipse cx="40" cy="28" rx="18" ry="14" fill="#2d1a0e"/>
                        <rect x="22" y="28" width="36" height="8" rx="2" fill="#2d1a0e"/>
                        <ellipse cx="22" cy="44" rx="4" ry="5" fill="#fde8d0"/>
                        <ellipse cx="58" cy="44" rx="4" ry="5" fill="#fde8d0"/>
                        <ellipse cx="33" cy="42" rx="3.5" ry="4" fill="#1a1a1a"/>
                        <ellipse cx="47" cy="42" rx="3.5" ry="4" fill="#1a1a1a"/>
                        <circle cx="34.5" cy="41" r="1.2" fill="white"/>
                        <circle cx="48.5" cy="41" r="1.2" fill="white"/>
                        <path d="M29 37 Q33 35 37 37" stroke="#2d1a0e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                        <path d="M43 37 Q47 35 51 37" stroke="#2d1a0e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                        <path d="M35 52 Q40 56 45 52" stroke="#e07b6a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                        <path d="M28 64 L40 58 L52 64" fill="#7c3aed" opacity="0.9"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm font-semibold">张同学</p>
                      <p className="text-gray-400 text-xs">浙江大学 · 计算机 · 大四</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full">已认证</span>
                  </div>
                  <div className="space-y-2">
                    {[{ label: '简历完成度', val: 75 }, { label: '岗位匹配度', val: 92 }].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="text-gray-700 font-medium">{item.val}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${item.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card card-shine p-3 animate-float-slow" style={{ boxShadow: '0 6px 24px rgba(124,58,237,0.1)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-briefcase text-emerald-500 text-xs" />
                    </div>
                    <div>
                      <p className="text-gray-800 text-xs font-medium">字节跳动 · 前端实习</p>
                      <p className="text-emerald-600 text-xs">匹配度 92% · 200-300元/天</p>
                    </div>
                    <span className="ml-auto text-xs px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-full whitespace-nowrap">可转正</span>
                  </div>
                </div>

                <div className="card card-shine p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                      <i className="fa-solid fa-wand-magic-sparkles text-violet-500 text-xs" />
                    </div>
                    <p className="text-gray-600 text-xs">AI 已生成 5 条简历优化建议</p>
                    <i className="fa-solid fa-arrow-right text-gray-300 text-xs ml-auto" />
                  </div>
                </div>

                {/* 平台来源标注 */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-gray-400 text-xs">聚合来源：</span>
                  {['BOSS 直聘', '实习僧', '公司官网'].map((platform) => (
                    <span key={platform} className="text-xs px-2 py-0.5 bg-white/80 border border-gray-200 text-gray-500 rounded-lg backdrop-blur-sm">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white/50 backdrop-blur-sm border-y border-violet-100/60 py-10"
        style={{ boxShadow: 'inset 0 1px 0 rgba(139,92,246,0.06), inset 0 -1px 0 rgba(139,92,246,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-gray-800 font-bold text-xl flex items-center gap-2">
              <i className="fa-solid fa-gauge-high text-violet-500"></i>
              我的求职进度
            </h2>
            <button
              onClick={() => navigate('/match')}
              className="text-violet-500 text-sm hover:text-violet-700 flex items-center gap-1 transition-colors"
            >
              查看详情 <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {dashboardItems.map((item, index) => (
              <div key={item.label} className="card card-shine p-4 text-center" style={{ animationDelay: `${index * 0.08}s` }}>
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-3 border border-white/80`}>
                  <i className={`fa-solid ${item.icon} ${item.iconColor} text-base`} />
                </div>
                <div className={`text-2xl font-black mb-0.5 stat-number ${item.textColor}`}>
                  {item.isPercent ? `${item.value}%` : item.value}
                </div>
                <div className="text-gray-400 text-xs">{item.label}</div>
                {item.isPercent && (
                  <div className="mt-2 progress-bar">
                    <div className="progress-fill" style={{ width: `${item.value}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-700 font-medium text-sm flex items-center gap-2">
                <i className="fa-solid fa-bell text-violet-500 text-xs"></i>
                关键节点提醒
              </h3>
              <button
                onClick={toggleAllIndustries}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  selectedIndustryFilters.size === industryFilterOptions.length
                    ? 'bg-violet-50 text-violet-600 border-violet-200'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-violet-200 hover:text-violet-500'
                }`}
              >
                {selectedIndustryFilters.size === industryFilterOptions.length ? '全选中' : '全选'}
              </button>
            </div>

            {/* 行业筛选 chip */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {industryFilterOptions.map((opt) => {
                const isActive = selectedIndustryFilters.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleIndustryFilter(opt.id)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      isActive
                        ? `${opt.activeBg} ${opt.activeText} ${opt.activeBorder}`
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <i className={`fa-solid ${opt.icon} text-xs`}></i>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {filteredKeyDates.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <i className="fa-solid fa-calendar-xmark text-2xl mb-2 block opacity-30"></i>
                暂无该行业的日历节点
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredKeyDates.map((item, index) => {
                  const industryOption = industryFilterOptions.find((opt) => opt.id === item.industryId);
                  return (
                    <div
                      key={`${item.industryId}-${index}`}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                        item.urgent
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          item.urgent ? 'bg-rose-100 text-rose-600' : 'bg-white text-gray-500 border border-gray-200'
                        }`}>
                          {item.date}
                        </div>
                        {item.urgent && (
                          <span className="text-rose-500 font-bold text-xs leading-none">紧急</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-tight mb-1 ${item.urgent ? 'text-rose-600 font-medium' : 'text-gray-600'}`}>
                          {item.event}
                        </p>
                        {industryOption && (
                          <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md border ${industryOption.activeBg} ${industryOption.activeText} ${industryOption.activeBorder}`}>
                            <i className={`fa-solid ${industryOption.icon} text-xs`}></i>
                            {industryOption.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-xs text-violet-600 font-medium mb-3">
            <i className="fa-solid fa-star text-xs" />
            真实上岸故事
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">学长学姐怎么上岸的</h2>
          <p className="text-gray-400 text-sm">真实经历，真实建议</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {successStories.map((story, index) => {
            const AvatarComponent = storyAvatarComponents[story.name];
            return (
              <div key={story.name} className={`card card-shine border ${story.color} p-5`} style={{ animationDelay: `${index * 0.06}s` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm overflow-hidden">
                      {AvatarComponent ? <AvatarComponent /> : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                          {story.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-sm">{story.name}</p>
                    <p className="text-gray-400 text-xs">{story.school}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-400 mb-0.5">拿到</p>
                    <p className={`text-xs font-semibold px-2 py-0.5 rounded-full ${story.badge}`}>{story.offer}</p>
                  </div>
                </div>
                <div className="relative bg-white/70 border border-gray-100 rounded-xl p-3 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-300 to-pink-300 rounded-l-xl" />
                  <p className="text-gray-600 text-xs leading-relaxed pl-2">
                    <i className="fa-solid fa-quote-left text-violet-200 text-sm mr-1" />
                    {story.tip}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-xs text-violet-600 font-medium mb-3">
            <i className="fa-solid fa-toolbox text-xs" />
            求职工具箱
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">求职干货</h2>
          <p className="text-gray-400 text-sm">工具 + 陪伴，不只是匹配</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* 2026秋招时间线 */}
          <div className="card card-shine border border-violet-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200/60 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-calendar-days text-violet-600 text-base" />
              </div>
              <h3 className="text-gray-800 font-semibold">2026秋招时间线</h3>
            </div>
            <div className="space-y-2">
              {recruitmentTimeline.map((item, index) => (
                <div key={item.month} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                    {index < recruitmentTimeline.length - 1 && (
                      <div className="w-px h-5 bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${item.color}`}>{item.month}</span>
                      <span className="text-xs font-medium text-gray-700">{item.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 高频面试题 */}
          <div className="card card-shine border border-pink-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-100 border border-pink-200/60 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-comments text-pink-600 text-base" />
              </div>
              <h3 className="text-gray-800 font-semibold">高频面试题</h3>
            </div>
            <div className="space-y-3">
              {frequentInterviewQuestions.map((group) => (
                <div key={group.category}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-5 h-5 rounded-md ${group.bg} flex items-center justify-center flex-shrink-0`}>
                      <i className={`fa-solid ${group.icon} ${group.color} text-xs`}></i>
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{group.category}</span>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {group.questions.map((question) => (
                      <li key={question} className="text-xs text-gray-500 flex items-start gap-1">
                        <span className="text-gray-300 mt-0.5 flex-shrink-0">·</span>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 全行业薪资参考 */}
          <div className="card border border-emerald-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-sack-dollar text-emerald-600 text-base"></i>
              </div>
              <h3 className="text-gray-800 font-semibold">全行业薪资参考</h3>
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 text-xs text-gray-400 font-medium pb-1 border-b border-gray-100">
                <span>行业</span>
                <span className="text-center">实习</span>
                <span className="text-right">校招</span>
              </div>
              {salarySummaryRows.map((row) => (
                <div key={row.industry} className="grid grid-cols-3 items-center text-xs py-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-md ${row.bg} flex items-center justify-center flex-shrink-0`}>
                      <i className={`fa-solid ${row.icon} ${row.color} text-xs`}></i>
                    </span>
                    <span className="text-gray-600 truncate">{row.industry}</span>
                  </div>
                  <span className="text-center text-gray-500">{row.internship}</span>
                  <span className={`text-right font-medium ${row.color}`}>{row.fulltime}</span>
                </div>
              ))}
              <p className="text-gray-300 text-xs pt-1 border-t border-gray-100">数据仅供参考，以实际 JD 为准</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative rounded-3xl p-10 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(168,85,247,0.08) 40%, rgba(236,72,153,0.06) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
            boxShadow: '0 8px 40px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* 背景光晕 */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-violet-300/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-pink-300/15 rounded-full blur-3xl pointer-events-none animate-float" />
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

          <div className="relative">
            <div className="flex justify-center gap-4 mb-6 text-3xl">
              <span className="animate-float inline-block">🎓</span>
              <span className="animate-float-slow inline-block" style={{ animationDelay: '0.5s' }}>🚀</span>
              <span className="animate-float inline-block" style={{ animationDelay: '1s' }}>💼</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">准备好开始了吗？</h2>
            <p className="text-gray-500 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
              完善学生档案 + 上传简历，AI 帮你找到最匹配的岗位，并给出专属优化建议。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => navigate('/match')} className="btn-primary w-full sm:w-auto">
                <i className="fa-solid fa-rocket mr-2" />
                立即开始求职之旅
              </button>
              <button onClick={() => navigate('/resume')} className="btn-outline w-full sm:w-auto">
                <i className="fa-solid fa-file-pen mr-2" />
                先优化我的简历
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
