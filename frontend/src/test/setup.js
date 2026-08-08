import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/vue';
import { config } from '@vue/test-utils';
import '@testing-library/jest-dom/vitest';

import i18n from '../i18n';

config.global.plugins.push(i18n);

afterEach(() => {
  cleanup();
});
