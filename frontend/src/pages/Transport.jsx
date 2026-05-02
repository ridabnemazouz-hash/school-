import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, MoreVertical, Trash2, Bus, MapPin, Users, Navigation } from 'lucide-react';

function ActionMenu({ item, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
          <button onClick={() => { onDelete(item.id); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function Transport() {
  const [routes, setRoutes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [stopsInput, setStopsInput] = useState('');
  const [formData, setFormData] = useState({ route: '', bus: '', driver: '', phone: '', capacity: 40, departure: '07:30', status: 'Active' });

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = (e) => {
    e.preventDefault();
    const stops = stopsInput.split(',').map(s => s.trim()).filter(Boolean);
    setRoutes(prev => [...prev, { id: Date.now(), ...formData, capacity: Number(formData.capacity), students: 0, stops }]);
    setIsModalOpen(false);
    setFormData({ route: '', bus: '', driver: '', phone: '', capacity: 40, departure: '07:30', status: 'Active' });
    setStopsInput('');
    showSuccess('✅ Route added successfully!');
  };

  const handleDelete = (id) => {
    setRoutes(prev => prev.filter(r => r.id !== id));
    setDeleteConfirm(null);
    showSuccess('🗑️ Route removed!');
  };

  const filtered = routes.filter(r =>
    r.route.toLowerCase().includes(search.toLowerCase()) ||
    r.driver.toLowerCase().includes(search.toLowerCase()) ||
    r.bus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transport Management</h1>
          <p className="text-slate-500 mt-1">Manage school buses, routes and drivers.</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> Add Route
        </Button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Routes', value: routes.length, color: 'text-blue-700' },
          { label: 'Active Buses', value: routes.filter(r => r.status === 'Active').length, color: 'text-green-700' },
          { label: 'Students Transported', value: routes.reduce((a, r) => a + r.students, 0), color: 'text-purple-700' },
          { label: 'Total Capacity', value: routes.reduce((a, r) => a + r.capacity, 0), color: 'text-orange-700' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(route => {
          const pct = Math.round((route.students / route.capacity) * 100);
          return (
            <Card key={route.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${route.status === 'Active' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Bus size={20} className={route.status === 'Active' ? 'text-blue-600' : 'text-slate-400'} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{route.route}</h3>
                    <p className="text-xs text-slate-400 font-mono">{route.bus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${route.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {route.status}
                  </span>
                  <ActionMenu item={route} onDelete={(id) => setDeleteConfirm(id)} />
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-slate-400" />
                  <span className="font-medium">{route.driver}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-400">{route.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-xs">{route.stops.join(' → ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600">🕐 Departure: {route.departure}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span className="flex items-center gap-1"><Users size={11} /> {route.students} / {route.capacity} students</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-10 text-center text-slate-400">No routes found.</Card>
      )}

      {/* Search bar above cards */}
      <div className="order-first">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search routes, drivers or buses..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 shadow-sm" />
        </div>
      </div>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-slate-600">Are you sure you want to delete this route?</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</Button>
            <Button type="button" onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white"><Trash2 size={16} className="mr-2" />Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Route">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Route Name</label>
              <input type="text" required value={formData.route} onChange={e => setFormData({ ...formData, route: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="e.g. Route D" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bus Number</label>
              <input type="text" required value={formData.bus} onChange={e => setFormData({ ...formData, bus: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 font-mono" placeholder="BUS-004" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
            <input type="text" required value={formData.driver} onChange={e => setFormData({ ...formData, driver: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="Driver full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Driver Phone</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="+212 6XX XXX XXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stops (comma separated)</label>
            <input type="text" value={stopsInput} onChange={e => setStopsInput(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" placeholder="Stop 1, Stop 2, Stop 3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
              <input type="number" required min={1} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
              <input type="time" value={formData.departure} onChange={e => setFormData({ ...formData, departure: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</Button>
            <Button type="submit" className="flex-1">Add Route</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
