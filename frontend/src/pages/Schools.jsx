import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Trash2, Edit2, Loader, School, CreditCard, Shield, Users, Activity, ExternalLink, Filter, MapPin, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n/translations';
import API, { apiFetch } from '../config';

export function Schools() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', code: '', address: '', phone: '', email: '', 
    subscription_plan: 'Free', max_students: 50, max_teachers: 10, 
    super_admin_name: '', super_admin_email: '', super_admin_password: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/schools/');
      if (res.ok) setSchools(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const path = editingSchool ? `/schools/${editingSchool.id}` : '/schools/';
      const method = editingSchool ? 'PUT' : 'POST';
      
      const res = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSuccess(editingSchool ? 'School updated successfully' : 'New school instance provisioned successfully');
        setIsModalOpen(false);
        setFormData({ 
          name: '', code: '', address: '', phone: '', email: '', 
          subscription_plan: 'Free', max_students: 50, max_teachers: 10, 
          super_admin_name: '', super_admin_email: '', super_admin_password: '' 
        });
        fetchSchools();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to save school');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDelete = async (id, schoolName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${schoolName}"? This will permanently erase ALL associated data.`)) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/schools/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setSuccess(`School "${schoolName}" deleted successfully.`);
        // Remove from local state immediately for instant UI feedback
        setSchools(prev => prev.filter(s => s.id !== id));
      } else {
        let errorMsg = 'Failed to delete school.';
        try {
          const data = await res.json();
          errorMsg = typeof data.detail === 'string' ? data.detail : errorMsg;
        } catch {}
        setError(errorMsg);
      }
    } catch (err) { 
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <School className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Active Tenants</h1>
            <p className="text-sm text-slate-500 font-medium">Infrastructure & subscription management for all school entities</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingSchool(null); setFormData({ 
            name: '', code: '', address: '', phone: '', email: '', 
            subscription_plan: 'Free', max_students: 50, max_teachers: 10, 
            super_admin_name: '', super_admin_email: '', super_admin_password: '' 
          }); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-widest"
        >
          <Plus size={16} /> New Tenant Instance
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <SchoolMiniStat label="Total Schools" value={schools.length} icon={School} color="indigo" />
        <SchoolMiniStat label="Active Subscriptions" value={schools.filter(s => s.is_active).length} icon={Activity} color="emerald" />
        <SchoolMiniStat label="Free Instances" value={schools.filter(s => s.subscription_plan === 'Free').length} icon={Users} color="amber" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by school name or instance code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto p-1">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-500 uppercase tracking-wider hover:text-slate-300">
            <Filter size={14} /> Filter By Plan
          </button>
        </div>
      </div>

      {/* Schools List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full py-24 text-center">
              <Loader className="animate-spin text-indigo-500 mx-auto" size={32} />
              <p className="text-sm text-slate-600 mt-4 font-bold uppercase tracking-widest">Querying Cloud Instances...</p>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
              <School className="mx-auto mb-4 opacity-10" size={48} />
              <p className="text-slate-500">No school entities found matching your criteria.</p>
            </div>
          ) : filteredSchools.map((school, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              key={school.id}
              className="group bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 transition-all backdrop-blur-md flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <School size={24} />
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  school.subscription_plan === 'Free' ? 'bg-slate-800 text-slate-500 border border-slate-700' :
                  school.subscription_plan === 'Enterprise' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {school.subscription_plan}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{school.name}</h3>
                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mt-0.5">Instance ID: {school.code}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={12} /> {school.address || 'Global Headquarter'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={12} /> {school.email || 'system@tenant.com'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={12} /> {school.max_students} Students capacity
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all" onClick={() => navigate(`/school?tenant=${school.code}`)}><ExternalLink size={16} /></button>
                  <button className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all" onClick={() => { setEditingSchool(school); setFormData(school); setIsModalOpen(true); }}><Edit2 size={16} /></button>
                  <button className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all" onClick={() => handleDelete(school.id, school.name)}><Trash2 size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${school.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {school.is_active ? 'Online' : 'Suspended'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-800 bg-slate-800/50">
              <h2 className="text-xl font-black text-white tracking-tight">{editingSchool ? 'Modify Instance' : 'Provision New Tenant'}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Configure infrastructure parameters and root administrator</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">School Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none" placeholder="e.g. Atlas International Academy" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instance Code (Unique)</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none" placeholder="e.g. ATLAS-2024" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Headquarter Address</label>
                <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none" placeholder="Street, City, Country" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subscription Plan</label>
                  <select value={formData.subscription_plan} onChange={e => setFormData({...formData, subscription_plan: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none">
                    <option>Free</option>
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Capacity</label>
                  <input type="number" value={formData.max_students} onChange={e => setFormData({...formData, max_students: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>

              {!editingSchool && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} className="text-indigo-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Root Administrator Setup</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input required value={formData.super_admin_name} onChange={e => setFormData({...formData, super_admin_name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <input required type="email" value={formData.super_admin_email} onChange={e => setFormData({...formData, super_admin_email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Password</label>
                    <input required type="password" value={formData.super_admin_password} onChange={e => setFormData({...formData, super_admin_password: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                  </div>
                </div>
              )}

              <div className="pt-8 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                  {editingSchool ? 'Update Instance' : 'Deploy Tenant'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SchoolMiniStat({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-3xl p-6 backdrop-blur-sm`}>
      <Icon className="mb-4 opacity-50" size={20} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-white tracking-tight">{value}</h4>
    </div>
  );
}
