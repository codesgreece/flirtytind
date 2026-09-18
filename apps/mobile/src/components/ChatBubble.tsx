import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/typography';

type Props = {
  body: string;
  outgoing?: boolean;
  status?: string;
};

export function ChatBubble({ body, outgoing, status }: Props) {
  return (
    <View style={[styles.wrap, outgoing ? styles.wrapOut : styles.wrapIn]}>
      <View style={[styles.bubble, outgoing ? styles.out : styles.in]}>
        <Text style={[styles.text, outgoing && styles.textOut]}>{body}</Text>
      </View>
      {outgoing && status ? (
        <View style={styles.receipt}>
          <Text style={styles.receiptText}>
            {status === 'READ' || status === 'DELIVERED' ? 'Sent' : status === 'FAILED' ? 'Failed' : 'Sent'}
          </Text>
          <View style={styles.checkCircle}>
            <Text style={styles.check}>✓✓</Text>
          </View>
        </View>
      ) : null}
    </View>
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
});
