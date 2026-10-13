import React, { useState, useRef } from 'react';
import { mockJobs } from '../data/mockJobs';
import { industries } from '../data/jobTaxonomy';
import { analyzeResume, ResumeAnalysisResult } from '../data/resumeAnalyzer';
import JobCard from '../components/JobCard';

type FilterType = 'all' | 'intern' | 'fulltime';
type PlatformFilter = 'all' | 'boss' | 'shixiseng' | 'official';

const SESSION_KEY_UPLOAD_STATE = 'matchPage_uploadState';
const SESSION_KEY_RESUME_NAME = 'matchPage_resumeFileName';
const SESSION_KEY_SELECTED_INDUSTRIES = 'matchPage_selectedIndustries';
const SESSION_KEY_SELECTED_FUNCTIONS = 'matchPage_selectedFunctions';
const SESSION_KEY_RESUME_ANALYSIS = 'matchPage_resumeAnalysis';

interface UserSelection {
  industryIds: string[];
  functionLabels: string[];
}

function loadSavedAnalysis(): ResumeAnalysisResult | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY_RESUME_ANALYSIS);
    if (saved) return JSON.parse(saved) as ResumeAnalysisResult;
  } catch {
    // ignore parse errors
  }
  return null;
}

/**
 * 计算简历与岗位的动态匹配分（0-100）。
 *
 * 评分维度：
 * 1. 行业匹配（25分）：简历检测行业 vs 岗位 industryId
 * 2. 职能匹配（25分）：简历检测职能 vs 岗位 jobFunction
 * 3. 技能重叠（25分）：简历提取技能 vs 岗位 tags/requirements 中的技能词
 * 4. 用户手动选择加成（10分）：用户选择的行业/职能与岗位匹配
 * 5. 学历-公司等级匹配（15分）：985→大厂, 211→中型, 普通→小型
 */
function computeDynamicMatchScore(
  job: typeof mockJobs[0],
  analysis: ResumeAnalysisResult,
  userSelection: UserSelection
): number {
  let score = 0;

  const jobFunctionLower = (job.jobFunction ?? '').toLowerCase();
  const jobTitleLower = job.title.toLowerCase();
  const jobTagsLower = job.tags.map((t) => t.toLowerCase());
  const jobRequirementsText = job.requirements.join(' ').toLowerCase();

  // ── 1. 行业匹配（最高 25 分）──────────────────────────────
  if (analysis.detectedIndustryId === job.industryId) {
    score += 25;
  }

  // ── 2. 职能匹配（最高 25 分）──────────────────────────────
  const detectedJobLabelLower = analysis.detectedJobLabel.toLowerCase();

  const jobFunctionMatchScore = (() => {
    if (jobFunctionLower === detectedJobLabelLower) return 25;
    if (jobFunctionLower.includes(detectedJobLabelLower) || detectedJobLabelLower.includes(jobFunctionLower)) return 20;
    if (jobTitleLower.includes(detectedJobLabelLower) || detectedJobLabelLower.includes(jobTitleLower)) return 15;
    return 0;
  })();
  score += jobFunctionMatchScore;

  // ── 3. 技能重叠（最高 25 分）──────────────────────────────
  if (analysis.extractedSkills.length > 0) {
    let skillMatchCount = 0;
    for (const skill of analysis.extractedSkills) {
      const skillLower = skill.toLowerCase();
      const foundInTags = jobTagsLower.some((tag) => tag.includes(skillLower) || skillLower.includes(tag));
      const foundInRequirements = jobRequirementsText.includes(skillLower);
      if (foundInTags || foundInRequirements) {
        skillMatchCount++;
      }
    }
    const skillRatio = skillMatchCount / Math.max(analysis.extractedSkills.length, 1);
    score += Math.round(skillRatio * 25);
  }

  // ── 4. 用户手动选择加成（最高 10 分）──────────────────────
  const userSelectedIndustry = userSelection.industryIds.includes(job.industryId);
  const userSelectedFunction = userSelection.functionLabels.some(
    (fn) => fn.toLowerCase() === jobFunctionLower || jobFunctionLower.includes(fn.toLowerCase())
  );
  if (userSelectedIndustry) score += 5;
  if (userSelectedFunction) score += 5;

  // ── 5. 学历-公司等级匹配（最高 15 分）──────────────────────
  // 985 院校 → 优先匹配头部大厂；211 → 中型企业；普通 → 小型/创业公司
  const tier = analysis.educationTier;
  const companyTier = job.companyTier;
  if (tier === '985') {
    if (companyTier === 'top') score += 15;
    else if (companyTier === 'mid') score += 10;
    else score += 5;
  } else if (tier === '211') {
    if (companyTier === 'mid') score += 15;
    else if (companyTier === 'top') score += 8;
    else score += 10;
  } else {
    // 普通院校：小型公司最匹配，中型次之，大厂较难
    if (companyTier === 'small') score += 15;
    else if (companyTier === 'mid') score += 10;
    else score += 3;
  }

  return Math.min(99, Math.max(0, score));
}

