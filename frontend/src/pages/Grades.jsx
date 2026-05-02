import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Award } from 'lucide-react';

const performanceData = [
  { month: 'Sep', student: 12, classAvg: 14 },
  { month: 'Oct', student: 13.5, classAvg: 14.2 },
  { month: 'Nov', student: 15, classAvg: 14.5 },
  { month: 'Dec', student: 14.8, classAvg: 14.8 },
  { month: 'Jan', student: 16.5, classAvg: 15.0 },
];

const skillsData = [
  { subject: 'Math', A: 85, fullMark: 100 },
  { subject: 'Physics', A: 90, fullMark: 100 },
  { subject: 'English', A: 75, fullMark: 100 },
  { subject: 'History', A: 80, fullMark: 100 },
  { subject: 'Science', A: 95, fullMark: 100 },
];

export function Grades() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Advanced Analytics</h1>
        <p className="text-slate-500 mt-1">Track performance, detect risks, and compare with class averages.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Current Average</p>
                <h2 className="text-4xl font-bold mt-2">16.5/20</h2>
              </div>
              <div className="p-3 bg-emerald-400/30 rounded-xl">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
            <p className="text-emerald-100 text-sm mt-4 flex items-center">
              <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-md mr-2">+1.5</span>
              since last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium">Class Rank</p>
                <h2 className="text-4xl font-bold mt-2">3rd</h2>
              </div>
              <div className="p-3 bg-blue-400/30 rounded-xl">
                <Award size={24} className="text-white" />
              </div>
            </div>
            <p className="text-blue-100 text-sm mt-4 flex items-center">
              Out of 32 students in Class 10-A
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center text-orange-600 mb-3">
              <AlertTriangle size={20} className="mr-2" />
              <h3 className="font-semibold">AI Risk Detection</h3>
            </div>
            <p className="text-sm text-orange-800 mb-3">
              Student is showing a slight decline in <strong>English</strong> over the past 2 weeks. Recommend additional exercises.
            </p>
            <button className="text-xs font-semibold text-orange-600 uppercase tracking-wider hover:text-orange-700">
              View Recommendations &rarr;
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Grade Evolution vs Class Average</h3>
          </div>
          <CardContent>
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorStudent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8f5c8f" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8f5c8f" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} domain={[0, 20]} />
                  <Tooltip cursor={{stroke: '#e2e8f0'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="student" stroke="#8f5c8f" strokeWidth={3} fillOpacity={1} fill="url(#colorStudent)" name="Student" />
                  <Area type="monotone" dataKey="classAvg" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} name="Class Avg" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Skills Radar</h3>
          </div>
          <CardContent>
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Student" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
