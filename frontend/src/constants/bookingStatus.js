import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// Stored as-is in the database and validated by the backend (see
// backend/src/routes/bookings.js STATUS_VALUES) - only the displayed label is
// translated, the underlying value must stay stable across locales.
export const STATUS_VALUES = ['offen', 'angenommen', 'abgelehnt', 'storniert'];

export function useStatusOptions() {
  const { t } = useI18n();
  return computed(() =>
    STATUS_VALUES.map((value) => ({ value, label: t(`bookingForm.status_${value}`) })),
  );
}

export function useStatusLabel() {
  const { t } = useI18n();
  return (value) => (STATUS_VALUES.includes(value) ? t(`bookingForm.status_${value}`) : value);
}
