/**
 * Privacy-preserving ranking and distribution calculations for ClassHub.
 * CRITICAL RULE: Public ranking functions MUST NEVER expose student numbers,
 * real names, or nicknames, and public periodic test rankings MUST only
 * include top scorers within PUBLIC_TOP_LIMIT.
 */

export const PUBLIC_TOP_LIMIT = 5;

export interface ScoreItem {
  studentNumber: number;
  score: number;
  maxScore?: number;
}

export interface AnonymousRankEntry {
  rank: number;
  score: number;
  maxScore?: number;
  scoreRate?: number;
}

export interface AnonymousGrowthEntry {
  rank: number;
  delta: number;
  rateDelta?: number;
  hasDifferentMax?: boolean;
}

export interface TopScoreSummaryResult {
  topCount: number;
  topLimit: number;
  topAverageScore: number;
  topAverageRate: number;
  topMaxScore: number;
  topMaxTotal: number;
  topMaxRate: number;
  topCutoffScore: number;
  topCutoffTotal: number;
  topCutoffRate: number;
}

export interface ScoreDistributionBin {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

function getEffectiveRatio(item: ScoreItem): number {
  if (item.maxScore && item.maxScore > 0) {
    return item.score / item.maxScore;
  }
  return item.score;
}

function hasMultipleMaxScores(items: ScoreItem[]): boolean {
  const maxSet = new Set<number>();
  for (const item of items) {
    if (item.maxScore && item.maxScore > 0) {
      maxSet.add(item.maxScore);
    }
  }
  return maxSet.size > 1;
}

export function calcRatePercent(score: number, maxScore?: number): number | undefined {
  if (!maxScore || maxScore <= 0) return undefined;
  return Math.round((score / maxScore) * 1000) / 10;
}

/**
 * Restricts a public ranking list strictly to TOP-N (rank <= limit, max `limit` items).
 */
export function limitTopRankings(
  rankings: AnonymousRankEntry[],
  limit = PUBLIC_TOP_LIMIT
): AnonymousRankEntry[] {
  if (!rankings || rankings.length === 0) return [];
  return rankings.filter((r) => r.rank >= 1 && r.rank <= limit).slice(0, limit);
}

/**
 * Restricts a public growth ranking list strictly to TOP-N (rank <= limit, max `limit` items).
 */
export function limitTopGrowthRankings(
  rankings: AnonymousGrowthEntry[],
  limit = PUBLIC_TOP_LIMIT
): AnonymousGrowthEntry[] {
  if (!rankings || rankings.length === 0) return [];
  return rankings.filter((r) => r.rank >= 1 && r.rank <= limit).slice(0, limit);
}

/**
 * Ranks already-anonymized top leaderboard entries fetched via server-side LIMIT.
 * Guarantees strictly <= limit entries and rank <= limit.
 */
export function calculateAnonymousRankingsFromEntries(
  entries: Array<{ score: number; maxScore: number; scoreRate: number }>,
  limit = PUBLIC_TOP_LIMIT
): AnonymousRankEntry[] {
  if (!entries || entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => {
    const rateDiff = b.scoreRate - a.scoreRate;
    if (Math.abs(rateDiff) > 1e-9) return rateDiff;
    return b.score - a.score;
  });

  const result: AnonymousRankEntry[] = [];
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].scoreRate < sorted[i - 1].scoreRate - 1e-9) {
      currentRank = i + 1;
    }
    if (currentRank > limit || result.length >= limit) break;
    result.push({
      rank: currentRank,
      score: sorted[i].score,
      maxScore: sorted[i].maxScore,
      scoreRate: sorted[i].scoreRate,
    });
  }
  return result;
}

/**
 * Ranks already-anonymized top growth leaderboard entries fetched via server-side LIMIT.
 */
export function calculateAnonymousGrowthFromEntries(
  entries: Array<{ delta: number; rateDelta: number; hasDifferentMax?: boolean }>,
  limit = PUBLIC_TOP_LIMIT
): AnonymousGrowthEntry[] {
  if (!entries || entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => {
    const rateDiff = b.rateDelta - a.rateDelta;
    if (Math.abs(rateDiff) > 1e-9) return rateDiff;
    return b.delta - a.delta;
  });

  const result: AnonymousGrowthEntry[] = [];
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].rateDelta < sorted[i - 1].rateDelta - 1e-9) {
      currentRank = i + 1;
    }
    if (currentRank > limit || result.length >= limit) break;
    result.push({
      rank: currentRank,
      delta: sorted[i].delta,
      rateDelta: sorted[i].rateDelta,
      hasDifferentMax: sorted[i].hasDifferentMax,
    });
  }
  return result;
}

