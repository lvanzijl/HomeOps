import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

    expect(screen.getByLabelText('First Run Wizard')).not.toBeNull();
    expect(screen.getByText('Welcome to HomeOps')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Start setup' }));

    expect(screen.getByText('Add Adults')).not.toBeNull();
    await user.type(screen.getByLabelText('Name'), 'Alex');
    await user.click(screen.getByRole('button', { name: 'Add adult' }));
    expect(await screen.findByText('Alex')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Add Children')).not.toBeNull();
    await user.type(screen.getByLabelText('Name'), 'Riley');
    await user.type(screen.getByLabelText('Date of birth'), '2018-04-12');
    await user.click(screen.getByRole('button', { name: 'Add child' }));
    expect(await screen.findByText('Riley')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Review household' }));

    const review = screen.getByLabelText('Review Household');
    expect(within(review).getByText('Adults')).not.toBeNull();
    expect(within(review).getByText('Children')).not.toBeNull();
    expect(within(review).queryByText(/Goals|Tasks|Rewards|Motivation/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Finish and open Home' }));

    const onboarding = await onboardingApi();
    expect(onboarding.completeOnboarding).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('shows onboarding for first-run households and bypasses existing completed households', async () => {
    const onboarding = await onboardingApi();
    render(<WorkspaceShell />);
    expect(await screen.findByLabelText('First Run Wizard')).not.toBeNull();
    cleanup();

    vi.mocked(onboarding.loadOnboardingStatus).mockResolvedValue({ onboardingCompleted: true, hasActiveFamilyMembers: true, requiresOnboarding: false });
    render(<WorkspaceShell />);
    await waitFor(() => expect(screen.queryByLabelText('First Run Wizard')).toBeNull());
    expect(await screen.findByLabelText('Home dashboard')).not.toBeNull();
  });
});
