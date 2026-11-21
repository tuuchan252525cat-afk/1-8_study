import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio requires the app server to listen on port 3000 (Nginx proxies 8080 -> 3000)
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Enable CORS and explicitly allow all standard HTTP methods to prevent 405 Method Not Allowed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// AI Test Analysis & Predicted Quiz Generator Endpoint
app.post('/api/ai/analyze-test', async (req, res) => {
  try {
    const { fileUrl, fileData, mimeType, textPrompt } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Returning smart sample response.');
      return res.json({
        analysis: {
          subject: textPrompt?.includes('英語') ? '英語' : textPrompt?.includes('国語') ? '国語' : '数学',
          unit: textPrompt?.includes('二次関数') ? '二次関数とグラフ' : '定期考査・重点突破テーマ',
          keywords: ['頂点の座標', '最大値・最小値', '判別式', '軸の平行移動', '標準形変形'],
          trends: [
            'グラフの平行移動と軸の決定に関する標準問題が毎年必ず出題されています',
            '文字係数を含む最大値・最小値のケース分け（定義域の端点吟味）が差のつく解法です',
            '計算過程での記号ミスに注意し、グラフの概形を描いて確認することが高得点へのカギです'
          ]
        },
        predicted_questions: [
          {
            id: 1,
            question: '2次関数 y = 2(x - 3)^2 + 1 のグラフの頂点の座標として正しいものを答えなさい。',
            options: ['(3, 1)', '(-3, 1)', '(3, -1)', '(1, 3)'],
            correct_index: 0,
            explanation: '標準形 y = a(x - p)^2 + q の頂点は (p, q) です。p = 3, q = 1 より頂点は (3, 1) となります。'
          },
          {
            id: 2,
            question: '2次方程式 x^2 - 6x + k = 0 が異なる2つの実数解をもつときの定数 k の値の範囲を求めなさい。',
            options: ['k < 9', 'k > 9', 'k <= 9', 'k = 9'],
            correct_index: 0,
            explanation: '判別式 D/4 = (-3)^2 - 1*k = 9 - k > 0 より、k < 9 となります。'
          },
          {
            id: 3,
            question: '放物線 y = x^2 - 4x + 5 の頂点の座標を求めなさい。',
            options: ['(2, 1)', '(-2, 1)', '(2, 5)', '(4, 5)'],
            correct_index: 0,
            explanation: '平方完成を行うと y = (x - 2)^2 - 4 + 5 = (x - 2)^2 + 1 となるため、頂点は (2, 1) です。'
          },
          {
            id: 4,
            question: '2次関数 y = -x^2 + 2x + 3 の最大値として正しいものを答えなさい。',
            options: ['4', '3', '1', '5'],
            correct_index: 0,
            explanation: '平方完成すると y = -(x - 1)^2 + 4 となります。x = 1 のとき最大値 4 をとります。'
          },
          {
            id: 5,
            question: '放物線 y = x^2 を x 軸方向に 2、y 軸方向に -3 だけ平行移動した放物線の方程式を求めなさい。',
            options: ['y = (x - 2)^2 - 3', 'y = (x + 2)^2 - 3', 'y = (x - 2)^2 + 3', 'y = x^2 - 2x - 3'],
            correct_index: 0,
            explanation: 'x に x - 2、y に y + 3 を代入すると y + 3 = (x - 2)^2 つまり y = (x - 2)^2 - 3 となります。'
          }
        ]
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];

    if (typeof fileUrl === 'string' && /^https?:\/\//i.test(fileUrl)) {
      const remoteResp = await fetch(fileUrl, { signal: AbortSignal.timeout(20000) });
      if (!remoteResp.ok) {
        return res.status(400).json({
          error: 'ファイルURLからの読み込みに失敗しました',
          message: `ストレージURLの取得に失敗しました (HTTP ${remoteResp.status})`,
        });
      }
      const arrayBuf = await remoteResp.arrayBuffer();
      if (arrayBuf.byteLength > 15 * 1024 * 1024) {
        return res.status(400).json({
          error: 'ファイルサイズが大きすぎます',
          message: 'AI分析に対応しているファイルサイズは15MBまでです。',
        });
      }
      const headerMime = remoteResp.headers.get('content-type')?.split(';')[0]?.trim();
      const inferredMime = fileUrl.toLowerCase().split('?')[0].endsWith('.pdf')
        ? 'application/pdf'
        : 'image/jpeg';
      const resolvedMime =
        (headerMime && headerMime !== 'application/octet-stream' ? headerMime : '') ||
        mimeType ||
        inferredMime;

      parts.push({
        inlineData: {
          data: Buffer.from(arrayBuf).toString('base64'),
          mimeType: resolvedMime,
        },
      });
    } else if (fileData && mimeType) {
      const cleanData = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      parts.push({
        inlineData: {
          data: cleanData,
          mimeType: mimeType,
        },
      });
    }

    const promptText = `
添付された過去のテスト問題（画像/PDF/テキスト）から傾向を分析し、予想問題を作成してください。
${textPrompt ? `【問題文・テキスト入力】:\n${textPrompt}` : ''}
`.trim();

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: `あなたは中学校・高校の定期テスト・模試の出題傾向分析および予想問題作成を行うAI講師です。与えられたテスト問題や学習データから傾向を分析し、重要キーワード、傾向のまとめ、および高品質な4択予想問題（5〜10問）を作成してください。必ず指定されたJSON形式のみで応答してください。`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING, description: '対象科目（例: 数学、英語、国語、理科など）' },
                unit: { type: Type.STRING, description: '単元名・分野（例: 二次関数、関係代名詞など）' },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '頻出キーワード・重要ポイント（最大5個）'
                },
                trends: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '出題傾向のまとめ（最小限の箇条書き3つ程度）'
                }
              },
              required: ['subject', 'unit', 'keywords', 'trends']
            },
            predicted_questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER, description: '問題ID (1から始まる整数)' },
                  question: { type: Type.STRING, description: '問題文' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '4つの選択肢'
                  },
                  correct_index: { type: Type.INTEGER, description: '正解の選択肢のインデックス (0〜3)' },
                  explanation: { type: Type.STRING, description: '正解の解説文' }
                },
                required: ['id', 'question', 'options', 'correct_index', 'explanation']
              }
            }
          },
          required: ['analysis', 'predicted_questions']
        }
      }
    });

    const resultText = response.text || '{}';
    const jsonParsed = JSON.parse(resultText);
    return res.json(jsonParsed);
  } catch (err: any) {
    console.error('Error handling /api/ai/analyze-test:', err);
    return res.status(500).json({
      error: 'AIによる傾向分析の処理中にエラーが発生しました。',
      message: err.message || String(err),
    });
  }
});

