import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: '首页', icon: 'fa-house' },
    { path: '/match', label: '岗位匹配', icon: 'fa-magnifying-glass' },
    { path: '/resume', label: '简历优化', icon: 'fa-file-pen' },
  ];

  return (
    <div className="min-h-screen section-bg">
      {/* 全局背景光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="glow-orb glow-orb-violet absolute -top-40 -left-40 w-[600px] h-[600px] opacity-40 animate-float-x" />
        <div className="glow-orb glow-orb-pink absolute top-1/3 -right-32 w-[500px] h-[500px] opacity-30 animate-float-slow" />
        <div className="glow-orb glow-orb-blue absolute bottom-0 left-1/3 w-[400px] h-[400px] opacity-20 animate-float" />
        <div className="grid-bg absolute inset-0 opacity-60" />
      </div>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'nav-blur shadow-lg shadow-violet-100/30'
            : 'bg-transparent'
        }`}
      >
        {/* 顶部流光线 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative w-9 h-9">
                {/* 外圈旋转光环 */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 animate-spin-slow opacity-30 blur-sm" />
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-300/40 group-hover:shadow-violet-400/60 transition-shadow">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="group-hover:scale-110 transition-transform">
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
                <span className="text-gray-900 font-black text-lg tracking-tight group-hover:text-violet-700 transition-colors">
                  JobFit
                </span>
                <span className="text-violet-400 font-medium hidden sm:block" style={{ fontSize: '10px' }}>
                  Where your resume meets the right job.
                </span>
              </div>
            </div>

            {/* 桌面导航 */}
            <div className="hidden md:flex items-center gap-1 bg-white/60 backdrop-blur-sm border border-violet-100/60 rounded-2xl px-2 py-1.5 shadow-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-300/40'
                        : 'text-gray-500 hover:text-violet-700 hover:bg-violet-50/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <i className={`fa-solid ${item.icon} text-xs`} />
                      {item.label}
                      {isActive && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* 右侧操作区 */}
            <div className="hidden md:flex items-center gap-3">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-50 text-violet-700 border border-violet-200'
                      : 'text-gray-500 hover:text-violet-700 hover:bg-violet-50/80'
                  }`
                }
              >
                <i className="fa-solid fa-user-graduate text-xs" />
                <span>学生档案</span>
              </NavLink>
              <button
                onClick={() => navigate('/login')}
                className="relative px-4 py-2 text-sm font-semibold text-white rounded-xl overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 animate-gradient" />
                <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-sm transition-opacity" />
                <span className="relative">演示入口</span>
              </button>
            </div>

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 border border-violet-100 text-gray-500 hover:text-violet-700 hover:bg-violet-50 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm transition-all`} />
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-violet-100/60 bg-white/90 backdrop-blur-xl px-4 py-3 space-y-1 animate-slide-up shadow-xl shadow-violet-100/20">
            {[...navItems, { path: '/profile', label: '学生档案', icon: 'fa-user-graduate' }].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border border-violet-200'
                      : 'text-gray-500 hover:text-violet-700 hover:bg-violet-50/80'
                  }`
                }
              >
                <i className={`fa-solid ${item.icon} text-violet-400 w-4`} />
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 pb-1">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 shadow-md shadow-violet-200/50"
              >
                演示入口
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="relative z-10 pt-16 min-h-screen">
        <div role="note" className="relative z-10 text-center text-xs sm:text-sm bg-amber-50/90 text-amber-900 px-4 py-2 border-b border-amber-200">
          公开演示版：岗位为示例数据，简历分析使用本地规则；不提供真实账户、实时招聘信息或在线 AI 服务。
        </div>
        <Outlet />
      </main>
    </div>
  );
}
