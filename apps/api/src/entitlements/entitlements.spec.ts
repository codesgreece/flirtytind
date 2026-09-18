import { PLAN_ENTITLEMENTS, PlanCode } from '@flirty/shared';

describe('Plan entitlements table', () => {
  it('defines Free limits', () => {
    expect(PLAN_ENTITLEMENTS[PlanCode.FREE].likesPerDay).toBe(50);
    expect(PLAN_ENTITLEMENTS[PlanCode.FREE].superLikesPerWeek).toBe(1);
    expect(PLAN_ENTITLEMENTS[PlanCode.FREE].dmsPerDay).toBe(1);
    expect(PLAN_ENTITLEMENTS[PlanCode.FREE].seeWhoLikesYou).toBe(false);
  });

  it('defines Plus passport/incognito', () => {
    expect(PLAN_ENTITLEMENTS[PlanCode.PLUS].likesPerDay).toBeNull();
    expect(PLAN_ENTITLEMENTS[PlanCode.PLUS].passport).toBe(true);
    expect(PLAN_ENTITLEMENTS[PlanCode.PLUS].incognito).toBe(true);
  });

  it('defines Gold who-likes-you and top picks', () => {
    expect(PLAN_ENTITLEMENTS[PlanCode.GOLD].seeWhoLikesYou).toBe(true);
    expect(PLAN_ENTITLEMENTS[PlanCode.GOLD].topPicks).toBe(true);
    expect(PLAN_ENTITLEMENTS[PlanCode.GOLD].boostsPerMonth).toBe(1);
  });

  it('defines Platinum unlimited DMs and priority', () => {
    expect(PLAN_ENTITLEMENTS[PlanCode.PLATINUM].dmsPerDay).toBeNull();
    expect(PLAN_ENTITLEMENTS[PlanCode.PLATINUM].priorityVisibility).toBe(true);
    expect(PLAN_ENTITLEMENTS[PlanCode.PLATINUM].messageBeforeMatch).toBe(true);
    expect(PLAN_ENTITLEMENTS[PlanCode.PLATINUM].boostsPerMonth).toBe(2);
  });
});
