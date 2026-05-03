import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  School, Users, CreditCard, Server, Database, Globe, Zap, Loader,
  TrendingUp, Activity, DollarSign, AlertCircle, Shield, HardDrive,
  Plug, Bell, Rss, FlaskConical, FileText, ArrowUpRight, EyeOff,
  RotateCcw, Ban, Lock, RefreshCw, AlertTriangle, TrendingDown
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import API from '../../config';

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'];

export function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [systemStats, setSystemStats] = useState({ totalStudents: 0, totalTeachers: 0, totalClasses: 0, averageAttendance: 0 });
  const [healthData, setHealthData] = useState({ status: 'ok', database: 'Disconnected', uptime: 'running' });
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [securityData, setSecurityData] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [backupsData, setBackupsData] = useState([]);
  const [alertsData, setAlertsData] = useState({ rules: [], notifications: [] });
  const [feedData, setFeedData] = useState([]);
  const [integrationsData, setIntegrationsData] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schoolsRes, statsRes, healthRes, pendingRes,
        securityRes, billingRes, backupsRes, alertsRulesRes, alertsNotifsRes, feedRes, integrationsRes, systemRes
      ] = await Promise.all([
        fetch(`${API}/schools/`, { credentials: 'include' }),
        fetch(`${API}/students/stats`, { credentials: 'include' }),
        fetch(`${API}/health`, { credentials: 'include' }),
        fetch(`${API}/auth/pending-requests`, { credentials: 'include' }),
        fetch(`${API}/enterprise/security/dashboard`, { credentials: 'include' }),
        fetch(`${API}/enterprise/billing/analytics`, { credentials: 'include' }),
        fetch(`${API}/enterprise/backups`, { credentials: 'include' }),
        fetch(`${API}/enterprise/alerts/rules`, { credentials: 'include' }),
        fetch(`${API}/enterprise/alerts/notifications?unread_only=true`, { credentials: 'include' }),
        fetch(`${API}/enterprise/activity-feed?limit=8`, { credentials: 'include' }),
        fetch(`${API}/enterprise/integrations`, { credentials: 'include' }),
        fetch(`${API}/enterprise/reload/status`, { credentials: 'include' }),
      ]);

      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (statsRes.ok) setSystemStats(await statsRes.json());
      if (healthRes.ok) setHealthData(await healthRes.json());
      if (pendingRes.ok) setPendingRequests(await pendingRes.json());
      if (securityRes.ok) setSecurityData(await securityRes.json());
      if (billingRes.ok) setBillingData(await billingRes.json());
      if (backupsRes.ok) setBackupsData(await backupsRes.json());
      if (alertsRulesRes.ok) {
        const rules = await alertsRulesRes.json();
        setAlertsData(prev => ({ ...prev, rules }));
      }
      if (alertsNotifsRes.ok) {
        const notifications = await alertsNotifsRes.json();
        setAlertsData(prev => ({ ...prev, notifications }));
      }
      if (feedRes.ok) setFeedData(await feedRes.json());
      if (integrationsRes.ok) setIntegrationsData(await integrationsRes.json());
      if (systemRes.ok) setSystemInfo(await systemRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/auth/approve/${id}`, { method: 'PUT', credentials: 'include' });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/auth/reject/${id}`, { method: 'PUT', credentials: 'include' });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const activeSchools = schools.filter(s => s.is_active).length;
  const totalUsers = systemStats.totalStudents + systemStats.totalTeachers;
  const activeSubs = schools.filter(s => s.subscription_status === 'Active').length;

  const planData = [];
  const planCounts = {};
  schools.forEach(s => { planCounts[s.subscription_plan] = (planCounts[s.subscription_plan] || 0) + 1; });
  Object.entries(planCounts).forEach(([name, value]) => planData.push({ name, value }));

  const schoolUsageData = schools.map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    students: s.max_students ? Math.round((10 / s.max_students) * 100) : 0,
  })).slice(0, 8);

  const statusData = [
    { name: 'Active', value: activeSchools },
    { name: 'Inactive', value: schools.length - activeSchools },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg bg-green-600 text-white">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform overview and management</p>
        </div>
        <button
          onClick={() => navigate('/schools')}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add School
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Schools" value={schools.length} icon={School} trend={activeSchools > 0 ? `${activeSchools} active` : 'none'} color="violet" />
        <StatCard title="Total Users" value={totalUsers} icon={Users} trend={`${systemStats.totalStudents} students, ${systemStats.totalTeachers} teachers`} color="indigo" />
        <StatCard title="Active Subscriptions" value={activeSubs} icon={CreditCard} trend={`$${schools.length * 299}/mo revenue`} color="emerald" />
        <StatCard title="System Status" value={healthData.database === 'Connected' ? 'Online' : 'Offline'} icon={Activity} trend={`v${healthData.version || '2.0'}`} color={healthData.database === 'Connected' ? 'green' : 'red'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schools Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Schools</h3>
              <p className="text-xs text-slate-400 mt-0.5">{schools.length} registered</p>
            </div>
            <button onClick={() => navigate('/schools')} className="text-xs font-medium text-amber-600 hover:text-amber-700">
              Manage
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">School</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Limits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {schools.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No schools yet. Create your first school to get started.</td></tr>
                ) : (
                  schools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                            <School size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{school.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{school.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <PlanBadge plan={school.subscription_plan} />
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {school.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {school.max_students} students / {school.max_teachers} teachers
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Subscription Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Subscriptions</h3>
            {planData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {planData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-slate-400 text-xs">No data</div>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {planData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-slate-500">{d.name}</span>
                  <span className="font-medium text-slate-700">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">System Health</h3>
            <div className="space-y-3">
              <HealthItem icon={Database} label="Database" status={healthData.database} ok={healthData.database === 'Connected'} />
              <HealthItem icon={Server} label="Backend API" status={healthData.status === 'ok' ? 'Running' : 'Down'} ok={healthData.status === 'ok'} />
              <HealthItem icon={Globe} label="Frontend" status="Online" ok={true} />
              <HealthItem icon={Zap} label="Version" status={healthData.version || '2.0.0'} ok={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Sections */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enterprise Suite</h2>
            <p className="text-xs text-slate-500 mt-0.5">Advanced management tools</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <RefreshCw size={12} /> Refresh All
          </button>
        </div>

        {/* Enterprise Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <EntStatCard
            label="Incidents"
            value={securityData?.active_incidents ?? 0}
            icon={Shield}
            color={securityData?.critical_incidents > 0 ? 'red' : 'green'}
            detail={`${securityData?.blocked_ips ?? 0} blocked IPs`}
          />
          <EntStatCard
            label="Revenue"
            value={billingData?.total_revenue ? `${(billingData.total_revenue / 1000).toFixed(1)}K` : '0'}
            icon={DollarSign}
            color="green"
            detail={`MRR: ${billingData?.mrr ?? 0}`}
          />
          <EntStatCard
            label="Churn"
            value={`${billingData?.churn_rate ?? 0}%`}
            icon={TrendingDown}
            color={billingData?.churn_rate > 10 ? 'red' : 'green'}
            detail={`LTV: ${billingData?.ltv ?? 0}`}
          />
          <EntStatCard
            label="Backups"
            value={backupsData.length}
            icon={HardDrive}
            color="blue"
            detail={backupsData.length > 0 ? `${backupsData[0].size_mb}MB last` : 'No backups'}
          />
          <EntStatCard
            label="Unread Alerts"
            value={alertsData.notifications?.length ?? 0}
            icon={Bell}
            color={alertsData.notifications?.length > 0 ? 'amber' : 'green'}
            detail={`${alertsData.rules?.filter(r => r.enabled).length ?? 0} active rules`}
          />
          <EntStatCard
            label="Integrations"
            value={integrationsData.filter(i => i.is_active).length}
            icon={Plug}
            color="indigo"
            detail={`${integrationsData.length} total`}
          />
          <EntStatCard
            label="Uptime"
            value={systemInfo ? `${Math.round(systemInfo.uptime_seconds / 60)}m` : '-'}
            icon={Server}
            color="green"
            detail={`PID: ${systemInfo?.pid ?? '-'}`}
          />
        </div>

        {/* Security + Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Security Center */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-red-500" />
                <h3 className="text-sm font-semibold text-slate-800">Security Center</h3>
              </div>
              <button onClick={() => navigate('/dev-console')} className="text-xs font-medium text-amber-600 hover:text-amber-700">Open</button>
            </div>
            <div className="p-5 space-y-3">
              {securityData ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-red-700">{securityData.active_incidents}</p>
                      <p className="text-[10px] text-red-500">Active Incidents</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-orange-700">{securityData.failed_logins_today}</p>
                      <p className="text-[10px] text-orange-500">Failed Logins (24h)</p>
                    </div>
                  </div>
                  {securityData.critical_incidents > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
                      <p className="text-xs text-red-700">{securityData.critical_incidents} critical incident{securityData.critical_incidents > 1 ? 's' : ''} need attention</p>
                    </div>
                  )}
                  {securityData.top_attacker_ips?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 mb-1">Top Attacker IPs</p>
                      {securityData.top_attacker_ips.slice(0, 3).map((ip, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1">
                          <span className="font-mono text-slate-600">{ip.ip}</span>
                          <span className="text-red-500 font-medium">{ip.count} hits</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-6 text-slate-400"><Loader size={16} className="animate-spin mr-2" />Loading...</div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-800">Alerts</h3>
                {alertsData.notifications?.length > 0 && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alertsData.notifications.length}</span>
                )}
              </div>
              <button onClick={() => navigate('/dev-console')} className="text-xs font-medium text-amber-600 hover:text-amber-700">Open</button>
            </div>
            <div className="p-5 space-y-2 max-h-[220px] overflow-y-auto">
              {alertsData.notifications?.length > 0 ? (
                alertsData.notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.severity === 'critical' ? 'bg-red-500' : n.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{n.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{n.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No active alerts</div>
              )}
            </div>
          </div>

          {/* Live Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rss size={16} className="text-green-500" />
                <h3 className="text-sm font-semibold text-slate-800">Live Feed</h3>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            <div className="p-5 space-y-2 max-h-[220px] overflow-y-auto">
              {feedData.length > 0 ? (
                feedData.map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      e.event_type.includes('created') ? 'bg-green-500' :
                      e.event_type.includes('login') ? 'bg-blue-500' :
                      e.event_type.includes('payment') ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <span className="font-mono text-[10px] text-slate-400 w-16 truncate">{e.event_type.split('_').pop()}</span>
                    <span className="text-slate-600 truncate flex-1">{e.user_email || 'system'}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{e.ago}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        {/* Billing + Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Billing */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-green-500" />
                <h3 className="text-sm font-semibold text-slate-800">Billing</h3>
              </div>
              <button onClick={() => navigate('/dev-console')} className="text-xs font-medium text-amber-600 hover:text-amber-700">Details</button>
            </div>
            <div className="p-5">
              {billingData ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-green-700">{billingData.total_revenue.toLocaleString()}</p>
                      <p className="text-[10px] text-green-500">Total Revenue</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-blue-700">{billingData.mrr.toLocaleString()}</p>
                      <p className="text-[10px] text-blue-500">MRR</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100">
                    <span className="text-slate-500">LTV</span>
                    <span className="font-medium text-slate-700">{billingData.ltv.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100">
                    <span className="text-slate-500">Churn Rate</span>
                    <span className={`font-medium ${billingData.churn_rate > 10 ? 'text-red-600' : 'text-green-600'}`}>{billingData.churn_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100">
                    <span className="text-slate-500">Active Schools</span>
                    <span className="font-medium text-slate-700">{billingData.active_schools}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-6 text-slate-400"><Loader size={16} className="animate-spin mr-2" />Loading...</div>
              )}
            </div>
          </div>

          {/* Backups */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-blue-500" />
                <h3 className="text-sm font-semibold text-slate-800">Backups</h3>
              </div>
              <button onClick={async () => {
                const res = await fetch(`${API}/enterprise/backups/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ type: 'manual' }) });
                if (res.ok) { const d = await res.json(); showToast(`Backup created: ${d.filename}`); fetchData(); }
              }} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-green-50 text-green-600 rounded hover:bg-green-100">
                <HardDrive size={10} /> Create
              </button>
            </div>
            <div className="p-5">
              {backupsData.length > 0 ? (
                <div className="space-y-2">
                  {backupsData.slice(0, 4).map(b => (
                    <div key={b.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-mono text-slate-700 truncate max-w-[150px]">{b.filename}</p>
                        <p className="text-[10px] text-slate-400">{b.size_mb}MB &middot; {new Date(b.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${b.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No backups yet</div>
              )}
            </div>
          </div>

          {/* Integrations Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plug size={16} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-800">Integrations</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {integrationsData.length > 0 ? (
                integrationsData.map(int => (
                  <div key={int.service} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{int.icon}</span>
                      <div>
                        <p className="text-xs font-medium text-slate-700">{int.name}</p>
                        {int.last_tested && <p className="text-[10px] text-slate-400">Tested: {new Date(int.last_tested).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${int.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{int.is_active ? 'Active' : 'Off'}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No integrations configured</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Quick Actions</h3>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <QuickAction icon={Shield} label="Block IP" color="red" onClick={() => { navigate('/dev-console'); }} />
            <QuickAction icon={Lock} label="Reset Passwords" color="orange" onClick={() => { navigate('/dev-console'); }} />
            <QuickAction icon={RotateCcw} label="Restart Server" color="red" onClick={async () => { const res = await fetch(`${API}/enterprise/reload/restart`, { method: 'POST', credentials: 'include' }); if (res.ok) showToast('Restart signal sent'); }} />
            <QuickAction icon={Zap} label="Clear Cache" color="amber" onClick={async () => { const res = await fetch(`${API}/enterprise/reload/clear-cache`, { method: 'POST', credentials: 'include' }); if (res.ok) showToast('Cache cleared'); }} />
            <QuickAction icon={EyeOff} label="Anonymize" color="slate" onClick={() => { navigate('/dev-console'); }} />
            <QuickAction icon={FlaskConical} label="A/B Tests" color="violet" onClick={() => { navigate('/dev-console'); }} />
            <QuickAction icon={FileText} label="Reports" color="blue" onClick={() => { navigate('/dev-console'); }} />
            <QuickAction icon={ArrowUpRight} label="Migrations" color="green" onClick={() => { navigate('/dev-console'); }} />
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Pending Approvals</h3>
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingRequests.map((req) => (
              <div key={req.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {req.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{req.name}</p>
                  <p className="text-[10px] text-slate-400">{req.email} · {req.role}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.id)} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleReject(req.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }) {
  const colors = {
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    red: { bg: 'bg-red-50', icon: 'text-red-600' },
  };
  const c = colors[color] || colors.violet;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${c.bg}`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
    </div>
  );
}

function PlanBadge({ plan }) {
  const styles = {
    Free: 'bg-slate-100 text-slate-600',
    Basic: 'bg-blue-100 text-blue-700',
    Premium: 'bg-violet-100 text-violet-700',
    Enterprise: 'bg-amber-100 text-amber-700',
  };
  return <span className={`text-xs font-medium px-2 py-1 rounded-md ${styles[plan] || styles.Free}`}>{plan}</span>;
}

function HealthItem({ icon: Icon, label, status, ok }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon size={14} className="text-slate-400" />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs font-medium text-slate-700">{status}</span>
      </div>
    </div>
  );
}

function EntStatCard({ label, value, icon: Icon, color, detail }) {
  const colors = {
    red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-700' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-700' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', value: 'text-indigo-700' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-600', value: 'text-slate-700' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', value: 'text-orange-700' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', value: 'text-violet-700' },
  };
  const c = colors[color] || colors.slate;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
      <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
        <Icon size={14} className={c.icon} />
      </div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold ${c.value}`}>{value}</p>
      <p className="text-[10px] text-slate-400 truncate">{detail}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  const colors = {
    red: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-100',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-100',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100',
    violet: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100',
    slate: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100',
  };
  const c = colors[color] || colors.slate;
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${c} transition-colors`}>
      <Icon size={18} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
