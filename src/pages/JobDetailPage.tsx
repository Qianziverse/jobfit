import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockJobs, platformLabels, badgeConfig } from '../data/mockJobs';

function getDaysLeft(deadline: string): number {
  const today = new Date();
  const end = new Date(deadline);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getScoreStyle(score: number) {
  if (score >= 85) return { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
  if (score >= 70) return { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  return { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
}

const lightPlatformColors: Record<string, string> = {
  boss: 'bg-blue-50 text-blue-600 border-blue-200',
  shixiseng: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  official: 'bg-purple-50 text-purple-600 border-purple-200',
};

const lightBadgeColors: Record<string, string> = {
  canConvert: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  remote: 'bg-sky-50 text-sky-600 border-sky-200',
  noExpRequired: 'bg-violet-50 text-violet-600 border-violet-200',
  highSalary: 'bg-amber-50 text-amber-600 border-amber-200',
  fastReply: 'bg-blue-50 text-blue-600 border-blue-200',
  studentOnly: 'bg-pink-50 text-pink-600 border-pink-200',
  campusRecruit: 'bg-orange-50 text-orange-600 border-orange-200',
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg">岗位不存在</p>
        <button onClick={() => navigate('/match')} className="mt-4 text-violet-500 hover:text-violet-700">
          返回岗位列表
        </button>
      </div>
    );
  }

  const daysLeft = getDaysLeft(job.deadline);
  const scoreStyle = getScoreStyle(job.matchScore);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors text-sm"
      >
        <i className="fa-solid fa-arrow-left text-xs"></i>
        返回
      </button>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <img src={job.logo} alt={job.company} className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{job.title}</h1>
            <div className="flex items-center gap-3 text-gray-400 text-sm flex-wrap">
              <span className="flex items-center gap-1"><i className="fa-solid fa-building text-xs"></i>{job.company}</span>
              <span className="flex items-center gap-1"><i className="fa-solid fa-location-dot text-xs"></i>{job.location}</span>
              <span className="flex items-center gap-1"><i className="fa-solid fa-users text-xs"></i>招 {job.headcount} 人</span>
            </div>
          </div>
          <div className={`text-right px-4 py-2 rounded-2xl border ${scoreStyle.bg}`}>
            <div className={`text-3xl font-black ${scoreStyle.text}`}>{job.matchScore}%</div>
            <div className="text-gray-400 text-xs">AI 匹配度</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className={`tag ${lightPlatformColors[job.platform]}`}>
            <i className="fa-solid fa-link text-xs"></i>
            {platformLabels[job.platform]}
          </span>
          <span className={`tag ${job.type === 'intern' ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-violet-50 text-violet-600 border-violet-200'}`}>
            {job.type === 'intern' ? '实习' : '校招'}
          </span>
          <span className="tag bg-gray-50 text-gray-500 border-gray-200">{job.education}及以上</span>
          <span className="tag bg-gray-50 text-gray-500 border-gray-200">{job.experience}经验</span>
          {job.badges?.map((badge) => (
            <span key={badge} className={`tag ${lightBadgeColors[badge] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              <i className={`fa-solid ${badgeConfig[badge].icon} text-xs`}></i>
              {badgeConfig[badge].label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-5">
          <div className="text-center">
            <div className="text-emerald-600 font-bold text-lg">{job.salary}</div>
            <div className="text-gray-400 text-xs mt-0.5">薪资</div>
          </div>
          <div className="text-center">
            <div className="text-gray-700 font-semibold">{job.publishDate}</div>
            <div className="text-gray-400 text-xs mt-0.5">发布时间</div>
          </div>
          <div className="text-center">
            <div className="text-gray-700 font-semibold">{job.deadline}</div>
            <div className="text-gray-400 text-xs mt-0.5">截止时间</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg ${daysLeft <= 7 ? 'text-rose-500' : 'text-amber-500'}`}>
              {daysLeft > 0 ? `${daysLeft} 天` : '已截止'}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">剩余时间</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span key={tag} className="text-sm px-3 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-lg">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h2 className="text-gray-800 font-semibold text-lg mb-4 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-violet-500"></i>
            岗位要求
          </h2>
          <ul className="space-y-3">
            {job.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-600 text-sm">
                <i className="fa-solid fa-circle-dot text-violet-400 text-xs mt-1 flex-shrink-0"></i>
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="text-gray-800 font-semibold text-lg mb-4 flex items-center gap-2">
            <i className="fa-solid fa-file-lines text-sky-500"></i>
            岗位描述
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>

          <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
            <h3 className="text-violet-700 font-medium text-sm mb-2 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
              AI 匹配分析
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              你的简历与该岗位匹配度为 <span className={`font-bold ${scoreStyle.text}`}>{job.matchScore}%</span>。
              主要匹配项：{job.tags.slice(0, 2).join('、')}等技能。
              建议补充项目实战经验和相关实习经历，可进一步提升匹配度。
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 btn-primary flex items-center justify-center gap-2 text-center no-underline"
        >
          <i className="fa-solid fa-paper-plane"></i>
          立即投递
          <i className="fa-solid fa-arrow-up-right-from-square text-xs opacity-70"></i>
        </a>
        <button
          onClick={() => navigate('/resume')}
          className="flex-1 py-3 btn-outline flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-file-pen"></i>
          优化简历后投递
        </button>
        <button className="px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-violet-500 hover:border-violet-200 transition-all">
          <i className="fa-regular fa-bookmark"></i>
        </button>
      </div>
    </div>
  );
}
