export enum PlanCode {
  FREE = 'FREE',
  PLUS = 'PLUS',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum SwipeAction {
  PASS = 'PASS',
  LIKE = 'LIKE',
  SUPER_LIKE = 'SUPER_LIKE',
}

export enum Gender {
  WOMAN = 'WOMAN',
  MAN = 'MAN',
  NON_BINARY = 'NON_BINARY',
  OTHER = 'OTHER',
}

export enum ShowMe {
  WOMEN = 'WOMEN',
  MEN = 'MEN',
  EVERYONE = 'EVERYONE',
}

export enum LookingFor {
  LONG_TERM = 'LONG_TERM',
  LONG_TERM_OPEN = 'LONG_TERM_OPEN',
  SHORT_TERM_OPEN = 'SHORT_TERM_OPEN',
  SHORT_TERM = 'SHORT_TERM',
  FRIENDS = 'FRIENDS',
  FIGURING_OUT = 'FIGURING_OUT',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum ConsumableType {
  SUPER_LIKES_5 = 'SUPER_LIKES_5',
  BOOST_30 = 'BOOST_30',
  FIRST_MESSAGE = 'FIRST_MESSAGE',
  SPOTLIGHT_30 = 'SPOTLIGHT_30',
}

export const PLAN_PRICES_EUR: Record<PlanCode, number> = {
  [PlanCode.FREE]: 0,
  [PlanCode.PLUS]: 7.99,
  [PlanCode.GOLD]: 14.99,
  [PlanCode.PLATINUM]: 24.99,
};

export const CONSUMABLE_PRICES_EUR: Record<ConsumableType, number> = {
  [ConsumableType.SUPER_LIKES_5]: 4.99,
  [ConsumableType.BOOST_30]: 3.99,
  [ConsumableType.FIRST_MESSAGE]: 2.99,
  [ConsumableType.SPOTLIGHT_30]: 4.99,
};

export type PlanEntitlements = {
  likesPerDay: number | null; // null = unlimited
  flirtsUnlimited: boolean;
  rewindsPerDay: number | null;
  superLikesPerWeek: number;
  dmsPerDay: number | null;
  passport: boolean;
  incognito: boolean;
  seeWhoLikesYou: boolean;
  topPicks: boolean;
  boostsPerMonth: number;
  superFlirts: boolean;
  priorityVisibility: boolean;
  messageBeforeMatch: boolean;
};

export const PLAN_ENTITLEMENTS: Record<PlanCode, PlanEntitlements> = {
  [PlanCode.FREE]: {
    likesPerDay: 50,
    flirtsUnlimited: false,
    rewindsPerDay: 1,
    superLikesPerWeek: 1,
    dmsPerDay: 1,
    passport: false,
    incognito: false,
    seeWhoLikesYou: false,
    topPicks: false,
    boostsPerMonth: 0,
    superFlirts: false,
    priorityVisibility: false,
    messageBeforeMatch: false,
  },
  [PlanCode.PLUS]: {
    likesPerDay: null,
    flirtsUnlimited: true,
    rewindsPerDay: null,
    superLikesPerWeek: 5,
    dmsPerDay: 3,
    passport: true,
    incognito: true,
    seeWhoLikesYou: false,
    topPicks: false,
    boostsPerMonth: 0,
    superFlirts: false,
    priorityVisibility: false,
    messageBeforeMatch: false,
  },
  [PlanCode.GOLD]: {
    likesPerDay: null,
    flirtsUnlimited: true,
    rewindsPerDay: null,
    superLikesPerWeek: 10,
    dmsPerDay: 10,
    passport: true,
    incognito: true,
    seeWhoLikesYou: true,
    topPicks: true,
    boostsPerMonth: 1,
    superFlirts: true,
    priorityVisibility: false,
    messageBeforeMatch: false,
  },
  [PlanCode.PLATINUM]: {
    likesPerDay: null,
    flirtsUnlimited: true,
    rewindsPerDay: null,
    superLikesPerWeek: 20,
    dmsPerDay: null,
    passport: true,
    incognito: true,
    seeWhoLikesYou: true,
    topPicks: true,
    boostsPerMonth: 2,
    superFlirts: true,
    priorityVisibility: true,
    messageBeforeMatch: true,
  },
};

export const REALTIME_EVENTS = {
  MATCH_CREATED: 'match.created',
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_READ: 'message.read',
  CONVERSATION_UPDATED: 'conversation.updated',
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  USER_TYPING: 'user.typing',
  LIKE_CREATED: 'like.created',
  SUPERLIKE_CREATED: 'superlike.created',
  NOTIFICATION_CREATED: 'notification.created',
  BOOST_STARTED: 'boost.started',
  BOOST_EXPIRED: 'boost.expired',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export const LOOKING_FOR_LABELS: Record<LookingFor, { emoji: string; label: string }> = {
  [LookingFor.LONG_TERM]: { emoji: '💘', label: 'Long-term partner' },
  [LookingFor.LONG_TERM_OPEN]: { emoji: '😍', label: 'Long-term, open to short' },
  [LookingFor.SHORT_TERM_OPEN]: { emoji: '🥂', label: 'Short-term, open to long' },
  [LookingFor.SHORT_TERM]: { emoji: '🎉', label: 'Short-term fun' },
  [LookingFor.FRIENDS]: { emoji: '👋', label: 'New friends' },
  [LookingFor.FIGURING_OUT]: { emoji: '🤔', label: 'Still figuring it out' },
};

export const DEFAULT_INTERESTS = [
  'German Hip Hop', 'K-Pop', 'Festivals', 'Tattoos', 'Fridays for Future',
  'Self Care', 'Meditation', 'Second-hand apparel', 'Activism', 'Instagram',
  'Photography', 'Shopping', 'Foodie Tour', 'Escape Cafe', 'Sushi',
  'Basketball', 'Snowboarding', 'Skiing', 'CrossFit', 'Muay Thai',
  'Artistic Swimming', 'Beach Volleyball', 'Flag Football', 'Athletics',
  'Rhythmic Gymnastics', 'Karate', 'Softball', 'Diving', 'Trampoline',
  'Taekwondo', 'Handball', 'Judo', 'Lacrosse', 'Water Polo', 'Ice Hockey',
  'Rowing', 'Squash', 'Luge', 'Sports Shooting', 'Walking', 'Sports',
  'Reading', 'Aquarium', 'Hot Springs', 'Exhibition', 'Politics',
  'Self-development', 'Football', 'Road trips',
] as const;
