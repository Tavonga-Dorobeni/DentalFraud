<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue";
import type {
  CreateClaimRequest,
  ClaimLineInput,
  PatientDto,
  ProviderDto,
  ProcedureDto,
} from "@fdcdf/shared";
import AppButton from "@/ui/AppButton.vue";
import AppCombobox from "@/ui/AppCombobox.vue";
import GlassPanel from "@/ui/GlassPanel.vue";
import { usePatientsStore } from "@/stores/patients.store";
import { useProvidersStore } from "@/stores/providers.store";
import { useProceduresStore } from "@/stores/procedures.store";

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: CreateClaimRequest];
  cancel: [];
}>();

const patientsStore = usePatientsStore();
const providersStore = useProvidersStore();
const proceduresStore = useProceduresStore();

onMounted(() => {
  patientsStore.fetchPatients();
  providersStore.fetchProviders();
  proceduresStore.fetchProcedures();
});

const form = reactive({
  externalClaimId: "",
  patientExternalId: "",
  patientName: "",
  patientDateOfBirth: "",
  providerExternalId: "",
  providerName: "",
  providerSpecialty: "",
  dateOfService: "",
  submissionDate: "",
});

const lines = ref<ClaimLineInput[]>([
  { procedureCode: "", claimedAmount: 0 },
]);

const selectedPatient = computed(() =>
  patientsStore.findByExternalId(form.patientExternalId)
);
const selectedProvider = computed(() =>
  providersStore.findByExternalId(form.providerExternalId)
);

function onPatientSelect(p: PatientDto) {
  form.patientExternalId = p.externalId;
  form.patientName = p.name;
  form.patientDateOfBirth = p.dateOfBirth ?? "";
}

function onProviderSelect(p: ProviderDto) {
  form.providerExternalId = p.externalId;
  form.providerName = p.name;
  form.providerSpecialty = p.specialty ?? "";
}

function onProcedureSelect(line: ClaimLineInput, proc: ProcedureDto) {
  line.procedureCode = proc.code;
}

function onDocumentedSelect(line: ClaimLineInput, proc: ProcedureDto) {
  line.documentedProcedureCode = proc.code;
}

function addLine() {
  lines.value.push({ procedureCode: "", claimedAmount: 0 });
}

function removeLine(index: number) {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1);
  }
}

/** Validate FDI tooth number: 11-48 (permanent) or 51-85 (primary) */
function isValidFdiTooth(num: number | undefined): boolean {
  if (!num) return true;
  const quadrant = Math.floor(num / 10);
  const tooth = num % 10;
  if (quadrant >= 1 && quadrant <= 4 && tooth >= 1 && tooth <= 8) return true;
  if (quadrant >= 5 && quadrant <= 8 && tooth >= 1 && tooth <= 5) return true;
  return false;
}

const validationError = ref("");
const isPreValidating = ref(false);
const showOverlay = computed(() => props.loading || isPreValidating.value);

const PRE_VALIDATION_DELAY_MS = 1200;

function runClientValidation(): string | null {
  if (!form.patientExternalId || !selectedPatient.value) {
    return "Please select a patient from the list.";
  }
  if (!form.providerExternalId || !selectedProvider.value) {
    return "Please select a provider from the list.";
  }
  for (const line of lines.value) {
    if (!proceduresStore.findByCode(line.procedureCode)) {
      return `Procedure code "${line.procedureCode}" is not in the catalog.`;
    }
    if (
      line.documentedProcedureCode &&
      !proceduresStore.findByCode(line.documentedProcedureCode)
    ) {
      return `Documented code "${line.documentedProcedureCode}" is not in the catalog.`;
    }
    if (line.toothNumber && !isValidFdiTooth(line.toothNumber)) {
      return `Invalid FDI tooth number: ${line.toothNumber}. Permanent: 11-48, Primary: 51-85.`;
    }
  }
  return null;
}

async function handleSubmit() {
  if (showOverlay.value) return;
  validationError.value = "";

  const error = runClientValidation();
  if (error) {
    isPreValidating.value = true;
    await new Promise((resolve) => setTimeout(resolve, PRE_VALIDATION_DELAY_MS));
    isPreValidating.value = false;
    validationError.value = error;
    return;
  }

  const data: CreateClaimRequest = {
    ...form,
    patientDateOfBirth: form.patientDateOfBirth || undefined,
    providerSpecialty: form.providerSpecialty || undefined,
    lines: lines.value,
  };

  emit("submit", data);
}
</script>

