import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FAKE_USERS } from '../../data/fakeData';

export function TopNavbar() {
  const { user, switchRole } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetch('http://localhost:8000/auth/pending-requests')
        .then(res => res.json())
        .then(data => setPendingCount(data.length))
        .catch(err => console.error(err));
    }
  }, [user]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center flex-1">
        <button className="md:hidden mr-4 text-slate-500 hover:text-slate-700">
          <Menu size={24} />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search students, classes..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Switcher for Demo Purposes */}
        <select 
          className="text-sm bg-mauve-50 border border-mauve-200 text-mauve-700 rounded-md px-2 py-1 outline-none"
          value={user?.role}
          onChange={(e) => switchRole(e.target.value)}
        >
          {FAKE_USERS.map(u => (
            <option key={u.id} value={u.role}>View as {u.role}</option>
          ))}
        </select>

        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          {user?.role === 'Admin' && pendingCount > 0 ? (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border border-white flex items-center justify-center">
              {pendingCount}
            </span>
          ) : (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          )}
        </button>
        
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 mt-1">{user?.role}</p>
          </div>
          <img 
            src={user?.avatar} 
            alt="Profile" 
            className="w-9 h-9 rounded-full border border-slate-200"
          />
        </div>
      </div>
    </header>
  );
}
