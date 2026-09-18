import { z } from 'zod';
import { Gender, LookingFor, ShowMe, SwipeAction, ConsumableType, PlanCode } from '@flirty/shared';

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().min(7).max(20).optional(),
  phoneCountry: z.string().min(1).max(8).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  birthDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gender: z.nativeEnum(Gender).optional(),
  showGenderOnProfile: z.boolean().optional(),
  orientations: z.array(z.string()).max(3).optional(),
  showOrientationOnProfile: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  lookingFor: z.nativeEnum(LookingFor).optional(),
  drinking: z.string().max(64).optional(),
  smoking: z.string().max(64).optional(),
  workout: z.string().max(64).optional(),
  pets: z.string().max(64).optional(),
  education: z.string().max(64).optional(),
  loveStyle: z.string().max(64).optional(),
  zodiac: z.string().max(32).optional(),
  communicationStyle: z.string().max(64).optional(),
  heightCm: z.number().int().min(100).max(250).optional(),
  city: z.string().max(100).optional(),
  interestIds: z.array(z.string().uuid()).max(30).optional(),
});

export const preferencesSchema = z.object({
  showMe: z.nativeEnum(ShowMe).optional(),
  minAge: z.number().int().min(18).max(100).optional(),
  maxAge: z.number().int().min(18).max(100).optional(),
  maxDistanceKm: z.number().int().min(1).max(500).optional(),
  expandDistance: z.boolean().optional(),
  expandAge: z.boolean().optional(),
  minPhotos: z.number().int().min(1).max(6).optional(),
  requireBio: z.boolean().optional(),
  interestIds: z.array(z.string().uuid()).optional(),
  lookingForFilters: z.array(z.nativeEnum(LookingFor)).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  passportCity: z.string().max(100).nullable().optional(),
  passportLat: z.number().min(-90).max(90).nullable().optional(),
  passportLng: z.number().min(-180).max(180).nullable().optional(),
  incognito: z.boolean().optional(),
});

export const swipeSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.nativeEnum(SwipeAction),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  clientMessageId: z.string().uuid().optional(),
});

export const directMessageSchema = z.object({
  targetUserId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  category: z.string().min(1).max(64),
  description: z.string().max(2000).optional(),
});

export const blockSchema = z.object({
  blockedUserId: z.string().uuid(),
});

export const subscribeSchema = z.object({
  planCode: z.nativeEnum(PlanCode),
});

export const purchaseConsumableSchema = z.object({
  type: z.nativeEnum(ConsumableType),
});

export const reorderPhotosSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1).max(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type SwipeInput = z.infer<typeof swipeSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
