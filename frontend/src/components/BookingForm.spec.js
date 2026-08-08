import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';

import BookingForm from './BookingForm.vue';

describe('BookingForm', () => {
  it('marks only the event name as required and shows the Euro fee label', () => {
    render(BookingForm);

    expect(screen.getByLabelText(/Event name/)).toBeRequired();
    expect(screen.getByLabelText('Date')).not.toBeRequired();
    expect(screen.getByLabelText('Organizer')).not.toBeRequired();

    const feeInput = screen.getByLabelText('Fee (€)');
    expect(feeInput).not.toBeRequired();
    expect(feeInput).toHaveAttribute('type', 'number');
  });

  it('emits submit with andContinue: true and the entered data for the "next entry" button', async () => {
    const { emitted } = render(BookingForm);

    await fireEvent.update(screen.getByLabelText(/Event name/), 'Sommerfest');
    await fireEvent.update(screen.getByLabelText('Fee (€)'), '450');
    await fireEvent.click(screen.getByRole('button', { name: 'Add and next entry' }));

    expect(emitted().submit).toHaveLength(1);
    expect(emitted().submit[0][0]).toEqual({
      data: expect.objectContaining({ event_name: 'Sommerfest', fee: '450' }),
      andContinue: true,
    });
  });

  it('emits submit with andContinue: false for the "back to overview" button', async () => {
    const { emitted } = render(BookingForm);

    await fireEvent.update(screen.getByLabelText(/Event name/), 'Herbstfest');
    await fireEvent.click(screen.getByRole('button', { name: 'Add and back to overview' }));

    expect(emitted().submit).toHaveLength(1);
    expect(emitted().submit[0][0]).toEqual({
      data: expect.objectContaining({ event_name: 'Herbstfest' }),
      andContinue: false,
    });
  });

  it('does not require any field other than the event name to emit a payload', async () => {
    const { emitted } = render(BookingForm);

    await fireEvent.click(screen.getByRole('button', { name: 'Add and back to overview' }));

    expect(emitted().submit[0][0].data.event_name).toBe('');
  });

  it('pre-fills fields from initialData and shows "Save"-labeled buttons in edit mode', () => {
    render(BookingForm, {
      props: {
        isEditMode: true,
        initialData: { event_name: 'Bestehender Auftritt', fee: '300' },
      },
    });

    expect(screen.getByLabelText(/Event name/).value).toBe('Bestehender Auftritt');
    expect(screen.getByLabelText('Fee (€)').value).toBe('300');
    expect(screen.getByRole('button', { name: 'Save and next entry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save and back to overview' })).toBeInTheDocument();
  });
});
