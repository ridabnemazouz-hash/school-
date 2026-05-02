import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, Trash2, BookOpen, Hash } from 'lucide-react';

const SUBJECT_COLORS = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  cyan: 'bg-cyan-100 text-cyan-700',
};
const COLORS = Object.keys(SUBJECT_COLORS);
const GRADES = ['All Grades','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'];

function ActionMenu({ item, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
          <button onClick={() => { onDelete(item.id); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', code: '', teacher: '', hours: 4, grade: '10th Grade', color: 'blue' });

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = (e) => {
    e.preventDefault();
    setSubjects(prev => [...prev, { id: Date.now(), ...formData, hours: Number(formData.hours) }]);
    setIsModalOpen(false);
    setFormData({ name: '', code: '', teacher: '', hours: 4, grade: '10th Grade', color: 'blue' });
    showSuccess('✅ Subject added successfully!');
  };

  const handleDelete = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
    showSuccess('🗑️ Subject removed!');
  };

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.teacher.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects Management</h1>
          <p className="text-slate-500 mt-1">Manage all school subjects, codes and assignments.</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> Add Subject
        </Button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Subjects', value: subjects.length, color: 'text-blue-700' },
          { label: 'Weekly Hours', value: subjects.reduce((a, s) => a + s.hours, 0), color: 'text-purple-700' },
          { label: 'Teachers Assigned', value: [...new Set(subjects.map(s => s.teacher))].length, color: 'text-green-700' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search subjects, codes or teachers..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
          </div>
          <span className="text-sm text-slate-400 ml-4">{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Hrs/Week</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">No subjects found.</TableCell></TableRow>
            ) : filtered.map(sub => (
              <TableRow key={sub.id}>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 w-fit ${SUBJECT_COLORS[sub.color] || SUBJECT_COLORS.blue}`}>
                    <BookOpen size={11} /> {sub.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono font-bold">
                    <Hash size={10} className="inline" />{sub.code}
                  </span>
                </TableCell>
                <TableCell className="text-slate-600 flex items-center gap-2">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sub.teacher)}&background=6366f1&color=fff&size=28`}
                    alt={sub.teacher} className="w-7 h-7 rounded-full" />
                  {sub.teacher}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">{sub.grade}</TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-700">{sub.hours}h</span>
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu item={sub} onDelete={(id) => setDeleteConfirm(id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-slate-600">Are you sure you want to delete this subject?</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white"><Trash2 size={16} className="mr-2" />Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Subject">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
              <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 font-mono" placeholder="MATH" maxLength={6} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
            <input type="text" required value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="Assigned teacher" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
              <select value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20">
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hours/Week</label>
              <input type="number" required min={1} max={20} value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${SUBJECT_COLORS[c].split(' ')[0]} ${formData.color === c ? 'border-slate-700 scale-110' : 'border-transparent'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</Button>
            <Button type="submit" className="flex-1">Add Subject</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
