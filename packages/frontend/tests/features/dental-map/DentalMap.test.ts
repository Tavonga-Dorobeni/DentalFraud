import { describe, it, expect } from "vitest";
import {
  PERMANENT_TEETH,
  UPPER_TEETH,
  LOWER_TEETH,
  getQuadrant,
} from "@/features/dental-map/composables/useDentalMap";

describe("dental map utilities", () => {
  it("has 32 permanent teeth", () => {
    expect(PERMANENT_TEETH).toHaveLength(32);
  });

  it("splits into 16 upper and 16 lower", () => {
    expect(UPPER_TEETH).toHaveLength(16);
    expect(LOWER_TEETH).toHaveLength(16);
  });

  it("getQuadrant returns correct quadrant", () => {
    expect(getQuadrant(11)).toBe(1);
    expect(getQuadrant(18)).toBe(1);
    expect(getQuadrant(21)).toBe(2);
    expect(getQuadrant(28)).toBe(2);
    expect(getQuadrant(31)).toBe(3);
    expect(getQuadrant(38)).toBe(3);
    expect(getQuadrant(41)).toBe(4);
    expect(getQuadrant(48)).toBe(4);
  });

  it("all permanent teeth have valid FDI numbers", () => {
    for (const tooth of PERMANENT_TEETH) {
      const quadrant = getQuadrant(tooth);
      const position = tooth % 10;
      expect(quadrant).toBeGreaterThanOrEqual(1);
      expect(quadrant).toBeLessThanOrEqual(4);
      expect(position).toBeGreaterThanOrEqual(1);
      expect(position).toBeLessThanOrEqual(8);
    }
  });

  it("upper teeth are all in quadrants 1 and 2", () => {
    for (const tooth of UPPER_TEETH) {
      const q = getQuadrant(tooth);
      expect(q === 1 || q === 2).toBe(true);
    }
  });

  it("lower teeth are all in quadrants 3 and 4", () => {
    for (const tooth of LOWER_TEETH) {
      const q = getQuadrant(tooth);
      expect(q === 3 || q === 4).toBe(true);
    }
  });
});
