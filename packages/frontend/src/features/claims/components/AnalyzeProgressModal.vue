<script setup lang="ts">
import { computed, ref, watch, onUnmounted, nextTick } from "vue";
import type { AnalyzeClaimResponse } from "@fdcdf/shared";
import AppModal from "@/ui/AppModal.vue";
import AppButton from "@/ui/AppButton.vue";
import { humanizeDatesInText } from "@/utils/date";
import { buildStages, type Stage, type StageFinding } from "./buildStages";

interface Props {
  open: boolean;
  analysis: AnalyzeClaimResponse | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const STEP_LOADING_MS = 700;

type StageState = "pending" | "loading" | "done";

const stages = computed<Stage[]>(() =>
  props.analysis ? buildStages(props.analysis).filter((s) => s.visible) : []
);

const activeIndex = ref(0);
const stageStates = ref<StageState[]>([]);
const nextButtonRef = ref<InstanceType<typeof AppButton> | null>(null);

let timerId: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function startLoadingAt(index: number) {
  clearTimer();
  if (index < 0 || index >= stages.value.length) return;

  stageStates.value[index] = "loading";
  timerId = setTimeout(() => {
    stageStates.value[index] = "done";
    timerId = null;
    nextTick(() => {
      const el = (nextButtonRef.value as unknown as { $el?: HTMLElement } | null)?.$el;
      if (el && typeof (el as HTMLElement).focus === "function") {
        (el as HTMLElement).focus();
      }
    });
  }, STEP_LOADING_MS);
}

function reset() {
  clearTimer();
  activeIndex.value = 0;
  stageStates.value = stages.value.map(() => "pending");
  if (stages.value.length > 0) {
    startLoadingAt(0);
  }
}

function advance() {
  if (stageStates.value[activeIndex.value] !== "done") return;
  if (activeIndex.value >= stages.value.length - 1) {
    emit("close");
    return;
  }
  activeIndex.value += 1;
  startLoadingAt(activeIndex.value);
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      reset();
    } else {
      clearTimer();
    }
  },
  { immediate: true }
);

onUnmounted(() => clearTimer());

const activeState = computed(() => stageStates.value[activeIndex.value]);
const isLastStage = computed(() => activeIndex.value === stages.value.length - 1);
const advanceLabel = computed(() => (isLastStage.value ? "Done" : "Next"));

function severityClass(severity: StageFinding["severity"]): string {
  switch (severity) {
    case "LOW":
      return "bg-blue-clinical-light text-blue-clinical";
    case "MEDIUM":
    case "HIGH":
      return "bg-amber-alert-light text-amber-alert";
    case "CRITICAL":
      return "bg-red-critical-light text-red-critical";
    default:
      return "bg-surface-glass text-navy-500";
  }
}
</script>

<template>
  <AppModal
    v-if="open && analysis"
    title="Analysis in progress"
    size="md"
    @close="emit('close')"
  >
    <ol role="list" class="space-y-4">
      <li
        v-for="(stage, index) in stages"
        :key="stage.id"
        role="listitem"
        class="flex gap-3"
        :aria-current="index === activeIndex ? 'step' : undefined"
      >
        <div
          class="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center"
          :class="{
            'bg-surface-glass text-navy-500': stageStates[index] === 'pending',
            'bg-amber-alert-light text-amber-alert': stageStates[index] === 'loading',
            'bg-blue-clinical-light text-blue-clinical': stageStates[index] === 'done',
          }"
          :aria-label="stageStates[index] === 'done' ? 'Complete' : stageStates[index] === 'loading' ? 'Working' : 'Pending'"
        >
          <svg v-if="stageStates[index] === 'pending'" class="h-2 w-2" viewBox="0 0 8 8" fill="currentColor">
            <circle cx="4" cy="4" r="4" />
          </svg>
          <svg v-else-if="stageStates[index] === 'loading'" class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex-1 min-w-0" :class="{ 'opacity-50': stageStates[index] === 'pending' }">
          <div class="text-sm font-medium text-navy-auth">{{ stage.title }}</div>

          <div v-if="stageStates[index] === 'loading'" class="text-xs text-navy-500 mt-0.5">Working…</div>

          <template v-else-if="stageStates[index] === 'done'">
            <div class="text-xs text-navy-500 mt-0.5">{{ stage.headline }}</div>
            <ul v-if="stage.findings.length" class="mt-2 space-y-2">
              <li
                v-for="finding in stage.findings"
                :key="finding.id"
                class="flex items-start gap-2 text-xs"
              >
                <span
                  v-if="finding.severity"
                  class="flex-shrink-0 font-medium px-2 py-0.5 rounded-full"
                  :class="severityClass(finding.severity)"
                >
                  {{ finding.severity }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-navy-auth font-medium">{{ finding.label }}</div>
                  <div class="text-navy-500 mt-0.5">{{ humanizeDatesInText(finding.detail) }}</div>
                </div>
              </li>
            </ul>
          </template>
        </div>
      </li>
    </ol>

    <template #footer>
      <div class="flex justify-end">
        <AppButton
          ref="nextButtonRef"
          size="sm"
          :disabled="activeState !== 'done'"
          @click="advance"
        >
          {{ advanceLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
