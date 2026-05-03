import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, Trash2, Loader, Camera, Upload } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import API from '../config';

function ActionMenu({ user, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
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
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function Students() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', grade: '', studentClass: '', dateOfBirth: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
            const res = await fetch(`${API}/auth/users?role=Student`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.map(s => ({
          ...s,
          avatar: s.avatar && s.avatar.startsWith('/') ? `${API}${s.avatar}` : s.avatar,
        })));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('role', 'Student');
      if (formData.grade) data.append('grade', formData.grade);
      if (formData.studentClass) data.append('student_class', formData.studentClass);
      if (formData.dateOfBirth) data.append('date_of_birth', formData.dateOfBirth);
      if (photoFile) data.append('avatar', photoFile);

      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        body: data,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add student');
      }
      const result = await res.json();
      const avatar = photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=6366f1&color=fff`;
      setStudents(prev => [...prev, {
        id: result.id || Date.now(),
        name: formData.name,
        email: formData.email,
        status: 'Active',
        addedDate: new Date().toISOString().split('T')[0],
        avatar,
        grade: formData.grade,
        class: formData.studentClass,
        dateOfBirth: formData.dateOfBirth,
      }]);
      showSuccess(t(lang, 'userApproved'));
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', grade: '', studentClass: '', dateOfBirth: '' });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    try {
            await fetch(`${API}/auth/users/${id}`, { method: 'DELETE', credentials: 'include' });
    } catch {}
    setStudents(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
    showSuccess(t(lang, 'userRejected'));
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t(lang, 'studentManagement')}</h1>
          <p className="text-slate-500 mt-1">{t(lang, 'studentManagementDesc')}</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> {t(lang, 'addStudent')}
        </Button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t(lang, 'totalStudents'), value: students.length, color: 'bg-blue-50 text-blue-700' },
          { label: t(lang, 'active'), value: students.filter(s => s.status === 'Active').length, color: 'bg-green-50 text-green-700' },
          { label: t(lang, 'thisMonth'), value: students.filter(s => s.addedDate?.startsWith(new Date().toISOString().slice(0, 7))).length, color: 'bg-purple-50 text-purple-700' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder={t(lang, 'searchStudents')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
          </div>
          <span className="text-sm text-slate-400 ml-4">{filtered.length}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(lang, 'name')}</TableHead>
              <TableHead>{t(lang, 'email')}</TableHead>
              <TableHead>{t(lang, 'addedDate')}</TableHead>
              <TableHead>{t(lang, 'status')}</TableHead>
              <TableHead className="text-right">{t(lang, 'actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">
                <Loader className="animate-spin mx-auto mb-2" size={24} /> {t(lang, 'loadingRequests')}
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-10">{t(lang, 'noStudents')}</TableCell></TableRow>
            ) : filtered.map(student => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                  <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full border border-slate-200" />
                  <button
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="text-left hover:text-mauve-500 transition-colors"
                  >
                    {student.name}
                  </button>
                </TableCell>
                <TableCell className="text-slate-500">{student.email}</TableCell>
                <TableCell className="text-slate-500">{student.addedDate}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {student.status || 'Active'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu user={student} onDelete={(id) => setDeleteConfirm(id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t(lang, 'confirmDelete')}>
        <div className="space-y-4">
          <p className="text-slate-600">{t(lang, 'confirmDeleteStudent')}</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              <Trash2 size={16} className="mr-2" /> {t(lang, 'delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setPhotoFile(null); setPhotoPreview(null); }} title={t(lang, 'addNewStudent')}>
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={24} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
                  <Upload size={14} className="inline mr-1" /> Choose File
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </label>
                {photoFile && <span className="text-xs text-slate-500">{photoFile.name}</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'fullName')}</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder={t(lang, 'studentFullName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="student@school.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'password')}</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder={t(lang, 'createPassword')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
            <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
              <input type="text" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="1Bac" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <input type="text" value={formData.studentClass} onChange={e => setFormData({ ...formData, studentClass: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="A" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => { setIsModalOpen(false); setPhotoFile(null); setPhotoPreview(null); }} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="submit" className="flex-1" disabled={formLoading}>{formLoading ? t(lang, 'adding') : t(lang, 'addStudent')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
