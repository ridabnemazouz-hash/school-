import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, ChevronDown, CheckCircle, XCircle, UserPlus, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { languageFlags, languageNames, t } from '../../i18n/translations';
import API from '../../config';

export function TopNavbar({ onMenuToggle }) {
  const { user, switchRole } = useAuth();
  const { lang, setLang } = useLanguage();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      fetchPendingRequests();
      const interval = setInterval(fetchPendingRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingRequests = () => {
    fetch(`${API}/auth/pending-requests`)
      .then(res => res.json())
      .then(data => setPendingRequests(data))
      .catch(err => console.error('Failed to fetch pending requests:', err));
  };

  const handleApprove = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/auth/approve/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionFeedback({ type: 'success', message: 'User approved!' });
        setTimeout(() => setActionFeedback(null), 2000);
        fetchPendingRequests();
      } else {
        const data = await res.json();
        setActionFeedback({ type: 'error', message: data.detail || 'Failed to approve' });
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Network error' });
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/auth/reject/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionFeedback({ type: 'success', message: 'User rejected!' });
        setTimeout(() => setActionFeedback(null), 2000);
        fetchPendingRequests();
      } else {
        const data = await res.json();
        setActionFeedback({ type: 'error', message: data.detail || 'Failed to reject' });
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'Network error' });
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const allNotifications = pendingRequests.map(req => ({
    id: req.id,
    type: 'pending',
    title: req.name,
    subtitle: req.role,
    email: req.email,
    time: new Date(req.created_at).toLocaleString(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.name)}&background=6366f1&color=fff&size=40`
  }));

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center flex-1">
        <button onClick={onMenuToggle} className="md:hidden mr-3 text-slate-500 hover:text-slate-700 p-1">
          <Menu size={24} />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t(lang, 'searchPlaceholder')} 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-lg">{languageFlags[lang]}</span>
            <ChevronDown size={14} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20 animate-in fade-in">
                {Object.entries(languageNames).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => { setLang(code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      lang === code ? 'bg-mauve-50 text-mauve-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{languageFlags[code]}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <Bell size={20} />
            {(user?.role === 'Admin' || user?.role === 'Super Admin') && pendingRequests.length > 0 ? (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border border-white flex items-center justify-center">
                {pendingRequests.length}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">{t(lang, 'notifications')}</h3>
                  <span className="text-xs bg-mauve-100 text-mauve-700 px-2 py-0.5 rounded-full font-semibold">
                    {pendingRequests.length} {t(lang, 'pending')}
                  </span>
                </div>

                {actionFeedback && (
                  <div className={`px-4 py-2 text-xs font-semibold ${
                    actionFeedback.type === 'success' 
                      ? 'bg-green-50 text-green-700 border-b border-green-100' 
                      : 'bg-red-50 text-red-700 border-b border-red-100'
                  }`}>
                    {actionFeedback.message}
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto">
                  {allNotifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Clock className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-sm text-slate-400">{t(lang, 'noNotifications')}</p>
                    </div>
                  ) : (
                    allNotifications.map((notif) => (
                      <div key={notif.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <img src={notif.avatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800 truncate">{notif.title}</p>
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">{notif.subtitle}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{notif.email}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleApprove(notif.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <CheckCircle size={12} /> {t(lang, 'approve')}
                          </button>
                          <button
                            onClick={() => handleReject(notif.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <XCircle size={12} /> {t(lang, 'reject')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <a href="/accounts" className="text-xs text-mauve-600 hover:text-mauve-700 font-semibold">
                    {t(lang, 'viewAll')}
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 mt-1">{user?.role}</p>
          </div>
          <img 
            src={user?.avatar} 
            alt="Profile" 
            className="w-9 h-9 rounded-full border border-slate-200"
          />
        </div>
      </div>
    </header>
  );
}
