"use client";

import React, { useState } from "react";
import {
  CATEGORIES,
  CategoryId,
  calculateSingleDecisionWithMessage,
  calculateCombinedDayResult,
  compareOverallScores,
  getOptionLabel,
  DecisionResult,
  ChoiceValue,
} from "./utils/prediction";
import {
  Moon,
  Egg,
  Coffee,
  Lightning,
  Smiley,
  Target,
  ArrowClockwise,
  SquaresFour,
  User,
  ChartBar,
  ChartLineUp,
  BookOpen,
  CaretDown,
  CaretUp,
  Brain,
  ShieldCheck,
  Scales,
} from "@phosphor-icons/react/dist/ssr";

type ScenarioResult = DecisionResult & { message: string; label: string };

type AnalyzeResults = {
  type: "analyze";
  label: string;
} & ScenarioResult;

type CompareResults = {
  type: "compare";
  scenarioA: ScenarioResult;
  scenarioB: ScenarioResult;
  comparison: ReturnType<typeof compareOverallScores>;
};

type AppResults = AnalyzeResults | CompareResults;

type TransparencySectionId =
  | "app"
  | "modes"
  | "scores"
  | "dataset"
  | "trust"
  | "thanks";

type TransparencySection = {
  id: TransparencySectionId;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
};

const DEFAULT_COMBINED: Record<CategoryId, string> = {
  sleep: "6_8",
  food: "proper",
  caffeine: "moderate",
};

const DEFAULT_COMBINED_COMPARE_B: Record<CategoryId, string> = {
  sleep: "less_6",
  food: "skip",
  caffeine: "high",
};

const TRANSPARENCY_SECTIONS: TransparencySection[] = [
  {
    id: "app",
    title: "What this app does",
    summary:
      "FutureSelf is a score-based decision helper for short-term wellness choices, not a medical prediction engine.",
    paragraphs: [
      "FutureSelf helps you compare how different daily habit choices may affect your short-term energy, mood, and focus. The app is built around three categories: sleep, food, and caffeine.",
      "Its goal is simple: help you choose better by showing how survey respondents said they usually felt in the next 2 to 4 hours after each choice.",
      "The output is a transparent score summary and a generated Future Self message. It is not a diagnosis, a personalized forecast, or a probability estimate.",
    ],
  },
  {
    id: "modes",
    title: "How the modes work",
    summary:
      "Compare A/B is the recommended workflow for decisions, while Analyze is better for reading one setup in isolation.",
    paragraphs: [
      "Single Decision lets you focus on one category at a time, such as comparing two sleep options or analyzing one caffeine choice on its own.",
      "Combined Day lets you build a fuller setup by selecting one sleep choice, one food choice, and one caffeine choice together.",
      "Analyze gives you one result for one setup. Compare A/B gives you two results side by side so you can see which setup scores higher overall.",
    ],
    bullets: [
      "Use Single Decision when you want to isolate one factor.",
      "Use Combined Day when you want to compare complete day setups.",
      "Use Compare A/B when your goal is to choose between two possible futures.",
    ],
  },
  {
    id: "scores",
    title: "How scores are calculated",
    summary:
      "FutureSelf uses survey-response distributions and average scores. It does not calculate probabilities and it does not use a machine learning model.",
    paragraphs: [
      "For each habit choice, the app reads the survey answers tied to that exact question and converts each response into a numeric score out of 10.",
      "Energy, Mood, and Focus are averaged separately. The overall score is then the average of those three metric scores.",
      "When you build a Combined Day, the app averages the selected sleep, food, and caffeine results together. The Future Self message is generated from score bands and dominant sentiment, not from a separate predictive model.",
    ],
    bullets: [
      "Much Worse = 0",
      "Worse = 2.5",
      "Normal = 5",
      "Better = 7.5",
      "Much Better = 10",
    ],
  },
  {
    id: "dataset",
    title: "Dataset scope and limits",
    summary:
      "The current dataset contains 70 survey responses and focuses on short-term self-reported feelings, not long-term medical outcomes.",
    paragraphs: [
      "The underlying data comes from an anonymous Google Form survey that asked people how they usually feel after specific sleep, food, and caffeine choices.",
      "The app summarizes that small survey into a lightweight static dataset. This keeps the project fast and simple, but it also means the results reflect a limited sample size and self-reported experiences.",
      "Because of that, the results should be read as a directional comparison tool, not as a universal rule that will fit every person or every health context.",
    ],
  },
  {
    id: "trust",
    title: "Transparency and non-medical-advice note",
    summary:
      "This app is intentionally transparent about what it knows and what it does not know.",
    paragraphs: [
      "FutureSelf does not store personal health history, does not infer hidden medical conditions, and does not provide treatment advice.",
      "The output should be understood as a transparent summary of survey averages and sentiment patterns. It should not replace medical guidance, professional diagnosis, or individualized care.",
      "Whenever the app sounds confident, that confidence comes from the scoring rules you can inspect here, not from a black-box model.",
    ],
  },
  {
    id: "thanks",
    title: "Thank you",
    summary:
      "Thanks for trying a project that favors clear logic and honest limits over mystery or hype.",
    paragraphs: [
      "If you are using FutureSelf, thank you for spending time with an early project that tries to make wellness decisions easier to compare and easier to understand.",
      "The best version of this app is one that feels useful without pretending to know more than it truly does. Your attention, feedback, and curiosity help push it in that direction.",
    ],
  },
];

