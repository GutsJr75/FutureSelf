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
  Trophy,
  Sparkle,
  Crown,
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

export default function Home() {
  const [mode, setMode] = useState<"single" | "combined">("single");
  const [intent, setIntent] = useState<"analyze" | "compare">("analyze");

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

  const handleCalculate = () => {
    setCalculated(true);
    setShowStats(false);
  };

  const handleReset = () => {
    setCalculated(false);
    setShowStats(false);
  };

  const resetCalculated = () => setCalculated(false);

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
        .join(" · ");
      return { type: "analyze", label, ...res };
    }

    if (mode === "single") {
      if (!optionA || !optionB) return null;

      const scenarioA: ScenarioResult = {
        ...calculateSingleDecisionWithMessage(selectedCategory, optionA),
        label: `Option A: ${getOptionLabel(selectedCategory, optionA)}`,
      };
      const scenarioB: ScenarioResult = {
        ...calculateSingleDecisionWithMessage(selectedCategory, optionB),
        label: `Option B: ${getOptionLabel(selectedCategory, optionB)}`,
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
      label: "Day A",
    };
    const scenarioB: ScenarioResult = {
      ...calculateCombinedDayResult(combinedSelectionsB),
      label: "Day B",
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
    if (score >= 7.5) return "text-status-positive border-status-positive bg-status-positive/10";
    if (score >= 5.0) return "text-status-caution border-status-caution bg-status-caution/10";
    return "text-status-negative border-status-negative bg-status-negative/10";
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

  const fieldLabelClass =
    "text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5";
  const selectClassName =
    "w-full p-3.5 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  const renderCategoryPills = () => (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(CATEGORIES) as CategoryId[]).map(catId => (
        <button
          key={catId}
          type="button"
          onClick={() => handleCategoryChange(catId)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-1.5 ${
            selectedCategory === catId
              ? "bg-primary border-primary text-white shadow-sm"
              : "bg-surface border-border text-text-secondary hover:border-text-secondary"
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
        <div className="space-y-4">
          {renderCategoryPills()}
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
      );
    }

    return (
      <div className="space-y-4">
        {renderCategoryPills()}
        <div className="space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Option A</p>
          {renderOptionDropdown(optionA, setOptionA, optionB, true)}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Option B</p>
          {renderOptionDropdown(optionB, setOptionB, optionA, true)}
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
    <div className="grid grid-cols-3 gap-3 pt-1">
      <div className="bg-background border border-border/40 p-3 rounded-xl text-center">
        <Lightning size={16} className="mx-auto text-primary mb-1" weight="duotone" />
        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Energy</p>
        <p className="text-xs font-extrabold mt-0.5">{scenario.energy.averageScore}/10</p>
      </div>
      <div className="bg-background border border-border/40 p-3 rounded-xl text-center">
        <Smiley size={16} className="mx-auto text-primary mb-1" weight="duotone" />
        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Mood</p>
        <p className="text-xs font-extrabold mt-0.5">{scenario.mood.averageScore}/10</p>
      </div>
      <div className="bg-background border border-border/40 p-3 rounded-xl text-center">
        <Target size={16} className="mx-auto text-primary mb-1" weight="duotone" />
        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Focus</p>
        <p className="text-xs font-extrabold mt-0.5">{scenario.focus.averageScore}/10</p>
      </div>
    </div>
  );

  const renderResultCard = (scenario: ScenarioResult) => (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-5 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <User size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-primary truncate">{scenario.label}</h3>
            <p className="text-xs text-text-secondary">Future Self Says...</p>
          </div>
        </div>
        <div
          className={`px-3.5 py-1.5 rounded-full border-2 font-bold text-sm shrink-0 ${getScoreColor(scenario.overallScore)}`}
        >
          Score: {scenario.overallScore}/10
        </div>
      </div>

      <div className="bg-background border border-border/60 p-4 rounded-xl text-sm leading-relaxed text-text-primary italic">
        &ldquo;{scenario.message}&rdquo;
      </div>

      {renderMetricGrid(scenario)}
    </div>
  );

  const renderDistributionCharts = (scenario: ScenarioResult) => (
    <div className="space-y-6">
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
          <div key={`${scenario.label}-${metric}`} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                {icon}
                {metric}
              </span>
              <span className="text-xs font-bold text-primary">Avg: {metricData.averageScore}/10</span>
            </div>
            <div className="space-y-1.5 bg-surface border border-border/60 p-3.5 rounded-xl">
              {(Object.keys(metricData.distribution) as ChoiceValue[]).map(val => {
                const pct = metricData.distribution[val];
                return (
                  <div key={val} className="flex items-center text-xs gap-3">
                    <span className="w-20 text-text-secondary font-semibold truncate">{val}</span>
                    <div className="flex-1 h-3 bg-background rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-primary/80 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-text-primary">{pct}%</span>
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
        ? "bg-white/20 ring-2 ring-amber-300/80 shadow-lg shadow-black/10"
        : "bg-status-caution/15 ring-2 ring-status-caution/40 shadow-md shadow-status-caution/10";
      const loserStyle = isDark ? "bg-white/5" : "bg-background/80";
      const labelClass = isDark ? "text-white/70" : "text-text-secondary";
      const scoreWinnerClass = isDark ? "text-amber-200" : "text-status-caution";
      const scoreLoserClass = isDark ? "text-white/90" : "text-text-primary";
      const suffixClass = isDark ? "text-white/60" : "text-text-secondary";
      const vsClass = isDark ? "text-white/50" : "text-text-secondary/60";

      const labelA = scenarioA.label.replace(/^Option [AB]: /, "");
      const labelB = scenarioB.label.replace(/^Option [AB]: /, "");

      return (
        <div className="flex items-stretch gap-2 w-full">
          <div
            className={`flex-1 rounded-xl p-3 text-center transition-all ${
              highlightWinner === "a" ? winnerHighlight : loserStyle
            }`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate ${labelClass}`}>
              {labelA}
            </p>
            <p
              className={`text-2xl font-extrabold font-display leading-none ${
                highlightWinner === "a" ? scoreWinnerClass : scoreLoserClass
              }`}
            >
              {scoreA}
            </p>
            <p className={`text-[10px] mt-0.5 ${suffixClass}`}>/10</p>
          </div>

          <div className="flex items-center justify-center px-1">
            <span className={`text-[10px] font-extrabold tracking-widest ${vsClass}`}>VS</span>
          </div>

          <div
            className={`flex-1 rounded-xl p-3 text-center transition-all ${
              highlightWinner === "b" ? winnerHighlight : loserStyle
            }`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate ${labelClass}`}>
              {labelB}
            </p>
            <p
              className={`text-2xl font-extrabold font-display leading-none ${
                highlightWinner === "b" ? scoreWinnerClass : scoreLoserClass
              }`}
            >
              {scoreB}
            </p>
            <p className={`text-[10px] mt-0.5 ${suffixClass}`}>/10</p>
          </div>
        </div>
      );
    };

    if (comparison.winner === "tie") {
      return (
        <div className="relative overflow-hidden rounded-2xl border border-status-caution/30 bg-gradient-to-br from-amber-50 via-surface to-status-caution/10 p-5 shadow-lg shadow-status-caution/10 animate-winnerReveal">
          <div className="absolute top-0 right-0 w-28 h-28 bg-status-caution/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-caution/15 text-[10px] font-bold uppercase tracking-widest text-status-caution">
              <Scales size={12} weight="bold" />
              It&apos;s a Draw
            </span>
            <div className="w-14 h-14 rounded-2xl bg-status-caution/10 flex items-center justify-center animate-trophyPop">
              <Scales size={30} className="text-status-caution" weight="duotone" />
            </div>
            <p className="text-sm font-semibold text-text-primary max-w-xs">
              Both scenarios land at the same overall score. No clear winner this time.
            </p>
            <div className="w-full">{renderScoreDuel("tie", "light")}</div>
          </div>
        </div>
      );
    }

    const winner = comparison.winner === "a" ? scenarioA : scenarioB;
    const winnerShortLabel = winner.label.replace(/^Option [AB]: /, "");

    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary via-[#185955] to-status-positive p-5 text-white shadow-xl shadow-primary/30 animate-winnerReveal">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer opacity-40" />
        </div>

        <div className="relative flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest">
            <Sparkle size={11} weight="fill" className="text-amber-300" />
            Winner
            <Sparkle size={11} weight="fill" className="text-amber-300" />
          </span>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300/30 to-amber-500/20 flex items-center justify-center shadow-lg shadow-black/20 animate-trophyPop ring-2 ring-amber-300/40">
            <Trophy size={34} weight="fill" className="text-amber-300 drop-shadow-sm" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <Crown size={16} weight="fill" className="text-amber-300 shrink-0" />
              <h3 className="text-lg font-extrabold font-display leading-tight">{winnerShortLabel}</h3>
            </div>
            <p className="text-sm font-semibold text-amber-200">
              +{comparison.delta} point{comparison.delta === 1 ? "" : "s"} ahead overall
            </p>
          </div>

          <div className="w-full pt-1">{renderScoreDuel(comparison.winner, "dark")}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <section className="relative px-6 pt-10 pb-8 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent overflow-hidden rounded-b-[32px]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-status-positive/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
              <Brain size={20} weight="fill" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80 font-display">
              FutureSelf
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight leading-tight">
              Check and Decide Your Own Future.
              <br />
              <span className="text-primary">It&apos;s That Simple.</span>
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              Use data collected from 70 real-world survey responses to instantly predict the
              short-term impact of your habits.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 px-5 pt-6 space-y-6">
        <div className="bg-border/40 p-1 rounded-xl flex">
          <button
            onClick={() => {
              setMode("single");
              resetCalculated();
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "single"
                ? "bg-surface text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <SquaresFour size={16} weight="bold" />
            Single Decision
          </button>
          <button
            onClick={() => {
              setMode("combined");
              resetCalculated();
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "combined"
                ? "bg-surface text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <SquaresFour size={16} weight="bold" />
            Combined Day
          </button>
        </div>

        <div className="bg-border/30 p-1 rounded-xl flex">
          <button
            onClick={() => {
              setIntent("analyze");
              resetCalculated();
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              intent === "analyze"
                ? "bg-surface text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Analyze
          </button>
          <button
            onClick={() => {
              setIntent("compare");
              setOptionA("");
              setOptionB("");
              resetCalculated();
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              intent === "compare"
                ? "bg-surface text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Compare A/B
          </button>
        </div>

        {!calculated ? (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                {mode === "single" ? (
                  <>
                    {getCategoryIcon(selectedCategory, 20, "text-primary")}
                    <span>
                      {intent === "analyze"
                        ? "Choose a decision to analyze"
                        : "Compare two options in the same category"}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} className="text-primary" weight="duotone" />
                    <span>
                      {intent === "analyze"
                        ? "Set up your combined day"
                        : "Compare two full days"}
                    </span>
                  </>
                )}
              </h2>

              {mode === "single" ? (
                renderSingleDecisionInputs()
              ) : intent === "analyze" ? (
                renderCombinedDropdowns(combinedSelections, (catId, value) => {
                  setCombinedSelections({ ...combinedSelections, [catId]: value });
                  resetCalculated();
                }, "combined-analyze")
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Day A</p>
                    {renderCombinedDropdowns(
                      combinedSelectionsA,
                      (catId, value) => {
                        setCombinedSelectionsA({ ...combinedSelectionsA, [catId]: value });
                        resetCalculated();
                      },
                      "combined-a"
                    )}
                  </div>
                  <div className="border-t border-border/60 pt-5 space-y-3">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Day B</p>
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
              )}
            </div>

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className={`w-full py-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                canCalculate
                  ? "bg-primary hover:bg-primary/95 text-white shadow-primary/10"
                  : "bg-border text-text-secondary cursor-not-allowed shadow-none"
              }`}
            >
              {intent === "compare" ? (
                <Scales size={18} weight="duotone" />
              ) : (
                <ChartLineUp size={18} weight="bold" />
              )}
              {intent === "compare" ? "Compare Predictions" : "Calculate Prediction"}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {results?.type === "analyze" ? (
              renderResultCard(results)
            ) : results?.type === "compare" ? (
              <>
                {renderWinnerBanner(results)}
                {renderResultCard(results.scenarioA)}
                {renderResultCard(results.scenarioB)}
              </>
            ) : null}

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full px-5 py-4 flex items-center justify-between bg-surface hover:bg-background/40 transition-all border-b border-border/50"
              >
                <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <ChartBar size={18} className="text-primary" weight="duotone" />
                  {showStats ? "Hide Detailed Statistics" : "Show Detailed Statistics"}
                </span>
                {showStats ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
              </button>

              {showStats && results && (
                <div className="p-5 space-y-8 bg-background/30 border-t border-border/10">
                  {results.type === "analyze" ? (
                    renderDistributionCharts(results)
                  ) : (
                    <>
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">
                          {results.scenarioA.label}
                        </p>
                        {renderDistributionCharts(results.scenarioA)}
                      </div>
                      <div className="border-t border-border/40 pt-6 space-y-4">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">
                          {results.scenarioB.label}
                        </p>
                        {renderDistributionCharts(results.scenarioB)}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-4 border-2 border-primary text-primary hover:bg-primary/5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <ArrowClockwise size={16} weight="bold" />
              Adjust Decisions
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto px-6 pt-12 text-center space-y-2">
        <p className="text-[11px] text-text-secondary flex items-center justify-center gap-1">
          <BookOpen size={14} weight="duotone" />
          Based on 70 real-world survey responses.
        </p>
      </footer>
    </div>
  );
}
