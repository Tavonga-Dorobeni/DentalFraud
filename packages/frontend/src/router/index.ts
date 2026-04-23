import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import type { UserRole } from "@fdcdf/shared";
import { useAuthStore } from "@/stores/auth.store";
import AppLayout from "@/layouts/AppLayout.vue";
import { authRoutes } from "@/features/auth/auth.routes";
import { claimsRoutes } from "@/features/claims/claims.routes";
import { alertsRoutes } from "@/features/alerts/alerts.routes";
import { patientsRoutes } from "@/features/patients/patients.routes";
import { providersRoutes } from "@/features/providers/providers.routes";
import { proceduresRoutes } from "@/features/procedures/procedures.routes";
import { auditRoutes } from "@/features/audit/audit.routes";

// Extend route meta to include auth requirements
declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: UserRole[];
  }
}

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  {
    path: "/",
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "dashboard",
        component: () => import("@/features/dashboard/DashboardView.vue"),
      },
      ...claimsRoutes,
      ...alertsRoutes,
      ...patientsRoutes,
      ...providersRoutes,
      ...proceduresRoutes,
      ...auditRoutes,
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Routes that don't require auth (login page)
  if (to.meta.requiresAuth === false) {
    if (authStore.isAuthenticated) {
      return next("/");
    }
    return next();
  }

  // Check authentication
  if (!authStore.isAuthenticated) {
    return next("/login");
  }

  // Check role-based access
  const requiredRoles = to.meta.roles;
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = authStore.user?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return next("/");
    }
  }

  next();
});
