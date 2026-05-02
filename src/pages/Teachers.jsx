import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, Trash2, Loader, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import API from '../config';

function ActionMenu({ user, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
          <button onClick={() => { onDelete(user.id); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={15} /> {t(useLanguage().lang, 'delete')}
          </button>
        </div>
      )}
    </div>
  );
}

export function Teachers() {
  const { lang } = useLanguage();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', subject: 'Mathematics' });

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/users?role=Teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.map(t => ({ ...t, subject: t.subject || 'General' })));
      }
    } catch {
    } finally { setLoading(false); }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role: 'Teacher' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add teacher');
      }
      const data = await res.json();
      setTeachers(prev => [...prev, {
        id: data.id || Date.now(), name: formData.name, email: formData.email,
        subject: formData.subject, status: 'Active',
        addedDate: new Date().toISOString().split('T')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=7c3aed&color=fff`
      }]);
      showSuccess(t(lang, 'userApproved'));
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', subject: 'Mathematics' });
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/auth/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    } catch {}
    setTeachers(prev => prev.filter(t => t.id !== id));
    setDeleteConfirm(null);
    showSuccess(t(lang, 'userRejected'));
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t(lang, 'teacherManagement')}</h1>
          <p className="text-slate-500 mt-1">{t(lang, 'teacherManagementDesc')}</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> {t(lang, 'addTeacher')}
        </Button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t(lang, 'totalTeachers'), value: teachers.length, color: 'text-purple-700' },
          { label: t(lang, 'active'), value: teachers.filter(t => t.status === 'Active').length, color: 'text-green-700' },
          { label: t(lang, 'subjectsCovered'), value: [...new Set(teachers.map(t => t.subject).filter(Boolean))].length, color: 'text-blue-700' },
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
            <input type="text" placeholder={t(lang, 'searchTeachers')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
          </div>
          <span className="text-sm text-slate-400 ml-4">{filtered.length}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(lang, 'name')}</TableHead>
              <TableHead>{t(lang, 'email')}</TableHead>
              <TableHead>{t(lang, 'subject')}</TableHead>
              <TableHead>{t(lang, 'addedDate')}</TableHead>
              <TableHead>{t(lang, 'status')}</TableHead>
              <TableHead className="text-right">{t(lang, 'actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">
                <Loader className="animate-spin mx-auto mb-2" size={24} /> {t(lang, 'loadingRequests')}
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">{t(lang, 'noTeachers')}</TableCell></TableRow>
            ) : filtered.map(teacher => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                  <img src={teacher.avatar} alt={teacher.name} className="w-8 h-8 rounded-full border border-slate-200" />
                  {teacher.name}
                </TableCell>
                <TableCell className="text-slate-500">{teacher.email}</TableCell>
                <TableCell>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit">
                    <BookOpen size={11} /> {teacher.subject || 'General'}
                  </span>
                </TableCell>
                <TableCell className="text-slate-500">{teacher.addedDate}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${teacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {teacher.status || 'Active'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu user={teacher} onDelete={(id) => setDeleteConfirm(id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t(lang, 'confirmDelete')}>
        <div className="space-y-4">
          <p className="text-slate-600">{t(lang, 'confirmDeleteTeacher')}</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              <Trash2 size={16} className="mr-2" /> {t(lang, 'delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t(lang, 'addNewTeacher')}>
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'fullName')}</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder={t(lang, 'teacherFullName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="teacher@school.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'password')}</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder={t(lang, 'createPassword')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'subject')}</label>
            <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20">
              {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'French', 'Arabic', 'History', 'Geography', 'Computer Science', 'Art', 'Physical Education'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="submit" className="flex-1" disabled={formLoading}>{formLoading ? t(lang, 'adding') : t(lang, 'addTeacher')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