export default function MatchPage() {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'selecting' | 'done'>(() => {
    const savedState = sessionStorage.getItem(SESSION_KEY_UPLOAD_STATE);
    const savedIndustries = sessionStorage.getItem(SESSION_KEY_SELECTED_INDUSTRIES);
    const savedFunctions = sessionStorage.getItem(SESSION_KEY_SELECTED_FUNCTIONS);
    if (savedState === 'done' && savedIndustries && savedFunctions) return 'done';
    sessionStorage.removeItem(SESSION_KEY_UPLOAD_STATE);
    return 'idle';
  });

  const [resumeFileName, setResumeFileName] = useState(
    () => sessionStorage.getItem(SESSION_KEY_RESUME_NAME) || ''
  );

  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResult | null>(
    () => loadSavedAnalysis()
  );

  const [userSelection, setUserSelection] = useState<UserSelection | null>(() => {
    const savedIndustries = sessionStorage.getItem(SESSION_KEY_SELECTED_INDUSTRIES);
    const savedFunctions = sessionStorage.getItem(SESSION_KEY_SELECTED_FUNCTIONS);
    if (savedIndustries && savedFunctions) {
      return {
        industryIds: JSON.parse(savedIndustries),
        functionLabels: JSON.parse(savedFunctions),
      };
    }
    return null;
  });

  const [pendingIndustryIds, setPendingIndustryIds] = useState<string[]>([]);
  const [pendingFunctionLabels, setPendingFunctionLabels] = useState<string[]>([]);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterPlatform, setFilterPlatform] = useState<PlatformFilter>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'deadline'>('match');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setResumeFileName(file.name);
    sessionStorage.setItem(SESSION_KEY_RESUME_NAME, file.name);
    setUploadState('uploading');

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawText = (event.target?.result as string) ?? '';
      const analysis = analyzeResume(rawText, file.name, file.size);
      setResumeAnalysis(analysis);
      sessionStorage.setItem(SESSION_KEY_RESUME_ANALYSIS, JSON.stringify(analysis));

      setPendingIndustryIds([analysis.detectedIndustryId]);
      setPendingFunctionLabels([]);
      setUploadState('selecting');
    };
    reader.onerror = () => {
      const analysis = analyzeResume('', file.name, file.size);
      setResumeAnalysis(analysis);
      sessionStorage.setItem(SESSION_KEY_RESUME_ANALYSIS, JSON.stringify(analysis));
      setPendingIndustryIds([analysis.detectedIndustryId]);
      setPendingFunctionLabels([]);
      setUploadState('selecting');
    };
    reader.readAsText(file, 'utf-8');
  };

  const toggleIndustry = (industryId: string) => {
    setPendingIndustryIds((prev) => {
      const isSelected = prev.includes(industryId);
      if (isSelected) {
        const next = prev.filter((id) => id !== industryId);
        setPendingFunctionLabels((fns) => {
          const removedIndustry = industries.find((ind) => ind.id === industryId);
          if (!removedIndustry) return fns;
          const removedFunctionLabels = new Set(removedIndustry.functions.map((fn) => fn.label));
          return fns.filter((fn) => !removedFunctionLabels.has(fn));
        });
        return next;
      }
      return [...prev, industryId];
    });
  };

  const toggleFunction = (functionLabel: string) => {
    setPendingFunctionLabels((prev) => {
      if (prev.includes(functionLabel)) {
        return prev.filter((fn) => fn !== functionLabel);
      }
      return [...prev, functionLabel];
    });
  };

  const handleConfirmSelection = () => {
    if (pendingFunctionLabels.length === 0) return;
    const selection: UserSelection = {
      industryIds: pendingIndustryIds,
      functionLabels: pendingFunctionLabels,
    };
    setUserSelection(selection);
    sessionStorage.setItem(SESSION_KEY_SELECTED_INDUSTRIES, JSON.stringify(pendingIndustryIds));
    sessionStorage.setItem(SESSION_KEY_SELECTED_FUNCTIONS, JSON.stringify(pendingFunctionLabels));
    sessionStorage.setItem(SESSION_KEY_UPLOAD_STATE, 'done');
    setUploadState('done');
  };

  const handleReupload = () => {
    setUploadState('idle');
    setResumeFileName('');
    setUserSelection(null);
    setResumeAnalysis(null);
    setPendingFunctionLabels([]);
    setPendingIndustryIds([]);
    sessionStorage.removeItem(SESSION_KEY_UPLOAD_STATE);
    sessionStorage.removeItem(SESSION_KEY_RESUME_NAME);
    sessionStorage.removeItem(SESSION_KEY_SELECTED_INDUSTRIES);
    sessionStorage.removeItem(SESSION_KEY_SELECTED_FUNCTIONS);
    sessionStorage.removeItem(SESSION_KEY_RESUME_ANALYSIS);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const getJobScore = (job: typeof mockJobs[0]): number => {
    if (!userSelection) return job.matchScore;
    if (resumeAnalysis) {
      return computeDynamicMatchScore(job, resumeAnalysis, userSelection);
    }
    const isCorrectIndustry = userSelection.industryIds.includes(job.industryId);
    const isCorrectFunction = job.jobFunction
      ? userSelection.functionLabels.some(
          (fn) => fn.toLowerCase() === (job.jobFunction ?? '').toLowerCase()
        )
      : false;
    if (!isCorrectIndustry && !isCorrectFunction) return 0;
    if (!isCorrectFunction) return Math.max(5, job.matchScore - 40);
    let score = job.matchScore;
    if (isCorrectIndustry) score += 5;
    return Math.min(99, score);
  };

  const selectedIndustryLabels = industries
    .filter((ind) => userSelection?.industryIds.includes(ind.id))
    .map((ind) => ind.label)
    .join('、');

  const pendingIndustriesData = industries.filter((ind) => pendingIndustryIds.includes(ind.id));

  const filteredJobs = mockJobs
    .filter((job) => {
      if (filterType !== 'all' && job.type !== filterType) return false;
      if (filterPlatform !== 'all' && job.platform !== filterPlatform) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return (
          job.title.toLowerCase().includes(keyword) ||
          job.company.toLowerCase().includes(keyword) ||
          job.tags.some((tag) => tag.toLowerCase().includes(keyword))
        );
      }
      if (userSelection) {
        return getJobScore(job) >= 40;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return getJobScore(b) - getJobScore(a);
      if (sortBy === 'date') return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });

  const detectedLabel = resumeAnalysis
    ? `AI 识别：${resumeAnalysis.detectedJobLabel}`
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">岗位智能匹配</h1>
        <p className="text-gray-400">上传简历，AI 自动解析职能方向，精准匹配最适合你的岗位</p>
      </div>

      {uploadState === 'idle' && (
        <div
          className={`border-2 border-dashed rounded-2xl p-16 text-center mb-8 transition-all cursor-pointer group ${
            dragOver
              ? 'border-violet-400 bg-violet-50'
              : 'border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50/50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-20 h-20 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-5 group-hover:bg-violet-100 transition-colors">
            <i className="fa-solid fa-cloud-arrow-up text-violet-500 text-3xl"></i>
          </div>
          <h3 className="text-gray-800 font-semibold text-xl mb-2">拖拽或点击上传简历</h3>
          <p className="text-gray-400 text-sm mb-6">支持 PDF、Word、TXT 格式，AI 自动解析职能方向</p>
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-brain text-violet-400"></i>
              AI 智能解析简历内容
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-bullseye text-violet-400"></i>
              基于技能动态计算匹配度
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-bolt text-violet-400"></i>
              秒级完成岗位筛选
            </span>
          </div>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="card p-10 text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="w-20 h-20 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-file-arrow-up text-violet-500 text-xl"></i>
            </div>
          </div>
          <p className="text-gray-800 font-semibold text-lg mb-1">AI 正在解析简历...</p>
          <p className="text-gray-400 text-sm">{resumeFileName}</p>
        </div>
      )}

      {uploadState === 'selecting' && (
        <div className="card p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-file-circle-check text-violet-500"></i>
            </div>
            <div>
              <p className="text-gray-800 font-medium">简历解析完成</p>
              <p className="text-gray-400 text-sm">{resumeFileName}</p>
            </div>
          </div>

          {resumeAnalysis && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
              <i className="fa-solid fa-brain text-violet-500 mt-0.5 flex-shrink-0"></i>
              <div>
                <p className="text-violet-700 text-sm font-medium mb-1">
                  AI 识别结果：<span className="font-bold">{resumeAnalysis.detectedJobLabel}</span>
                  <span className="text-violet-500 ml-2 font-normal">
                    （已自动预选对应行业）
                  </span>
                </p>
                {resumeAnalysis.extractedSkills.length > 0 && (
                  <p className="text-violet-600 text-xs">
                    检测到技能：{resumeAnalysis.extractedSkills.slice(0, 6).join('、')}
                    {resumeAnalysis.extractedSkills.length > 6 ? ` 等 ${resumeAnalysis.extractedSkills.length} 项` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
            <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 flex-shrink-0"></i>
            <p className="text-amber-700 text-sm">
              请确认或调整<strong>目标行业</strong>和<strong>职能方向</strong>（支持多选），系统将基于简历技能动态计算匹配分。
            </p>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-700 font-medium">第一步：选择目标行业（可多选）</p>
            {pendingIndustryIds.length > 0 && (
              <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                已选 {pendingIndustryIds.length} 个
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {industries.map((industry) => {
              const isSelected = pendingIndustryIds.includes(industry.id);
              const isDetected = resumeAnalysis?.detectedIndustryId === industry.id;
              return (
                <button
                  key={industry.id}
                  onClick={() => toggleIndustry(industry.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? `${industry.color.activeBg} ${industry.color.activeText} ${industry.color.activeBorder}`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-600'
                  }`}
                >
                  <i className={`fa-solid ${industry.icon} text-xs ${isSelected ? industry.color.iconColor : 'text-gray-400'}`}></i>
                  {industry.label}
                  {isDetected && !isSelected && (
                    <span className="text-xs text-violet-400 ml-0.5">AI推荐</span>
                  )}
                  {isSelected && <i className="fa-solid fa-check text-xs ml-0.5"></i>}
                </button>
              );
            })}
          </div>

          {pendingIndustriesData.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-700 font-medium">
                  第二步：选择职能方向（可多选）
                </p>
                {pendingFunctionLabels.length > 0 && (
                  <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                    已选 {pendingFunctionLabels.length} 个
                  </span>
                )}
              </div>
              {pendingIndustriesData.map((industryData) => (
                <div key={industryData.id} className="mb-4">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <i className={`fa-solid ${industryData.icon} ${industryData.color.iconColor}`}></i>
                    {industryData.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {industryData.functions.map((fn) => {
                      const isSelected = pendingFunctionLabels.includes(fn.label);
                      const isDetectedFn = resumeAnalysis?.detectedJobLabel === fn.label;
                      return (
                        <button
                          key={fn.label}
                          onClick={() => toggleFunction(fn.label)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-all ${
                            isSelected
                              ? 'bg-violet-600 text-white border-violet-600'
                              : isDetectedFn
                              ? 'bg-violet-50 text-violet-600 border-violet-300'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                          }`}
                        >
                          <i className={`fa-solid ${fn.icon} text-xs`}></i>
                          {fn.label}
                          {isDetectedFn && !isSelected && (
                            <span className="text-xs text-violet-400 ml-0.5">AI推荐</span>
                          )}
                          {isSelected && <i className="fa-solid fa-check text-xs ml-0.5"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          <button
            onClick={handleConfirmSelection}
            disabled={pendingFunctionLabels.length === 0}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2 ${
              pendingFunctionLabels.length > 0
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {pendingFunctionLabels.length > 0
              ? `开始匹配「${pendingFunctionLabels.join('、')}」相关岗位 →`
              : '请先选择职能方向'}
          </button>
        </div>
      )}

      {uploadState === 'done' && userSelection && (
        <>
          <div className="card p-4 mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
              </div>
              <div>
                <p className="text-gray-800 font-medium text-sm">{resumeFileName}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {detectedLabel && (
                    <span className="text-violet-500 mr-2">{detectedLabel}</span>
                  )}
                  目标方向：
                  <span className="text-violet-600 font-medium ml-1">
                    {selectedIndustryLabels} · {userSelection.functionLabels.join('、')}
                  </span>
                </p>
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1 transition-colors flex-shrink-0"
              onClick={handleReupload}
            >
              <i className="fa-solid fa-rotate-right text-xs"></i>
              重新上传
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="搜索岗位、公司或技能..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'intern', 'fulltime'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                    filterType === type
                      ? 'bg-violet-50 text-violet-700 border-violet-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-600'
                  }`}
                >
                  {type === 'all' ? '全部' : type === 'intern' ? '实习' : '校招'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {(['all', 'boss', 'shixiseng', 'official'] as PlatformFilter[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setFilterPlatform(platform)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                    filterPlatform === platform
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-sky-200 hover:text-sky-600'
                  }`}
                >
                  {platform === 'all' ? '全平台' : platform === 'boss' ? 'BOSS' : platform === 'shixiseng' ? '实习僧' : '官网'}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="match">按匹配度</option>
              <option value="date">按发布时间</option>
              <option value="deadline">按截止时间</option>
            </select>
          </div>

          <div className="text-gray-400 text-sm mb-4">
            为「<span className="text-violet-600 font-medium">{userSelection.functionLabels.join('、')}</span>」共匹配到{' '}
            <span className="text-violet-600 font-semibold">{filteredJobs.length}</span> 个岗位
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} overrideScore={getJobScore(job)} />
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-20">
              <i className="fa-solid fa-magnifying-glass text-gray-300 text-4xl mb-4"></i>
              <p className="text-gray-400 mb-2">没有找到匹配的岗位</p>
              <p className="text-gray-300 text-sm">试试调整筛选条件，或点击「重新上传」更换职能方向</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
