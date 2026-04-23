<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import type { ChartDatumDto } from "@fdcdf/shared";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import { CHART_COLORS, colorForLabel } from "@/features/reports/charts.colors";
import "@/features/reports/charts.config";

interface Props {
  series: ChartDatumDto[] | null;
  loading: boolean;
  error: boolean;
  title?: string;
  colorMap?: Record<string, string>;
  height?: number;
  onRetry?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  colorMap: undefined,
  height: 240,
  onRetry: undefined,
});

const isEmpty = computed(
  () => Array.isArray(props.series) && props.series.length === 0
);
const isPopulated = computed(
  () => Array.isArray(props.series) && props.series.length > 0
);

const chartData = computed<ChartData<"bar">>(() => {
  const points = props.series ?? [];
  const colors = points.map((p) =>
    props.colorMap ? colorForLabel(p.label, props.colorMap) : CHART_COLORS.blueClinical
  );
  return {
    labels: points.map((p) => p.label),
    datasets: [
      {
        data: points.map((p) => p.value),
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };
});

const chartOptions: ChartOptions<"bar"> = {
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } },
    y: { ticks: { autoSkip: false } },
  },
};
</script>

<template>
  <GlassPanel>
    <div v-if="title" class="text-sm font-semibold text-navy-auth mb-3">
      {{ title }}
    </div>
    <div class="relative" :style="{ height: `${height}px` }">
      <div
        v-if="loading"
        data-test="chart-skeleton"
        class="h-full w-full flex items-center justify-center"
      >
        <AppSkeletonLoader shape="rect" width="100%" height="100%" />
      </div>
      <div
        v-else-if="error"
        class="h-full w-full flex flex-col items-center justify-center text-sm text-navy-500"
      >
        <div class="mb-2">Could not load chart.</div>
        <button
          v-if="onRetry"
          data-test="chart-retry"
          class="px-3 py-1 rounded-md border border-border-subtle text-xs font-medium hover:bg-surface-glass"
          @click="() => onRetry?.()"
        >
          Retry
        </button>
      </div>
      <div
        v-else-if="isEmpty"
        class="h-full w-full flex items-center justify-center text-sm text-navy-500"
      >
        No data yet.
      </div>
      <Bar v-else-if="isPopulated" :data="chartData" :options="chartOptions" />
    </div>
  </GlassPanel>
</template>
