# FutureSelf - Project Development Report

**Date:** May 30, 2026  
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

### C. UI/UX Design & Typography (Medium-Fidelity Skeleton)
* **Mobile-First Layout:** Designed a sleek, single-column container optimized for mobile screens.
* **Tagline & Hero Section:** Created a spacious, welcoming Hero Section featuring your custom tagline:
  > **"Check and Decide Your Own Future. It's That Simple."**
* **Visual Background:** Designed an elegant, lightweight abstract geometric background using CSS gradients and soft blurs (mint-to-teal glow) to avoid heavy image assets.
* **Premium Typography:**
  * **Outfit** (Headings): A friendly, geometric typeface with rounded curves that gives a modern, wellness-oriented feel.
  * **Plus Jakarta Sans** (Body Text): A highly readable, clean, and modern screen font.
* **Phosphor Icons Integration:** Integrated the premium **Phosphor Icons** library using the consistent and friendly **Duotone** style. Removed all generic sparkle/star/screenshot icons to ensure a unique visual identity.
* **Detailed Statistics Accordion:** Built a collapsible section showing custom horizontal bar charts that break down the exact percentage distribution of the 70 survey responses for Energy, Mood, and Focus.

---

## 3. Current Validation Status

### A. Local Website Health Check
* Confirmed that the application loads successfully on the local development server at `http://localhost:3000`.
* Verified that the homepage responds correctly and that the current JavaScript and CSS assets are being served.
* During testing, we found evidence of an earlier unstable dev-server state, but the current active run is loading the main page correctly.

### B. Runtime Interaction Testing
* Added temporary runtime logging to inspect real user interactions instead of relying only on static code review.
* **Single Decision flow:** Runtime-verified that the core interactions are functioning:
  * Mode switching works.
  * Category selection works.
  * Option selection works.
  * The **Calculate Prediction** button renders a result successfully.
* Example verified runtime result:
  * Category: **Caffeine**
  * Option: **More than 200 mg (>1 drink)**
  * Output observed: **Overall Score 4.9 / 10**, with separate Energy, Mood, and Focus values rendered correctly.
* **Still pending full sign-off:** Combined Day dropdown flow, the **Show Detailed Statistics** accordion, and the **Adjust Decisions** reset flow were under live verification and should be treated as only partially verified until the full pass is completed.

---

## 4. UX Review Notes

### A. Overall UX Polish
* Current UI quality is strong for a medium-fidelity build and feels roughly **7/10** in overall polish.
* Strong points:
  * Clear mobile-first layout
  * Friendly visual identity
  * Simple decision flow
  * Clean score and prediction presentation

### B. UX Issues Worth Polishing
* Some supporting text is still quite small, especially for a health-related experience where readability matters.
* The statistics accordion could communicate its open/closed state more clearly with stronger wording.
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
Once you have reviewed the medium-fidelity skeleton, we can gradually transition it into a high-fidelity version:
1. **Finish Interaction QA:** Complete live verification for Combined Day, the Detailed Statistics accordion, and the reset flow.
2. **Figma Styling Integration:** Apply the exact color tokens (`#1F6F6B` deep teal, `#F7FAF9` background, `#DDE6E4` borders) and card styles from your Figma design system.
3. **Accessibility Improvements:** Allow zooming, improve small text sizes, and strengthen readability for health-related content.
4. **Trust & Compliance Messaging:** Add a short disclaimer, privacy note, and clearer transparency messaging about what the predictions are based on.
5. **Interactive Micro-interactions:** Add smooth transitions, active states, and hover effects for buttons, pills, and dropdowns.
6. **Animations:** Introduce subtle entrance animations for the Future Self prediction cards to make the reveal feel magical.