// ==========================================
// Persistent Server-Side Data Storage System
// Prevents data/materials from being lost on app updates
// ==========================================
const DATA_DIR = path.join(__dirname, 'server_data');
const DATA_FILE = path.join(DATA_DIR, 'app_storage.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create server_data directory:', e);
}

interface ServerData {
  materials: any[];
  quizzes: any[];
  testRecords: any[];
  periodicTests: any[];
  deletedTestTitles: string[];
  posts: any[];
  customSubjects: any[];
  quizSubmissions: any[];
  lastUpdated: string;
}

function isOctoberPost(p: any): boolean {
  if (!p) return false;
  if (['post-1', 'post-2', 'post-3', 'post-4'].includes(p.id || '')) return true;
  const createdAt = String(p.createdAt || '');
  if (createdAt.includes('-10-') || createdAt.startsWith('2026-10')) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime()) && d.getFullYear() === 2026 && d.getMonth() === 9) {
      return true;
    }
  }
  return false;
}

function loadServerStorage(): ServerData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const deletedTestTitles: string[] = Array.isArray(parsed.deletedTestTitles)
        ? parsed.deletedTestTitles.filter((t: any) => typeof t === 'string' && t.trim())
        : [];
      const deletedSet = new Set(deletedTestTitles);
      return {
        materials: Array.isArray(parsed.materials) ? parsed.materials : [],
        quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
        testRecords: (Array.isArray(parsed.testRecords) ? parsed.testRecords : []).filter(
          (r: any) => r && !deletedSet.has(r.testTitle)
        ),
        periodicTests: (Array.isArray(parsed.periodicTests) ? parsed.periodicTests : []).filter(
          (p: any) => p && !deletedSet.has(p.title)
        ),
        deletedTestTitles,
        posts: (Array.isArray(parsed.posts) ? parsed.posts : []).filter((p: any) => p && !isOctoberPost(p)),
        customSubjects: Array.isArray(parsed.customSubjects) ? parsed.customSubjects : [],
        quizSubmissions: Array.isArray(parsed.quizSubmissions) ? parsed.quizSubmissions : [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Error reading server storage:', err);
  }
  return {
    materials: [],
    quizzes: [],
    testRecords: [],
    periodicTests: [],
    deletedTestTitles: [],
    posts: [],
    customSubjects: [],
    quizSubmissions: [],
    lastUpdated: new Date().toISOString(),
  };
}

