export interface SubjectOption {
  key: string;
  label: string;
  shortLabel: string;
}

export const ALL_SUBJECTS: SubjectOption[] = [
  { key: 'japanese', label: '国語', shortLabel: '国' },
  { key: 'math', label: '数学', shortLabel: '数' },
  { key: 'english', label: '英語', shortLabel: '英' },
  { key: 'geography', label: '地理', shortLabel: '地' },
  { key: 'history', label: '歴史', shortLabel: '歴' },
  { key: 'biology', label: '生物', shortLabel: '生' },
  { key: 'chemistry', label: '化学', shortLabel: '化' },
  { key: 'physics', label: '物理', shortLabel: '物' },
  { key: 'home', label: '家庭', shortLabel: '家' },
  { key: 'kimiron', label: 'きみろん', shortLabel: 'き' },
  { key: 'other', label: 'その他', shortLabel: '他' },
];

export const SUBJECT_MAP: Record<string, string> = {
  japanese: '国語',
  math: '数学',
  english: '英語',
  geography: '地理',
  history: '歴史',
  biology: '生物',
  chemistry: '化学',
  physics: '物理',
  home: '家庭',
  kimiron: 'きみろん',
  other: 'その他',
};

export function getSubjectLabel(key: string): string {
  return SUBJECT_MAP[key] || key || 'その他';
}