<template>
  <GlassPanel class="relative">
    <h2 class="text-lg font-semibold text-navy-auth mb-4">New Claim</h2>
    <form class="space-y-4" @submit.prevent="handleSubmit" :aria-busy="showOverlay">
      <!-- Claim identification -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-navy-500 mb-1">External Claim ID</label>
          <input
            v-model="form.externalClaimId"
            required
            class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-navy-500 mb-1">Date of Service</label>
          <input
            v-model="form.dateOfService"
            type="date"
            required
            class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
          />
        </div>
      </div>

      <!-- Patient -->
      <div>
        <label class="block text-xs font-medium text-navy-500 mb-1">Patient</label>
        <AppCombobox
          :model-value="form.patientExternalId"
          :options="patientsStore.patients"
          value-key="externalId"
          label-key="name"
          sublabel-key="dateOfBirth"
          placeholder="Search patient by name or ID..."
          @select="onPatientSelect"
          @update:model-value="form.patientExternalId = $event"
        />
        <div
          v-if="selectedPatient"
          class="mt-2 grid grid-cols-3 gap-4 text-xs bg-navy-50/40 rounded-lg px-3 py-2"
        >
          <div>
            <div class="text-navy-500">Patient ID</div>
            <div class="font-mono text-navy-auth">{{ selectedPatient.externalId }}</div>
          </div>
          <div>
            <div class="text-navy-500">Name</div>
            <div class="text-navy-auth">{{ selectedPatient.name }}</div>
          </div>
          <div>
            <div class="text-navy-500">Date of Birth</div>
            <div class="text-navy-auth">{{ selectedPatient.dateOfBirth ?? "—" }}</div>
          </div>
        </div>
      </div>

      <!-- Provider -->
      <div>
        <label class="block text-xs font-medium text-navy-500 mb-1">Provider</label>
        <AppCombobox
          :model-value="form.providerExternalId"
          :options="providersStore.providers"
          value-key="externalId"
          label-key="name"
          sublabel-key="specialty"
          placeholder="Search provider by name or ID..."
          @select="onProviderSelect"
          @update:model-value="form.providerExternalId = $event"
        />
        <div
          v-if="selectedProvider"
          class="mt-2 grid grid-cols-3 gap-4 text-xs bg-navy-50/40 rounded-lg px-3 py-2"
        >
          <div>
            <div class="text-navy-500">Provider ID</div>
            <div class="font-mono text-navy-auth">{{ selectedProvider.externalId }}</div>
          </div>
          <div>
            <div class="text-navy-500">Name</div>
            <div class="text-navy-auth">{{ selectedProvider.name }}</div>
          </div>
          <div>
            <div class="text-navy-500">Specialty</div>
            <div class="text-navy-auth">{{ selectedProvider.specialty ?? "—" }}</div>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-navy-500 mb-1">Submission Date</label>
        <input
          v-model="form.submissionDate"
          type="date"
          required
          class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
        />
      </div>

      <!-- Claim lines -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-semibold text-navy-auth">Claim Lines</label>
          <AppButton variant="secondary" size="sm" type="button" @click="addLine">
            + Add Line
          </AppButton>
        </div>
        <div class="space-y-3 w-full">
          <div
            v-for="(line, i) in lines"
            :key="i"
            class="grid grid-cols-[2fr_1fr_0.8fr_2fr_auto] gap-2 items-start w-full"
          >
            <div>
              <label v-if="i === 0" class="block text-xs text-navy-500 mb-1">Procedure Code</label>
              <AppCombobox
                :model-value="line.procedureCode"
                :options="proceduresStore.procedures"
                value-key="code"
                label-key="code"
                sublabel-key="category"
                placeholder="D0140..."
                mono
                @select="(p: ProcedureDto) => onProcedureSelect(line, p)"
                @update:model-value="line.procedureCode = $event"
              />
            </div>
            <div>
              <label v-if="i === 0" class="block text-xs text-navy-500 mb-1">Amount</label>
              <input
                v-model.number="line.claimedAmount"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-2 py-2 text-sm font-mono border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
              />
            </div>
            <div>
              <label v-if="i === 0" class="block text-xs text-navy-500 mb-1">Tooth (FDI)</label>
              <input
                v-model.number="line.toothNumber"
                type="number"
                placeholder="11"
                class="w-full px-2 py-2 text-sm font-mono border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
              />
            </div>
            <div>
              <label v-if="i === 0" class="block text-xs text-navy-500 mb-1">Documented Code</label>
              <AppCombobox
                :model-value="line.documentedProcedureCode ?? ''"
                :options="proceduresStore.procedures"
                value-key="code"
                label-key="code"
                sublabel-key="category"
                placeholder="D0140..."
                mono
                @select="(p: ProcedureDto) => onDocumentedSelect(line, p)"
                @update:model-value="line.documentedProcedureCode = $event"
              />
            </div>
            <div :class="i === 0 ? 'pt-5' : ''">
              <AppButton
                v-if="lines.length > 1"
                variant="danger"
                size="sm"
                type="button"
                @click="removeLine(i)"
              >
                Remove
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="validationError"
        class="text-xs text-red-critical bg-red-critical-light px-3 py-2 rounded-lg"
      >
        {{ validationError }}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <AppButton type="submit" variant="primary" :loading="showOverlay" :disabled="showOverlay">
          Create Claim
        </AppButton>
        <AppButton
          type="button"
          variant="secondary"
          :disabled="showOverlay"
          @click="emit('cancel')"
        >
          Cancel
        </AppButton>
      </div>
    </form>

    <!-- Validating overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showOverlay"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-white/80 backdrop-blur-sm z-10"
        role="status"
        aria-live="polite"
      >
        <svg
          class="animate-spin h-10 w-10 text-navy-auth"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <div class="text-sm font-semibold text-navy-auth tracking-wide">
          Validating Claim<span class="inline-block animate-pulse">…</span>
        </div>
        <div class="text-xs text-navy-500">
          Running integrity checks against patient, provider, and procedure catalogs
        </div>
      </div>
    </Transition>
  </GlassPanel>
</template>
