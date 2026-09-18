import { colors } from './colors';
import { radii, spacing, typography } from './typography';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
} as const;

export { colors, typography, spacing, radii };
