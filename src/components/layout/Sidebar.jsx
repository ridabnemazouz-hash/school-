import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils';
import { t } from '../../i18n/translations';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, FileText, 
  CalendarCheck, Settings, LogOut, School, Bus, UserPlus, FileDown, MessageSquare, Calendar, CreditCard, X
} from 'lucide-react';

export function Sidebar({ mobileOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const { lang } = useLanguage();

  const getNavItems = () => {
    const navKeys = {
      dashboard: 'dashboard',
      admins: 'admins',
      accounts: 'accounts',
      students: 'students',
      teachers: 'teachers',
      parents: 'parents',
      classes: 'classes',
      subjects: 'subjects',
      transport: 'transport',
      myClasses: 'myClasses',
      myStudents: 'myStudents',
      planning: 'planning',
      payments: 'payments',
      grades: 'grades',
      attendance: 'attendance',
      lessons: 'lessons',
      chat: 'chat',
      settings: 'settings',
      logout: 'logout',
    };

    const items = [
      { name: t(lang, navKeys.dashboard), path: '/', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
      
      { name: t(lang, navKeys.admins), path: '/admins', icon: Users, roles: ['Super Admin'] },
      { name: t(lang, navKeys.accounts), path: '/accounts', icon: UserPlus, roles: ['Super Admin'] },
      
      { name: t(lang, navKeys.students), path: '/students', icon: Users, roles: ['Super Admin', 'Admin'] },
      { name: t(lang, navKeys.teachers), path: '/teachers', icon: GraduationCap, roles: ['Super Admin', 'Admin'] },
      { name: t(lang, navKeys.parents), path: '/parents', icon: Users, roles: ['Super Admin', 'Admin'] },
      { name: t(lang, navKeys.classes), path: '/classes', icon: BookOpen, roles: ['Super Admin', 'Admin'] },
      { name: t(lang, navKeys.subjects), path: '/subjects', icon: BookOpen, roles: ['Super Admin', 'Admin'] },
      { name: t(lang, navKeys.transport), path: '/transport', icon: Bus, roles: ['Super Admin', 'Admin'] },

      { name: t(lang, navKeys.myClasses), path: '/my-classes', icon: BookOpen, roles: ['Teacher'] },
      { name: t(lang, navKeys.myStudents), path: '/my-students', icon: Users, roles: ['Teacher'] },
      
      { name: t(lang, navKeys.planning), path: '/planning', icon: Calendar, roles: ['Student', 'Parent'] },
      { name: t(lang, navKeys.payments), path: '/payments', icon: CreditCard, roles: ['Super Admin', 'Admin', 'Parent'] },

      { name: t(lang, navKeys.grades), path: '/grades', icon: FileText, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
      { name: t(lang, navKeys.attendance), path: '/attendance', icon: CalendarCheck, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
      { name: t(lang, navKeys.lessons), path: '/content', icon: FileDown, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
      { name: t(lang, navKeys.chat), path: '/chat', icon: MessageSquare, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
      { name: t(lang, navKeys.settings), path: '/settings', icon: Settings, roles: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
    ];
    return items.filter(item => item.roles.includes(user?.role));
  };

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center">
          <School className="text-mauve-400 mr-3" size={28} />
          <span className="text-xl font-bold text-white tracking-wide">EduSaaS</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto space-y-1 px-4">
        {getNavItems().map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
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
          onClick={() => { logout(); if (onClose) onClose(); }}
          className="flex items-center w-full px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-medium"
        >
          <LogOut className="mr-3" size={20} />
          {t(lang, 'logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose}></div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-col h-screen z-50 transform transition-transform duration-300 md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
