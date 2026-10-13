import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, platformLabels, platformColors, badgeConfig } from '../data/mockJobs';

interface JobCardProps {
  job: Job;
  overrideScore?: number;
}

function getScoreStyle(score: number) {
  if (score >= 85) return { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
  if (score >= 70) return { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  return { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
}

function getDaysLeft(deadline: string): number {
  const today = new Date();
  const end = new Date(deadline);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const lightPlatformColors: Record<Job['platform'], string> = {
  boss: 'bg-blue-50 text-blue-600 border-blue-200',
  shixiseng: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  official: 'bg-purple-50 text-purple-600 border-purple-200',
};

const lightBadgeConfig: Record<string, string> = {
  canConvert: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  remote: 'bg-sky-50 text-sky-600 border-sky-200',
  noExpRequired: 'bg-violet-50 text-violet-600 border-violet-200',
  highSalary: 'bg-amber-50 text-amber-600 border-amber-200',
  fastReply: 'bg-blue-50 text-blue-600 border-blue-200',
  studentOnly: 'bg-pink-50 text-pink-600 border-pink-200',
  campusRecruit: 'bg-orange-50 text-orange-600 border-orange-200',
};

export default function JobCard({ job, overrideScore }: JobCardProps) {
  const navigate = useNavigate();
  const daysLeft = getDaysLeft(job.deadline);
  const displayScore = overrideScore ?? job.matchScore;
  const scoreStyle = getScoreStyle(displayScore);

  return (
    <div
      className="card p-5 cursor-pointer group"
      onClick={() => navigate(`/job/${job.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={job.logo}
            alt={job.company}
            className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-gray-800 font-semibold text-sm group-hover:text-violet-600 transition-colors truncate">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-gray-500 text-xs">{job.company}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-gray-400 text-xs">{job.location}</span>
            </div>
          </div>
        </div>
        <div className={`flex flex-col items-center px-2.5 py-1 rounded-xl border flex-shrink-0 ml-2 ${scoreStyle.bg}`}>
          <span className={`text-lg font-black leading-none ${scoreStyle.text}`}>
            {displayScore}
          </span>
          <span className="text-gray-400 text-xs">匹配</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className={`tag ${lightPlatformColors[job.platform]}`}>
          {platformLabels[job.platform]}
        </span>
        <span className={`tag ${
          job.type === 'intern'
            ? 'bg-sky-50 text-sky-600 border-sky-200'
            : 'bg-violet-50 text-violet-600 border-violet-200'
        }`}>
          {job.type === 'intern' ? '实习' : '校招'}
        </span>
        <span className="text-emerald-600 font-semibold text-sm ml-auto">{job.salary}</span>
      </div>

      {job.badges && job.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.badges.slice(0, 3).map((badge) => {
            const config = badgeConfig[badge];
            const lightColor = lightBadgeConfig[badge] || 'bg-gray-50 text-gray-500 border-gray-200';
            return (
              <span key={badge} className={`tag ${lightColor}`}>
                <i className={`fa-solid ${config.icon} text-xs`}></i>
                {config.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-md">
            {tag}
          </span>
        ))}
        {job.tags.length > 3 && (
          <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-md">
            +{job.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
        <span>
          <i className="fa-regular fa-calendar mr-1"></i>
          {job.publishDate}
        </span>
        <span className={daysLeft <= 7 ? 'text-rose-500 font-medium' : ''}>
          <i className="fa-regular fa-clock mr-1"></i>
          {daysLeft > 0 ? `还剩 ${daysLeft} 天` : '已截止'}
        </span>
      </div>
    </div>
  );
}
