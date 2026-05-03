import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, Trash2, BookOpen, Users, Loader } from 'lucide-react';
import API from '../config';

export function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', coefficient: 1, color: '#6366f1' });
  const [assignData, setAssignData] = useState({ teacher_id: '', class_id: '', subject_id: '' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, teachRes, classRes, assignRes] = await Promise.all([
        fetch(`${API}/subjects/`, { credentials: 'include' }),
        fetch(`${API}/subjects/teachers`, { credentials: 'include' }),
        fetch(`${API}/classes/`, { credentials: 'include' }),
        fetch(`${API}/subjects/teacher-classes`, { credentials: 'include' })
      ]);
      if (subRes.ok) setSubjects(await subRes.json());
      if (teachRes.ok) setTeachers(await teachRes.json());
      if (classRes.ok) setClasses(await classRes.json());
      if (assignRes.ok) setAssignments(await assignRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/subjects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
      const newSubject = await res.json();
      setSubjects(prev => [...prev, newSubject]);
      showSuccess('Subject added');
      setIsModalOpen(false);
      setFormData({ name: '', code: '', coefficient: 1, color: '#6366f1' });
    } catch (err) { setError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const t = teachers.find(t => t.id == assignData.teacher_id);
      const c = classes.find(c => c.id == assignData.class_id);
      const s = subjects.find(s => s.id == assignData.subject_id);
      const res = await fetch(`${API}/subjects/teacher-classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacher_id: t.id, teacher_name: t.name, class_id: c.id, class_name: c.name, subject_id: s.id, subject_name: s.name })
      });
      if (!res.ok) throw new Error('Failed');
      const newAssignment = await res.json();
      setAssignments(prev => [...prev, newAssignment]);
      showSuccess('Teacher assigned');
      setIsAssignModalOpen(false);
      setAssignData({ teacher_id: '', class_id: '', subject_id: '' });
    } catch (err) { setError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await fetch(`${API}/subjects/${id}`, { method: 'DELETE', credentials: 'include' }); } catch {}
    setSubjects(prev => prev.filter(s => s.id !== id));
    showSuccess('Subject deleted');
  };

  const handleDeleteAssign = async (id) => {
    try { await fetch(`${API}/subjects/teacher-classes/${id}`, { method: 'DELETE', credentials: 'include' }); } catch {}
    setAssignments(prev => prev.filter(a => a.id !== id));
    showSuccess('Assignment removed');
  };

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects & Assignments</h1>
          <p className="text-slate-500 mt-1">Manage subjects and assign teachers to classes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAssignModalOpen(true)} className="bg-purple-600 hover:bg-purple-700"><Users size={16} className="mr-2" />Assign Teacher</Button>
          <Button onClick={() => setIsModalOpen(true)}><Plus size={18} className="mr-2" />Add Subject</Button>
        </div>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Subjects', value: subjects.length, icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Teachers', value: teachers.length, icon: Users, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Assignments', value: assignments.length, icon: BookOpen, color: 'text-green-700', bg: 'bg-green-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}><stat.icon size={18} className={stat.color} /></div>
              <div><p className="text-xs text-slate-500">{stat.label}</p><p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Subjects</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Code</TableHead><TableHead>Coef</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader className="animate-spin mx-auto" size={24} /></TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No subjects</TableCell></TableRow> :
                filtered.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />{sub.name}</TableCell>
                    <TableCell><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{sub.code}</span></TableCell>
                    <TableCell>{sub.coefficient}</TableCell>
                    <TableCell className="text-right"><button onClick={() => handleDelete(sub.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Teacher Assignments</h3>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {assignments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No assignments</TableCell></TableRow> :
                assignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.teacher_name}</TableCell>
                    <TableCell>{a.class_name}</TableCell>
                    <TableCell>{a.subject_name}</TableCell>
                    <TableCell className="text-right"><button onClick={() => handleDeleteAssign(a.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Subject">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Mathematics" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Code</label><input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="MATH" maxLength={6} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Coefficient</label><input type="number" min="1" value={formData.coefficient} onChange={e => setFormData({ ...formData, coefficient: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Color</label><input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full h-10 border border-slate-200 rounded-lg cursor-pointer" /></div>
          </div>
          <div className="flex gap-3 pt-2"><Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700">Cancel</Button><Button type="submit" className="flex-1" disabled={formLoading}>{formLoading ? 'Adding...' : 'Add'}</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Teacher to Class">
        <form onSubmit={handleAssign} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label><select required value={assignData.teacher_id} onChange={e => setAssignData({ ...assignData, teacher_id: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"><option value="">Select teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Class</label><select required value={assignData.class_id} onChange={e => setAssignData({ ...assignData, class_id: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Subject</label><select required value={assignData.subject_id} onChange={e => setAssignData({ ...assignData, subject_id: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="flex gap-3 pt-2"><Button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700">Cancel</Button><Button type="submit" className="flex-1" disabled={formLoading}>{formLoading ? 'Assigning...' : 'Assign'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
