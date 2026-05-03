import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, X, CheckCircle, Loader, Building2, Shield, BarChart3, Globe, Code, ChevronRight, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import API from '../config';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed');
      }
      setForgotSent(true);
      setTimeout(() => {
        setForgotSent(false);
        setForgotOpen(false);
        setForgotEmail('');
      }, 3000);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

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

  const features = [
    { icon: Crown, title: lang === 'fr' ? 'Vous êtes le Propriétaire' : 'You are the Owner', desc: lang === 'fr' ? 'Développeur & propriétaire de la plateforme' : 'Developer & platform owner' },
    { icon: Building2, title: lang === 'fr' ? 'Créez des Écoles' : 'Create Schools', desc: lang === 'fr' ? 'Chaque école a son propre Super Admin' : 'Each school gets its own Super Admin' },
    { icon: Shield, title: lang === 'fr' ? 'Isolation Totale' : 'Total Isolation', desc: lang === 'fr' ? 'Données séparées pour chaque école' : 'Separated data per school' },
    { icon: BarChart3, title: lang === 'fr' ? 'Vue Globale' : 'Global View', desc: lang === 'fr' ? 'Contrôle total sur toutes les écoles' : 'Full control over all schools' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side - Marketing / SaaS branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mauve-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-mauve-500 to-mauve-700 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">EduSaaS</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">School Management Platform</p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium mb-6">
              <Crown size={12} />
              {lang === 'fr' ? 'Vous êtes le Propriétaire / Développeur' : 'You are the Owner / Developer'}
            </div>
            
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              {lang === 'fr' ? 'Votre plateforme SaaS' : 'Your SaaS platform'}
              <br />
              <span className="bg-gradient-to-r from-mauve-400 to-blue-400 bg-clip-text text-transparent">
                {lang === 'fr' ? 'pour les écoles' : 'for schools'}
              </span>
            </h2>
            
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              {lang === 'fr'
                ? 'Vous êtes le propriétaire de cette plateforme. Créez des écoles, et chaque école reçoit automatiquement son propre Super Admin. Vous gardez le contrôle total sur toutes les écoles.'
                : 'You are the platform owner. Create schools, and each school automatically gets its own Super Admin. You retain full control over all schools.'
              }
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  <f.icon size={20} className="text-mauve-400 mb-3" />
                  <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">© 2025 EduSaaS. All rights reserved.</p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>{lang === 'fr' ? 'Propulsé par' : 'Powered by'} EduSaaS</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-mauve-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob lg:hidden"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-300/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 lg:hidden"></div>

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-mauve-500 to-mauve-700 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">EduSaaS</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">School Management</p>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex justify-end mb-6">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {['en', 'fr'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
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

          {/* Welcome text */}
          <div className="mb-8">
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
              <button type="button" onClick={() => { setForgotOpen(true); setForgotError(''); setForgotSent(false); setForgotEmail(email); }} className="text-sm font-medium text-mauve-600 hover:text-mauve-700 transition-colors">{t(lang, 'forgotPassword')}</button>
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

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setForgotOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{t(lang, 'forgotPassword')}</h3>
            <p className="text-sm text-slate-500 mb-4">Enter your email and we will send you a reset link.</p>
            {forgotError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{forgotError}</div>}
            {forgotSent && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                <p className="text-green-700 font-medium text-sm">Reset instructions sent! Check your email.</p>
              </div>
            )}
            {!forgotSent && (
              <form onSubmit={handleForgot} className="space-y-4">
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20"
                  placeholder="your@email.com" required />
                <button type="submit" disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-mauve-600 to-mauve-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50">
                  {forgotLoading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
