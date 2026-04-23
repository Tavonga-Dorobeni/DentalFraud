<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { ClaimLineDto, ClaimResponse } from "@fdcdf/shared";
import { api } from "@/composables/useApi";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import { formatDate } from "@/utils/date";

const props = defineProps<{
  currentClaim: ClaimResponse;
  matchedClaimId: string;
}>();

const matched = ref<ClaimResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function load(id: string) {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get(`/api/v1/claims/${id}`);
    matched.value = response.data;
  } catch {
    error.value = "Unable to load matched claim.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => load(props.matchedClaimId));
watch(
  () => props.matchedClaimId,
  (id) => load(id),
);

interface FieldRow {
  label: string;
  current: string;
  matched: string;
  matches: boolean;
}

const totalAmount = (lines: ClaimLineDto[]) =>
  lines.reduce((sum, l) => sum + l.claimedAmount, 0);

const headerRows = computed<FieldRow[]>(() => {
  if (!matched.value) return [];
  const c = props.currentClaim;
  const m = matched.value;
  const rows: FieldRow[] = [
    {
      label: "Claim ID",
      current: c.externalClaimId,
      matched: m.externalClaimId,
      matches: c.externalClaimId === m.externalClaimId,
    },
    {
      label: "Patient",
      current: c.patientId,
      matched: m.patientId,
      matches: c.patientId === m.patientId,
    },
    {
      label: "Provider",
      current: c.providerId,
      matched: m.providerId,
      matches: c.providerId === m.providerId,
    },
    {
      label: "Date of Service",
      current: formatDate(c.dateOfService),
      matched: formatDate(m.dateOfService),
      matches: c.dateOfService === m.dateOfService,
    },
    {
      label: "Submitted",
      current: formatDate(c.submissionDate),
      matched: formatDate(m.submissionDate),
      matches: c.submissionDate === m.submissionDate,
    },
    {
      label: "Status",
      current: c.status,
      matched: m.status,
      matches: c.status === m.status,
    },
    {
      label: "Total Claimed",
      current: `$${totalAmount(c.lines).toFixed(2)}`,
      matched: `$${totalAmount(m.lines).toFixed(2)}`,
      matches: totalAmount(c.lines) === totalAmount(m.lines),
    },
  ];
  return rows;
});

interface LinePair {
  key: string;
  current: ClaimLineDto | null;
  matched: ClaimLineDto | null;
  matches: Record<string, boolean>;
}

const lineKey = (line: ClaimLineDto) =>
  `${line.procedureCode}|${line.toothNumber ?? ""}`;

const linePairs = computed<LinePair[]>(() => {
  if (!matched.value) return [];
  const currentMap = new Map<string, ClaimLineDto>();
  for (const line of props.currentClaim.lines) currentMap.set(lineKey(line), line);
  const matchedMap = new Map<string, ClaimLineDto>();
  for (const line of matched.value.lines) matchedMap.set(lineKey(line), line);

  const keys = new Set<string>([...currentMap.keys(), ...matchedMap.keys()]);
  const pairs: LinePair[] = [];
  for (const key of keys) {
    const current = currentMap.get(key) ?? null;
    const matchedLine = matchedMap.get(key) ?? null;
    const bothPresent = current != null && matchedLine != null;
    const matches = {
      procedureCode:
        bothPresent && current!.procedureCode === matchedLine!.procedureCode,
      toothNumber:
        bothPresent &&
        (current!.toothNumber ?? null) === (matchedLine!.toothNumber ?? null),
      claimedAmount:
        bothPresent && current!.claimedAmount === matchedLine!.claimedAmount,
      documentedProcedureCode:
        bothPresent &&
        (current!.documentedProcedureCode ?? null) ===
          (matchedLine!.documentedProcedureCode ?? null),
    };
    pairs.push({ key, current, matched: matchedLine, matches });
  }
  pairs.sort((a, b) => a.key.localeCompare(b.key));
  return pairs;
});

const allFieldsMatch = computed(
  () =>
    headerRows.value.every((r) => r.matches) &&
    linePairs.value.every(
      (p) => p.current && p.matched && Object.values(p.matches).every(Boolean),
    ),
);

function lineCell(line: ClaimLineDto | null, field: keyof ClaimLineDto): string {
  if (!line) return "—";
  const v = line[field];
  if (v == null || v === "") return "—";
  if (field === "claimedAmount") return `$${(v as number).toFixed(2)}`;
  return String(v);
}
</script>

<template>
  <div class="border border-border-subtle rounded-lg bg-surface-glass p-4">
    <div v-if="loading" class="space-y-2">
      <AppSkeletonLoader shape="rect" height="1.5rem" />
      <AppSkeletonLoader shape="rect" height="6rem" />
    </div>

    <div v-else-if="error" class="text-sm text-red-critical">{{ error }}</div>

    <div v-else-if="matched" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold text-navy-auth">Claim comparison</div>
        <div v-if="allFieldsMatch" class="text-xs text-amber-alert">
          All compared fields match — exact duplicate.
        </div>
        <div v-else class="text-xs text-navy-500">
          Matching fields highlighted in amber.
        </div>
      </div>

      <!-- Header fields -->
      <div class="overflow-hidden rounded-lg border border-border-subtle">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border-subtle bg-clinical-bg">
              <th class="px-3 py-2 text-left text-xs font-semibold text-navy-500 w-1/5">
                Field
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-navy-auth">
                This claim
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-navy-auth">
                Matched claim
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in headerRows"
              :key="row.label"
              class="border-b border-border-subtle last:border-0"
              :class="{ 'bg-amber-alert-light': row.matches }"
            >
              <td class="px-3 py-2 text-xs text-navy-500">{{ row.label }}</td>
              <td class="px-3 py-2 font-mono text-navy-auth">{{ row.current }}</td>
              <td class="px-3 py-2 font-mono text-navy-auth">{{ row.matched }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Claim lines -->
      <div>
        <div class="text-xs font-semibold text-navy-500 mb-2">
          Claim lines
          <span class="text-navy-400 font-normal">
            (aligned by procedure + tooth)
          </span>
        </div>
        <div class="overflow-hidden rounded-lg border border-border-subtle">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border-subtle bg-clinical-bg">
                <th class="px-3 py-2 text-left text-xs font-semibold text-navy-500">
                  Field
                </th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-navy-auth">
                  This claim
                </th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-navy-auth">
                  Matched claim
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(pair, idx) in linePairs" :key="pair.key">
                <tr class="border-b border-border-subtle bg-surface-glass/50">
                  <td colspan="3" class="px-3 py-1.5 text-xs font-mono text-navy-500">
                    Line {{ idx + 1 }} — {{ pair.key.split("|")[0] }}
                    <span v-if="pair.key.split('|')[1]">
                      · tooth {{ pair.key.split("|")[1] }}
                    </span>
                  </td>
                </tr>
                <tr
                  class="border-b border-border-subtle"
                  :class="{ 'bg-amber-alert-light': pair.matches.procedureCode }"
                >
                  <td class="px-3 py-2 text-xs text-navy-500">Procedure</td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.current, "procedureCode") }}
                  </td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.matched, "procedureCode") }}
                  </td>
                </tr>
                <tr
                  class="border-b border-border-subtle"
                  :class="{ 'bg-amber-alert-light': pair.matches.toothNumber }"
                >
                  <td class="px-3 py-2 text-xs text-navy-500">Tooth</td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.current, "toothNumber") }}
                  </td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.matched, "toothNumber") }}
                  </td>
                </tr>
                <tr
                  class="border-b border-border-subtle"
                  :class="{ 'bg-amber-alert-light': pair.matches.claimedAmount }"
                >
                  <td class="px-3 py-2 text-xs text-navy-500">Amount</td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.current, "claimedAmount") }}
                  </td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.matched, "claimedAmount") }}
                  </td>
                </tr>
                <tr
                  class="border-b border-border-subtle last:border-0"
                  :class="{
                    'bg-amber-alert-light': pair.matches.documentedProcedureCode,
                  }"
                >
                  <td class="px-3 py-2 text-xs text-navy-500">Documented code</td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.current, "documentedProcedureCode") }}
                  </td>
                  <td class="px-3 py-2 font-mono">
                    {{ lineCell(pair.matched, "documentedProcedureCode") }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
