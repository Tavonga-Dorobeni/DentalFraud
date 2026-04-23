<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { UPPER_TEETH, LOWER_TEETH, getQuadrant } from "./composables/useDentalMap";

interface Props {
  flaggedTeeth?: number[];
  selectedTooth?: number | null;
  historicalTeeth?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  flaggedTeeth: () => [],
  selectedTooth: null,
  historicalTeeth: () => [],
});

const emit = defineEmits<{
  select: [toothNumber: number];
}>();

const hoveredTooth = ref<number | null>(null);

// ViewBox for quadrant zoom
const viewBox = ref("0 0 400 240");

watch(
  () => props.selectedTooth,
  (tooth) => {
    if (!tooth) {
      viewBox.value = "0 0 400 240";
      return;
    }
    const q = getQuadrant(tooth);
    // Zoom to quadrant
    switch (q) {
      case 1: viewBox.value = "180 0 220 120"; break;   // Upper right
      case 2: viewBox.value = "0 0 220 120"; break;     // Upper left
      case 3: viewBox.value = "0 120 220 120"; break;   // Lower left
      case 4: viewBox.value = "180 120 220 120"; break;  // Lower right
      default: viewBox.value = "0 0 400 240";
    }
  }
);

function toothClass(tooth: number) {
  const isFlagged = props.flaggedTeeth.includes(tooth);
  const isSelected = props.selectedTooth === tooth;
  const isHistorical = props.historicalTeeth.includes(tooth);
  const isHovered = hoveredTooth.value === tooth;

  return {
    "fill-blue-clinical-light": isHistorical && !isFlagged && !isSelected,
    "fill-red-critical/20 animate-soft-pulse": isFlagged && !isSelected,
    "fill-blue-clinical/30 stroke-blue-clinical stroke-2": isSelected,
    "fill-border-subtle": !isFlagged && !isSelected && !isHistorical,
    "brightness-110": isHovered && !isSelected,
  };
}

function toothStroke(tooth: number) {
  const isSelected = props.selectedTooth === tooth;
  const isFlagged = props.flaggedTeeth.includes(tooth);
  if (isSelected) return "var(--color-blue-clinical)";
  if (isFlagged) return "var(--color-red-critical)";
  return "var(--color-navy-500)";
}

// Tooth positions for the arch layout
const toothWidth = 20;
const toothHeight = 28;
const gap = 3;
const archPadding = 10;

function toothX(teeth: readonly number[], index: number): number {
  return archPadding + index * (toothWidth + gap);
}

const upperY = 20;
const lowerY = 140;

// Map for tooltip
const toothLabels: Record<number, string> = {};
for (const t of [...UPPER_TEETH, ...LOWER_TEETH]) {
  const q = getQuadrant(t);
  const pos = t % 10;
  const names = ["", "Central Incisor", "Lateral Incisor", "Canine", "1st Premolar", "2nd Premolar", "1st Molar", "2nd Molar", "3rd Molar"];
  const quadrantNames = ["", "Upper Right", "Upper Left", "Lower Left", "Lower Right"];
  toothLabels[t] = `${quadrantNames[q]} ${names[pos]} (${t})`;
}
</script>

<template>
  <div class="border border-border-subtle rounded-xl p-4 bg-clinical-bg">
    <div class="text-xs text-navy-500 mb-2 flex items-center justify-between">
      <span>Dental Arch — FDI Notation</span>
      <button
        v-if="selectedTooth"
        class="text-blue-clinical hover:underline text-[10px]"
        @click="emit('select', 0)"
      >
        Reset zoom
      </button>
    </div>

    <svg
      :viewBox="viewBox"
      class="w-full transition-all duration-500"
      style="max-height: 280px"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Upper arch label -->
      <text x="200" y="14" text-anchor="middle" class="fill-navy-500" style="font-size: 8px">UPPER</text>

      <!-- Upper teeth (right to left: 18..11, 21..28) -->
      <g v-for="(tooth, i) in UPPER_TEETH" :key="'upper-' + tooth">
        <rect
          :id="'tooth-' + tooth"
          :x="toothX(UPPER_TEETH, i)"
          :y="upperY"
          :width="toothWidth"
          :height="toothHeight"
          rx="4"
          ry="4"
          :class="toothClass(tooth)"
          :stroke="toothStroke(tooth)"
          stroke-width="1"
          class="cursor-pointer transition-all duration-200"
          :aria-label="toothLabels[tooth]"
          role="button"
          tabindex="0"
          @click="emit('select', tooth)"
          @mouseenter="hoveredTooth = tooth"
          @mouseleave="hoveredTooth = null"
          @keydown.enter="emit('select', tooth)"
        />
        <text
          :x="toothX(UPPER_TEETH, i) + toothWidth / 2"
          :y="upperY + toothHeight / 2 + 3"
          text-anchor="middle"
          class="fill-navy-auth pointer-events-none select-none"
          style="font-size: 7px; font-family: 'Roboto Mono', monospace"
        >
          {{ tooth }}
        </text>
      </g>

      <!-- Center line -->
      <line x1="200" y1="15" x2="200" y2="175" stroke="var(--color-border-subtle)" stroke-width="0.5" stroke-dasharray="3,3" />

      <!-- Lower arch label -->
      <text x="200" y="135" text-anchor="middle" class="fill-navy-500" style="font-size: 8px">LOWER</text>

      <!-- Lower teeth (left to right: 38..31, 41..48) -->
      <g v-for="(tooth, i) in LOWER_TEETH" :key="'lower-' + tooth">
        <rect
          :id="'tooth-' + tooth"
          :x="toothX(LOWER_TEETH, i)"
          :y="lowerY"
          :width="toothWidth"
          :height="toothHeight"
          rx="4"
          ry="4"
          :class="toothClass(tooth)"
          :stroke="toothStroke(tooth)"
          stroke-width="1"
          class="cursor-pointer transition-all duration-200"
          :aria-label="toothLabels[tooth]"
          role="button"
          tabindex="0"
          @click="emit('select', tooth)"
          @mouseenter="hoveredTooth = tooth"
          @mouseleave="hoveredTooth = null"
          @keydown.enter="emit('select', tooth)"
        />
        <text
          :x="toothX(LOWER_TEETH, i) + toothWidth / 2"
          :y="lowerY + toothHeight / 2 + 3"
          text-anchor="middle"
          class="fill-navy-auth pointer-events-none select-none"
          style="font-size: 7px; font-family: 'Roboto Mono', monospace"
        >
          {{ tooth }}
        </text>
      </g>

      <!-- Hover tooltip -->
      <g v-if="hoveredTooth" class="pointer-events-none">
        <rect
          x="100" y="195"
          width="200" height="20"
          rx="4"
          fill="var(--color-navy-auth)"
          opacity="0.9"
        />
        <text x="200" y="209" text-anchor="middle" fill="white" style="font-size: 8px; font-family: 'Inter', sans-serif">
          {{ toothLabels[hoveredTooth] }}
        </text>
      </g>
    </svg>
  </div>
</template>
