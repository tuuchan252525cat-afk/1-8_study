import { Student, TestRecord, WeeklyQuiz, QuizResult, StudyMaterial, ForumPost } from '../types';
import {
  MATH_EXAM_PAPER_JPG,
  SCIENCE_EXAM_PAPER_JPG,
  ENGLISH_EXAM_PAPER_JPG,
} from '../utils/sampleTestPapers';

export const INITIAL_STUDENTS: Student[] = [
  { attendanceNumber: 1, nickname: 'あおぞら', avatarColor: '#38bdf8' },
  { attendanceNumber: 2, nickname: 'やまびこ', avatarColor: '#34d399' },
  { attendanceNumber: 3, nickname: 'こむぎ', avatarColor: '#fbbf24' },
  { attendanceNumber: 4, nickname: 'ひまわり', avatarColor: '#f87171' },
  { attendanceNumber: 5, nickname: 'ペンギン', avatarColor: '#818cf8' },
  { attendanceNumber: 6, nickname: 'つばさ', avatarColor: '#2dd4bf' },
  { attendanceNumber: 7, nickname: 'ほしの', avatarColor: '#a78bfa' },
  { attendanceNumber: 8, nickname: 'さくら', avatarColor: '#f472b6' },
  { attendanceNumber: 9, nickname: 'しずく', avatarColor: '#60a5fa' },
  { attendanceNumber: 10, nickname: 'そよかぜ', avatarColor: '#4ade80' },
  { attendanceNumber: 11, nickname: 'もみじ', avatarColor: '#fb923c' },
  { attendanceNumber: 12, nickname: 'ミント', avatarColor: '#2dd4bf' }, // Default Demo
  { attendanceNumber: 13, nickname: 'あかね', avatarColor: '#f43f5e' },
  { attendanceNumber: 14, nickname: 'ほたる', avatarColor: '#facc15' },
  { attendanceNumber: 15, nickname: 'はやて', avatarColor: '#0ea5e9' },
  { attendanceNumber: 16, nickname: 'こはく', avatarColor: '#d97706' },
  { attendanceNumber: 17, nickname: 'しおん', avatarColor: '#8b5cf6' },
  { attendanceNumber: 18, nickname: 'ひかり', avatarColor: '#f59e0b' },
  { attendanceNumber: 19, nickname: 'わかば', avatarColor: '#10b981' },
  { attendanceNumber: 20, nickname: 'あすか', avatarColor: '#ec4899' },
  { attendanceNumber: 21, nickname: 'きよみ', avatarColor: '#6366f1' },
  { attendanceNumber: 22, nickname: 'たいよう', avatarColor: '#ef4444' },
  { attendanceNumber: 23, nickname: 'みずき', avatarColor: '#06b6d4' },
  { attendanceNumber: 24, nickname: 'かえで', avatarColor: '#ea580c' },
  { attendanceNumber: 25, nickname: 'ことり', avatarColor: '#84cc16' },
  { attendanceNumber: 26, nickname: 'ふうた', avatarColor: '#14b8a6' },
  { attendanceNumber: 27, nickname: 'なつめ', avatarColor: '#0284c7' },
  { attendanceNumber: 28, nickname: 'ゆうひ', avatarColor: '#f97316' },
  { attendanceNumber: 29, nickname: 'すずらん', avatarColor: '#a855f7' },
  { attendanceNumber: 30, nickname: 'りんどう', avatarColor: '#4f46e5' },
  { attendanceNumber: 31, nickname: 'かすみ', avatarColor: '#64748b' },
  { attendanceNumber: 32, nickname: 'つきひ', avatarColor: '#059669' },
  { attendanceNumber: 33, nickname: 'ハヤブサ', avatarColor: '#2563eb' },
  { attendanceNumber: 34, nickname: 'うみねこ', avatarColor: '#0891b2' },
  { attendanceNumber: 35, nickname: 'オリーブ', avatarColor: '#65a30d' },
  { attendanceNumber: 36, nickname: 'カンパナ', avatarColor: '#7c3aed' },
  { attendanceNumber: 37, nickname: 'アスター', avatarColor: '#db2777' },
  { attendanceNumber: 38, nickname: 'ラピス', avatarColor: '#1d4ed8' },
  { attendanceNumber: 39, nickname: 'セージ', avatarColor: '#0d9488' },
  { attendanceNumber: 40, nickname: 'シトロン', avatarColor: '#eab308' },
];

