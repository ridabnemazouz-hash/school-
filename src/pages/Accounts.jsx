import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Check, X, ShieldAlert, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import API from '../config';

export function Accounts() {
  const { lang } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/pending-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/approve/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || t(lang, 'failedToApprove'));
      }
      setRequests(requests.filter((r) => r.id !== id));
      setSuccess(t(lang, 'userApproved'));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'reject' }));
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/reject/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || t(lang, 'failedToReject'));
      }
      setRequests(requests.filter((r) => r.id !== id));
      setSuccess(t(lang, 'userRejected'));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t(lang, 'accountsPermissions')}</h1>
          <p className="text-slate-500 mt-1">{t(lang, 'accountsDesc')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm">{success}</div>
      )}

      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start">
        <ShieldAlert className="text-orange-500 mr-3 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-orange-800">
          <strong>{t(lang, 'actionRequired')}</strong> {t(lang, 'actionRequiredDesc', { count: requests.length })}
        </p>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">{t(lang, 'pendingRequests')}</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(lang, 'name')}</TableHead>
              <TableHead>{t(lang, 'email')}</TableHead>
              <TableHead>{t(lang, 'requestedRole')}</TableHead>
              <TableHead>{t(lang, 'date')}</TableHead>
              <TableHead className="text-right">{t(lang, 'actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  <Loader className="animate-spin mx-auto mb-2" size={24} />
                  {t(lang, 'loadingRequests')}
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  {t(lang, 'noPendingRequests')}
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium text-slate-800">{req.name}</TableCell>
                  <TableCell className="text-slate-500">{req.email}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      req.role === 'Teacher' ? 'bg-blue-100 text-blue-700' :
                      req.role === 'Student' ? 'bg-mauve-100 text-mauve-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {req.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleReject(req.id)}
                        disabled={!!actionLoading[req.id]}
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                        size="sm"
                      >
                        {actionLoading[req.id] === 'reject' ? (
                          <Loader className="animate-spin" size={18} />
                        ) : (
                          <>
                            <X size={18} className="mr-1" /> {t(lang, 'reject')}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleApprove(req.id)}
                        disabled={!!actionLoading[req.id]}
                        variant="success"
                        className="p-2 h-auto"
                        size="sm"
                      >
                        {actionLoading[req.id] === 'approve' ? (
                          <Loader className="animate-spin" size={18} />
                        ) : (
                          <>
                            <Check size={18} className="mr-1" /> {t(lang, 'accept')}
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
