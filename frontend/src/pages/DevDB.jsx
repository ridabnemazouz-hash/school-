import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Search, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight,
  Loader, BarChart3, Activity, AlertTriangle, RefreshCw, Code, Table2,
  Clock, Terminal, Flag, Users, Server, Play, Download, LogOut,
  Zap, Shield, Monitor, Command, GitBranch, Brain, Gauge,
  HardDrive, CreditCard, Plug, Ban, Lock, Filter, Eye, ChevronDown, 
  ChevronUp, Copy, Check, MousePointer2, Cpu, MemoryStick
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../config';

export function DevDB() {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ columns: [], data: [], total: 0, page: 1, per_page: 20, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({});
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState(null);
  const [schema, setSchema] = useState(null);
  const [logsSummary, setLogsSummary] = useState(null);
  const [perfData, setPerfData] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const apiFetch = async (url, method = 'GET', body = null) => {
    try {
      const options = { method, credentials: 'include' };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      const res = await window.fetch(`${API}${url}`, options);
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    refreshBaseData();
  }, []);

  // Auto-refresh for Infra tab
  useEffect(() => {
    let interval;
    if (activeTab === 'system') {
      interval = setInterval(async () => {
        const sys = await apiFetch('/dev/system');
        if (sys) setSystemInfo(sys);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const refreshBaseData = async () => {
    setLoading(true);
    const [t, s, sys] = await Promise.all([
      apiFetch('/dev/tables'),
      apiFetch('/dev/stats'),
      apiFetch('/dev/system')
    ]);
    if (t) setTables(t);
    if (s) setStats(s);
    if (sys) setSystemInfo(sys);
    setLoading(false);
  };

  const loadTableData = useCallback(async (tableName, page = 1, searchQuery = '') => {
    if (!tableName) return;
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: '20' });
    if (searchQuery) params.append('search', searchQuery);
    const data = await apiFetch(`/dev/tables/${tableName}?${params}`);
    if (data) setTableData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTable) loadTableData(selectedTable, 1, '');
  }, [selectedTable, loadTableData]);

  const runSQL = async () => {
    setSqlLoading(true);
    setSqlError(null);
    try {
      const data = await apiFetch('/dev/sql', 'POST', { sql: sqlQuery });
      if (data) setSqlResult(data);
      else setSqlError('Query execution failed.');
    } catch (e) {
      setSqlError(e.message);
    } finally {
      setSqlLoading(false);
    }
  };

  const tabs = [
    { id: 'tables', label: 'Data Explorer', icon: Table2 },
    { id: 'sql', label: 'SQL Console', icon: Terminal },
    { id: 'schema', label: 'ER Diagram', icon: GitBranch },
    { id: 'logs-summary', label: 'AI Diagnostic', icon: Brain },
    { id: 'perf', label: 'Profiler', icon: Gauge },
    { id: 'system', label: 'Infra', icon: Server },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl shadow-2xl border ${
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <Terminal className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">System Dev Console</h1>
            <p className="text-sm text-slate-500 font-medium">Infrastructure control & low-level data management</p>
          </div>
        </div>
        <button 
          onClick={refreshBaseData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all"
        >
          <RefreshCw size={14} /> Global Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit backdrop-blur-sm overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'schema' && !schema) apiFetch('/dev/schema').then(setSchema);
                if (tab.id === 'logs-summary' && !logsSummary) apiFetch('/dev/logs-summary').then(setLogsSummary);
                if (tab.id === 'perf' && !perfData) apiFetch('/dev/perf').then(setPerfData);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        
        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Available Entities</h3>
              <div className="space-y-1">
                {tables.map(t => (
                  <button 
                    key={t.name} 
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                      selectedTable === t.name ? 'bg-indigo-600/10 border-indigo-600/40 text-indigo-400' : 'bg-slate-900/30 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Table2 size={16} />
                      {t.name}
                    </div>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{stats[t.name] ?? '-'}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              {selectedTable ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
                   <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-800/50 text-left border-b border-slate-800">
                          {tableData.columns.map(col => (
                            <th key={col} className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {tableData.data.map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-600/5 transition-colors">
                            {tableData.columns.map(col => (
                              <td key={col} className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{String(row[col] ?? 'null')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">Select a table to browse data</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                <span className="text-xs font-black text-white uppercase tracking-widest">SQL Command Center</span>
                <button onClick={runSQL} disabled={sqlLoading} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-black rounded-xl">RUN QUERY</button>
              </div>
              <textarea 
                value={sqlQuery} onChange={e => setSqlQuery(e.target.value)}
                className="w-full h-48 bg-[#0a0f1d] text-green-400 font-mono text-sm p-8 focus:outline-none"
              />
            </div>
            {sqlResult && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-auto max-h-96">
                <table className="w-full text-xs font-mono">
                  <thead><tr className="bg-slate-800 text-left">{sqlResult.columns.map(col => <th key={col} className="px-4 py-2 text-slate-500">{col}</th>)}</tr></thead>
                  <tbody>{sqlResult.rows.map((row, i) => <tr key={i} className="border-b border-slate-800">{sqlResult.columns.map(col => <td key={col} className="px-4 py-2 text-slate-400">{String(row[col] ?? 'NULL')}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schema' && schema && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(schema.tables).map(([tableName, info]) => (
              <div key={tableName} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-white text-sm">{tableName}</h3>
                  <span className="text-[10px] text-slate-500 uppercase">{info.total} cols</span>
                </div>
                <div className="space-y-1">
                  {info.columns.map(c => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <span className={`font-mono ${c.primary ? 'text-amber-400' : 'text-slate-400'}`}>{c.name}</span>
                      <span className="text-[10px] text-slate-600 uppercase">{c.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs-summary' && logsSummary && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/30 rounded-3xl p-8">
              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Brain size={18} /> AI Diagnostic Report</h2>
              <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{logsSummary.summary}</p>
            </div>
          </div>
        )}

        {activeTab === 'perf' && perfData && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl">
              <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={16} /> Optimization Suggestions</h3>
              <ul className="space-y-2">
                {perfData.suggestions.map((s, i) => <li key={i} className="text-xs text-amber-200/70 flex items-center gap-2"><div className="w-1 h-1 bg-amber-500 rounded-full" /> {s}</li>)}
              </ul>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Latency Profile</h3>
              <div className="space-y-4">
                {Object.entries(perfData.queries).map(([table, info]) => (
                  <div key={table} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">{table}</span>
                      <span className="text-indigo-400">{info.query_time_ms}ms</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${Math.min(info.query_time_ms * 2, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && systemInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <MiniStatCard label="CPU Usage" value={`${systemInfo.cpu_percent}%`} icon={Cpu} color="indigo" />
                <MiniStatCard label="Memory" value={`${systemInfo.memory_percent}%`} icon={MemoryStick} color="emerald" />
                <MiniStatCard label="Process RAM" value={`${systemInfo.process_memory_mb} MB`} icon={Activity} color="amber" />
                <MiniStatCard label="DB Size" value={`${systemInfo.db_size_mb} MB`} icon={Database} color="blue" />
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
                <ResourceBar label="CPU Load" value={`${systemInfo.cpu_percent}%`} color="bg-indigo-500" percent={systemInfo.cpu_percent} />
                <ResourceBar label="Memory Load" value={`${systemInfo.memory_percent}%`} color="bg-emerald-500" percent={systemInfo.memory_percent} />
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Environment Runtime</h3>
              <div className="space-y-4">
                <InfoItem label="Version" value={systemInfo.version} />
                <InfoItem label="Environment" value={systemInfo.environment} />
                <InfoItem label="Python" value={systemInfo.python_version} />
                <InfoItem label="Uptime" value={`${Math.round(systemInfo.uptime / 60)} minutes`} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function MiniStatCard({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <Icon size={18} className="mb-3 opacity-50" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <h4 className="text-xl font-black text-white mt-1">{value}</h4>
    </div>
  );
}

function ResourceBar({ label, value, color, percent }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-xs text-slate-200 font-bold">{value}</span>
    </div>
  );
}
