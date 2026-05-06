import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, Sparkles } from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';

export function MobileBottomNav() {
  const { user } = useAuth();
  
  const navItems = [
    { icon: LayoutDashboard, path: '/school', label: 'Home' },
    { icon: Users, path: '/school/students', label: 'Students', roles: ['Super Admin', 'Admin'] },
    { icon: Sparkles, path: '/school/ai-tutor', label: 'AI Tutor', roles: ['Student', 'Teacher', 'Parent'] },
    { icon: MessageSquare, path: '/school/chat', label: 'Chat' },
    { icon: Settings, path: '/school/settings', label: 'Settings' },
  ];

  const filteredItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 px-4 pb-safe">
      <div className="flex items-center justify-between h-16 max-w-md mx-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/school'}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 transition-all duration-300",
              isActive ? "text-indigo-600 dark:text-indigo-400 scale-110" : "text-slate-400"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
