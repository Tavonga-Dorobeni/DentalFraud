<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useToast } from "@/composables/useToast";
import GlassPanel from "@/ui/GlassPanel.vue";
import IntegrityShield from "@/ui/IntegrityShield.vue";
import AppButton from "@/ui/AppButton.vue";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

async function handleLogin() {
  errorMessage.value = "";

  if (!email.value || !password.value) {
    errorMessage.value = "Email and password are required.";
    return;
  }

  loading.value = true;
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push("/");
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
        ?.message || "Invalid email or password.";
    errorMessage.value = message;
    toast.error(message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-navy-auth flex items-center justify-center px-4">
    <GlassPanel class="w-full max-w-sm">
      <div class="flex flex-col items-center gap-6">
        <!-- Logo -->
        <div class="flex flex-col items-center gap-2">
          <IntegrityShield size="lg" />
          <h1 class="text-xl font-semibold text-navy-auth tracking-tight">FDCDSS</h1>
          <p class="text-xs text-navy-500">Forensic Dental Claims Decision Support System</p>
        </div>

        <!-- Form -->
        <form class="w-full space-y-4" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-xs font-medium text-navy-500 mb-1">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical focus:border-transparent"
              placeholder="analyst@company.com"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-medium text-navy-500 mb-1">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="text-xs text-red-critical bg-red-critical-light px-3 py-2 rounded-lg">
            {{ errorMessage }}
          </div>

          <AppButton type="submit" variant="primary" size="md" :loading="loading" class="w-full">
            Sign In
          </AppButton>
        </form>
      </div>
    </GlassPanel>
  </div>
</template>
