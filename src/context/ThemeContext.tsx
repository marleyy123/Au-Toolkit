import React, { createContext, useContext } from 'react';

export type UiTheme = 'light' | 'dark';

interface ThemeContextType {
  uiTheme: UiTheme;
  isDark: boolean;
  setUiTheme: (theme: UiTheme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  uiTheme: 'light',
  isDark: false,
  setUiTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const getThemeClasses = (isDark: boolean) => ({
  card: `${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border rounded-xl p-4 space-y-3 shadow-xs transition-colors`,
  cardDense: `${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border rounded-xl p-3.5 shadow-xs transition-colors`,
  subCard: `${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'} border rounded-lg p-3 transition-colors`,
  input: `w-full ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'} border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors`,
  inputSm: `w-full ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'} border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors`,
  select: `w-full ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'} border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors`,
  label: `text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'} font-semibold block`,
  subLabel: `text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`,
  heading: `text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-400'}`,
  toggleCard: `flex items-center space-x-2 cursor-pointer ${isDark ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'} border px-3 py-2 rounded-lg font-semibold transition-colors`,
  buttonSecondary: `${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'} border px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors`,
  divider: isDark ? 'border-slate-800' : 'border-slate-200',
});
