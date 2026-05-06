import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Users, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Activity, Calendar, Download, RefreshCw, Layers, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import API, { apiFetch } from '../config';

export function BillingAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/enterprise/billing/analytics');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      showToast("Failed to fetch billing data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      showToast("Generating financial report...", "info");
      const res = await apiFetch('/enterprise/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: 'financial', format: 'csv' })
      });
      if (res.ok) {
        const { id } = await res.json();
        window.open(`${API.BASE_URL}/enterprise/reports/${id}/download`, '_blank');
        showToast("Report exported successfully");
      }
    } catch (err) {
      showToast("Export failed", "error");
    }
  };

  if (loading && !data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-emerald-500 animate-spin" size={40} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Crunching Numbers...</p>
      </div>
    );
  }

  // Transform monthly_revenue for Recharts
  const chartData = data ? Object.entries(data.monthly_revenue).map(([month, rev]) => ({
    name: month,
    revenue: rev
  })) : [];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span className="font-medium text-xs uppercase tracking-wider">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
            <DollarSign className="text-emerald-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Financial Intelligence</h1>
            <p className="text-sm text-slate-500 font-medium">Revenue analytics & platform yield monitoring</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-2xl border border-slate-700 transition-all uppercase tracking-widest"
          >
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={fetchBillingData}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl shadow-xl shadow-emerald-600/30 transition-all uppercase tracking-widest"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Update Metrics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BillingStatCard 
          label="Total Revenue" 
          value={`$${(data?.total_revenue || 0).toLocaleString()}`} 
          growth={`${data?.churn_rate || 0}% Churn`} 
          icon={DollarSign} 
          color="emerald" 
        />
        <BillingStatCard 
          label="Monthly Recurring" 
          value={`$${(data?.mrr || 0).toLocaleString()}`} 
          growth="Stable" 
          icon={Activity} 
          color="indigo" 
        />
        <BillingStatCard 
          label="Active Tenants" 
          value={data?.active_schools || 0} 
          growth={`Total: ${data?.total_students || 0} Students`} 
          icon={Layers} 
          color="amber" 
        />
        <BillingStatCard 
          label="Lifetime Value" 
          value={`$${(data?.ltv || 0).toLocaleString()}`} 
          growth="Estimated" 
          icon={TrendingUp} 
          color="blue" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue Pulse
            </h3>
          </div>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-indigo-500" /> School Distribution
          </h3>
          <div className="space-y-8">
            {data?.revenue_by_school.slice(0, 5).map((s, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-200 uppercase truncate max-w-[150px]">{s.school_name}</span>
                  <span className="text-[10px] font-mono text-emerald-400">${s.revenue.toLocaleString()}</span>
                </div>
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(s.revenue / (data.total_revenue || 1)) * 100}%` }} 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-emerald-500" 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-6 bg-indigo-600/10 border border-indigo-600/20 rounded-3xl">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Market Insights</p>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
              "System has detected a {data?.churn_rate}% churn factor. Monitoring school engagement levels is recommended for current billing cycle."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingStatCard({ label, value, growth, icon: Icon, color }) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-[2.5rem] p-8 backdrop-blur-sm group relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/50 group-hover:scale-110 transition-transform">
          <Icon size={22} />
        </div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${growth.includes('Churn') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {growth}
        </span>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Icon size={80} />
      </div>
    </div>
  );
}
