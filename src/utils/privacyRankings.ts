/**
 * Privacy-preserving ranking and distribution calculations for ClassHub.
 * CRITICAL RULE: Public ranking functions MUST NEVER expose student numbers,
 * real names, or nicknames in the returned public structures.
 */

export interface ScoreItem {
  studentNumber: number;
  score: number;
}

export interface AnonymousRankEntry {
  rank: number;
  score: number;
}

export interface AnonymousGrowthEntry {
  rank: number;
  delta: number;
}

export interface ScoreDistributionBin {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

/**
 * Computes an anonymous ranking list.
 * Strips all student identifiers.
 * Uses standard competition ranking (1224).
 */
export function calculateAnonymousRankings(items: ScoreItem[]): AnonymousRankEntry[] {
  if (!items || items.length === 0) return [];

  // Sort descending by score
  const sorted = [...items].sort((a, b) => b.score - a.score);

  const result: AnonymousRankEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      currentRank = i + 1;
    }
    result.push({
      rank: currentRank,
      score: sorted[i].score,
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
  myRank: number | null;
  totalParticipants: number;
  classAverage: number;
  classMax: number;
  classMin: number;
  percentile: number | null;
} {
  if (!items || items.length === 0) {
    return {
      myScore: null,
      myRank: null,
      totalParticipants: 0,
      classAverage: 0,
      classMax: 0,
      classMin: 0,
      percentile: null,
    };
  }

  const sorted = [...items].sort((a, b) => b.score - a.score);
  const total = sorted.length;
  const sum = sorted.reduce((acc, curr) => acc + curr.score, 0);
  const classAverage = Math.round((sum / total) * 10) / 10;
  const classMax = sorted[0].score;
  const classMin = sorted[sorted.length - 1].score;

  let myScore: number | null = null;
  let myRank: number | null = null;
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      currentRank = i + 1;
    }
    if (sorted[i].studentNumber === studentNumber) {
      myScore = sorted[i].score;
      myRank = currentRank;
      break;
    }
  }

  const percentile = myRank !== null ? Math.round(((total - myRank + 1) / total) * 100) : null;

  return {
    myScore,
    myRank,
    totalParticipants: total,
    classAverage,
    classMax,
    classMin,
    percentile,
  };
}

/**
 * Calculates anonymous growth rankings based on difference between 2 test attempts.
 * Returns only { rank, delta } without identifiers.
 */
export function calculateAnonymousGrowthRankings(
  prevItems: ScoreItem[],
  currItems: ScoreItem[]
): AnonymousGrowthEntry[] {
  const prevMap = new Map<number, number>();
  prevItems.forEach((item) => prevMap.set(item.studentNumber, item.score));

  const deltas: { delta: number }[] = [];

  currItems.forEach((curr) => {
    if (prevMap.has(curr.studentNumber)) {
      const prevScore = prevMap.get(curr.studentNumber)!;
      deltas.push({ delta: curr.score - prevScore });
    }
  });

  if (deltas.length === 0) return [];

  // Sort descending by delta (highest improvement first)
  deltas.sort((a, b) => b.delta - a.delta);

  const result: AnonymousGrowthEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < deltas.length; i++) {
    if (i > 0 && deltas[i].delta < deltas[i - 1].delta) {
      currentRank = i + 1;
    }
    result.push({
      rank: currentRank,
      delta: deltas[i].delta,
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
  growthRank: number | null;
  prevScore: number | null;
  currScore: number | null;
  totalParticipants: number;
} {
  const prevMap = new Map<number, number>();
  prevItems.forEach((item) => prevMap.set(item.studentNumber, item.score));

  const growthList: { studentNumber: number; delta: number; prev: number; curr: number }[] = [];

  currItems.forEach((curr) => {
    if (prevMap.has(curr.studentNumber)) {
      const prev = prevMap.get(curr.studentNumber)!;
      growthList.push({
        studentNumber: curr.studentNumber,
        delta: curr.score - prev,
        prev,
        curr: curr.score,
      });
    }
  });

  if (growthList.length === 0) {
    return {
      growthDelta: null,
      growthRank: null,
      prevScore: null,
      currScore: null,
      totalParticipants: 0,
    };
  }

  growthList.sort((a, b) => b.delta - a.delta);

  let growthRank: number | null = null;
  let growthDelta: number | null = null;
  let prevScore: number | null = null;
  let currScore: number | null = null;
  let currentRank = 1;

  for (let i = 0; i < growthList.length; i++) {
    if (i > 0 && growthList[i].delta < growthList[i - 1].delta) {
      currentRank = i + 1;
    }
    if (growthList[i].studentNumber === studentNumber) {
      growthRank = currentRank;
      growthDelta = growthList[i].delta;
      prevScore = growthList[i].prev;
      currScore = growthList[i].curr;
      break;
    }
  }

  return {
    growthDelta,
    growthRank,
    prevScore,
    currScore,
    totalParticipants: growthList.length,
  };
}

/**
 * Calculates distribution buckets (histogram) for 500-point total or 100-point individual tests.
 */
export function calculateDistribution(
  scores: number[],
  maxScore = 500
): ScoreDistributionBin[] {
  if (!scores || scores.length === 0) return [];

  const total = scores.length;

  if (maxScore <= 100) {
    // 10-point buckets for 100 max
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

  // 50-point buckets for 500 max
  const binsConfig = [
    { range: '450 - 500点', min: 450, max: 500 },
    { range: '400 - 449点', min: 400, max: 449 },
    { range: '350 - 399点', min: 350, max: 399 },
    { range: '300 - 349点', min: 300, max: 349 },
    { range: '250 - 299点', min: 250, max: 299 },
    { range: '0 - 249点', min: 0, max: 249 },
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
