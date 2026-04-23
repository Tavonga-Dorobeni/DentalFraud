import { computed, type Ref } from "vue";
import type { ClaimLineDto } from "@fdcdf/shared";

/**
 * FDI tooth numbering: quadrant (1-4 permanent, 5-8 primary) + tooth (1-8 or 1-5)
 * Upper right: 11-18, Upper left: 21-28, Lower left: 31-38, Lower right: 41-48
 */

/** All 32 permanent teeth in FDI notation */
export const PERMANENT_TEETH = [
  // Upper right (Q1)
  18, 17, 16, 15, 14, 13, 12, 11,
  // Upper left (Q2)
  21, 22, 23, 24, 25, 26, 27, 28,
  // Lower left (Q3)
  38, 37, 36, 35, 34, 33, 32, 31,
  // Lower right (Q4)
  41, 42, 43, 44, 45, 46, 47, 48,
] as const;

export const UPPER_TEETH = PERMANENT_TEETH.filter((t) => t < 30);
export const LOWER_TEETH = PERMANENT_TEETH.filter((t) => t >= 30);

/** Get the quadrant number for an FDI tooth (1-4) */
export function getQuadrant(toothNumber: number): number {
  return Math.floor(toothNumber / 10);
}

/** Map claim lines to tooth numbers that are flagged */
export function useDentalMap(
  claimLines: Ref<ClaimLineDto[]>,
  selectedTooth: Ref<number | null>
) {
  const flaggedTeeth = computed(() =>
    claimLines.value
      .filter((l) => l.toothNumber != null)
      .map((l) => l.toothNumber!)
  );

  const selectedLine = computed(() => {
    if (!selectedTooth.value) return null;
    return (
      claimLines.value.find((l) => l.toothNumber === selectedTooth.value) ??
      null
    );
  });

  function getToothState(toothNumber: number) {
    const isFlagged = flaggedTeeth.value.includes(toothNumber);
    const isSelected = selectedTooth.value === toothNumber;
    return { isFlagged, isSelected };
  }

  return {
    flaggedTeeth,
    selectedLine,
    getToothState,
  };
}
