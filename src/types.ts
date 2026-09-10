export type ActivityCategory = 
  | 'ethics'       // ด้านคุณธรรม จริยธรรม และค่านิยม
  | 'academic'     // ด้านทักษะวิชาการและการเรียนรู้ตลอดชีวิต
  | 'health'       // ด้านสุขภาพ กีฬา และนันทนาการ
  | 'volunteer'    // ด้านบำเพ็ญประโยชน์ จิตอาสา และสิ่งแวดล้อม
  | 'international'; // ด้านภาษา ศิลปวัฒนธรรม และความเป็นสากล

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  categoryLabel: string;
  iconName: string;
  description: string;
  location: string;
  speaker: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  month: number;    // 1 - 12
  year: number;     // e.g. 2026
  maxSeats: number;
  enrolledCount: number;
  activityHours: number; // e.g. 3, 6
  targetAudience: string; // เช่น นิสิตทุกชั้นปี, นิสิตชั้นปีที่ 1-2
  tags: string[];
  bannerGradient: string;
  isPopular?: boolean;
}

export interface AntiProxyVerification {
  isVerified: boolean;
  method: 'oauth_match' | 'student_otp' | 'id_card_check';
  authEmail: string;
  studentIdExtractedFromEmail?: string;
  matchedStudentId: boolean;
  deviceFingerprint: string;
  verifiedAt: string;
  riskScore: number; // 0 = safe, 100 = high risk proxy
  auditNotes: string;
}

export interface Registration {
  id: string;
  activityId: string;
  activityTitle: string;
  studentId: string;
  fullName: string;
  phone: string;
  faculty: string;
  major: string;
  year: number;
  userEmail: string;
  registeredAt: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  antiProxy: AntiProxyVerification;
}

export interface CancellationRecord {
  id: string;
  registrationId: string;
  activityId: string;
  activityTitle: string;
  studentId: string;
  fullName: string;
  phone: string;
  faculty: string;
  major: string;
  cancelledAt: string;
  reason: string;
}

export interface NotificationItem {
  id: string;
  type: 'upcoming' | 'seat_opened' | 'booking_success' | 'booking_cancelled' | 'proxy_warning';
  title: string;
  message: string;
  timestamp: string;
  activityId?: string;
  read: boolean;
}

export interface StudentProfile {
  studentId: string;
  fullName: string;
  phone: string;
  faculty: string;
  major: string;
  year: number;
  email: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
}
