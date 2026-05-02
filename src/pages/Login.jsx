import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-mauve-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-15%] left-[20%] w-[45%] h-[45%] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

      {/* Glass card */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 p-8">
          
          {/* Language toggle */}
          <div className="flex justify-end mb-6">
            <div className="flex bg-slate-100/80 rounded-lg p-0.5">
              {['en', 'fr'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    lang === l
                      ? 'bg-white text-mauve-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-mauve-500 to-mauve-700 rounded-2xl flex items-center justify-center shadow-lg shadow-mauve-200 mb-4">
              <GraduationCap className="text-white" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t(lang, 'welcomeBack')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t(lang, 'signInToAccount')}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t(lang, 'email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all placeholder:text-slate-400"
                  placeholder="admin@school.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t(lang, 'password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-mauve-600 focus:ring-mauve-500" />
                <span className="text-sm text-slate-600">{t(lang, 'rememberMe')}</span>
              </label>
              <a href="#" className="text-sm font-medium text-mauve-600 hover:text-mauve-700 transition-colors">{t(lang, 'forgotPassword')}</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-mauve-600 to-mauve-700 hover:from-mauve-700 hover:to-mauve-800 text-white font-semibold rounded-xl shadow-lg shadow-mauve-200 transition-all disabled:opacity-50 active:scale-[0.98] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t(lang, 'signingIn')}
                </span>
              ) : t(lang, 'signIn')}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>{t(lang, 'noAccount')}{' '}
              <a href="/register" className="text-mauve-600 font-semibold hover:text-mauve-700 transition-colors">
                {t(lang, 'signUp')}
              </a>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t(lang, 'demoCredentials')}</p>
            <div className="flex gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600">super@school.com</span>
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600">password</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
