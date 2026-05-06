import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, Download, Trash2, ShieldCheck, Clock, Plus, Database, AlertCircle, Play, CheckCircle2, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API, { apiFetch } from '../config';

export function BackupsManager() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/enterprise/backups');
      if (res.ok) {
        setBackups(await res.json());
      }
    } catch (err) {
      showToast("Failed to fetch backups", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setCreating(true);
    try {
      const res = await apiFetch('/enterprise/backups/create', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual', notes: 'Manual snapshot from dashboard' })
      });
      if (res.ok) {
        showToast("Snapshot created successfully");
        fetchBackups();
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to create snapshot", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backupId, filename) => {
    try {
      showToast("Starting download...", "info");
      const downloadUrl = `${API.BASE_URL}/enterprise/backups/${backupId}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast("Download failed", "error");
    }
  };

  const handleDelete = async (backupId) => {
    if (!window.confirm("Are you sure you want to delete this backup?")) return;
    try {
      const res = await apiFetch(`/enterprise/backups/${backupId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Backup deleted");
        setBackups(prev => prev.filter(b => b.id !== backupId));
      }
    } catch (err) {
      showToast("Delete failed", "error");
    }
  };

  const totalStorage = backups.reduce((acc, b) => acc + (b.size_mb || 0), 0);
  const lastBackup = backups.length > 0 ? backups[0].created_at : null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span className="font-medium text-xs uppercase tracking-wider">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
            <HardDrive className="text-indigo-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Disaster Recovery</h1>
            <p className="text-sm text-slate-500 font-medium">Automated snapshots & secure restoration vault</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={fetchBackups}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-2xl border border-slate-700 transition-all uppercase tracking-widest"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={14} /> Sync
          </button>
          <button 
            onClick={handleCreateSnapshot}
            disabled={creating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            {creating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            Create Snapshot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <BackupStatCard label="Vault Snapshots" value={backups.length} icon={Database} color="indigo" />
        <BackupStatCard label="Storage Used" value={`${totalStorage.toFixed(1)} MB`} icon={HardDrive} color="blue" />
        <BackupStatCard label="Last Pulse" value={lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Never'} icon={CheckCircle2} color="emerald" />
        <BackupStatCard label="System Integrity" value="100%" icon={ShieldCheck} color="amber" />
      </div>

      <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="text-emerald-400" size={16} />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Secure Backup Vault</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Real-time Sync</span>
          </div>
        </div>
        
        <div className="divide-y divide-slate-800/50">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="text-indigo-500 animate-spin" size={40} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accessing Vault...</p>
            </div>
          ) : backups.length > 0 ? (
            backups.map((b, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                key={b.id} 
                className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-800/30 transition-all group gap-4"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all shadow-inner">
                    <Database size={24} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-200 tracking-tight">{b.filename}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded">
                        <Clock size={10} /> {new Date(b.created_at).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black text-indigo-500/70 uppercase tracking-wider">{b.size_mb.toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {b.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDownload(b.id, b.filename)}
                      className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700" 
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all border border-transparent hover:border-indigo-500/20" 
                      title="Restore"
                    >
                      <Play size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(b.id)}
                      className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20" 
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-600" size={32} />
              </div>
              <h3 className="text-white font-bold mb-2">No Backups Found</h3>
              <p className="text-slate-500 text-xs">Create your first system snapshot to secure your data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackupStatCard({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-[2rem] p-8 backdrop-blur-sm relative overflow-hidden group`}>
      <Icon className="mb-6 group-hover:scale-110 transition-transform" size={24} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Icon size={64} />
      </div>
    </div>
  );
}
