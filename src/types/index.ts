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
  attendanceNumber: number; // 1 to 40
  nickname: string;
  avatarColor: string;
  hasCustomPassword?: boolean;
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

export interface TestRecord {
  id: string;
  testTitle: string;
  testDate: string;
  studentNumber: number;
  scores: SubjectScores;
  totalScore: number;
}

export interface AnonymousRankItem {
  rank: number;
  score: number;
  isCurrentUser?: boolean; // Only used locally in user's highlight if configured, but public array contains NO student id
}

export interface AnonymousGrowthItem {
  rank: number;
  delta: number; // e.g. +14
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
  rank: number;
  totalParticipants: number;
  classAverage: number;
  classMax: number;
  growthDelta?: number;
  growthRank?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WeeklyQuiz {
  id: string;
  title: string;
  category: 'english' | 'mizoblue';
  weekLabel: string;
  description: string;
  durationMinutes: number;
  questions: QuizQuestion[];
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentNumber: number;
  score: number;
  maxScore: number;
  answers: number[];
  completedAt: string;
}

export type MaterialSubject =
  | 'all'
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
  createdAt: string;
  downloadCount: number;
  contentPreview?: string;
  imageUrl?: string;
  pdfUrl?: string;
  documentSections?: MaterialDocumentSection[];
}

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
  reactions: {
    like: number;
    heart: number;
    lightbulb: number;
  };
  comments: ForumComment[];
}
