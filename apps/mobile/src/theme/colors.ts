export const colors = {
  brandOrange: '#FF8E5E',
  brandCoral: '#FF7854',
  brandMagenta: '#FD297B',
  brandPink: '#FF4458',
  brandPurple: '#A020F0',

  gradientStart: '#FF8E5E',
  gradientMid: '#FF5864',
  gradientEnd: '#FD297B',
  progressGradient: ['#FF8E5E', '#FD297B', '#A020F0'] as const,
  brandGradient: ['#FF8E5E', '#FD297B'] as const,

  white: '#FFFFFF',
  black: '#000000',
  charcoal: '#121212',
  charcoalAlt: '#1A1A1A',

  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textMuted: '#A0A0A0',
  textPlaceholder: '#C0C0C0',

  bg: '#FFFFFF',
  bgLavender: '#F0F2FF',
  bgLavenderAlt: '#F3F4FB',
  bgGray: '#F5F5F5',
  bgSlot: '#F0F0F0',
  track: '#E8E8E8',
  border: '#E5E5E5',
  divider: '#EEEEEE',

  disabledBg: '#E8E8E8',
  disabledText: '#9E9E9E',

  linkBlue: '#007AFF',
  bubbleBlue: '#0084FF',
  outgoingBubble: '#0084FF',

  nope: '#FD297B',
  like: '#2EE66B',
  likeAlt: '#40E07A',
  superLike: '#1A9FFF',
  rewind: '#F5C518',
  boost: '#A855F7',

  nearby: '#2DD4BF',
  active: '#22C55E',

  report: '#D2363F',
  sliderOn: '#FD297B',
  toggleOn: '#FD297B',

  tabInactive: '#ADADAD',
  tabActive: '#FF4458',
} as const;

export type ColorToken = keyof typeof colors;
