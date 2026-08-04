import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';

import BookingForm from './BookingForm.vue';

describe('BookingForm', () => {
  it('marks only the event name as required and shows the Euro fee label', () => {
    render(BookingForm);

    expect(screen.getByLabelText(/Veranstaltungsname/)).toBeRequired();
    expect(screen.getByLabelText('Datum')).not.toBeRequired();
    expect(screen.getByLabelText('Veranstalter')).not.toBeRequired();

    const feeInput = screen.getByLabelText('Gage (€)');
    expect(feeInput).not.toBeRequired();
    expect(feeInput).toHaveAttribute('type', 'number');
  });

  it('emits submit with andContinue: true and the entered data for the "nächster Eintrag" button', async () => {
    const { emitted } = render(BookingForm);

    await fireEvent.update(screen.getByLabelText(/Veranstaltungsname/), 'Sommerfest');
    await fireEvent.update(screen.getByLabelText('Gage (€)'), '450');
    await fireEvent.click(screen.getByRole('button', { name: 'Hinzufügen und nächster Eintrag' }));

    expect(emitted().submit).toHaveLength(1);
    expect(emitted().submit[0][0]).toEqual({
      data: expect.objectContaining({ event_name: 'Sommerfest', fee: '450' }),
      andContinue: true,
    });
  });

  it('emits submit with andContinue: false for the "zurück zur Übersicht" button', async () => {
    const { emitted } = render(BookingForm);

    await fireEvent.update(screen.getByLabelText(/Veranstaltungsname/), 'Herbstfest');
    await fireEvent.click(screen.getByRole('button', { name: 'Hinzufügen und zurück zur Übersicht' }));

    expect(emitted().submit).toHaveLength(1);
    expect(emitted().submit[0][0]).toEqual({
      data: expect.objectContaining({ event_name: 'Herbstfest' }),
      andContinue: false,
    });
  });

  it('does not require any field other than the event name to emit a payload', async () => {
    const { emitted } = render(BookingForm);

    await fireEvent.click(screen.getByRole('button', { name: 'Hinzufügen und zurück zur Übersicht' }));

    expect(emitted().submit[0][0].data.event_name).toBe('');
  });

  it('pre-fills fields from initialData and shows "Speichern"-labeled buttons in edit mode', () => {
    render(BookingForm, {
      props: {
        isEditMode: true,
        initialData: { event_name: 'Bestehender Auftritt', fee: '300' },
      },
    });

    expect(screen.getByLabelText(/Veranstaltungsname/).value).toBe('Bestehender Auftritt');
    expect(screen.getByLabelText('Gage (€)').value).toBe('300');
    expect(screen.getByRole('button', { name: 'Speichern und nächster Eintrag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speichern und zurück zur Übersicht' })).toBeInTheDocument();
  });
});
