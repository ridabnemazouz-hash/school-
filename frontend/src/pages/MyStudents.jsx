import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Search, GraduationCap, Mail, MessageSquare, TrendingUp, Filter } from 'lucide-react';

const MY_STUDENTS = [
  { id: 1, name: 'Anas Tazi', class: '10-A', lastGrade: '16/20', performance: 'Improving', avatar: 'https://ui-avatars.com/api/?name=Anas+Tazi&background=6366f1&color=fff' },
  { id: 2, name: 'Meryem Amrani', class: '10-A', lastGrade: '18.5/20', performance: 'Excellent', avatar: 'https://ui-avatars.com/api/?name=Meryem+Amrani&background=6366f1&color=fff' },
  { id: 3, name: 'Youssef Karim', class: '10-B', lastGrade: '12/20', performance: 'Stable', avatar: 'https://ui-avatars.com/api/?name=Youssef+Karim&background=6366f1&color=fff' },
  { id: 4, name: 'Sara Lahlou', class: '10-B', lastGrade: '14/20', performance: 'Needs Focus', avatar: 'https://ui-avatars.com/api/?name=Sara+Lahlou&background=6366f1&color=fff' },
];

export function MyStudents() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Students</h1>
          <p className="text-slate-500 mt-1">Track individual performance and contact students/parents.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="bg-white border border-slate-200"><Filter size={18} className="mr-2" /> Filter</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">Performance Report</Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by student name or class..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Last Grade</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MY_STUDENTS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.class.toLowerCase().includes(search.toLowerCase())).map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                  <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full border border-slate-100" />
                  {student.name}
                </TableCell>
                <TableCell>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    {student.class}
                  </span>
                </TableCell>
                <TableCell className="font-bold text-indigo-600">{student.lastGrade}</TableCell>
                <TableCell>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                    student.performance === 'Excellent' ? 'text-green-600' : 
                    student.performance === 'Improving' ? 'text-blue-600' : 
                    student.performance === 'Needs Focus' ? 'text-orange-600' : 'text-slate-500'
                  }`}>
                    <TrendingUp size={14} />
                    {student.performance}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><MessageSquare size={16} /></Button>
                    <Button variant="ghost" size="sm" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Mail size={16} /></Button>
                    <Button variant="ghost" size="sm" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><GraduationCap size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
