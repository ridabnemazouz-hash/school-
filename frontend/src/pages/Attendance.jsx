import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Search, Calendar, CheckCircle2, XCircle, Clock, Save } from 'lucide-react';

const FAKE_STUDENTS = [
  { id: 1, name: 'Anas Tazi', class: '10-A', status: 'present' },
  { id: 2, name: 'Meryem Amrani', class: '10-A', status: 'present' },
  { id: 3, name: 'Youssef Karim', class: '10-A', status: 'late' },
  { id: 4, name: 'Sara Lahlou', class: '10-A', status: 'absent' },
];

export function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [attendanceData, setAttendanceData] = useState(FAKE_STUDENTS);
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = (id, newStatus) => {
    setAttendanceData(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Attendance saved successfully for ' + date);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Tracking</h1>
          <p className="text-slate-500 mt-1">Mark and monitor daily student attendance.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
          <Save size={18} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save Attendance'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Select Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none p-0 text-slate-800 font-semibold focus:ring-0 cursor-pointer"
            />
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Select Class</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none p-0 text-slate-800 font-semibold focus:ring-0 cursor-pointer"
            >
              <option value="10-A">Class 10-A</option>
              <option value="10-B">Class 10-B</option>
              <option value="11-A">Class 11-A</option>
            </select>
          </div>
        </Card>

        <Card className="p-4 bg-slate-800 text-white flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase font-bold">Summary</p>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold">{attendanceData.filter(s => s.status === 'present').length}</p>
                <p className="text-[10px] text-green-400 uppercase">Present</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{attendanceData.filter(s => s.status === 'absent').length}</p>
                <p className="text-[10px] text-red-400 uppercase">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{attendanceData.filter(s => s.status === 'late').length}</p>
                <p className="text-[10px] text-amber-400 uppercase">Late</p>
              </div>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow flex items-center justify-center text-[10px] font-bold">
             {Math.round((attendanceData.filter(s => s.status === 'present').length / attendanceData.length) * 100)}%
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
           <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter students..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={() => setAttendanceData(prev => prev.map(s => ({...s, status: 'present'})))} className="text-xs text-green-600">Mark All Present</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {student.name.charAt(0)}
                  </div>
                  {student.name}
                </TableCell>
                <TableCell className="text-slate-500">{student.class}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 ${student.status === 'present' ? 'bg-green-100 text-green-700 ring-2 ring-green-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <CheckCircle2 size={18} />
                      <span className="text-[10px] mt-1 font-bold uppercase">Present</span>
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 ${student.status === 'late' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Clock size={18} />
                      <span className="text-[10px] mt-1 font-bold uppercase">Late</span>
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 ${student.status === 'absent' ? 'bg-red-100 text-red-700 ring-2 ring-red-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <XCircle size={18} />
                      <span className="text-[10px] mt-1 font-bold uppercase">Absent</span>
                    </button>
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
