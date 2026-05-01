import React from 'react';
import { Card } from '../components/ui/Card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

export function Planning() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const events = [
    { day: 1, type: 'Class', title: 'Mathematics', time: '08:00 - 10:00', room: 'Room 101' },
    { day: 1, type: 'Class', title: 'Physics', time: '10:15 - 12:15', room: 'Lab 3' },
    { day: 2, type: 'Exam', title: 'English Midterm', time: '09:00 - 11:00', room: 'Hall B' },
    { day: 3, type: 'Event', title: 'Science Fair', time: '14:00 - 16:00', room: 'Main Yard' },
    { day: 4, type: 'Meeting', title: 'Parent-Teacher Meeting', time: '16:00 - 18:00', room: 'Room 105' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planning & Events</h1>
          <p className="text-slate-500 mt-1">Manage your schedule, exams, and school events.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronLeft size={20} /></button>
            <span className="px-4 font-semibold text-slate-800 text-sm">October 2026</span>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronRight size={20} /></button>
          </div>
          <button className="bg-mauve-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mauve-700 shadow-sm flex items-center">
            <CalendarIcon size={16} className="mr-2" />
            Add Event
          </button>
        </div>
      </div>

      <Card className="bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
          {days.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 h-[600px]">
          {Array.from({ length: 35 }).map((_, i) => {
            const dayNum = i - 2; // Offset for calendar start
            const isCurrentMonth = dayNum > 0 && dayNum <= 31;
            const dayEvents = events.filter(e => e.day === dayNum);

            return (
              <div 
                key={i} 
                className={`border-r border-b border-slate-100 p-2 ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'text-slate-700'} hover:bg-slate-50 transition-colors`}
              >
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${dayNum === 15 ? 'bg-mauve-600 text-white' : ''}`}>
                  {isCurrentMonth ? dayNum : ''}
                </span>
                
                <div className="mt-2 space-y-1">
                  {dayEvents.map((evt, idx) => (
                    <div 
                      key={idx} 
                      className={`px-2 py-1.5 rounded-md text-xs border ${
                        evt.type === 'Exam' ? 'bg-red-50 border-red-200 text-red-700' :
                        evt.type === 'Event' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                        evt.type === 'Meeting' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}
                    >
                      <p className="font-semibold truncate">{evt.title}</p>
                      <p className="text-[10px] mt-0.5 opacity-80 flex items-center">
                        <Clock size={10} className="mr-1" /> {evt.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
