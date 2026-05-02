import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import API from '../config';
import {
  Upload, X, Trash2, Plus, TrendingUp, PieChart, Loader2,
  FileText, Wrench, Truck, Zap, Package, Sparkles, Search, Filter
} from 'lucide-react';

const CATEGORIES = [
  { value: 'Repairs', label: 'Réparations', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  { value: 'Supplies', label: 'Fournitures', icon: Package, color: 'text-blue-600 bg-blue-50' },
  { value: 'Utilities', label: 'Factures/Energie', icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'Transport', label: 'Transport', icon: Truck, color: 'text-purple-600 bg-purple-50' },
  { value: 'Other', label: 'Autre', icon: FileText, color: 'text-slate-600 bg-slate-50' },
];

const categoryIcons = {
  Repairs: Wrench,
  Supplies: Package,
  Utilities: Zap,
  Transport: Truck,
  Other: FileText,
};

export function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ totalExpenses: 0, byCategory: {}, count: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', category: 'Repairs', amount: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [filter]);

  const fetchExpenses = async () => {
    try {
            const url = filter === 'All' ? `${API}/expenses/` : `${API}/expenses/?category=${filter}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
            const res = await fetch(`${API}/expenses/stats`, { credentials: 'include' });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setUploading(true);
    try {
            const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('amount', parseInt(form.amount));
      formData.append('description', form.description);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(`${API}/expenses/`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ title: '', category: 'Repairs', amount: '', description: '' });
        setSelectedFile(null);
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette dépense?')) return;
    try {
            const res = await fetch(`${API}/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
            const res = await fetch(`${API}/expenses/analyze`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dépenses Scolaires</h1>
          <p className="text-slate-500 mt-1">Suivez les réparations, fournitures et dépenses de l'école.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAnalyze} disabled={analyzing || stats.count === 0} className="bg-purple-600 hover:bg-purple-700">
            {analyzing ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Sparkles size={18} className="mr-2" />}
            AI Analysis
          </Button>
          <Button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} className="mr-2" />
            Ajouter Dépense
          </Button>
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <Card className="p-6 border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-purple-600" />
            <h3 className="text-lg font-bold text-purple-800">AI Financial Analysis</h3>
            <button onClick={() => setAnalysis(null)} className="ml-auto text-purple-400 hover:text-purple-600"><X size={18} /></button>
          </div>
          <div className="text-sm text-purple-700 whitespace-pre-wrap leading-relaxed">{analysis}</div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white border-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="p-6 relative">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Dépenses</p>
            <h2 className="text-4xl font-black mt-2 mb-2 tracking-tight">{stats.totalExpenses.toLocaleString()} <span className="text-sm font-medium">DH</span></h2>
            <p className="text-xs text-slate-400">{stats.count} dépenses enregistrées</p>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><PieChart size={24} /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Par Catégorie</p>
            <div className="space-y-1">
              {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, amount]) => {
                const catInfo = CATEGORIES.find(c => c.value === cat);
                const Icon = catInfo?.icon || FileText;
                return (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">{cat}</span>
                    </div>
                    <span className="font-bold text-slate-900">{amount.toLocaleString()} DH</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FileText size={24} /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Catégories</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(stats.byCategory).map(cat => {
                const catInfo = CATEGORIES.find(c => c.value === cat);
                const Icon = catInfo?.icon || FileText;
                return (
                  <span key={cat} className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                    <Icon size={12} /> {catInfo?.label || cat}
                  </span>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', ...CATEGORIES.map(c => c.value)].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
                filter === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {f === 'All' ? 'Tout' : CATEGORIES.find(c => c.value === f)?.label || f}
            </button>
          ))}
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

      {/* Expenses Table */}
      <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Dépense</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Catégorie</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Montant</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Facture</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><Loader2 size={24} className="animate-spin mx-auto text-slate-300" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Aucune dépense trouvée.</td></tr>
              ) : (
                filtered.map(expense => {
                  const Icon = categoryIcons[expense.category] || FileText;
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{expense.title}</p>
                        <p className="text-[10px] text-slate-400">{new Date(expense.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          CATEGORIES.find(c => c.value === expense.category)?.color || 'text-slate-600 bg-slate-50'
                        }`}>
                          <Icon size={12} />
                          {CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{expense.amount.toLocaleString()} DH</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{expense.description || '-'}</td>
                      <td className="px-6 py-4">
                        {expense.file_url ? (
                          <a href={`${API}${expense.file_url}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                            Voir Facture
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(expense.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <Card className="w-full max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Ajouter une Dépense</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Titre *</label>
                <input type="text" required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g. Réparation portes salle 3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Catégorie *</label>
                  <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Détails de la dépense..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Facture/Reçu (optionnel)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => document.getElementById('expenseFileInput').click()}>
                  <input id="expenseFileInput" type="file" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 font-semibold">
                      <FileText size={16} /> {selectedFile.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">Cliquez pour télécharger la facture</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={() => setShowAdd(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={uploading}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Ajouter'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
