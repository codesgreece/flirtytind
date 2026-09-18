import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { radii } from '../theme/typography';

type Props = {
  body: string;
  outgoing?: boolean;
  status?: string;
};

export function ChatBubble({ body, outgoing, status }: Props) {
  const entering = outgoing
    ? FadeInRight.duration(220).springify().damping(18)
    : FadeInLeft.duration(220).springify().damping(18);

  return (
    <Animated.View
      entering={entering}
      style={[styles.wrap, outgoing ? styles.wrapOut : styles.wrapIn]}
    >
      <View style={[styles.bubble, outgoing ? styles.out : styles.in]}>
        <Text style={[styles.text, outgoing && styles.textOut]}>{body}</Text>
      </View>
      {outgoing && status ? (
        <View style={styles.receipt}>
          <Text style={styles.receiptText}>
            {status === 'FAILED' ? 'Failed' : 'Sent'}
          </Text>
          {status !== 'FAILED' ? (
            <View style={styles.checkCircle}>
              <Text style={styles.check}>✓✓</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(-4, { duration: 280 }), withTiming(0, { duration: 280 })),
        -1,
        false,
      ),
    );
  }, [delay, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return <Animated.View style={[styles.dotInner, style]} />;
}

export function TypingIndicator() {
  return (
    <Animated.View entering={FadeInDown.duration(180)} style={[styles.wrap, styles.wrapIn]}>
      <View style={[styles.bubble, styles.in, styles.typingBubble]}>
        <View style={styles.dots}>
          <TypingDot delay={0} />
          <TypingDot delay={160} />
          <TypingDot delay={320} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 4,
    maxWidth: '78%',
  },
  wrapOut: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapIn: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  out: {
    backgroundColor: colors.outgoingBubble,
  },
  in: {
    backgroundColor: colors.bgGray,
  },
  text: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  textOut: {
    color: colors.white,
  },
  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  receiptText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.outgoingBubble,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '700',
  },
  typingBubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 56,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 14,
  },
  dotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
});
