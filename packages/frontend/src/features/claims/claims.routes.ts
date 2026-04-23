import { UserRole } from "@fdcdf/shared";
import type { RouteRecordRaw } from "vue-router";

export const claimsRoutes: RouteRecordRaw[] = [
  {
    path: "claims",
    name: "claims-list",
    component: () => import("./ClaimsListView.vue"),
    meta: { roles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR] },
  },
  {
    path: "claims/:claimId",
    name: "claim-detail",
    component: () => import("./ClaimDetailView.vue"),
    meta: { roles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR] },
  },
];