/**
 * Computes summary metrics strictly from the TOP-N public entries.
 * Never touches or infers lower-ranked students' scores.
 */
export function calculateTopScoreSummary(
  topItems: AnonymousRankEntry[],
  limit = PUBLIC_TOP_LIMIT
): TopScoreSummaryResult | null {
  const limited = limitTopRankings(topItems, limit);
  if (limited.length === 0) return null;

  const topCount = limited.length;
  const totalScoreSum = limited.reduce((acc, item) => acc + item.score, 0);
  const rates = limited.map((item) => {
    if (item.scoreRate !== undefined) return item.scoreRate;
    const max = item.maxScore && item.maxScore > 0 ? item.maxScore : 500;
    return Math.round((item.score / max) * 1000) / 10;
  });
  const totalRateSum = rates.reduce((acc, r) => acc + r, 0);

  const first = limited[0];
  const last = limited[limited.length - 1];
  const firstMax = first.maxScore && first.maxScore > 0 ? first.maxScore : 500;
  const lastMax = last.maxScore && last.maxScore > 0 ? last.maxScore : 500;

  return {
    topCount,
    topLimit: limit,
    topAverageScore: Math.round((totalScoreSum / topCount) * 10) / 10,
    topAverageRate: Math.round((totalRateSum / topCount) * 10) / 10,
    topMaxScore: first.score,
    topMaxTotal: firstMax,
    topMaxRate: rates[0],
    topCutoffScore: last.score,
    topCutoffTotal: lastMax,
    topCutoffRate: rates[rates.length - 1],
  };
}

/**
 * Computes an anonymous ranking list.
 * Strips all student identifiers.
 * Uses standard competition ranking (1224).
 */
export function calculateAnonymousRankings(items: ScoreItem[]): AnonymousRankEntry[] {
  if (!items || items.length === 0) return [];

  const useRateSort = hasMultipleMaxScores(items);

  const sorted = [...items].sort((a, b) => {
    if (useRateSort) {
      const diff = getEffectiveRatio(b) - getEffectiveRatio(a);
      if (Math.abs(diff) > 1e-9) return diff;
    }
    return b.score - a.score;
  });

  const result: AnonymousRankEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prevMetric = useRateSort ? getEffectiveRatio(sorted[i - 1]) : sorted[i - 1].score;
      const currMetric = useRateSort ? getEffectiveRatio(sorted[i]) : sorted[i].score;
      if (currMetric < prevMetric - 1e-9) {
        currentRank = i + 1;
      }
    }
    result.push({
      rank: currentRank,
      score: sorted[i].score,
      maxScore: sorted[i].maxScore,
      scoreRate: calcRatePercent(sorted[i].score, sorted[i].maxScore),
    });
  }

  return result;
}

/**
 * Computes personal standing for the current logged-in student.
 * This is ONLY displayed in the student's private view / my-page.
 */
export function calculatePersonalStanding(
  items: ScoreItem[],
  studentNumber: number
): {
  myScore: number | null;
  myMaxScore: number | null;
  myScoreRate: number | null;
  myRank: number | null;
  totalParticipants: number;
  classAverage: number;
  classAverageRate: number | null;
  classMax: number;
  classMaxTotal: number | null;
  classMin: number;
  percentile: number | null;
} {
  if (!items || items.length === 0) {
    return {
      myScore: null,
      myMaxScore: null,
      myScoreRate: null,
      myRank: null,
      totalParticipants: 0,
      classAverage: 0,
      classAverageRate: null,
      classMax: 0,
      classMaxTotal: null,
      classMin: 0,
      percentile: null,
    };
  }

  const useRateSort = hasMultipleMaxScores(items);

  const sorted = [...items].sort((a, b) => {
    if (useRateSort) {
      const diff = getEffectiveRatio(b) - getEffectiveRatio(a);
      if (Math.abs(diff) > 1e-9) return diff;
    }
    return b.score - a.score;
  });

  const total = sorted.length;
  const sum = sorted.reduce((acc, curr) => acc + curr.score, 0);
  const classAverage = Math.round((sum / total) * 10) / 10;

  const rateItems = sorted.filter((i) => i.maxScore && i.maxScore > 0);
  const classAverageRate =
    rateItems.length > 0
      ? Math.round(
          (rateItems.reduce((acc, i) => acc + (i.score / (i.maxScore as number)) * 100, 0) /
            rateItems.length) *
            10
        ) / 10
      : null;

  const maxScoreSorted = [...items].sort((a, b) => b.score - a.score);
  const classMax = maxScoreSorted[0].score;
  const classMaxTotal = maxScoreSorted[0].maxScore ?? null;
  const classMin = maxScoreSorted[maxScoreSorted.length - 1].score;

  let myScore: number | null = null;
  let myMaxScore: number | null = null;
  let myScoreRate: number | null = null;
  let myRank: number | null = null;
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prevMetric = useRateSort ? getEffectiveRatio(sorted[i - 1]) : sorted[i - 1].score;
      const currMetric = useRateSort ? getEffectiveRatio(sorted[i]) : sorted[i].score;
      if (currMetric < prevMetric - 1e-9) {
        currentRank = i + 1;
      }
    }
    if (sorted[i].studentNumber === studentNumber) {
      myScore = sorted[i].score;
      myMaxScore = sorted[i].maxScore ?? null;
      myScoreRate = calcRatePercent(sorted[i].score, sorted[i].maxScore) ?? null;
      myRank = currentRank;
      break;
    }
  }

  const percentile = myRank !== null ? Math.round(((total - myRank + 1) / total) * 100) : null;

  return {
    myScore,
    myMaxScore,
    myScoreRate,
    myRank,
    totalParticipants: total,
    classAverage,
    classAverageRate,
    classMax,
    classMaxTotal,
    classMin,
    percentile,
  };
}

