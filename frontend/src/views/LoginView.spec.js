import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import LoginView from './LoginView.vue';

const { apiClient } = vi.hoisted(() => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../api/client', () => ({ apiClient }));

function createTestRouter(initialPath = '/login') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/', name: 'overview', component: { template: '<div>Übersicht</div>' } },
      { path: '/eingabe', name: 'entry-create', component: { template: '<div>Eingabe</div>' } },
      { path: '/registrieren', name: 'register', component: { template: '<div />' } },
      { path: '/passwort-zuruecksetzen', name: 'reset-password', component: { template: '<div />' } },
    ],
  });
  router.push(initialPath);
  return router;
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    apiClient.post.mockReset();
    apiClient.get.mockReset();
  });

  it('logs in and redirects to the overview on success', async () => {
    apiClient.post.mockResolvedValueOnce({ user: { id: '1', username: 'anna' } });
    const router = createTestRouter();
    await router.isReady();

    render(LoginView, { global: { plugins: [router] } });

    await fireEvent.update(screen.getByLabelText(/^Username/), 'anna');
    await fireEvent.update(screen.getByLabelText(/^Password/), 'secret');
    await fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'));
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { username: 'anna', password: 'secret' });
  });

  it('redirects to the originally requested route after login', async () => {
    apiClient.post.mockResolvedValueOnce({ user: { id: '1', username: 'anna' } });
    const router = createTestRouter('/login?redirect=%2Feingabe');
    await router.isReady();

    render(LoginView, { global: { plugins: [router] } });

    await fireEvent.update(screen.getByLabelText(/^Username/), 'anna');
    await fireEvent.update(screen.getByLabelText(/^Password/), 'secret');
    await fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(router.currentRoute.value.path).toBe('/eingabe'));
  });

  it('shows an error message and stays on the page when login fails', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('invalid credentials'));
    const router = createTestRouter();
    await router.isReady();

    render(LoginView, { global: { plugins: [router] } });

    await fireEvent.update(screen.getByLabelText(/^Username/), 'anna');
    await fireEvent.update(screen.getByLabelText(/^Password/), 'wrong');
    await fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Login failed. Please check your credentials.')).toBeInTheDocument();
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('links to the register and reset-password routes', async () => {
    const router = createTestRouter();
    await router.isReady();

    render(LoginView, { global: { plugins: [router] } });

    expect(screen.getByRole('link', { name: /Register/ })).toHaveAttribute('href', '/registrieren');
    expect(screen.getByRole('link', { name: /Forgot your password/ })).toHaveAttribute('href', '/passwort-zuruecksetzen');
  });
});
