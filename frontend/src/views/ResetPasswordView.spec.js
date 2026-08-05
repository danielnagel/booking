import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import ResetPasswordView from './ResetPasswordView.vue';

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
      { path: '/passwort-zuruecksetzen', name: 'reset-password', component: ResetPasswordView },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  });
  router.push('/passwort-zuruecksetzen');
  return router;
}

describe('ResetPasswordView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    apiClient.post.mockReset();
  });

  it('has no username field and resets the password with only code and new password', async () => {
    apiClient.post.mockResolvedValueOnce({});
    const router = createTestRouter();
    await router.isReady();

    render(ResetPasswordView, { global: { plugins: [router] } });

    expect(screen.queryByLabelText(/Benutzername/)).not.toBeInTheDocument();

    await fireEvent.update(screen.getByLabelText(/^Reset-Code/), 'RESET-CODE-1');
    await fireEvent.update(screen.getByLabelText(/^Neues Passwort/), 'newSecret123');
    await fireEvent.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }));

    expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
      resetCode: 'RESET-CODE-1',
      newPassword: 'newSecret123',
    });
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/login'));
  });

  it('shows an error message when the reset code is invalid', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('invalid reset code'));
    const router = createTestRouter();
    await router.isReady();

    render(ResetPasswordView, { global: { plugins: [router] } });

    await fireEvent.update(screen.getByLabelText(/^Reset-Code/), 'BAD-CODE');
    await fireEvent.update(screen.getByLabelText(/^Neues Passwort/), 'newSecret123');
    await fireEvent.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }));

    expect(await screen.findByText('invalid reset code')).toBeInTheDocument();
    expect(router.currentRoute.value.path).toBe('/passwort-zuruecksetzen');
  });

  it('links back to the login page', async () => {
    const router = createTestRouter();
    await router.isReady();

    render(ResetPasswordView, { global: { plugins: [router] } });

    expect(screen.getByRole('link', { name: /Zurück zum Login/ })).toHaveAttribute('href', '/login');
  });
});
