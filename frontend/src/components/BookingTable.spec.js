import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/vue';

import BookingTable from './BookingTable.vue';

function baseProps(overrides = {}) {
  return {
    rows: [],
    page: 1,
    pageCount: 1,
    totalCount: 0,
    search: '',
    sortBy: null,
    sortDir: null,
    ...overrides,
  };
}

describe('BookingTable', () => {
  it('renders the column headers including "Gage (€)"', () => {
    render(BookingTable, { props: baseProps() });

    expect(screen.getByRole('columnheader', { name: /Veranstaltung/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Gage \(€\)/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Aktionen/ })).toBeInTheDocument();
  });

  it('renders row data, formatting the fee as Euro currency and the date as de-DE', () => {
    const rows = [
      {
        id: '1',
        event_name: 'Sommerfest',
        event_date: '2026-03-15',
        organizer: 'Stadtfest e.V.',
        fee: 450,
      },
    ];
    render(BookingTable, { props: baseProps({ rows, totalCount: 1 }) });

    const expectedFee = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(450);
    const expectedDate = new Intl.DateTimeFormat('de-DE').format(new Date('2026-03-15'));
    const normalize = (value) => value.replace(/\s+/g, ' ').trim();

    expect(screen.getByText('Sommerfest')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => !!element && normalize(element.textContent) === normalize(expectedFee)),
    ).toBeInTheDocument();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('shows a placeholder row when there are no entries', () => {
    render(BookingTable, { props: baseProps() });

    expect(screen.getByText('Keine Einträge gefunden.')).toBeInTheDocument();
  });

  it('emits a debounced search-change event when typing into the search field', async () => {
    vi.useFakeTimers();
    try {
      const { emitted } = render(BookingTable, { props: baseProps() });

      const searchInput = screen.getByPlaceholderText('Suche...');
      await fireEvent.update(searchInput, 'Stadtfest');

      expect(emitted()['search-change']).toBeUndefined();

      vi.advanceTimersByTime(300);

      expect(emitted()['search-change']).toEqual([['Stadtfest']]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cycles sort direction and emits sort-change when clicking a sortable column header', async () => {
    const { emitted, rerender } = render(BookingTable, { props: baseProps() });

    await fireEvent.click(screen.getByText('Veranstaltung'));
    expect(emitted()['sort-change'][0][0]).toEqual({ sortBy: 'event_name', sortDir: 'asc' });

    await rerender(baseProps({ sortBy: 'event_name', sortDir: 'asc' }));
    await fireEvent.click(screen.getByText(/Veranstaltung/));
    expect(emitted()['sort-change'][1][0]).toEqual({ sortBy: 'event_name', sortDir: 'desc' });

    await rerender(baseProps({ sortBy: 'event_name', sortDir: 'desc' }));
    await fireEvent.click(screen.getByText(/Veranstaltung/));
    expect(emitted()['sort-change'][2][0]).toEqual({ sortBy: null, sortDir: null });
  });

  it('does not emit sort-change for a column with sorting disabled', async () => {
    const { emitted } = render(BookingTable, { props: baseProps() });

    await fireEvent.click(screen.getByRole('columnheader', { name: 'Website' }).querySelector('span'));

    expect(emitted()['sort-change']).toBeUndefined();
  });

  it('groups rows by a groupable column and expands to reveal the underlying rows', async () => {
    const rows = [
      { id: '1', event_name: 'Konzert A', organizer: 'Stadtfest e.V.', fee: 100 },
      { id: '2', event_name: 'Konzert B', organizer: 'Stadtfest e.V.', fee: 200 },
    ];
    render(BookingTable, { props: baseProps({ rows, totalCount: 2 }) });

    const organizerHeader = screen.getByRole('columnheader', { name: /Veranstalter/ });
    await fireEvent.click(within(organizerHeader).getByRole('button', { name: 'Gruppieren' }));

    const groupToggle = await screen.findByRole('button', { name: /Stadtfest e\.V\. \(2\)/ });
    expect(groupToggle).toBeInTheDocument();
    expect(screen.queryByText('Konzert A')).not.toBeInTheDocument();

    await fireEvent.click(groupToggle);

    expect(screen.getByText('Konzert A')).toBeInTheDocument();
    expect(screen.getByText('Konzert B')).toBeInTheDocument();
  });

  it('emits page-change and disables buttons at the boundaries', async () => {
    const { emitted } = render(BookingTable, {
      props: baseProps({ page: 2, pageCount: 3, totalCount: 120 }),
    });

    expect(screen.getByText('Seite 2 von 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurück' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Weiter' })).not.toBeDisabled();

    await fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(emitted()['page-change'][0]).toEqual([1]);

    await fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(emitted()['page-change'][1]).toEqual([3]);
  });

  it('disables "Zurück" on the first page and "Weiter" on the last page', () => {
    render(BookingTable, { props: baseProps({ page: 1, pageCount: 1, totalCount: 1 }) });

    expect(screen.getByRole('button', { name: 'Zurück' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeDisabled();
  });
});
