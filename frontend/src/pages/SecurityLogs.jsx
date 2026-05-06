import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../config';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2, Search, Filter,
  Activity, Clock, Globe, User, ShieldAlert, Zap, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_TYPES = [
  { value: 'All', label: 'All Activity', icon: History, color: 'indigo' },
  { value: 'login_success', label: 'Logins', icon: ShieldCheck, color: 'emerald' },
  { value: 'login_failed', label: 'Failures', icon: ShieldAlert, color: 'red' },
  { value: 'dev_action', label: 'System Ops', icon: Zap, color: 'amber' },
  { value: 'rate_limit_blocked', label: 'Blocked', icon: Ban, color: 'orange' },
];

function ShieldCheck(props) { return <CheckCircle {...props} />; }
function ShieldAlertIcon(props) { return <ShieldAlert {...props} />; }
function Ban(props) { return <XCircle {...props} />; }

export function SecurityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, failed: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filter === 'All'
        ? `${API}/dev/logs?limit=300`
        : `${API}/dev/logs?event_type=${filter}&limit=300`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setStats({
          total: data.length,
          failed: data.filter(l => l.event_type === 'login_failed').length,
          blocked: data.filter(l => l.event_type === 'rate_limit_blocked').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l =>
    (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.ip_address || '').includes(search) ||
    (l.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <Activity className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Audit Trail</h1>
            <p className="text-sm text-slate-500 font-medium">Immutable record of all platform security events</p>
          </div>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AuditStat label="Events Processed" value={stats.total} icon={Shield} color="indigo" />
        <AuditStat label="Security Failures" value={stats.failed} icon={ShieldAlertIcon} color="red" />
        <AuditStat label="Firewall Blocks" value={stats.blocked} icon={Ban} color="orange" />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto w-full md:w-auto p-1">
          {EVENT_TYPES.map(f => {
            const Icon = f.icon;
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                  active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search email, IP, or details..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/30 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <th className="px-6 py-4">Event Origin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Context / Details</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && logs.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center"><Loader2 size={32} className="animate-spin mx-auto text-indigo-500 opacity-20" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center text-slate-600 italic">No matching records found in audit trail.</td></tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-indigo-600/5 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                          <User size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{log.email || 'System'}</p>
                          <p className="text-[10px] font-mono text-slate-500">{log.ip_address || 'Internal'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        log.event_type.includes('fail') || log.event_type.includes('block') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        log.event_type.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {log.event_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400 max-w-md truncate group-hover:text-slate-300">
                        {log.details || 'No additional context provided.'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-bold text-slate-300">{new Date(log.created_at).toLocaleTimeString()}</p>
                      <p className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleDateString()}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AuditStat({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-3xl p-6 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-4">
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-white tracking-tight">{value}</h4>
    </div>
  );
}
