import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import StackedShareBar from "@/features/reports/components/StackedShareBar.vue";

vi.mock("vue-chartjs", () => ({
  Bar: {
    name: "Bar",
    props: ["data", "options"],
    template: `<canvas data-test="chart-canvas" />`,
  },
}));

describe("StackedShareBar.vue", () => {
  it("renders a skeleton when loading", () => {
    const wrapper = mount(StackedShareBar, {
      props: { series: null, loading: true, error: false, title: "Decisions" },
    });
    expect(wrapper.find('[data-test="chart-skeleton"]').exists()).toBe(true);
  });

  it("renders error with a retry button", async () => {
    const onRetry = vi.fn();
    const wrapper = mount(StackedShareBar, {
      props: {
        series: null,
        loading: false,
        error: true,
        title: "Decisions",
        onRetry,
      },
    });
    await wrapper.find('[data-test="chart-retry"]').trigger("click");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders empty state when series is empty", () => {
    const wrapper = mount(StackedShareBar, {
      props: { series: [], loading: false, error: false, title: "Decisions" },
    });
    expect(wrapper.text()).toContain("No data yet");
  });

  it("renders the canvas when series has points", () => {
    const wrapper = mount(StackedShareBar, {
      props: {
        series: [
          { label: "LEGITIMATE", value: 4 },
          { label: "CONFIRMED_FRAUD", value: 1 },
        ],
        loading: false,
        error: false,
        title: "Decisions",
      },
    });
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(true);
  });
});
