import { useWindowDimensions, Platform } from 'react-native';

export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export type BreakpointName = keyof typeof breakpoints;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= breakpoints.tablet;
  const isDesktop = width >= breakpoints.desktop;
  const isWide = width >= breakpoints.wide;

  /** Phone-frame max width when centered on desktop web */
  const contentMaxWidth = isDesktop ? 430 : isTablet ? 520 : width;
  /** Discover card width */
  const cardWidth = Math.min(contentMaxWidth - 32, width - 32);

  return {
    width,
    height,
    isWeb,
    isTablet,
    isDesktop,
    isWide,
    contentMaxWidth,
    cardWidth,
    gutter: isDesktop ? 24 : 16,
  };
}
