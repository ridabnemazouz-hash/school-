import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Lock, Bell, Shield, Palette, Globe, Mail, Phone, Camera, Check, Sun, Moon, Monitor, Type, Layout, Columns, CornerDownLeft, Eye, EyeOff, Download, Trash2, ShieldCheck, LockIcon, UserX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppearance } from '../context/AppearanceContext';
import { useAuth } from '../context/AuthContext';
import { languageFlags, t } from '../i18n/translations';

export function Settings() {
  const { lang, setLang } = useLanguage();
  const { prefs, update, accentColorsMap } = useAppearance();
  const { user, updateAvatar, removeAvatar, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });
  const [saved, setSaved] = useState(false);

  const handleAppearanceSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sidebarItems = [
    { id: 'profile', icon: User, label: t(lang, 'profile') },
    { id: 'language', icon: Globe, label: t(lang, 'language') },
    { id: 'appearance', icon: Palette, label: t(lang, 'appearance') },
    { id: 'security', icon: Lock, label: t(lang, 'security') },
    { id: 'notifications', icon: Bell, label: t(lang, 'notificationsTab') },
    { id: 'privacy', icon: Shield, label: t(lang, 'privacy') },
  ];

  const themeOptions = [
    { id: 'light', icon: Sun, label: lang === 'fr' ? 'Clair' : 'Light' },
    { id: 'dark', icon: Moon, label: lang === 'fr' ? 'Sombre' : 'Dark' },
    { id: 'system', icon: Monitor, label: lang === 'fr' ? 'Système' : 'System' },
  ];

  const radiusOptions = [
    { id: 'none', label: '0px' },
    { id: 'sm', label: '4px' },
    { id: 'md', label: '8px' },
    { id: 'lg', label: '12px' },
    { id: 'xl', label: '16px' },
    { id: '2xl', label: '24px' },
  ];

  const fontSizeOptions = [
    { id: 'small', label: lang === 'fr' ? 'Petit' : 'Small' },
    { id: 'normal', label: lang === 'fr' ? 'Normal' : 'Normal' },
    { id: 'large', label: lang === 'fr' ? 'Grand' : 'Large' },
  ];

  const densityOptions = [
    { id: 'compact', label: lang === 'fr' ? 'Compact' : 'Compact', desc: lang === 'fr' ? 'Plus de contenu' : 'More content' },
    { id: 'normal', label: lang === 'fr' ? 'Normal' : 'Normal', desc: lang === 'fr' ? 'Équilibré' : 'Balanced' },
    { id: 'comfortable', label: lang === 'fr' ? 'Confortable' : 'Comfortable', desc: lang === 'fr' ? 'Plus d\'espace' : 'More space' },
  ];

  const sidebarStyles = [
    { id: 'default', label: lang === 'fr' ? 'Défaut' : 'Default' },
    { id: 'collapsed', label: lang === 'fr' ? 'Réduit' : 'Collapsed' },
    { id: 'floating', label: lang === 'fr' ? 'Flottant' : 'Floating' },
  ];

  const radiusMap = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl' };

  const profileAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || user?.name || 'User')}&background=6366f1&color=fff&size=200`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t(lang, 'settings')}</h1>
        <p className="text-slate-500 mt-1">{t(lang, 'accountsDesc')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="w-full lg:w-72 h-fit p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-mauve-50 text-mauve-700' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </Card>

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">{t(lang, 'profile')}</h3>
              
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div>
                  <div className="relative group w-28 h-28">
                    <img src={profileAvatar} alt="Profile" className="w-28 h-28 rounded-2xl object-cover border-2 border-slate-200" />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera size={20} className="text-white" />
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <label className="text-xs text-mauve-600 hover:text-mauve-700 font-medium cursor-pointer">
                      {lang === 'fr' ? 'Changer' : 'Change'}
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                    {user?.avatar && (
                      <button onClick={removeAvatar} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                        <Trash2 size={12} /> {lang === 'fr' ? 'Supprimer' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG max 5MB</p>
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'fullName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'phone')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button variant="ghost" className="text-slate-500" onClick={() => setFormData({ name: user?.name || '', email: user?.email || '', phone: '' })}>Cancel</Button>
                <Button onClick={() => { updateProfile(formData); handleAppearanceSave(); }}>{t(lang, 'saveChanges')}</Button>
              </div>
            </Card>
          )}

          {activeTab === 'language' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{t(lang, 'language')}</h3>
              <p className="text-sm text-slate-500 mb-6">{t(lang, 'profileDesc')}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(languageFlags).map(([code, flag]) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      lang === code
                        ? 'border-mauve-500 bg-mauve-50 shadow-md shadow-mauve-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-3xl">{flag}</span>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${lang === code ? 'text-mauve-700' : 'text-slate-800'}`}>
                        {code === 'en' ? 'English' : 'Français'}
                      </p>
                      <p className="text-xs text-slate-400">{code.toUpperCase()}</p>
                    </div>
                    {lang === code && (
                      <div className="w-6 h-6 rounded-full bg-mauve-500 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700">
                  {lang === 'fr' && 'La langue a été changée avec succès ! L\'interface se met à jour immédiatement.'}
                  {lang === 'en' && 'Language changed successfully! The interface will update immediately.'}
                </p>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {saved && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-semibold flex items-center gap-2">
                  <Check size={16} />
                  {lang === 'fr' ? 'Préférences sauvegardées!' : 'Preferences saved!'}
                </div>
              )}

              {/* Theme */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sun size={20} className="text-mauve-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{lang === 'fr' ? 'Thème' : 'Theme'}</h3>
                    <p className="text-sm text-slate-500">{lang === 'fr' ? 'Choisissez l\'apparence globale' : 'Choose the overall look'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { update('theme', opt.id); handleAppearanceSave(); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        prefs.theme === opt.id
                          ? 'border-mauve-500 bg-mauve-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <opt.icon size={24} className={prefs.theme === opt.id ? 'text-mauve-600' : 'text-slate-400'} />
                      <span className={`text-sm font-semibold ${prefs.theme === opt.id ? 'text-mauve-700' : 'text-slate-600'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Accent Color */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Palette size={20} className="text-mauve-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{lang === 'fr' ? 'Couleur d\'accent' : 'Accent Color'}</h3>
                    <p className="text-sm text-slate-500">{lang === 'fr' ? 'Couleur principale de l\'interface' : 'Primary interface color'}</p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(accentColorsMap).map(([id, c]) => (
                    <button
                      key={id}
                      onClick={() => { update('accentColor', id); handleAppearanceSave(); }}
                      className={`relative w-12 h-12 rounded-xl transition-all hover:scale-105 ${
                        prefs.accentColor === id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.primary }}
                    >
                      {prefs.accentColor === id && (
                        <Check size={16} className="absolute inset-0 m-auto text-white" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <span className="text-sm font-medium text-slate-600 capitalize">{prefs.accentColor}</span>
                </div>
              </Card>

              {/* Border Radius */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CornerDownLeft size={20} className="text-mauve-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{lang === 'fr' ? 'Arrondis' : 'Border Radius'}</h3>
                    <p className="text-sm text-slate-500">{lang === 'fr' ? 'Arrondi des éléments' : 'Rounded corners for elements'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {radiusOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { update('borderRadius', opt.id); handleAppearanceSave(); }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        prefs.borderRadius === opt.id
                          ? 'border-mauve-500 bg-mauve-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 ${radiusMap[opt.id]} bg-mauve-500/20 border-2 border-mauve-500`}></div>
                      <span className="text-[10px] font-semibold text-slate-500">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Font Size */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Type size={20} className="text-mauve-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{lang === 'fr' ? 'Taille de police' : 'Font Size'}</h3>
                    <p className="text-sm text-slate-500">{lang === 'fr' ? 'Taille du texte dans l\'interface' : 'Text size across the interface'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {fontSizeOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { update('fontSize', opt.id); handleAppearanceSave(); }}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        prefs.fontSize === opt.id
                          ? 'border-mauve-500 bg-mauve-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`font-semibold ${
                        opt.id === 'small' ? 'text-sm' : opt.id === 'large' ? 'text-xl' : 'text-base'
                      } ${prefs.fontSize === opt.id ? 'text-mauve-700' : 'text-slate-600'}`}>
                        Aa
                      </span>
                      <span className={`text-sm ${prefs.fontSize === opt.id ? 'text-mauve-700 font-bold' : 'text-slate-500'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Density */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Layout size={20} className="text-mauve-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{lang === 'fr' ? 'Densité' : 'Density'}</h3>
                    <p className="text-sm text-slate-500">{lang === 'fr' ? 'Espacement entre les éléments' : 'Spacing between elements'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {densityOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { update('density', opt.id); handleAppearanceSave(); }}
                      className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                        prefs.density === opt.id
                          ? 'border-mauve-500 bg-mauve-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className={`h-2 ${radiusMap['sm']} ${prefs.density === opt.id ? 'bg-mauve-400' : 'bg-slate-300'}`}></div>
                        <div className={`h-2 ${radiusMap['sm']} ${prefs.density === opt.id ? 'bg-mauve-400' : 'bg-slate-300'} w-3/4`}></div>
                      </div>
                      <span className={`text-sm font-semibold mt-1 ${prefs.density === opt.id ? 'text-mauve-700' : 'text-slate-600'}`}>{opt.label}</span>
                      <span className="text-[10px] text-slate-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Sidebar Style */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Columns size={20} className="text-mauve-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{lang === 'fr' ? 'Style du panneau latéral' : 'Sidebar Style'}</h3>
                    <p className="text-sm text-slate-500">{lang === 'fr' ? 'Apparence du menu latéral' : 'Appearance of the side menu'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {sidebarStyles.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { update('sidebarStyle', opt.id); handleAppearanceSave(); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        prefs.sidebarStyle === opt.id
                          ? 'border-mauve-500 bg-mauve-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`flex gap-1 ${
                        opt.id === 'collapsed' ? 'w-12' : opt.id === 'floating' ? 'w-10' : 'w-16'
                      } h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200`}>
                        <div className={`bg-mauve-200 ${
                          opt.id === 'collapsed' ? 'w-3' : opt.id === 'floating' ? 'w-2 mx-auto' : 'w-5'
                        } h-full`}></div>
                        <div className="flex-1 flex flex-col gap-1 p-1">
                          <div className="h-1 bg-slate-300 rounded"></div>
                          <div className="h-1 bg-slate-300 rounded w-2/3"></div>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${prefs.sidebarStyle === opt.id ? 'text-mauve-700' : 'text-slate-600'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Reset */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    update('theme', 'light');
                    update('accentColor', 'mauve');
                    update('borderRadius', 'xl');
                    update('fontSize', 'normal');
                    update('density', 'normal');
                    update('sidebarStyle', 'default');
                    handleAppearanceSave();
                  }}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium"
                >
                  {lang === 'fr' ? 'Réinitialiser les préférences' : 'Reset to defaults'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">{t(lang, 'security')}</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'currentPassword')}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'newPassword')}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(lang, 'confirmPassword')}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20" />
                </div>
                <div className="pt-4">
                   <Button className="bg-slate-800 hover:bg-slate-900 w-full">{t(lang, 'changePassword')}</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{t(lang, 'notificationsTab')}</h3>
              <p className="text-sm text-slate-500 mb-6">{lang === 'fr' ? 'Choisissez les notifications que vous souhaitez recevoir.' : 'Choose which notifications you want to receive.'}</p>
              
              <div className="space-y-4">
                {[
                  { label: lang === 'fr' ? 'Nouvelles inscriptions' : 'New registrations', desc: lang === 'fr' ? 'Quand un utilisateur s\'inscrit' : 'When a user registers', defaultOn: true },
                  { label: lang === 'fr' ? 'Messages' : 'Messages', desc: lang === 'fr' ? 'Nouveaux messages reçus' : 'New messages received', defaultOn: true },
                  { label: lang === 'fr' ? 'Notes & Bulletins' : 'Grades & Reports', desc: lang === 'fr' ? 'Mise à jour des notes' : 'Grade updates', defaultOn: false },
                  { label: lang === 'fr' ? 'Présence' : 'Attendance', desc: lang === 'fr' ? 'Alertes d\'absence' : 'Absence alerts', defaultOn: false },
                  { label: lang === 'fr' ? 'Paiements' : 'Payments', desc: lang === 'fr' ? 'Notifications de paiement' : 'Payment notifications', defaultOn: true },
                ].map((item, i) => (
                  <NotificationToggle key={i} label={item.label} desc={item.desc} defaultOn={item.defaultOn} />
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{t(lang, 'privacy')}</h3>
              <p className="text-sm text-slate-500 mb-6">{lang === 'fr' ? 'Gérez vos paramètres de confidentialité.' : 'Manage your privacy settings.'}</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-green-600" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{lang === 'fr' ? 'Profil public' : 'Public Profile'}</p>
                      <p className="text-xs text-slate-500">{lang === 'fr' ? 'Les autres utilisateurs peuvent voir votre profil' : 'Other users can see your profile'}</p>
                    </div>
                  </div>
                  <ToggleSwitch />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Eye className="text-blue-600" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{lang === 'fr' ? 'Statut en ligne' : 'Online Status'}</p>
                      <p className="text-xs text-slate-500">{lang === 'fr' ? 'Afficher quand vous êtes connecté' : 'Show when you are online'}</p>
                    </div>
                  </div>
                  <ToggleSwitch />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <EyeOff className="text-purple-600" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{lang === 'fr' ? 'Cacher mon email' : 'Hide My Email'}</p>
                      <p className="text-xs text-slate-500">{lang === 'fr' ? 'Personne ne peut voir votre adresse email' : 'No one can see your email address'}</p>
                    </div>
                  </div>
                  <ToggleSwitch defaultOn />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <UserX className="text-orange-600" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{lang === 'fr' ? 'Bloquer les messages' : 'Block Messages'}</p>
                      <p className="text-xs text-slate-500">{lang === 'fr' ? 'Empêcher les messages non sollicités' : 'Prevent unsolicited messages'}</p>
                    </div>
                  </div>
                  <ToggleSwitch />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Download className="text-teal-600" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{lang === 'fr' ? 'Télécharger mes données' : 'Download My Data'}</p>
                      <p className="text-xs text-slate-500">{lang === 'fr' ? 'Exporter toutes vos données personnelles' : 'Export all your personal data'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-xs">{lang === 'fr' ? 'Exporter' : 'Export'}</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-mauve-500' : 'bg-slate-300'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function NotificationToggle({ label, desc, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-mauve-500' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
