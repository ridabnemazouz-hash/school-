import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, X, CheckCircle, Loader, Building2, Shield, BarChart3, Globe, Code, ChevronRight, Crown, Sparkles, Terminal, Cpu, Database } from 'lucide-react';
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
  const [isDevMode, setIsDevMode] = useState(false); // تبديل وضع المطور
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
      // Logic for role-based navigation
      if (result.user?.role === 'Owner' || (result.user?.role === 'Super Admin' && !result.user?.school_id)) {
        navigate('/');
      } else {
        navigate('/school');
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-700 ${isDevMode ? 'bg-[#050505]' : 'bg-[#0f172a]'}`}>
      
      {/* Dynamic Backgrounds */}
      <AnimatePresence mode="wait">
        {!isDevMode ? (
          <motion.div 
            key="user-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
          </motion.div>
        ) : (
          <motion.div 
            key="dev-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]"></div>
            {/* Scanned Lines Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent bg-[length:100%_4px] animate-scan"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 p-6 relative z-10">
        
        {/* Left Side: Dynamic Content based on Mode */}
        <motion.div 
          layout
          className="lg:w-1/2 text-white"
        >
          <motion.div layout className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${isDevMode ? 'bg-emerald-500 shadow-emerald-500/40 rotate-12' : 'bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-indigo-500/20'}`}>
              {isDevMode ? <Terminal size={32} /> : <GraduationCap size={32} />}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">EduSaaS <span className={isDevMode ? 'text-emerald-400' : 'text-fuchsia-400'}>OS</span></h1>
              <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isDevMode ? 'text-emerald-500/70' : 'text-indigo-300'}`}>
                {isDevMode ? 'System Root Access' : 'Management Platform'}
              </p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!isDevMode ? (
              <motion.div 
                key="user-text"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-5xl lg:text-7xl font-black leading-tight mb-6">
                  Empower Your <br/>
                  <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                    School Empire
                  </span>
                </h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md">
                  Unified control for multiple educational institutions. Secure, fast, and scalable.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="dev-text"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-5xl lg:text-7xl font-mono font-black leading-tight mb-6 text-emerald-400">
                  DEVELOPER <br/>
                  <span className="text-white opacity-90">PORTAL</span>
                </h2>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-emerald-500/80 font-mono text-sm">
                    <Cpu size={16} /> <span>Status: System Nominal</span>
                  </div>
                  <div className="flex items-center gap-3 text-emerald-500/80 font-mono text-sm">
                    <Database size={16} /> <span>DB: Encrypted Multi-Tenant</span>
                  </div>
                  <div className="flex items-center gap-3 text-emerald-500/80 font-mono text-sm">
                    <Shield size={16} /> <span>Auth: RSA-4096 Enabled</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div layout className="w-full max-w-[480px]">
          <div className={`backdrop-blur-[20px] border p-8 lg:p-10 rounded-[40px] shadow-2xl relative transition-all duration-700 ${isDevMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-white/10 border-white/20'}`}>
            
            {/* Mode Switcher */}
            <div className="flex justify-center mb-10">
              <div className="bg-black/20 p-1 rounded-2xl flex border border-white/5">
                <button 
                  onClick={() => setIsDevMode(false)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!isDevMode ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  USER
                </button>
                <button 
                  onClick={() => setIsDevMode(true)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${isDevMode ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-emerald-400'}`}
                >
                  <Code size={14} />
                  DEV
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h2 className={`text-3xl font-black mb-2 ${isDevMode ? 'text-emerald-400 font-mono' : 'text-white'}`}>
                {isDevMode ? '> ROOT_LOGIN' : t(lang, 'welcomeBack')}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {isDevMode ? 'Enter master credentials to access core.' : t(lang, 'signInToAccount')}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex items-center gap-3"
              >
                <X size={18} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDevMode ? 'text-emerald-500/50' : 'text-slate-400'}`}>ID_ENTITY</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl transition-all outline-none text-sm ${isDevMode ? 'bg-black/40 border-emerald-500/20 text-emerald-400 focus:border-emerald-500 font-mono' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500'}`}
                  placeholder={isDevMode ? "root@edusaas.sys" : "admin@school.com"}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDevMode ? 'text-emerald-500/50' : 'text-slate-400'}`}>ACCESS_KEY</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl transition-all outline-none text-sm ${isDevMode ? 'bg-black/40 border-emerald-500/20 text-emerald-400 focus:border-emerald-500 font-mono' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500'}`}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/50" />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{t(lang, 'rememberMe')}</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => { setForgotOpen(true); setForgotError(''); setForgotSent(false); setForgotEmail(email); }}
                  className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {t(lang, 'forgotPassword')}
                </button>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading}
                className={`w-full py-4 rounded-2xl font-black shadow-2xl transition-all flex items-center justify-center gap-3 mt-4 ${isDevMode ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white'}`}
              >
                {loading ? <Loader className="animate-spin" size={20} /> : (isDevMode ? 'EXECUTE_AUTH' : 'SIGN IN')}
              </motion.button>
            </form>

            {/* Special Dev Credentials Tooltip */}
            <AnimatePresence>
              {isDevMode && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                >
                  <p className="text-[9px] font-mono text-emerald-500/70 uppercase mb-2 tracking-widest">Master Override:</p>
                  <div className="flex justify-between font-mono text-[10px] text-emerald-400">
                    <span>dev@edusaas.com</span>
                    <span className="opacity-50">|</span>
                    <span>dev123</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan { animation: scan 8s linear infinite; }
      `}</style>
    </div>
  );
}
