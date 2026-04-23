import {
  ChartDatumDto,
  DecisionCountsReportDto,
  LineDecision,
  RiskBand,
  RiskBandDistributionReportDto,
  RuleFrequencyReportDto,
  TopEntitiesReportDto
} from "@fdcdf/shared";
import * as repository from "./reports.repository";

interface TopEntityRow {
  id: string;
  label: string;
  value: number | string;
}

const mapChartRows = (rows: Array<Record<string, unknown>>): ChartDatumDto[] =>
  rows.map((row) => ({
    label: String(row.label),
    value: Number(row.value)
  }));

export const getRiskBandDistribution = async (): Promise<RiskBandDistributionReportDto> => {
  const rows = mapChartRows((await repository.getRiskBandDistribution()) as Array<Record<string, unknown>>);
  const values = new Map(rows.map((row) => [row.label, row.value]));

  return {
    series: [RiskBand.LOW, RiskBand.MEDIUM, RiskBand.HIGH, RiskBand.CRITICAL].map((band) => ({
      label: band,
      value: values.get(band) ?? 0
    }))
  };
};

export const getRuleFrequency = async (): Promise<RuleFrequencyReportDto> => ({
  series: mapChartRows((await repository.getRuleFrequency()) as Array<Record<string, unknown>>)
});

export const getDecisionCounts = async (): Promise<DecisionCountsReportDto> => {
  const rows = mapChartRows((await repository.getDecisionCounts()) as Array<Record<string, unknown>>);
  const values = new Map(rows.map((row) => [row.label, row.value]));

  return {
    series: [
      LineDecision.LEGITIMATE,
      LineDecision.EDUCATION_REQUIRED,
      LineDecision.CONFIRMED_FRAUD
    ].map((decision) => ({
      label: decision,
      value: values.get(decision) ?? 0
    }))
  };
};

export const getTopEntities = async (limit = 5): Promise<TopEntitiesReportDto> => {
  const [procedures, providers, patients] = await Promise.all([
    repository.getTopProcedures(limit),
    repository.getTopProviders(limit),
    repository.getTopPatients(limit)
  ]);

  return {
    procedures: (procedures as TopEntityRow[]).map((row) => ({
      id: String(row.id),
      label: String(row.label),
      value: Number(row.value)
    })),
    providers: (providers as TopEntityRow[]).map((row) => ({
      id: String(row.id),
      label: String(row.label),
      value: Number(row.value)
    })),
    patients: (patients as TopEntityRow[]).map((row) => ({
      id: String(row.id),
      label: String(row.label),
      value: Number(row.value)
    }))
  };
};
