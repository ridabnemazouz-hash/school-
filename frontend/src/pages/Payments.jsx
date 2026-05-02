import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { CreditCard, Download, CheckCircle, Clock, Search, ArrowUpRight, DollarSign, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../config';

const MONTHS = [
  'January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026',
  'June 2026', 'July 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'
];

export function Payments() {
  const { user } = useAuth();
  const isAdmin = user.role === 'Admin' || user.role === 'Super Admin';
  const isParent = user.role === 'Parent';
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, outstanding: 0, collected: 0, monthGrowth: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [payForm, setPayForm] = useState({ student_name: '', month: '', amount: 1200, payment_method: 'Credit Card' });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    try {
            const res = await fetch(`${API}/payments/`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
        setError(null);
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to fetch payments');
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError('Connection error. Please check the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
            const res = await fetch(`${API}/payments/stats`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
            const res = await fetch(`${API}/payments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payForm),
      });
      if (res.ok) {
        const data = await res.json();
        setShowPay(false);
        setPayForm({ student_name: '', month: '', amount: 1200, payment_method: 'Credit Card' });
        fetchPayments();
        fetchStats();
        const receiptRes = await fetch(`${API}/payments/${data.id}/receipt`, { credentials: 'include' });
        if (receiptRes.ok) {
          const blob = await receiptRes.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Facture-${data.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setPaying(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
            const res = await fetch(`${API}/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchPayments();
        fetchStats();
        if (status === 'Paid') {
          const receiptRes = await fetch(`${API}/payments/${id}/receipt`, { credentials: 'include' });
          if (receiptRes.ok) {
            const blob = await receiptRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Facture-${id}.pdf`;
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

  const handleDownloadFacture = async (id) => {
    try {
            const res = await fetch(`${API}/payments/${id}/receipt`, {
        credentials: 'include',
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Facture-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errData = await res.json();
        alert('Error: ' + (errData.detail || 'Failed to download facture'));
      }
    } catch (err) {
      alert('Failed to download facture');
    }
  };

  const filtered = payments.filter(p =>
    p.student_name.toLowerCase().includes(search.toLowerCase()) ||
    p.month.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isParent ? 'Mes Paiements' : 'Financial Management'}</h1>
          <p className="text-slate-500 mt-1">
            {isParent ? 'Suivez et payez les frais de scolarité de vos enfants.' : 'Track tuition fees, invoices, and school expenses.'}
          </p>
        </div>
        <div className="flex gap-2">
          {(isParent || isAdmin) && (
            <Button onClick={() => setShowPay(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <DollarSign size={18} className="mr-2" />
              {isParent ? 'Payer maintenant' : 'Record Payment'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-red-700">Error</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
          <Button variant="ghost" className="text-red-600 hover:bg-red-100 text-xs font-bold" onClick={() => { fetchPayments(); fetchStats(); }}>
            Retry
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white border-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard size={120} />
          </div>
          <div className="p-6 relative">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{isParent ? 'Total Payé' : 'Total Revenue'}</p>
            <h2 className="text-4xl font-black mt-2 mb-6 tracking-tight">{stats.totalRevenue.toLocaleString()} <span className="text-sm font-medium">DH</span></h2>
            <div className={`flex items-center gap-2 text-xs font-bold w-fit px-2 py-1 rounded-lg ${stats.monthGrowth >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
              <ArrowUpRight size={14} /> {stats.monthGrowth >= 0 ? '+' : ''}{stats.monthGrowth}%
            </div>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
            <span className="text-[10px] font-black text-amber-600 uppercase">Pending</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isParent ? 'En attente' : 'Outstanding'}</p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">{stats.outstanding.toLocaleString()} <span className="text-sm font-medium">DH</span></h4>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><CheckCircle size={24} /></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase">Collected</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isParent ? 'Total Collecté' : 'Total Collected'}</p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">{stats.collected.toLocaleString()} <span className="text-sm font-medium">DH</span></h4>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search payments by student or month..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold text-slate-700 uppercase text-[10px]">{isParent ? 'Enfant' : 'Student'}</TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-[10px]">Month</TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-[10px]">Amount</TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-[10px]">Method</TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-[10px]">Status</TableHead>
              {isAdmin && <TableHead className="text-right font-bold text-slate-700 uppercase text-[10px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 size={24} className="animate-spin mx-auto text-slate-300" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">No payments found.</TableCell>
              </TableRow>
            ) : (
              filtered.map(payment => (
                <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-slate-800">{payment.student_name}</TableCell>
                  <TableCell className="text-slate-500 text-sm font-medium">{payment.month}</TableCell>
                  <TableCell className="font-black text-slate-900">{payment.amount.toLocaleString()} DH</TableCell>
                  <TableCell className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{payment.payment_method || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      payment.status === 'Paid' ? 'bg-green-100 text-green-700' : payment.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {payment.status}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {payment.status !== 'Paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs font-bold mr-1"
                          onClick={() => handleUpdateStatus(payment.id, 'Paid')}
                        >
                          <CheckCircle size={14} className="mr-1" /> Mark Paid
                        </Button>
                      )}
                      {payment.status === 'Paid' && (
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold mr-1" onClick={() => handleDownloadFacture(payment.id)}>
                          <Download size={14} className="mr-1" /> Facture
                        </Button>
                      )}
                    </TableCell>
                  )}
                  {!isAdmin && payment.status === 'Paid' && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold" onClick={() => handleDownloadFacture(payment.id)}>
                        <Download size={14} className="mr-1" /> Télécharger Facture
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Payment Modal */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPay(false)}>
          <Card className="w-full max-w-md p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{isParent ? 'Effectuer un paiement' : 'Record Payment'}</h2>
              <button onClick={() => setShowPay(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Student Name *</label>
                <input
                  type="text"
                  required
                  value={payForm.student_name}
                  onChange={e => setPayForm(prev => ({ ...prev, student_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g. Anas Tazi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Month *</label>
                <select
                  required
                  value={payForm.month}
                  onChange={e => setPayForm(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Select month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amount (DH)</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={e => setPayForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method</label>
                <select
                  value={payForm.payment_method}
                  onChange={e => setPayForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1 border border-slate-200" onClick={() => setShowPay(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={paying}>
                  {paying ? <Loader2 size={16} className="animate-spin" /> : 'Pay Now'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