// Pre-seeded scores for 40 students across 2 test records
// Student #12 (Mint) gets 418 in current (8th rank) and 392 in previous (+26 growth)
export const INITIAL_TEST_RECORDS: TestRecord[] = [
  // 10月 第2回校内模試 (Current)
  ...INITIAL_STUDENTS.map((s) => {
    // Deterministic realistic score pattern per student
    const base = 320 + ((s.attendanceNumber * 17 + 23) % 155);
    const bonus = s.attendanceNumber === 12 ? 418 - base : (s.attendanceNumber % 3 === 0 ? 15 : -10);
    const total = Math.min(485, Math.max(260, base + bonus));

    const j = Math.round(total * 0.2 + ((s.attendanceNumber * 7) % 12));
    const m = Math.round(total * 0.22 - ((s.attendanceNumber * 5) % 15));
    const e = Math.round(total * 0.21 + ((s.attendanceNumber * 3) % 10));
    const sc = Math.round(total * 0.19 - ((s.attendanceNumber * 4) % 11));
    const so = total - (j + m + e + sc);

    return {
      id: `test-2026-10-${s.attendanceNumber}`,
      testTitle: '第2回 校内実力模試（10月）',
      testDate: '2026-10-18',
      studentNumber: s.attendanceNumber,
      scores: {
        japanese: Math.min(100, Math.max(40, j)),
        math: Math.min(100, Math.max(40, m)),
        english: Math.min(100, Math.max(40, e)),
        science: Math.min(100, Math.max(40, sc)),
        social: Math.min(100, Math.max(40, so)),
      },
      totalScore: total,
    };
  }),

  // 6月 第1回校内模試 (Previous for growth comparisons)
  ...INITIAL_STUDENTS.map((s) => {
    // Previous base
    const prevDelta = s.attendanceNumber === 12 ? -26 : (((s.attendanceNumber * 11) % 35) - 15);
    const currentRecord = 320 + ((s.attendanceNumber * 17 + 23) % 155);
    const total = Math.min(470, Math.max(250, currentRecord + prevDelta));

    return {
      id: `test-2026-06-${s.attendanceNumber}`,
      testTitle: '第1回 校内実力模試（6月）',
      testDate: '2026-06-12',
      studentNumber: s.attendanceNumber,
      scores: {
        japanese: Math.round(total * 0.2),
        math: Math.round(total * 0.2),
        english: Math.round(total * 0.2),
        science: Math.round(total * 0.2),
        social: Math.round(total * 0.2),
      },
      totalScore: total,
    };
  }),
];

