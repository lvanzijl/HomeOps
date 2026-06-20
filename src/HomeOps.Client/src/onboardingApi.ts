import { HomeOpsApiClient } from './api/homeOpsApiClient';

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  hasActiveFamilyMembers: boolean;
  requiresOnboarding: boolean;
}

const client = new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');

export async function loadOnboardingStatus(): Promise<OnboardingStatus> {
  const status = await client.getOnboardingStatus();
  return {
    onboardingCompleted: status.onboardingCompleted ?? false,
    hasActiveFamilyMembers: status.hasActiveFamilyMembers ?? false,
    requiresOnboarding: status.requiresOnboarding ?? true,
  };
}

export async function completeOnboarding(): Promise<OnboardingStatus> {
  const status = await client.completeOnboarding();
  return {
    onboardingCompleted: status.onboardingCompleted ?? true,
    hasActiveFamilyMembers: status.hasActiveFamilyMembers ?? true,
    requiresOnboarding: status.requiresOnboarding ?? false,
  };
}
