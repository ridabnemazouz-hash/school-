import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  School, Users, CreditCard, Server, Database, Globe, Zap, Loader,
  TrendingUp, Activity, DollarSign, AlertCircle
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schoolsRes, statsRes, healthRes, pendingRes] = await Promise.all([
        fetch(`${API}/schools/`, { credentials: 'include' }),
        fetch(`${API}/students/stats`, { credentials: 'include' }),
        fetch(`${API}/health`, { credentials: 'include' }),
        fetch(`${API}/auth/pending-requests`, { credentials: 'include' }),
      ]);

      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (statsRes.ok) setSystemStats(await statsRes.json());
      if (healthRes.ok) setHealthData(await healthRes.json());
      if (pendingRes.ok) setPendingRequests(await pendingRes.json());
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
