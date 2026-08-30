import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  accentLabel: string;
  previewBg: string;
  previewAccent: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'cyber-dark',
    name: 'Cyber Dark (Cosmic)',
    accentLabel: 'Neon Cyan & Violet',
    previewBg: 'bg-[#070913]',
    previewAccent: 'bg-cyan-500',
    description: 'High-contrast midnight obsidian with vibrant cyan logic and ultraviolet glows.'
  },
  {
    id: 'matrix-emerald',
    name: 'Matrix Emerald',
    accentLabel: 'Terminal Green & Mint',
    previewBg: 'bg-[#04080c]',
    previewAccent: 'bg-emerald-500',
    description: 'Cybernetic terminal palette with neon emerald indicators and deep space carbon.'
  },
  {
    id: 'sunset-nebula',
    name: 'Sunset Nebula',
    accentLabel: 'Crimson Rose & Amber',
    previewBg: 'bg-[#0e0716]',
    previewAccent: 'bg-rose-500',
    description: 'Cosmic plum aura with blazing rose and amber highlights for executive vibrancy.'
  },
  {
    id: 'enterprise-light',
    name: 'Enterprise Light',
    accentLabel: 'Sapphire & Quartz',
    previewBg: 'bg-slate-100',
    previewAccent: 'bg-blue-600',
    description: 'Ultra-crisp daytime glassmorphic workspace with sharp contrast and sapphire accents.'
  }
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  currentThemeOption: ThemeOption;
  isLightMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('cyber-dark');

  const applyThemeToDOM = (t: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    const themeClasses = ['theme-cyber-dark', 'theme-matrix-emerald', 'theme-sunset-nebula', 'theme-enterprise-light', 'light', 'dark'];
    
    // Clean up old classes
    themeClasses.forEach(c => {
      root.classList.remove(c);
      if (body) body.classList.remove(c);
    });

    // Add new theme class & attributes
    root.classList.add(`theme-${t}`);
    root.setAttribute('data-theme', t);
    
    if (body) {
      body.classList.add(`theme-${t}`);
      body.setAttribute('data-theme', t);
    }
    
    if (t === 'enterprise-light') {
      root.classList.add('light');
      if (body) body.classList.add('light');
    } else {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
    }
  };

  useEffect(() => {
    const saved = (localStorage.getItem('ardhnarishwar_theme_v2') as ThemeMode) || 'cyber-dark';
    setThemeState(saved);
    applyThemeToDOM(saved);
  }, []);

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    localStorage.setItem('ardhnarishwar_theme_v2', nextTheme);
    applyThemeToDOM(nextTheme);
  };

  const toggleTheme = () => {
    const order: ThemeMode[] = ['cyber-dark', 'matrix-emerald', 'sunset-nebula', 'enterprise-light'];
    const currentIdx = order.indexOf(theme);
    const nextTheme = order[(currentIdx + 1) % order.length];
    setTheme(nextTheme);
  };

  const currentThemeOption = THEME_OPTIONS.find(o => o.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        toggleTheme, 
        currentThemeOption,
        isLightMode: theme === 'enterprise-light'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
