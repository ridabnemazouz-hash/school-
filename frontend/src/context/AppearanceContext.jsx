import React, { createContext, useContext, useState, useEffect } from 'react';

const AppearanceContext = createContext();

const defaults = {
  theme: 'light',
  accentColor: 'mauve',
  borderRadius: 'xl',
  fontSize: 'normal',
  density: 'normal',
  sidebarStyle: 'default',
};

const accentColors = {
  mauve: { primary: '#6366f1', primaryLight: '#e0e1ff', primaryDark: '#4f46e5', ring: '#6366f1' },
  blue: { primary: '#2563eb', primaryLight: '#dbeafe', primaryDark: '#1d4ed8', ring: '#2563eb' },
  emerald: { primary: '#059669', primaryLight: '#d1fae5', primaryDark: '#047857', ring: '#059669' },
  rose: { primary: '#e11d48', primaryLight: '#ffe4e6', primaryDark: '#be123c', ring: '#e11d48' },
  amber: { primary: '#d97706', primaryLight: '#fef3c7', primaryDark: '#b45309', ring: '#d97706' },
  cyan: { primary: '#0891b2', primaryLight: '#cffafe', primaryDark: '#0e7490', ring: '#0891b2' },
};

const radiusSizes = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
};

const fontSizeClasses = {
  small: '14px',
  normal: '16px',
  large: '18px',
};

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

  useEffect(() => {
    const root = document.documentElement;
    const colors = accentColors[prefs.accentColor] || accentColors.mauve;

    root.style.setProperty('--accent', colors.primary);
    root.style.setProperty('--accent-light', colors.primaryLight);
    root.style.setProperty('--accent-dark', colors.primaryDark);
    root.style.setProperty('--accent-ring', colors.ring);

    root.style.setProperty('--radius', radiusSizes[prefs.borderRadius] || radiusSizes.xl);
    root.style.setProperty('--font-size', fontSizeClasses[prefs.fontSize] || fontSizeClasses.normal);

    root.classList.remove('light', 'dark');
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [prefs]);

  const update = (key, value) => setPrefs(prev => ({ ...prev, [key]: value }));

  const accentColorList = Object.entries(accentColors).map(([id, c]) => ({ id, label: c.primary, bg: `bg-[${c.primary}]` }));

  return (
    <AppearanceContext.Provider value={{ prefs, update, accentColors: accentColorList, accentColorsMap: accentColors }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be inside AppearanceProvider');
  return ctx;
}
