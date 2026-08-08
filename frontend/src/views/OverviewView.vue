<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { apiClient } from '../api/client';
import BookingTable from '../components/BookingTable.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const { t } = useI18n();
const router = useRouter();

const PAGE_SIZE = 50;

const rows = ref([]);
const totalCount = ref(0);
const isLoading = ref(false);
const errorMessage = ref('');

const query = reactive({
  search: '',
  sortBy: null,
  sortDir: null,
  page: 1,
});

const deleteTarget = ref(null);

function pageCount() {
  return Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE));
}

async function fetchBookings() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const data = await apiClient.get('/bookings', {
      search: query.search || undefined,
      sortBy: query.sortBy || undefined,
      sortDir: query.sortDir || undefined,
      page: query.page,
      pageSize: PAGE_SIZE,
    });
    rows.value = data?.data ?? [];
    totalCount.value = data?.total ?? 0;
  } catch {
    errorMessage.value = t('overview.loadError');
  } finally {
    isLoading.value = false;
  }
}

function handleSearchChange(value) {
  query.search = value;
  query.page = 1;
  fetchBookings();
}

function handleSortChange({ sortBy, sortDir }) {
  query.sortBy = sortBy;
  query.sortDir = sortDir;
  query.page = 1;
  fetchBookings();
}

function handlePageChange(page) {
  query.page = page;
  fetchBookings();
}

function handleEdit(id) {
  router.push(`/eingabe/${id}`);
}

function handleDeleteRequest(id) {
  deleteTarget.value = id;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await apiClient.delete(`/bookings/${deleteTarget.value}`);
    deleteTarget.value = null;
    if (rows.value.length === 1 && query.page > 1) {
      query.page -= 1;
    }
    await fetchBookings();
  } catch {
    errorMessage.value = t('overview.deleteError');
  }
}

function cancelDelete() {
  deleteTarget.value = null;
}

onMounted(fetchBookings);
</script>

<template>
  <main class="flex flex-col gap-6 px-4 py-8 max-w-6xl mx-auto w-full">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        {{ t('overview.title') }}
      </h1>
      <router-link
        to="/eingabe"
        class="bg-accent text-secondary font-semibold rounded px-5 py-2.5 shadow"
      >
        {{ t('overview.newEntry') }}
      </router-link>
    </div>

    <p
      v-if="errorMessage"
      class="text-red-600 text-sm"
    >
      {{ errorMessage }}
    </p>
    <p
      v-if="isLoading"
      class="text-sm text-primary/60"
    >
      {{ t('overview.loading') }}
    </p>

    <BookingTable
      :rows="rows"
      :page="query.page"
      :page-count="pageCount()"
      :total-count="totalCount"
      :search="query.search"
      :sort-by="query.sortBy"
      :sort-dir="query.sortDir"
      @search-change="handleSearchChange"
      @sort-change="handleSortChange"
      @page-change="handlePageChange"
      @edit="handleEdit"
      @delete="handleDeleteRequest"
    />

    <ConfirmDialog
      :open="!!deleteTarget"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </main>
</template>
