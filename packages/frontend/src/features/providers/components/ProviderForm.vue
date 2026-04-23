<script setup lang="ts">
import { reactive, watch } from "vue";
import type { ProviderDto } from "@fdcdf/shared";
import AppButton from "@/ui/AppButton.vue";
import GlassPanel from "@/ui/GlassPanel.vue";

interface Props {
  initial?: ProviderDto | null;
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), { initial: null, submitting: false });

const emit = defineEmits<{
  submit: [data: { externalId: string; name: string; specialty?: string }];
  cancel: [];
}>();

const form = reactive({
  externalId: "",
  name: "",
  specialty: "",
});

watch(
  () => props.initial,
  (p) => {
    form.externalId = p?.externalId ?? "";
    form.name = p?.name ?? "";
    form.specialty = p?.specialty ?? "";
  },
  { immediate: true }
);

function handleSubmit() {
  emit("submit", {
    externalId: form.externalId.trim(),
    name: form.name.trim(),
    specialty: form.specialty.trim() || undefined,
  });
}
</script>

<template>
  <GlassPanel>
    <h2 class="text-lg font-semibold text-navy-auth mb-4">
      {{ initial ? "Edit Provider" : "New Provider" }}
    </h2>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-xs font-medium text-navy-500 mb-1">External ID</label>
        <input
          v-model="form.externalId"
          required
          class="w-full px-3 py-2 text-sm font-mono border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-navy-500 mb-1">Name</label>
        <input
          v-model="form.name"
          required
          class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-navy-500 mb-1">Specialty</label>
        <input
          v-model="form.specialty"
          class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
        />
      </div>
      <div class="flex gap-3 pt-2">
        <AppButton type="submit" variant="primary" :loading="submitting">
          {{ initial ? "Save Changes" : "Create Provider" }}
        </AppButton>
        <AppButton type="button" variant="secondary" @click="emit('cancel')">Cancel</AppButton>
      </div>
    </form>
  </GlassPanel>
</template>
