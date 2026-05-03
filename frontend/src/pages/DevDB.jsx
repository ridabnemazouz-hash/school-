import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Search, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight,
  Loader, BarChart3, Activity, AlertTriangle, RefreshCw, Code, Table2,
  Clock, Terminal, Flag, Users, Server, Play, Download, LogOut, LogOutIcon,
  Zap, Shield, Monitor, Command, GitBranch, Brain, Gauge, ListChecks
} from 'lucide-react';
import API from '../config';

export function DevDB() {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ columns: [], data: [], total: 0, page: 1, per_page: 20, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState(null);
  const [schema, setSchema] = useState(null);
  const [logsSummary, setLogsSummary] = useState(null);
  const [perfData, setPerfData] = useState(null);

  const apiFetch = async (url) => {
    try {
      const res = await window.fetch(`${API}${url}`, { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      apiFetch('/dev/tables').then(setTables),
      apiFetch('/dev/stats').then(setStats),
      apiFetch('/dev/logs?limit=100').then(setLogs),
      apiFetch('/dev/errors?limit=50').then(setErrors),
      apiFetch('/dev/sessions').then(setSessions),
      apiFetch('/dev/feature-flags').then(setFeatureFlags),
      apiFetch('/dev/system').then(setSystemInfo),
    ]);
  }, []);

  const loadTableData = useCallback(async (tableName, page = 1, searchQuery = search) => {
    if (!tableName) return;
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: '20' });
    if (searchQuery) params.append('search', searchQuery);
    const data = await apiFetch(`/dev/tables/${tableName}?${params}`);
    if (data) setTableData(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (selectedTable) loadTableData(selectedTable, 1, '');
  }, [selectedTable, loadTableData]);

  const handleSearch = () => {
    if (selectedTable) loadTableData(selectedTable, 1, search);
  };

  const handleEdit = (rowId, col, currentValue) => {
    setEditingCell({ rowId, col });
    setEditValue(currentValue === null ? '' : String(currentValue));
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    const res = await window.fetch(`${API}/dev/tables/${selectedTable}/${editingCell.rowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ [editingCell.col]: parseValue(editingCell.col, editValue) }),
    });
    if (res.ok) {
      showToast('Record updated');
      loadTableData(selectedTable, tableData.page);
      loadStats();
    }
    setEditingCell(null);
  };

  const handleDelete = async (rowId) => {
    const res = await window.fetch(`${API}/dev/tables/${selectedTable}/${rowId}`, {
      method: 'DELETE', credentials: 'include',
    });
    if (res.ok) {
      showToast('Record deleted');
      loadTableData(selectedTable, tableData.page);
      loadStats();
    } else {
      const err = await res.json();
      showToast(err.detail || 'Delete failed', true);
    }
    setConfirmDelete(null);
  };

  const parseValue = (col, val) => {
    if (val === '' || val === 'null') return null;
    if (!isNaN(val) && val !== '') return Number(val);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  };

  const loadStats = async () => {
    const data = await apiFetch('/dev/stats');
    if (data) setStats(data);
  };

  const refreshAll = async () => {
    Promise.all([
      apiFetch('/dev/tables').then(setTables),
      apiFetch('/dev/stats').then(setStats),
      apiFetch('/dev/logs?limit=100').then(setLogs),
      apiFetch('/dev/errors?limit=50').then(setErrors),
      apiFetch('/dev/sessions').then(setSessions),
      apiFetch('/dev/feature-flags').then(setFeatureFlags),
      apiFetch('/dev/system').then(setSystemInfo),
      apiFetch('/dev/logs-summary').then(setLogsSummary),
      apiFetch('/dev/schema').then(setSchema),
      apiFetch('/dev/perf').then(setPerfData),
      loadTableData(selectedTable, tableData.page),
    ]);
  };

  const handleExport = async (fmt) => {
    window.open(`${API}/dev/tables/${selectedTable}/export?fmt=${fmt}`, '_blank');
  };

  const runSQL = async () => {
    setSqlLoading(true);
    setSqlError(null);
    setSqlResult(null);
    try {
      const res = await window.fetch(`${API}/dev/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sql: sqlQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setSqlResult(data);
      } else {
        const err = await res.json();
        setSqlError(err.detail);
      }
    } catch { setSqlError('Failed to execute query'); }
    setSqlLoading(false);
  };

  const handleToggleFlag = async (id, enabled) => {
    const res = await window.fetch(`${API}/dev/feature-flags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: data.enabled } : f));
      showToast(`Feature ${data.enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const revokeSession = async (userId) => {
    const res = await window.fetch(`${API}/dev/sessions/${userId}/revoke`, {
      method: 'POST', credentials: 'include',
    });
    if (res.ok) {
      showToast('Session revoked');
      setSessions(prev => prev.filter(s => s.user_id !== userId));
    }
  };

  const revokeAllSessions = async () => {
    const res = await window.fetch(`${API}/dev/sessions/revoke-all`, {
      method: 'POST', credentials: 'include',
    });
    if (res.ok) {
      showToast('All sessions revoked');
      setSessions([]);
    }
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleString() : '-';

  const tabs = [
    { id: 'tables', label: 'Tables', icon: Table2 },
    { id: 'explorer', label: 'Explorer', icon: Search },
    { id: 'sql', label: 'SQL', icon: Terminal },
    { id: 'sessions', label: 'Sessions', icon: Users },
    { id: 'flags', label: 'Features', icon: Flag },
    { id: 'schema', label: 'Schema', icon: GitBranch },
    { id: 'logs', label: 'Activity', icon: Clock },
    { id: 'logs-summary', label: 'AI Summary', icon: Brain },
    { id: 'perf', label: 'Perf', icon: Gauge },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'system', label: 'System', icon: Server },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Code size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dev Console</h1>
            <p className="text-xs text-slate-500">Database viewer & debug tools</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2 py-1.5 rounded-lg">
            <Command size={12} />
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono border border-slate-200">Ctrl+K</kbd>
          </div>
          <button onClick={refreshAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'schema') apiFetch('/dev/schema').then(setSchema); if (tab.id === 'logs-summary') apiFetch('/dev/logs-summary').then(setLogsSummary); if (tab.id === 'perf') apiFetch('/dev/perf').then(setPerfData); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${toast.isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Record</h3>
            <p className="text-sm text-slate-500 mb-4">Delete record #{confirmDelete} from <code className="bg-slate-100 px-1 rounded">{selectedTable}</code>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 text-sm font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {tables.map(t => (
              <button key={t.name} onClick={() => { setSelectedTable(t.name); setSearch(''); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTable === t.name ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>{t.name} {stats[t.name] !== undefined ? `(${stats[t.name]})` : ''}</button>
            ))}
          </div>
          {selectedTable && (
            <>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                </div>
                <button onClick={handleSearch} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg">Search</button>
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => handleExport('json')} className="flex items-center gap-1 px-2 py-2 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><Download size={12} /> JSON</button>
                  <button onClick={() => handleExport('csv')} className="flex items-center gap-1 px-2 py-2 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><Download size={12} /> CSV</button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
                  {tableData.total} records &middot; Page {tableData.page} / {tableData.total_pages}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {tableData.columns.map(col => (
                          <th key={col} className="text-left px-3 py-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                        <th className="px-3 py-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan={tableData.columns.length + 1} className="px-3 py-8 text-center text-slate-400"><Loader size={16} className="animate-spin mx-auto" /></td></tr>
                      ) : tableData.data.length === 0 ? (
                        <tr><td colSpan={tableData.columns.length + 1} className="px-3 py-8 text-center text-slate-400">No records</td></tr>
                      ) : (
                        tableData.data.map(row => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            {tableData.columns.map(col => {
                              const isEditing = editingCell?.rowId === row.id && editingCell?.col === col;
                              const val = row[col];
                              const display = col === 'hashed_password' ? '••••••••' : (val === null ? 'null' : String(val));
                              return (
                                <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate">
                                  {isEditing ? (
                                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                      className="w-full px-2 py-1 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                                  ) : (
                                    <span className={val === null ? 'text-slate-300' : col === 'hashed_password' ? 'text-slate-300 font-mono' : 'text-slate-700'}>{display}</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                {editingCell?.rowId === row.id ? (
                                  <><button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={12} /></button>
                                  <button onClick={() => setEditingCell(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={12} /></button></>
                                ) : (
                                  <><button onClick={() => handleEdit(row.id, tableData.columns[2] || 'name', row[tableData.columns[2] || 'name'])} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={12} /></button>
                                  <button onClick={() => setConfirmDelete(row.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button></>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {tableData.total_pages > 1 && (
                  <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
                    <button disabled={tableData.page <= 1} onClick={() => loadTableData(selectedTable, tableData.page - 1)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 rounded disabled:opacity-40 hover:bg-slate-200">
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="text-xs text-slate-500">{tableData.page} / {tableData.total_pages}</span>
                    <button disabled={tableData.page >= tableData.total_pages} onClick={() => loadTableData(selectedTable, tableData.page + 1)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 rounded disabled:opacity-40 hover:bg-slate-200">
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'explorer' && <ExplorerTab />}

      {activeTab === 'sql' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-800">SQL Query Runner</span>
              </div>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-medium">SELECT only</span>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                <textarea value={sqlQuery} onChange={e => setSqlQuery(e.target.value)} onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') runSQL(); }}
                  className="flex-1 font-mono text-sm bg-slate-900 text-green-400 p-4 rounded-lg resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="SELECT * FROM users WHERE role = 'Student';" />
                <button onClick={runSQL} disabled={sqlLoading}
                  className="self-start px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50">
                  <Play size={14} /> Run
                </button>
              </div>
              {sqlError && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{sqlError}</div>}
              {sqlResult && (
                <div className="mt-4">
                  <div className="text-xs text-slate-500 mb-2">{sqlResult.row_count} rows returned</div>
                  <div className="overflow-x-auto bg-slate-50 rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          {sqlResult.columns.map(col => (
                            <th key={col} className="text-left px-3 py-2 text-[10px] font-medium text-slate-500 uppercase">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sqlResult.rows.map((row, i) => (
                          <tr key={i}>
                            {sqlResult.columns.map(col => (
                              <td key={col} className="px-3 py-2 font-mono text-slate-700 max-w-[200px] truncate">{row[col] === null ? 'NULL' : String(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Active Sessions</h2>
              <p className="text-xs text-slate-400">{sessions.length} active sessions</p>
            </div>
            <button onClick={revokeAllSessions} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
              <LogOut size={12} /> Revoke All
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {sessions.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No active sessions</div>
            ) : (
              sessions.map(s => (
                <div key={s.user_id} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">{s.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.email} &middot; <span className="font-mono">{s.role}</span> {s.school_id && `&middot; school #${s.school_id}`}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.token_expires === 'Expired' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{s.token_expires}</span>
                  <button onClick={() => revokeSession(s.user_id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Revoke session">
                    <LogOutIcon size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Feature Flags</h2>
            <p className="text-xs text-slate-400">Toggle features without code changes</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {featureFlags.map(f => (
              <div key={f.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${f.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{f.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{f.key}</p>
                    {f.description && <p className="text-[10px] text-slate-400">{f.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleToggleFlag(f.id, !f.enabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${f.enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${f.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Database Schema</h2>
            <p className="text-xs text-slate-400">Table structure and relationships</p>
          </div>
          {!schema ? (
            <div className="flex items-center justify-center py-12 text-slate-400"><Loader size={20} className="animate-spin mr-2" />Loading schema...</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(schema.tables).map(([tableName, info]) => (
                <div key={tableName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500" />
                      <span className="text-sm font-semibold text-slate-800">{tableName}</span>
                      <span className="text-[10px] text-slate-400">({info.total} columns)</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {info.columns.map(col => (
                      <div key={col.name} className="px-4 py-1.5 flex items-center gap-3 text-xs">
                        <span className={`w-2 h-2 rounded-full ${col.primary ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <span className="font-mono text-slate-700 w-32 truncate">{col.name}</span>
                        <span className="text-slate-400 w-24">{col.type}</span>
                        <div className="flex gap-1">
                          {col.primary && <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded font-medium">PK</span>}
                          {col.unique && <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-medium">UQ</span>}
                          {!col.nullable && <span className="px-1 py-0.5 bg-red-100 text-red-700 text-[9px] rounded font-medium">NOT NULL</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {info.foreign_keys.length > 0 && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 mb-1">Foreign Keys:</p>
                      {info.foreign_keys.map((fk, i) => (
                        <div key={i} className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <GitBranch size={10} className="text-slate-400" />
                          {fk.column} → {fk.references}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Activity Log</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {logs.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No activity</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    log.event_type.includes('success') ? 'bg-green-500' :
                    log.event_type.includes('failed') ? 'bg-red-500' :
                    log.event_type.includes('dev') ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded mr-2">{log.event_type}</span>
                      {log.email || 'system'}
                    </p>
                    {log.details && <p className="text-[10px] text-slate-400 truncate">{log.details}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatTime(log.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs-summary' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">AI Logs Summary</h2>
            <p className="text-xs text-slate-400">Smart analysis of system activity</p>
          </div>
          {!logsSummary ? (
            <div className="flex items-center justify-center py-12 text-slate-400"><Loader size={20} className="animate-spin mr-2" />Analyzing logs...</div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={18} className="text-amber-400" />
                  <h3 className="text-sm font-semibold">System Intelligence Report</h3>
                </div>
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{logsSummary.summary}</pre>
              </div>

              {/* Issues */}
              {logsSummary.recent_issues.length > 0 && (
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> Active Issues
                  </h3>
                  <div className="space-y-2">
                    {logsSummary.recent_issues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-red-50 rounded-lg px-3 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MiniStat label="Total Events" value={logsSummary.total} />
                <MiniStat label="Logins" value={logsSummary.successful_logins} color="green" />
                <MiniStat label="Failed" value={logsSummary.failed_logins} color="red" />
                <MiniStat label="Dev Actions" value={logsSummary.dev_actions} color="amber" />
                <MiniStat label="Signups" value={logsSummary.registrations} color="blue" />
                <MiniStat label="Rate Blocks" value={logsSummary.rate_blocks} color="red" />
              </div>

              {/* Top Users */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800">Top Users by Activity</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {logsSummary.top_emails.map((u, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between">
                      <span className="text-sm text-slate-700 font-mono">{u.email || 'system'}</span>
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{u.count} events</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Types */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800">Event Type Distribution</h3>
                </div>
                <div className="p-4 space-y-2">
                  {logsSummary.event_types.map((e, i) => {
                    const maxCount = Math.max(...logsSummary.event_types.map(x => x.count));
                    const pct = Math.round((e.count / maxCount) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 w-32 truncate">{e.type}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-12 text-right">{e.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Failed IPs */}
              {logsSummary.top_failed_ips.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Shield size={14} className="text-red-500" />
                      Suspicious IPs
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {logsSummary.top_failed_ips.map((ip, i) => (
                      <div key={i} className="px-4 py-2 flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-700">{ip.ip}</span>
                        <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded">{ip.count} failed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'perf' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Performance Profiler</h2>
            <p className="text-xs text-slate-400">Query speed and optimization suggestions</p>
          </div>
          {!perfData ? (
            <div className="flex items-center justify-center py-12 text-slate-400"><Loader size={20} className="animate-spin mr-2" />Profiling queries...</div>
          ) : (
            <>
              {perfData.suggestions.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-800">Optimization Suggestions</h3>
                  </div>
                  <div className="space-y-1">
                    {perfData.suggestions.map((s, i) => (
                      <p key={i} className="text-sm text-amber-700">{s}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800">Query Performance</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {Object.entries(perfData.queries).map(([table, info]) => (
                    <div key={table} className="px-4 py-2 flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-700 w-32 truncate">{table}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${info.query_time_ms > 50 ? 'bg-red-500' : info.query_time_ms > 10 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(info.query_time_ms * 2, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        info.query_time_ms > 50 ? 'bg-red-100 text-red-600' :
                        info.query_time_ms > 10 ? 'bg-amber-100 text-amber-600' :
                        'bg-green-100 text-green-600'
                      }`}>{info.query_time_ms}ms</span>
                      <span className="text-xs text-slate-400 w-12 text-right">{info.count} rows</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{key.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{typeof val === 'number' ? val.toLocaleString() : val}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'system' && systemInfo && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatBox label="Version" value={systemInfo.version} />
            <StatBox label="Environment" value={systemInfo.environment} />
            <StatBox label="Python" value={systemInfo.python_version} />
            <StatBox label="OS" value={systemInfo.os} />
            <StatBox label="CPU" value={`${systemInfo.cpu_percent}%`} />
            <StatBox label="RAM" value={`${systemInfo.memory_percent}%`} />
            <StatBox label="Process Memory" value={`${systemInfo.process_memory_mb} MB`} />
            <StatBox label="DB Size" value={`${systemInfo.db_size_mb} MB`} />
            <StatBox label="Uptime" value={`${Math.round(systemInfo.uptime / 60)}m`} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Resource Usage</h3>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">CPU</span>
                <span className="text-xs font-medium text-slate-700">{systemInfo.cpu_percent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${systemInfo.cpu_percent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Memory</span>
                <span className="text-xs font-medium text-slate-700">{systemInfo.memory_used_mb} / {systemInfo.memory_total_mb} MB</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-violet-500 transition-all" style={{ width: `${systemInfo.memory_percent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Process Memory</span>
                <span className="text-xs font-medium text-slate-700">{systemInfo.process_memory_mb} MB</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min((systemInfo.process_memory_mb / systemInfo.memory_total_mb) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">security.log</span>
            <span className="text-[10px] text-slate-500">{errors.errors?.length || 0} entries</span>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs">
            {errors.errors && errors.errors.length > 0 ? (
              errors.errors.map((err, i) => (
                <div key={i} className={`py-1 ${err.includes('ERROR') || err.includes('Exception') ? 'text-red-400' : err.includes('WARNING') ? 'text-amber-400' : 'text-slate-400'}`}>{err}</div>
              ))
            ) : (
              <div className="text-green-400 text-center py-8">No errors. System healthy.</div>
            )}
          </div>
        </div>
      )}

      <CommandPanel onNavigate={(tab) => setActiveTab(tab)} />
    </div>
  );
}

function MiniStat({ label, value, color = 'slate' }) {
  const colors = { green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-700', blue: 'bg-blue-100 text-blue-700', slate: 'bg-slate-100 text-slate-700' };
  return (
    <div className={`rounded-xl ${colors[color]} p-4 text-center`}>
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-lg font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

function ExplorerTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExplore = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const promises = [
        window.fetch(`${API}/dev/tables/users?search=${encodeURIComponent(query)}`, { credentials: 'include' }),
        window.fetch(`${API}/dev/tables/students?search=${encodeURIComponent(query)}`, { credentials: 'include' }),
        window.fetch(`${API}/dev/tables/schools?search=${encodeURIComponent(query)}`, { credentials: 'include' }),
      ];
      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(r => r.ok ? r.json() : null));
      const found = [];
      if (data[0]) data[0].data.forEach(row => found.push({ table: 'users', row }));
      if (data[1]) data[1].data.forEach(row => found.push({ table: 'students', row }));
      if (data[2]) data[2].data.forEach(row => found.push({ table: 'schools', row }));
      setResults(found);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleExplore()}
            placeholder="Search across all tables..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
        </div>
        <button onClick={handleExplore} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg">Search DB</button>
      </div>
      {loading && <div className="flex items-center justify-center py-8 text-slate-400"><Loader size={16} className="animate-spin mr-2" />Searching...</div>}
      {!loading && results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
          {results.map((r, i) => (
            <div key={i} className="px-5 py-3">
              <span className="text-[10px] font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mr-2">{r.table}</span>
              <pre className="mt-2 text-[10px] text-slate-600 font-mono whitespace-pre-wrap">{JSON.stringify(r.row, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Search size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No results for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

function CommandPanel({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (open) setInput(''); }, [open]);

  const commands = [
    { label: 'Open Tables', action: () => { onNavigate('tables'); setOpen(false); } },
    { label: 'Run SQL Query', action: () => { onNavigate('sql'); setOpen(false); } },
    { label: 'View Sessions', action: () => { onNavigate('sessions'); setOpen(false); } },
    { label: 'Toggle Feature Flags', action: () => { onNavigate('flags'); setOpen(false); } },
    { label: 'View Activity Logs', action: () => { onNavigate('logs'); setOpen(false); } },
    { label: 'AI Logs Summary', action: () => { onNavigate('logs-summary'); setOpen(false); } },
    { label: 'View Schema', action: () => { onNavigate('schema'); setOpen(false); } },
    { label: 'Performance Profiler', action: () => { onNavigate('perf'); setOpen(false); } },
    { label: 'View System Info', action: () => { onNavigate('system'); setOpen(false); } },
    { label: 'View Errors', action: () => { onNavigate('errors'); setOpen(false); } },
    { label: 'Open Explorer', action: () => { onNavigate('explorer'); setOpen(false); } },
    { label: 'View Stats', action: () => { onNavigate('stats'); setOpen(false); } },
  ];

  const filtered = input ? commands.filter(c => c.label.toLowerCase().includes(input.toLowerCase())) : commands;

  return open ? (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Command size={16} className="text-slate-400" />
          <input autoFocus value={input} onChange={e => setInput(e.target.value)} placeholder="Type a command..." className="flex-1 text-sm focus:outline-none"
            onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && filtered.length > 0) filtered[0].action(); }} />
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ESC</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.map((c, i) => (
            <button key={i} onClick={c.action} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">{c.label}</button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-4 text-center text-sm text-slate-400">No matching commands</div>}
        </div>
      </div>
    </div>
  ) : null;
}
