import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, Trash2, UserCheck, UserX, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n/translations';
import API from '../config';

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
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Admin', school_id: '' });
  const [admins, setAdmins] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const isPlatformOwner = user && !user.school_id;

  useEffect(() => {
    loadAdmins();
    if (isPlatformOwner) {
      loadSchools();
    }
  }, [isPlatformOwner]);

  const loadSchools = async () => {
    try {
      const res = await fetch(API + '/schools/', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      }
    } catch (err) {
      console.error('Error loading schools:', err);
    }
  };

  const loadAdmins = async () => {
    try {
      const res = await fetch(API + '/auth/admins', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error('Error loading admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(a => {
    if (!a) return false;
    const searchLower = search.toLowerCase();
    return (a.name || '').toLowerCase().includes(searchLower) || 
           (a.email || '').toLowerCase().includes(searchLower);
  });

  const handleDelete = async (id) => {
    try {
      const res = await fetch(API + '/auth/admins/' + id, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setAdmins(prev => prev.filter(a => a.id !== id));
        alert(t(lang, 'adminDeleted'));
      }
    } catch (err) {
      console.error('Error deleting admin:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(API + '/auth/admins/' + id + '/toggle-status', {
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(prev => prev.map(a => a.id === id ? { ...a, status: data.status } : a));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      // Prepare data - ensure school_id is null if empty string
      const dataToSend = { ...formData };
      if (!isPlatformOwner && user?.school_id) {
        dataToSend.school_id = user.school_id;
      }
      // Convert empty string to null for school_id
      if (dataToSend.school_id === '') {
        dataToSend.school_id = null;
      }

      const res = await fetch(`${API}/auth/add-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errData = await res.json();
        let errorMessage = 'Failed to add admin';
        
        if (errData.detail) {
          if (Array.isArray(errData.detail)) {
            // FastAPI validation errors - extract msg field
            errorMessage = errData.detail.map(d => d.msg || String(d)).join(', ');
          } else if (typeof errData.detail === 'string') {
            errorMessage = errData.detail;
          } else {
            errorMessage = 'Invalid data provided';
          }
        }
        
        setError(String(errorMessage));
        setFormLoading(false);
        return;
      }

      alert(t(lang, 'adminAdded'));
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'Admin', school_id: '' });
      loadAdmins();
    } catch (err) {
      setError(String(err?.message || 'Unknown error'));
    } finally {
      setFormLoading(false);
    }
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

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
              <TableHead>{t(lang, 'actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                  <Loader className="animate-spin mx-auto mb-2" size={24} />
                  {t(lang, 'loadingRequests')}
                </TableCell>
              </TableRow>
            ) : filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-10">{t(lang, 'noAdmins')}</TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium text-slate-800">{admin.name}</TableCell>
                  <TableCell className="text-slate-500">{admin.email}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      admin.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {admin.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {admin.role !== 'Super Admin' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleStatus(admin.id)} className="p-2 text-slate-400 hover:text-green-600">
                          {admin.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button onClick={() => setDeleteConfirm(admin.id)} className="p-2 text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
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
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700">
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
            <input type="email" required value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'password')}</label>
            <input type="password" required value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'role')}</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500">
              <option value="Admin">Admin</option>
              {isPlatformOwner && <option value="Super Admin">Super Admin</option>}
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>
          {isPlatformOwner && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'school')}</label>
              <select value={formData.school_id} onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
                required
              >
                <option value="">{t(lang, 'selectSchool')}</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700">
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
