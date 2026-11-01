import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// AI Test Analysis & Predicted Quiz Generator Endpoint
app.post('/api/ai/analyze-test', async (req, res) => {
  try {
    const { fileData, mimeType, textPrompt } = req.body;

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

    if (fileData && mimeType) {
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

// Serve Vite in development, build files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);
});
