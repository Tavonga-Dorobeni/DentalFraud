import { UserRole } from "@fdcdf/shared";
import type { RouteRecordRaw } from "vue-router";

export const auditRoutes: RouteRecordRaw[] = [
  {
    path: "audit-trail",
    name: "audit-trail",
    component: () => import("./AuditTrailView.vue"),
    meta: { roles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR] },
  },
];
