import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultAvatarSelection } from './avatarCatalog/avatarCatalogAdapter';
import { FirstRunWizard } from './FirstRunWizard';
import { WorkspaceShell } from './workspaces/WorkspaceShell';

vi.mock('./home/familyMembersApi', () => ({
  createFamilyMember: vi.fn(),
  loadFamilyMembers: vi.fn(),
  removeFamilyMember: vi.fn(),
  saveFamilyMember: vi.fn(),
}));
vi.mock('./onboardingApi', () => ({
  completeOnboarding: vi.fn(),
  loadOnboardingStatus: vi.fn(),
}));
vi.mock('./workspaces/workspaceLayout', () => ({ loadWorkspaceLayout: vi.fn(async () => ({ source: 'fallback', widgetInstances: [] })) }));
vi.mock('./home/HomeDashboard', () => ({ HomeDashboard: () => <section aria-label="Home dashboard">Home opened</section> }));

async function familyApi() { return await import('./home/familyMembersApi'); }
async function onboardingApi() { return await import('./onboardingApi'); }

afterEach(() => cleanup());

describe('FirstRunWizard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const family = await familyApi();
    vi.mocked(family.createFamilyMember).mockImplementation(async (member) => ({ ...member, id: member.name.toLowerCase() }));
    vi.mocked(family.loadFamilyMembers).mockResolvedValue([]);
    const onboarding = await onboardingApi();
    vi.mocked(onboarding.completeOnboarding).mockResolvedValue({ onboardingCompleted: true, hasActiveFamilyMembers: true, requiresOnboarding: false });
    vi.mocked(onboarding.loadOnboardingStatus).mockResolvedValue({ onboardingCompleted: false, hasActiveFamilyMembers: false, requiresOnboarding: true });
  });

  it('walks through welcome, add adult, add child, review, and completion', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<FirstRunWizard initialMembers={[]} onComplete={onComplete} />);

    expect(screen.getByLabelText('Eerste installatie')).not.toBeNull();
    expect(screen.getByText('Welkom bij FamilyBoard')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Installatie starten' }));

    expect(screen.getByText('Volwassenen toevoegen')).not.toBeNull();
    await user.type(screen.getByLabelText('Naam'), 'Alex');
    await user.click(screen.getByRole('button', { name: 'Volwassene toevoegen' }));
    expect(await screen.findByText('Alex')).not.toBeNull();
    const family = await familyApi();
    expect(vi.mocked(family.createFamilyMember).mock.calls[0][0].avatarSelection).toEqual(defaultAvatarSelection);
    await user.click(screen.getByRole('button', { name: 'Doorgaan' }));

    expect(screen.getByText('Kinderen toevoegen')).not.toBeNull();
    await user.type(screen.getByLabelText('Naam'), 'Riley');
    await user.type(screen.getByLabelText('Geboortedatum'), '2018-04-12');
    await user.click(screen.getByRole('button', { name: 'Kind toevoegen' }));
    expect(await screen.findByText('Riley')).not.toBeNull();
    expect(vi.mocked(family.createFamilyMember).mock.calls[1][0].avatarSelection).toEqual(defaultAvatarSelection);
    await user.click(screen.getByRole('button', { name: 'Gezin controleren' }));

    const review = screen.getByLabelText('Gezin controleren');
    expect(within(review).getByText('Volwassenen')).not.toBeNull();
    expect(within(review).getByText('Kinderen')).not.toBeNull();
    expect(within(review).queryByText(/Goals|Tasks|Rewards|Motivation/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Doorgaan' }));
    await user.click(screen.getByRole('button', { name: 'Afronden en Thuis openen' }));

    const onboarding = await onboardingApi();
    expect(onboarding.completeOnboarding).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('shows onboarding for first-run households and bypasses existing completed households', async () => {
    const onboarding = await onboardingApi();
    render(<WorkspaceShell />);
    expect(await screen.findByLabelText('Eerste installatie')).not.toBeNull();
    cleanup();

    vi.mocked(onboarding.loadOnboardingStatus).mockResolvedValue({ onboardingCompleted: true, hasActiveFamilyMembers: true, requiresOnboarding: false });
    render(<WorkspaceShell />);
    await waitFor(() => expect(screen.queryByLabelText('Eerste installatie')).toBeNull());
    expect(await screen.findByLabelText('Home dashboard')).not.toBeNull();
  });
});
