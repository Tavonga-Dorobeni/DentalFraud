import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import DoughnutChart from "@/features/reports/components/DoughnutChart.vue";

vi.mock("vue-chartjs", () => ({
  Doughnut: {
    name: "Doughnut",
    props: ["data", "options"],
    template: `<canvas data-test="chart-canvas" />`,
  },
}));

describe("DoughnutChart.vue", () => {
  it("renders a skeleton when loading is true", () => {
    const wrapper = mount(DoughnutChart, {
      props: { series: null, loading: true, error: false, title: "Risk bands" },
    });
    expect(wrapper.find('[data-test="chart-skeleton"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(false);
  });

  it("renders the error state with a retry button when error is true", async () => {
    const onRetry = vi.fn();
    const wrapper = mount(DoughnutChart, {
      props: {
        series: null,
        loading: false,
        error: true,
        title: "Risk bands",
        onRetry,
      },
    });
    expect(wrapper.text()).toContain("Could not load chart");
    await wrapper.find('[data-test="chart-retry"]').trigger("click");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders an empty-state message when series is empty", () => {
    const wrapper = mount(DoughnutChart, {
      props: { series: [], loading: false, error: false, title: "Risk bands" },
    });
    expect(wrapper.text()).toContain("No data yet");
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(false);
  });

  it("renders the canvas when series has points", () => {
    const wrapper = mount(DoughnutChart, {
      props: {
        series: [
          { label: "LOW", value: 2 },
          { label: "CRITICAL", value: 1 },
        ],
        loading: false,
        error: false,
        title: "Risk bands",
      },
    });
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Risk bands");
  });
});
