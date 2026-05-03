import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Clock, MapPin, User, BookOpen, Trash2, Loader } from 'lucide-react';
import API from '../config';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

const COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
];

export function Planning() {
  const [schedule, setSchedule] = useState({});
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ class_id: '', class_name: '', subject_id: '', subject_name: '', teacher_id: '', teacher_name: '', day: 'Monday', start_time: '08:00', end_time: '09:00', room: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, subRes, teachRes] = await Promise.all([
        fetch(`${API}/classes/`, { credentials: 'include' }),
        fetch(`${API}/subjects/`, { credentials: 'include' }),
        fetch(`${API}/subjects/teachers`, { credentials: 'include' })
      ]);
      if (classRes.ok) { const data = await classRes.json(); setClasses(data); if (data.length > 0 && !selectedClass) setSelectedClass(data[0].id); }
      if (subRes.ok) setSubjects(await subRes.json());
      if (teachRes.ok) setTeachers(await teachRes.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (selectedClass) fetchSchedule(); }, [selectedClass]);

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`${API}/schedule/?class_id=${selectedClass}`, { credentials: 'include' });
      if (res.ok) setSchedule(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/schedule/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed');
      await fetchSchedule();
      showSuccess('Schedule entry added');
      setIsModalOpen(false);
    } catch (err) { setError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await fetch(`${API}/schedule/${id}`, { method: 'DELETE', credentials: 'include' }); fetchSchedule(); showSuccess('Entry removed'); } catch {}
  };

  const getClassEntries = () => {
    return Object.entries(schedule).flatMap(([day, entries]) =>
      entries.map(e => ({ ...e, day }))
    );
  };

  const classEntries = getClassEntries();
  const selectedClassName = classes.find(c => c.id == selectedClass)?.name || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schedule</h1>
          <p className="text-slate-500 mt-1">Emploi du temps - Weekly timetable</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button onClick={() => { if (!selectedClass) return; const cls = classes.find(c => c.id == selectedClass); setFormData({ ...formData, class_id: cls.id, class_name: cls.name }); setIsModalOpen(true); }}><Plus size={18} className="mr-2" />Add Entry</Button>
        </div>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      {selectedClassName && (
        <Card className="p-4">
          <div className="flex items-center gap-2"><BookOpen size={18} className="text-mauve-500" /><h3 className="font-bold text-lg">{selectedClassName} - Timetable</h3></div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
              <div className="p-3 border-r border-slate-100 text-slate-400 font-bold text-xs uppercase text-center">Time</div>
              {DAYS.map(day => (
                <div key={day} className="p-3 border-r border-slate-100 last:border-0 text-center">
                  <p className="text-xs font-bold text-slate-700">{day.substring(0, 3)}</p>
                </div>
              ))}
            </div>

            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-7 border-b border-slate-50">
                <div className="p-3 border-r border-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50/50">{hour}</div>
                {DAYS.map(day => {
                  const session = schedule[day]?.find(e => e.start_time === hour);
                  return (
                    <div key={`${day}-${hour}`} className="p-1.5 border-r border-slate-50 last:border-0 min-h-[80px]">
                      {session && (
                        <div className={`p-2 rounded-lg border h-full shadow-sm cursor-pointer group relative ${COLORS[session.subject_id % COLORS.length]}`}>
                          <button onClick={() => handleDelete(session.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"><Trash2 size={12} /></button>
                          <h4 className="text-xs font-bold leading-tight mb-1">{session.subject_name}</h4>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[9px] font-medium opacity-70"><User size={9} /> {session.teacher_name}</div>
                            {session.room && <div className="flex items-center gap-1 text-[9px] font-medium opacity-70"><MapPin size={9} /> {session.room}</div>}
                            <div className="flex items-center gap-1 text-[9px] font-medium opacity-70"><Clock size={9} /> {session.start_time}-{session.end_time}</div>
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
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Schedule Entry">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Day</label><select required value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Start</label><select required value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">End</label><select required value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Subject</label><select required value={formData.subject_id} onChange={e => { const s = subjects.find(s => s.id == e.target.value); setFormData({ ...formData, subject_id: s.id, subject_name: s.name }); }} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label><select required value={formData.teacher_id} onChange={e => { const t = teachers.find(t => t.id == e.target.value); setFormData({ ...formData, teacher_id: t.id, teacher_name: t.name }); }} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"><option value="">Select teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Room (optional)</label><input type="text" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Room 101" /></div>
          <div className="flex gap-3 pt-2"><Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700">Cancel</Button><Button type="submit" className="flex-1" disabled={formLoading}>{formLoading ? 'Adding...' : 'Add'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
