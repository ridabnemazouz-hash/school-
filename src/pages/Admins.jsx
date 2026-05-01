import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, ShieldAlert, X } from 'lucide-react';
import { FAKE_ADMINS } from '../data/fakeData';

export function Admins() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Admin' });
  const [admins, setAdmins] = useState(FAKE_ADMINS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/auth/add-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to add admin');
      }

      const data = await response.json();
      setAdmins([...admins, {
        id: data.id,
        name: formData.name,
        email: formData.email,
        status: data.status,
        addedDate: new Date().toLocaleDateString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=6366f1&color=fff`
      }]);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'Admin' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admins Management</h1>
          <p className="text-slate-500 mt-1">Create and manage admin accounts for daily operations.</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Add Admin
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
        <ShieldAlert className="text-blue-500 mr-3 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Admins are responsible for managing Students, Teachers, and Parents. You (Super Admin) only oversee the platform and these admins.
        </p>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search admins by name or email..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium text-slate-800 flex items-center gap-3">
                  <img src={admin.avatar} alt={admin.name} className="w-8 h-8 rounded-full border border-slate-200" />
                  {admin.name}
                </TableCell>
                <TableCell className="text-slate-500">{admin.email}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    admin.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {admin.status}
                  </span>
                </TableCell>
                <TableCell className="text-slate-500">{admin.addedDate}</TableCell>
                <TableCell className="text-right">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Admin">
        <form onSubmit={handleAddAdmin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
              placeholder="Enter admin name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
              placeholder="admin@school.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500"
            >
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Adding...' : 'Add Admin'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
