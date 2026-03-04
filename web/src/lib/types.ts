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
export type SourceEnum = 'WALK_IN' | 'XIAOHONGSHU' | 'META' | 'INSTAGRAM' | 'REFERRAL' | 'OTHER';

// Display labels for source enum
export const SOURCE_LABELS: Record<SourceEnum, string> = {
  WALK_IN: 'Walk-in',
  XIAOHONGSHU: 'Red Note',
  META: 'Facebook',
  INSTAGRAM: 'Instagram',
  REFERRAL: 'Referral',
  OTHER: 'Other',
};

// Status values matching Prisma enum
export type StatusEnum = 'INTERESTED' | 'FOLLOWING_UP' | 'QUOTED' | 'CLOSED_WON' | 'LOST';

export const STATUS_LABELS: Record<StatusEnum, string> = {
  INTERESTED: 'Interested',
  FOLLOWING_UP: 'Following Up',
  QUOTED: 'Quoted',
  CLOSED_WON: 'Closed Won',
  LOST: 'Lost',
};

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
  closedWonByStaff: { name: string | null; count: number }[];
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
