import { TextStyle } from 'react-native';

export const typography = {
  brand: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  } satisfies TextStyle,
  hero: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
  } satisfies TextStyle,
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  } satisfies TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  } satisfies TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '700',
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
  } satisfies TextStyle,
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
  } satisfies TextStyle,
  bodyBold: {
    fontSize: 16,
    fontWeight: '700',
  } satisfies TextStyle,
  caption: {
    fontSize: 14,
    fontWeight: '400',
  } satisfies TextStyle,
  captionBold: {
    fontSize: 14,
    fontWeight: '600',
  } satisfies TextStyle,
  small: {
    fontSize: 12,
    fontWeight: '400',
  } satisfies TextStyle,
  stamp: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
  } satisfies TextStyle,
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  } satisfies TextStyle,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
  card: 16,
} as const;
