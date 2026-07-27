import { AvatarSelectionDto, CompleteOnboardingRequest, FamilyMemberKind, HomeOpsApiClient, OnboardingMemberRequest } from './api/homeOpsApiClient';
import { normalizeAvatarSelection } from './avatarCatalog/avatarCatalog';
import { avatarV2ConfigurationToAvatarSelection } from './avatarCatalog/avatarCatalogAdapter';
import { avatarV2DefaultConfiguration } from './avatarV2/avatarConfig';
import type { FamilyMember } from './home/familyMembers';

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  hasActiveFamilyMembers: boolean;
  requiresOnboarding: boolean;
  setupChecklist: SetupChecklist | null;
}

export interface SetupChecklist {
  isDismissed: boolean;
  weatherLocationConfigured: boolean;
  firstListConfigured: boolean;
  calendarSourceConfigured: boolean;
  homeAssistantConfigured: boolean;
}

const client = new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');

export async function loadOnboardingStatus(): Promise<OnboardingStatus> {
  const status = await client.getOnboardingStatus();
  return {
    onboardingCompleted: status.onboardingCompleted ?? false,
    hasActiveFamilyMembers: status.hasActiveFamilyMembers ?? false,
    requiresOnboarding: status.requiresOnboarding ?? true,
    setupChecklist: status.setupChecklist ? {
      isDismissed: status.setupChecklist.isDismissed ?? false,
      weatherLocationConfigured: status.setupChecklist.weatherLocationConfigured ?? false,
      firstListConfigured: status.setupChecklist.firstListConfigured ?? false,
      calendarSourceConfigured: status.setupChecklist.calendarSourceConfigured ?? false,
      homeAssistantConfigured: status.setupChecklist.homeAssistantConfigured ?? false,
    } : null,
  };
}

export async function dismissSetupChecklist(): Promise<SetupChecklist> {
  const checklist = await client.dismissSetupChecklist();
  return {
    isDismissed: checklist.isDismissed ?? false,
    weatherLocationConfigured: checklist.weatherLocationConfigured ?? false,
    firstListConfigured: checklist.firstListConfigured ?? false,
    calendarSourceConfigured: checklist.calendarSourceConfigured ?? false,
    homeAssistantConfigured: checklist.homeAssistantConfigured ?? false,
  };
}

export async function completeOnboarding(input: { householdName: string; timeZoneId: string; members: readonly Omit<FamilyMember, 'id'>[] }): Promise<OnboardingStatus> {
  const status = await client.completeOnboarding(new CompleteOnboardingRequest({
    householdName: input.householdName,
    timeZoneId: input.timeZoneId,
    members: input.members.map((member) => new OnboardingMemberRequest({
      name: member.name,
      displayColor: member.displayColor,
      initials: member.initials,
      memberKind: member.memberKind === 'adult' ? FamilyMemberKind.Adult : FamilyMemberKind.Child,
      dateOfBirth: member.dateOfBirth ? new Date(`${member.dateOfBirth}T00:00:00`) : undefined,
      avatarSelection: new AvatarSelectionDto(normalizeAvatarSelection(member.avatarSelection ?? avatarV2ConfigurationToAvatarSelection(member.avatarV2Config ?? avatarV2DefaultConfiguration))),
    })),
  }));
  return {
    onboardingCompleted: status.onboardingCompleted ?? true,
    hasActiveFamilyMembers: status.hasActiveFamilyMembers ?? true,
    requiresOnboarding: status.requiresOnboarding ?? false,
    setupChecklist: status.setupChecklist ? {
      isDismissed: status.setupChecklist.isDismissed ?? false,
      weatherLocationConfigured: status.setupChecklist.weatherLocationConfigured ?? false,
      firstListConfigured: status.setupChecklist.firstListConfigured ?? false,
      calendarSourceConfigured: status.setupChecklist.calendarSourceConfigured ?? false,
      homeAssistantConfigured: status.setupChecklist.homeAssistantConfigured ?? false,
    } : null,
  };
}
