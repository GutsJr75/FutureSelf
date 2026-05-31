# FutureSelf - Project Development Report

**Date:** May 31, 2026  
**Project Name:** FutureSelf  
**Target Platform:** Mobile-First Web Application  
**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Phosphor Icons, Python (for data ingestion)

---

## 1. Project Overview & Concept
**FutureSelf** is a mobile-first web application designed to help users make daily health decisions by predicting short-term outcomes. The application focuses on three core daily habits:
* **Sleep** (Less than 6 hours, 6 to 8 hours, More than 8 hours)
* **Food** (Skip a meal, Eat a proper meal)
* **Caffeine** (0 mg, Up to 200 mg, More than 200 mg)

Instead of relying on generic health advice, the app is powered by **real-world empirical data** collected from a Google Form survey with **70 responses**. It predicts the short-term impact of these choices on three critical daily metrics: **Energy**, **Mood**, and **Focus**.

---

## 2. What We Did So Far

### A. Data Processing & Ingestion
* **Dataset Analysis:** Inspected the raw Excel file `Short-Term Effects of Daily Health Decisions.xlsx` containing 70 survey responses.
* **Data Cleansing:** Verified that the survey responses map to a consistent 5-point scale: `Much Worse`, `Worse`, `Normal`, `Better`, and `Much Better`.
* **Static JSON Conversion:** Created a Python ingestion pipeline to parse the Excel file and export it into a clean, lightweight static JSON file (`src/app/survey_data.json`). This keeps the application serverless, fast, and easy to host.
* **Future-Proofing:** Added clear instructions and placeholders in the codebase so that if more survey responses are collected in the future, the dataset can be updated with a single command.

### B. Core Prediction & Scoring Engine (`src/app/utils/prediction.ts`)
* **Numerical Weighting System:** Implemented a robust scoring algorithm that maps qualitative survey feedback to quantitative scores out of 10:
  * *Much Worse:* 0.0
  * *Worse:* 2.5
  * *Normal:* 5.0
  * *Better:* 7.5
  * *Much Better:* 10.0
* **Metric Calculations:** The engine calculates the average score for Energy, Mood, and Focus based on the 70 survey responses for any chosen habit.
* **Combined Decisions Logic:** Created a custom aggregation algorithm that averages individual scores when a user builds a "Combined Day" (e.g., Sleep + Food + Caffeine).
* **Future Self Messaging:** Programmed a dynamic prediction generator that writes a personalized, friendly "letter" from the user's Future Self based on the calculated scores.
* **Refactored Helpers (May 31):** Extracted reusable logic into `calculateSingleDecisionWithMessage`, `calculateCombinedDayResult`, `compareOverallScores`, `getSentimentFromScore`, and `getOptionLabel` so Analyze and Compare flows share the same scoring path.

### C. UI/UX Design & Typography (Medium-Fidelity Skeleton)
* **Mobile-First Layout:** Designed a sleek, single-column container optimized for mobile screens.
* **Tagline & Hero Section:** Created a spacious, welcoming Hero Section featuring your custom tagline:
  > **"Check and Decide Your Own Future. It's That Simple."**
* **Visual Background:** Designed an elegant, lightweight abstract geometric background using CSS gradients and soft blurs (mint-to-teal glow) to avoid heavy image assets.
* **Premium Typography:**
  * **Outfit** (Headings): A friendly, geometric typeface with rounded curves that gives a modern, wellness-oriented feel.
  * **Plus Jakarta Sans** (Body Text): A highly readable, clean, and modern screen font.
* **Phosphor Icons Integration:** Integrated the premium **Phosphor Icons** library using the consistent and friendly **Duotone** style across categories, metrics, and actions.
* **Detailed Statistics Accordion:** Built a collapsible section showing custom horizontal bar charts that break down the exact percentage distribution of the 70 survey responses for Energy, Mood, and Focus. Accordion label toggles between "Show" and "Hide Detailed Statistics."

