import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import {
  LayoutDashboard, School, CreditCard, Shield, Settings, LogOut, Crown, X, Code,
  HardDrive, Plug, FileText
} from 'lucide-react';

export function OwnerSidebar({ mobileOpen = false, onClose }) {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Schools', path: '/schools', icon: School },
    { name: 'Security', path: '/security-center', icon: Shield },
    { name: 'Backups', path: '/backups', icon: HardDrive },
    { name: 'Billing', path: '/billing', icon: CreditCard },
    { name: 'Integrations', path: '/integrations', icon: Plug },
    { name: 'Logs', path: '/security', icon: FileText },
    { name: 'Dev Console', path: '/dev-db', icon: Code },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">EduSaaS</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 py-6 overflow-y-auto space-y-1 px-4">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Platform</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium',
                isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <Icon className="mr-3 shrink-0" size={18} />
              <span className="text-sm">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); if (onClose) onClose(); }}
          className="flex items-center w-full px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-medium"
        >
          <LogOut className="mr-3" size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose}></div>
      )}

      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
        {sidebarContent}
      </aside>

      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-col h-screen z-50 transform transition-transform duration-300 md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
