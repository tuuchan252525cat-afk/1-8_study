import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnonymousRankings,
  calculatePersonalStanding,
  calculateAnonymousGrowthRankings,
  calculatePersonalGrowth,
  calculateDistribution,
  calcSubjectAverage,
  findLowestAverageBaselineRecord,
  calculateLowestAverageRateDelta,
  calculateAnonymousGrowthFromEntries,
  formatSignedRate,
} from './privacyRankings.js';

test('calculateAnonymousRankings returns strictly rank and score with NO user identifier', () => {
  const mockScores = [
    { studentNumber: 1, score: 85 },
    { studentNumber: 2, score: 95 },
    { studentNumber: 3, score: 95 },
    { studentNumber: 4, score: 70 },
  ];

  const rankings = calculateAnonymousRankings(mockScores);

  assert.equal(rankings.length, 4);
  for (const item of rankings) {
    assert.equal('studentNumber' in item, false);
    assert.equal('nickname' in item, false);
    assert.equal(typeof item.rank, 'number');
    assert.equal(typeof item.score, 'number');
  }

  assert.equal(rankings[0].rank, 1);
  assert.equal(rankings[0].score, 95);
  assert.equal(rankings[1].rank, 1);
  assert.equal(rankings[1].score, 95);
  assert.equal(rankings[2].rank, 3);
  assert.equal(rankings[2].score, 85);
  assert.equal(rankings[3].rank, 4);
  assert.equal(rankings[3].score, 70);
});

test('calculatePersonalStanding returns private standing only for the target student', () => {
  const mockScores = [
    { studentNumber: 10, score: 90 },
    { studentNumber: 12, score: 80 },
    { studentNumber: 14, score: 70 },
  ];

  const standing = calculatePersonalStanding(mockScores, 12);

  assert.equal(standing.myScore, 80);
  assert.equal(standing.myRank, 2);
  assert.equal(standing.totalParticipants, 3);
  assert.equal(standing.classMax, 90);
  assert.equal(standing.classMin, 70);
  assert.equal(standing.classAverage, 80);
  assert.equal(standing.percentile, 67);
});

test('calculateAnonymousGrowthRankings outputs rank and delta with NO identities', () => {
  const prev = [
    { studentNumber: 1, score: 70 },
    { studentNumber: 2, score: 80 },
    { studentNumber: 3, score: 90 },
  ];
  const curr = [
    { studentNumber: 1, score: 88 },
    { studentNumber: 2, score: 85 },
    { studentNumber: 3, score: 88 },
  ];

  const growthList = calculateAnonymousGrowthRankings(prev, curr);

  assert.equal(growthList.length, 3);
  assert.equal('studentNumber' in growthList[0], false);
  assert.equal(growthList[0].rank, 1);
  assert.equal(growthList[0].delta, 18);
  assert.equal(growthList[1].rank, 2);
  assert.equal(growthList[1].delta, 5);
  assert.equal(growthList[2].rank, 3);
  assert.equal(growthList[2].delta, -2);
});

test('calculatePersonalGrowth outputs personal growth stats for target student', () => {
  const prev = [
    { studentNumber: 1, score: 70 },
    { studentNumber: 2, score: 80 },
  ];
  const curr = [
    { studentNumber: 1, score: 88 },
    { studentNumber: 2, score: 85 },
  ];

  const growth = calculatePersonalGrowth(prev, curr, 1);
  assert.equal(growth.growthDelta, 18);
  assert.equal(growth.growthRank, 1);
  assert.equal(growth.prevScore, 70);
  assert.equal(growth.currScore, 88);
});

test('calculateDistribution generates proper histogram frequency counts', () => {
  const scores = [95, 92, 88, 85, 75, 65, 55, 40];
  const distribution = calculateDistribution(scores, 100);

  const totalCount = distribution.reduce((sum, b) => sum + b.count, 0);
  assert.equal(totalCount, 8);

  const topBucket = distribution.find((b) => b.range === '90 - 100点');
  assert.equal(topBucket?.count, 2);
});

