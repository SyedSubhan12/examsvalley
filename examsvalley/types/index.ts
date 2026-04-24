// EXTRACTED FROM: shared/schema.ts
// CONVERTED TO:   types/index.ts
// BUCKET:         A_reuse
// WEB LIBRARIES REPLACED: drizzle-orm, drizzle-zod
// LOGIC CHANGES: Removed drizzle-orm imports; kept pure TypeScript types and zod schemas

import { z } from "zod";

// ===========================================
// ZOD SCHEMAS FOR VALIDATION
// (Pure zod — no drizzle-zod dependency)
// ===========================================

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().nullable().optional(),
  googleId: z.string().nullable().optional(),
  authProvider: z.string().optional(),
  name: z.string(),
  role: z.string().optional(),
  avatar: z.string().nullable().optional(),
  boardIds: z.array(z.string()).nullable().optional(),
  subjectIds: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  emailVerificationToken: z.string().nullable().optional(),
  emailVerificationExpires: z.date().nullable().optional(),
  emailVerificationResendCount: z.number().int().optional(),
  lastResentAt: z.date().nullable().optional(),
  isApproved: z.boolean().optional(),
  approvedBy: z.string().nullable().optional(),
  approvedAt: z.date().nullable().optional(),
  username: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  qualifications: z.array(z.string()).nullable().optional(),
  experienceYears: z.number().int().nullable().optional(),
  rating: z.string().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
  lastLoginAt: z.date().nullable().optional(),
});

export const insertStudentRegistrationSchema = z.object({
  userId: z.string(),
  name: z.string(),
  fatherName: z.string().optional(),
  age: z.number().int().positive().optional(),
  phoneNumber: z.string().optional(),
  board: z.string().optional(),
  qualifications: z.string().optional(),
  subject: z.string().optional(),
  schoolName: z.string().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  registrationCompletedAt: z.date().optional(),
});

export const insertTutorRegistrationSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  degree: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  bio: z.string().optional(),
  linkedinUrl: z.string().optional(),
  availableHours: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const insertResourceNodeSchema = z.object({
  subjectId: z.string(),
  resourceKey: z.string(),
  parentNodeId: z.string().optional(),
  title: z.string(),
  nodeType: z.string(),
  meta: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().optional(),
});

export const insertUserProfileSchema = z.object({
  deviceId: z.string(),
  userAgent: z.string().optional(),
});

