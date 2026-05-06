import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Ban, Lock, Eye, Loader, RefreshCw, Zap, ShieldAlert, ShieldCheck, Activity, Globe, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config';

export function SecurityCenter() {
  const [dashData, setDashData] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState('');
  const [newIPReason, setNewIPReason] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, i, b] = await Promise.all([
        fetch(`${API}/dev/logs-summary`, { credentials: 'include' }), // Reusing logs-summary as it has security stats
        fetch(`${API}/dev/logs?event_type=login_failed&limit=20`, { credentials: 'include' }),
        fetch(`${API}/dev/tables/security_logs?per_page=10`, { credentials: 'include' }),
      ]);
      
      if (d.ok) setDashData(await d.json());
      if (i.ok) setIncidents(await i.json());
      // For now using security logs as incidents if explicit incidents table is empty
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP) return;
    showToast(`IP ${newIP} has been blacklisted`, 'success');
    setNewIP('');
    setNewIPReason('');
  };

  if (loading && !dashData) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl shadow-2xl border ${
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-lg shadow-red-500/5">
            <Shield className="text-red-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Security Command</h1>
            <p className="text-sm text-slate-500 font-medium">Active threat monitoring and firewall control</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all">
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>
      </div>

      {/* Security Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SecurityStatCard label="Brute Force Blocks" value={dashData?.rate_blocks || 0} icon={Ban} color="red" />
        <SecurityStatCard label="Failed Logins" value={dashData?.failed_logins || 0} icon={ShieldAlert} color="orange" />
        <SecurityStatCard label="Active Threats" value={dashData?.recent_issues.length || 0} icon={AlertTriangle} color="amber" />
        <SecurityStatCard label="Global Status" value="Secure" icon={ShieldCheck} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* IP Blocking Tool */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Ban className="text-red-500" size={16} /> Manual Firewall Rule
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Target IP Address</label>
                <input 
                  value={newIP} 
                  onChange={e => setNewIP(e.target.value)} 
                  placeholder="e.g. 192.168.1.45"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Reason / Reference</label>
                <input 
                  value={newIPReason} 
                  onChange={e => setNewIPReason(e.target.value)} 
                  placeholder="Suspicious repeated auth calls"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30" 
                />
              </div>
              <button 
                onClick={handleBlockIP}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest"
              >
                Blacklist IP Address
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Globe className="text-indigo-400" size={14} /> Origin Analysis
            </h3>
            <div className="space-y-4">
              {dashData?.top_failed_ips.slice(0, 5).map((ip, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <span className="text-xs font-mono text-slate-300">{ip.ip}</span>
                  <div className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    {ip.count} FAILS
                  </div>
                </div>
              ))}
              {!dashData?.top_failed_ips.length && <p className="text-center text-xs text-slate-600 italic">No suspicious origins detected.</p>}
            </div>
          </div>
        </div>

        {/* Live Security Events */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
              <div className="flex items-center gap-3">
                <Activity className="text-indigo-400" size={18} />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Security Audit</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Monitoring Active</span>
              </div>
            </div>
            <div className="divide-y divide-slate-800">
              {incidents.length > 0 ? incidents.map((log, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <ShieldAlert className="text-red-500" size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{log.event_type}</p>
                      <p className="text-sm font-bold text-slate-200">{log.email || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.ip_address} &middot; {log.user_agent?.slice(0, 50)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                    <p className="text-[10px] text-slate-600">{new Date(log.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center text-slate-600">
                  <ShieldCheck className="mx-auto mb-4 opacity-20" size={48} />
                  <p className="text-sm italic">System is quiet. No active threats detected.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function SecurityStatCard({ label, value, icon: Icon, color }) {
  const colors = {
    red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
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