test('calcSubjectAverage and formatSignedRate round to 1 decimal place cleanly', () => {
  assert.equal(calcSubjectAverage(680, 8), 85.0);
  assert.equal(calcSubjectAverage(400, 6), 66.7);
  assert.equal(formatSignedRate(12.5), '+12.5%');
  assert.equal(formatSignedRate(0), '0.0%');
  assert.equal(formatSignedRate(-0.01), '0.0%');
  assert.equal(formatSignedRate(-2.0), '-2.0%');
});

test('findLowestAverageBaselineRecord picks lowest average and breaks ties by lowest rate then oldest date', () => {
  const records = [
    { id: 'r1', testTitle: '1学期期末', testDate: '2026-07-01', totalScore: 400, totalMaxScore: 500, subjectCount: 5 }, // avg 80, rate 80%
    { id: 'r2', testTitle: '1学期中間', testDate: '2026-05-20', totalScore: 350, totalMaxScore: 500, subjectCount: 5 }, // avg 70, rate 70%
    { id: 'r3', testTitle: '2学期中間', testDate: '2026-10-15', totalScore: 560, totalMaxScore: 900, subjectCount: 8 }, // avg 70, rate 62.2%
  ];
  const baseline = findLowestAverageBaselineRecord(records);
  assert.equal(baseline?.id, 'r3');

  // Same average and same rate -> oldest date wins
  const tied = [
    { id: 't2', testTitle: '後', testDate: '2026-10-01', totalScore: 350, totalMaxScore: 500, subjectCount: 5 },
    { id: 't1', testTitle: '先', testDate: '2026-05-01', totalScore: 350, totalMaxScore: 500, subjectCount: 5 },
  ];
  assert.equal(findLowestAverageBaselineRecord(tied)?.id, 't1');
});

test('calculateLowestAverageRateDelta returns 0 for single or baseline test and rate diff otherwise', () => {
  const single = [{ id: 'a', testTitle: 'Test A', testDate: '2026-05-01', totalScore: 350, totalMaxScore: 500, subjectCount: 5 }];
  assert.equal(calculateLowestAverageRateDelta(single[0], single).rateDelta, 0);

  const r1 = { id: 'a', testTitle: 'Test A', testDate: '2026-05-01', totalScore: 350, totalMaxScore: 500, subjectCount: 5 }; // avg 70, 70%
  const r2 = { id: 'b', testTitle: 'Test B', testDate: '2026-07-01', totalScore: 680, totalMaxScore: 800, subjectCount: 8 }; // avg 85, 85%
  const r3 = { id: 'c', testTitle: 'Test C', testDate: '2026-10-01', totalScore: 400, totalMaxScore: 500, subjectCount: 5 }; // avg 80, 80%
  const all = [r1, r2, r3];

  assert.equal(calculateLowestAverageRateDelta(r1, all).rateDelta, 0);
  assert.equal(calculateLowestAverageRateDelta(r2, all).rateDelta, 15);
  assert.equal(calculateLowestAverageRateDelta(r3, all).rateDelta, 10);
});

test('calculateAnonymousGrowthFromEntries sorts strictly by rateDelta without requiring delta', () => {
  const ranked = calculateAnonymousGrowthFromEntries([
    { rateDelta: 5.2 },
    { rateDelta: 15.0 },
    { rateDelta: 15.0 },
    { rateDelta: 0.0 },
  ]);
  assert.equal(ranked.length, 4);
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].rateDelta, 15.0);
  assert.equal('delta' in ranked[0], false);
  assert.equal(ranked[1].rank, 1);
  assert.equal(ranked[2].rank, 3);
  assert.equal(ranked[2].rateDelta, 5.2);
  assert.equal(ranked[3].rank, 4);
  assert.equal(ranked[3].rateDelta, 0.0);
});
