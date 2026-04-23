import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  ChartDatumDto,
  DecisionCountsReportDto,
  RiskBandDistributionReportDto,
  RuleFrequencyReportDto,
  TopEntitiesReportDto,
} from "@fdcdf/shared";
import { api } from "@/composables/useApi";

type ReportKey =
  | "riskBands"
  | "ruleFrequency"
  | "decisionCounts"
  | "topEntities";

function makeFlagMap(): Record<ReportKey, boolean> {
  return {
    riskBands: false,
    ruleFrequency: false,
    decisionCounts: false,
    topEntities: false,
  };
}

export const useReportsStore = defineStore("reports", () => {
  const riskBands = ref<ChartDatumDto[] | null>(null);
  const ruleFrequency = ref<ChartDatumDto[] | null>(null);
  const decisionCounts = ref<ChartDatumDto[] | null>(null);
  const topEntities = ref<TopEntitiesReportDto | null>(null);

  const loading = ref<Record<ReportKey, boolean>>(makeFlagMap());
  const error = ref<Record<ReportKey, boolean>>(makeFlagMap());

  async function runFetch<T>(
    key: ReportKey,
    request: () => Promise<T>,
    apply: (value: T) => void
  ) {
    loading.value[key] = true;
    error.value[key] = false;
    try {
      const value = await request();
      apply(value);
    } catch {
      error.value[key] = true;
    } finally {
      loading.value[key] = false;
    }
  }

  async function fetchRiskBands() {
    await runFetch(
      "riskBands",
      async () => {
        const response = await api.get("/api/v1/reports/risk-band-distribution");
        return response.data as RiskBandDistributionReportDto;
      },
      (value) => {
        riskBands.value = value.series;
      }
    );
  }

  async function fetchRuleFrequency() {
    await runFetch(
      "ruleFrequency",
      async () => {
        const response = await api.get("/api/v1/reports/rule-frequency");
        return response.data as RuleFrequencyReportDto;
      },
      (value) => {
        ruleFrequency.value = value.series;
      }
    );
  }

  async function fetchDecisionCounts() {
    await runFetch(
      "decisionCounts",
      async () => {
        const response = await api.get("/api/v1/reports/decision-counts");
        return response.data as DecisionCountsReportDto;
      },
      (value) => {
        decisionCounts.value = value.series;
      }
    );
  }

  async function fetchTopEntities(limit = 5) {
    await runFetch(
      "topEntities",
      async () => {
        const response = await api.get("/api/v1/reports/top-entities", {
          params: { limit },
        });
        return response.data as TopEntitiesReportDto;
      },
      (value) => {
        topEntities.value = value;
      }
    );
  }

  async function fetchAllReports() {
    await Promise.allSettled([
      fetchRiskBands(),
      fetchRuleFrequency(),
      fetchDecisionCounts(),
      fetchTopEntities(),
    ]);
  }

  return {
    riskBands,
    ruleFrequency,
    decisionCounts,
    topEntities,
    loading,
    error,
    fetchRiskBands,
    fetchRuleFrequency,
    fetchDecisionCounts,
    fetchTopEntities,
    fetchAllReports,
  };
});
