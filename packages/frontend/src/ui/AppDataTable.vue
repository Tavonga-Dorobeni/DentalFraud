<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { PaginationMeta } from "@fdcdf/shared";
import AppSkeletonLoader from "./AppSkeletonLoader.vue";

export interface Column<R> {
  key: keyof R & string;
  label: string;
  class?: string;
  mono?: boolean;
}

interface Props {
  columns: Column<T>[];
  rows: T[];
  pagination?: PaginationMeta;
  loading?: boolean;
  rowKey?: keyof T & string;
  skeletonRows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: "id" as keyof T & string,
  skeletonRows: 5,
});

const emit = defineEmits<{
  "page-change": [page: number];
  "row-click": [row: T];
}>();

function goToPage(page: number) {
  if (props.pagination && page >= 1 && page <= props.pagination.totalPages) {
    emit("page-change", page);
  }
}
</script>

<template>
  <div class="border border-border-subtle rounded-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border-subtle bg-surface-glass">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left font-semibold text-navy-auth"
              :class="col.class"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr
              v-for="i in skeletonRows"
              :key="'skel-' + i"
              class="border-b border-border-subtle last:border-0"
            >
              <td v-for="col in columns" :key="col.key" class="px-4 py-3">
                <AppSkeletonLoader shape="line" height="1rem" :width="col.mono ? '6rem' : '80%'" />
              </td>
            </tr>
          </template>
          <!-- Data rows -->
          <template v-else-if="rows.length">
            <tr
              v-for="row in rows"
              :key="String(row[rowKey])"
              class="border-b border-border-subtle last:border-0 hover:bg-surface-glass cursor-pointer transition-colors"
              @click="emit('row-click', row)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3"
                :class="[col.class, { 'font-mono text-navy-500': col.mono }]"
              >
                <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>
          <!-- Empty state -->
          <tr v-else>
            <td :colspan="columns.length" class="px-4 py-8 text-center text-navy-500">
              No data available
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.totalPages > 1"
      class="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-surface-glass"
    >
      <span class="text-xs text-navy-500">
        Showing {{ (pagination.page - 1) * pagination.pageSize + 1 }}-{{
          Math.min(pagination.page * pagination.pageSize, pagination.total)
        }} of {{ pagination.total }}
      </span>
      <div class="flex items-center gap-1">
        <button
          class="px-2 py-1 text-xs rounded hover:bg-border-subtle disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination!.page - 1)"
        >
          Prev
        </button>
        <span class="px-2 py-1 text-xs text-navy-500">
          {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <button
          class="px-2 py-1 text-xs rounded hover:bg-border-subtle disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="pagination.page >= pagination.totalPages"
          @click="goToPage(pagination!.page + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
