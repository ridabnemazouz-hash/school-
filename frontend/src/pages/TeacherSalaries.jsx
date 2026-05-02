import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import API from '../config';
import {
  X, Trash2, Plus, TrendingUp, Users, Wallet, Loader2,
  Search, CheckCircle, Clock, Upload, FileText, Receipt
} from 'lucide-react';

const MONTHS = [
  'January 2026', 'February 2026', 'March 2026', 'April 2026',
  'May 2026', 'June 2026', 'September 2026', 'October 2026',
  'November 2026', 'December 2026'
];

export function TeacherSalaries() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [stats, setStats] = useState({ totalSalaries: 0, totalPaid: 0, totalPending: 0, paidCount: 0, pendingCount: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ teacher_id: '', teacher_name: '', month: 'May 2026', amount: '', notes: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchSalaries();
    fetchStats();
  }, [filterMonth, filterStatus]);

  const fetchSalaries = async () => {
    try {
            let url = `${API}/salaries/?`;
      if (filterMonth !== 'All') url += `month=${filterMonth}&`;
      if (filterStatus !== 'All') url += `status=${filterStatus}&`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSalaries(data);
      }
    } catch (err) {
      console.error('Failed to fetch salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
            const res = await fetch(`${API}/salaries/stats`, { credentials: 'include' });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.teacher_name || !form.amount) return;
    setSaving(true);
    try {
            const formData = new FormData();
      formData.append('teacher_id', parseInt(form.teacher_id) || 0);
      formData.append('teacher_name', form.teacher_name);
      formData.append('month', form.month);
      formData.append('amount', parseInt(form.amount));
      formData.append('notes', form.notes || '');
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(`${API}/salaries/`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ teacher_id: '', teacher_name: '', month: 'May 2026', amount: '', notes: '' });
        setSelectedFile(null);
        fetchSalaries();
        fetchStats();
      } else {
        const err = await res.json();
        setFormError(err.detail || 'Erreur lors de l\'ajout');
      }
    } catch (err) {
      setFormError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
            const formData = new FormData();
      formData.append('status', newStatus);
      if (newStatus === 'Paid') {
        formData.append('payment_date', new Date().toISOString());
      }
      const res = await fetch(`${API}/salaries/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        fetchSalaries();
        fetchStats();
        if (newStatus === 'Paid') {
          const receiptRes = await fetch(`${API}/salaries/${id}/receipt`, { credentials: 'include' });
          if (receiptRes.ok) {
            const blob = await receiptRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const salary = salaries.find(s => s.id === id);
            a.download = `Recu-Salaire-${salary?.teacher_name || 'teacher'}-${salary?.month || 'month'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        }
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce salaire?')) return;
    try {
            const res = await fetch(`${API}/salaries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchSalaries();
        fetchStats();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDownloadReceipt = async (id) => {
    try {
      const res = await fetch(`${API}/salaries/${id}/receipt`, { credentials: 'include' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const salary = salaries.find(s => s.id === id);
        a.download = `Recu-${salary?.teacher_name || 'salaire'}-${salary?.month || ''}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download receipt failed:', err);
    }
  };

  const filtered = salaries.filter(s =>
    s.teacher_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Salaires des Enseignants</h1>
          <p className="text-slate-500 mt-1">Gérez les paiements mensuels des professeurs.</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setFormError(''); }} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={18} className="mr-2" />
          Ajouter Salaire
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white border-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="p-6 relative">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Salaires</p>
            <h2 className="text-4xl font-black mt-2 mb-2 tracking-tight">{stats.totalSalaries.toLocaleString()} <span className="text-sm font-medium">DH</span></h2>
            <p className="text-xs text-slate-400">{stats.count} enregistrements</p>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={24} /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Payés</p>
            <p className="text-2xl font-black text-emerald-600">{stats.totalPaid.toLocaleString()} DH</p>
            <p className="text-xs text-slate-400 mt-1">{stats.paidCount} enseignants payés</p>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">En Attente</p>
            <p className="text-2xl font-black text-amber-600">{stats.totalPending.toLocaleString()} DH</p>
            <p className="text-xs text-slate-400 mt-1">{stats.pendingCount} en attente</p>
          </div>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Paid', 'Pending'].map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
                filterStatus === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {f === 'All' ? 'Tout' : f === 'Paid' ? 'Payé' : 'En Attente'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">Tous les Mois</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="relative sm:ml-auto max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Salaries Table */}
      <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Enseignant</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Mois</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Montant</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Reçu</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Notes</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Date Paiement</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10"><Loader2 size={24} className="animate-spin mx-auto text-slate-300" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Aucun salaire trouvé.</td></tr>
              ) : (
                filtered.map(salary => (
                  <tr key={salary.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {salary.teacher_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{salary.teacher_name}</p>
                          <p className="text-[10px] text-slate-400">{new Date(salary.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-700">{salary.month}</span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">{salary.amount.toLocaleString()} DH</td>
                    <td className="px-6 py-4">
                      {salary.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50">
                          <CheckCircle size={12} /> Payé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50">
                          <Clock size={12} /> En Attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {salary.file_url ? (
                        <a href={`${API}${salary.file_url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                          <Receipt size={12} /> Voir Reçu
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{salary.notes || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {salary.payment_date ? new Date(salary.payment_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {salary.status === 'Pending' && (
                        <button
                          onClick={() => handleStatusUpdate(salary.id, 'Paid')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Marquer comme paye"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {salary.status === 'Paid' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(salary.id, 'Pending')}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Marquer comme en attente"
                          >
                            <Clock size={16} />
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(salary.id)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                            title="Telecharger le recu"
                          >
                            <Receipt size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(salary.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Salary Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); setFormError(''); }}>
          <Card className="w-full max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Ajouter un Salaire</h2>
              <button onClick={() => { setShowAdd(false); setFormError(''); }} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nom de l'enseignant *</label>
                <input type="text" required value={form.teacher_name} onChange={e => setForm(prev => ({ ...prev, teacher_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g. Ahmed Benali"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ID Enseignant (optionnel)</label>
                <input type="number" value={form.teacher_id} onChange={e => setForm(prev => ({ ...prev, teacher_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g. 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mois *</label>
                  <select value={form.month} onChange={e => setForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Montant (DH) *</label>
                  <input type="number" required value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notes (optionnel)</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Détails ou remarques..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reçu (optionnel)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => document.getElementById('salaryFileInput').click()}>
                  <input id="salaryFileInput" type="file" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 font-semibold">
                      <FileText size={16} /> {selectedFile.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">Cliquez pour télécharger le reçu</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={() => { setShowAdd(false); setFormError(''); }}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Ajouter'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