/**
 * Calculates anonymous growth rankings based on difference between 2 test attempts.
 * Uses score-rate delta when tests have differing total max scores.
 * Returns only { rank, delta, rateDelta } without identifiers.
 */
export function calculateAnonymousGrowthRankings(
  prevItems: ScoreItem[],
  currItems: ScoreItem[]
): AnonymousGrowthEntry[] {
  const prevMap = new Map<number, ScoreItem>();
  prevItems.forEach((item) => prevMap.set(item.studentNumber, item));

  const deltas: { delta: number; rateDelta?: number; hasDifferentMax: boolean }[] = [];

  currItems.forEach((curr) => {
    const prev = prevMap.get(curr.studentNumber);
    if (prev) {
      const delta = curr.score - prev.score;
      const prevMax = prev.maxScore && prev.maxScore > 0 ? prev.maxScore : undefined;
      const currMax = curr.maxScore && curr.maxScore > 0 ? curr.maxScore : undefined;
      const hasDifferentMax = Boolean(prevMax && currMax && prevMax !== currMax);
      const rateDelta =
        prevMax && currMax
          ? Math.round(((curr.score / currMax) * 100 - (prev.score / prevMax) * 100) * 10) / 10
          : undefined;
      deltas.push({ delta, rateDelta, hasDifferentMax });
    }
  });

  if (deltas.length === 0) return [];

  const anyDifferentMax = deltas.some((d) => d.hasDifferentMax && d.rateDelta !== undefined);

  deltas.sort((a, b) => {
    if (anyDifferentMax && a.rateDelta !== undefined && b.rateDelta !== undefined) {
      if (Math.abs(b.rateDelta - a.rateDelta) > 1e-9) return b.rateDelta - a.rateDelta;
    }
    return b.delta - a.delta;
  });

  const result: AnonymousGrowthEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < deltas.length; i++) {
    if (i > 0) {
      const prevMetric =
        anyDifferentMax && deltas[i - 1].rateDelta !== undefined
          ? (deltas[i - 1].rateDelta as number)
          : deltas[i - 1].delta;
      const currMetric =
        anyDifferentMax && deltas[i].rateDelta !== undefined
          ? (deltas[i].rateDelta as number)
          : deltas[i].delta;
      if (currMetric < prevMetric - 1e-9) {
        currentRank = i + 1;
      }
    }
    result.push({
      rank: currentRank,
      delta: deltas[i].delta,
      rateDelta: deltas[i].rateDelta,
      hasDifferentMax: deltas[i].hasDifferentMax,
    });
  }

  return result;
}

/**
 * Calculates private growth details for a specific student.
 */
