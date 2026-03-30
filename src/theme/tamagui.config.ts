import { createTamagui, createTokens } from '@tamagui/core';
import { config as defaultConfig } from '@tamagui/config';

const tokens = createTokens({
  ...defaultConfig.tokens,
  color: {
    ...defaultConfig.tokens.color,
    cream: '#F5F0E8',
    creamCard: '#FAFAF7',
    green: '#4CAF73',
    greenDark: '#3D8F5A',
    brown: '#3D2B1F',
    brownLight: '#6B5E57',
    brownMuted: '#8A8A8A',
    red: '#E55E4D',
    amber: '#F5A623',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    true: 16,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    true: 12,
  },
  size: {
    ...defaultConfig.tokens.size,
  },
  zIndex: {
    ...defaultConfig.tokens.zIndex,
  },
});

const pantryTheme = {
  background: '#F5F0E8',
  backgroundCard: '#FAFAF7',
  color: '#3D2B1F',
  colorSecondary: '#6B5E57',
  borderColor: 'rgba(61,43,31,0.1)',
  shadowColor: 'rgba(61,43,31,0.08)',
  primary: '#4CAF73',
  primaryPress: '#3D8F5A',
  danger: '#E55E4D',
  warning: '#F5A623',
  muted: '#8A8A8A',
};

const tamaguiConfig = createTamagui({
  fonts: defaultConfig.fonts,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      ...pantryTheme,
    },
    pantry: pantryTheme,
  },
  tokens,
  media: defaultConfig.media,
  shorthands: defaultConfig.shorthands,
  settings: {
    ...defaultConfig.settings,
    fastSchemeChange: true,
  },
});

export default tamaguiConfig;