export const INITIAL_QUIZZES: WeeklyQuiz[] = [
  {
    id: 'quiz-eng-w4',
    title: '第4週 英単語ターゲット500演習',
    category: 'english',
    weekLabel: '今週の定期テスト',
    description: '大学入試頻出ターゲット単語から最重要の5語を厳選。語法と文脈の判断力を確認しよう！',
    durationMinutes: 5,
    questions: [
      {
        id: 'q-eng-1',
        question: '「abandon」の最も適切な日本語訳はどれ？',
        options: ['見捨てる・放棄する', '主張する・要求する', '達成する・果たす', '同伴する・付き添う'],
        correctIndex: 0,
        explanation: 'abandon は「〜をあきらめる、断念する、見捨てる」という意味の他動詞です。（例: abandon the plan 計画を断念する）',
      },
      {
        id: 'q-eng-2',
        question: '「crucial」の類義語（ほぼ同義語）として最も適切なものは？',
        options: ['vital（極めて重要な）', 'trivial（些細な）', 'gradual（緩やかな）', 'vague（曖昧な）'],
        correctIndex: 0,
        explanation: 'crucial は「決定的な、極めて重要な」という意味で、vital や critical と同義です。trivial は反意語（些細な）です。',
      },
      {
        id: 'q-eng-3',
        question: '「substitute A for B」の正しい意味はどれ？',
        options: ['Bの代わりにAを使う', 'Aの代わりにBを使う', 'AをBと比較する', 'AをBに捧げる'],
        correctIndex: 0,
        explanation: 'substitute A for B は「Bの代用としてAを使う」です。replace B with A（BをAに取り替える）と前置詞・順序の違いに注意！',
      },
      {
        id: 'q-eng-4',
        question: '「be reluctant to do」の意味として最も適切なものは？',
        options: ['〜するのをためらう・気が進まない', '〜することを熱望する', '〜するのが得意である', '〜する傾向がある'],
        correctIndex: 0,
        explanation: 'reluctant は「気が進まない、嫌がる」という意味。反意語は willing（喜んで〜する）です。',
      },
      {
        id: 'q-eng-5',
        question: '名詞「phenomenon（現象）」の複数形として正しいスペリングは？',
        options: ['phenomena', 'phenomenons', 'phenomenas', 'phenomeni'],
        correctIndex: 0,
        explanation: 'ギリシャ語由来の単語で、criterion → criteria と同様に -on が -a に変化して phenomena となります。',
      },
    ],
  },
  {
    id: 'quiz-mizo-w4',
    title: '第4週 ミゾブルー理科教養テスト',
    category: 'mizoblue',
    weekLabel: '今週の定期テスト',
    description: 'クラス名物「ミゾブルー」テスト！理科のコア知識から身の回りの科学現象まで5問チャレンジ！',
    durationMinutes: 5,
    questions: [
      {
        id: 'q-mizo-1',
        question: '【ミゾブルー天文学】夜空で見える恒星（太陽を除く）の中で、全天で最も見かけの明るさが明るい星は？',
        options: ['おおいぬ座のシリウス', 'こと座のベガ', 'オリオン座のベテルギウス', 'うしかい座のアークトゥルス'],
        correctIndex: 0,
        explanation: 'シリウスは見かけの等級が約-1.46等星で、太陽を除く全天の恒星の中で最も明るく輝きます。',
      },
      {
        id: 'q-mizo-2',
        question: '【ミゾブルー化学】水に溶かしたときにフェノールフタレイン溶液を加えると赤色を呈する液性は？',
        options: ['アルカリ性（塩基性）', '酸性', '中性', '弱酸性'],
        correctIndex: 0,
        explanation: 'フェノールフタレイン溶液は中性・酸性では無色、pH約8.3以上のアルカリ性で赤色に変色します。',
      },
      {
        id: 'q-mizo-3',
        question: '【ミゾブルー生物】植物の葉緑体で光合成が行われる際、チラコイドでの光化学反応により発生する気体は？',
        options: ['酸素 (O₂)', '二酸化炭素 (CO₂)', '水素 (H₂)', '窒素 (N₂)'],
        correctIndex: 0,
        explanation: '光化学反応では水（H₂O）が光分解されて酸素（O₂）が発生し、ストロマでのカルビン回路でCO₂が固定されます。',
      },
      {
        id: 'q-mizo-4',
        question: '【ミゾブルー物理】高速通信で使われる光ファイバーが、光を外部に漏らさず芯の中に閉じ込めて送る現象は？',
        options: ['全反射', '光の分散', '光の干渉', '偏光'],
        correctIndex: 0,
        explanation: '屈折率の大きいコアから屈折率の小さいクラッドへ臨界角以上の角度で入射したとき、光が境界面で100%反射する「全反射」を利用しています。',
      },
      {
        id: 'q-mizo-5',
        question: '【ミゾブルー地学】地震発生時に最初に到達する「P波」の「P」は何の略？',
        options: ['Primary（最初の・第1の）', 'Power（威力）', 'Pressure（圧力）', 'Propagation（伝播）'],
        correctIndex: 0,
        explanation: 'Primary wave（最初の波）の頭文字です。縦波で伝播速度が速いため最初に届きます。遅れて届くS波は Secondary wave（第2の波）です。',
      },
    ],
  },
];

