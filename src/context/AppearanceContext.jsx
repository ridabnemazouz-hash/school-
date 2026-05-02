import React, { createContext, useContext, useState, useEffect } from 'react';

const AppearanceContext = createContext();

const defaults = {
  theme: 'light',
  accentColor: 'mauve',
  borderRadius: 'xl',
  fontSize: 'normal',
  density: 'normal',
  sidebarStyle: 'default',
  cardStyle: 'elevated',
};

const radiusMap = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

const fontSizeMap = {
  small: 'text-sm',
  normal: 'text-base',
  large: 'text-lg',
};

const densityMap = {
  compact: { padding: 'p-2', gap: 'gap-2', spacing: 'space-y-3' },
  normal: { padding: 'p-4', gap: 'gap-4', spacing: 'space-y-6' },
  comfortable: { padding: 'p-6', gap: 'gap-6', spacing: 'space-y-8' },
};

const accentColors = [
  { id: 'mauve', label: 'Mauve', bg: 'bg-[#6366f1]' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-600' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-600' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-600' },
];

export function AppearanceProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('appearance');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('appearance', JSON.stringify(prefs));
  }, [prefs]);

  const update = (key, value) => setPrefs(prev => ({ ...prev, [key]: value }));

  return (
    <AppearanceContext.Provider value={{ prefs, update, accentColors, radiusMap, fontSizeMap, densityMap }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be inside AppearanceProvider');
  return ctx;
}
