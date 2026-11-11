import { Student, TestRecord, WeeklyQuiz, QuizResult, StudyMaterial, ForumPost } from '../types';

// Attendance numbers 1 to 40 cleanly formatted with distinct avatar colors
export const INITIAL_STUDENTS: Student[] = Array.from({ length: 40 }, (_, i) => {
  const num = i + 1;
  const colors = [
    '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#818cf8',
    '#2dd4bf', '#a78bfa', '#f472b6', '#60a5fa', '#4ade80',
    '#fb923c', '#0284c7', '#f43f5e', '#facc15', '#0ea5e9',
    '#d97706', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'
  ];
  return {
    attendanceNumber: num,
    nickname: `生徒 ${num}番`,
    avatarColor: colors[(num - 1) % colors.length],
  };
});

// All sample/mock test records deleted (empty array for clean user entry)
export const INITIAL_TEST_RECORDS: TestRecord[] = [];

// Weekly Quiz templates (Quiz questions ready for students to answer)
export const INITIAL_QUIZZES: WeeklyQuiz[] = [
  {
    id: 'quiz-eng-w4',
    title: '第4週 英単語ターゲット 500演習',
    category: 'english',
    weekLabel: '今週の小テスト',
    durationMinutes: 5,
    description: '大学入試頻出ターゲット単語から最重要の5語を厳選。語法と文脈の判断力を確認しよう！',
    questions: [
      {
        id: 'q-eng-1',
        question: '「〜をBの代わりに使う」を表す正しい英語表現を選びなさい。',
        options: ['substitute A for B', 'replace A for B', 'substitute B for A', 'replace A with B'],
        correctIndex: 0,
        explanation: 'substitute A for B は「Bの代わりにAを使う（Aを採用）」を意味します。replace B with A と語法を比較して覚えましょう。',
      },
      {
        id: 'q-eng-2',
        question: '「〜を当然のことと思う」を意味するイディオムはどれか。',
        options: ['take ~ for granted', 'make sense of ~', 'stand for ~', 'put off ~'],
        correctIndex: 0,
        explanation: 'take ~ for granted は「〜を当然のこととみなす」という非常に頻出の重要慣用句です。',
      },
      {
        id: 'q-eng-3',
        question: '「〜の理由で、〜という根拠に基づいて」を意味する表現はどれか。',
        options: ['on the grounds that', 'in terms of', 'with a view to', 'by means of'],
        correctIndex: 0,
        explanation: 'on the grounds that + 節 は「〜という根拠に基づいて」という意味を表します。',
      },
      {
        id: 'q-eng-4',
        question: '「〜は言うまでもない」を意味する It goes (     ) saying that ... の空欄に入る語を選びなさい。',
        options: ['without', 'with', 'for', 'about'],
        correctIndex: 0,
        explanation: 'It goes without saying that ... は「〜は言うまでもない」という超頻出定形表現です。',
      },
      {
        id: 'q-eng-5',
        question: '「どんなに〜であっても」を表す no matter (     ) + 形容詞 + S + V の空欄に入る語を選びなさい。',
        options: ['how', 'what', 'which', 'where'],
        correctIndex: 0,
        explanation: 'no matter how + 形容詞/副詞 + S + V ＝ however + 形容詞/副詞 + S + V （どんなに〜であっても）。',
      },
    ],
  },
  {
    id: 'quiz-mizo-w4',
    title: '第4週 ミゾブルー理科教養（全反射とレンズ）',
    category: 'mizoblue',
    weekLabel: '今週の小テスト',
    durationMinutes: 5,
    description: 'ミゾブルーテストで頻出する物理「光の全反射とレンズの作図」のコア知識5問。',
    questions: [
      {
        id: 'q-mizo-1',
        question: '全反射が起こる条件として正しいものはどれか。',
        options: [
          '屈折率の大きい媒質から小さい媒質へ光が進むとき',
          '屈折率の小さい媒質から大きい媒質へ光が進むとき',
          '入射角が臨界角より小さいとき',
          '光の振動数が変化したとき',
        ],
        correctIndex: 0,
        explanation: '全反射は「屈折率の大きい（密な）媒質から小さい（疎な）媒質」へ進み、入射角が臨界角を超えた場合にのみ発生します。',
      },
      {
        id: 'q-mizo-2',
        question: '凸レンズで「正立拡大虚像」ができる物体の位置はどこか。',
        options: ['焦点の内側', '焦点上', '焦点と焦点の2倍の間', '焦点の2倍の外側'],
        correctIndex: 0,
        explanation: '物体を焦点の内側に置くと、レンズと同じ側に正立拡大虚像ができます（ルーペの原理）。',
      },
      {
        id: 'q-mizo-3',
        question: '光ファイバーの構造で、中心部（コア）と周囲（クラッド）の屈折率の関係はどれか。',
        options: [
          'コアの屈折率 ＞ クラッドの屈折率',
          'コアの屈折率 ＜ クラッドの屈折率',
          'コアの屈折率 ＝ クラッドの屈折率',
          '屈折率は関係ない',
        ],
        correctIndex: 0,
        explanation: 'コア内で光を全反射させて密閉閉じ込め伝送するため、コアの屈折率をクラッドより大きく設定します。',
      },
      {
        id: 'q-mizo-4',
        question: '凸レンズの写像公式 1/a + 1/b = 1/f において、倒立実像ができるときの b の符号はどれか。',
        options: ['正（b > 0）', '負（b < 0）', '常にゼロ', '符号は定まらない'],
        correctIndex: 0,
        explanation: 'レンズの反対側に実像ができるときは b > 0 となります。虚像のときは b < 0 です。',
      },
      {
        id: 'q-mizo-5',
        question: '入射角 θ1、屈折角 θ2、媒質1・2の屈折率 n1, n2 の関係式（屈折の法則）として正しいものはどれか。',
        options: [
          'n1 sin θ1 = n2 sin θ2',
          'n1 cos θ1 = n2 cos θ2',
          'n1 / sin θ1 = n2 / sin θ2',
          'n1 + sin θ1 = n2 + sin θ2',
        ],
        correctIndex: 0,
        explanation: 'スネルの法則（屈折の法則）： n1 sin θ1 = n2 sin θ2 です。',
      },
    ],
  },
  {
    id: 'quiz-pred-math-1',
    title: '数学：二次関数の頂点・最大最小 厳選予想問題',
    category: 'ai_predicted',
    weekLabel: '定期テスト予想問題',
    durationMinutes: 10,
    description: '過去問の出題傾向から、頂点座標の決定・定義域つき最大最小・差がつく文字係数の場合分けを完全網羅。',
    aiAnalysisSummary: {
      subject: '数学',
      unit: '二次関数とグラフ',
      keywords: ['頂点の座標', '最大値・最小値', '軸の動く場合分け', '判別式D', '平方完成'],
      trends: [
        '平方完成による軸・頂点の決定問題が毎年冒頭で確実に出題',
        '文字係数を含む定義域での最大・最小の3場合分けが合否の分かれ目',
        'x軸との共有点の個数・不等式への応用が配点の30%を占める',
      ],
    },
    questions: [
      {
        id: 'pred-math-1',
        question: '関数 y = 2x^2 - 8x + 5 の頂点の座標を求めなさい。',
        options: ['(2, -3)', '(2, 3)', '(-2, -3)', '(4, -3)'],
        correctIndex: 0,
        explanation: 'y = 2(x^2 - 4x) + 5 = 2(x - 2)^2 - 8 + 5 = 2(x - 2)^2 - 3 より、頂点は (2, -3) です。',
      },
      {
        id: 'pred-math-2',
        question: '0 ≦ x ≦ 3 における関数 y = -(x - 1)^2 + 4 の最小値を求めなさい。',
        options: ['0', '4', '3', '-1'],
        correctIndex: 0,
        explanation: '軸は x = 1。上に凸の放物線なので、軸から最も遠い x = 3 で最小値をとります。y = -(3-1)^2 + 4 = -4 + 4 = 0。',
      },
      {
        id: 'pred-math-3',
        question: '二次方程式 x^2 - 2kx + k + 6 = 0 が異なる2つの実数解をもつときの定数 k の範囲を求めなさい。',
        options: ['k < -2, 3 < k', '-2 < k < 3', 'k ≦ -2, 3 ≦ k', '-3 < k < 2'],
        correctIndex: 0,
        explanation: 'D/4 = (-k)^2 - 1*(k + 6) = k^2 - k - 6 > 0 より、(k - 3)(k + 2) > 0 となり k < -2, 3 < k です。',
      },
      {
        id: 'pred-math-4',
        question: '関数 y = x^2 - 4x + c (1 ≦ x ≦ 4) の最大値が 7 であるとき、定数 c の値を求めなさい。',
        options: ['7', '3', '5', '11'],
        correctIndex: 0,
        explanation: '軸は x = 2。下に凸なので、軸から遠い x = 4 で最大値をとります。x = 4 のとき y = 16 - 16 + c = c = 7。',
      },
      {
        id: 'pred-math-5',
        question: '放物線 y = x^2 + 2x - 3 を x軸方向に +2、y軸方向に -1 だけ平行移動した放物線の方程式はどれか。',
        options: ['y = x^2 - 2x - 4', 'y = x^2 - 2x - 3', 'y = x^2 + 6x - 4', 'y = (x + 2)^2 - 4'],
        correctIndex: 0,
        explanation: 'y - (-1) = (x - 2)^2 + 2(x - 2) - 3 より y + 1 = x^2 - 4x + 4 + 2x - 4 - 3 = x^2 - 2x - 3。ゆえに y = x^2 - 2x - 4。',
      },
    ],
  },
  {
    id: 'quiz-pred-chem-1',
    title: '化学：酸化還元反応とモル濃度 定期テスト予想問題',
    category: 'ai_predicted',
    weekLabel: '定期テスト予想問題',
    durationMinutes: 10,
    description: '酸化数の計算、半反応式の作成、過マンガン酸カリウム滴定の計算問題を集中対策。',
    aiAnalysisSummary: {
      subject: '化学',
      unit: '酸化還元反応と酸・塩基',
      keywords: ['酸化数の変化', '過マンガン酸カリウム', '半反応式', '酸化剤・還元剤', '滴定の当量関係'],
      trends: [
        '化合物中における中心元素の酸化数計算が必須の小問として出題',
        'MnO4- と (COOH)2 または Fe2+ の半反応式から全体のイオン反応式を組み立てる問題',
        '酸化還元滴定による未知濃度の計算が記述式の大問で頻出',
      ],
    },
    questions: [
      {
        id: 'pred-chem-1',
        question: '過マンガン酸カリウム KMnO4 におけるマンガン Mn の酸化数はどれか。',
        options: ['+7', '+5', '+4', '+2'],
        correctIndex: 0,
        explanation: 'K(+1) + Mn(x) + 4×O(-2) = 0 より、1 + x - 8 = 0、x = +7 です。',
      },
      {
        id: 'pred-chem-2',
        question: '次のうち、自身が酸化されて他の物質を還元する「還元剤」として働くものはどれか。',
        options: ['硫化水素 H2S', '過マンガン酸カリウム KMnO4', '二クロム酸カリウム K2Cr2O7', '濃硝酸 HNO3'],
        correctIndex: 0,
        explanation: 'H2S中のSは酸化数-2で、反応によって単体S(酸化数0)へと酸化されるため強力な還元剤として働きます。',
      },
      {
        id: 'pred-chem-3',
        question: '酸性水溶液中で過マンガン酸イオン MnO4- が還元剤から電子を受け取ったときに生じるマンガンイオンはどれか。',
        options: ['Mn2+ (淡桃色・ほぼ無色)', 'MnO2 (黒褐色沈殿)', 'Mn4+ (無色)', 'Mn(OH)2'],
        correctIndex: 0,
        explanation: '酸性水溶液中では MnO4- + 8H+ + 5e- → Mn2+ + 4H2O となり、Mn2+ (淡桃色)に還元されます。',
      },
      {
        id: 'pred-chem-4',
        question: '0.020 mol/L の過マンガン酸カリウム水溶液 20 mL と過不足なく反応する 0.050 mol/L のシュウ酸水溶液は何 mL か。',
        options: ['20 mL', '10 mL', '40 mL', '8 mL'],
        correctIndex: 0,
        explanation: 'KMnO4は1molあたり5molの電子を受け取り、シュウ酸(COOH)2は1molあたり2molの電子を放出します。5×(0.020×20/1000) = 2×(0.050×V/1000) より 2 = 0.10V、V = 20 mL。',
      },
      {
        id: 'pred-chem-5',
        question: '二酸化硫黄 SO2 が硫化水素 H2S と反応するとき、SO2 はどちらとして働くか。',
        options: ['酸化剤', '還元剤', '触媒', '脱水剤'],
        correctIndex: 0,
        explanation: 'SO2 + 2H2S → 3S + 2H2O の反応では、SO2中のS(+4)が単体S(0)へ還元されるため、SO2は酸化剤として働きます。',
      },
    ],
  },
  {
    id: 'quiz-pred-eng-1',
    title: '英語：関係代名詞・分詞構文 頻出予想問題',
    category: 'ai_predicted',
    weekLabel: '定期テスト予想問題',
    durationMinutes: 10,
    description: '関係詞の格の使い分け、前置詞＋関係代名詞、分詞構文の書き換え問題を精選。',
    aiAnalysisSummary: {
      subject: '英語',
      unit: '関係詞・分詞構文',
      keywords: ['関係代名詞which/that/whose', '前置詞+関係代名詞', '分詞構文', '複合関係詞whatever', '先行詞の省略'],
      trends: [
        'whose (所有格) または of which を選ばせる文法空所補充問題が毎年出題',
        'in which / with whom などの前置詞＋関係代名詞の語順整序問題',
        'Having + 過去分詞 による完了分詞構文の時制のズレを問う問題が差のつくポイント',
      ],
    },
    questions: [
      {
        id: 'pred-eng-1',
        question: 'This is the girl (     ) father is a famous architect. 空欄に入る最も適切な語を選びなさい。',
        options: ['whose', 'whom', 'who', 'which'],
        correctIndex: 0,
        explanation: '先行詞 the girl の所有格「彼女の父親」を表すため whose が正解です。',
      },
      {
        id: 'pred-eng-2',
        question: 'The hotel (     ) we stayed last summer was wonderful. 空欄に入る最も適切な語を選びなさい。',
        options: ['where', 'which', 'what', 'whose'],
        correctIndex: 0,
        explanation: '後ろの節 we stayed last summer は自動詞stayにより完全な文となっているため、関係副詞 where（または at which）が入ります。',
      },
      {
        id: 'pred-eng-3',
        question: 'Not (     ) what to say, she just remained silent. 空欄に入る最も適切な語を選びなさい。',
        options: ['knowing', 'known', 'knew', 'having know'],
        correctIndex: 0,
        explanation: 'As she did not know what to say の分詞構文。否定詞 Not を分詞の直前に置き Not knowing となります。',
      },
      {
        id: 'pred-eng-4',
        question: 'All (     ) glitters is not gold. （ことわざ：光るものすべてが金とは限らない）の空欄に入る語を選びなさい。',
        options: ['that', 'which', 'what', 'who'],
        correctIndex: 0,
        explanation: '先行詞が all の場合、関係代名詞には通常 that が用いられます。',
      },
      {
        id: 'pred-eng-5',
        question: '(     ) from the hill, the city looks like a huge garden. 空欄に入る最も適切な語を選びなさい。',
        options: ['Seen', 'Seeing', 'Saw', 'Having seen'],
        correctIndex: 0,
        explanation: '主語 the city が「見られる」受動関係にあるため、過去分詞 Seen から始まる分詞構文となります。',
      },
    ],
  },
];

