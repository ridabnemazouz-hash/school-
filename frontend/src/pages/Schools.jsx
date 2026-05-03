import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, Trash2, Edit2, Loader, School, Users, Calendar, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n/translations';
import API from '../config';

function ActionMenu({ school, onDelete, onEdit }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
          <button onClick={() => { onEdit(school); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <Edit2 size={15} className="text-blue-500" /> {t(lang, 'edit')}
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button onClick={() => { onDelete(school.id); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={15} /> {t(lang, 'delete')}
          </button>
        </div>
      )}
    </div>
  );
}

export function Schools() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'Super Admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '', phone: '', email: '', subscription_plan: 'Free', max_students: 50, max_teachers: 10, super_admin_name: '', super_admin_email: '', super_admin_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await fetch(`${API}/schools/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolStats = async (schoolId) => {
    try {
      const res = await fetch(`${API}/schools/${schoolId}/stats`, { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/schools/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Failed to delete school');
        return;
      }
      setSchools(prev => prev.filter(s => s.id !== id));
      setDeleteConfirm(null);
      showSuccess(t(lang, 'schoolDeleted'));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      subscription_plan: school.subscription_plan,
      max_students: school.max_students,
      max_teachers: school.max_teachers,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingSchool ? `${API}/schools/${editingSchool.id}` : `${API}/schools/`;
      const method = editingSchool ? 'PUT' : 'POST';
      const payload = { ...formData };
      if (editingSchool) {
        delete payload.super_admin_name;
        delete payload.super_admin_email;
        delete payload.super_admin_password;
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Failed to save school');
        return;
      }

      showSuccess(editingSchool ? t(lang, 'schoolUpdated') : t(lang, 'schoolAdded'));
      setIsModalOpen(false);
      setEditingSchool(null);
      setFormData({ name: '', code: '', address: '', phone: '', email: '', subscription_plan: 'Free', max_students: 50, max_teachers: 10, super_admin_name: '', super_admin_email: '', super_admin_password: '' });
      fetchSchools();
    } catch (err) {
      setError(err.message);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const planColors = {
    Free: 'bg-slate-100 text-slate-700',
    Basic: 'bg-blue-100 text-blue-700',
    Premium: 'bg-purple-100 text-purple-700',
    Enterprise: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t(lang, 'schoolManagement')}</h1>
          <p className="text-slate-500 mt-1">{t(lang, 'schoolManagementDesc')}</p>
        </div>
        <Button className="shrink-0" onClick={() => { setEditingSchool(null); setFormData({ name: '', code: '', address: '', phone: '', email: '', subscription_plan: 'Free', max_students: 50, max_teachers: 10, super_admin_name: '', super_admin_email: '', super_admin_password: '' }); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" />
          {t(lang, 'addSchool')}
        </Button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-mauve-100 rounded-lg"><School className="text-mauve-600" size={24} /></div>
          <div><p className="text-sm text-slate-500">{t(lang, 'totalSchools')}</p><p className="text-2xl font-bold text-slate-800">{schools.length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-green-100 rounded-lg"><Users className="text-green-600" size={24} /></div>
          <div><p className="text-sm text-slate-500">{t(lang, 'activeSchools')}</p><p className="text-2xl font-bold text-slate-800">{schools.filter(s => s.is_active).length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-blue-100 rounded-lg"><CreditCard className="text-blue-600" size={24} /></div>
          <div><p className="text-sm text-slate-500">{t(lang, 'premiumSchools')}</p><p className="text-2xl font-bold text-slate-800">{schools.filter(s => s.subscription_plan === 'Premium' || s.subscription_plan === 'Enterprise').length}</p></div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-amber-100 rounded-lg"><Calendar className="text-amber-600" size={24} /></div>
          <div><p className="text-sm text-slate-500">{t(lang, 'freeSchools')}</p><p className="text-2xl font-bold text-slate-800">{schools.filter(s => s.subscription_plan === 'Free').length}</p></div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder={t(lang, 'searchSchools')} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" />
          </div>
          <span className="text-sm text-slate-400 ml-4">{filteredSchools.length}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(lang, 'schoolName')}</TableHead>
              <TableHead>{t(lang, 'code')}</TableHead>
              <TableHead>{t(lang, 'subscription')}</TableHead>
              <TableHead>{t(lang, 'limits')}</TableHead>
              <TableHead>{t(lang, 'status')}</TableHead>
              <TableHead className="text-right">{t(lang, 'actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500"><Loader className="animate-spin mx-auto mb-2" size={24} />{t(lang, 'loadingRequests')}</TableCell></TableRow>
            ) : filteredSchools.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">{t(lang, 'noSchools')}</TableCell></TableRow>
            ) : (
              filteredSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-mauve-100 rounded-full flex items-center justify-center"><School size={16} className="text-mauve-600" /></div>
                    {school.name}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm">{school.code}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${planColors[school.subscription_plan] || 'bg-slate-100 text-slate-700'}`}>
                      {school.subscription_plan}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{school.max_students} students / {school.max_teachers} teachers</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {school.is_active ? t(lang, 'active') : t(lang, 'inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu school={school} onDelete={(id) => setDeleteConfirm(id)} onEdit={handleEdit} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t(lang, 'confirmDelete')}>
        <div className="space-y-4">
          <p className="text-slate-600">{t(lang, 'confirmDeleteSchool')}</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white"><Trash2 size={16} className="mr-2" />{t(lang, 'delete')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSchool(null); }} title={editingSchool ? t(lang, 'editSchool') : t(lang, 'addNewSchool')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>)}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'schoolName')}</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="School name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'code')}</label>
            <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="SCH001" disabled={!!editingSchool} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'phone')}</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="+212..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="school@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'address')}</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="City, Morocco" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'subscription')}</label>
              <select value={formData.subscription_plan} onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500">
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'maxStudents')}</label>
              <input type="number" value={formData.max_students} onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'maxTeachers')}</label>
              <input type="number" value={formData.max_teachers} onChange={(e) => setFormData({ ...formData, max_teachers: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" />
            </div>
          </div>
          {!editingSchool && (
            <>
              <div className="border-t border-slate-100 my-2" />
              <h3 className="text-sm font-semibold text-slate-700 mt-2">{t(lang, 'schoolSuperAdmin')}</h3>
              <p className="text-xs text-slate-500 mb-3">{t(lang, 'schoolSuperAdminDesc')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'fullName')}</label>
                  <input type="text" value={formData.super_admin_name} onChange={(e) => setFormData({ ...formData, super_admin_name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="Admin name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
                  <input type="email" value={formData.super_admin_email} onChange={(e) => setFormData({ ...formData, super_admin_email: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="admin@school.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'password')}</label>
                <input type="password" value={formData.super_admin_password} onChange={(e) => setFormData({ ...formData, super_admin_password: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500" placeholder="Create a password" />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => { setIsModalOpen(false); setEditingSchool(null); }} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{t(lang, 'cancel')}</Button>
            <Button type="submit" className="flex-1">{editingSchool ? t(lang, 'save') : t(lang, 'addSchool')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
