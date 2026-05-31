import rawData from "../survey_data.json";

export type ChoiceValue = "Much Worse" | "Worse" | "Normal" | "Better" | "Much Better";

export interface SurveyResponse {
  Timestamp: string;
  [key: string]: string | null;
}

const surveyResponses = rawData as SurveyResponse[];

// Map text values to numerical scores out of 10
export const VALUE_SCORES: Record<ChoiceValue, number> = {
  "Much Worse": 0,
  "Worse": 2.5,
  "Normal": 5,
  "Better": 7.5,
  "Much Better": 10,
};

// Define standard categories and choices
export type CategoryId = "sleep" | "food" | "caffeine";

export interface ChoiceOption {
  id: string;
  label: string;
  questionPrefix: string;
}

export const CATEGORIES: Record<CategoryId, {
  label: string;
  options: ChoiceOption[];
}> = {
  sleep: {
    label: "Sleep",
    options: [
      { id: "less_6", label: "Less than 6 hours", questionPrefix: "If you sleep less than 6 hours, how do you usually feel 2-4 hours after waking?" },
      { id: "6_8", label: "6 to 8 hours", questionPrefix: "If you sleep around 6-8 hours, how do you usually feel 2-4 hours after waking?" },
      { id: "more_8", label: "More than 8 hours", questionPrefix: "If you sleep more than 8 hours, how do you usually feel 2-4 hours after waking?" },
    ],
  },
  food: {
    label: "Food",
    options: [
      { id: "skip", label: "Skip a meal", questionPrefix: "If you skip a meal, how do you usually feel in the next 2–4 hours?" },
      { id: "proper", label: "Eat a proper meal", questionPrefix: "If you eat a proper meal, how do you usually feel in the next 2-4 hours?" },
    ],
  },
  caffeine: {
    label: "Caffeine",
    options: [
      { id: "none", label: "0 mg (No caffeine)", questionPrefix: "On days when you do not drink any amount of caffeine (0 mg), how do you feel in the next 2-4 hours after waking up?" },
      { id: "moderate", label: "Up to 200 mg (1 drink)", questionPrefix: "If you drink up to 200 mg of caffeine (Around 1 Energy Drink), how do you feel in the next 2-4 hours after drinking it?" },
      { id: "high", label: "More than 200 mg (>1 drink)", questionPrefix: "If you drink more than 200 mg of caffeine (More than 1 Energy Drink), how do you feel in the next 2-4 hours?" },
    ],
  },
};

export interface MetricStats {
  averageScore: number; // out of 10
  distribution: {
    "Much Worse": number; // percentage
    "Worse": number;
    "Normal": number;
    "Better": number;
    "Much Better": number;
  };
  dominantSentiment: ChoiceValue;
}

export interface DecisionResult {
  energy: MetricStats;
  mood: MetricStats;
  focus: MetricStats;
  overallScore: number; // out of 10
}

// Calculate statistics for a single choice option
export function calculateDecisionResult(categoryId: CategoryId, optionId: string): DecisionResult {
  const category = CATEGORIES[categoryId];
  const option = category.options.find(o => o.id === optionId);
  if (!option) {
    throw new Error(`Invalid option ID: ${optionId} for category ${categoryId}`);
  }

  const prefix = option.questionPrefix;
  const energyKey = `${prefix} [Energy]`;
  const moodKey = `${prefix} [Mood]`;
  const focusKey = `${prefix} [Focus]`;

  const metrics = {
    energy: { sum: 0, counts: { "Much Worse": 0, "Worse": 0, "Normal": 0, "Better": 0, "Much Better": 0 }, total: 0 },
    mood: { sum: 0, counts: { "Much Worse": 0, "Worse": 0, "Normal": 0, "Better": 0, "Much Better": 0 }, total: 0 },
    focus: { sum: 0, counts: { "Much Worse": 0, "Worse": 0, "Normal": 0, "Better": 0, "Much Better": 0 }, total: 0 },
  };

  surveyResponses.forEach(row => {
    const energyVal = row[energyKey] as ChoiceValue | null;
    const moodVal = row[moodKey] as ChoiceValue | null;
    const focusVal = row[focusKey] as ChoiceValue | null;

    if (energyVal && VALUE_SCORES[energyVal] !== undefined) {
      metrics.energy.sum += VALUE_SCORES[energyVal];
      metrics.energy.counts[energyVal]++;
      metrics.energy.total++;
    }
    if (moodVal && VALUE_SCORES[moodVal] !== undefined) {
      metrics.mood.sum += VALUE_SCORES[moodVal];
      metrics.mood.counts[moodVal]++;
      metrics.mood.total++;
    }
    if (focusVal && VALUE_SCORES[focusVal] !== undefined) {
      metrics.focus.sum += VALUE_SCORES[focusVal];
      metrics.focus.counts[focusVal]++;
      metrics.focus.total++;
    }
  });

  const getMetricStats = (metricData: typeof metrics.energy): MetricStats => {
    const total = metricData.total || 1;
    const averageScore = Number((metricData.sum / total).toFixed(1));
    
    const distribution = {
      "Much Worse": Number(((metricData.counts["Much Worse"] / total) * 100).toFixed(0)),
      "Worse": Number(((metricData.counts["Worse"] / total) * 100).toFixed(0)),
      "Normal": Number(((metricData.counts["Normal"] / total) * 100).toFixed(0)),
      "Better": Number(((metricData.counts["Better"] / total) * 100).toFixed(0)),
      "Much Better": Number(((metricData.counts["Much Better"] / total) * 100).toFixed(0)),
    };

    // Find dominant sentiment
    let dominantSentiment: ChoiceValue = "Normal";
    let maxCount = -1;
    (Object.keys(metricData.counts) as ChoiceValue[]).forEach(key => {
      if (metricData.counts[key] > maxCount) {
        maxCount = metricData.counts[key];
        dominantSentiment = key;
      }
    });

    return {
      averageScore,
      distribution,
      dominantSentiment,
    };
  };

  const energyStats = getMetricStats(metrics.energy);
  const moodStats = getMetricStats(metrics.mood);
  const focusStats = getMetricStats(metrics.focus);

  const overallScore = Number(((energyStats.averageScore + moodStats.averageScore + focusStats.averageScore) / 3).toFixed(1));

  return {
    energy: energyStats,
    mood: moodStats,
    focus: focusStats,
    overallScore,
  };
}

