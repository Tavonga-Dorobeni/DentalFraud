<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  loading: false,
  disabled: false,
  type: "button",
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      {
        'bg-navy-auth text-white hover:bg-navy-600 focus:ring-navy-500': variant === 'primary',
        'border border-border-subtle text-navy-auth hover:bg-surface-glass focus:ring-blue-clinical': variant === 'secondary',
        'bg-red-critical text-white hover:bg-red-700 focus:ring-red-critical': variant === 'danger',
      },
      {
        'px-2.5 py-1 text-xs gap-1.5': size === 'sm',
        'px-4 py-2 text-sm gap-2': size === 'md',
        'px-6 py-3 text-base gap-2.5': size === 'lg',
      },
    ]"
  >
    <svg
      v-if="loading"
      class="animate-spin"
      :class="{ 'h-3 w-3': size === 'sm', 'h-4 w-4': size === 'md', 'h-5 w-5': size === 'lg' }"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