function saveServerStorage(patch: Partial<ServerData>): ServerData {
  const current = loadServerStorage();
  const merged: ServerData = {
    ...current,
    ...patch,
    lastUpdated: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing server storage:', err);
  }
  return merged;
}

const SERVER_PUBLIC_TOP_LIMIT = 5;

function getServerRecordMaxScore(r: any): number {
  if (typeof r?.totalMaxScore === 'number' && r.totalMaxScore > 0) {
    return r.totalMaxScore;
  }
  if (Array.isArray(r?.subjectDetails) && r.subjectDetails.length > 0) {
    const sum = r.subjectDetails.reduce((acc: number, d: any) => acc + (Number(d?.maxScore) || 100), 0);
    if (sum > 0) return sum;
  }
  if (r?.scores && typeof r.scores === 'object') {
    const keys = Object.keys(r.scores).filter((k) => r.scores[k] !== undefined && r.scores[k] !== null);
    if (keys.length > 0) {
      return keys.reduce((acc, k) => acc + (Number(r.maxScores?.[k] ?? 100) || 100), 0);
    }
  }
  return 500;
}

function getServerRecordSubjectCount(r: any): number {
  if (typeof r?.subjectCount === 'number' && r.subjectCount >= 1) {
    return Math.floor(r.subjectCount);
  }
  if (Array.isArray(r?.subjectDetails) && r.subjectDetails.length > 0) {
    return r.subjectDetails.length;
  }
  if (r?.scores && typeof r.scores === 'object') {
    const count = Object.keys(r.scores).filter(
      (k) => r.scores[k] !== undefined && r.scores[k] !== null
    ).length;
    if (count >= 1) return count;
  }
  return Math.max(1, Math.round(getServerRecordMaxScore(r) / 100));
}

function calcServerSubjectAverage(score: number, subjectCount: number): number {
  const val = Math.round((score / Math.max(1, subjectCount)) * 10) / 10;
  return Object.is(val, -0) ? 0 : val;
}

function calcServerRate(score: number, maxScore: number): number {
  return Math.round((score / Math.max(1, maxScore)) * 1000) / 10;
}

