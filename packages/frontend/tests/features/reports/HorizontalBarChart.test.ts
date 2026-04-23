import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import HorizontalBarChart from "@/features/reports/components/HorizontalBarChart.vue";

vi.mock("vue-chartjs", () => ({
  Bar: {
    name: "Bar",
    props: ["data", "options"],
    template: `<canvas data-test="chart-canvas" />`,
  },
}));

describe("HorizontalBarChart.vue", () => {
  it("renders a skeleton when loading", () => {
    const wrapper = mount(HorizontalBarChart, {
      props: { series: null, loading: true, error: false, title: "Rule frequency" },
    });
    expect(wrapper.find('[data-test="chart-skeleton"]').exists()).toBe(true);
  });

  it("renders error with a retry button", async () => {
    const onRetry = vi.fn();
    const wrapper = mount(HorizontalBarChart, {
      props: {
        series: null,
        loading: false,
        error: true,
        title: "Rule frequency",
        onRetry,
      },
    });
    await wrapper.find('[data-test="chart-retry"]').trigger("click");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders empty state when series is empty", () => {
    const wrapper = mount(HorizontalBarChart, {
      props: { series: [], loading: false, error: false, title: "Rule frequency" },
    });
    expect(wrapper.text()).toContain("No data yet");
  });

  it("renders the canvas when series has points", () => {
    const wrapper = mount(HorizontalBarChart, {
      props: {
        series: [{ label: "DUPLICATE_CLAIM", value: 3 }],
        loading: false,
        error: false,
        title: "Rule frequency",
      },
    });
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Rule frequency");
  });
});
