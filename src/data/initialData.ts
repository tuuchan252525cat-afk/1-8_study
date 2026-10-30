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
    weekLabel: '今週の定期テスト',
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
    weekLabel: '今週の定期テスト',
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
];

// All sample/mock quiz submissions deleted
export const INITIAL_QUIZ_SUBMISSIONS: QuizResult[] = [];

// All sample/mock materials deleted (empty array for clean user upload & persistence)
export const INITIAL_MATERIALS: StudyMaterial[] = [];

// All sample/mock forum posts deleted
export const INITIAL_POSTS: ForumPost[] = [];
