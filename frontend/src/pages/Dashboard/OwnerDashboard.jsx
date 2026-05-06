import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  School, Users, CreditCard, Server, Database, Globe, Zap, Loader,
  TrendingUp, Activity, DollarSign, AlertCircle, Shield, HardDrive,
  Plug, Bell, Rss, FlaskConical, FileText, ArrowUpRight, EyeOff,
  RotateCcw, Ban, Lock, RefreshCw, AlertTriangle, TrendingDown,
  Brain, Terminal, Command, Search, Filter, Play, ExternalLink,
  ChevronRight, MoreVertical, Trash2, Edit3, UserCheck, AppWindow
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import API, { apiFetch } from '../../config';

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4'];

export function OwnerDashboard() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [schools, setSchools] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [securityStats, setSecurityStats] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchLiveFeed, 30000); // Update feed every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [schoolsRes, analyticsRes, feedRes, systemRes, securityRes] = await Promise.all([
        apiFetch('/schools/'),
        apiFetch('/dev/saas-analytics'),
        apiFetch('/dev/activity-feed?limit=15'),
        apiFetch('/dev/system'),
        apiFetch('/dev/logs-summary'),
      ]);

      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (feedRes.ok) setActivityFeed(await feedRes.json());
      if (systemRes.ok) setSystemInfo(await systemRes.json());
      if (securityRes.ok) setSecurityStats(await securityRes.json());
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      showToast("Connection error. Some data might be stale.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveFeed = async () => {
    try {
      const res = await apiFetch('/dev/activity-feed?limit=15');
      if (res.ok) setActivityFeed(await res.json());
    } catch (err) { console.error("Feed update failed", err); }
  };

  const handleDeleteSchool = async (schoolId, schoolName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${schoolName}"? This will permanently erase all students, teachers, and school data. This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await apiFetch(`/schools/${schoolId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`${schoolName} and all related accounts deleted`, "success");
        setSchools(prev => prev.filter(s => s.id !== schoolId));
      } else {
        const err = await res.json();
        showToast(err.detail || "Deletion failed", "error");
      }
    } catch (err) {
      showToast("Network error during deletion", "error");
    }
  };

  const handleImpersonate = async (schoolId) => {
    try {
      // First, get the super admin for this school
      const usersRes = await apiFetch('/auth/users?role=Super Admin');
      if (!usersRes.ok) throw new Error("Failed to fetch users");
      const users = await usersRes.json();
      const target = users.find(u => u.school_id === schoolId);
      
      if (!target) {
        showToast("No Super Admin found for this school", "error");
        return;
      }

      const res = await apiFetch(`/auth/impersonate/${target.id}`, { 
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update AuthContext and redirect
        showToast(`Logged in as ${target.name}`, "success");
        setTimeout(() => window.location.href = '/school', 1000);
      } else {
        const err = await res.json();
        showToast(err.detail || "Impersonation failed", "error");
      }
    } catch (err) {
      showToast("Security error during impersonation", "error");
    }
  };

  const runAiDiagnostic = async () => {
    setIsAiLoading(true);
    try {
      const res = await apiFetch('/dev/ai-analyze', { method: 'POST' });
      if (res.ok) setAiAnalysis(await res.json());
    } catch (err) {
      showToast("AI Diagnostic failed", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownloadReport = async (type = 'security') => {
    try {
      showToast(`Generating ${type} report...`, "info");
      const genRes = await apiFetch('/enterprise/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: type, format: 'csv' })
      });
      
      if (!genRes.ok) {
        const errorData = await genRes.json().catch(() => ({}));
        const detail = typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : errorData.detail;
        throw new Error(detail || `Server error ${genRes.status}`);
      }
      const { id } = await genRes.json();
      
      // Trigger download using a hidden link
      const downloadUrl = `${API.BASE_URL}/enterprise/reports/${id}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `report_${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast("Report download started", "success");
    } catch (err) {
      console.error("Report download failed", err);
      showToast(`Failed: ${err.message}`, "error");
    }
  };

  const handleDevAction = async (endpoint, label) => {
    try {
      showToast(`${label} in progress...`, "info");
      const res = await apiFetch(`/dev/${endpoint}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || `${label} completed successfully`, "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Operation failed");
      }
    } catch (err) {
      console.error(`${label} failed`, err);
      showToast(`Failed: ${err.message}`, "error");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-indigo-500" />
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
        </motion.div>
        <p className="text-slate-400 mt-4 font-mono animate-pulse">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-12 overflow-x-hidden w-full">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <Zap size={18} />}
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-800 px-4 md:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-[1600px] mx-auto gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shrink-0">
              <Shield className="text-indigo-400" size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2 truncate">
                COMMAND_CENTER
                <span className="text-[8px] md:text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest shrink-0">v2.1</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium truncate">Infrastructure Management</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-0 border-slate-800 pt-3 sm:pt-0">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchAllData}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <RefreshCw size={16} />
              </button>
              <button 
                onClick={() => navigate('/schools')}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
              >
                <School size={14} /> <span className="hidden xs:inline">New Tenant</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Metrics & Analytics */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <PlatformStat 
                icon={School} 
                label="Total Schools" 
                value={schools.length} 
                subValue={`${analytics?.activeVsInactive.active || 0} Active`}
                color="indigo" 
              />
              <PlatformStat 
                icon={Users} 
                label="Platform Users" 
                value={securityStats?.total || 0} 
                subValue={`+${analytics?.growth.newSchoolsThisMonth || 0} this month`}
                color="violet" 
              />
              <PlatformStat 
                icon={DollarSign} 
                label="Total Revenue" 
                value={`$${(analytics?.revenuePerSchool.reduce((a, b) => a + b.value, 0) || 0).toLocaleString()}`} 
                subValue={`${analytics?.growth.growthRate.toFixed(1)}% Growth`}
                color="emerald" 
              />
              <PlatformStat 
                icon={Activity} 
                label="System Health" 
                value={systemInfo ? `${Math.round(systemInfo.cpu_percent)}%` : '---'} 
                subValue={`${systemInfo?.memory_percent || 0}% RAM Usage`}
                color={systemInfo?.cpu_percent > 80 ? 'red' : 'blue'} 
              />
            </div>

            {/* Main Content Tabs */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden backdrop-blur-sm">
              <div className="flex border-b border-slate-700/50 overflow-x-auto custom-scrollbar whitespace-nowrap">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={TrendingUp} label="Growth" />
                <TabButton active={activeTab === 'schools'} onClick={() => setActiveTab('schools')} icon={AppWindow} label="Tenants" />
                <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Shield} label="Security" />
                <TabButton active={activeTab === 'dev'} onClick={() => setActiveTab('dev')} icon={Terminal} label="Dev Ops" />
              </div>

              <div className="p-8">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                        <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                          <DollarSign size={16} /> Revenue per Tenant
                        </h3>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.revenuePerSchool || []}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                              <Tooltip 
                                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px'}}
                                itemStyle={{color: '#818cf8'}}
                              />
                              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                        <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                          <PieChart size={16} /> Subscription Mix
                        </h3>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={analytics?.planDistribution || []} 
                                cx="50%" cy="50%" innerRadius={60} outerRadius={80} 
                                paddingAngle={5} dataKey="count" nameKey="plan"
                                strokeWidth={0}
                              >
                                {analytics?.planDistribution.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schools' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-700/50">
                          <th className="pb-4 font-black">School Name</th>
                          <th className="pb-4 font-black">Code</th>
                          <th className="pb-4 font-black">Plan</th>
                          <th className="pb-4 font-black">Status</th>
                          <th className="pb-4 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {schools.map((school) => (
                          <tr key={school.id} className="group hover:bg-slate-800/30 transition-all">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                  <School size={18} />
                                </div>
                                <span className="font-bold text-slate-200">{school.name}</span>
                              </div>
                            </td>
                            <td className="py-4 font-mono text-xs text-slate-500">{school.code}</td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                                school.subscription_plan === 'Enterprise' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                school.subscription_plan === 'Premium' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                'bg-slate-700 text-slate-400'
                              }`}>
                                {school.subscription_plan}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${school.is_active ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
                                <span className="text-xs font-medium">{school.is_active ? 'Active' : 'Locked'}</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleImpersonate(school.id)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg border border-slate-700 transition-all"
                                >
                                  <UserCheck size={12} /> <span className="hidden sm:inline">Impersonate</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteSchool(school.id, school.name)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg border border-slate-700 transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SecurityMetric label="Blocked IPs" value={securityStats?.rate_blocks || 0} icon={Ban} color="red" />
                      <SecurityMetric label="Failed Logins" value={securityStats?.failed_logins || 0} icon={AlertCircle} color="orange" />
                      <SecurityMetric label="System Alerts" value={securityStats?.recent_issues.length || 0} icon={Bell} color="amber" />
                    </div>
                    
                    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                      <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Security Events</h3>
                        <button 
                          onClick={() => handleDownloadReport('security')}
                          className="text-[10px] text-indigo-400 font-bold hover:underline"
                        >
                          Download Report
                        </button>
                      </div>
                      <div className="divide-y divide-slate-800">
                        {securityStats?.top_failed_ips.map((ip, i) => (
                          <div key={i} className="p-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <AlertTriangle size={14} className="text-red-500" />
                              <span className="font-mono text-slate-400">{ip.ip}</span>
                            </div>
                            <span className="text-red-400 font-bold">{ip.count} Brute Force Attempts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dev' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DevActionCard 
                      icon={RotateCcw} 
                      title="Server Control" 
                      desc="Hot-reload system services or restart backend workers." 
                      action="Restart Server"
                      color="red"
                      onClick={() => handleDevAction('restart-server', 'Server Restart')}
                    />
                    <DevActionCard 
                      icon={Zap} 
                      title="Performance" 
                      desc="Flush Redis cache and optimize SQL query pool." 
                      action="Purge Cache"
                      color="amber"
                      onClick={() => handleDevAction('purge-cache', 'Cache Purge')}
                    />
                    <DevActionCard 
                      icon={Database} 
                      title="Database Maint" 
                      desc="Run pending migrations and health check tables." 
                      action="Migrate DB"
                      color="green"
                      onClick={() => handleDevAction('migrate-db', 'DB Migration')}
                    />
                    <DevActionCard 
                      icon={HardDrive} 
                      title="Backup Center" 
                      desc="Create a full system snapshot and upload to S3." 
                      action="Snapshot Now"
                      color="blue"
                      onClick={() => handleDevAction('create-snapshot', 'Snapshot')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI & Live Feed */}
          <div className="space-y-8">
            
            {/* AI Assistant Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Brain size={80} />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Brain className="text-indigo-400" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Diagnostic</h3>
                  <p className="text-[10px] text-indigo-300">System Intelligence Engine</p>
                </div>
              </div>

              {!aiAnalysis ? (
                <div className="space-y-4">
                  <p className="text-xs text-indigo-200/70 leading-relaxed italic">
                    "Connect to the intelligence engine to analyze platform logs and detect hidden anomalies."
                  </p>
                  <button 
                    onClick={runAiDiagnostic}
                    disabled={isAiLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? <Loader className="animate-spin" size={14} /> : <Zap size={14} />}
                    Run AI Analysis
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-900/40 rounded-xl border border-indigo-500/20">
                    <p className="text-[11px] leading-relaxed text-indigo-100">{aiAnalysis.analysis}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Suggestions</p>
                    {aiAnalysis.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-indigo-200/80">
                        <div className="mt-1 w-1 h-1 rounded-full bg-indigo-500" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="w-full py-2 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded-xl hover:bg-indigo-500/10 transition-all"
                  >
                    Clear Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Live Activity Feed */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden backdrop-blur-sm">
              <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rss size={16} className="text-green-400" />
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Global Activity</h3>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {activityFeed.length > 0 ? activityFeed.map((event, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        event.type.includes('login') ? 'bg-blue-500' :
                        event.type.includes('payment') ? 'bg-emerald-500' :
                        event.type.includes('created') ? 'bg-indigo-500' : 'bg-slate-600'
                      }`} />
                      <div className="w-[1px] flex-1 bg-slate-700/50 my-1 group-last:hidden" />
                    </div>
                    <div className="pb-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        {event.type.replace('_', ' ')}
                      </p>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        <span className="font-bold text-indigo-400">{event.user || 'System'}</span>
                        {event.details && ` - ${event.details}`}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1 font-mono">{event.timestamp.split('T')[1].slice(0, 5)} · {event.ip || 'Local'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center text-slate-600 italic text-[10px]">No recent platform signals...</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function PlatformStat({ icon: Icon, label, value, subValue, color }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    violet: 'from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 md:p-6 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <Icon size={18} className="md:w-5 md:h-5" />
      </div>
      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-lg md:text-2xl font-black text-white tracking-tight">{value}</h4>
      <p className="text-[8px] md:text-[10px] font-bold text-slate-500 mt-1">{subValue}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${
        active 
          ? 'text-white border-indigo-500 bg-indigo-500/5' 
          : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function SecurityMetric({ label, value, icon: Icon, color }) {
  const colors = {
    red: 'text-red-400 bg-red-400/10 border-red-400/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  };
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-black">{value}</span>
    </div>
  );
}

function DevActionCard({ icon: Icon, title, desc, action, color, onClick }) {
  const colors = {
    red: 'bg-red-500 hover:bg-red-600',
    amber: 'bg-amber-500 hover:bg-amber-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  };
  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
          <Icon size={20} />
        </div>
        <h4 className="text-sm font-bold text-white mb-2">{title}</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
      </div>
      <button 
        onClick={onClick}
        className={`mt-6 w-full py-2 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all ${colors[color]}`}
      >
        {action}
      </button>
    </div>
  );
}