### D. A/B Compare Mode (May 31)
* **Dual Intent Toggle:** Added an **Analyze** | **Compare A/B** sub-toggle under both **Single Decision** and **Combined Day** modes.
* **Single Analyze:** Category capsule pills (Sleep / Food / Caffeine) plus a dropdown for the chosen option.
* **Single Compare:** Same category pills, then **Option A** and **Option B** dropdowns within the same category (not cross-category). No default selection; compare button stays disabled until both are chosen. The other side's pick is excluded from each dropdown so the same option cannot be selected twice.
* **Combined Analyze:** Three dropdowns (Sleep, Food, Caffeine) for one full day, unchanged in behavior.
* **Combined Compare:** Two full day setups (**Day A** and **Day B**), each with three dropdowns.
* **Compare Results UI:** Stacked Scenario A and B cards, each with its own Future Self message, score badge, and metric grid. A winner banner at the top shows the higher-scoring scenario with a VS score duel layout. Tie state uses a dedicated draw card.
* **Winner Banner Polish:** Gradient background, trophy animation, sparkle accents on the winner badge, and entrance/shimmer animations via Tailwind keyframes.
* **Action Button Icons:** **Calculate Prediction** uses a **ChartLineUp** icon (data-driven/scientific). **Compare Predictions** uses **Scales**. **Adjust Decisions** keeps a refresh icon for reset.
* **UI Consistency Pass:** Single-mode option inputs use the same dropdown styling as Combined mode. Redundant category labels under options were removed since the category pills already show the active category.
* **Cleanup:** Removed temporary runtime debug logging (`emitDebugLog`) from `page.tsx`.

---

## 3. Current Validation Status

### A. Local Website Health Check
* Application loads successfully on the local development server at `http://localhost:3000`.
* If the dev server returns 404s for `/` or static chunks, clearing the `.next` cache and restarting fixes it (`rm -rf .next && npm run dev`). This was caused by a corrupted build cache and a stale process holding port 3000.
* Production build (`npm run build`) completes successfully.

### B. Runtime Interaction Testing
* **Single Analyze:** Verified. Category pills, option dropdown, and Calculate Prediction render one result card correctly.
* **Single Compare:** Verified via prediction logic and live UI. Example: Food **Skip a meal** vs **Eat a proper meal** yields proper meal as winner (6.9 vs 3.5).
* **Combined Analyze:** Verified. One day setup returns a single averaged result.
* **Combined Compare:** Verified. Example: bad day (less sleep, skip meal, high caffeine) vs good day yields Day B as winner (6.4 vs 3.9).
* **Toggle resets:** Switching Single/Combined or Analyze/Compare clears calculated results.
* **Stats accordion:** Works in both Analyze (one scenario) and Compare (A and B sections) modes.
* **Adjust Decisions:** Reset flow clears results and returns to the input screen.

---

## 4. UX Review Notes

### A. Overall UX Polish
* Current UI quality is roughly **8/10** for a medium-fidelity build, up from 7/10 after A/B Compare and the winner banner polish.
* Strong points:
  * Clear mobile-first layout
  * Friendly visual identity
  * Consistent dropdown styling across Single and Combined modes
  * Category capsules in Single mode feel distinct and scannable
  * A/B Compare flow is intuitive with clear winner feedback
  * Clean score and prediction presentation

### B. UX Issues Worth Polishing
* Some supporting text is still quite small, especially for a health-related experience where readability matters.
* The product currently lacks a visible disclaimer or trust message such as "not medical advice."
* Privacy and transparency messaging are still minimal, which matters more because the product talks about health behaviors and outcomes.

### C. Accessibility Note
* The current layout disables user zooming on mobile devices. This should be reconsidered because it can hurt accessibility and readability.

---

## 5. HIPAA / Compliance Note
* If **FutureSelf** remains a lightweight, anonymous wellness calculator with no user accounts, no stored health records, and no personally identifiable health data, HIPAA may not directly apply in the strict legal sense.
* However, if the product later expands to include accounts, stored user history, personal identifiers, or any Protected Health Information (PHI), the current experience is **not HIPAA-ready**.
* For future HIPAA-oriented readiness, the product would need:
  * Clear privacy disclosures and consent messaging
  * Secure authentication
  * Role-based access controls where relevant
  * Audit logging and traceability
  * Secure handling of sensitive health data both in transit and at rest

---

## 6. Next Steps & Polish
Remaining work to move from medium-fidelity toward high-fidelity:
1. **Figma Styling Integration:** Apply the exact color tokens (`#1F6F6B` deep teal, `#F7FAF9` background, `#DDE6E4` borders) and card styles from your Figma design system.
2. **Accessibility Improvements:** Allow zooming, improve small text sizes, and strengthen readability for health-related content.
3. **Trust & Compliance Messaging:** Add a short disclaimer, privacy note, and clearer transparency messaging about what the predictions are based on.
4. **Interactive Micro-interactions:** Add smooth transitions, active states, and hover effects for buttons, pills, and dropdowns beyond what exists today.
5. **Result Card Animations:** Introduce subtle entrance animations for the Future Self prediction cards on reveal (winner banner already has entrance animation).

**Completed since last report (removed from next steps):**
* Finish Interaction QA for Combined Day, stats accordion, and reset flow
* A/B Compare Mode for Single and Combined decision paths
