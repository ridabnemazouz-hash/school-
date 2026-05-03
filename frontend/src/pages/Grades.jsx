import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, Loader, Award, TrendingUp, TrendingDown, Users, BookOpen } from 'lucide-react';
import API from '../config';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Arabic', 'French', 'English', 'History', 'Geography', 'Islamic Education', 'Philosophy', 'Computer Science', 'Physical Education'];
const EXAM_TYPES = ['Contrôle 1', 'Contrôle 2', 'Contrôle 3', 'Examen'];

export function Grades() {
  const [notes, setNotes] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('S1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', student_name: '', student_class: '', subject_id: '', subject_name: '', exam_type: 'Contrôle 1', note: '', coefficient: 1, semester: 'S1' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesRes, studentsRes, classesRes, subjectsRes] = await Promise.all([
        fetch(`${API}/grades/notes`, { credentials: 'include' }),
        fetch(`${API}/auth/users?role=Student`, { credentials: 'include' }),
        fetch(`${API}/classes/`, { credentials: 'include' }),
        fetch(`${API}/subjects/`, { credentials: 'include' })
      ]);
      if (notesRes.ok) setNotes(await notesRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (classesRes.ok) setClasses(await classesRes.json());
      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const note = parseFloat(formData.note);
      if (isNaN(note) || note < 0 || note > 20) throw new Error('Note must be between 0 and 20');
      const res = await fetch(`${API}/grades/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, note: formData.note })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Failed'); }
      const newNote = await res.json();
      setNotes(prev => [...prev, newNote]);
      showSuccess('Note added successfully');
      setIsModalOpen(false);
      setFormData({ student_id: '', student_name: '', student_class: '', subject_id: '', subject_name: '', exam_type: 'Contrôle 1', note: '', coefficient: 1, semester: 'S1' });
    } catch (err) { setError(err.message); }
    finally { setFormLoading(false); }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleStudentSelect = (studentId) => {
    const s = students.find(s => s.id == studentId);
    if (s) setFormData({ ...formData, student_id: s.id, student_name: s.name, student_class: s.class || '' });
  };

  const handleSubjectSelect = (subjectId) => {
    const sub = subjects.find(s => s.id == subjectId);
    if (sub) setFormData({ ...formData, subject_id: sub.id, subject_name: sub.name });
  };

  const filtered = notes.filter(n =>
    (!selectedClass || n.student_class === selectedClass) &&
    (!selectedSubject || n.subject_name === selectedSubject) &&
    n.semester === selectedSemester &&
    (n.student_name.toLowerCase().includes(search.toLowerCase()) || n.subject_name.toLowerCase().includes(search.toLowerCase()))
  );

  const averages = {};
  filtered.forEach(n => {
    const key = `${n.student_id}-${n.subject_id}`;
    if (!averages[key]) averages[key] = { student: n.student_name, subject: n.subject_name, total: 0, count: 0 };
    const val = parseFloat(n.note.replace(',', '.'));
    if (!isNaN(val)) {
      averages[key].total += val * n.coefficient;
      averages[key].count += n.coefficient;
    }
  });
  const ranking = Object.entries(averages)
    .map(([_, d]) => ({ ...d, average: d.count > 0 ? (d.total / d.count).toFixed(2) : 'N/A' }))
    .sort((a, b) => (b.average === 'N/A' ? -1 : parseFloat(b.average)) - (a.average === 'N/A' ? -1 : parseFloat(a.average)))
    .map((item, i) => ({ ...item, rank: i + 1 }));

  const classAvg = ranking.length > 0 ? (ranking.reduce((s, r) => s + (r.average === 'N/A' ? 0 : parseFloat(r.average)), 0) / ranking.filter(r => r.average !== 'N/A').length).toFixed(2) : 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notes & Exams</h1>
          <p className="text-slate-500 mt-1">Manage grades, calculate averages, and track student rankings</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> Add Note
        </Button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Notes', value: filtered.length, icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Class Average', value: `${classAvg}/20`, icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Students', value: [...new Set(filtered.map(n => n.student_id))].length, icon: Users, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Best Average', value: ranking[0]?.average !== 'N/A' ? `${ranking[0]?.average}/20` : 'N/A', icon: Award, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="S1">Semester 1</option>
            <option value="S2">Semester 2</option>
          </select>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Notes List</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Coef</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader className="animate-spin mx-auto" size={24} /></TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No notes found</TableCell></TableRow> :
                filtered.map(note => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.student_name}</TableCell>
                    <TableCell>{note.subject_name}</TableCell>
                    <TableCell><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{note.exam_type}</span></TableCell>
                    <TableCell><span className={`font-bold ${parseFloat(note.note) >= 10 ? 'text-green-600' : 'text-red-600'}`}>{note.note}/20</span></TableCell>
                    <TableCell>{note.coefficient}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Ranking (Classement)</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No data</TableCell></TableRow> :
                ranking.map((r, i) => (
                  <TableRow key={i} className={i < 3 ? 'bg-amber-50/50' : ''}>
                    <TableCell>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{r.rank}</span>
                    </TableCell>
                    <TableCell className="font-medium">{r.student}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${r.average !== 'N/A' && parseFloat(r.average) >= 10 ? 'text-green-600' : 'text-red-600'}`}>{r.average !== 'N/A' ? `${r.average}/20` : 'N/A'}</span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Note">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
            <select required value={formData.student_id} onChange={e => handleStudentSelect(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select required value={formData.subject_id} onChange={e => handleSubjectSelect(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type</label>
              <select value={formData.exam_type} onChange={e => setFormData({ ...formData, exam_type: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coefficient</label>
              <input type="number" min="1" max="10" value={formData.coefficient} onChange={e => setFormData({ ...formData, coefficient: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Note (0-20)</label>
              <input type="number" step="0.25" min="0" max="20" required value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="15.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
              <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="S1">Semester 1</option>
                <option value="S2">Semester 2</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={formLoading}>{formLoading ? 'Adding...' : 'Add Note'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
