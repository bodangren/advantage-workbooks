import { ThemeColors } from './types';

export function getThemeColors(seriesName: string, type?: 'primary' | 'secondary'): ThemeColors {
  const name = seriesName.toLowerCase();
  if (name.includes('origins')) {
    return { primary: '#228b22', secondary: '#8b4513', gradient: 'linear-gradient(135deg, #228b22, #8b4513)' };
  }
  if (name.includes('quest')) {
    return { primary: '#0284c7', secondary: '#eab308', gradient: 'linear-gradient(135deg, #0ea5e9, #eab308)' };
  }
  if (name.includes('adventure')) {
    return { primary: '#4c1d95', secondary: '#475569', gradient: 'linear-gradient(135deg, #4c1d95, #475569)' };
  }
  if (name.includes('hero')) {
    return { primary: '#be123c', secondary: '#b45309', gradient: 'linear-gradient(135deg, #be123c, #b45309)' };
  }
  if (name.includes('legend')) {
    return { primary: '#1e3a8a', secondary: '#ca8a04', gradient: 'linear-gradient(135deg, #1e3a8a, #ca8a04)' };
  }
  // Default fallback
  const fallbackPrimary = type === 'primary' ? '#0284c7' : '#1e40af';
  return { primary: fallbackPrimary, secondary: '#334155', gradient: `linear-gradient(135deg, ${fallbackPrimary}, #334155)` };
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}