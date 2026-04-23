<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import IntegrityShield from "@/ui/IntegrityShield.vue";
import PeripheralPulse from "@/features/alerts/components/PeripheralPulse.vue";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const authStore = useAuthStore();

const navItems = computed(() => {
  const items = [
    { label: "Dashboard", path: "/", icon: "grid" },
    { label: "Claims", path: "/claims", icon: "file" },
    { label: "Patients", path: "/patients", icon: "user" },
    { label: "Providers", path: "/providers", icon: "stethoscope" },
    { label: "Procedures", path: "/procedures", icon: "list" },
  ];
  if (authStore.canViewAlerts) {
    items.push({ label: "Alerts", path: "/alerts", icon: "bell" });
  }
  items.push({ label: "Audit Trail", path: "/audit-trail", icon: "history" });
  return items;
});

function navigateTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="flex h-screen bg-clinical-bg">
    <!-- Peripheral Pulse bar (alerts-bound; hidden for roles without alert access) -->
    <PeripheralPulse v-if="authStore.canViewAlerts" />

    <!-- Sidebar -->
    <aside class="w-56 flex-shrink-0 border-r border-border-subtle bg-clinical-bg flex flex-col">
      <!-- Brand -->
      <div class="flex items-center gap-3 px-4 py-5 border-b border-border-subtle">
        <IntegrityShield size="sm" />
        <div>
          <div class="font-semibold text-sm text-navy-auth tracking-tight">FDCDSS</div>
          <div class="text-[10px] text-navy-500 leading-tight">Decision Support</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors"
          :class="
            $route.path === item.path || ($route.path.startsWith(item.path) && item.path !== '/')
              ? 'bg-blue-clinical/10 text-blue-clinical font-medium'
              : 'text-navy-500 hover:bg-surface-glass hover:text-navy-auth'
          "
          @click="navigateTo(item.path)"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="h-14 flex items-center justify-end px-6 border-b border-border-subtle flex-shrink-0">
        <div class="flex items-center gap-4">
          <span v-if="authStore.user" class="text-xs text-navy-500">
            {{ authStore.user.email }}
            <span class="ml-1 px-1.5 py-0.5 bg-surface-glass border border-border-subtle rounded text-[10px] font-medium">
              {{ authStore.user.role }}
            </span>
          </span>
          <button
            class="text-xs text-navy-500 hover:text-red-critical transition-colors"
            @click="authStore.logout(); router.push('/login')"
          >
            Sign Out
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