// All sample/mock quiz submissions deleted
export const INITIAL_QUIZ_SUBMISSIONS: QuizResult[] = [];

const createPaperSvg = (title: string, subjectName: string, items: { num: string; q: string; sub: string }[]) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100" style="background:#ffffff;font-family:sans-serif;">
    <rect x="25" y="25" width="750" height="1050" fill="#ffffff" stroke="#1f2937" stroke-width="2"/>
    <rect x="40" y="40" width="720" height="1020" fill="none" stroke="#9ca3af" stroke-dasharray="3,3"/>
    <text x="400" y="85" font-size="22" font-weight="900" text-anchor="middle" fill="#0f172a">1年8組 定期考査 問題用紙</text>
    <text x="400" y="118" font-size="15" font-weight="700" text-anchor="middle" fill="#047857">【${subjectName}】${title}</text>
    <line x1="55" y1="135" x2="745" y2="135" stroke="#0f172a" stroke-width="2"/>
    <text x="65" y="162" font-size="12" font-weight="700" fill="#475569">試験時間: 50分 ｜ 満点: 100点 ｜ 計算用紙は別途配布分を使用すること</text>
    <rect x="480" y="145" width="265" height="30" fill="#f8fafc" stroke="#64748b"/>
    <text x="495" y="165" font-size="11" font-weight="700" fill="#334155">組: 1年8組　出席番号:　　 氏名:</text>
    <line x1="55" y1="185" x2="745" y2="185" stroke="#cbd5e1" stroke-width="1"/>
    ${items.map((item, i) => `
      <g transform="translate(60, ${210 + i * 190})">
        <rect x="0" y="0" width="680" height="165" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <rect x="15" y="15" width="40" height="26" rx="6" fill="#1c603a"/>
        <text x="35" y="33" font-size="13" font-weight="800" text-anchor="middle" fill="#ffffff">${item.num}</text>
        <text x="65" y="34" font-size="14" font-weight="800" fill="#0f172a">${item.q}</text>
        <line x1="15" y1="52" x2="665" y2="52" stroke="#e2e8f0"/>
        <text x="20" y="80" font-size="12" font-weight="500" fill="#334155">${item.sub}</text>
        <text x="20" y="110" font-size="12" font-weight="500" fill="#475569">※ 途中計算・根拠となる公式も解答用紙の指定欄に漏れなく記述しなさい。</text>
        <rect x="560" y="125" width="105" height="26" rx="4" fill="#e2e8f0"/>
        <text x="612" y="142" font-size="11" font-weight="700" text-anchor="middle" fill="#475569">【配点: 25点】</text>
      </g>
    `).join('')}
    <text x="400" y="1035" font-size="11" font-weight="700" text-anchor="middle" fill="#94a3b8">― 1-8 SITE ARCHIVE ｜ 試験終了後は復習および解き直しに使用してください ―</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-math-1',
    title: '【数学I・A】2次関数と三角比 定期考査問題用紙',
    subject: 'math',
    description: '1年8組定期考査の実物問題用紙。定義域が動く2次関数の最大・最小と正弦定理・余弦定理の頻出大問。',
    fileType: 'image',
    fileSize: '1.8 MB',
    authorNickname: '数学係',
    createdAt: '2026-10-24',
    downloadCount: 42,
    imageUrl: createPaperSvg('2次関数と三角比 定期考査問題用紙', '数学I・A', [
      { num: '大問1', q: '2次関数の最大値・最小値（定義域が変化する場合）', sub: '関数 y = x^2 - 2ax + 1 (0 ≦ x ≦ 2) の最小値を求めよ。またそのときのxの値を求めよ。' },
      { num: '大問2', q: '正弦定理・余弦定理と三角形の面積公式', sub: '△ABCにおいて、b = 5, c = 8, A = 60° のとき、aの値および△ABCの面積Sを求めよ。' },
      { num: '大問3', q: '放物線とx軸の共有点の個数と判別式', sub: '放物線 y = x^2 - 2kx + k + 6 がx軸と異なる2点で交わるような定数kの値の範囲を求めよ。' },
      { num: '大問4', q: '2次不等式の解と絶対値を含む方程式の解法', sub: '不等式 |2x - 3| < 5 および 2次不等式 x^2 - 4x - 5 ≦ 0 を同時に満たすxの整数解をすべて求めよ。' }
    ]),
    contentPreview: '2次関数 y = a(x-p)^2 + q の頂点と軸の判別、三角比の相互関係公式一覧。',
    documentSections: [
      {
        title: '大問1・2：2次関数の軸と定義域の場合分け',
        content: '軸の位置（x = a）が定義域 0 ≦ x ≦ 2 の左側、内側、右側のいずれにあるかで3パターンに場合分けして記述します。グラフの概形を必ず余白に描いて確認しましょう。',
        formula: 'y = a(x - p)^2 + q (軸: x = p, 頂点: (p, q))',
        keyPoints: ['軸が定義域の内側にあるときは頂点で最小値', '最大値は定義域の中央と軸の距離を比較する'],
      },
      {
        title: '大問3・4：余弦定理と判別式の活用',
        content: '2辺とその間の角が与えられた場合は余弦定理を直接適用します。計算間違いが起きやすいため、最後に検算を行ってください。',
        formula: 'a^2 = b^2 + c^2 - 2bc*cos(A) ｜ D = b^2 - 4ac',
        keyPoints: ['cos60° = 1/2 を代入', 'D > 0 で異なる2つの実数解'],
      },
    ],
  },
  {
    id: 'mat-eng-1',
    title: '【英語I】コミュニケーション英語 定期テスト実物問題用紙',
    subject: 'english',
    description: '関係代名詞・分詞構文・長文読解の実物問題用紙。頻出語彙と整序作文のポイント。',
    fileType: 'image',
    fileSize: '2.1 MB',
    authorNickname: '英語係',
    createdAt: '2026-10-25',
    downloadCount: 38,
    imageUrl: createPaperSvg('コミュニケーション英語 定期考査問題用紙', '英語I', [
      { num: '大問1', q: '長文読解（環境保全と持続可能な技術に関する論説文）', sub: '本文の内容に合致するものをア〜エから1つ選び、下線部(1)を日本語に訳しなさい。' },
      { num: '大問2', q: '関係代名詞・関係副詞の空所補充問題', sub: '各文の空所に入る適切な関係詞（who, whose, which, where, when）を記号で答えよ。' },
      { num: '大問3', q: '分詞構文の書き換えおよび語順整序問題', sub: '日本文の意味に合うように、与えられた語句を正しい順序に並べ替えて全文を書きなさい。' },
      { num: '大問4', q: '重要構文を用いた短文英作文（条件英作文）', sub: '「もし明日雨が降れば、私たちは家にいるだろう」を仮定法の用法に留意して英訳せよ。' }
    ]),
    contentPreview: '関係詞 whose/which の格変化ルール、前置詞＋関係代名詞の語順。',
    documentSections: [
      {
        title: '文法セクション：関係詞と分詞構文の攻略',
        content: '先行詞が「人」か「物」か、後ろの文が完全か不完全かを見極めることが最重要です。所有格 whose は直後に冠詞のない名詞が続くのが見極めの合図です。',
        formula: '先行詞 + whose + 名詞 + 動詞... / Having + p.p. (完了分詞構文)',
        keyPoints: ['whose の後ろには無冠詞の名詞が来る', '分詞構文の主語が主節と一致するか確認'],
      },
    ],
  },
  {
    id: 'mat-chem-1',
    title: '【化学基礎】モル計算と酸化還元反応 定期テスト過去問',
    subject: 'chemistry',
    description: 'モル濃度・気体の体積換算・過マンガン酸カリウム滴定の実物問題用紙。',
    fileType: 'image',
    fileSize: '1.5 MB',
    authorNickname: '理科係',
    createdAt: '2026-10-26',
    downloadCount: 29,
    imageUrl: createPaperSvg('モル計算と酸化還元反応 定期考査問題用紙', '化学基礎', [
      { num: '大問1', q: '物質量(mol)の基本計算と粒子数・体積の換算', sub: '標準状態において 5.6 L の酸素分子 O2 の物質量(mol)および質量(g)を求めよ。' },
      { num: '大問2', q: '酸化数の定義と化合物中の中心原子の酸化数判定', sub: '次の各物質中の下線部原子の酸化数を求めよ。(1) KMnO4  (2) H2S  (3) K2Cr2O7' },
      { num: '大問3', q: '半反応式の組み立てとイオン反応式の完成', sub: '過マンガン酸イオン MnO4- とシュウ酸 (COOH)2 の半反応式から全体の反応式を記せ。' },
      { num: '大問4', q: '酸化還元滴定の実験手順と未知濃度の計算', sub: '0.020 mol/L の過マンガン酸カリウム水溶液で滴定したときの当量関係を立式して求めよ。' }
    ]),
    contentPreview: '1mol = 6.0×10^23個 = 22.4L (標準状態)。酸化数増加＝酸化、減少＝還元。',
    documentSections: [
      {
        title: '酸化還元滴定の当量関係公式',
        content: '酸化剤が受け取る電子の物質量(mol) ＝ 還元剤が放出する電子の物質量(mol) で方程式を立てます。過マンガン酸カリウムの価数は「5」、シュウ酸の価数は「2」です。',
        formula: 'a * c * V / 1000 = b * c\' * V\' / 1000 (電子の受授の等式)',
        keyPoints: ['過マンガン酸イオンは酸性で5電子を受け取る', '終点は淡い赤色が消えなくなった瞬間'],
      },
    ],
  },
];

// All sample/mock forum posts deleted
export const INITIAL_POSTS: ForumPost[] = [];
