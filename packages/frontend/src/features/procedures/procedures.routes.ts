import { UserRole } from "@fdcdf/shared";
import type { RouteRecordRaw } from "vue-router";

export const proceduresRoutes: RouteRecordRaw[] = [
  {
    path: "procedures",
    name: "procedures-list",
    component: () => import("./ProceduresListView.vue"),
    meta: {
      roles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN],
    },
  },
];
