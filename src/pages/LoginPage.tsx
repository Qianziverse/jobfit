import React from 'react';
import { useNavigate } from 'react-router-dom';

/** GitHub Pages demo only: no server-side authentication is configured. */
export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white/90 border border-violet-100 shadow-xl shadow-violet-100/30 rounded-3xl p-8 text-center">
        <div className="mx-auto mb-5 w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-2xl">
          <i className="fa-solid fa-user-shield" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">JobFit 公开演示版</h1>
        <p className="text-gray-600 leading-relaxed mb-4">
          当前网站尚未接入真实的登录与注册服务，因此不需要账号或密码即可体验。
          请勿在演示站输入或提交真实的账号凭据。
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition-opacity"
        >
          无需登录，进入演示网站
        </button>
      </div>
    </div>
  );
}
