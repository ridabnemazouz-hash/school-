import React, { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, BookOpen, TrendingUp, Calendar, 
  ArrowUpRight, Bell, Target, Award, FileText, FileDown, 
  MessageSquare, CreditCard, Settings 
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import API from '../../config';

const attendanceData = [
  { name: 'Mon', value: 92 },
  { name: 'Tue', value: 95 },
  { name: 'Wed', value: 88 },
  { name: 'Thu', value: 96 },
  { name: 'Fri', value: 94 },
];

export function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/students/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user.role === 'Admin' || user.role === 'Super Admin';
  const isTeacher = user.role === 'Teacher';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Marhaba, {user.name} <span className="inline-block animate-bounce-slow">👋</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">"Education is the most powerful weapon which you can use to change the world."</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar size={20} />
          </div>
          <div className="pr-4">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider leading-none mb-1">Today's Date</p>
            <p className="text-sm font-bold text-slate-700 leading-none">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
          <>
            <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="indigo" trend="+2.5%" />
            <StatCard title="Active Teachers" value={stats.totalTeachers} icon={GraduationCap} color="rose" trend="+12" />
            <StatCard title="Current Classes" value={stats.totalClasses} icon={BookOpen} color="amber" trend="0%" />
            <StatCard title="Avg Attendance" value={`${stats.averageAttendance}%`} icon={TrendingUp} color="emerald" trend="+1.2%" />
          </>
        ) : isTeacher ? (
          <>
            <StatCard title="My Students" value="124" icon={Users} color="indigo" trend="+4 new" />
            <StatCard title="My Classes" value="6" icon={BookOpen} color="rose" trend="Full schedule" />
            <StatCard title="Pending Grading" value="18" icon={Target} color="amber" trend="Priority" />
            <StatCard title="Today's Lessons" value="4" icon={Calendar} color="emerald" trend="2 remaining" />
          </>
        ) : (
          <>
            <StatCard title="Current GPA" value="16.5" icon={Target} color="indigo" trend="+0.5" />
            <StatCard title="My Attendance" value="98%" icon={Users} color="emerald" trend="Optimal" />
            <StatCard title="Lessons Done" value="24" icon={BookOpen} color="amber" trend="+3 this week" />
            <StatCard title="Class Rank" value="#3" icon={Award} color="rose" trend="Top 10%" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 overflow-hidden border-0 shadow-xl shadow-slate-200/50">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-lg font-bold text-slate-800">School Activity Overview</h3>
              <p className="text-xs text-slate-400 font-medium">Daily attendance fluctuations this week</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 py-2 px-4 focus:ring-0 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="p-6 bg-white">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}} 
                    cursor={{stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5'}}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Right Column: Notifications/Activity */}
        <div className="space-y-8">
          <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {isAdmin && (
                <>
                  <QuickAction icon={PlusIcon} label="Add Student" color="bg-indigo-50 text-indigo-600" onClick={() => navigate('/students')} />
                  <QuickAction icon={GraduationCap} label="Add Teacher" color="bg-rose-50 text-rose-600" onClick={() => navigate('/teachers')} />
                  <QuickAction icon={BookOpen} label="New Class" color="bg-amber-50 text-amber-600" onClick={() => navigate('/classes')} />
                  <QuickAction icon={CreditCard} label="Payments" color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/payments')} />
                </>
              )}
              {isTeacher && (
                <>
                  <QuickAction icon={PlusIcon} label="Add Grade" color="bg-indigo-50 text-indigo-600" onClick={() => navigate('/grades')} />
                  <QuickAction icon={BookOpen} label="My Classes" color="bg-rose-50 text-rose-600" onClick={() => navigate('/my-classes')} />
                  <QuickAction icon={FileDown} label="Upload Content" color="bg-amber-50 text-amber-600" onClick={() => navigate('/content')} />
                  <QuickAction icon={MessageSquare} label="Open Chat" color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/chat')} />
                </>
              )}
              {!isAdmin && !isTeacher && (
                <>
                  <QuickAction icon={Calendar} label="Planning" color="bg-indigo-50 text-indigo-600" onClick={() => navigate('/planning')} />
                  <QuickAction icon={FileText} label="My Grades" color="bg-rose-50 text-rose-600" onClick={() => navigate('/grades')} />
                  <QuickAction icon={MessageSquare} label="Chat Support" color="bg-amber-50 text-amber-600" onClick={() => navigate('/chat')} />
                  <QuickAction icon={Settings} label="Settings" color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/settings')} />
                </>
              )}
            </div>
          </Card>

          <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Pending Approvals</h3>
              <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse">4 New</span>
            </div>
            <div className="p-0">
              <div className="divide-y divide-slate-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {['JS', 'MK', 'OL'][i-1]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">New Account Request</p>
                      <p className="text-[10px] text-slate-400 font-medium">Applied for Teacher role · 2h ago</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50/50">
                <button className="w-full py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
                  View All Requests
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    indigo: 'bg-indigo-500 shadow-indigo-200',
    rose: 'bg-rose-500 shadow-rose-200',
    amber: 'bg-amber-500 shadow-amber-200',
    emerald: 'bg-emerald-500 shadow-emerald-200',
  };

  return (
    <Card className="border-0 shadow-xl shadow-slate-200/40 overflow-hidden hover:translate-y-[-4px] transition-all duration-300 group">
      <div className="p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl text-white shadow-lg ${colors[color]} group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
          </div>
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
            trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
          }`}>
            {trend}
          </span>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
      </div>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 ${color}`}
    >
      <Icon size={20} />
      <span className="text-[10px] font-bold mt-2 text-center leading-tight">{label}</span>
    </button>
  );
}

function PlusIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
