import { UserRole } from "@fdcdf/shared";
import type { RouteRecordRaw } from "vue-router";

export const alertsRoutes: RouteRecordRaw[] = [
  {
    path: "alerts",
    name: "alerts-list",
    component: () => import("./AlertsListView.vue"),
    meta: { roles: [UserRole.ADMIN, UserRole.INVESTIGATOR] },
  },
  {
    path: "alerts/:alertId",
    name: "alert-detail",
    component: () => import("./AlertDetailView.vue"),
    meta: { roles: [UserRole.ADMIN, UserRole.INVESTIGATOR] },
  },
];
