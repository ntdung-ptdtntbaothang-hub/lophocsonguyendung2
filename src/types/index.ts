export type ClassId = '10A' | '10B' | '11A' | '11B' | '12A' | '12B' | string;

export interface Classroom {
  id: string;
  name: string;
  grade: '10' | '11' | '12' | string;
  studentCount: number;
  subject: string;
  description: string;
  colorTheme: 'emerald' | 'blue' | 'indigo' | 'violet' | 'rose' | 'amber';
  createdAt: string;
}

export interface StudentBadge {
  id: string;
  name: string;
  icon: string; // e.g. 'trophy' | 'zap' | 'star' | 'target' | 'flame' | 'award'
  description: string;
  earnedAt: string;
}

export interface StudentScoreHistory {
  id: string;
  type: 'submission' | 'game' | 'bonus' | 'review';
  title: string;
  pointsEarned: number;
  date: string;
  note?: string;
  referenceId?: string;
}

export interface Student {
  id: string;
  studentCode?: string;
  name: string;
  classId: string;
  gender?: 'Nam' | 'Nữ' | string;
  birthDate?: string;
  phoneNumber?: string;
  note?: string;
  createdAt: string;

  // Account and Scoring fields
  totalScore?: number;
  submissionScore?: number;
  gameScore?: number;
  bonusScore?: number;
  submissionCount?: number;
  gameCount?: number;
  rankInClass?: number;
  badges?: StudentBadge[];
  scoreHistory?: StudentScoreHistory[];
}

export type AllowedFileType = 'word' | 'pdf' | 'powerpoint' | 'image' | 'other';

export interface Task {
  id: string;
  title: string;
  subject: string;
  grade: string;
  classIds: string[];
  lessonTopic: string;
  objective: string;
  requirements: string;
  instructions: string;
  startDate?: string; // Từ ngày - giờ (e.g. 2026-09-20T08:00)
  endDate?: string;   // Đến ngày - giờ (e.g. 2026-09-30T23:59)
  deadline: string;   // Kept for backward compatibility
  allowedFileTypes: AllowedFileType[];
  teacherNote: string;
  createdAt: string;
  status: 'active' | 'closed';
}

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  studentName: string;
  studentClass: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileData?: string; // base64 or simulated content
  submittedAt: string;
  status: 'submitted' | 'reviewed';
  teacherFeedback?: string;
  score?: number;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'ordering';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface GameQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  // Multiple choice
  options?: string[];
  correctAnswer?: string; // or option index e.g. "A" / "B" or text
  // True / False
  correctBool?: boolean;
  // Short answer
  acceptedAnswers?: string[];
  // Matching
  pairs?: MatchingPair[];
  // Ordering
  orderedItems?: string[];
  explanation?: string;
}

export interface Game {
  id: string;
  title: string;
  subject: string;
  grade: string;
  classIds: string[];
  description: string;
  timeLimitSeconds: number; // 0 for untimed, else seconds per quiz
  questions: GameQuestion[];
  createdAt: string;
  status: 'active' | 'closed';
  playCount: number;
}

export interface GameResult {
  id: string;
  gameId: string;
  gameTitle: string;
  studentName: string;
  studentClass: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount?: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'submission' | 'game' | 'system';
  unread?: boolean;
  read?: boolean;
  linkTab?: string;
  linkId?: string;
  createdAt?: string;
  referenceId?: string;
}
