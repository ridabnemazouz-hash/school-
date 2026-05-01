import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', attendance: 95 },
  { name: 'Tue', attendance: 97 },
  { name: 'Wed', attendance: 96 },
  { name: 'Thu', attendance: 94 },
  { name: 'Fri', attendance: 98 },
];

const API = 'http://localhost:8000';

export function DashboardHome() {
  const { user } = useAuth();
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

  const renderStats = () => {
    if (user.role === 'Student' || user.role === 'Parent') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard title="GPA" value="3.8" icon={TrendingUp} color="mauve" />
          <StatCard title="Attendance" value="95%" icon={Users} color="green" />
          <StatCard title="Total Classes" value="8" icon={BookOpen} color="blue" />
        </div>
      );
    }

    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 flex items-center">
                <div className="w-12 h-12 rounded-xl bg-slate-200 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-slate-200 rounded w-12"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="mauve" />
        <StatCard title="Total Teachers" value={stats.totalTeachers} icon={GraduationCap} color="blue" />
        <StatCard title="Total Classes" value={stats.totalClasses} icon={BookOpen} color="orange" />
        <StatCard title="Avg Attendance" value={`${stats.averageAttendance}%`} icon={TrendingUp} color="green" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.name} 👋</h1>
        <p className="text-slate-500 mt-1">Here is what's happening in your school today.</p>
      </div>

      {renderStats()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Attendance Overview</h3>
          </div>
          <CardContent>
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="attendance" fill="#8f5c8f" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Recent Notifications</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 flex items-start hover:bg-slate-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-mauve-500 mt-2 mr-3 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">New Assignment Posted</p>
                    <p className="text-xs text-slate-500 mt-1">Mathematics 101 - Due in 2 days</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    mauve: 'bg-mauve-100 text-mauve-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center">
        <div className={`p-4 rounded-xl mr-4 ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
}
