import { ReactNode } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { useResponsive } from './useResponsive';
import { colors } from '../theme/colors';

type Props = {
  children: ReactNode;
  /** Full-bleed background (gradients) — skip phone frame chrome */
  fullBleed?: boolean;
  scroll?: boolean;
  backgroundColor?: string;
};

/**
 * Centers the mobile UI in a phone-width column on tablet/desktop web
 * while keeping native full-width on iOS/Android.
 */
export function ResponsiveShell({
  children,
  fullBleed = false,
  scroll = false,
  backgroundColor = colors.bg,
}: Props) {
  const { isWeb, isTablet, contentMaxWidth } = useResponsive();

  if (!isWeb || fullBleed) {
    return <View style={[styles.fill, { backgroundColor }]}>{children}</View>;
  }

  const frame = (
    <View
      style={[
        styles.frame,
        {
          maxWidth: contentMaxWidth,
          backgroundColor,
          ...(isTablet
            ? {
                borderLeftWidth: StyleSheet.hairlineWidth,
                borderRightWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                minHeight: '100%' as unknown as number,
              }
            : null),
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.outer, { backgroundColor: isTablet ? colors.bgLavenderAlt : backgroundColor }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {frame}
        </ScrollView>
      ) : (
        frame
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  outer: {
    flex: 1,
    width: '100%' as unknown as number,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  frame: {
    flex: 1,
    width: '100%' as unknown as number,
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
});
