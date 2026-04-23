<script setup lang="ts">
interface Props {
  shape?: "line" | "circle" | "rect";
  width?: string;
  height?: string;
}

withDefaults(defineProps<Props>(), {
  shape: "line",
  width: "100%",
  height: "1rem",
});
</script>

<template>
  <div
    class="animate-skeleton"
    :class="{
      'rounded': shape === 'line',
      'rounded-full': shape === 'circle',
      'rounded-lg': shape === 'rect',
    }"
    :style="{ width, height }"
  />
</template>
