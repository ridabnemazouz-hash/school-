import React from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Plus, Search, MoreVertical } from 'lucide-react';
import { FAKE_STUDENTS } from '../data/fakeData';

export function Students() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students Management</h1>
          <p className="text-slate-500 mt-1">Manage all students in the system.</p>
        </div>
        <Button className="shrink-0">
          <Plus size={18} className="mr-2" />
          Add Student
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
            />
          </div>
          <div className="flex gap-2 text-sm text-slate-500">
            <span>Filter by: Class</span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>GPA</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FAKE_STUDENTS.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-slate-800">{student.name}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    {student.class}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    parseInt(student.attendance) > 90 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {student.attendance}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-slate-700">{student.gpa}</TableCell>
                <TableCell className="text-right">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
