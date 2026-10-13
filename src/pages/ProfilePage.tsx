import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'jobfit_profile';

const gradeOptions = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士在读'];
const educationOptions = ['本科', '硕士', '博士'];
const graduateYears = ['2025', '2026', '2027', '2028', '2029'];
const jobStageOptions = [
  { id: 'daily', label: '日常实习', icon: 'fa-sun', desc: '在校期间寻找兼职/实习' },
  { id: 'summer', label: '暑期实习', icon: 'fa-umbrella-beach', desc: '暑假集中实习' },
  { id: 'autumn', label: '秋招', icon: 'fa-leaf', desc: '应届生秋季校园招聘' },
  { id: 'spring', label: '春招', icon: 'fa-seedling', desc: '春季补招/社招' },
];
const companyTypeOptions = [
  { id: 'bigtech', label: '大厂/互联网', icon: '🏢' },
  { id: 'startup', label: '创业公司', icon: '🚀' },
  { id: 'foreign', label: '外资企业', icon: '🌍' },
  { id: 'state', label: '国企/央企', icon: '🏛️' },
  { id: 'finance', label: '金融机构', icon: '💰' },
  { id: 'consulting', label: '咨询/四大', icon: '📊' },
];
const cityOptions = ['北京', '上海', '深圳', '杭州', '广州', '成都', '武汉', '南京', '不限城市', '接受远程'];

interface ProfileForm {
  school: string;
  major: string;
  grade: string;
  education: string;
  graduateYear: string;
  email: string;
  emailVerified: boolean;
  jobStages: string[];
  companyTypes: string[];
  cities: string[];
  salaryMin: string;
  salaryMax: string;
  internDaysPerWeek: string;
  acceptConvert: boolean;
  acceptRemote: boolean;
  prioritizeGrowth: boolean;
}

