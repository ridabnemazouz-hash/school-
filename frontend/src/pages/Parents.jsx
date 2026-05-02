import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, Trash2, Loader, Users } from 'lucide-react';
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

export function Parents() {
  const { lang } = useLanguage();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', childName: '' });

  useEffect(() => { fetchParents(); }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
            const res = await fetch(`${API}/auth/users?role=Parent`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setParents(data);
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
            const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role: 'Parent' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add parent');
      }
      const data = await res.json();
      setParents(prev => [...prev, {
        id: data.id || Date.now(), name: formData.name, email: formData.email,
        childName: formData.childName, status: 'Active',
        addedDate: new Date().toISOString().split('T')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=0891b2&color=fff`
      }]);
      showSuccess(t(lang, 'userApproved'));
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', childName: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
            await fetch(`${API}/auth/users/${id}`, { method: 'DELETE', credentials: 'include' });
    } catch {}
    setParents(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
    showSuccess(t(lang, 'userRejected'));
  };

  const filtered = parents.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.childName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t(lang, 'parentManagement')}</h1>
          <p className="text-slate-500 mt-1">{t(lang, 'parentManagementDesc')}</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> {t(lang, 'addParent')}
        </Button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t(lang, 'totalParents'), value: parents.length, color: 'text-cyan-700' },
          { label: t(lang, 'active'), value: parents.filter(p => p.status === 'Active').length, color: 'text-green-700' },
          { label: t(lang, 'thisMonth'), value: parents.filter(p => p.addedDate?.startsWith(new Date().toISOString().slice(0, 7))).length, color: 'text-blue-700' },
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
            <input type="text" placeholder={t(lang, 'searchParents')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
          </div>
          <span className="text-sm text-slate-400 ml-4">{filtered.length}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(lang, 'name')}</TableHead>
              <TableHead>{t(lang, 'email')}</TableHead>
              <TableHead>{t(lang, 'childName')}</TableHead>
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
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">{t(lang, 'noParents')}</TableCell></TableRow>
            ) : filtered.map(parent => (
              <TableRow key={parent.id}>
                <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                  <img src={parent.avatar} alt={parent.name} className="w-8 h-8 rounded-full border border-slate-200" />
                  {parent.name}
                </TableCell>
                <TableCell className="text-slate-500">{parent.email}</TableCell>
                <TableCell>
                  {parent.childName ? (
                    <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-md text-xs font-medium flex items-center gap-1 w-fit">
                      <Users size={11} /> {parent.childName}
                    </span>
                  ) : <span className="text-slate-400 text-sm">—</span>}
                </TableCell>
                <TableCell className="text-slate-500">{parent.addedDate}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${parent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {parent.status || 'Active'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu user={parent} onDelete={(id) => setDeleteConfirm(id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t(lang, 'confirmDelete')}>
        <div className="space-y-4">
          <p className="text-slate-600">{t(lang, 'confirmDeleteParent')}</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              <Trash2 size={16} className="mr-2" /> {t(lang, 'delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t(lang, 'addNewParent')}>
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'fullName')}</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder={t(lang, 'parentFullName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="parent@gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'password')}</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder={t(lang, 'createPassword')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'childName')}</label>
            <input type="text" value={formData.childName} onChange={e => setFormData({ ...formData, childName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder={t(lang, 'childFullName')} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="submit" className="flex-1" disabled={formLoading}>{formLoading ? t(lang, 'adding') : t(lang, 'addParent')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