// Seeded quiz submissions for ranking distribution
export const INITIAL_QUIZ_SUBMISSIONS: QuizResult[] = [
  // English Quiz (32 students completed)
  ...Array.from({ length: 32 }, (_, i) => {
    const sNum = i + 1;
    // Scores between 2 and 5
    const score = sNum === 12 ? 5 : Math.min(5, Math.max(2, (sNum * 7) % 4 + 2));
    return {
      id: `sub-eng-${sNum}`,
      quizId: 'quiz-eng-w4',
      studentNumber: sNum,
      score,
      maxScore: 5,
      answers: [0, 0, 0, 0, 0],
      completedAt: '2026-10-26T14:30:00Z',
    };
  }),

  // Mizo-Blue Quiz (30 students completed)
  ...Array.from({ length: 30 }, (_, i) => {
    const sNum = i + 1;
    const score = sNum === 12 ? 4 : Math.min(5, Math.max(1, (sNum * 9) % 5 + 1));
    return {
      id: `sub-mizo-${sNum}`,
      quizId: 'quiz-mizo-w4',
      studentNumber: sNum,
      score,
      maxScore: 5,
      answers: [0, 0, 0, 0, 1],
      completedAt: '2026-10-27T10:15:00Z',
    };
  }),
];

export const INITIAL_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-1',
    title: '【数学】二次関数の動く区間・最大最小パターン徹底整理',
    subject: 'math',
    description: '場合分けの境界線の見つけ方とグラフの動きをカラーチャートで整理した復習プリントです。',
    fileType: 'pdf',
    fileSize: '1.4 MB',
    authorNickname: 'やまびこ',
    createdAt: '2026-10-24',
    downloadCount: 28,
    imageUrl: MATH_EXAM_PAPER_JPG,
    contentPreview: '軸が区間の左外・区間内・右外の3パターンを基本に、最大値は中央値との位置関係で2分割して捉えます。',
    documentSections: [
      {
        title: '第1章：軸固定・区間可変パターンの本質',
        content: '区間 a ≦ x ≦ a+2 のように定義域の幅が一定で左右に動く場合、最大値と最小値で着眼点が異なります。\n・最小値（下に凸）：放物線の頂点（軸）が区間に「入るか・入らないか」の3分岐。\n・最大値（下に凸）：区間の中央値と頂点の位置関係による2分岐。',
        keyPoints: [
          '① a+2 < 軸（区間が頂点の左外）：x = a+2 で最小',
          '② a ≦ 軸 ≦ a+2（区間に頂点を含む）：頂点 x = 軸 で最小',
          '③ 軸 < a（区間が頂点の右外）：x = a で最小',
        ],
        formula: '中央値 M = (a + (a + 2)) / 2 = a + 1 と軸の位置関係を比較する',
      },
      {
        title: '第2章：模試で差がつく記述解答の書き方例',
        content: '「f(x) = (x - p)² + q と平方完成し、グラフの軸は直線 x = p である。」と必ず冒頭に明記してから、場合分けの根拠となる連立不等式を解いた不等号を丁寧に記述しましょう。境界値のイコール（等号）はどちらか一方に含めれば減点されません。',
        keyPoints: [
          '平方完成の計算過程を余白で検算し、頂点の座標ミスを防ぐ',
          '場合分けごとに「よって、x = ○ のとき 最大値 △」と結論を一行明記する',
        ],
      },
    ],
  },
  {
    id: 'mat-2',
    title: '【英語】ミゾブルー連動・最頻出イディオム60選チェックリスト',
    subject: 'english',
    description: '模試や共通テスト形式で頻出の前置詞組み合わせ（take on, put off, stand for等）のまとめ。',
    fileType: 'summary',
    fileSize: '420 KB',
    authorNickname: 'ミント',
    createdAt: '2026-10-22',
    downloadCount: 35,
    imageUrl: ENGLISH_EXAM_PAPER_JPG,
    contentPreview: '1. substitute A for B (Bの代わりにAを使う)\n2. make sense of (〜を理解する)\n3. take ~ for granted (〜を当然と思う)',
    documentSections: [
      {
        title: '重要動詞句：前置詞で意味が激変するパターン',
        content: '動詞単体ではなく、後ろに来る前置詞（for, with, to, on, of）とのペアで瞬時に意味を捉えることが長文速読と文法正誤問題の決め手です。',
        keyPoints: [
          'substitute A for B ＝ Bの代用としてAを使う（Aを採用）',
          'replace B with A ＝ BをAに取り替える（前置詞と順序の違いをマーク！）',
          'take A for granted ＝ Aを当然のこととみなす',
          'make sense of ~ ＝ 〜を理解する / make sense ＝ 道理にかなっている',
        ],
      },
      {
        title: '定期テスト頻出：譲歩・因果構文の要点',
        content: '・no matter how + 形容詞/副詞 + S + V（どんなに〜であろうとも）\n・It goes without saying that ~（〜は言うまでもない）\n・on the grounds that ~（〜という根拠に基づいて）',
      },
    ],
  },
  {
    id: 'mat-3',
    title: '【理科】物理・全反射と凸レンズの実像・虚像まとめノート',
    subject: 'science',
    description: '作図の手順と公式 1/a + 1/b = 1/f の符号の注意点を手書きノート風にまとめた画像です。',
    fileType: 'image',
    fileSize: '2.8 MB',
    authorNickname: 'ほしの',
    createdAt: '2026-10-20',
    downloadCount: 19,
    imageUrl: SCIENCE_EXAM_PAPER_JPG,
    contentPreview: '焦点距離の内側に物体を置くと正立虚像、焦点距離の2倍で等大倒立実像になります。',
    documentSections: [
      {
        title: '光の屈折と全反射の条件（ミゾブルー頻出）',
        content: '屈折率の大きい媒質（密な媒質：ガラスや水）から、屈折率の小さい媒質（疎な媒質：空気）へ光が進むときのみ全反射が起こります。\n入射角が臨界角 θc を超えると、光は境界面を透過できず100%反射します。',
        formula: '臨界角の公式: sin θc = n2 / n1 (n1 > n2)',
        keyPoints: [
          '光ファイバーの構造: 中心コア（屈折率大）と周囲クラッド（屈折率小）',
          '全反射では光の強度の損失がゼロに近い',
        ],
      },
      {
        title: '凸レンズの写像公式と符号のルール',
        content: '物体とレンズの距離 a、像とレンズの距離 b、焦点距離 f。\n実像のときは b > 0（倒立実像）。虚像のときは b < 0（正立拡大虚像、ルーペの原理）。',
        formula: '写像公式: 1/a + 1/b = 1/f  |  倍率 m = |b| / a',
      },
    ],
  },
  {
    id: 'mat-4',
    title: '【国語】現代文キーワード・頻出対比概念（近代・ポストモダン）',
    subject: 'japanese',
    description: '評論文で頻出する「理性 vs 感性」「普遍 vs 個別」の論理構造を整理したPDFレジュメ。',
    fileType: 'pdf',
    fileSize: '980 KB',
    authorNickname: 'あかね',
    createdAt: '2026-10-18',
    downloadCount: 22,
    contentPreview: '近代の「主体」「合理主義」に対する批判として現代思想（脱構築・他者論）が展開されます。',
  },
  {
    id: 'mat-5',
    title: '【社会】日本史・近代内閣総理大臣の語呂合わせ＆重要政策年表',
    subject: 'social',
    description: '明治初期から大正デモクラシーまでの内閣の順番と条約改正・恐慌対策の早見シート。',
    fileType: 'pdf',
    fileSize: '1.9 MB',
    authorNickname: 'ふうた',
    createdAt: '2026-10-15',
    downloadCount: 31,
    contentPreview: '「いくやまいまい おやまにいさん」伊藤博文→黒田清隆→山県有朋→松方正義...条約改正と連動して確認！',
  },
  {
    id: 'mat-6',
    title: '【その他】放課後スタディグループおすすめ参考書比較リスト',
    subject: 'other',
    description: '自習室メンバーで実際に解いてよかった問題集のレベル別比較・所要時間目安。',
    fileType: 'summary',
    fileSize: '310 KB',
    authorNickname: 'つばさ',
    createdAt: '2026-10-10',
    downloadCount: 17,
    contentPreview: '基礎固め用・標準演習用・難関突破用に分けて、1日あたりの推奨ペースをまとめています。',
  },
];

