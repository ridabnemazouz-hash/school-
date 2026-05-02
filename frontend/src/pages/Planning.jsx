import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User, BookOpen } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

const SCHEDULE = [
  { day: 'Monday', time: '08:00', subject: 'Mathematics', room: 'Room 102', teacher: 'Fatima T.', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { day: 'Monday', time: '10:00', subject: 'Physics', room: 'Lab 1', teacher: 'Hassan A.', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { day: 'Tuesday', time: '09:00', subject: 'English', room: 'Room 205', teacher: 'Leila T.', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { day: 'Wednesday', time: '11:00', subject: 'History', room: 'Room 101', teacher: 'Omar B.', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { day: 'Thursday', time: '14:00', subject: 'Science', room: 'Lab 2', teacher: 'Rachid O.', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { day: 'Friday', time: '10:00', subject: 'Arabic', room: 'Room 102', teacher: 'Sara C.', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
];

export function Planning() {
  const [selectedDay, setSelectedDay] = useState('Monday');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Academic Planning</h1>
          <p className="text-slate-500 mt-1">Weekly schedule and classroom assignments.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <Button variant="ghost" size="sm" className="p-2"><ChevronLeft size={16} /></Button>
          <span className="text-sm font-bold px-2">May 01 - May 07, 2026</span>
          <Button variant="ghost" size="sm" className="p-2"><ChevronRight size={16} /></Button>
        </div>
      </div>

      {/* Mobile Day Selector */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedDay === day ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
              <div className="p-4 border-r border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center">
                Time
              </div>
              {DAYS.map(day => (
                <div key={day} className="p-4 text-center border-r border-slate-100 last:border-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{day.substring(0, 3)}</p>
                  <p className={`text-sm font-bold ${selectedDay === day ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {day}
                  </p>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="relative">
              {HOURS.map((hour, hIndex) => (
                <div key={hour} className="grid grid-cols-7 border-b border-slate-50 group">
                  <div className="p-4 border-r border-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50/30">
                    {hour}
                  </div>
                  {DAYS.map((day, dIndex) => {
                    const session = SCHEDULE.find(s => s.day === day && s.time === hour);
                    return (
                      <div key={`${day}-${hour}`} className="p-2 border-r border-slate-50 last:border-0 min-h-[100px] transition-colors group-hover:bg-slate-50/20">
                        {session && (
                          <div className={`p-3 rounded-xl border h-full shadow-sm hover:shadow-md transition-all cursor-pointer group/session ${session.color}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70 flex items-center gap-1">
                                <Clock size={10} /> {session.time}
                              </span>
                              <BookOpen size={12} className="opacity-50" />
                            </div>
                            <h4 className="text-xs font-bold mb-2 leading-tight">{session.subject}</h4>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[9px] font-medium opacity-80">
                                <MapPin size={10} /> {session.room}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] font-medium opacity-80">
                                <User size={10} /> {session.teacher}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
