Design Direction

1. Brand Identity & Visual Language
The branding is designed to evoke Authority, Precision, and Integrity. It moves away from "friendly" corporate styles toward a professional, laboratory-grade tool.

Primary Logo (The Integrity Shield): A minimalist, geometric shield 🛡️ featuring a stylized tooth silhouette in the negative space. It represents the system’s role as a protective framework for claim integrity.

Color Palette:

Clinical Workspace White: Primary background for high clarity and trust.

Professional Navy: Used for headers and primary text to establish authority.

Functional Accents: Alert Red (Critical), Electric Amber (Suspicious), and Clinical Blue (Stable/Verified).

Typography: A combination of clean Sans-Serif (Inter) for readability and Monospace (Roboto Mono) for technical data like Tooth IDs and Procedure Codes.

2. Core UI Layout: The "Diagnostic Strip" Workflow
The UI follows a top-down information hierarchy designed to minimize cognitive load during high-volume audits.

A. The Risk Header (Global Diagnosis)
The top of the screen acts as a "Digital Diagnostic Strip" using Glassmorphism overlays to distinguish system intelligence from raw claim data.

Rating Style: Displays a clear status (e.g., CRITICAL) alongside the Integrity Shield.

The Partner Insight: A natural-language sentence (e.g., "Detected procedure conflict with extraction history") that explains the risk immediately.

B. The Interactive Center Map (Full Jaw Arch)
A central anatomical representation of all 32 teeth using the FDI / ISO 3950 notation.

Style: High-precision anatomical outlines in light grey.

Dynamic Highlighting: Teeth involved in flagged claims pulse with a soft glow.

Historical Layer: The "Silent Partner" overlays historical data (e.g., prior fillings or missing teeth) directly onto the arch using dashed lines or blue tints.

C. The Evidence Panel (Comparison View)
A sidebar that opens when a specific tooth or alert is selected.

Side-by-Side Comparison: Two anatomical icons—one representing the "Current Claimed State" and one representing "Verified History."

Visual Mismatch: High-contrast markers (e.g., a red "Claimed" icon vs. a grey "Extracted" icon) allow for instant visual verification of fraud.

3. Interaction Model: The "Silent Partner"
The system follows a "Human-in-the-Loop" philosophy where the AI assists but the human decides.

Peripheral Pulse: A subtle, glowing notification in the UI border to alert the user of new high-priority claims without interrupting their current task.

Priority Queueing: When a new alert arrives while the user is on the dashboard, the system smoothly re-orders the list to slide the highest-risk "Shields" to the top.

Quick-Action Toggles: A set of three tactile buttons at the bottom of the evidence panel—[ LEGITIMATE ], [ EDUCATION REQ ], and [ CONFIRM FRAUD ]—to allow for rapid, one-click case resolution.

4. Key Performance Indicators for UX
Explainability: Every risk score must be traceable to the "Partner Insight" box.

Efficiency: An investigator should be able to reach a resolution in under 3 clicks from the moment they open a claim.

Accessibility: High-contrast color usage ensures alerts are distinguishable even in fast-paced environments.

Implementation Roadmap
Frontend: Build the Anatomical Map using SVG for high-fidelity scaling and individual tooth-state manipulation.

Logic: Integrate the "Partner Insight" generator to map specific SRS rule IDs (e.g., FR-023) to plain-language summaries.

Animation: Implement smooth CSS transitions for the "Priority Queue" and "Glass" panel slide-ins to maintain a high-tech feel.

This Markdown file is structured as a technical guide for your engineering team. It translates the design direction into a concrete implementation roadmap, focusing on the "Clinical Workspace" aesthetic and the high-tech "Silent Partner" interactions.

***

# Frontend Implementation Guide: FDCDF Interface

## 1. Design System & Theme
The application follows a **Clinical Workspace** theme. Implementation must prioritize high-density data, light-mode clarity, and "Glassmorphism" for intelligence layers.

