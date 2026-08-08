import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import RegisterView from './RegisterView.vue';

const { apiClient } = vi.hoisted(() => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../api/client', () => ({ apiClient }));

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/registrieren', name: 'register', component: RegisterView },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  });
  router.push('/registrieren');
  return router;
}

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    apiClient.post.mockReset();
  });

  it('registers with the invite code and redirects to login on success', async () => {
    apiClient.post.mockResolvedValueOnce({});
    const router = createTestRouter();
    await router.isReady();

    render(RegisterView, { global: { plugins: [router] } });

    await fireEvent.update(screen.getByLabelText(/^Invite code/), 'BAND-2026');
    await fireEvent.update(screen.getByLabelText(/^Username/), 'anna');
    await fireEvent.update(screen.getByLabelText(/^Password/), 'secret123');
    await fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      inviteCode: 'BAND-2026',
      username: 'anna',
      password: 'secret123',
    });
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/login'));
  });

  it('shows an error message when registration fails', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('invite_code_invalid'));
    const router = createTestRouter();
    await router.isReady();

    render(RegisterView, { global: { plugins: [router] } });

    await fireEvent.update(screen.getByLabelText(/^Invite code/), 'EXPIRED');
    await fireEvent.update(screen.getByLabelText(/^Username/), 'anna');
    await fireEvent.update(screen.getByLabelText(/^Password/), 'secret123');
    await fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(
      await screen.findByText('Invite code is invalid, expired, or deactivated.'),
    ).toBeInTheDocument();
    expect(router.currentRoute.value.path).toBe('/registrieren');
  });

  it('links back to the login page', async () => {
    const router = createTestRouter();
    await router.isReady();

    render(RegisterView, { global: { plugins: [router] } });

    expect(screen.getByRole('link', { name: /Back to login/ })).toHaveAttribute('href', '/login');
  });
});
