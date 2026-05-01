import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { CreditCard, Download, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FAKE_PAYMENTS = [
  { id: 1, child: 'Youssef', month: 'October 2026', amount: '1200 DH', status: 'Paid', date: '01/10/2026' },
  { id: 2, child: 'Youssef', month: 'November 2026', amount: '1200 DH', status: 'Pending', date: '-' },
];

export function Payments() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments & Invoices</h1>
        <p className="text-slate-500 mt-1">Manage school fees and download your invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-mauve-600 to-mauve-800 text-white border-0">
          <CardContent className="p-6">
            <p className="text-mauve-200 text-sm font-medium">Total Due (November)</p>
            <h2 className="text-4xl font-bold mt-2 mb-4">1200 DH</h2>
            <Button variant="primary" className="w-full bg-white text-mauve-700 hover:bg-slate-50 border-0">
              <CreditCard className="mr-2" size={18} />
              Pay Online Now
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Payment History</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FAKE_PAYMENTS.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.child}</TableCell>
                  <TableCell className="text-slate-600">{payment.month}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{payment.amount}</TableCell>
                  <TableCell>
                    {payment.status === 'Paid' ? (
                      <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-md w-fit">
                        <CheckCircle size={14} className="mr-1.5" /> Paid
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600 text-sm font-medium bg-orange-50 px-2 py-1 rounded-md w-fit">
                        <Clock size={14} className="mr-1.5" /> Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-mauve-600" disabled={payment.status !== 'Paid'}>
                      <Download size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