### Color Tokens
```css
:root {
  /* Neutral Palette */
  --color-clinical-bg: #FFFFFF;
  --color-surface-glass: rgba(248, 250, 252, 0.8);
  --color-border-subtle: #E2E8F0;
  
  /* Brand & Status */
  --color-navy-auth: #0F172A;
  --color-blue-clinical: #3B82F6; /* Use for stable/verified */
  --color-amber-alert: #F59E0B;  /* Use for suspicious */
  --color-red-critical: #EF4444; /* Use for confirmed mismatches */
  
  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'Roboto Mono', monospace;
}
```

### Visual Style Requirements
- **Glassmorphism:** Apply `backdrop-filter: blur(8px)` to all "Partner Insight" overlays and the Right Evidence Panel.
- **Borders:** Use hairline borders (1px) with low-contrast greys to maintain a minimalist, geometric feel.

---

## 2. Component Architecture

### A. The Risk Header (`RiskHeader.tsx`)
This component occupies the top of the `ClaimDetail` view.
- **The Shield:** Use an SVG component for the **Integrity Shield**. The fill color must dynamically update based on the `riskScore`.
- **Insight Box:** Implement a recessed container with a soft tint. This must display the concatenated string from the backend's rule-engine explanation (SRS FR-047).

### B. Interactive Dental Arch (`DentalMap.tsx`)
A full-jaw anatomical map is required. 
- **Graphic Format:** Use a single **SVG** containing 32 path groups. Each group must be ID-tagged with the **FDI Tooth Number** (e.g., `tooth-46`).
- **State Logic:**
  - **Hover:** Subtle 1px glow.
  - **Flagged:** CSS keyframe animation for a "soft pulse" on the tooth outline.
  - **Historical View:** If a tooth has `historical_data: true`, apply a light blue stipple pattern or fill.
- **Coordinate Mapping:** On selection, the map should use `viewBox` transitions to center the specific quadrant (10, 20, 30, or 40).

### C. Comparison Evidence Panel (`EvidenceSideBar.tsx`)
Located on the right, this panel handles the decision-making loop.
- **Side-by-Side Cards:** Use two vertical cards with 50% width.
- **Iconography:** Use minimalist anatomical icons. If a mismatch is detected (e.g., Tooth 46 exists in claim but is "Extracted" in history), apply a red strike-through SVG overlay on the "History" icon.

---

## 3. "Silent Partner" Interactions

### The Peripheral Pulse
Implement a global notification system that avoids pop-ups.
- **Mechanism:** A 4px-wide vertical bar on the extreme left of the screen.
- **Behavior:** When a new `CRITICAL` claim is ingested, this bar pulses with the `var(--color-red-critical)`. It remains until the user navigates to the alert queue.

### Priority Queue Animation
In the Alert Dashboard, use a library like **Framer Motion** or **GSAP** to handle list re-ordering.
- **Transition:** When a claim's risk score is updated in real-time, the row should scale slightly and slide to its new position based on severity.

---

## 4. Decision Loop: Quick-Action Toggles
Implementation of SRS FR-4.9 (Audit Case Management).

```typescript
// Example Toggle Logic
const ResolutionToggles = ({ claimId }) => {
  return (
    <div className="flex gap-4 p-4 border-t border-glass">
      <button className="btn-minimalist hover:text-green-500">LEGITIMATE</button>
      <button className="btn-minimalist hover:text-amber-500">EDUCATION REQ</button>
      <button className="btn-solid-navy hover:bg-red-600">CONFIRM FRAUD</button>
    </div>
  );
};
```

---

## 5. Accessibility & Performance
- **Contrast:** All "Rating" text (CRITICAL, SUSPICIOUS) must meet WCAG AA standards.
- **Skeleton Screens:** Use skeleton states for the Dental Map during initial data ingestion (SRS FR-001) to maintain the "High-Tech" feel.
- **SVG Optimization:** Ensure the anatomical outlines are optimized for low-latency zooming and interaction.

***