import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { ResolutionStatus } from "@fdcdf/shared";
import ResolutionStatusBadge from "@/features/claims/components/ResolutionStatusBadge.vue";

describe("ResolutionStatusBadge", () => {
  const cases: Array<[ResolutionStatus, string, string]> = [
    [ResolutionStatus.PENDING_REVIEW, "Pending Review", "navy-500"],
    [ResolutionStatus.IN_REVIEW, "In Review", "blue-clinical"],
    [ResolutionStatus.CLEARED, "Cleared", "blue-clinical"],
    [ResolutionStatus.EDUCATION_FLAGGED, "Education Flagged", "amber-alert"],
    [ResolutionStatus.CONFIRMED_FRAUD, "Confirmed Fraud", "red-critical"],
  ];

  for (const [status, label, colorFragment] of cases) {
    it(`renders "${label}" with the ${colorFragment} color for ${status}`, () => {
      const wrapper = mount(ResolutionStatusBadge, {
        props: { status },
      });
      expect(wrapper.text()).toBe(label);
      expect(wrapper.classes().join(" ")).toContain(colorFragment);
    });
  }
});
