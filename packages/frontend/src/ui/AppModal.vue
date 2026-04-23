<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

interface Props {
  title?: string;
  size?: "md" | "lg" | "xl";
}

const props = withDefaults(defineProps<Props>(), { size: "md" });

const sizeClass = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
}[props.size];
const emit = defineEmits<{ close: [] }>();

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") emit("close");
};

onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-navy-auth/40 backdrop-blur-sm"
        @click="emit('close')"
      />
      <!-- Panel -->
      <div
        :class="['glass relative z-10 rounded-xl shadow-xl w-full mx-4 max-h-[85vh] overflow-y-auto', sizeClass]"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 class="text-lg font-semibold text-navy-auth">{{ title }}</h2>
          <button
            class="text-navy-500 hover:text-navy-auth transition-colors"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="px-6 py-4">
          <slot />
        </div>
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-border-subtle">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
