import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import API from '../config';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2, Search, Filter
} from 'lucide-react';

const EVENT_TYPES = [
  { value: 'All', label: 'All Events', icon: Shield, color: 'text-slate-600' },
  { value: 'login_success', label: 'Successful Login', icon: CheckCircle, color: 'text-emerald-600' },
  { value: 'login_failed', label: 'Failed Login', icon: XCircle, color: 'text-red-600' },
  { value: 'token_refresh', label: 'Token Refresh', icon: RefreshCw, color: 'text-blue-600' },
  { value: 'rate_limit_blocked', label: 'Rate Limited', icon: AlertTriangle, color: 'text-amber-600' },
];

const eventIcons = {
  login_success: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  login_failed: { icon: XCircle, color: 'text-red-600 bg-red-50' },
  token_refresh: { icon: RefreshCw, color: 'text-blue-600 bg-blue-50' },
  rate_limit_blocked: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
};

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
        ? `${API}/auth/security-logs?limit=200`
        : `${API}/auth/security-logs?event_type=${filter}&limit=200`;
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

  const formatTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Security Logs</h1>
          <p className="text-slate-500 mt-1">Monitor login attempts and security events.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white border-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield size={120} />
          </div>
          <div className="p-6 relative">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Events</p>
            <h2 className="text-4xl font-black mt-2">{stats.total}</h2>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><XCircle size={24} /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Failed Logins</p>
            <p className="text-2xl font-black text-red-600">{stats.failed}</p>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle size={24} /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rate Limited</p>
            <p className="text-2xl font-black text-amber-600">{stats.blocked}</p>
          </div>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {EVENT_TYPES.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
                  filter === f.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="relative sm:ml-auto max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search email, IP, details..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Event</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">IP Address</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Details</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10"><Loader2 size={24} className="animate-spin mx-auto text-slate-300" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No security events found.</td></tr>
              ) : (
                filtered.map(log => {
                  const eventInfo = eventIcons[log.event_type] || { icon: Shield, color: 'text-slate-600 bg-slate-50' };
                  const Icon = eventInfo.icon;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${eventInfo.color}`}>
                          <Icon size={12} />
                          {log.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{log.email || '-'}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{log.ip_address || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{log.details || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatTime(log.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
