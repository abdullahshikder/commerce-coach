type ThemeColor = 'red' | 'blue' | 'green' | 'purple' | 'orange';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
}

const themeColorMap: Record<ThemeColor, ThemeColors> = {
  red: {
    primary: '#e83330',
    primaryHover: '#c82e2c',
    primaryLight: '#fdecec',
    primaryBorder: '#fee2e2',
  },
  blue: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#eff6ff',
    primaryBorder: '#dbeafe',
  },
  green: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryBorder: '#d1fae5',
  },
  purple: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#f5f3ff',
    primaryBorder: '#ede9fe',
  },
  orange: {
    primary: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: '#fff7ed',
    primaryBorder: '#ffedd5',
  },
};

export function getThemeColors(themeColor: string): ThemeColors {
  return themeColorMap[themeColor as ThemeColor] || themeColorMap.red;
}

export function getThemeColor(themeColor: string): string {
  return getThemeColors(themeColor).primary;
}

export function getThemeHoverColor(themeColor: string): string {
  return getThemeColors(themeColor).primaryHover;
}

export function getThemeLightColor(themeColor: string): string {
  return getThemeColors(themeColor).primaryLight;
}

export function getThemeBorderColor(themeColor: string): string {
  return getThemeColors(themeColor).primaryBorder;
}
