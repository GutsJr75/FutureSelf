# FutureSelf - Project Development Report

**Date:** June 2, 2026  
**Project Name:** FutureSelf  
**Target Platform:** Mobile-First Web Application  
**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Phosphor Icons

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
* **Static JSON Dataset:** The current app reads from a clean static JSON file (`src/app/survey_data.json`), which keeps the application serverless, fast, and easy to host.
* **Pipeline Status:** A reusable Python ingestion pipeline for re-generating the JSON from the Excel file is still a future task and is not implemented in the current repo yet.

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

### C. UI/UX Design & Typography (Scientific Compare-First Redesign + June 2 Cleanup)
* **Mobile-First Layout:** Kept the single-column mobile layout, but upgraded the visual hierarchy so the product now feels more like a decision tool than a generic wellness calculator.
* **Compare-First Hero:** Replaced the older soft hero treatment with a darker, more analytical hero that frames the product around comparing "two possible tomorrows" before making a choice.
* **Sharper Shape System:** Reduced roundness across cards, buttons, selectors, badges, and panels. The UI now uses a sharper, more restrained panel language instead of bubbly capsules and heavily rounded cards.
* **Premium Typography:** Continued using **Outfit** for headings and **Plus Jakarta Sans** for body text, but the current layout uses them in a more structured, evidence-led presentation style.
* **Scientific Visual Language:** Added a darker grid-based hero, stronger borders, and more consistent spacing to support a smarter, more data-driven feel. The earlier top hero stat tiles were later removed because they added noise without helping the main decision flow.
* **Phosphor Icons Integration:** Continued using **Phosphor Icons** in a consistent duotone style for categories, metrics, and actions.
* **Wordmark + Readability Pass (June 2):** Updated the header wordmark styling, removed the extra top-right compare badge, removed added letter spacing across the UI, and tightened several small text treatments so the interface reads more naturally.
* **Detailed Statistics Accordion:** Retained the collapsible statistics section, with percentage distributions for Energy, Mood, and Focus in both Analyze and Compare states.

### D. Interaction Model & Compare Workflow (Updated June 2)
* **Dual Intent Model:** The app still supports both **Analyze** and **Compare A/B**, but users now explicitly choose a workflow first instead of landing on a preselected default.
* **Scope Toggle:** Users now also explicitly choose the scope first instead of inheriting a default. The scope labels were simplified to **One Habit** and **All 3 Habits** for clarity.
* **Single Analyze:** Users choose one category and one option to inspect a single result in isolation.
* **Single Compare:** Users compare two options inside the same category. The compare button remains disabled until both sides are selected, and duplicate picks are prevented.
* **Combined Analyze:** Users build one full-day profile using Sleep, Food, and Caffeine and receive a single averaged outcome.
* **Combined Compare:** Users build two full-day profiles (**Scenario A** and **Scenario B**) and compare them side by side.
* **Compare Results UI:** Compare mode now emphasizes a stronger comparison outcome banner, followed by two scenario result cards and detailed statistics when expanded.
* **Action Button Icons:** **Calculate Prediction** uses **ChartLineUp**, **Compare Predictions** uses **Scales**, and **Adjust Decisions** uses **ArrowClockwise**.
* **Progressive Disclosure (June 2):** The **Primary workflow** and **Scope** help text is now hidden by default and shown only when the user expands it, which reduces clutter near the top of the screen.
* **Setup Gate:** Until the user chooses both a workflow and a scope, the setup section stays in a neutral waiting state instead of assuming a default path.
* **Spacing Consistency Pass:** Updated vertical spacing, section grouping, card padding, and tile spacing so the screen feels more deliberate and less ad hoc.
* **Cleanup:** Previous temporary debug artifacts and outdated UI assumptions were removed as the redesign was integrated.

### E. Transparency & Trust Messaging (May 31)
* **Methodology Section:** Added a dedicated transparency block directly under the main action button so users can understand the product before calculating results.
* **Summary + Expandable Details:** The page now explains:
  * What the app does
  * How **One Habit**, **All 3 Habits**, **Analyze**, and **Compare A/B** differ
  * How the scoring works
  * Dataset scope and limitations
  * A transparency / non-medical-advice note
  * A thank-you note to users
