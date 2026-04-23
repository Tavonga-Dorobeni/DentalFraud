<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { AlertStatus, RuleSeverity } from "@fdcdf/shared";
import { useClaimsStore } from "@/stores/claims.store";
import { useAlertsStore } from "@/stores/alerts.store";
import { useAuthStore } from "@/stores/auth.store";
import { useReportsStore } from "@/stores/reports.store";
import GlassPanel from "@/ui/GlassPanel.vue";
import { formatDate } from "@/utils/date";
import DoughnutChart from "@/features/reports/components/DoughnutChart.vue";
import HorizontalBarChart from "@/features/reports/components/HorizontalBarChart.vue";
import StackedShareBar from "@/features/reports/components/StackedShareBar.vue";
import {
  DECISION_COLORS,
  RISK_BAND_COLORS,
} from "@/features/reports/charts.colors";

const router = useRouter();
const claimsStore = useClaimsStore();
const alertsStore = useAlertsStore();
const authStore = useAuthStore();
const reportsStore = useReportsStore();

const openAlerts = computed(
  () => alertsStore.alerts.filter((a) => a.status === AlertStatus.OPEN).length
);
const criticalAlerts = computed(
  () =>
    alertsStore.alerts.filter(
      (a) => a.severity === RuleSeverity.CRITICAL && a.status === AlertStatus.OPEN
    ).length
);
const totalClaims = computed(() => claimsStore.pagination?.total ?? 0);

const topProceduresSeries = computed(() =>
  reportsStore.topEntities === null
    ? null
    : reportsStore.topEntities.procedures.map((e) => ({
        label: e.label,
        value: e.value,
      }))
);
const topProvidersSeries = computed(() =>
  reportsStore.topEntities === null
    ? null
    : reportsStore.topEntities.providers.map((e) => ({
        label: e.label,
        value: e.value,
      }))
);
const topPatientsSeries = computed(() =>
  reportsStore.topEntities === null
    ? null
    : reportsStore.topEntities.patients.map((e) => ({
        label: e.label,
        value: e.value,
      }))
);

onMounted(() => {
  claimsStore.fetchClaims(1, 10);
  if (authStore.canViewAlerts) {
    alertsStore.fetchAlerts(1, 100);
  }
  reportsStore.fetchAllReports();
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-navy-auth mb-6">Dashboard</h1>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <template v-if="authStore.canViewAlerts">
        <GlassPanel class="cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/alerts')">
          <div class="text-xs text-navy-500 mb-1">Open Alerts</div>
          <div class="text-3xl font-semibold text-navy-auth">{{ openAlerts }}</div>
        </GlassPanel>
        <GlassPanel class="cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/alerts')">
          <div class="text-xs text-navy-500 mb-1">Critical Alerts</div>
          <div class="text-3xl font-semibold text-red-critical">{{ criticalAlerts }}</div>
        </GlassPanel>
      </template>
      <GlassPanel
        class="cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'md:col-span-3': !authStore.canViewAlerts }"
        @click="router.push('/claims')"
      >
        <div class="text-xs text-navy-500 mb-1">Total Claims</div>
        <div class="text-3xl font-semibold text-navy-auth">{{ totalClaims }}</div>
      </GlassPanel>
    </div>

    <!-- Risk bands (1/3) + decision counts (2/3) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="md:col-span-1">
        <DoughnutChart
          title="Risk bands"
          :series="reportsStore.riskBands"
          :loading="reportsStore.loading.riskBands"
          :error="reportsStore.error.riskBands"
          :color-map="RISK_BAND_COLORS"
          :on-retry="() => reportsStore.fetchRiskBands()"
        />
      </div>
      <div class="md:col-span-2">
        <StackedShareBar
          title="Decisions"
          :series="reportsStore.decisionCounts"
          :loading="reportsStore.loading.decisionCounts"
          :error="reportsStore.error.decisionCounts"
          :color-map="DECISION_COLORS"
          :on-retry="() => reportsStore.fetchDecisionCounts()"
        />
      </div>
    </div>

    <!-- Rule frequency (full width) -->
    <div class="mb-4">
      <HorizontalBarChart
        title="Rule frequency"
        :series="reportsStore.ruleFrequency"
        :loading="reportsStore.loading.ruleFrequency"
        :error="reportsStore.error.ruleFrequency"
        :height="280"
        :on-retry="() => reportsStore.fetchRuleFrequency()"
      />
    </div>

    <!-- Top procedures / providers / patients -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <HorizontalBarChart
        title="Top procedures"
        :series="topProceduresSeries"
        :loading="reportsStore.loading.topEntities"
        :error="reportsStore.error.topEntities"
        :on-retry="() => reportsStore.fetchTopEntities()"
      />
      <HorizontalBarChart
        title="Top providers"
        :series="topProvidersSeries"
        :loading="reportsStore.loading.topEntities"
        :error="reportsStore.error.topEntities"
        :on-retry="() => reportsStore.fetchTopEntities()"
      />
      <HorizontalBarChart
        title="Top patients"
        :series="topPatientsSeries"
        :loading="reportsStore.loading.topEntities"
        :error="reportsStore.error.topEntities"
        :on-retry="() => reportsStore.fetchTopEntities()"
      />
    </div>

    <!-- Recent claims -->
    <div>
      <h2 class="text-sm font-semibold text-navy-auth mb-3">Recent Claims</h2>
      <div v-if="claimsStore.claims.length" class="border border-border-subtle rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border-subtle bg-surface-glass">
              <th class="px-4 py-2 text-left font-semibold">Claim ID</th>
              <th class="px-4 py-2 text-left font-semibold">Date</th>
              <th class="px-4 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="claim in claimsStore.claims.slice(0, 5)"
              :key="claim.id"
              class="border-b border-border-subtle last:border-0 hover:bg-surface-glass cursor-pointer"
              @click="router.push(`/claims/${claim.id}`)"
            >
              <td class="px-4 py-2 font-mono">{{ claim.externalClaimId }}</td>
              <td class="px-4 py-2">{{ formatDate(claim.dateOfService) }}</td>
              <td class="px-4 py-2">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-blue-clinical-light text-blue-clinical': claim.status === 'ACCEPTED',
                    'bg-amber-alert-light text-amber-alert': claim.status === 'ACCEPTED_WITH_WARNINGS',
                    'bg-red-critical-light text-red-critical': claim.status === 'REJECTED',
                  }"
                >
                  {{ claim.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <GlassPanel v-else>
        <div class="text-center py-4 text-navy-500 text-sm">No claims yet.</div>
      </GlassPanel>
    </div>
  </div>
</template>
