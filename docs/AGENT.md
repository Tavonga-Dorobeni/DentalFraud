# AGENT.md -- Forensic Dental Claims Detection Framework (FDCDF)

This document is the authoritative guide for any AI coding agent working on this project. Read this before writing any code.

**Reference documents:**
- `docs/SPEC.md` -- Functional requirements (FR-001 through FR-086), non-functional requirements, data model, use cases
- `docs/DESIGN.md` -- UI/UX direction, design system, component specifications, interaction model

> When referenced from files in this directory, use relative paths: `SPEC.md`, `DESIGN.md`.

---

## 1. Non-Negotiable Principles

These rules override all other guidance. Every agent, every task, no exceptions.

1. **FDI / ISO 3950 notation** -- All tooth references use FDI two-digit notation (11-48 permanent, 51-85 primary). Never use Universal/American numbering anywhere in the system.
2. **Explainability** -- Every risk score and alert must be traceable to specific contributing factors. No black-box scoring. If a score cannot be explained, it must not be presented.
3. **Human-in-the-loop** -- The system recommends, humans decide. Never auto-deny or auto-confirm fraud without explicit policy authorization.
4. **Auditability** -- Every action, evaluation, and configuration change must be logged with timestamps and user attribution.
5. **Security boundaries** -- Role-based access on every endpoint. Patient/provider data is sensitive. Validate all input at system boundaries. Never trust client input.
6. **Clinical rules are configurable, not hardcoded** -- Rules, thresholds, weights, and procedure catalogs live in the database, not in application code.

---

## 2. Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MySQL
- **Query builder:** Knex.js (migrations, seeds, parameterized queries)
- **Auth:** JWT (access + refresh tokens, role claims embedded)
- **Validation:** Zod for request/response schema validation

### Frontend
- **Framework:** Vue.js 3 with TypeScript (Composition API, `<script setup>` syntax)
- **State management:** Pinia
- **Routing:** Vue Router
- **HTTP client:** Axios
- **Animation:** Framer Motion or GSAP (priority queue reordering, panel transitions)
- **Styling:** Tailwind CSS with custom design tokens from DESIGN.md
- **SVG:** Custom inline SVG for the dental arch map (32 tooth path groups, FDI-tagged IDs)

### Shared
- **Monorepo** with three workspaces: `packages/shared/`, `packages/backend/`, `packages/frontend/`
- `packages/shared/` is the single source of truth for TypeScript interfaces, enums, and constants that cross the API boundary

### Testing
- **Backend:** Vitest + Supertest for API integration tests
- **Frontend:** Vitest + Vue Test Utils for component tests
- **E2E:** Playwright (if needed)

---

## 3. Backend Architecture

Module-based organization. Each domain is a self-contained module under `packages/backend/src/modules/`.

### Module Map

```
packages/backend/src/
  modules/
    claims/          # Ingestion, validation, claim CRUD (FR-001 to FR-011)
    teeth/           # FDI validation, tooth history, consistency checks (FR-012 to FR-019)
    rules/           # Rule catalog, rule execution engine (FR-020 to FR-029)
    clinical/        # Clinical knowledge base, procedure-tooth mappings (FR-030 to FR-035)
    surveillance/    # Statistical analysis, frequency distributions (FR-036 to FR-041)
    patterns/        # Provider behavioral analytics (FR-042 to FR-046)
    scoring/         # Risk score calculation, score bands (FR-047 to FR-052)
    alerts/          # Alert generation, triage queues (FR-053 to FR-058)
    audit/           # Audit case management, resolution (FR-059 to FR-064)
    reports/         # Reporting and dashboarding (FR-065 to FR-071)
    logs/            # Audit trail, traceability (FR-072 to FR-077)
    admin/           # Users, roles, permissions, config (FR-078 to FR-082)
    feedback/        # Outcome capture, threshold tuning (FR-083 to FR-086)
  common/
    middleware/      # Auth, error handling, request logging
    utils/           # Shared helpers (date normalization, FDI validation)
    types/           # Backend-only types (re-exports shared types)
```

### Module Internal Structure

Every module follows this layout:

```
modules/claims/
  claims.routes.ts       # Express router, route definitions
  claims.controller.ts   # Request parsing, response formatting
  claims.service.ts      # Business logic
  claims.repository.ts   # Knex queries
  claims.validation.ts   # Zod schemas for this module's endpoints
  claims.types.ts        # Module-specific types (if any beyond shared)
```

### Layered Flow

Route -> Controller -> Service -> Repository -> MySQL

Each layer only calls the one below it. Services may call other module services when cross-domain logic is needed (e.g., scoring service calls rules service and patterns service).

### Middleware Stack

- `authMiddleware` -- Verifies JWT, attaches user/role to request
- `authorize(roles[])` -- Checks role against endpoint requirements
- `requestLogger` -- Logs every request for audit trail (FR-072 to FR-077)
- `errorHandler` -- Centralized error formatting, never leaks internals

---

## 4. Frontend Architecture

Hybrid organization: shared UI primitives in `ui/`, domain logic organized by feature.

### Directory Structure

