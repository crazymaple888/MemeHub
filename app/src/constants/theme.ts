/**
 * MemeHub 设计系统 —— 暗色霓虹画廊
 * 深墨黑背景 + 电光紫/青蓝渐变，让彩色表情包成为视觉主角。
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  // 背景层
  bg: '#0B0D12',
  surface: '#141720',
  surfaceHover: '#1B1F2A',
  line: '#232838',
  // 品牌霓虹
  primary: '#8B5CF6',
  secondary: '#22D3EE',
  favorite: '#FB7185',
  // 文字
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  // 渐变
  gradient: ['#8B5CF6', '#22D3EE'] as [string, string],
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.bg,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.surfaceHover,
    textSecondary: Palette.textSecondary,
    // 扩展
    surface: Palette.surface,
    surfaceHover: Palette.surfaceHover,
    line: Palette.line,
    primary: Palette.primary,
    secondary: Palette.secondary,
    favorite: Palette.favorite,
    textMuted: Palette.textMuted,
    gradient: Palette.gradient,
  },
  dark: {
    text: Palette.text,
    background: Palette.bg,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.surfaceHover,
    textSecondary: Palette.textSecondary,
    // 扩展
    surface: Palette.surface,
    surfaceHover: Palette.surfaceHover,
    line: Palette.line,
    primary: Palette.primary,
    secondary: Palette.secondary,
    favorite: Palette.favorite,
    textMuted: Palette.textMuted,
    gradient: Palette.gradient,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    web: {
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
      boxShadow: '0 6px 16px rgba(0,0,0,0.45)',
    },
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
    },
    android: {
      elevation: 12,
    },
    web: {
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 20,
      boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
    },
  }),
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
