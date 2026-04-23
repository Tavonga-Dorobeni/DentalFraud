<script setup lang="ts">
import { reactive, watch } from "vue";
import type { ProcedureDto } from "@fdcdf/shared";
import AppButton from "@/ui/AppButton.vue";
import GlassPanel from "@/ui/GlassPanel.vue";

interface Props {
  initial?: ProcedureDto | null;
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), { initial: null, submitting: false });

const emit = defineEmits<{
  submit: [data: {
    code: string;
    description: string;
    category: string;
    complexityLevel: number;
    requiresEvidence: boolean;
    allowedDentition: "PRIMARY" | "PERMANENT" | "BOTH";
  }];
  cancel: [];
}>();

const form = reactive({
  code: "",
  description: "",
  category: "",
  complexityLevel: 1,
  requiresEvidence: false,
  allowedDentition: "BOTH" as "PRIMARY" | "PERMANENT" | "BOTH",
});

watch(
  () => props.initial,
  (p) => {
    form.code = p?.code ?? "";
    form.description = p?.description ?? "";
    form.category = p?.category ?? "";
    form.complexityLevel = p?.complexityLevel ?? 1;
    form.requiresEvidence = p?.requiresEvidence ?? false;
    form.allowedDentition = p?.allowedDentition ?? "BOTH";
  },
  { immediate: true }
);

function handleSubmit() {
  emit("submit", {
    code: form.code.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    complexityLevel: Number(form.complexityLevel),
    requiresEvidence: form.requiresEvidence,
    allowedDentition: form.allowedDentition,
  });
}
</script>

<template>
  <GlassPanel>
    <h2 class="text-lg font-semibold text-navy-auth mb-4">
      {{ initial ? "Edit Procedure" : "New Procedure" }}
    </h2>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-navy-500 mb-1">Code</label>
          <input
            v-model="form.code"
            required
            placeholder="D0140"
            class="w-full px-3 py-2 text-sm font-mono border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-navy-500 mb-1">Category</label>
          <input
            v-model="form.category"
            required
            placeholder="Diagnostic"
            class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
          />
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-navy-500 mb-1">Description</label>
        <textarea
          v-model="form.description"
          required
          rows="2"
          class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
        />
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-navy-500 mb-1">Complexity (1-5)</label>
          <input
            v-model.number="form.complexityLevel"
            type="number"
            min="1"
            max="5"
            required
            class="w-full px-3 py-2 text-sm font-mono border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-navy-500 mb-1">Dentition</label>
          <select
            v-model="form.allowedDentition"
            class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical bg-white"
          >
            <option value="BOTH">Both</option>
            <option value="PERMANENT">Permanent</option>
            <option value="PRIMARY">Primary</option>
          </select>
        </div>
        <div class="flex items-center pt-5">
          <label class="flex items-center gap-2 text-sm text-navy-auth">
            <input v-model="form.requiresEvidence" type="checkbox" class="rounded" />
            Requires evidence
          </label>
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <AppButton type="submit" variant="primary" :loading="submitting">
          {{ initial ? "Save Changes" : "Create Procedure" }}
        </AppButton>
        <AppButton type="button" variant="secondary" @click="emit('cancel')">Cancel</AppButton>
      </div>
    </form>
  </GlassPanel>
</template>
