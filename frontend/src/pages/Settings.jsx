import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  User, Lock, Bell, Shield, Palette, Globe, Camera, Check, 
  Sun, Moon, Monitor, Trash2, ShieldCheck, Mail, Phone, 
  ChevronRight, LogOut, Download, Eye, EyeOff, GraduationCap,
  Sparkles, Heart, Star, BookOpen, Clock, Key
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppearance } from '../context/AppearanceContext';
import { useAuth } from '../context/AuthContext';
import { languageFlags, t } from '../i18n/translations';
import { motion, AnimatePresence } from 'framer-motion';

export function Settings() {
  const { lang, setLang } = useLanguage();
  const { prefs, update, accentColorsMap } = useAppearance();
  const { user, updateAvatar, removeAvatar, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+212 600-000000',
    bio: 'Dedicated administrator at EduSaaS Academy.',
  });

  const handleSave = (e) => {
    e?.preventDefault();
    updateProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sidebarItems = [
    { id: 'profile', icon: User, label: t(lang, 'profile'), desc: 'Your identity & info' },
    { id: 'language', icon: Globe, label: t(lang, 'language'), desc: 'Preferred system lang' },
    { id: 'appearance', icon: Palette, label: t(lang, 'appearance'), desc: 'Theme & branding' },
    { id: 'security', icon: Lock, label: t(lang, 'security'), desc: 'Password & protection' },
    { id: 'notifications', icon: Bell, label: t(lang, 'notificationsTab'), desc: 'Alert & email settings' },
    { id: 'privacy', icon: Shield, label: t(lang, 'privacy'), desc: 'Data & account rights' },
  ];

  const profileAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || user?.name || 'User')}&background=6366f1&color=fff&size=200`;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
      
      {/* Premium Header */}
      <div className="mb-12 relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
              {t(lang, 'settings').toUpperCase()}
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 opacity-70">
              System Configuration & Preferences
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 hidden lg:block opacity-10">
          <Sparkles size={120} className="text-indigo-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Glass Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group text-left px-5 py-4 rounded-2xl transition-all relative border overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-600/20' 
                  : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-2.5 rounded-xl transition-colors ${
                  activeTab === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500'
                }`}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold tracking-tight ${activeTab === item.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {item.label}
                  </p>
                  <p className={`text-[10px] font-medium ${activeTab === item.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </p>
                </div>
                <ChevronRight size={16} className={`transition-transform ${activeTab === item.id ? 'text-white translate-x-1' : 'text-slate-200 dark:text-slate-700'}`} />
              </div>
            </button>
          ))}

          <div className="pt-8 px-4">
            <button className="flex items-center gap-3 text-slate-400 hover:text-red-500 transition-colors text-xs font-bold">
              <LogOut size={16} /> {t(lang, 'logout')}
            </button>
          </div>
        </div>

        {/* Content Area - Premium Glass Card */}
        <div className="lg:col-span-8 xl:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 backdrop-blur-xl relative"
            >
              <AnimatePresence>
                {saved && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="absolute top-8 right-8 z-50 bg-emerald-500 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Check size={14} /> Changes Saved!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Section */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSave} className="space-y-12">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                      <div className="w-36 h-36 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
                        <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <button type="button" className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-500 transition-all border-4 border-white dark:border-slate-900">
                        <Camera size={20} />
                      </button>
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{formData.name}</h3>
                      <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest">{user?.role} · School ID: {user?.school_id || '001'}</p>
                      <div className="flex gap-3 mt-5">
                        <button type="button" className="px-5 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all">Change Avatar</button>
                        <button type="button" onClick={removeAvatar} className="px-5 py-2 text-slate-400 hover:text-red-500 text-xs font-bold rounded-xl transition-all">Remove</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputGroup icon={User} label={t(lang, 'fullName')} value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
                    <InputGroup icon={Mail} label={t(lang, 'email')} value={formData.email} onChange={(v) => setFormData({...formData, email: v})} type="email" />
                    <InputGroup icon={Phone} label={t(lang, 'phone')} value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} />
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">About Your Role</label>
                      <div className="relative">
                        <textarea 
                          value={formData.bio}
                          onChange={(e) => setFormData({...formData, bio: e.target.value})}
                          className="w-full h-32 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] px-5 py-4 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all focus:border-indigo-500/50"
                        />
                        <BookOpen size={16} className="absolute right-4 bottom-4 text-slate-200" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-8">
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 py-7 rounded-[1.5rem] text-sm shadow-2xl shadow-indigo-600/30">
                      {t(lang, 'saveChanges')}
                    </Button>
                  </div>
                </form>
              )}

              {/* Language Section */}
              {activeTab === 'language' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {Object.entries(languageFlags).map(([code, flag]) => (
                      <button
                        key={code}
                        onClick={() => setLang(code)}
                        className={`flex items-center gap-6 p-8 rounded-[2rem] border-2 transition-all relative ${
                          lang === code
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 shadow-2xl shadow-indigo-600/5'
                            : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-transparent hover:border-indigo-100 dark:hover:border-indigo-900 shadow-lg shadow-slate-100 dark:shadow-none'
                        }`}
                      >
                        <span className="text-6xl drop-shadow-xl">{flag}</span>
                        <div className="text-left">
                          <p className={`font-black text-xl tracking-tight ${lang === code ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-300'}`}>
                            {code === 'en' ? 'English' : 'Français'}
                          </p>
                          <p className="text-xs text-slate-400 font-bold uppercase mt-1">Localization Code: {code.toUpperCase()}</p>
                        </div>
                        {lang === code && <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white"><Check size={18} /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeTab === 'appearance' && (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Interface Theme</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <ThemeOption icon={Sun} label="Light" active={prefs.theme === 'light'} onClick={() => update('theme', 'light')} />
                      <ThemeOption icon={Moon} label="Dark" active={prefs.theme === 'dark'} onClick={() => update('theme', 'dark')} />
                      <ThemeOption icon={Monitor} label="System" active={prefs.theme === 'system'} onClick={() => update('theme', 'system')} />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Accent Palette</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-slate-800">
                      {Object.entries(accentColorsMap).map(([id, colors]) => (
                        <button
                          key={id}
                          onClick={() => update('accentColor', id)}
                          className={`w-14 h-14 rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 ${
                            prefs.accentColor === id ? 'border-white dark:border-slate-700 scale-110 shadow-2xl' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: colors.primary }}
                          title={id}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* Security Section */}
              {activeTab === 'security' && (
                <div className="space-y-12">
                  <div className="p-8 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] flex items-center gap-8 shadow-sm">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-600/10 shrink-0">
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white">Security Intelligence</h4>
                      <p className="text-sm text-slate-500 font-medium">Your credentials are protected by industry-standard encryption protocols.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Update Access Key</h4>
                      <div className="space-y-4">
                        <InputGroup icon={Lock} label="Current Password" type="password" placeholder="••••••••" />
                        <InputGroup icon={Key} label="New Secure Password" type="password" placeholder="New complexity" />
                        <Button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 mt-2">
                          Revoke & Update
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Session Insights</h4>
                      <div className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Auto-Logout</span>
                          </div>
                          <span className="text-xs font-black text-indigo-600">30 Mins</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Shield size={16} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">2FA Status</span>
                          </div>
                          <span className="text-xs font-black text-red-500">Not Active</span>
                        </div>
                        <Button variant="ghost" className="w-full text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 transition-all rounded-xl text-xs font-black uppercase tracking-widest py-3">Configure 2FA</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Communication Preferences</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <PremiumToggle label="Direct Messages" desc="Receive notifications when students or teachers message you." defaultChecked={true} />
                    <PremiumToggle label="Attendance Alerts" desc="Daily summary of student absenteeism." defaultChecked={true} />
                    <PremiumToggle label="Event Reminders" desc="Stay updated with school calendar events." defaultChecked={true} />
                    <PremiumToggle label="Marketing Insight" desc="Tips on how to use EduSaaS more efficiently." defaultChecked={false} />
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeTab === 'privacy' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] hover:shadow-xl transition-all group">
                      <div className="p-4 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl w-fit mb-6 shadow-sm group-hover:text-indigo-600 transition-all">
                        <Download size={24} />
                      </div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2">Academic Data Export</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">Download a comprehensive archive of your academic records and settings.</p>
                      <Button variant="ghost" className="mt-6 text-indigo-600 p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">Initiate Download <ChevronRight size={14} /></Button>
                    </div>
                    <div className="p-8 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-[2.5rem] hover:shadow-xl transition-all group">
                      <div className="p-4 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl w-fit mb-6 shadow-sm group-hover:text-red-500 transition-all">
                        <Trash2 size={24} />
                      </div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2">Account Deletion</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">Permanently remove your identity and school data from the EduSaaS ecosystem.</p>
                      <Button variant="ghost" className="mt-6 text-red-500 p-0 hover:bg-transparent font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">Request Termination <ChevronRight size={14} /></Button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = 'text', placeholder, icon: Icon }) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
          {Icon && <Icon size={18} />}
        </div>
        <input 
          type={type} 
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 rounded-[1.2rem] pl-12 pr-5 py-4 text-sm text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all focus:border-indigo-500/50"
        />
      </div>
    </div>
  );
}

function ThemeOption({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-4 p-8 rounded-[2rem] border-2 transition-all ${
        active
        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 shadow-2xl shadow-indigo-600/5'
        : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-transparent text-slate-400 hover:border-indigo-100 dark:hover:border-indigo-900 shadow-lg shadow-slate-100 dark:shadow-none'
      }`}
    >
      <div className={`p-4 rounded-2xl ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-black uppercase tracking-[0.2em]">{label}</span>
      {active && <div className="h-1 w-6 bg-indigo-600 rounded-full mt-1" />}
    </button>
  );
}

function PremiumToggle({ label, desc, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
      <div className="flex-1 pr-8">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-[11px] text-slate-400 font-medium mt-1">{desc}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={`w-14 h-7 rounded-full transition-all relative ${checked ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-slate-200 dark:bg-slate-800'}`}
      >
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-8' : 'left-1'}`} />
      </button>
    </div>
  );
}