export function getSentimentFromScore(score: number): ChoiceValue {
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
}

export function calculateSingleDecisionWithMessage(
  categoryId: CategoryId,
  optionId: string
): DecisionResult & { message: string } {
  const res = calculateDecisionResult(categoryId, optionId);
  const message = getFutureSelfMessage(
    [{ categoryId, optionId }],
    res.overallScore,
    res.energy.dominantSentiment,
    res.mood.dominantSentiment,
    res.focus.dominantSentiment
  );
  return { ...res, message };
}

export function calculateCombinedDayResult(
  selections: Record<CategoryId, string>
): DecisionResult & { message: string } {
  const results = (Object.keys(selections) as CategoryId[]).map(catId => ({
    catId,
    res: calculateDecisionResult(catId, selections[catId]),
  }));

  const avgOverall = Number(
    (results.reduce((acc, r) => acc + r.res.overallScore, 0) / results.length).toFixed(1)
  );
  const avgEnergy = Number(
    (results.reduce((acc, r) => acc + r.res.energy.averageScore, 0) / results.length).toFixed(1)
  );
  const avgMood = Number(
    (results.reduce((acc, r) => acc + r.res.mood.averageScore, 0) / results.length).toFixed(1)
  );
  const avgFocus = Number(
    (results.reduce((acc, r) => acc + r.res.focus.averageScore, 0) / results.length).toFixed(1)
  );

  const energySentiment = getSentimentFromScore(avgEnergy);
  const moodSentiment = getSentimentFromScore(avgMood);
  const focusSentiment = getSentimentFromScore(avgFocus);

  const choices = (Object.keys(selections) as CategoryId[]).map(catId => ({
    categoryId: catId,
    optionId: selections[catId],
  }));

  const message = getFutureSelfMessage(
    choices,
    avgOverall,
    energySentiment,
    moodSentiment,
    focusSentiment
  );

  const mergeDistributions = (metric: "energy" | "mood" | "focus") => {
    const merged: Record<ChoiceValue, number> = {
      "Much Worse": 0,
      Worse: 0,
      Normal: 0,
      Better: 0,
      "Much Better": 0,
    };
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
    energy: {
      averageScore: avgEnergy,
      distribution: mergeDistributions("energy"),
      dominantSentiment: energySentiment,
    },
    mood: {
      averageScore: avgMood,
      distribution: mergeDistributions("mood"),
      dominantSentiment: moodSentiment,
    },
    focus: {
      averageScore: avgFocus,
      distribution: mergeDistributions("focus"),
      dominantSentiment: focusSentiment,
    },
    message,
  };
}

export function compareOverallScores(
  scoreA: number,
  scoreB: number
): { winner: "a" | "b" | "tie"; delta: number } {
  const delta = Number(Math.abs(scoreA - scoreB).toFixed(1));
  if (scoreA > scoreB) return { winner: "a", delta };
  if (scoreB > scoreA) return { winner: "b", delta };
  return { winner: "tie", delta: 0 };
}

export function getDefaultCompareOptions(categoryId: CategoryId): [string, string] {
  const options = CATEGORIES[categoryId].options;
  return [options[0].id, options[1]?.id ?? options[0].id];
}

export function getOptionLabel(categoryId: CategoryId, optionId: string): string {
  const option = CATEGORIES[categoryId].options.find(o => o.id === optionId);
  return option?.label ?? optionId;
}

// Generate future self message based on the overall score and metrics
export function getFutureSelfMessage(
  choices: { categoryId: CategoryId; optionId: string }[],
  overallScore: number,
  energySentiment: ChoiceValue,
  moodSentiment: ChoiceValue,
  focusSentiment: ChoiceValue
): string {
  const isMultiple = choices.length > 1;
  
  if (overallScore >= 7.5) {
    return `Hey, it's your Future Self! Honestly, you made an amazing choice. By doing this, I am feeling absolutely fantastic! My energy is ${energySentiment.toLowerCase()}, my mood is ${moodSentiment.toLowerCase()}, and my focus is ${focusSentiment.toLowerCase()}. Keep making decisions like this, your body will thank you later!`;
  } else if (overallScore >= 5.5) {
    return `Hey! Your Future Self here. Things are looking pretty stable and balanced. I'm feeling mostly ${energySentiment.toLowerCase()} in terms of energy and my focus is ${focusSentiment.toLowerCase()}. It's a solid, safe choice that keeps us moving forward without any major crashes.`;
  } else if (overallScore >= 3.5) {
    return `Hello from the future. I'm hanging in there, but things could definitely be better. My energy is feeling a bit ${energySentiment.toLowerCase()} and my mood is ${moodSentiment.toLowerCase()}. Maybe we should reconsider this combination next time to avoid feeling sluggish?`;
  } else {
    return `Oh no, it's your Future Self... and I am struggling! This decision is hitting us hard. I'm feeling ${energySentiment.toLowerCase()} with ${moodSentiment.toLowerCase()} mood and ${focusSentiment.toLowerCase()} focus. Please, let's make a different choice so I don't have to suffer like this!`;
  }
}