export const insertUserPreferencesSchema = z.object({
  profileId: z.string(),
  boardKey: z.string().optional(),
  qualKey: z.string().optional(),
  programKey: z.string().optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
  studyMinutesDaily: z.number().int().optional(),
  difficulty: z.string().optional(),
  resourceFocus: z.array(z.string()).optional(),
  examSessionTarget: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const insertUserSubjectSchema = z.object({
  profileId: z.string(),
  subjectId: z.string(),
});

export const insertFeedbackSchema = z.object({
  userId: z.string().optional(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const insertMcqQuestionSchema = z.object({
  subjectId: z.string(),
  topicId: z.string().optional(),
  boardId: z.string().optional(),
  qualId: z.string().optional(),
  branchId: z.string().optional(),
  questionText: z.string(),
  options: z.unknown(), // Array of { label: "A", text: "..." }
  correctOptionIndex: z.number().int(),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  source: z.enum(["manual", "extracted", "ai_generated"]).optional(),
  sourceFileId: z.string().optional(),
  year: z.number().int().optional(),
  session: z.string().optional(),
  paper: z.number().int().optional(),
  variant: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  bloomsLevel: z.string().optional(),
  marks: z.number().int().optional(),
  isVerified: z.boolean().optional(),
  verifiedBy: z.string().optional(),
  confidenceScore: z.number().int().optional(),
  createdBy: z.string().optional(),
});

export const insertMcqAttemptSchema = z.object({
  userId: z.string(),
  questionId: z.string(),
  sessionId: z.string().optional(),
  selectedOptionIndex: z.number().int(),
  isCorrect: z.boolean(),
  timeSpentMs: z.number().int().optional(),
  aiFeedback: z.string().optional(),
});

export const insertMcqSessionSchema = z.object({
  userId: z.string(),
  subjectId: z.string(),
  topicId: z.string().optional(),
  mode: z.enum(["practice", "timed", "exam", "adaptive"]).optional(),
  totalQuestions: z.number().int().optional(),
  answeredCount: z.number().int().optional(),
  correctCount: z.number().int().optional(),
  score: z.number().int().optional(),
  settings: z.unknown().optional(),
  completedAt: z.date().optional(),
});

export const insertMcqTopicStatsSchema = z.object({
  userId: z.string(),
  subjectId: z.string(),
  topicId: z.string(),
  totalAttempted: z.number().int().optional(),
  totalCorrect: z.number().int().optional(),
  avgTimeMs: z.number().int().optional(),
  lastAttemptedAt: z.date().optional(),
  masteryScore: z.number().int().optional(),
  streak: z.number().int().optional(),
  longestStreak: z.number().int().optional(),
  confidenceLevel: z.string().optional(),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type InsertUser = {
  email: string;
  password?: string | null;
  googleId?: string | null;
  authProvider?: string;
  name: string;
  role?: string;
  avatar?: string | null;
  boardIds?: string[] | null;
  subjectIds?: string[] | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  isApproved?: boolean;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  username?: string | null;
  bio?: string | null;
  qualifications?: string[] | null;
  experienceYears?: number | null;
  emailVerificationResendCount?: number;
  lastResentAt?: Date | null;
  rating?: string | null;
  updatedAt?: Date | null;
  lastLoginAt?: Date | null;
};

export type User = {
  id: string;
  email: string;
  password?: string | null;
  googleId?: string | null;
  authProvider: string;
  name: string;
  role: string;
  avatar?: string | null;
  boardIds?: string[] | null;
  subjectIds?: string[] | null;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  emailVerificationResendCount: number;
  lastResentAt?: Date | null;
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  username?: string | null;
  bio?: string | null;
  qualifications?: string[] | null;
  experienceYears?: number | null;
  rating?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  lastLoginAt?: Date | null;
};

export type StudentRegistration = {
  id: string;
  userId: string;
  name: string;
  fatherName?: string | null;
  age?: number | null;
  phoneNumber?: string | null;
  board?: string | null;
  qualifications?: string | null;
  subject?: string | null;
  schoolName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  registrationCompletedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertStudentRegistration = z.infer<typeof insertStudentRegistrationSchema>;

export type TutorRegistration = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  degree?: string | null;
  subjects?: string[] | null;
  experienceYears?: number | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  availableHours?: string | null;
  status: ContentStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertTutorRegistration = z.infer<typeof insertTutorRegistrationSchema>;

export type Board = {
  id: string;
  boardKey: string;
  displayName: string;
  fullName: string;
  description?: string | null;
  logoUrl?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertBoard = {
  boardKey: string;
  displayName: string;
  fullName: string;
  description?: string | null;
  logoUrl?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
};

export type Subject = {
  id: string;
  boardId: string;
  qualId: string;
  branchId?: string | null;
  subjectName: string;
  subjectCode?: string | null;
  versionTag?: string | null;
  slug: string;
  sortKey: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertSubject = {
  boardId: string;
  qualId: string;
  branchId?: string | null;
  subjectName: string;
  subjectCode?: string | null;
  versionTag?: string | null;
  slug: string;
  sortKey: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
};

export type Topic = {
  id: string;
  name: string;
  subjectId: string;
  parentId?: string | null;
  order: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: Date | null;
};

export type InsertTopic = {
  name: string;
  subjectId: string;
  parentId?: string | null;
  order?: number;
  description?: string | null;
  isActive?: boolean;
};

export type Material = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  boardId: string;
  subjectId: string;
  topicId?: string | null;
  year?: number | null;
  difficulty?: string | null;
  fileUrl?: string | null;
  videoUrl?: string | null;
  uploaderId: string;
  status: string;
  rejectionReason?: string | null;
  viewCount: number;
  downloadCount: number;
  createdAt?: Date | null;
};

export type InsertMaterial = {
  title: string;
  description?: string | null;
  type: string;
  boardId: string;
  subjectId: string;
  topicId?: string | null;
  year?: number | null;
  difficulty?: string | null;
  fileUrl?: string | null;
  videoUrl?: string | null;
  rejectionReason?: string | null;
};

export type Quiz = {
  id: string;
  title: string;
  description?: string | null;
  boardId: string;
  subjectId: string;
  topicId?: string | null;
  type: string;
  duration?: number | null;
  isTimed: boolean;
  creatorId: string;
  isActive: boolean;
  createdAt?: Date | null;
};

export type InsertQuiz = {
  title: string;
  description?: string | null;
  boardId: string;
  subjectId: string;
  topicId?: string | null;
  type?: string;
  duration?: number | null;
  isTimed?: boolean;
  creatorId: string;
  isActive?: boolean;
};

export type Question = {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  order: number;
  marks: number;
  createdAt?: Date | null;
};

export type InsertQuestion = {
  quizId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  order?: number;
  marks?: number;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  userId: string;
  answers?: string[] | null;
  score?: number | null;
  totalMarks?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  duration?: number | null;
};

export type InsertQuizAttempt = {
  quizId: string;
  userId: string;
  answers?: string[] | null;
  score?: number | null;
  totalMarks?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  duration?: number | null;
};

export type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  boardId: string;
  subjectId: string;
  topicId?: string | null;
  dueDate?: Date | null;
  totalMarks: number;
  creatorId: string;
  attachmentUrl?: string | null;
  isActive: boolean;
  createdAt?: Date | null;
};

export type InsertAssignment = {
  title: string;
  description?: string | null;
  boardId: string;
  subjectId: string;
  topicId?: string | null;
  dueDate?: Date | null;
  totalMarks?: number;
  attachmentUrl?: string | null;
  isActive?: boolean;
};

export type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl?: string | null;
  content?: string | null;
  status: string;
  grade?: number | null;
  feedback?: string | null;
  submittedAt?: Date | null;
  gradedAt?: Date | null;
};

export type InsertSubmission = {
  assignmentId: string;
  studentId: string;
  fileUrl?: string | null;
  content?: string | null;
  status?: string;
  grade?: number | null;
  feedback?: string | null;
  submittedAt?: Date | null;
  gradedAt?: Date | null;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  scope: string;
  boardId?: string | null;
  subjectId?: string | null;
  authorId: string;
  isActive: boolean;
  createdAt?: Date | null;
};

export type InsertAnnouncement = {
  title: string;
  content: string;
  scope?: string;
  boardId?: string | null;
  subjectId?: string | null;
  authorId: string;
  isActive?: boolean;
};

export type SystemEvent = {
  id: string;
  type: string;
  message: string;
  createdAt?: Date | null;
  meta?: unknown;
};

export type Qualification = {
  id: string;
  boardId: string;
  qualKey: string;
  displayName: string;
  hasBranching: boolean;
  sortOrder: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type Branch = {
  id: string;
  qualId: string;
  branchKey: string;
  displayName: string;
  createdAt?: Date | null;
};

export type ResourceCategory = {
  id: string;
  resourceKey: string;
  displayName: string;
  icon: string;
  sortOrder: number;
  createdAt?: Date | null;
};

export type ResourceNode = {
  id: string;
  subjectId: string;
  resourceKey: string;
  parentNodeId?: string | null;
  title: string;
  nodeType: string;
  meta?: unknown;
  sortOrder: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertResourceNode = z.infer<typeof insertResourceNodeSchema>;

export type FileAsset = {
  id: string;
  subjectId: string;
  resourceKey: string;
  nodeId: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize?: number | null;
  fileType: string;
  year?: number | null;
  session?: string | null;
  paper?: number | null;
  variant?: number | null;
  objectKey?: string | null;
  url?: string | null;
  isPublic: boolean;
  downloadCount: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

// Onboarding types
export type UserProfile = {
  id: string;
  deviceId: string;
  userAgent?: string | null;
  lastSeenAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type UserPreference = {
  id: string;
  profileId: string;
  boardKey?: string | null;
  qualKey?: string | null;
  programKey?: string | null;
  theme?: string | null;
  language?: string | null;
  studyMinutesDaily?: number | null;
  difficulty?: string | null;
  resourceFocus?: string[] | null;
  examSessionTarget?: string | null;
  onboardingCompleted: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type UserSubject = {
  id: string;
  profileId: string;
  subjectId: string;
  createdAt?: Date | null;
};

export type InsertUserSubject = z.infer<typeof insertUserSubjectSchema>;

// Feedback types
export type Feedback = {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  rating: number;
  comment?: string | null;
  createdAt?: Date | null;
};

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// MCQ System types
export type McqQuestion = {
  id: string;
  subjectId: string;
  topicId?: string | null;
  boardId?: string | null;
  qualId?: string | null;
  branchId?: string | null;
  questionText: string;
  options: unknown;
  correctOptionIndex: number;
  explanation?: string | null;
  difficulty: McqDifficulty;
  source: McqSource;
  sourceFileId?: string | null;
  year?: number | null;
  session?: string | null;
  paper?: number | null;
  variant?: number | null;
  tags?: string[] | null;
  bloomsLevel?: string | null;
  marks: number;
  isVerified: boolean;
  verifiedBy?: string | null;
  confidenceScore?: number | null;
  createdBy?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertMcqQuestion = z.infer<typeof insertMcqQuestionSchema>;

export type McqAttempt = {
  id: string;
  userId: string;
  questionId: string;
  sessionId?: string | null;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpentMs?: number | null;
  aiFeedback?: string | null;
  createdAt?: Date | null;
};

export type InsertMcqAttempt = z.infer<typeof insertMcqAttemptSchema>;

export type McqSession = {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string | null;
  mode: McqSessionMode;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  score?: number | null;
  settings?: unknown;
  startedAt?: Date | null;
  completedAt?: Date | null;
};

export type InsertMcqSession = z.infer<typeof insertMcqSessionSchema>;

export type McqTopicStat = {
  id: string;
  userId: string;
  subjectId: string;
  topicId: string;
  totalAttempted: number;
  totalCorrect: number;
  avgTimeMs?: number | null;
  lastAttemptedAt?: Date | null;
  masteryScore: number;
  streak: number;
  longestStreak: number;
  confidenceLevel?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertMcqTopicStat = z.infer<typeof insertMcqTopicStatsSchema>;

export type McqDifficulty = "easy" | "medium" | "hard";
export type McqSource = "manual" | "extracted" | "ai_generated";
export type McqSessionMode = "practice" | "timed" | "exam" | "adaptive";

export type UserRole = "student" | "teacher" | "admin";
export type ResourceType = "past_paper" | "notes" | "video" | "worksheet" | "ebook";
export type ContentStatus = "pending" | "approved" | "rejected";
export type AssignmentStatus = "pending" | "submitted" | "graded";
export type QuizType = "practice" | "mock";
export type AnnouncementScope = "school" | "board" | "subject";
export type FileType = "qp" | "ms" | "gt" | "er" | "in" | "ir" | "ci" | "sf" | "pm" | "sm" | "sp" | "other";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  past_paper: "Past Paper",
  notes: "Notes",
  video: "Video",
  worksheet: "Worksheet",
  ebook: "eBook",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  graded: "Graded",
};

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