export default function Home() {
  const [mode, setMode] = useState<"single" | "combined">("combined");
  const [intent, setIntent] = useState<"analyze" | "compare">("compare");

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("sleep");
  const [selectedOption, setSelectedOption] = useState<string>("6_8");
  const [optionA, setOptionA] = useState<string>("");
  const [optionB, setOptionB] = useState<string>("");

  const [combinedSelections, setCombinedSelections] =
    useState<Record<CategoryId, string>>(DEFAULT_COMBINED);
  const [combinedSelectionsA, setCombinedSelectionsA] =
    useState<Record<CategoryId, string>>(DEFAULT_COMBINED);
  const [combinedSelectionsB, setCombinedSelectionsB] =
    useState<Record<CategoryId, string>>(DEFAULT_COMBINED_COMPARE_B);

  const [showStats, setShowStats] = useState<boolean>(false);
  const [calculated, setCalculated] = useState<boolean>(false);
  const [openTransparencySection, setOpenTransparencySection] =
    useState<TransparencySectionId | null>(null);

  const panelClass =
    "rounded-md border border-border bg-surface p-5 shadow-panel";
  const insetPanelClass =
    "rounded-sm border border-border/80 bg-surfaceAlt p-4";
  const eyebrowClass =
    "text-[11px] font-bold uppercase tracking-[0.24em] text-text-secondary";
  const fieldLabelClass =
    "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-text-secondary";
  const selectClassName =
    "w-full rounded-sm border border-border bg-surface px-3.5 py-3 text-sm font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  const handleCalculate = () => {
    setCalculated(true);
    setShowStats(false);
  };

  const handleReset = () => {
    setCalculated(false);
    setShowStats(false);
  };

  const resetCalculated = () => setCalculated(false);

  const handleIntentChange = (nextIntent: "analyze" | "compare") => {
    setIntent(nextIntent);
    if (nextIntent === "compare") {
      setOptionA("");
      setOptionB("");
    }
    resetCalculated();
  };

  const handleModeChange = (nextMode: "single" | "combined") => {
    setMode(nextMode);
    if (nextMode === "single" && intent === "compare") {
      setOptionA("");
      setOptionB("");
    }
    resetCalculated();
  };

  const handleCategoryChange = (catId: CategoryId) => {
    setSelectedCategory(catId);
    setSelectedOption(CATEGORIES[catId].options[0].id);
    setOptionA("");
    setOptionB("");
    resetCalculated();
  };

  const canCalculate =
    intent === "analyze" ||
    (mode === "single" ? Boolean(optionA && optionB) : true);

  const getResults = (): AppResults | null => {
    if (intent === "analyze") {
      if (mode === "single") {
        const res = calculateSingleDecisionWithMessage(selectedCategory, selectedOption);
        return {
          type: "analyze",
          label: getOptionLabel(selectedCategory, selectedOption),
          ...res,
        };
      }

      const res = calculateCombinedDayResult(combinedSelections);
      const label = (Object.keys(combinedSelections) as CategoryId[])
        .map(catId => getOptionLabel(catId, combinedSelections[catId]))
        .join(" + ");
      return { type: "analyze", label, ...res };
    }

    if (mode === "single") {
      if (!optionA || !optionB) return null;

      const scenarioA: ScenarioResult = {
        ...calculateSingleDecisionWithMessage(selectedCategory, optionA),
        label: `Scenario A: ${getOptionLabel(selectedCategory, optionA)}`,
      };
      const scenarioB: ScenarioResult = {
        ...calculateSingleDecisionWithMessage(selectedCategory, optionB),
        label: `Scenario B: ${getOptionLabel(selectedCategory, optionB)}`,
      };
      return {
        type: "compare",
        scenarioA,
        scenarioB,
        comparison: compareOverallScores(scenarioA.overallScore, scenarioB.overallScore),
      };
    }

    const scenarioA: ScenarioResult = {
      ...calculateCombinedDayResult(combinedSelectionsA),
      label: "Scenario A",
    };
    const scenarioB: ScenarioResult = {
      ...calculateCombinedDayResult(combinedSelectionsB),
      label: "Scenario B",
    };
    return {
      type: "compare",
      scenarioA,
      scenarioB,
      comparison: compareOverallScores(scenarioA.overallScore, scenarioB.overallScore),
    };
  };

  const results = calculated ? getResults() : null;

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return "border-status-positive/40 bg-status-positive/10 text-status-positive";
    if (score >= 5.0) return "border-status-caution/40 bg-status-caution/10 text-status-caution";
    return "border-status-negative/40 bg-status-negative/10 text-status-negative";
  };

  const getCategoryIcon = (catId: CategoryId, size = 18, className = "") => {
    switch (catId) {
      case "sleep":
        return <Moon size={size} className={className} weight="duotone" />;
      case "food":
        return <Egg size={size} className={className} weight="duotone" />;
      case "caffeine":
        return <Coffee size={size} className={className} weight="duotone" />;
    }
  };

  const getCleanScenarioLabel = (label: string) =>
    label.replace(/^(Option|Scenario) [AB]: /, "");

  const inputHeading =
    intent === "compare"
      ? mode === "combined"
        ? "Compare two full day setups"
        : "Compare two options in one category"
      : mode === "combined"
        ? "Analyze one combined day"
        : "Analyze one decision in isolation";

  const inputDescription =
    intent === "compare"
      ? mode === "combined"
        ? "Set up two day profiles and compare their average short-term scores across energy, mood, and focus."
        : "Pick one category, then compare two choices inside that category to see which one scores better."
      : mode === "combined"
        ? "Build one full day setup to inspect how the selected habits combine into one overall score."
        : "Choose one category and one option to inspect its short-term score profile on its own.";

  const renderCategoryTabs = () => (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(CATEGORIES) as CategoryId[]).map(catId => (
        <button
          key={catId}
          type="button"
          onClick={() => handleCategoryChange(catId)}
          className={`flex items-center justify-center gap-1.5 rounded-sm border px-3 py-3 text-sm font-semibold transition-all ${
            selectedCategory === catId
              ? "border-primary bg-primary text-white shadow-panel"
              : "border-border bg-surfaceAlt text-text-secondary hover:border-primary/40 hover:text-text-primary"
          }`}
        >
          {getCategoryIcon(catId, 14)}
          {CATEGORIES[catId].label}
        </button>
      ))}
    </div>
  );

  const renderOptionDropdown = (
    value: string,
    onChange: (optionId: string) => void,
    excludedOptionId?: string,
    allowEmpty = false
  ) => {
    const options = CATEGORIES[selectedCategory].options.filter(
      opt => !excludedOptionId || opt.id !== excludedOptionId
    );

    return (
      <select
        value={value}
        onChange={e => {
          onChange(e.target.value);
          resetCalculated();
        }}
        className={selectClassName}
      >
        {allowEmpty && (
          <option value="" disabled>
            Select an option
          </option>
        )}
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };

  const renderSingleDecisionInputs = () => {
    if (intent === "analyze") {
      return (
        <div className="space-y-5">
          {renderCategoryTabs()}
          <div className={insetPanelClass}>
            <label className={`${fieldLabelClass} mb-2`}>
              {getCategoryIcon(selectedCategory, 14, "text-primary")}
              {CATEGORIES[selectedCategory].label} option
            </label>
            <select
              value={selectedOption}
              onChange={e => {
                setSelectedOption(e.target.value);
                resetCalculated();
              }}
              className={selectClassName}
            >
              {CATEGORIES[selectedCategory].options.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {renderCategoryTabs()}
        <div className="space-y-3">
          <div className={insetPanelClass}>
            <p className={eyebrowClass}>Scenario A</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              First option inside the selected category.
            </p>
            <div className="mt-3">{renderOptionDropdown(optionA, setOptionA, optionB, true)}</div>
          </div>
          <div className={insetPanelClass}>
            <p className={eyebrowClass}>Scenario B</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Second option inside the same category for a side-by-side comparison.
            </p>
            <div className="mt-3">{renderOptionDropdown(optionB, setOptionB, optionA, true)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCombinedDropdowns = (
    selections: Record<CategoryId, string>,
    onChange: (catId: CategoryId, value: string) => void,
    idPrefix: string
  ) => (
    <div className="space-y-4">
      {(Object.keys(CATEGORIES) as CategoryId[]).map(catId => (
        <div key={`${idPrefix}-${catId}`} className="space-y-2">
          <label className={fieldLabelClass}>
            {getCategoryIcon(catId, 14, "text-primary")}
            {CATEGORIES[catId].label}
          </label>
          <select
            value={selections[catId]}
            onChange={e => onChange(catId, e.target.value)}
            className={selectClassName}
          >
            {CATEGORIES[catId].options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );

  const renderMetricGrid = (scenario: ScenarioResult) => (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-sm border border-border bg-surfaceAlt p-3 text-center">
        <Lightning size={16} className="mx-auto mb-1 text-primary" weight="duotone" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary">
          Energy
        </p>
        <p className="mt-1 text-sm font-extrabold text-text-primary">
          {scenario.energy.averageScore}/10
        </p>
      </div>
      <div className="rounded-sm border border-border bg-surfaceAlt p-3 text-center">
        <Smiley size={16} className="mx-auto mb-1 text-primary" weight="duotone" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary">
          Mood
        </p>
        <p className="mt-1 text-sm font-extrabold text-text-primary">
          {scenario.mood.averageScore}/10
        </p>
      </div>
      <div className="rounded-sm border border-border bg-surfaceAlt p-3 text-center">
        <Target size={16} className="mx-auto mb-1 text-primary" weight="duotone" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary">
          Focus
        </p>
        <p className="mt-1 text-sm font-extrabold text-text-primary">
          {scenario.focus.averageScore}/10
        </p>
      </div>
    </div>
  );

  const renderResultCard = (scenario: ScenarioResult) => (
    <div className={`${panelClass} space-y-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-primary/15 bg-primary/10 text-primary">
            <User size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <p className={eyebrowClass}>Scenario result</p>
            <h3 className="mt-1 truncate text-base font-bold text-text-primary">
              {scenario.label}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Generated message from the score band and dominant response sentiment.
            </p>
          </div>
        </div>
        <div className={`min-w-[102px] rounded-sm border px-3 py-2 text-right ${getScoreColor(scenario.overallScore)}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em]">Overall</p>
          <p className="mt-1 text-2xl font-extrabold font-display leading-none">
            {scenario.overallScore}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            out of 10
          </p>
        </div>
      </div>

      <div className="border-l-2 border-primary bg-surfaceAlt px-4 py-3 text-sm leading-relaxed text-text-primary">
        &ldquo;{scenario.message}&rdquo;
      </div>

      {renderMetricGrid(scenario)}
    </div>
  );

  const renderDistributionCharts = (scenario: ScenarioResult) => (
    <div className="space-y-5">
      {(["energy", "mood", "focus"] as const).map(metric => {
        const metricData = scenario[metric];
        const icon =
          metric === "energy" ? (
            <Lightning size={16} weight="duotone" />
          ) : metric === "mood" ? (
            <Smiley size={16} weight="duotone" />
          ) : (
            <Target size={16} weight="duotone" />
          );
        return (
          <div key={`${scenario.label}-${metric}`} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-text-secondary">
                {icon}
                {metric}
              </span>
              <span className="text-xs font-bold text-primary">
                Average: {metricData.averageScore}/10
              </span>
            </div>
            <div className="space-y-2 rounded-sm border border-border/80 bg-surface p-4">
              {(Object.keys(metricData.distribution) as ChoiceValue[]).map(val => {
                const pct = metricData.distribution[val];
                return (
                  <div key={val} className="flex items-center gap-3 text-xs">
                    <span className="w-20 truncate font-semibold text-text-secondary">{val}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden bg-surfaceAlt">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-bold text-text-primary">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWinnerBanner = (compareResults: CompareResults) => {
    const { comparison, scenarioA, scenarioB } = compareResults;
    const scoreA = scenarioA.overallScore;
    const scoreB = scenarioB.overallScore;

    const renderScoreDuel = (
      highlightWinner: "a" | "b" | "tie",
      variant: "dark" | "light" = "dark"
    ) => {
      const isDark = variant === "dark";
      const winnerHighlight = isDark
        ? "border-status-caution/60 bg-white/10"
        : "border-status-caution/50 bg-status-caution/10";
      const loserStyle = isDark
        ? "border-white/10 bg-white/[0.04]"
        : "border-border bg-surfaceAlt";
      const labelClass = isDark ? "text-white/65" : "text-text-secondary";
      const scoreWinnerClass = isDark ? "text-amber-200" : "text-status-caution";
      const scoreLoserClass = isDark ? "text-white" : "text-text-primary";
      const suffixClass = isDark ? "text-white/55" : "text-text-secondary";
      const vsClass = isDark ? "text-white/40" : "text-text-secondary/70";

      const labelA = getCleanScenarioLabel(scenarioA.label);
      const labelB = getCleanScenarioLabel(scenarioB.label);

      return (
        <div className="flex w-full items-stretch gap-2">
          <div
            className={`flex-1 rounded-sm border p-3 text-center transition-all ${
              highlightWinner === "a" ? winnerHighlight : loserStyle
            }`}
          >
            <p className={`truncate text-[10px] font-bold uppercase tracking-[0.22em] ${labelClass}`}>
              {labelA}
            </p>
            <p
              className={`mt-1 text-2xl font-extrabold font-display leading-none ${
                highlightWinner === "a" ? scoreWinnerClass : scoreLoserClass
              }`}
            >
              {scoreA}
            </p>
            <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${suffixClass}`}>
              out of 10
            </p>
          </div>

          <div className="flex items-center justify-center px-1">
            <span className={`text-[10px] font-extrabold uppercase tracking-[0.32em] ${vsClass}`}>
              VS
            </span>
          </div>

          <div
            className={`flex-1 rounded-sm border p-3 text-center transition-all ${
              highlightWinner === "b" ? winnerHighlight : loserStyle
            }`}
          >
            <p className={`truncate text-[10px] font-bold uppercase tracking-[0.22em] ${labelClass}`}>
              {labelB}
            </p>
            <p
              className={`mt-1 text-2xl font-extrabold font-display leading-none ${
                highlightWinner === "b" ? scoreWinnerClass : scoreLoserClass
              }`}
            >
              {scoreB}
            </p>
            <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${suffixClass}`}>
              out of 10
            </p>
          </div>
        </div>
      );
    };

    if (comparison.winner === "tie") {
      return (
        <div className={`${panelClass} animate-winnerReveal bg-surfaceAlt`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={eyebrowClass}>Comparison outcome</p>
              <h3 className="mt-1 text-lg font-extrabold text-text-primary">
                No clear winner in this comparison
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Both scenarios landed at the same overall score, so the current data does not
                point to one clearly better option here.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-status-caution/40 bg-status-caution/10 text-status-caution">
              <Scales size={24} weight="duotone" />
            </div>
          </div>
          <div className="mt-5">{renderScoreDuel("tie", "light")}</div>
        </div>
      );
    }

    const winner = comparison.winner === "a" ? scenarioA : scenarioB;

    return (
      <div className="relative overflow-hidden rounded-md border border-primary/20 bg-primary-dark text-white shadow-panelStrong animate-winnerReveal">
        <div className="absolute inset-x-0 top-0 h-1 bg-status-caution" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
                Comparison outcome
              </p>
              <h3 className="mt-1 text-lg font-extrabold font-display leading-tight">
                {getCleanScenarioLabel(winner.label)} leads this comparison
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                This setup scores {comparison.delta} point{comparison.delta === 1 ? "" : "s"}{" "}
                higher overall when energy, mood, and focus are averaged side by side.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/15 bg-white/10 text-white">
              <ChartLineUp size={24} weight="bold" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-sm border border-white/10 bg-white/[0.05] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                Leading score
              </p>
              <p className="mt-1 text-base font-bold text-white">{winner.overallScore}/10</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/[0.05] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                Delta
              </p>
              <p className="mt-1 text-base font-bold text-amber-200">+{comparison.delta}</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/[0.05] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                Basis
              </p>
              <p className="mt-1 text-base font-bold text-white">Avg. scores</p>
            </div>
          </div>

          <div className="mt-5">{renderScoreDuel(comparison.winner, "dark")}</div>
        </div>
      </div>
    );
  };

  const renderTransparencySection = (section: TransparencySection) => {
    const isOpen = openTransparencySection === section.id;
    return (
      <div key={section.id} className="rounded-sm border border-border/80 bg-surface">
        <button
          type="button"
          onClick={() =>
            setOpenTransparencySection(current => (current === section.id ? null : section.id))
          }
          className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
        >
          <div className="min-w-0">
            <p className={eyebrowClass}>{section.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {section.summary}
            </p>
          </div>
          <div className="mt-0.5 shrink-0 text-text-secondary">
            {isOpen ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
          </div>
        </button>
        {isOpen && (
          <div className="border-t border-border/80 px-4 py-4">
            <div className="space-y-3">
              {section.paragraphs.map(paragraph => (
                <p key={paragraph} className="text-sm leading-relaxed text-text-primary">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="space-y-2 text-sm leading-relaxed text-text-primary">
                  {section.bullets.map(bullet => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col pb-12">
      <section className="relative overflow-hidden border-b border-border bg-primary-dark text-white">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(46,125,91,0.25),transparent_40%)]" />

        <div className="relative space-y-5 px-5 pb-7 pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-white/15 bg-white/10">
                <Brain size={24} weight="fill" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">
                  FutureSelf
                </p>
                <p className="mt-1 text-xs text-white/72">
                  Survey-informed habit comparison
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-white/15 bg-white/10 px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                Recommended
              </p>
              <p className="mt-1 text-sm font-bold text-white">Compare A/B</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold font-display leading-tight tracking-tight">
              Compare two possible tomorrows before you commit to one.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/78">
              FutureSelf turns 70 survey responses into transparent short-term score comparisons
              for energy, mood, and focus. The goal is simple: help you choose better.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-sm border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                Dataset
              </p>
              <p className="mt-1 text-base font-bold text-white">70 responses</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                Window
              </p>
              <p className="mt-1 text-base font-bold text-white">2 to 4 hrs</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                Outputs
              </p>
              <p className="mt-1 text-base font-bold text-white">3 metrics</p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 space-y-5 px-5 pt-5">
        <div className={`${panelClass} space-y-5`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className={eyebrowClass}>Primary workflow</p>
              <p className="text-xs font-semibold text-primary">Compare first</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleIntentChange("compare")}
                className={`rounded-sm border px-4 py-3 text-sm font-semibold transition-all ${
                  intent === "compare"
                    ? "border-primary bg-primary text-white shadow-panel"
                    : "border-border bg-surfaceAlt text-text-secondary hover:border-primary/40 hover:text-text-primary"
                }`}
              >
                Compare A/B
              </button>
              <button
                type="button"
                onClick={() => handleIntentChange("analyze")}
                className={`rounded-sm border px-4 py-3 text-sm font-semibold transition-all ${
                  intent === "analyze"
                    ? "border-primary bg-primary text-white shadow-panel"
                    : "border-border bg-surfaceAlt text-text-secondary hover:border-primary/40 hover:text-text-primary"
                }`}
              >
                Analyze
              </button>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              Compare A/B is the recommended path when you want to choose between two futures.
              Analyze is better when you want a single score readout without a side-by-side test.
            </p>
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <p className={eyebrowClass}>Scope</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange("combined")}
                className={`flex items-center justify-center gap-1.5 rounded-sm border px-4 py-3 text-sm font-semibold transition-all ${
                  mode === "combined"
                    ? "border-primary bg-primary text-white shadow-panel"
                    : "border-border bg-surfaceAlt text-text-secondary hover:border-primary/40 hover:text-text-primary"
                }`}
              >
                <ShieldCheck size={16} weight="duotone" />
                Combined Day
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("single")}
                className={`flex items-center justify-center gap-1.5 rounded-sm border px-4 py-3 text-sm font-semibold transition-all ${
                  mode === "single"
                    ? "border-primary bg-primary text-white shadow-panel"
                    : "border-border bg-surfaceAlt text-text-secondary hover:border-primary/40 hover:text-text-primary"
                }`}
              >
                <SquaresFour size={16} weight="bold" />
                Single Decision
              </button>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              Combined Day compares full setups across sleep, food, and caffeine. Single Decision
              isolates one category so you can study one variable more closely.
            </p>
          </div>
        </div>

        {!calculated ? (
          <div className="space-y-5">
            <div className={`${panelClass} space-y-5`}>
              <div className="space-y-2">
                <p className={eyebrowClass}>
                  {intent === "compare" ? "Comparison setup" : "Analysis setup"}
                </p>
                <h2 className="text-lg font-bold text-text-primary">{inputHeading}</h2>
                <p className="text-sm leading-relaxed text-text-secondary">{inputDescription}</p>
              </div>

              {mode === "single" ? (
                renderSingleDecisionInputs()
              ) : intent === "analyze" ? (
                <div className={insetPanelClass}>
                  <p className={eyebrowClass}>Combined day</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    Select one option in each category to generate one combined score profile.
                  </p>
                  <div className="mt-4">
                    {renderCombinedDropdowns(
                      combinedSelections,
                      (catId, value) => {
                        setCombinedSelections({ ...combinedSelections, [catId]: value });
                        resetCalculated();
                      },
                      "combined-analyze"
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={insetPanelClass}>
                    <p className={eyebrowClass}>Scenario A</p>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      First full-day setup used as one side of the comparison.
                    </p>
                    <div className="mt-4">
                      {renderCombinedDropdowns(
                        combinedSelectionsA,
                        (catId, value) => {
                          setCombinedSelectionsA({ ...combinedSelectionsA, [catId]: value });
                          resetCalculated();
                        },
                        "combined-a"
                      )}
                    </div>
                  </div>
                  <div className={insetPanelClass}>
                    <p className={eyebrowClass}>Scenario B</p>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      Second full-day setup placed against Scenario A.
                    </p>
                    <div className="mt-4">
                      {renderCombinedDropdowns(
                        combinedSelectionsB,
                        (catId, value) => {
                          setCombinedSelectionsB({ ...combinedSelectionsB, [catId]: value });
                          resetCalculated();
                        },
                        "combined-b"
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className={`flex w-full items-center justify-center gap-2 rounded-md border px-4 py-4 text-sm font-bold transition-all ${
                canCalculate
                  ? "border-primary bg-primary text-white shadow-panel hover:bg-primary/95"
                  : "cursor-not-allowed border-border bg-border/70 text-text-secondary shadow-none"
              }`}
            >
              {intent === "compare" ? (
                <Scales size={18} weight="duotone" />
              ) : (
                <ChartLineUp size={18} weight="bold" />
              )}
              {intent === "compare" ? "Compare Predictions" : "Calculate Prediction"}
            </button>

            <div className={`${panelClass} space-y-5`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={eyebrowClass}>Methodology and transparency</p>
                    <h3 className="mt-1 text-base font-bold text-text-primary">
                      What FutureSelf is actually showing you
                    </h3>
                  </div>
                  <div className="rounded-sm border border-border bg-surfaceAlt px-3 py-2 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                      Model type
                    </p>
                    <p className="mt-1 text-sm font-bold text-text-primary">Rule-based</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  FutureSelf is a score-based comparison tool built from 70 survey responses about
                  how people usually felt in the next 2 to 4 hours after sleep, food, and caffeine
                  choices. It uses transparent averages and distributions, not probabilities and
                  not a machine learning model.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-sm border border-border bg-surfaceAlt p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                    Data
                  </p>
                  <p className="mt-1 text-sm font-bold text-text-primary">70 responses</p>
                </div>
                <div className="rounded-sm border border-border bg-surfaceAlt p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                    Horizon
                  </p>
                  <p className="mt-1 text-sm font-bold text-text-primary">Short-term</p>
                </div>
                <div className="rounded-sm border border-border bg-surfaceAlt p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                    Output
                  </p>
                  <p className="mt-1 text-sm font-bold text-text-primary">Avg. scores</p>
                </div>
              </div>

              <div className="space-y-3">
                {TRANSPARENCY_SECTIONS.map(renderTransparencySection)}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-fadeIn">
            {results?.type === "analyze" ? (
              renderResultCard(results)
            ) : results?.type === "compare" ? (
              <>
                {renderWinnerBanner(results)}
                {renderResultCard(results.scenarioA)}
                {renderResultCard(results.scenarioB)}
              </>
            ) : null}

            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-panel">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex w-full items-center justify-between gap-3 border-b border-border/70 bg-surface px-5 py-4 transition-all hover:bg-surfaceAlt"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <ChartBar size={18} className="text-primary" weight="duotone" />
                  {showStats ? "Hide detailed statistics" : "Show detailed statistics"}
                </span>
                {showStats ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
              </button>

              {showStats && results && (
                <div className="space-y-6 border-t border-border/70 bg-background/40 p-5">
                  {results.type === "analyze" ? (
                    renderDistributionCharts(results)
                  ) : (
                    <>
                      <div className="space-y-4">
                        <p className={eyebrowClass}>{results.scenarioA.label}</p>
                        {renderDistributionCharts(results.scenarioA)}
                      </div>
                      <div className="space-y-4 border-t border-border/70 pt-6">
                        <p className={eyebrowClass}>{results.scenarioB.label}</p>
                        {renderDistributionCharts(results.scenarioB)}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-transparent px-4 py-4 text-sm font-bold text-primary transition-all hover:bg-primary/5"
            >
              <ArrowClockwise size={16} weight="bold" />
              Adjust Decisions
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto space-y-2 px-5 pt-10 text-center">
        <p className="flex items-center justify-center gap-1 text-[11px] text-text-secondary">
          <BookOpen size={14} weight="duotone" />
          Built from 70 survey responses. Short-term wellness guidance only, not medical advice.
        </p>
      </footer>
    </div>
  );
}
