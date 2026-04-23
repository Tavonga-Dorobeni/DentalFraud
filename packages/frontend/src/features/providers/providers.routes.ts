import { UserRole } from "@fdcdf/shared";
import type { RouteRecordRaw } from "vue-router";

export const providersRoutes: RouteRecordRaw[] = [
  {
    path: "providers",
    name: "providers-list",
    component: () => import("./ProvidersListView.vue"),
    meta: {
      roles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN],
    },
  },
];
