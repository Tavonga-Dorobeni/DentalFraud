<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, reactive, ref, watch, nextTick } from "vue";

interface Props {
  modelValue: string | null | undefined;
  options: T[];
  valueKey: keyof T;
  labelKey: keyof T;
  sublabelKey?: keyof T;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  mono?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Select...",
  required: false,
  disabled: false,
  mono: false,
  sublabelKey: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  select: [option: T];
}>();

const query = ref("");
const open = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);
const menuPos = reactive({ top: 0, bottom: 0, left: 0, width: 0, openUp: false, maxHeight: 240 });

const selectedOption = computed(() =>
  props.options.find((o) => String(o[props.valueKey]) === String(props.modelValue))
);

watch(
  selectedOption,
  (opt) => {
    if (opt) query.value = String(opt[props.labelKey]);
    else if (!open.value) query.value = "";
  },
  { immediate: true }
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => {
    const label = String(o[props.labelKey]).toLowerCase();
    const value = String(o[props.valueKey]).toLowerCase();
    const sub = props.sublabelKey ? String(o[props.sublabelKey] ?? "").toLowerCase() : "";
    return label.includes(q) || value.includes(q) || sub.includes(q);
  });
});

function updatePosition() {
  if (!inputEl.value) return;
  const rect = inputEl.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const desired = 240;
  const openUp = spaceBelow < desired && spaceAbove > spaceBelow;
  menuPos.top = rect.bottom + 4;
  menuPos.bottom = window.innerHeight - rect.top + 4;
  menuPos.left = rect.left;
  menuPos.width = rect.width;
  menuPos.openUp = openUp;
  menuPos.maxHeight = Math.max(160, Math.min(desired, openUp ? spaceAbove - 8 : spaceBelow - 8));
}

function onFocus() {
  open.value = true;
  if (selectedOption.value) query.value = "";
  nextTick(updatePosition);
  window.addEventListener("scroll", updatePosition, true);
  window.addEventListener("resize", updatePosition);
}

function closeMenu() {
  open.value = false;
  if (selectedOption.value) {
    query.value = String(selectedOption.value[props.labelKey]);
  }
  window.removeEventListener("scroll", updatePosition, true);
  window.removeEventListener("resize", updatePosition);
}

function onBlur() {
  setTimeout(closeMenu, 150);
}

function pick(opt: T) {
  const v = String(opt[props.valueKey]);
  emit("update:modelValue", v);
  emit("select", opt);
  query.value = String(opt[props.labelKey]);
  closeMenu();
}

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updatePosition, true);
  window.removeEventListener("resize", updatePosition);
});
</script>

<template>
  <div class="relative">
    <input
      ref="inputEl"
      v-model="query"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="[
        'w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical bg-white',
        mono && 'font-mono',
      ]"
      autocomplete="off"
      @focus="onFocus"
      @blur="onBlur"
      @input="open = true; updatePosition()"
    />
    <Teleport to="body">
      <div
        v-if="open && filtered.length"
        class="fixed z-[60] overflow-auto rounded-lg border border-border-subtle bg-white shadow-lg"
        :style="{
          top: menuPos.openUp ? 'auto' : menuPos.top + 'px',
          bottom: menuPos.openUp ? menuPos.bottom + 'px' : 'auto',
          left: menuPos.left + 'px',
          width: menuPos.width + 'px',
          maxHeight: menuPos.maxHeight + 'px',
        }"
      >
        <button
          v-for="opt in filtered"
          :key="String(opt[valueKey])"
          type="button"
          class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-b-0 border-border-subtle/50"
          @mousedown.prevent="pick(opt)"
        >
          <div :class="['font-medium text-navy-auth', mono && 'font-mono']">
            {{ opt[labelKey] }}
          </div>
          <div class="text-xs text-navy-500 flex gap-2">
            <span :class="mono ? '' : 'font-mono'">{{ opt[valueKey] }}</span>
            <span v-if="sublabelKey && opt[sublabelKey]">· {{ opt[sublabelKey] }}</span>
          </div>
        </button>
      </div>
      <div
        v-else-if="open && !filtered.length"
        class="fixed z-[60] rounded-lg border border-border-subtle bg-white shadow-lg px-3 py-2 text-xs text-navy-500"
        :style="{
          top: menuPos.top + 'px',
          left: menuPos.left + 'px',
          width: menuPos.width + 'px',
        }"
      >
        No matches
      </div>
    </Teleport>
  </div>
</template>
