<script setup>
import { h, ref, watch } from 'vue';
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useVueTable,
} from '@tanstack/vue-table';

const props = defineProps({
  rows: { type: Array, default: () => [] },
  page: { type: Number, required: true },
  pageCount: { type: Number, required: true },
  totalCount: { type: Number, required: true },
  search: { type: String, default: '' },
  sortBy: { type: String, default: null },
  sortDir: { type: String, default: null },
});

const emit = defineEmits(['search-change', 'sort-change', 'page-change', 'edit', 'delete']);

function formatFee(value) {
  if (value === null || value === undefined || value === '') return '';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
}

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('event_name', { header: 'Veranstaltung', enableGrouping: false }),
  columnHelper.accessor('event_date', {
    header: 'Datum',
    enableGrouping: false,
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor('created_by', {
    header: 'Ersteller',
    enableGrouping: true,
    enableSorting: false,
  }),
  columnHelper.accessor('organizer', { header: 'Veranstalter', enableGrouping: true }),
  columnHelper.accessor('organizer_website', {
    header: 'Website',
    enableGrouping: false,
    enableSorting: false,
  }),
  columnHelper.accessor('organizer_email', {
    header: 'E-Mail',
    enableGrouping: false,
    enableSorting: false,
  }),
  columnHelper.accessor('application_text', {
    header: 'Bewerbungstext',
    enableGrouping: false,
    enableSorting: false,
  }),
  columnHelper.accessor('venue_street', { header: 'Straße', enableGrouping: false }),
  columnHelper.accessor('venue_zip', { header: 'PLZ', enableGrouping: true }),
  columnHelper.accessor('venue_city', { header: 'Ort', enableGrouping: true }),
  columnHelper.accessor('fee', {
    header: 'Gage (€)',
    enableGrouping: false,
    cell: (info) => formatFee(info.getValue()),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Aktionen',
    enableSorting: false,
    enableGrouping: false,
    cell: (info) =>
      h('div', { class: 'flex gap-3' }, [
        h(
          'button',
          {
            type: 'button',
            class: 'underline text-sm',
            onClick: () => emit('edit', info.row.original.id),
          },
          'Bearbeiten',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'underline text-sm text-red-600',
            onClick: () => emit('delete', info.row.original.id),
          },
          'Löschen',
        ),
      ]),
  }),
];

const grouping = ref([]);
const expanded = ref({});
const localSearch = ref(props.search);

watch(
  () => props.search,
  (value) => {
    localSearch.value = value;
  },
);

let searchDebounceHandle;
watch(localSearch, (value) => {
  clearTimeout(searchDebounceHandle);
  searchDebounceHandle = setTimeout(() => emit('search-change', value), 300);
});

const table = useVueTable({
  get data() {
    return props.rows;
  },
  columns,
  state: {
    get grouping() {
      return grouping.value;
    },
    get expanded() {
      return expanded.value;
    },
  },
  onGroupingChange: (updater) => {
    grouping.value = typeof updater === 'function' ? updater(grouping.value) : updater;
  },
  onExpandedChange: (updater) => {
    expanded.value = typeof updater === 'function' ? updater(expanded.value) : updater;
  },
  enableMultiSort: false,
  manualSorting: true,
  manualPagination: true,
  manualFiltering: true,
  getCoreRowModel: getCoreRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
});

function toggleSort(column) {
  if (!column.getCanSort()) return;
  if (props.sortBy !== column.id) {
    emit('sort-change', { sortBy: column.id, sortDir: 'asc' });
  } else if (props.sortDir === 'asc') {
    emit('sort-change', { sortBy: column.id, sortDir: 'desc' });
  } else {
    emit('sort-change', { sortBy: null, sortDir: null });
  }
}

function sortIndicator(column) {
  if (!column.getCanSort() || props.sortBy !== column.id) return '';
  return props.sortDir === 'asc' ? ' ▲' : ' ▼';
}

function goToPage(page) {
  if (page < 1 || page > props.pageCount) return;
  emit('page-change', page);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <input
      v-model="localSearch"
      type="search"
      placeholder="Suche..."
      class="bg-secondary text-primary border border-primary rounded px-3 py-2 max-w-sm"
    >

    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse">
        <thead>
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="text-left border-b border-primary/20 px-3 py-2 whitespace-nowrap"
            >
              <div
                v-if="!header.isPlaceholder"
                class="flex items-center gap-2"
              >
                <span
                  :class="header.column.getCanSort() ? 'cursor-pointer select-none' : ''"
                  @click="toggleSort(header.column)"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />{{
                    sortIndicator(header.column)
                  }}
                </span>
                <button
                  v-if="header.column.getCanGroup()"
                  type="button"
                  class="text-xs underline text-accent"
                  @click="header.column.getToggleGroupingHandler()()"
                >
                  {{ header.column.getIsGrouped() ? 'Gruppierung aufheben' : 'Gruppieren' }}
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="border-b border-primary/10"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-3 py-2"
            >
              <button
                v-if="cell.getIsGrouped()"
                type="button"
                class="font-medium"
                @click="row.getToggleExpandedHandler()()"
              >
                {{ row.getIsExpanded() ? '▾' : '▸' }}
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
                ({{ row.subRows.length }})
              </button>
              <FlexRender
                v-else-if="!cell.getIsPlaceholder() && !cell.getIsAggregated()"
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </td>
          </tr>
          <tr v-if="table.getRowModel().rows.length === 0">
            <td
              :colspan="columns.length"
              class="px-3 py-6 text-center text-primary/60"
            >
              Keine Einträge gefunden.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-sm text-primary/70">{{ totalCount }} Einträge insgesamt</span>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-3 py-1 rounded border border-primary/30 disabled:opacity-40"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          Zurück
        </button>
        <span class="text-sm">Seite {{ page }} von {{ pageCount || 1 }}</span>
        <button
          type="button"
          class="px-3 py-1 rounded border border-primary/30 disabled:opacity-40"
          :disabled="page >= pageCount"
          @click="goToPage(page + 1)"
        >
          Weiter
        </button>
      </div>
    </div>
  </div>
</template>
