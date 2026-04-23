<script setup lang="ts">
import { RouterView } from "vue-router";
import { useToast } from "@/composables/useToast";

const { toasts, dismiss } = useToast();
</script>

<template>
  <RouterView />

  <!-- Toast notifications -->
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm cursor-pointer"
        :class="{
          'bg-green-legitimate text-white': t.type === 'success',
          'bg-red-critical text-white': t.type === 'error',
          'bg-amber-alert text-navy-auth': t.type === 'warning',
          'bg-navy-auth text-white': t.type === 'info',
        }"
        @click="dismiss(t.id)"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
