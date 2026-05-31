"use client";

import React, { useEffect, useState } from "react";
import { 
  CATEGORIES, 
  CategoryId, 
  calculateDecisionResult, 
  getFutureSelfMessage,
  VALUE_SCORES,
  ChoiceValue
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
  BookOpen,
  CaretDown,
  CaretUp,
  Brain,
  ShieldCheck
} from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  // Mode: "single" or "combined"
  const [mode, setMode] = useState<"single" | "combined">("single");

  // Single mode state
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("sleep");
  const [selectedOption, setSelectedOption] = useState<string>("6_8");

  // Combined mode state
  const [combinedSelections, setCombinedSelections] = useState<Record<CategoryId, string>>({
    sleep: "6_8",
    food: "proper",
    caffeine: "moderate",
  });

  // UI state
  const [showStats, setShowStats] = useState<boolean>(false);
  const [calculated, setCalculated] = useState<boolean>(false);

  // #region agent log
  const emitDebugLog = (
    runId: string,
    hypothesisId: string,
    location: string,
    message: string,
    data: Record<string, unknown>
  ) => {
    fetch("http://127.0.0.1:7351/ingest/512337e8-4fc2-47b5-9091-5d393c9a7841", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "30dfb7",
      },
      body: JSON.stringify({
        sessionId: "30dfb7",
        runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  };
  // #endregion

  // Results calculation
  const handleCalculate = () => {
    // #region agent log
    emitDebugLog("interaction-audit", "H3", "src/app/page.tsx:50", "Calculate pressed", {
      mode,
      selectedCategory,
      selectedOption,
      combinedSelections,
      showStats,
      calculated,
    });
    // #endregion
    setCalculated(true);
    setShowStats(false);
  };

  const handleReset = () => {
    // #region agent log
    emitDebugLog("interaction-audit", "H5", "src/app/page.tsx:63", "Reset pressed", {
      mode,
      selectedCategory,
      selectedOption,
      combinedSelections,
      showStats,
      calculated,
    });
    // #endregion
    setCalculated(false);
    setShowStats(false);
  };

  // Get results based on mode
  const getResults = () => {
    if (mode === "single") {
      const res = calculateDecisionResult(selectedCategory, selectedOption);
      const msg = getFutureSelfMessage(
        [{ categoryId: selectedCategory, optionId: selectedOption }],
        res.overallScore,
        res.energy.dominantSentiment,
        res.mood.dominantSentiment,
        res.focus.dominantSentiment
      );
      return { ...res, message: msg };
    } else {
      // Combined mode: average the results of all selected options
      const results = (Object.keys(combinedSelections) as CategoryId[]).map(catId => {
        return {
          catId,
          res: calculateDecisionResult(catId, combinedSelections[catId])
        };
      });

      const avgOverall = Number((results.reduce((acc, r) => acc + r.res.overallScore, 0) / results.length).toFixed(1));
      const avgEnergy = Number((results.reduce((acc, r) => acc + r.res.energy.averageScore, 0) / results.length).toFixed(1));
      const avgMood = Number((results.reduce((acc, r) => acc + r.res.mood.averageScore, 0) / results.length).toFixed(1));
      const avgFocus = Number((results.reduce((acc, r) => acc + r.res.focus.averageScore, 0) / results.length).toFixed(1));

      // Determine dominant sentiments based on nearest score
      const getSentimentFromScore = (score: number): ChoiceValue => {
        let nearest: ChoiceValue = "Normal";
        let minDiff = 999;
        (Object.keys(VALUE_SCORES) as ChoiceValue[]).forEach(val => {
          const diff = Math.abs(VALUE_SCORES[val] - score);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = val;
          }
        });
        return nearest;
      };

      const energySentiment = getSentimentFromScore(avgEnergy);
      const moodSentiment = getSentimentFromScore(avgMood);
      const focusSentiment = getSentimentFromScore(avgFocus);

      const choices = (Object.keys(combinedSelections) as CategoryId[]).map(catId => ({
        categoryId: catId,
        optionId: combinedSelections[catId]
      }));

      const msg = getFutureSelfMessage(
        choices,
        avgOverall,
        energySentiment,
        moodSentiment,
        focusSentiment
      );

      // Merge distributions by averaging them
      const mergeDistributions = (metric: "energy" | "mood" | "focus") => {
        const merged = { "Much Worse": 0, "Worse": 0, "Normal": 0, "Better": 0, "Much Better": 0 };
        results.forEach(r => {
          const dist = r.res[metric].distribution;
          (Object.keys(merged) as ChoiceValue[]).forEach(k => {
            merged[k] += dist[k];
          });
        });
        (Object.keys(merged) as ChoiceValue[]).forEach(k => {
          merged[k] = Number((merged[k] / results.length).toFixed(0));
        });
        return merged;
      };

      return {
        overallScore: avgOverall,
        energy: { averageScore: avgEnergy, distribution: mergeDistributions("energy"), dominantSentiment: energySentiment },
        mood: { averageScore: avgMood, distribution: mergeDistributions("mood"), dominantSentiment: moodSentiment },
        focus: { averageScore: avgFocus, distribution: mergeDistributions("focus"), dominantSentiment: focusSentiment },
        message: msg
      };
    }
  };

  const results = calculated ? getResults() : null;

  useEffect(() => {
    if (!calculated || !results) {
      return;
    }

    // #region agent log
    emitDebugLog("interaction-audit", "H3", "src/app/page.tsx:152", "Results rendered", {
      mode,
      overallScore: results.overallScore,
      energy: results.energy.averageScore,
      mood: results.mood.averageScore,
      focus: results.focus.averageScore,
      dominantEnergy: results.energy.dominantSentiment,
      dominantMood: results.mood.dominantSentiment,
      dominantFocus: results.focus.dominantSentiment,
    });
    // #endregion
  }, [calculated, mode, results]);

  // Helper for score color
  const getScoreColor = (score: number) => {
    if (score >= 7.5) return "text-status-positive border-status-positive bg-status-positive/10";
    if (score >= 5.0) return "text-status-caution border-status-caution bg-status-caution/10";
    return "text-status-negative border-status-negative bg-status-negative/10";
  };

  // Helper to get Phosphor icon for category
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

  return (
    <div className="flex-1 flex flex-col pb-12">
      {/* Hero Section */}
      <section className="relative px-6 pt-10 pb-8 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent overflow-hidden rounded-b-[32px]">
        {/* Abstract Geometric Background Pattern */}
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
              Check and Decide Your Own Future.<br />
              <span className="text-primary">It's That Simple.</span>
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              Use data collected from 70 real-world survey responses to instantly predict the short-term impact of your habits.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 px-5 pt-6 space-y-6">
        {/* Mode Selector */}
        <div className="bg-border/40 p-1 rounded-xl flex">
          <button
            onClick={() => {
              // #region agent log
              emitDebugLog("interaction-audit", "H1", "src/app/page.tsx:208", "Mode changed", {
                from: mode,
                to: "single",
                calculated,
                showStats,
              });
              // #endregion
              setMode("single");
              setCalculated(false);
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
              // #region agent log
              emitDebugLog("interaction-audit", "H1", "src/app/page.tsx:226", "Mode changed", {
                from: mode,
                to: "combined",
                calculated,
                showStats,
              });
              // #endregion
              setMode("combined");
              setCalculated(false);
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

        {!calculated ? (
          /* INPUT SKELETON */
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                {mode === "single" ? (
                  <>
                    {getCategoryIcon(selectedCategory, 20, "text-primary")}
                    <span>Choose a decision to analyze</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} className="text-primary" weight="duotone" />
                    <span>Set up your combined day</span>
                  </>
                )}
              </h2>

              {mode === "single" ? (
                /* SINGLE MODE INPUTS */
                <div className="space-y-4">
                  {/* Category Pill Selectors */}
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(CATEGORIES) as CategoryId[]).map(catId => (
                      <button
                        key={catId}
                        onClick={() => {
                          // #region agent log
                          emitDebugLog("interaction-audit", "H2", "src/app/page.tsx:272", "Single category changed", {
                            previousCategory: selectedCategory,
                            nextCategory: catId,
                            nextDefaultOption: CATEGORIES[catId].options[0].id,
                            selectedOption,
                          });
                          // #endregion
                          setSelectedCategory(catId);
                          setSelectedOption(CATEGORIES[catId].options[0].id);
                        }}
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

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Options</p>
                    {CATEGORIES[selectedCategory].options.map(opt => (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedOption === opt.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-surface hover:border-text-secondary/30"
                        }`}
                      >
                        <span className="text-sm font-semibold">{opt.label}</span>
                        <input
                          type="radio"
                          name="single-option"
                          checked={selectedOption === opt.id}
                          onChange={() => {
                            // #region agent log
                            emitDebugLog("interaction-audit", "H2", "src/app/page.tsx:315", "Single option changed", {
                              categoryId: selectedCategory,
                              previousValue: selectedOption,
                              nextValue: opt.id,
                            });
                            // #endregion
                            setSelectedOption(opt.id);
                          }}
                          className="accent-primary w-4 h-4"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                /* COMBINED MODE INPUTS */
                <div className="space-y-5">
                  {(Object.keys(CATEGORIES) as CategoryId[]).map(catId => (
                    <div key={catId} className="space-y-2">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        {getCategoryIcon(catId, 14, "text-primary")}
                        {CATEGORIES[catId].label}
                      </label>
                      <select
                        value={combinedSelections[catId]}
                        onChange={(e) => {
                          // #region agent log
                          emitDebugLog("interaction-audit", "H2", "src/app/page.tsx:323", "Combined selection changed", {
                            categoryId: catId,
                            previousValue: combinedSelections[catId],
                            nextValue: e.target.value,
                          });
                          // #endregion
                          setCombinedSelections({
                            ...combinedSelections,
                            [catId]: e.target.value
                          });
                        }}
                        className="w-full p-3.5 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              )}
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2"
            >
              <ArrowClockwise size={18} weight="bold" />
              Calculate Prediction
            </button>
          </div>
        ) : (
          /* RESULTS SKELETON */
          <div className="space-y-6 animate-fadeIn">
            {/* Score & Prediction Card */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <User size={18} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Future Self Says...</h3>
                    <p className="text-xs text-text-secondary">Predicted Outcome</p>
                  </div>
                </div>
                {/* Score Badge */}
                <div className={`px-3.5 py-1.5 rounded-full border-2 font-bold text-sm ${getScoreColor(results!.overallScore)}`}>
                  Score: {results!.overallScore}/10
                </div>
              </div>

              {/* Message */}
              <div className="bg-background border border-border/60 p-4 rounded-xl text-sm leading-relaxed text-text-primary italic">
                "{results!.message}"
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-background border border-border/40 p-3 rounded-xl text-center">
                  <Lightning size={16} className="mx-auto text-primary mb-1" weight="duotone" />
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Energy</p>
                  <p className="text-xs font-extrabold mt-0.5">{results!.energy.averageScore}/10</p>
                </div>
                <div className="bg-background border border-border/40 p-3 rounded-xl text-center">
                  <Smiley size={16} className="mx-auto text-primary mb-1" weight="duotone" />
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Mood</p>
                  <p className="text-xs font-extrabold mt-0.5">{results!.mood.averageScore}/10</p>
                </div>
                <div className="bg-background border border-border/40 p-3 rounded-xl text-center">
                  <Target size={16} className="mx-auto text-primary mb-1" weight="duotone" />
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Focus</p>
                  <p className="text-xs font-extrabold mt-0.5">{results!.focus.averageScore}/10</p>
                </div>
              </div>
            </div>

            {/* Detailed Stats Accordion */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => {
                  // #region agent log
                  emitDebugLog("interaction-audit", "H4", "src/app/page.tsx:397", "Stats toggled", {
                    currentShowStats: showStats,
                    nextShowStats: !showStats,
                    overallScore: results!.overallScore,
                  });
                  // #endregion
                  setShowStats(!showStats);
                }}
                className="w-full px-5 py-4 flex items-center justify-between bg-surface hover:bg-background/40 transition-all border-b border-border/50"
              >
                <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <ChartBar size={18} className="text-primary" weight="duotone" />
                  Show Detailed Statistics
                </span>
                {showStats ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
              </button>

              {showStats && (
                <div className="p-5 space-y-6 bg-background/30 border-t border-border/10">
                  {/* Energy, Mood, Focus distribution charts */}
                  {(["energy", "mood", "focus"] as const).map(metric => {
                    const metricData = results![metric];
                    const icon = metric === "energy" ? <Lightning size={16} weight="duotone" /> : metric === "mood" ? <Smiley size={16} weight="duotone" /> : <Target size={16} weight="duotone" />;
                    return (
                      <div key={metric} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                            {icon}
                            {metric}
                          </span>
                          <span className="text-xs font-bold text-primary">Avg: {metricData.averageScore}/10</span>
                        </div>

                        {/* Custom bar chart */}
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
              )}
            </div>

            {/* Back Button */}
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

      {/* Footer Instructions / Future updates placeholder */}
      <footer className="mt-auto px-6 pt-12 text-center space-y-2">
        <p className="text-[11px] text-text-secondary flex items-center justify-center gap-1">
          <BookOpen size={14} weight="duotone" />
          Based on 70 real-world survey responses.
        </p>
        {/*
          FUTURE UPDATES COMMENT PLACEHOLDER:
          If you get more survey responses in the future, you can easily update the dataset:
          1. Run the python script: `./venv/bin/python -c "..."` (or create a dedicated script) to parse the new Excel file.
          2. It will output a new `survey_data.json` at the root.
          3. Next.js will automatically hot-reload and use the updated responses!
        */}
      </footer>
    </div>
  );
}