export function calculatePersonalGrowth(
  prevItems: ScoreItem[],
  currItems: ScoreItem[],
  studentNumber: number
): {
  growthDelta: number | null;
  growthRateDelta: number | null;
  hasDifferentMax: boolean;
  growthRank: number | null;
  prevScore: number | null;
  currScore: number | null;
  totalParticipants: number;
} {
  const prevMap = new Map<number, ScoreItem>();
  prevItems.forEach((item) => prevMap.set(item.studentNumber, item));

  const growthList: {
    studentNumber: number;
    delta: number;
    rateDelta?: number;
    hasDifferentMax: boolean;
    prev: number;
    curr: number;
  }[] = [];

  currItems.forEach((curr) => {
    const prev = prevMap.get(curr.studentNumber);
    if (prev) {
      const prevMax = prev.maxScore && prev.maxScore > 0 ? prev.maxScore : undefined;
      const currMax = curr.maxScore && curr.maxScore > 0 ? curr.maxScore : undefined;
      const hasDifferentMax = Boolean(prevMax && currMax && prevMax !== currMax);
      const rateDelta =
        prevMax && currMax
          ? Math.round(((curr.score / currMax) * 100 - (prev.score / prevMax) * 100) * 10) / 10
          : undefined;
      growthList.push({
        studentNumber: curr.studentNumber,
        delta: curr.score - prev.score,
        rateDelta,
        hasDifferentMax,
        prev: prev.score,
        curr: curr.score,
      });
    }
  });

  if (growthList.length === 0) {
    return {
      growthDelta: null,
      growthRateDelta: null,
      hasDifferentMax: false,
      growthRank: null,
      prevScore: null,
      currScore: null,
      totalParticipants: 0,
    };
  }

  const anyDifferentMax = growthList.some((d) => d.hasDifferentMax && d.rateDelta !== undefined);

  growthList.sort((a, b) => {
    if (anyDifferentMax && a.rateDelta !== undefined && b.rateDelta !== undefined) {
      if (Math.abs(b.rateDelta - a.rateDelta) > 1e-9) return b.rateDelta - a.rateDelta;
    }
    return b.delta - a.delta;
  });

  let growthRank: number | null = null;
  let growthDelta: number | null = null;
  let growthRateDelta: number | null = null;
  let hasDifferentMax = false;
  let prevScore: number | null = null;
  let currScore: number | null = null;
  let currentRank = 1;

  for (let i = 0; i < growthList.length; i++) {
    if (i > 0) {
      const prevMetric =
        anyDifferentMax && growthList[i - 1].rateDelta !== undefined
          ? (growthList[i - 1].rateDelta as number)
          : growthList[i - 1].delta;
      const currMetric =
        anyDifferentMax && growthList[i].rateDelta !== undefined
          ? (growthList[i].rateDelta as number)
          : growthList[i].delta;
      if (currMetric < prevMetric - 1e-9) {
        currentRank = i + 1;
      }
    }
    if (growthList[i].studentNumber === studentNumber) {
      growthRank = currentRank;
      growthDelta = growthList[i].delta;
      growthRateDelta = growthList[i].rateDelta ?? null;
      hasDifferentMax = growthList[i].hasDifferentMax;
      prevScore = growthList[i].prev;
      currScore = growthList[i].curr;
      break;
    }
  }

  return {
    growthDelta,
    growthRateDelta,
    hasDifferentMax,
    growthRank,
    prevScore,
    currScore,
    totalParticipants: growthList.length,
  };
}

/**
 * Calculates distribution buckets (histogram) for arbitrary variable max scores.
 */
export function calculateDistribution(
  scores: number[],
  maxScore = 500
): ScoreDistributionBin[] {
  if (!scores || scores.length === 0) return [];

  const total = scores.length;
  const highestObserved = Math.max(...scores, 0);
  const targetMax = Math.max(maxScore > 0 ? maxScore : 500, highestObserved);

  if (targetMax === 100) {
    const binsConfig = [
      { range: '90 - 100点', min: 90, max: 100 },
      { range: '80 - 89点', min: 80, max: 89 },
      { range: '70 - 79点', min: 70, max: 79 },
      { range: '60 - 69点', min: 60, max: 69 },
      { range: '50 - 59点', min: 50, max: 59 },
      { range: '0 - 49点', min: 0, max: 49 },
    ];

    return binsConfig.map((b) => {
      const count = scores.filter((s) => s >= b.min && s <= b.max).length;
      return {
        ...b,
        count,
        percentage: Math.round((count / total) * 100),
      };
    });
  }

  // Dynamic 6-tier distribution for variable total max scores (e.g. 50, 250, 450, 500, 700)
  if (targetMax < 10) {
    return [
      {
        range: `0 - ${targetMax}点`,
        min: 0,
        max: targetMax,
        count: total,
        percentage: 100,
      },
    ];
  }

  const p90 = Math.round(targetMax * 0.9);
  const p80 = Math.round(targetMax * 0.8);
  const p70 = Math.round(targetMax * 0.7);
  const p60 = Math.round(targetMax * 0.6);
  const p50 = Math.round(targetMax * 0.5);

  const rawBins = [
    { min: p90, max: targetMax },
    { min: p80, max: p90 - 1 },
    { min: p70, max: p80 - 1 },
    { min: p60, max: p70 - 1 },
    { min: p50, max: p60 - 1 },
    { min: 0, max: p50 - 1 },
  ].filter((b) => b.min <= b.max);

  return rawBins.map((b) => {
    const count = scores.filter((s) => s >= b.min && s <= b.max).length;
    return {
      range: `${b.min} - ${b.max}点`,
      min: b.min,
      max: b.max,
      count,
      percentage: Math.round((count / total) * 100),
    };
  });
}
