export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  active: boolean;
  image?: string | null;
  createdAt?: string;
}

// Source values matching Prisma enum
export type SourceEnum = 'WALK_IN' | 'XIAOHONGSHU' | 'INSTAGRAM_FACEBOOK' | 'REFERRAL' | 'EMAIL_MARKETING' | 'GOOGLE' | 'OTHER';

// Display labels for source enum
export const SOURCE_LABELS: Record<SourceEnum, string> = {
  WALK_IN: 'Walk-in',
  XIAOHONGSHU: 'Red Note',
  INSTAGRAM_FACEBOOK: 'Instagram / Facebook',
  REFERRAL: 'Referral',
  EMAIL_MARKETING: 'Email Marketing',
  GOOGLE: 'Google Search / Map',
  OTHER: 'Other',
};

// Status values matching Prisma enum
export type StatusEnum = 'ASKING_QUOTE' | 'DRAWING' | 'IN_PROGRESS' | 'KEEP_CONTACT' | 'ON_HOLD' | 'ORDERED' | 'OTHERS';

export const STATUS_LABELS: Record<StatusEnum, string> = {
  ASKING_QUOTE: 'Asking Quote',
  DRAWING: 'Drawing',
  IN_PROGRESS: 'In Progress',
  KEEP_CONTACT: 'Keep Contact',
  ON_HOLD: 'On Hold',
  ORDERED: 'Ordered',
  OTHERS: 'Others',
};

export interface StatusHistoryItem {
  id: string;
  fromStatus: StatusEnum | null;
  toStatus: StatusEnum;
  note: string | null;
  createdAt: string;
  user: { name: string | null };
}

export interface Customer {
  id: string;
  name: string;
  source: SourceEnum;
  status: StatusEnum;
  phone: string | null;
  email: string | null;
  notes: string | null;
  userId: string;
  user: { id: string; name: string | null };
  createdAt: string;
  updatedAt: string;
  _count?: { photos: number };
  photos?: CustomerPhoto[];
  statusHistory?: StatusHistoryItem[];
}

export interface CustomerPhoto {
  id: string;
  storageUrl: string;
  filename: string;
  photoMonth: string;
  createdAt: string;
  staff?: { name: string | null };
}

export interface DailyReport {
  id: string;
  userId: string;
  user: { id: string; name: string | null };
  reportDate: string;
  tasksToday: string;
  planTomorrow: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  walkInThisMonth: number;
  orderedByStaff: { name: string | null; count: number }[];
  sourceBreakdown: { source: SourceEnum; count: number; percentage: number }[];
  notSubmittedToday: { id: string; name: string | null }[];
  submittedToday: { id: string; name: string | null }[];
  recentReports: DailyReport[];
}

export interface KBFile {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  category: string;
  subCategory?: string | null;
  sizeBytes: number;
  storageUrl: string;
  filename: string;
  uploadedAt: string;
}

// ── Case types ──────────────────────────────────────

export type CaseStatusEnum = 'ASKING_QUOTE' | 'DRAWING' | 'IN_PROGRESS' | 'ON_HOLD' | 'ORDERED' | 'CANCELLED';

export const CASE_STATUS_LABELS: Record<CaseStatusEnum, string> = {
  ASKING_QUOTE: 'Asking Quote',
  DRAWING: 'Drawing',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  ORDERED: 'Ordered',
  CANCELLED: 'Cancelled',
};

export type CaseMemberRole = 'OWNER' | 'COLLABORATOR';

export interface CaseMember {
  id: string;
  userId: string;
  role: CaseMemberRole;
  addedAt: string;
  user: { id: string; name: string | null; email: string };
}

export interface CaseStatusHistoryItem {
  id: string;
  fromStatus: CaseStatusEnum | null;
  toStatus: CaseStatusEnum;
  note: string | null;
  createdAt: string;
  user: { name: string | null };
}

export interface CasePhoto {
  id: string;
  storageUrl: string;
  filename: string;
  caption: string | null;
  createdAt: string;
  uploader?: { name: string | null };
}

export interface CaseActivity {
  id: string;
  type: string;
  content: string | null;
  createdAt: string;
  user: { name: string | null };
}

export interface CaseItem {
  id: string;
  title: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  createdById: string;
  createdBy: { id: string; name: string | null };
  status: CaseStatusEnum;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: CaseMember[];
  statusHistory?: CaseStatusHistoryItem[];
  photos?: CasePhoto[];
  activities?: CaseActivity[];
  _count?: { photos: number; activities: number };
}