function findServerLowestAverageBaseline(records: any[]): any | null {
  if (!records || records.length === 0) return null;
  let best = records[0];
  let bestAvg = (Number(best.totalScore) || 0) / Math.max(1, getServerRecordSubjectCount(best));
  let bestRate = ((Number(best.totalScore) || 0) / Math.max(1, getServerRecordMaxScore(best))) * 100;
  let bestDate = String(best.testDate || '');

  for (let i = 1; i < records.length; i++) {
    const curr = records[i];
    const currScore = Number(curr.totalScore) || 0;
    const currAvg = currScore / Math.max(1, getServerRecordSubjectCount(curr));
    const currRate = (currScore / Math.max(1, getServerRecordMaxScore(curr))) * 100;
    const currDate = String(curr.testDate || '');

    if (currAvg < bestAvg - 1e-9) {
      best = curr;
      bestAvg = currAvg;
      bestRate = currRate;
      bestDate = currDate;
    } else if (Math.abs(currAvg - bestAvg) <= 1e-9) {
      if (currRate < bestRate - 1e-9) {
        best = curr;
        bestAvg = currAvg;
        bestRate = currRate;
        bestDate = currDate;
      } else if (Math.abs(currRate - bestRate) <= 1e-9 && currDate < bestDate) {
        best = curr;
        bestAvg = currAvg;
        bestRate = currRate;
        bestDate = currDate;
      }
    }
  }
  return best;
}

// 1. Get server-persisted data (testRecords strictly scoped to requesting studentNumber)
app.get('/api/data', (req, res) => {
  const data = loadServerStorage();
  const studentNumber = Number(req.query.studentNumber);
  const filteredTestRecords =
    Number.isFinite(studentNumber) && studentNumber > 0
      ? (data.testRecords || []).filter((r: any) => Number(r?.studentNumber) === studentNumber)
      : [];
  res.json({
    ...data,
    testRecords: filteredTestRecords,
  });
});

