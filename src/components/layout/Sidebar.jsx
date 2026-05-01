import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, FileText, 
  CalendarCheck, Settings, LogOut, School, Bus, UserPlus, FileDown, MessageSquare, Calendar, CreditCard
} from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    const items = [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
      { name: 'Admins', path: '/admins', icon: Users, roles: ['Super Admin'] },
      
      // Admin
      { name: 'Students', path: '/students', icon: Users, roles: ['Admin'] },
      { name: 'Teachers', path: '/teachers', icon: GraduationCap, roles: ['Admin'] },
      { name: 'Parents', path: '/parents', icon: Users, roles: ['Admin'] },
      { name: 'Classes', path: '/classes', icon: BookOpen, roles: ['Admin'] },
      { name: 'Subjects', path: '/subjects', icon: BookOpen, roles: ['Admin'] },
      { name: 'Transport', path: '/transport', icon: Bus, roles: ['Admin'] },
      { name: 'Accounts', path: '/accounts', icon: UserPlus, roles: ['Admin'] },

      // Teacher
      { name: 'My Classes', path: '/my-classes', icon: BookOpen, roles: ['Teacher'] },
      { name: 'My Students', path: '/my-students', icon: Users, roles: ['Teacher'] },
      
      // Student & Parent
      { name: 'Planning', path: '/planning', icon: Calendar, roles: ['Student', 'Parent'] },
      { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['Admin', 'Parent'] },

      // Shared
      { name: 'Grades', path: '/grades', icon: FileText, roles: ['Admin', 'Teacher', 'Student', 'Parent'] },
      { name: 'Attendance', path: '/attendance', icon: CalendarCheck, roles: ['Admin', 'Teacher', 'Student', 'Parent'] },
      { name: 'Lessons & Devoirs', path: '/content', icon: FileDown, roles: ['Teacher', 'Student', 'Parent'] },
      { name: 'Chat', path: '/chat', icon: MessageSquare, roles: ['Teacher', 'Student', 'Parent'] },
      { name: 'Settings', path: '/settings', icon: Settings, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
    ];
    return items.filter(item => item.roles.includes(user?.role));
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <School className="text-mauve-400 mr-3" size={28} />
        <span className="text-xl font-bold text-white tracking-wide">EduSaaS</span>
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto space-y-1 px-4">
        {getNavItems().map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium',
                isActive 
                  ? 'bg-mauve-500/10 text-mauve-400' 
                  : 'hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <Icon className="mr-3 shrink-0" size={20} />
              {item.name}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center w-full px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-medium"
        >
          <LogOut className="mr-3" size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