export const INITIAL_POSTS: ForumPost[] = [
  {
    id: 'post-1',
    studentNumber: 3,
    authorNickname: 'こむぎ',
    subjectTag: '数学',
    title: '数学の「動く区間の最大最小」、みんな図はどう描いてる？',
    content: '二次関数の軸固定で区間が動く問題、頭の中で動かそうとすると混乱してしまいます。おすすめのノートの書き方やステップがあれば教えてほしいです！',
    createdAt: '2026-10-27T18:20:00Z',
    reactions: { like: 8, heart: 4, lightbulb: 6 },
    comments: [
      {
        id: 'c-1',
        studentNumber: 1,
        authorNickname: 'あおぞら',
        content: '区間の「中央値」を点線で1本引いておくと、頂点より左か右かで最大値が一瞬で決まるよ！教材共有にあるプリントもすごく参考になった！',
        createdAt: '2026-10-27T19:05:00Z',
      },
      {
        id: 'c-2',
        studentNumber: 12,
        authorNickname: 'ミント',
        content: '放物線を固定して、指2本を区間の幅にして紙の上をスライドさせると直感的に掴みやすいよ！',
        createdAt: '2026-10-27T20:12:00Z',
      },
    ],
  },
  {
    id: 'post-2',
    studentNumber: 12,
    authorNickname: 'ミント',
    subjectTag: '英語',
    title: '今週のターゲット単語「substitute」と「replace」の語法注意点',
    content: '今週の英単語クイズにも出てる substitute A for B は「Bの代わりにAを使う」。\nreplace B with A は「BをAに取り替える」。\nAとBの位置が逆になるので、前置詞（forかwithか）でしっかり見分けるのがコツです！',
    createdAt: '2026-10-26T15:40:00Z',
    reactions: { like: 14, heart: 9, lightbulb: 12 },
    comments: [
      {
        id: 'c-3',
        studentNumber: 8,
        authorNickname: 'さくら',
        content: 'これ前回の模試でちょうど引っかかったところでした…！forとwithで覚えます、ありがとう！',
        createdAt: '2026-10-26T16:22:00Z',
      },
    ],
  },
  {
    id: 'post-3',
    studentNumber: 7,
    authorNickname: 'ほしの',
    subjectTag: '理科',
    title: '今週のミゾブルー第4回の全反射、身の回りだと何に使われてる？',
    content: '光ファイバー以外にも、雨滴センサー（車のワイパー自動作動）や双眼鏡のプリズム、水族館のアクリル水槽の反射など、いろんなところで全反射が応用されてるみたいです！',
    createdAt: '2026-10-25T11:00:00Z',
    reactions: { like: 11, heart: 5, lightbulb: 15 },
    comments: [],
  },
  {
    id: 'post-4',
    studentNumber: 16,
    authorNickname: 'こはく',
    subjectTag: '自習・連絡',
    title: '明日放課後の図書室自習スペースについて',
    content: '明日は放課後に推薦ガイダンスがあるため、自習室の開放が17:00からになるそうです。早めに自習したい人は教室で静かに自習しましょう〜！',
    createdAt: '2026-10-24T09:15:00Z',
    reactions: { like: 18, heart: 7, lightbulb: 3 },
    comments: [
      {
        id: 'c-4',
        studentNumber: 22,
        authorNickname: 'たいよう',
        content: '共有助かります！教室の窓側で勉強してます。',
        createdAt: '2026-10-24T09:30:00Z',
      },
    ],
  },
];
