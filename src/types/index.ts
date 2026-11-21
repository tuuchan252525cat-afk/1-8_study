export type SubjectKey =
  | 'japanese'
  | 'math'
  | 'english'
  | 'geography'
  | 'history'
  | 'biology'
  | 'chemistry'
  | 'physics'
  | 'home'
  | 'kimiron'
  | 'other';

export interface Student {
  attendanceNumber: number; // 1 to 40 (students), 101 to 102 (teachers)
  nickname: string;
  avatarColor: string;
  role?: 'student' | 'teacher';
  hasCustomPassword?: boolean;
  password?: string;
}

export interface SubjectScores {
  japanese?: number;
  math?: number;
  english?: number;
  geography?: number;
  history?: number;
  biology?: number;
  chemistry?: number;
  physics?: number;
  home?: number;
  kimiron?: number;
  other?: number;
  [key: string]: number | undefined;
}

export interface SubjectScoreDetail {
  subjectKey: string;
  subject: string;
  score: number;
  maxScore: number;
}

export interface TestRecord {
  id: string;
  testTitle: string;
  testDate: string;
  studentNumber: number;
  scores: SubjectScores;
  maxScores?: SubjectScores;
  subjectDetails?: SubjectScoreDetail[];
  totalScore: number;
  totalMaxScore?: number;
  updatedAt?: string;
}

export interface AnonymousRankItem {
  rank: number;
  score: number;
  maxScore?: number;
  scoreRate?: number;
  isCurrentUser?: boolean; // Only used locally in user's highlight if configured, but public array contains NO student id
}

export interface AnonymousGrowthItem {
  rank: number;
  delta: number; // e.g. +14
  rateDelta?: number; // percentage-point change e.g. +4.5
  hasDifferentMax?: boolean;
}

export interface DistributionBin {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  containsUserScore?: boolean;
}

export type ScoreDistributionBin = DistributionBin;

export interface PersonalStanding {
  studentNumber: number;
  totalScore: number;
  totalMaxScore?: number;
  scoreRate?: number;
  rank: number;
  totalParticipants: number;
  classAverage: number;
  classAverageRate?: number;
  classMax: number;
  classMaxTotal?: number;
  growthDelta?: number;
  growthRateDelta?: number;
  hasDifferentMax?: boolean;
  growthRank?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AiTrendAnalysis {
  subject: string;
  unit: string;
  keywords: string[];
  trends: string[];
}

export interface AiPredictedQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface AiAnalysisResult {
  analysis: AiTrendAnalysis;
  predicted_questions: AiPredictedQuestion[];
}

export interface WeeklyQuiz {
  id: string;
  title: string;
  category: 'english' | 'mizoblue' | 'ai_predicted' | (string & {});
  weekLabel: string;
  description: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  createdAuthor?: string;
  aiAnalysisSummary?: AiTrendAnalysis;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle?: string;
  category?: string;
  studentNumber: number;
  score: number;
  bestScore?: number;
  maxScore: number;
  attemptCount?: number;
  answers: number[];
  completedAt: string;
}

export interface PeriodicTestSchedule {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export type AppTab =
  | 'portal'
  | 'home'
  | 'scores'
  | 'tests'
  | 'quiz'
  | 'ai_analyzer'
  | 'periodic_predicted'
  | 'materials'
  | 'forum'
  | 'mypage'
  | 'edit';

export type MaterialSubject = 'all' | string;

export interface MaterialDocumentSection {
  title: string;
  content: string;
  keyPoints?: string[];
  formula?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: MaterialSubject;
  description: string;
  fileType: 'pdf' | 'image' | 'summary';
  fileSize: string;
  authorNickname: string;
  authorStudentNumber?: number;
  createdAt: string;
  createdAtMs?: number;
  downloadCount: number;
  contentPreview?: string;
  imageUrl?: string;
  pdfUrl?: string;
  isChunked?: boolean;
  totalChunks?: number;
  chunkedField?: 'imageUrl' | 'pdfUrl';
  mimeType?: string;
  documentSections?: MaterialDocumentSection[];
}

export type StudentPrediction = StudyMaterial;

export interface ForumComment {
  id: string;
  authorNickname: string;
  studentNumber: number;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  studentNumber: number;
  authorNickname: string;
  subjectTag: string;
  title: string;
  content: string;
  createdAt: string;
  createdAtMs?: number;
  reactions: {
    like: number;
    heart: number;
    lightbulb: number;
  };
  comments: ForumComment[];
}
