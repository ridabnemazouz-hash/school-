import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Search, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight,
  Loader, BarChart3, Activity, AlertTriangle, RefreshCw, Code, Table2,
  Clock, Terminal, Flag, Users, Server, Play, Download, LogOut, LogOutIcon,
  Zap, Shield, Monitor, Command, GitBranch, Brain, Gauge, ListChecks,
  HardDrive, CreditCard, Plug, Bell, Rss, FlaskConical, EyeOff, FileText,
  RotateCcw, ArrowUpRight, ArrowDownRight, Lock, Ban, Eye, DatabaseBackup
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
  const [securityIncidents, setSecurityIncidents] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [securityDash, setSecurityDash] = useState(null);
  const [backups, setBackups] = useState([]);
  const [billingData, setBillingData] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [alertNotifs, setAlertNotifs] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [abTests, setABTests] = useState([]);
  const [reports, setReports] = useState([]);
  const [migrations, setMigrations] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [newIPReason, setNewIPReason] = useState('');
  const [abForm, setABForm] = useState({ name: '', description: '', feature_key: '', traffic_split: 50 });
  const [selectedReportType, setSelectedReportType] = useState('general');
  const [selectedReportSchool, setSelectedReportSchool] = useState('');
  const [reportResult, setReportResult] = useState(null);

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
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backups', label: 'Backups', icon: HardDrive },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'feed', label: 'Live Feed', icon: Rss },
    { id: 'ab-tests', label: 'A/B Tests', icon: FlaskConical },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'migrations', label: 'Migrations', icon: ArrowUpRight },
    { id: 'anonymize', label: 'Anonymize', icon: EyeOff },
    { id: 'reload', label: 'Reload', icon: RotateCcw },
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
            <button key={tab.id} onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'schema') apiFetch('/dev/schema').then(setSchema);
              if (tab.id === 'logs-summary') apiFetch('/dev/logs-summary').then(setLogsSummary);
              if (tab.id === 'perf') apiFetch('/dev/perf').then(setPerfData);
              if (tab.id === 'security') { Promise.all([apiFetch('/enterprise/security/dashboard').then(setSecurityDash), apiFetch('/enterprise/security/incidents?resolved=false').then(setSecurityIncidents), apiFetch('/enterprise/security/blocked-ips').then(setBlockedIPs)]); }
              if (tab.id === 'backups') apiFetch('/enterprise/backups').then(setBackups);
              if (tab.id === 'billing') apiFetch('/enterprise/billing/analytics').then(setBillingData);
              if (tab.id === 'integrations') apiFetch('/enterprise/integrations').then(setIntegrations);
              if (tab.id === 'alerts') { Promise.all([apiFetch('/enterprise/alerts/rules').then(setAlertRules), apiFetch('/enterprise/alerts/notifications').then(setAlertNotifs)]); }
              if (tab.id === 'feed') apiFetch('/enterprise/activity-feed').then(setActivityFeed);
              if (tab.id === 'ab-tests') apiFetch('/enterprise/ab-tests').then(setABTests);
              if (tab.id === 'reports') apiFetch('/enterprise/reports').then(setReports);
              if (tab.id === 'migrations') apiFetch('/enterprise/migrations').then(setMigrations);
            }}
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

      {activeTab === 'security' && (
        <div className="space-y-4">
          {!securityDash ? (
            <div className="flex items-center justify-center py-12 text-slate-400"><Loader size={20} className="animate-spin mr-2" />Loading security data...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <MiniStat label="Total Incidents" value={securityDash.total_incidents} color="red" />
                <MiniStat label="Active" value={securityDash.active_incidents} color="amber" />
                <MiniStat label="Critical" value={securityDash.critical_incidents} color="red" />
                <MiniStat label="Blocked IPs" value={securityDash.blocked_ips} color="slate" />
                <MiniStat label="Failed Logins (24h)" value={securityDash.failed_logins_today} color="red" />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Block IP Address</h3>
                <div className="flex gap-2">
                  <input value={newIP} onChange={e => setNewIP(e.target.value)} placeholder="IP address (e.g. 192.168.1.100)" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                  <input value={newIPReason} onChange={e => setNewIPReason(e.target.value)} placeholder="Reason" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                  <button onClick={async () => {
                    const res = await window.fetch(`${API}/enterprise/security/block-ip`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      credentials: 'include', body: JSON.stringify({ ip_address: newIP, reason: newIPReason }),
                    });
                    if (res.ok) { showToast('IP blocked'); setNewIP(''); setNewIPReason(''); apiFetch('/enterprise/security/blocked-ips').then(setBlockedIPs); }
                  }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center gap-1"><Ban size={14} /> Block</button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Incidents by Severity</h3></div>
                  <div className="p-4 space-y-2">
                    {securityDash.by_severity.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.severity === 'critical' ? 'bg-red-100 text-red-700' : s.severity === 'high' ? 'bg-orange-100 text-orange-700' : s.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{s.severity}</span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Top Attacker IPs</h3></div>
                  <div className="divide-y divide-slate-50">
                    {securityDash.top_attacker_ips.map((ip, i) => (
                      <div key={i} className="px-4 py-2 flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-700">{ip.ip}</span>
                        <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded">{ip.count} incidents</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Active Incidents</h3>
                  <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/security/force-reset-passwords`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ target: 'all' }) }); if (res.ok) { const d = await res.json(); showToast(d.message); }}} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"><Lock size={12} /> Force Reset All</button>
                </div>
                <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                  {securityIncidents.length === 0 ? (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">No active incidents</div>
                  ) : (
                    securityIncidents.map(inc => (
                      <div key={inc.id} className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${inc.severity === 'critical' ? 'bg-red-500 animate-pulse' : inc.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{inc.incident_type}</p>
                          <p className="text-[10px] text-slate-400 truncate">{inc.details}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${inc.severity === 'critical' ? 'bg-red-100 text-red-600' : inc.severity === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'}`}>{inc.severity}</span>
                        <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/security/incidents/${inc.id}/resolve`, { method: 'POST', credentials: 'include' }); if (res.ok) { showToast('Incident resolved'); apiFetch('/enterprise/security/incidents?resolved=false').then(setSecurityIncidents); apiFetch('/enterprise/security/dashboard').then(setSecurityDash); }}} className="p-1 text-green-500 hover:bg-green-50 rounded"><Shield size={14} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Blocked IPs</h3></div>
                <div className="divide-y divide-slate-50 max-h-[200px] overflow-y-auto">
                  {blockedIPs.length === 0 ? (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">No blocked IPs</div>
                  ) : (
                    blockedIPs.map(ip => (
                      <div key={ip.id} className="px-4 py-2 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono text-slate-700">{ip.ip_address}</span>
                          <p className="text-[10px] text-slate-400">{ip.reason}</p>
                        </div>
                        <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/security/unblock-ip/${ip.id}`, { method: 'DELETE', credentials: 'include' }); if (res.ok) { showToast('IP unblocked'); apiFetch('/enterprise/security/blocked-ips').then(setBlockedIPs); apiFetch('/enterprise/security/dashboard').then(setSecurityDash); }}} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={14} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-semibold text-slate-800">Backup Manager</h2><p className="text-xs text-slate-400">Database backup & restore</p></div>
            <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/backups/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ type: 'manual' }) }); if (res.ok) { const d = await res.json(); showToast(`Backup created: ${d.filename} (${d.size_mb}MB)`); apiFetch('/enterprise/backups').then(setBackups); }}} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"><HardDrive size={14} /> Create Backup</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {backups.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No backups yet</div>
            ) : (
              backups.map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><DatabaseBackup size={18} className="text-green-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{b.filename}</p>
                    <p className="text-[10px] text-slate-400">{b.size_mb}MB &middot; {b.backup_type} &middot; {formatTime(b.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-green-100 text-green-600' : b.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{b.status}</span>
                  <button onClick={async () => { if (confirm('Restore this backup?')) { const res = await window.fetch(`${API}/enterprise/backups/restore?backup_id=${b.id}`, { method: 'POST', credentials: 'include' }); if (res.ok) showToast('Restore initiated'); }}} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Restore"><RotateCcw size={14} /></button>
                  <button onClick={async () => { if (confirm('Delete this backup?')) { const res = await window.fetch(`${API}/enterprise/backups/${b.id}`, { method: 'DELETE', credentials: 'include' }); if (res.ok) { showToast('Backup deleted'); apiFetch('/enterprise/backups').then(setBackups); }}}} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-4">
          {!billingData ? (
            <div className="flex items-center justify-center py-12 text-slate-400"><Loader size={20} className="animate-spin mr-2" />Loading billing data...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="Total Revenue" value={`${billingData.total_revenue.toLocaleString()} DH`} color="green" />
                <MiniStat label="MRR" value={`${billingData.mrr.toLocaleString()} DH`} color="blue" />
                <MiniStat label="LTV" value={`${billingData.ltv.toLocaleString()} DH`} color="amber" />
                <MiniStat label="Churn Rate" value={`${billingData.churn_rate}%`} color={billingData.churn_rate > 10 ? 'red' : 'green'} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Revenue Per School</h3></div>
                <div className="divide-y divide-slate-50">
                  {billingData.revenue_by_school.map((s, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400 w-6">#{s.school_id}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{s.school_name}</p>
                        <p className="text-[10px] text-slate-400">{s.student_count} students &middot; {s.subscription_plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{s.revenue.toLocaleString()} DH</p>
                        <p className="text-[10px] text-slate-400">{s.revenue_per_student} DH/student</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {Object.keys(billingData.monthly_revenue).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Monthly Revenue Trend</h3>
                  <div className="space-y-2">
                    {Object.entries(billingData.monthly_revenue).map(([month, rev]) => {
                      const maxRev = Math.max(...Object.values(billingData.monthly_revenue));
                      const pct = Math.round((rev / maxRev) * 100);
                      return (
                        <div key={month} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500 w-16">{month}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-3"><div className="h-3 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
                          <span className="text-xs font-medium text-slate-600 w-20 text-right">{rev.toLocaleString()} DH</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div><h2 className="text-sm font-semibold text-slate-800">Integration Hub</h2><p className="text-xs text-slate-400">Connect external services</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(int => (
              <div key={int.service} className={`bg-white rounded-xl border shadow-sm p-5 ${int.is_active ? 'border-green-200' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{int.icon}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${int.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{int.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">{int.name}</h3>
                {int.last_tested && (
                  <p className="text-[10px] text-slate-400 mb-3">Last tested: {formatTime(int.last_tested)} &middot; {int.test_status}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/integrations/${int.service}/test`, { method: 'POST', credentials: 'include' }); if (res.ok) { const d = await res.json(); showToast(d.message, !d.success); apiFetch('/enterprise/integrations').then(setIntegrations); }}} className="flex-1 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Test</button>
                  <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/integrations/${int.service}/configure`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ config: int.config, is_active: !int.is_active }) }); if (res.ok) { showToast(`Integration ${int.is_active ? 'disabled' : 'enabled'}`); apiFetch('/enterprise/integrations').then(setIntegrations); }}} className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${int.is_active ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>{int.is_active ? 'Disable' : 'Enable'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-semibold text-slate-800">Smart Alerts</h2><p className="text-xs text-slate-400">Monitor system health</p></div>
            <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/alerts/check`, { method: 'POST', credentials: 'include' }); if (res.ok) { const d = await res.json(); showToast(`${d.total_triggered} alerts triggered`); apiFetch('/enterprise/alerts/notifications').then(setAlertNotifs); }}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"><Zap size={12} /> Run Checks</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Alert Rules</h3></div>
              <div className="divide-y divide-slate-50">
                {alertRules.map(r => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{r.name}</p>
                      <p className="text-[10px] text-slate-400">{r.condition} &middot; {r.notification_channels}</p>
                    </div>
                    <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/alerts/rules/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ enabled: !r.enabled }) }); if (res.ok) { apiFetch('/enterprise/alerts/rules').then(setAlertRules); }}}
                      className={`relative w-10 h-6 rounded-full transition-colors ${r.enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${r.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Notifications</h3></div>
              <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                {alertNotifs.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No notifications</div>
                ) : (
                  alertNotifs.map(n => (
                    <div key={n.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${n.severity === 'critical' ? 'bg-red-500' : n.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{n.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatTime(n.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-semibold text-slate-800">Real-Time Activity Feed</h2><p className="text-xs text-slate-400">Live system events</p></div>
            <button onClick={() => apiFetch('/enterprise/activity-feed').then(setActivityFeed)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><RefreshCw size={12} /> Refresh</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {activityFeed.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No activity events</div>
            ) : (
              activityFeed.map(e => (
                <div key={e.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    e.event_type.includes('created') ? 'bg-green-100' : e.event_type.includes('login') ? 'bg-blue-100' : e.event_type.includes('payment') ? 'bg-amber-100' : e.event_type.includes('blocked') ? 'bg-red-100' : 'bg-slate-100'
                  }`}>
                    <Activity size={14} className={
                      e.event_type.includes('created') ? 'text-green-600' : e.event_type.includes('login') ? 'text-blue-600' : e.event_type.includes('payment') ? 'text-amber-600' : e.event_type.includes('blocked') ? 'text-red-600' : 'text-slate-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded mr-2">{e.event_type}</span>
                      {e.user_email || 'system'}
                    </p>
                    {e.details && <p className="text-[10px] text-slate-400 truncate">{e.details}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{e.ago}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'ab-tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-semibold text-slate-800">A/B Testing</h2><p className="text-xs text-slate-400">Experiment with features</p></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Create New Test</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={abForm.name} onChange={e => setABForm(f => ({...f, name: e.target.value}))} placeholder="Test name" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              <input value={abForm.feature_key} onChange={e => setABForm(f => ({...f, feature_key: e.target.value}))} placeholder="Feature key" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              <input value={abForm.description} onChange={e => setABForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Split:</span>
                <input type="number" value={abForm.traffic_split} onChange={e => setABForm(f => ({...f, traffic_split: parseInt(e.target.value) || 50}))} className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                <span className="text-xs text-slate-400">% to B</span>
              </div>
            </div>
            <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/ab-tests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(abForm) }); if (res.ok) { showToast('A/B test created'); setABForm({ name: '', description: '', feature_key: '', traffic_split: 50 }); apiFetch('/enterprise/ab-tests').then(setABTests); }}} className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg">Create Test</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {abTests.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No A/B tests yet</div>
            ) : (
              abTests.map(t => (
                <div key={t.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.status === 'running' ? 'bg-green-100' : t.status === 'completed' ? 'bg-slate-100' : 'bg-amber-100'}`}>
                    <FlaskConical size={18} className={t.status === 'running' ? 'text-green-600' : t.status === 'completed' ? 'text-slate-600' : 'text-amber-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.feature_key} &middot; Split: {t.traffic_split}% to B</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.status === 'running' ? 'bg-green-100 text-green-600' : t.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-600'}`}>{t.status}</span>
                  {t.status === 'draft' && <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/ab-tests/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status: 'running' }) }); if (res.ok) { showToast('Test started'); apiFetch('/enterprise/ab-tests').then(setABTests); }}} className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-600 rounded-lg hover:bg-green-200">Start</button>}
                  {t.status === 'running' && <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/ab-tests/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status: 'completed' }) }); if (res.ok) { showToast('Test completed'); apiFetch('/enterprise/ab-tests').then(setABTests); }}} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">End</button>}
                  <button onClick={async () => { if (confirm('Delete this test?')) { const res = await window.fetch(`${API}/enterprise/ab-tests/${t.id}`, { method: 'DELETE', credentials: 'include' }); if (res.ok) { showToast('Test deleted'); apiFetch('/enterprise/ab-tests').then(setABTests); }}}} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div><h2 className="text-sm font-semibold text-slate-800">Report Generator</h2><p className="text-xs text-slate-400">Generate reports per school</p></div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex gap-3 flex-wrap">
              <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="general">General</option>
                <option value="financial">Financial</option>
                <option value="academic">Academic</option>
                <option value="security">Security</option>
              </select>
              <input value={selectedReportSchool} onChange={e => setSelectedReportSchool(e.target.value)} placeholder="School ID (optional)" type="number" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-40" />
              <button onClick={async () => { const body = { report_type: selectedReportType }; if (selectedReportSchool) body.school_id = parseInt(selectedReportSchool); const res = await window.fetch(`${API}/enterprise/reports/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }); if (res.ok) { const d = await res.json(); showToast('Report generated'); setReportResult(d.data); apiFetch('/enterprise/reports').then(setReports); }}} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1"><FileText size={14} /> Generate</button>
            </div>
            {reportResult && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Report Result</h4>
                <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">{JSON.stringify(reportResult, null, 2)}</pre>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Report History</h3></div>
            <div className="divide-y divide-slate-50">
              {reports.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-400 text-sm">No reports generated</div>
              ) : (
                reports.map(r => (
                  <div key={r.id} className="px-4 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{r.report_type} report</p>
                      <p className="text-[10px] text-slate-400">{formatTime(r.created_at)} &middot; by {r.generated_by}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{r.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'migrations' && (
        <div className="space-y-4">
          <div><h2 className="text-sm font-semibold text-slate-800">Migration Manager</h2><p className="text-xs text-slate-400">Apply & rollback DB migrations</p></div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {migrations.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No migrations</div>
            ) : (
              migrations.map(m => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.status === 'applied' ? 'bg-green-100' : m.status === 'rolled_back' ? 'bg-orange-100' : m.status === 'failed' ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <ArrowUpRight size={16} className={m.status === 'applied' ? 'text-green-600' : m.status === 'rolled_back' ? 'text-orange-600' : m.status === 'failed' ? 'text-red-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-slate-700">{m.migration_name}</p>
                    <p className="text-[10px] text-slate-400">{m.details || 'No description'}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${m.status === 'applied' ? 'bg-green-100 text-green-600' : m.status === 'pending' ? 'bg-slate-100 text-slate-600' : m.status === 'rolled_back' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>{m.status}</span>
                  {m.status === 'pending' && <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/migrations/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ migration_name: m.migration_name }) }); if (res.ok) { showToast('Migration applied'); apiFetch('/enterprise/migrations').then(setMigrations); } else { const d = await res.json(); showToast(d.detail || 'Failed', true); }}} className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-600 rounded-lg hover:bg-green-200">Apply</button>}
                  {m.status === 'applied' && <button onClick={async () => { if (confirm('Rollback this migration?')) { const res = await window.fetch(`${API}/enterprise/migrations/rollback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ migration_name: m.migration_name }) }); if (res.ok) { showToast('Rolled back'); apiFetch('/enterprise/migrations').then(setMigrations); } else { const d = await res.json(); showToast(d.detail || 'Failed', true); }}}} className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200">Rollback</button>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'anonymize' && (
        <div className="space-y-4">
          <div><h2 className="text-sm font-semibold text-slate-800">Data Anonymization</h2><p className="text-xs text-slate-400">Mask personal data for testing</p></div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <EyeOff size={20} className="text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Anonymize Data</p>
                <p className="text-xs text-slate-400">This will replace personal info with placeholder values</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select id="anon-target" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                <option value="all">All Records</option>
                <option value="users">Users Only</option>
                <option value="schools">Schools Only</option>
              </select>
              <button onClick={async () => { const target = document.getElementById('anon-target').value; const res = await window.fetch(`${API}/enterprise/anonymize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ target }) }); if (res.ok) { const d = await res.json(); showToast(`${d.count} records anonymized`); }}} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg flex items-center gap-1"><EyeOff size={14} /> Anonymize</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reload' && (
        <div className="space-y-4">
          <div><h2 className="text-sm font-semibold text-slate-800">Live Code Reload</h2><p className="text-xs text-slate-400">Server controls & cache management</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><RotateCcw size={18} className="text-red-600" /></div><div><p className="text-sm font-semibold text-slate-800">Restart Server</p><p className="text-xs text-slate-400">Graceful restart</p></div></div>
              <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/reload/restart`, { method: 'POST', credentials: 'include' }); if (res.ok) showToast('Restart signal sent'); }} className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">Restart</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Zap size={18} className="text-amber-600" /></div><div><p className="text-sm font-semibold text-slate-800">Clear Cache</p><p className="text-xs text-slate-400">Remove .pyc files</p></div></div>
              <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/reload/clear-cache`, { method: 'POST', credentials: 'include' }); if (res.ok) { const d = await res.json(); showToast(d.message); }}} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg">Clear Cache</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Server size={18} className="text-green-600" /></div><div><p className="text-sm font-semibold text-slate-800">Server Status</p><p className="text-xs text-slate-400">Current state</p></div></div>
              <button onClick={async () => { const res = await window.fetch(`${API}/enterprise/reload/status`, { credentials: 'include' }); if (res.ok) { const d = await res.json(); showToast(`PID: ${d.pid}, Uptime: ${d.uptime_seconds}s`); }}} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">Check Status</button>
            </div>
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
    { label: 'Security Center', action: () => { onNavigate('security'); setOpen(false); } },
    { label: 'Backup Manager', action: () => { onNavigate('backups'); setOpen(false); } },
    { label: 'Billing Analytics', action: () => { onNavigate('billing'); setOpen(false); } },
    { label: 'Integration Hub', action: () => { onNavigate('integrations'); setOpen(false); } },
    { label: 'Smart Alerts', action: () => { onNavigate('alerts'); setOpen(false); } },
    { label: 'Live Activity Feed', action: () => { onNavigate('feed'); setOpen(false); } },
    { label: 'A/B Testing', action: () => { onNavigate('ab-tests'); setOpen(false); } },
    { label: 'Report Generator', action: () => { onNavigate('reports'); setOpen(false); } },
    { label: 'Migration Manager', action: () => { onNavigate('migrations'); setOpen(false); } },
    { label: 'Data Anonymization', action: () => { onNavigate('anonymize'); setOpen(false); } },
    { label: 'Live Code Reload', action: () => { onNavigate('reload'); setOpen(false); } },
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
