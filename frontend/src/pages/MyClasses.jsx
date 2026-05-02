import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, BookOpen, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MY_CLASSES = [
  { id: 1, name: '10-A', subject: 'Mathematics', students: 28, room: 'Room 102', nextSession: 'Today, 08:00', progress: 75 },
  { id: 2, name: '10-B', subject: 'Mathematics', students: 25, room: 'Room 102', nextSession: 'Today, 10:00', progress: 60 },
  { id: 3, name: '11-A', subject: 'Advanced Algebra', students: 30, room: 'Lab 2', nextSession: 'Tomorrow, 09:00', progress: 45 },
];

export function MyClasses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Assigned Classes</h1>
        <p className="text-slate-500 mt-1">Manage your classrooms, student lists, and curriculum progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MY_CLASSES.map(cls => (
          <Card key={cls.id} className="p-0 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all border-slate-100 group">
            <div className="p-6 bg-indigo-600 text-white relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                  <BookOpen size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-1 rounded-lg backdrop-blur">
                  Class {cls.name}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">{cls.subject}</h3>
              <p className="text-indigo-100 text-xs flex items-center gap-1">
                <Users size={12} /> {cls.students} Enrolled Students
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={16} /> <span>{cls.room}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={16} /> <span>{cls.nextSession}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Curriculum Progress</span>
                  <span className="text-indigo-600 font-bold">{cls.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${cls.progress}%` }} />
                </div>
              </div>

              <Link to="/attendance" className="w-full">
                <Button className="w-full mt-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-none flex justify-between px-4 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-100 transition-all">
                  <span>Take Attendance</span>
                  <ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