// 1b. Privacy-safe server-computed TOP-N anonymous rankings & caller's own standing
app.get('/api/data/rankings', (req, res) => {
  try {
    const data = loadServerStorage();
    const testTitle = typeof req.query.testTitle === 'string' ? req.query.testTitle.trim() : '';
    const studentNumber = Number(req.query.studentNumber);
    const requestedLimit = Number(req.query.limit);
    const topLimit =
      Number.isFinite(requestedLimit) && requestedLimit >= 1 && requestedLimit <= 20
        ? Math.floor(requestedLimit)
        : SERVER_PUBLIC_TOP_LIMIT;

    const deletedSet = new Set(data.deletedTestTitles || []);
    const allRecords = (data.testRecords || []).filter(
      (r: any) => r?.testTitle && !deletedSet.has(r.testTitle)
    );
    const testTitles = Array.from(
      new Set(allRecords.map((r: any) => r?.testTitle).filter((t: any) => typeof t === 'string' && t.trim()))
    );

    if (!testTitle || deletedSet.has(testTitle)) {
      return res.json({
        testTitles,
        topRankings: [],
        topGrowthRankings: [],
        totalParticipants: 0,
        myStanding: null,
      });
    }

    const currentRecords = allRecords.filter((r: any) => r?.testTitle === testTitle);
    const scored = currentRecords.map((r: any) => {
      const score = Number(r.totalScore) || 0;
      const maxScore = getServerRecordMaxScore(r);
      const scoreRate = calcServerRate(score, maxScore);
      const subjectCount = getServerRecordSubjectCount(r);
      const averageScore =
        typeof r.averageScore === 'number' && Number.isFinite(r.averageScore)
          ? Math.round(r.averageScore * 10) / 10
          : calcServerSubjectAverage(score, subjectCount);
      return {
        studentNumber: Number(r.studentNumber),
        score,
        maxScore,
        scoreRate,
        subjectCount,
        averageScore,
      };
    });

    scored.sort((a, b) => {
      if (Math.abs(b.scoreRate - a.scoreRate) > 1e-9) return b.scoreRate - a.scoreRate;
      return b.score - a.score;
    });

    const topRankings: Array<{
      rank: number;
      score: number;
      maxScore: number;
      scoreRate: number;
      subjectCount: number;
      averageScore: number;
    }> = [];
    let currentRank = 1;
    let myRank: number | null = null;
    let mySubjectCount: number | null = null;
    let myAverageScore: number | null = null;
    for (let i = 0; i < scored.length; i++) {
      if (i > 0 && scored[i].scoreRate < scored[i - 1].scoreRate - 1e-9) {
        currentRank = i + 1;
      }
      if (Number.isFinite(studentNumber) && scored[i].studentNumber === studentNumber) {
        myRank = currentRank;
        mySubjectCount = scored[i].subjectCount;
        myAverageScore = scored[i].averageScore;
      }
      if (currentRank <= topLimit && topRankings.length < topLimit) {
        topRankings.push({
          rank: currentRank,
          score: scored[i].score,
          maxScore: scored[i].maxScore,
          scoreRate: scored[i].scoreRate,
          subjectCount: scored[i].subjectCount,
          averageScore: scored[i].averageScore,
        });
      }
    }

    // Compute growth against each student's lowest all-subject average test across ALL records
    const recordsByStudent = new Map<number, any[]>();
    allRecords.forEach((r: any) => {
      if (r?.studentNumber !== undefined) {
        const num = Number(r.studentNumber);
        const list = recordsByStudent.get(num) || [];
        list.push(r);
        recordsByStudent.set(num, list);
      }
    });

    const growthItems: Array<{
      studentNumber: number;
      rateDelta: number;
    }> = [];
    scored.forEach((curr) => {
      const studentRecords = recordsByStudent.get(curr.studentNumber) || [];
      let rateDelta = 0;
      if (studentRecords.length > 1) {
        const baseline = findServerLowestAverageBaseline(studentRecords);
        if (baseline && baseline.testTitle !== testTitle) {
          const baseScore = Number(baseline.totalScore) || 0;
          const baseMax = Math.max(1, getServerRecordMaxScore(baseline));
          const currExactRate = (curr.score / Math.max(1, curr.maxScore)) * 100;
          const baseExactRate = (baseScore / baseMax) * 100;
          const rounded = Math.round((currExactRate - baseExactRate) * 10) / 10;
          rateDelta = Object.is(rounded, -0) || Math.abs(rounded) < 0.05 ? 0 : rounded;
        }
      }
      growthItems.push({
        studentNumber: curr.studentNumber,
        rateDelta,
      });
    });

    growthItems.sort((a, b) => b.rateDelta - a.rateDelta);

    const topGrowthRankings: Array<{
      rank: number;
      rateDelta: number;
    }> = [];
    let growthRank = 1;
    let myGrowthRank: number | null = null;
    let myGrowthRateDelta: number | null = null;

    for (let i = 0; i < growthItems.length; i++) {
      if (i > 0 && growthItems[i].rateDelta < growthItems[i - 1].rateDelta - 1e-9) {
        growthRank = i + 1;
      }
      if (Number.isFinite(studentNumber) && growthItems[i].studentNumber === studentNumber) {
        myGrowthRank = growthRank;
        myGrowthRateDelta = growthItems[i].rateDelta;
      }
      if (growthRank <= topLimit && topGrowthRankings.length < topLimit) {
        topGrowthRankings.push({
          rank: growthRank,
          rateDelta: growthItems[i].rateDelta,
        });
      }
    }

    res.json({
      testTitles,
      topRankings,
      topGrowthRankings,
      totalParticipants: scored.length,
      myStanding: Number.isFinite(studentNumber)
        ? {
            myRank,
            growthRank: myGrowthRank,
            growthRateDelta: myGrowthRateDelta,
            subjectCount: mySubjectCount,
            averageScore: myAverageScore,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Error computing /api/data/rankings:', err);
    res.status(500).json({ error: 'Rankings computation failed' });
  }
});

// 2. Safe bidirectional sync: merges client and server items by unique ID (union, never drops items, respects deletedTestTitles)
app.post('/api/data/sync', (req, res) => {
  try {
    const clientData: Partial<ServerData> & {
      studentNumber?: number;
      restoredTestTitle?: string;
    } = req.body || {};
    const serverData = loadServerStorage();

    // Update deletedTestTitles (remove restoredTestTitle if user explicitly recreated it)
    const deletedSet = new Set<string>([
      ...(serverData.deletedTestTitles || []),
      ...(Array.isArray(clientData.deletedTestTitles) ? clientData.deletedTestTitles : []),
    ]);
    if (typeof clientData.restoredTestTitle === 'string' && clientData.restoredTestTitle.trim()) {
      deletedSet.delete(clientData.restoredTestTitle.trim());
    }
    const mergedDeletedTitles = Array.from(deletedSet);

    // Union merge materials
    const materialsMap = new Map<string, any>();
    (serverData.materials || []).forEach((m) => { if (m?.id) materialsMap.set(m.id, m); });
    (clientData.materials || []).forEach((m) => { if (m?.id) materialsMap.set(m.id, m); });
    const mergedMaterials = Array.from(materialsMap.values());

    // Union merge quizzes
    const quizzesMap = new Map<string, any>();
    (serverData.quizzes || []).forEach((q) => { if (q?.id) quizzesMap.set(q.id, q); });
    (clientData.quizzes || []).forEach((q) => { if (q?.id) quizzesMap.set(q.id, q); });
    const mergedQuizzes = Array.from(quizzesMap.values());

    // Union merge periodic tests (excluding deleted)
    const periodicMap = new Map<string, any>();
    (serverData.periodicTests || []).forEach((p) => {
      if (p?.id && p?.title && !deletedSet.has(p.title)) periodicMap.set(p.id, p);
    });
    (clientData.periodicTests || []).forEach((p) => {
      if (p?.id && p?.title && !deletedSet.has(p.title)) periodicMap.set(p.id, p);
    });
    const mergedPeriodicTests = Array.from(periodicMap.values());

    // Union merge test records on disk (excluding deleted test titles)
    const recordsMap = new Map<string, any>();
    (serverData.testRecords || []).forEach((r) => {
      if (r?.testTitle && r?.studentNumber !== undefined && !deletedSet.has(r.testTitle)) {
        recordsMap.set(`${r.testTitle}__${r.studentNumber}`, r);
      }
    });
    (clientData.testRecords || []).forEach((r) => {
      if (r?.testTitle && r?.studentNumber !== undefined && !deletedSet.has(r.testTitle)) {
        recordsMap.set(`${r.testTitle}__${r.studentNumber}`, r);
      }
    });
    const mergedRecords = Array.from(recordsMap.values());

    // Union merge posts (excluding deleted October posts)
    const postsMap = new Map<string, any>();
    (serverData.posts || []).forEach((p) => { if (p?.id && !isOctoberPost(p)) postsMap.set(p.id, p); });
    (clientData.posts || []).forEach((p) => { if (p?.id && !isOctoberPost(p)) postsMap.set(p.id, p); });
    const mergedPosts = Array.from(postsMap.values());

    // Union merge custom subjects
    const subjectsMap = new Map<string, any>();
    (serverData.customSubjects || []).forEach((s) => { if (s?.key) subjectsMap.set(s.key, s); });
    (clientData.customSubjects || []).forEach((s) => { if (s?.key) subjectsMap.set(s.key, s); });
    const mergedSubjects = Array.from(subjectsMap.values());

    // Union merge quiz submissions
    const subsMap = new Map<string, any>();
    (serverData.quizSubmissions || []).forEach((s) => { if (s?.id) subsMap.set(s.id, s); });
    (clientData.quizSubmissions || []).forEach((s) => { if (s?.id) subsMap.set(s.id, s); });
    const mergedSubs = Array.from(subsMap.values());

    const saved = saveServerStorage({
      materials: mergedMaterials,
      quizzes: mergedQuizzes,
      testRecords: mergedRecords,
      periodicTests: mergedPeriodicTests,
      deletedTestTitles: mergedDeletedTitles,
      posts: mergedPosts,
      customSubjects: mergedSubjects,
      quizSubmissions: mergedSubs,
    });

    const callerNum = Number(clientData.studentNumber);
    const callerRecords =
      Number.isFinite(callerNum) && callerNum > 0
        ? (saved.testRecords || []).filter((r: any) => Number(r?.studentNumber) === callerNum)
        : [];

    res.json({
      success: true,
      data: {
        ...saved,
        testRecords: callerRecords,
      },
    });
  } catch (err: any) {
    console.error('Error during /api/data/sync:', err);
    res.status(500).json({ error: 'Sync failed', message: err.message });
  }
});

// 2b. Cascade delete a periodic test and all associated testRecords on server
app.delete('/api/data/tests', (req, res) => {
  try {
    const title =
      typeof req.query.title === 'string'
        ? req.query.title.trim()
        : typeof req.body?.title === 'string'
        ? req.body.title.trim()
        : '';
    const testId =
      typeof req.query.testId === 'string'
        ? req.query.testId.trim()
        : typeof req.body?.testId === 'string'
        ? req.body.testId.trim()
        : '';

    const current = loadServerStorage();
    const deletedSet = new Set<string>(current.deletedTestTitles || []);
    if (title) deletedSet.add(title);

    const nextPeriodicTests = (current.periodicTests || []).filter((p: any) => {
      if (testId && p?.id === testId) return false;
      if (title && p?.title === title) return false;
      return true;
    });

    const nextTestRecords = (current.testRecords || []).filter((r: any) => {
      if (title && r?.testTitle === title) return false;
      return true;
    });

    saveServerStorage({
      periodicTests: nextPeriodicTests,
      testRecords: nextTestRecords,
      deletedTestTitles: Array.from(deletedSet),
    });

    res.json({ success: true, deletedTitle: title, deletedId: testId });
  } catch (err: any) {
    console.error('Error deleting test from server storage:', err);
    res.status(500).json({ error: 'Failed to delete test', message: err.message });
  }
});

// 3. Add or update material directly
app.post('/api/data/materials', (req, res) => {
  try {
    const material = req.body;
    if (!material || !material.id) {
      return res.status(400).json({ error: 'Invalid material data' });
    }
    const current = loadServerStorage();
    const existingIdx = current.materials.findIndex((m) => m.id === material.id);
    let nextMaterials: any[];
    if (existingIdx >= 0) {
      nextMaterials = [...current.materials];
      nextMaterials[existingIdx] = material;
    } else {
      nextMaterials = [material, ...current.materials];
    }
    saveServerStorage({ materials: nextMaterials });
    res.json({ success: true, material });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save material', message: err.message });
  }
});

// 4. Delete material directly
app.delete('/api/data/materials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const current = loadServerStorage();
    const filtered = current.materials.filter((m) => m.id !== id);
    saveServerStorage({ materials: filtered });
    res.json({ success: true, deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete material', message: err.message });
  }
});

// 5. One-click Full Backup Export & Restore
app.get('/api/data/backup', (_req, res) => {
  const data = loadServerStorage();
  res.setHeader('Content-Disposition', `attachment; filename=class_portal_backup_${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

app.post('/api/data/restore', (req, res) => {
  try {
    const incomingData = req.body;
    if (!incomingData || typeof incomingData !== 'object') {
      return res.status(400).json({ error: 'Invalid backup file content' });
    }
    const saved = saveServerStorage({
      materials: Array.isArray(incomingData.materials) ? incomingData.materials : [],
      quizzes: Array.isArray(incomingData.quizzes) ? incomingData.quizzes : [],
      testRecords: Array.isArray(incomingData.testRecords) ? incomingData.testRecords : [],
      posts: Array.isArray(incomingData.posts) ? incomingData.posts : [],
      customSubjects: Array.isArray(incomingData.customSubjects) ? incomingData.customSubjects : [],
      quizSubmissions: Array.isArray(incomingData.quizSubmissions) ? incomingData.quizSubmissions : [],
    });
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Restore failed', message: err.message });
  }
});

// Health check endpoint for fast readiness probes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve Vite in development, build files in production
if (process.env.NODE_ENV !== 'production') {
  const vitePromise = import('vite').then(({ createServer }) =>
    createServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    })
  );

  vitePromise.catch((err) => {
    console.error('Failed to initialize Vite dev middleware:', err);
  });

  app.use(async (req, res, next) => {
    try {
      const vite = await vitePromise;
      return vite.middlewares(req, res, next);
    } catch (err) {
      return next(err);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);
});
