import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Check, X, ShieldAlert, Loader, UserPlus, Search, 
  Filter, MoreHorizontal, Mail, Calendar, Shield, 
  ArrowUpRight, Users, Trash2, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config';

export function Accounts() {
  const { lang } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API}/auth/pending-requests`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/auth/approve/${id}`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || t(lang, 'failedToApprove'));
      }
      setRequests(requests.filter((r) => r.id !== id));
      setSuccess(t(lang, 'userApproved'));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    setActionLoading((prev) => ({ ...prev, [id]: 'reject' }));
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/auth/reject/${id}`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || t(lang, 'failedToReject'));
      }
      setRequests(requests.filter((r) => r.id !== id));
      setSuccess(t(lang, 'userRejected'));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const filteredRequests = requests.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600/10 rounded-[1.5rem] flex items-center justify-center border border-indigo-500/20 shadow-xl shadow-indigo-600/5">
            <UserPlus className="text-indigo-400" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t(lang, 'accountsPermissions')}</h1>
            <p className="text-sm text-slate-500 font-medium">{t(lang, 'accountsDesc')}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Gatekeeper</span>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RequestStat icon={ShieldAlert} label="Total Pending" value={requests.length} color="amber" />
        <RequestStat icon={CheckCircle2} label="Processed Today" value="12" color="emerald" />
        <RequestStat icon={Users} label="Current Userbase" value="248" color="indigo" />
      </div>

      {/* Alerts & Messages */}
      <AnimatePresence>
        {requests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-600/5 border border-indigo-500/20 rounded-[2rem] p-6 flex items-start gap-4"
          >
            <Shield className="text-indigo-400 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">{t(lang, 'actionRequired')}</h3>
              <p className="text-sm text-slate-400 font-medium">
                {t(lang, 'actionRequiredDesc', { count: requests.length })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto px-2">
          <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider hover:text-slate-300">
            <Filter size={14} /> Filter By Role
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-24 text-center">
            <Loader className="animate-spin text-indigo-500 mx-auto" size={32} />
            <p className="text-xs text-slate-500 mt-4 font-black uppercase tracking-widest">{t(lang, 'loadingRequests')}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-24 text-center bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800">
            <UserPlus className="mx-auto mb-4 opacity-10" size={48} />
            <p className="text-slate-500 font-medium">{t(lang, 'noPendingRequests')}</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredRequests.map((req, i) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                    {req.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{req.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Mail size={12} className="text-slate-600" /> {req.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar size={12} className="text-slate-600" /> {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    req.role === 'Teacher' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    req.role === 'Student' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    Requested: {req.role}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={!!actionLoading[req.id]}
                      className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                    >
                      {actionLoading[req.id] === 'reject' ? <Loader className="animate-spin" size={20} /> : <X size={20} />}
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={!!actionLoading[req.id]}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
                    >
                      {actionLoading[req.id] === 'approve' ? (
                        <Loader className="animate-spin" size={16} />
                      ) : (
                        <>
                          <Check size={16} /> {t(lang, 'accept')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function RequestStat({ icon: Icon, label, value, color }) {
  const colors = {
    amber: 'bg-amber-500 shadow-amber-500/20 text-white',
    emerald: 'bg-emerald-500 shadow-emerald-500/20 text-white',
    indigo: 'bg-indigo-600 shadow-indigo-600/20 text-white',
  };
  return (
    <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-[2.5rem] flex items-center gap-5 group hover:border-slate-700 transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h4 className="text-3xl font-black text-white tracking-tight">{value}</h4>
      </div>
    </Card>
  );
}
