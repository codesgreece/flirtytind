import { create } from 'zustand';
import type { LookingFor, Gender, ShowMe } from '@flirty/shared';

type OnboardingDraft = {
  firstName?: string;
  birthDate?: string;
  gender?: Gender;
  showGenderOnProfile?: boolean;
  orientations?: string[];
  showOrientationOnProfile?: boolean;
  showMe?: ShowMe;
  lookingFor?: LookingFor;
  drinking?: string;
  smoking?: string;
  workout?: string;
  pets?: string;
  interestLabels?: string[];
  photoUris?: string[];
};

type UiState = {
  onboarding: OnboardingDraft;
  showDiscoverTutorial: boolean;
  lastSwipeId: string | null;
  setOnboarding: (patch: Partial<OnboardingDraft>) => void;
  resetOnboarding: () => void;
  setShowDiscoverTutorial: (v: boolean) => void;
  setLastSwipeId: (id: string | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  onboarding: {},
  showDiscoverTutorial: true,
  lastSwipeId: null,
  setOnboarding: (patch) =>
    set((s) => ({ onboarding: { ...s.onboarding, ...patch } })),
  resetOnboarding: () => set({ onboarding: {} }),
  setShowDiscoverTutorial: (v) => set({ showDiscoverTutorial: v }),
  setLastSwipeId: (id) => set({ lastSwipeId: id }),
}));
