import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, ShieldAlert, Trash2, UserCheck, UserX, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n/translations';
import API from '../config';

function ActionMenu({ admin, onDelete, onToggleStatus }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = admin.role === 'Super Admin';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
          {!isSuperAdmin && (
            <>
              <button
                onClick={() => { onToggleStatus(admin.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {admin.status === 'Active'
                  ? <><UserX size={15} className="text-amber-500" /> {t(lang, 'deactivate')}</>
                  : <><UserCheck size={15} className="text-green-500" /> {t(lang, 'activate')}</>
                }
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => { onDelete(admin.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} />
                {t(lang, 'delete')}
              </button>
            </>
          )}
          {isSuperAdmin && (
            <div className="px-4 py-2 text-xs text-slate-400 italic">Super Admin — Protected</div>
          )}
        </div>
      )}
    </div>
  );
}

export function Admins() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'Super Admin') {
      navigate('/');
    }
  }, [user, navigate]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Admin' });
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
            const res = await fetch(`${API}/auth/admins`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    const admin = admins.find(a => a.id === id);
    if (admin?.role === 'Super Admin') {
      setError('Super Admin cannot be deleted');
      return;
    }
    try {
            await fetch(`${API}/auth/admins/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (err) {
      console.warn(err.message);
    } finally {
      setAdmins(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
      showSuccess(t(lang, 'adminDeleted'));
      fetchAdmins();
    }
  };

  const handleToggleStatus = async (id) => {
    try {
            const res = await fetch(`${API}/auth/admins/${id}/toggle-status`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(prev => prev.map(a => a.id === id ? { ...a, status: data.status } : a));
      } else {
        setAdmins(prev => prev.map(a =>
          a.id === id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a
        ));
      }
    } catch (err) {
      setAdmins(prev => prev.map(a =>
        a.id === id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a
      ));
    }
    showSuccess(t(lang, 'statusToggled'));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
            const res = await fetch(`${API}/auth/add-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        const errMsg = err.detail || t(lang, 'failedToAddAdmin');
        setError(errMsg);
        return;
      }

      const data = await res.json();
      const newAdmin = {
        id: data.id,
        name: formData.name,
        email: formData.email,
        status: 'Active',
        addedDate: new Date().toISOString().split('T')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=6366f1&color=fff`
      };
      setAdmins(prev => [...prev, newAdmin]);
      showSuccess(t(lang, 'adminAdded'));
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'Admin' });
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t(lang, 'adminManagement')}</h1>
          <p className="text-slate-500 mt-1">{t(lang, 'adminManagementDesc')}</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          {t(lang, 'addAdmin')}
        </Button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
        <ShieldAlert className="text-blue-500 mr-3 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-blue-800">
          <strong>{t(lang, 'note')}:</strong> {t(lang, 'adminsNote')}
        </p>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t(lang, 'searchAdmins')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
            />
          </div>
          <span className="text-sm text-slate-400 ml-4">{filteredAdmins.length}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(lang, 'name')}</TableHead>
              <TableHead>{t(lang, 'email')}</TableHead>
              <TableHead>{t(lang, 'status')}</TableHead>
              <TableHead>{t(lang, 'addedDate')}</TableHead>
              <TableHead className="text-right">{t(lang, 'actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  <Loader className="animate-spin mx-auto mb-2" size={24} />
                  {t(lang, 'loadingRequests')}
                </TableCell>
              </TableRow>
            ) : filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-10">{t(lang, 'noAdmins')}</TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                    <img src={admin.avatar} alt={admin.name} className="w-8 h-8 rounded-full border border-slate-200" />
                    {admin.name}
                  </TableCell>
                  <TableCell className="text-slate-500">{admin.email}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      admin.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {admin.status}
                    </span>
                    {admin.role === 'Super Admin' && (
                      <span className="ml-2 px-2 py-0.5 bg-mauve-100 text-mauve-700 rounded text-[10px] font-bold">Super Admin</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500">{admin.addedDate}</TableCell>
                  <TableCell className="text-right">
                    <ActionMenu
                      admin={admin}
                      onDelete={(id) => setDeleteConfirm(id)}
                      onToggleStatus={handleToggleStatus}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t(lang, 'confirmDelete')}>
        <div className="space-y-4">
          <p className="text-slate-600">{t(lang, 'confirmDeleteAdmin')}</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
              {t(lang, 'cancel')}
            </Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              <Trash2 size={16} className="mr-2" />
              {t(lang, 'delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t(lang, 'addNewAdmin')}>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'fullName')}</label>
            <input type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
              placeholder={t(lang, 'enterAdminName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
            <input type="email" required value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
              placeholder="admin@school.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'password')}</label>
            <input type="password" required value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
              placeholder={t(lang, 'enterPassword')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'role')}</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500">
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
              {t(lang, 'cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={formLoading}>
              {formLoading ? t(lang, 'adding') : t(lang, 'addAdmin')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
