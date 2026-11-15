import { AppThemeConfig } from './schema.ts';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  config: AppThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'compose-purple',
    name: 'Material 3 Purple',
    description: 'Paleta oficial de Jetpack Compose y Material You',
    config: {
      primaryColor: '#6750A4',
      secondaryColor: '#625B71',
      tertiaryColor: '#7D5260',
      surfaceColor: '#1D1B20',
      backgroundColor: '#141218',
      textColor: '#E6E1E5',
      isDark: true,
      backgroundType: 'solid',
      buttonShape: 'pill',
      buttonVariant: 'filled',
      fontFamily: 'sans',
    },
  },
  {
    id: 'emerald-dev',
    name: 'Android Emerald',
    description: 'Verde Android nativo con bordes limpios',
    config: {
      primaryColor: '#00875A',
      secondaryColor: '#2E7D32',
      tertiaryColor: '#388E3C',
      surfaceColor: '#13221A',
      backgroundColor: '#0A140F',
      textColor: '#E1EFE6',
      isDark: true,
      backgroundType: 'solid',
      buttonShape: 'rounded',
      buttonVariant: 'filled',
      fontFamily: 'sans',
    },
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    description: 'Tonos azul frío y gris con degradado suave',
    config: {
      primaryColor: '#3B82F6',
      secondaryColor: '#64748B',
      tertiaryColor: '#0284C7',
      surfaceColor: '#131A26',
      backgroundColor: '#0B0F17',
      textColor: '#F1F5F9',
      isDark: true,
      backgroundType: 'gradient',
      buttonShape: 'semi-rounded',
      buttonVariant: 'filled',
      fontFamily: 'sans',
    },
  },
  {
    id: 'obsidian-mono',
    name: 'Obsidian Minimal',
    description: 'Negro OLED puro y geometría precisa',
    config: {
      primaryColor: '#F4F4F5',
      secondaryColor: '#A1A1AA',
      tertiaryColor: '#71717A',
      surfaceColor: '#121215',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      isDark: true,
      backgroundType: 'solid',
      buttonShape: 'sharp',
      buttonVariant: 'filled',
      fontFamily: 'mono',
    },
  },
  {
    id: 'sunset-clay',
    name: 'Sunset Terracotta',
    description: 'Cálido, editorial y sofisticado',
    config: {
      primaryColor: '#E05D38',
      secondaryColor: '#D97706',
      tertiaryColor: '#B45309',
      surfaceColor: '#241613',
      backgroundColor: '#170E0C',
      textColor: '#FFF1EC',
      isDark: true,
      backgroundType: 'gradient',
      buttonShape: 'rounded',
      buttonVariant: 'filled',
      fontFamily: 'serif',
    },
  },
  {
    id: 'light-clean',
    name: 'Light Clean (Día)',
    description: 'Modo claro Material Design de alto contraste',
    config: {
      primaryColor: '#6750A4',
      secondaryColor: '#625B71',
      tertiaryColor: '#7D5260',
      surfaceColor: '#F7F2FA',
      backgroundColor: '#FEF7FF',
      textColor: '#1D1B20',
      isDark: false,
      backgroundType: 'solid',
      buttonShape: 'pill',
      buttonVariant: 'filled',
      fontFamily: 'sans',
    },
  },
];