```
packages/frontend/src/
  ui/                    # Shared UI primitives (reusable across features)
    AppButton.vue
    AppModal.vue
    AppDataTable.vue
    AppSkeletonLoader.vue
    GlassPanel.vue       # Glassmorphism container from DESIGN.md
    IntegrityShield.vue   # SVG shield icon, dynamic fill by risk level
  features/
    claims/              # Claim ingestion, review, detail view
    dental-map/          # Interactive 32-tooth SVG arch (FR-012 context)
    alerts/              # Alert dashboard, triage queues
    audit/               # Audit case management, resolution workflow
    scoring/             # Risk score display, contributing factors
    evidence/            # Evidence sidebar, side-by-side comparison
    reports/             # Dashboards, trend charts, exports
    admin/               # User management, rule config, thresholds
  composables/           # Shared composables (useAuth, useApi, useToast)
  stores/                # Pinia stores (one per feature domain)
  router/                # Vue Router config, route guards by role
  assets/
    styles/              # Tailwind config, design tokens, global CSS
    svg/                 # Dental arch base SVG, tooth outlines
  types/                 # Re-exports from shared, frontend-only types
```

### Feature Internal Structure

```
features/claims/
  ClaimsListView.vue       # Route-level page component
  ClaimDetailView.vue      # Route-level page component
  components/
    ClaimCard.vue           # Feature-specific components
    ClaimLineTable.vue
  composables/
    useClaims.ts            # Feature-specific data fetching/logic
  claims.routes.ts          # Feature route definitions (lazy-loaded)
```

### Key Frontend Patterns

- **Views** are route-level pages. **Components** are building blocks within features.
- Pinia stores handle server-state caching and UI state per domain.
- All API calls go through a configured Axios instance with JWT interceptor (auto-attach token, handle 401 refresh).
- Route guards check user role before rendering restricted views.

### Design System Alignment (from DESIGN.md)

- Color tokens defined as CSS custom properties AND Tailwind config values.
- `GlassPanel` implements `backdrop-filter: blur(8px)` for intelligence overlays.
- Dental map SVG paths tagged with `tooth-{FDI number}` IDs for state-driven styling.
- Peripheral Pulse: fixed 4px left-edge bar driven by a global alert store.
- Priority queue animations use GSAP/Framer Motion for smooth list reordering.
- Skeleton screens during data loading to maintain the clinical workspace feel.

---

## 5. Database -- Entities & Relationships

### Entity Descriptions

- **patients** -- `patient_id` (PK). Demographics. Optional: date of birth for age-plausibility checks (FR-033).
- **providers** -- `provider_id` (PK). Provider info, specialty. Referenced by claims and provider-level risk indicators.
- **claims** -- `claim_id` (PK), references `patient_id`, `provider_id`. Date of service, submission date, status (accepted/warned/rejected per FR-010). Has many claim lines.
- **claim_lines** -- `claim_line_id` (PK), references `claim_id`. Procedure code, tooth number (FDI), claimed amount, documented procedure code (optional). The atomic unit of analysis.
- **tooth_history** -- References `patient_id` and tooth number. Per-tooth events over time (extractions, restorations, endodontic work). Essential for chronology conflict detection (FR-017/018).
- **procedure_catalog** -- Procedure codes, descriptions, categories, complexity levels. Configurable lookup table.
- **clinical_rules** -- Rule definitions: ID, name, description, severity, enabled flag, parameters/thresholds, version. Rules are data, not code (FR-028).
- **rule_results** -- References `claim_line_id` and `clinical_rules`. Each rule execution: rule ID, severity, explanation, evidence fields used, timestamp (FR-029).
- **risk_scores** -- References `claim_id`. Score value, band (Low/Medium/High/Critical), contributing factors (JSON), confidence indicator, config version used (FR-047 to FR-052).
- **alerts** -- References `claim_id`, optionally `claim_line_id`. Severity, status (open/acknowledged/closed), assigned user, triggered rules summary (FR-053 to FR-058).
- **audit_cases** -- `case_id` (PK). Links to one or more alerts/claims. Status (Open/In Review/Escalated/Closed/Referred), resolution outcome, full action history (FR-059 to FR-064).
- **audit_logs** -- Immutable append-only log. User, action, target entity, timestamp, before/after snapshot where applicable (FR-072 to FR-077).
- **config_versions** -- Versioned snapshots of rule configurations and scoring weights. Every evaluation records which config version was used (FR-035, FR-081).
- **investigation_outcomes** -- References `audit_cases`. Final outcome (Confirmed Fraud, Legitimate, etc.), analyst marking (true positive/false positive/unresolved) for feedback loop (FR-083 to FR-086).

### Migration Conventions

- Knex migrations in `packages/backend/migrations/`, timestamped filenames.
- Seeds in `packages/backend/seeds/` for procedure catalogs, default rules, and test data.
- Foreign keys enforced at the database level.
- Soft deletes where audit trail requires it (claims, alerts, cases). Hard deletes nowhere.
- Never modify a migration that has already been run -- create a new one.

---

## 6. API Conventions

### Route Structure