const defaultForm: ProfileForm = {
  school: '',
  major: '',
  grade: '大四',
  education: '本科',
  graduateYear: '2026',
  email: '',
  emailVerified: false,
  jobStages: ['autumn'],
  companyTypes: ['bigtech'],
  cities: ['北京', '上海'],
  salaryMin: '200',
  salaryMax: '400',
  internDaysPerWeek: '5',
  acceptConvert: true,
  acceptRemote: false,
  prioritizeGrowth: false,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);

  const loadSavedForm = (): ProfileForm => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultForm, ...JSON.parse(raw) };
    } catch (_err) {
      // ignore parse errors
    }
    return defaultForm;
  };

  const [form, setForm] = useState<ProfileForm>(loadSavedForm);
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSaved(true);
  }, []);

  const toggleArrayItem = (field: keyof ProfileForm, value: string) => {
    const current = form[field] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setForm({ ...form, [field]: updated });
  };

  const internStages = ['daily', 'summer'];
  const fullTimeStages = ['autumn', 'spring'];
  const hasIntern = form.jobStages.some((s) => internStages.includes(s));
  const hasFullTime = form.jobStages.some((s) => fullTimeStages.includes(s));

  const handleSendCode = () => {
    if (!form.email.endsWith('.edu.cn')) return;
    setCodeSent(true);
  };

  const handleVerify = () => {
    if (verifyCode === '123456') {
      setForm({ ...form, emailVerified: true });
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const selectClass = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-violet-400";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-5 transition-colors text-sm">
          <i className="fa-solid fa-arrow-left text-xs"></i>
          返回首页
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">完善学生档案</h1>
            <p className="text-gray-400 text-sm">档案越完整，岗位匹配越精准</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <i className="fa-solid fa-circle-check text-xs"></i>
              已保存
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-violet-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                i + 1 < step
                  ? 'bg-violet-500 border-violet-500 text-white'
                  : i + 1 === step
                  ? 'bg-violet-50 border-violet-400 text-violet-600'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {i + 1 < step ? <i className="fa-solid fa-check text-xs"></i> : i + 1}
              </div>
              <span className="text-xs hidden sm:block font-medium">
                {i === 0 ? '基本信息' : i === 1 ? '学校认证' : '求职偏好'}
              </span>
            </div>
            {i < 2 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-violet-400' : 'bg-gray-200'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="text-gray-800 font-semibold mb-5 flex items-center gap-2">
              <i className="fa-solid fa-user-graduate text-violet-500"></i>
              基本信息
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">学校名称</label>
                  <input type="text" placeholder="如：浙江大学" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">专业</label>
                  <input type="text" placeholder="如：计算机科学与技术" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">年级</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={selectClass}>
                    {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">学历层次</label>
                  <select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={selectClass}>
                    {educationOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">预计毕业</label>
                  <select value={form.graduateYear} onChange={(e) => setForm({ ...form, graduateYear: e.target.value })} className={selectClass}>
                    {graduateYears.map((y) => <option key={y} value={y}>{y}年</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs mb-2 block font-medium">当前求职阶段（可多选）</label>
                <div className="grid grid-cols-2 gap-2">
                  {jobStageOptions.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => toggleArrayItem('jobStages', stage.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        form.jobStages.includes(stage.id)
                          ? 'bg-violet-50 border-violet-300 text-violet-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-violet-200'
                      }`}
                    >
                      <i className={`fa-solid ${stage.icon} text-sm ${form.jobStages.includes(stage.id) ? 'text-violet-500' : 'text-gray-400'}`}></i>
                      <div>
                        <p className="text-sm font-medium">{stage.label}</p>
                        <p className="text-xs opacity-70">{stage.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setStep(2)} className="btn-primary w-full">
            下一步：学校认证 <i className="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="text-gray-800 font-semibold mb-2 flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-emerald-500"></i>
              学校邮箱认证
            </h2>
            <p className="text-gray-400 text-xs mb-5">通过学校邮箱验证，获得「在校学生」认证徽章，解锁学生专属岗位推荐</p>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-5">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-circle-info text-emerald-500 text-sm mt-0.5"></i>
                <div>
                  <p className="text-emerald-700 text-sm font-medium mb-1">认证后可解锁</p>
                  <ul className="text-gray-500 text-xs space-y-1">
                    <li>• 学生专属实习岗位推荐池</li>
                    <li>• 校园招聘专属通道</li>
                    <li>• 简历上显示「在校学生」认证徽章</li>
                  </ul>
                </div>
              </div>
            </div>

            {!form.emailVerified ? (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block font-medium">学校邮箱（.edu.cn 后缀）</label>
                  <div className="flex gap-2">
                    <input type="email" placeholder="yourname@xxx.edu.cn" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`flex-1 ${inputClass}`} />
                    <button
                      onClick={handleSendCode}
                      disabled={!form.email.endsWith('.edu.cn')}
                      className="px-4 py-2.5 bg-violet-50 border border-violet-200 text-violet-600 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-100 transition-colors whitespace-nowrap"
                    >
                      {codeSent ? '已发送' : '发送验证码'}
                    </button>
                  </div>
                  {form.email && !form.email.endsWith('.edu.cn') && (
                    <p className="text-rose-500 text-xs mt-1">请使用学校邮箱（.edu.cn 后缀）</p>
                  )}
                </div>
                {codeSent && (
                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block font-medium">验证码（演示：123456）</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="输入6位验证码" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} className={`flex-1 ${inputClass}`} />
                      <button onClick={handleVerify} className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">
                        验证
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-gray-400 text-xs">或</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>
                <button onClick={() => setStep(3)} className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-sm hover:text-gray-700 hover:bg-gray-100 transition-all">
                  暂时跳过，稍后认证
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-3">
                  <i className="fa-solid fa-shield-check text-emerald-500 text-2xl"></i>
                </div>
                <p className="text-gray-800 font-semibold mb-1">认证成功！</p>
                <p className="text-gray-400 text-sm mb-2">{form.email}</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-full">
                  <i className="fa-solid fa-circle-check text-xs"></i>
                  在校学生 · 已认证
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-outline flex-1">
              <i className="fa-solid fa-arrow-left mr-2"></i>上一步
            </button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1">
              下一步：求职偏好 <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="card p-6 space-y-5">
            <h2 className="text-gray-800 font-semibold flex items-center gap-2">
              <i className="fa-solid fa-sliders text-violet-500"></i>
              求职偏好
            </h2>
            <div>
              <label className="text-gray-500 text-xs mb-2 block font-medium">偏好公司类型（可多选）</label>
              <div className="grid grid-cols-3 gap-2">
                {companyTypeOptions.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleArrayItem('companyTypes', type.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      form.companyTypes.includes(type.id)
                        ? 'bg-violet-50 border-violet-300 text-violet-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-violet-200'
                    }`}
                  >
                    <span>{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-2 block font-medium">期望城市（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {cityOptions.map((city) => (
                  <button
                    key={city}
                    onClick={() => toggleArrayItem('cities', city)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      form.cities.includes(city)
                        ? 'bg-violet-50 border-violet-300 text-violet-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-violet-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            {hasIntern && (
              <div>
                <label className="text-gray-500 text-xs mb-2 block font-medium">
                  实习薪资期望
                  <span className="ml-1 text-gray-400 font-normal">元/天</span>
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-violet-400 text-center" />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-violet-400 text-center" />
                  <span className="text-gray-400 text-sm">元/天</span>
                </div>
              </div>
            )}
            {hasFullTime && (
              <div>
                <label className="text-gray-500 text-xs mb-2 block font-medium">
                  校招薪资期望
                  <span className="ml-1 text-gray-400 font-normal">元/月</span>
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="15000" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-violet-400 text-center" />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="number" placeholder="30000" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-violet-400 text-center" />
                  <span className="text-gray-400 text-sm">元/月</span>
                </div>
              </div>
            )}
            {hasIntern && (
              <div>
                <label className="text-gray-500 text-xs mb-2 block font-medium">每周可到岗天数</label>
                <div className="flex gap-2">
                  {['3', '4', '5'].map((days) => (
                    <button
                      key={days}
                      onClick={() => setForm({ ...form, internDaysPerWeek: days })}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.internDaysPerWeek === days
                          ? 'bg-violet-50 border-violet-300 text-violet-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-violet-200'
                      }`}
                    >
                      {days} 天/周
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {[
                ...(hasIntern ? [
                  { key: 'acceptConvert', label: '希望实习转正', icon: 'fa-arrow-up-right-dots' },
                  { key: 'acceptRemote', label: '接受远程实习', icon: 'fa-laptop-house' },
                ] : []),
                { key: 'prioritizeGrowth', label: '愿意用薪资换成长/大厂背书', icon: 'fa-chart-line' },
              ].map((pref) => (
                <div
                  key={pref.key}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-all"
                  onClick={() => setForm({ ...form, [pref.key]: !form[pref.key as keyof ProfileForm] })}
                >
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid ${pref.icon} text-gray-400 text-sm`}></i>
                    <span className="text-gray-600 text-sm">{pref.label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all relative ${form[pref.key as keyof ProfileForm] ? 'bg-violet-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form[pref.key as keyof ProfileForm] ? 'left-5' : 'left-0.5'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-outline flex-1">
              <i className="fa-solid fa-arrow-left mr-2"></i>上一步
            </button>
            <button
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
                setSaved(true);
                navigate('/match');
              }}
              className="btn-primary flex-1"
            >
              <i className="fa-solid fa-check mr-2"></i>保存并开始匹配
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
