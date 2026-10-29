import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnonymousRankings,
  calculatePersonalStanding,
  calculateAnonymousGrowthRankings,
  calculatePersonalGrowth,
  calculateDistribution,
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
  // Verify strictly NO studentNumber property
  for (const item of rankings) {
    assert.equal('studentNumber' in item, false);
    assert.equal('nickname' in item, false);
    assert.equal(typeof item.rank, 'number');
    assert.equal(typeof item.score, 'number');
  }

  // 95 and 95 should both be rank 1
  assert.equal(rankings[0].rank, 1);
  assert.equal(rankings[0].score, 95);
  assert.equal(rankings[1].rank, 1);
  assert.equal(rankings[1].score, 95);

  // 85 should be rank 3 (standard competition ranking: 1, 1, 3, 4)
  assert.equal(rankings[2].rank, 3);
  assert.equal(rankings[2].score, 85);

  // 70 should be rank 4
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
  assert.equal(standing.percentile, 67); // (3 - 2 + 1)/3 = 66.7% => 67%
});

test('calculateAnonymousGrowthRankings outputs rank and delta with NO identities', () => {
  const prev = [
    { studentNumber: 1, score: 70 },
    { studentNumber: 2, score: 80 },
    { studentNumber: 3, score: 90 },
  ];
  const curr = [
    { studentNumber: 1, score: 88 }, // +18
    { studentNumber: 2, score: 85 }, // +5
    { studentNumber: 3, score: 88 }, // -2
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
    { studentNumber: 1, score: 88 }, // +18
    { studentNumber: 2, score: 85 }, // +5
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