- All routes prefixed with `/api/v1/`
- Resource-oriented REST: `/api/v1/claims`, `/api/v1/alerts`, `/api/v1/audit-cases`
- Nested resources where ownership is clear: `/api/v1/claims/:claimId/lines`, `/api/v1/audit-cases/:caseId/notes`
- Non-CRUD actions use verb sub-routes: `/api/v1/claims/:claimId/analyze`, `/api/v1/alerts/:alertId/acknowledge`

### Request/Response Patterns

- All request bodies and query params validated with Zod before reaching the controller.
- Consistent response envelope:
  ```json
  { "success": true, "data": { ... } }
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
  ```
- Paginated list endpoints return:
  ```json
  { "data": [...], "pagination": { "page": 1, "pageSize": 25, "total": 142, "totalPages": 6 } }
  ```
- Date fields serialized as ISO 8601 strings.
- Tooth numbers always as FDI two-digit integers, never strings.

### Auth Headers

- `Authorization: Bearer <access_token>` on every protected route.
- Refresh via `POST /api/v1/auth/refresh`.
- Required role per endpoint documented in each module's route file.

### HTTP Status Codes

- `200` success, `201` created, `204` no content (deletes)
- `400` validation errors, `401` unauthenticated, `403` unauthorized for role
- `404` resource not found, `409` conflict (duplicate claim detection)
- `500` unexpected errors (never leak stack traces)

---

## 7. Coding Conventions

### Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Files (modules) | dot-separated by role | `claims.service.ts`, `claims.controller.ts` |
| Files (Vue components) | PascalCase | `ClaimDetailView.vue`, `ClaimCard.vue` |
| Files (other) | kebab-case | `use-claims.ts`, `error-handler.ts` |
| TypeScript types/interfaces | PascalCase | `ClaimLine`, `RiskScore` |
| Variables/functions | camelCase | `calculateRiskScore`, `claimId` |
| Database tables/columns | snake_case | `claim_lines`, `patient_id` |
| Vue components (in templates) | PascalCase | `<ClaimCard />` |
| Constants/enum values | UPPER_SNAKE_CASE | `RISK_BAND.CRITICAL` |
| Enum names | PascalCase | `RiskBand` |

### Shared Types

- Interfaces for every entity that crosses the API boundary live in `packages/shared/src/`.
- Backend and frontend both import from `@fdcdf/shared`.
- When adding a new endpoint, define request/response types in shared first.

### Error Handling

- **Backend:** Custom error classes (`ValidationError`, `NotFoundError`, `AuthorizationError`) caught by centralized error middleware.
- **Frontend:** Axios interceptor handles 401 (refresh/redirect). All other errors surfaced via a toast composable.
- Never swallow errors silently. Log them.

### Git Conventions

- Branch naming: `feature/`, `fix/`, `chore/` prefixes (e.g., `feature/claims-ingestion`).
- Commit messages: imperative mood, reference FR numbers when implementing a spec requirement (e.g., `Add duplicate claim detection (FR-021, FR-022)`).
- One logical change per commit.

### Comments

- Don't comment obvious code.
- Do comment: business rule rationale, non-obvious clinical logic, why a threshold was chosen.
- Reference FR numbers when implementing specific requirements.

---

## 8. Task Patterns

Concrete templates for common agent tasks.

### Adding a New Backend Module

1. Create folder under `packages/backend/src/modules/{name}/`.
2. Create the standard files: `{name}.routes.ts`, `{name}.controller.ts`, `{name}.service.ts`, `{name}.repository.ts`, `{name}.validation.ts`.
3. Define Zod schemas for request/response in the validation file.
4. Add shared types to `packages/shared/src/` if the data crosses the API boundary.
5. Register routes in the main Express app router.
6. Add auth middleware with appropriate role requirements.

### Adding a New Vue Feature

1. Create folder under `packages/frontend/src/features/{name}/`.
2. Create route-level view(s), `components/` subfolder, `composables/` subfolder.
3. Create a Pinia store in `packages/frontend/src/stores/` if the feature manages server state.
4. Define lazy-loaded routes in `{name}.routes.ts`, register in the main router.
5. Add route guard if the feature is role-restricted.
6. Use `GlassPanel`, `AppDataTable`, and other `ui/` primitives before creating new components.

### Creating a Knex Migration

1. Run `npx knex migrate:make {descriptive_name}` from `packages/backend/`.
2. Define `up` and `down` functions -- `down` must fully reverse `up`.
3. Use foreign key constraints referencing parent tables.
4. Add indexes on columns used in frequent queries (`patient_id`, `provider_id`, `claim_id` on child tables).
5. Never modify a migration that has already been run -- create a new one.

### Implementing a Detection Rule (FR-020 to FR-029)

1. Add the rule definition as a seed record in `clinical_rules` (ID, name, severity, parameters).
2. Implement rule logic in `modules/rules/` as a function that receives a claim line and returns a result.
3. The rule engine iterates all enabled rules against a claim -- individual rules are pure functions.
4. Store results in `rule_results` with rule ID, severity, explanation text, and evidence fields.
5. Never hardcode thresholds -- read them from the rule's parameters in the database.