* **Honest Framing:** The UI now explicitly explains that the app uses survey-response distributions and average scores, not probabilities and not a machine learning model.
* **Presentation Cleanup (June 2):** The methodology block no longer uses the extra outer card wrapper, and the rule-based label was tightened so it stays on one line.
* **Persistent Footer Disclosure:** Added a visible short-form trust note in the footer: built from 70 survey responses and intended as short-term wellness guidance, not medical advice.

---

## 3. Current Validation Status

### A. Local Website Health Check
* Application loads successfully in both development and production modes.
* The development server may auto-shift ports when `3000` or `3001` are already in use, so local testing can occur on `3001` or `3002` instead of always staying on `3000`.
* If the dev server returns 404s for `/` or static chunks, clearing the `.next` cache and restarting still remains a valid recovery step when the local build cache becomes stale.
* Production build (`npm run build`) completes successfully.

### B. Runtime Interaction Testing
* **Single Analyze:** Verified in browser. One category + one option returns a single result card correctly.
* **Single Compare:** Verified in browser. Compare button starts disabled, enables only after both options are chosen, and returns a valid two-scenario comparison.
* **Combined Analyze:** Verified in browser. One day setup returns a single averaged result.
* **Combined Compare:** Verified in browser. After the user chooses workflow and scope, the compare flow produces a comparison banner, two scenario cards, and expandable statistics.
* **Unset Default State:** Verified. On first load, neither workflow nor scope is preselected, and the setup area waits for the user to choose both.
* **Toggle resets:** Switching workflow or scope clears calculated results as expected.
* **Stats accordion:** Verified. Detailed statistics open and close correctly after calculation.
* **Adjust Decisions:** Verified. Reset flow clears results and returns to the input screen.
* **Production Build Validation:** `npm run build` completes successfully after the June 2 UI cleanup changes.

---

## 4. UX Review Notes

### A. Overall UX Polish
* Current UI quality is roughly **8.5/10** for a more mature high-mid-fidelity prototype.
* Strong points:
  * Clear mobile-first layout
  * More distinctive scientific / compare-first visual identity
  * Stronger hierarchy around decision-making rather than passive reading
  * Cleaner panel system with more consistent spacing
  * Less visual noise at the top of the page after removing redundant badges, hero tiles, and extra wrappers
  * A/B Compare flow is now the clearest and strongest user journey
  * Transparent methodology section improves trust and product clarity
  * Score presentation and metric breakdowns are easier to scan

### B. UX Issues Worth Polishing
* Some supporting text is still quite small, especially for a health-related experience where readability matters.
* The transparency section is still detailed. Even after the cleanup, the challenge remains balancing clarity with cognitive load for first-time users.
* Privacy and compliance messaging are stronger in-page, but the product still does not yet have a dedicated privacy page, consent flow, or deeper policy structure.
* The hero-to-content visual transition can still be refined further if a more seamless premium feel is desired.

### C. Accessibility Note
* Mobile zoom is no longer forcibly disabled, which is an improvement over the previous build.
* Additional accessibility work is still worthwhile, especially around text sizing, contrast review, and touch-target comfort on smaller screens.

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
Remaining work to move from the current redesign toward a more production-ready build:
1. **Cross-Browser QA:** Validate the full experience on Safari, Chrome mobile emulation, and additional real-device scenarios beyond the current validation pass.
2. **Accessibility Improvements:** Continue improving small supporting text, touch-target comfort, and full readability for health-related content.
3. **Data Refresh Tooling:** Implement the missing Excel-to-JSON ingestion pipeline so the dataset can be regenerated from source instead of staying manual.
4. **Policy Surface Expansion:** Add a dedicated privacy / transparency page or stronger standalone disclosure surfaces if the product evolves further.
5. **Visual Refinement:** Continue polishing the hero-to-content transition, micro-interactions, and animation restraint so the interface feels even more cohesive.
6. **Font Delivery Optimization:** Consider moving from raw Google Fonts links to `next/font` for cleaner font loading and build behavior.

**Completed since last report (removed from next steps):**
* Finish Interaction QA for Combined Day, stats accordion, and reset flow
* A/B Compare Mode for Single and Combined decision paths
* Compare-first visual redesign with sharper panel styling
* In-page methodology and transparency section
* Footer trust note / non-medical-advice messaging
* Mobile zoom restriction removal
* Remove hero stat tiles and extra compare badge
* Remove default workflow and scope selections
* Convert workflow and scope descriptions into collapsible help text
* Simplify scope labels to **One Habit** and **All 3 Habits**
* Remove extra outer card wrappers from the top control and methodology sections
