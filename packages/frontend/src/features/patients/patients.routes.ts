import { UserRole } from "@fdcdf/shared";
import type { RouteRecordRaw } from "vue-router";

export const patientsRoutes: RouteRecordRaw[] = [
  {
    path: "patients",
    name: "patients-list",
    component: () => import("./PatientsListView.vue"),
    meta: {
      roles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN],
    },
  },
];
