import { AntiProxyVerification } from '../types';

export interface AntiProxyCheckParams {
  authEmail: string;
  enteredStudentId: string;
  phone: string;
  deviceFingerprint: string;
  previousBookedStudentIds?: string[];
}

export interface AntiProxyResult {
  allowed: boolean;
  riskScore: number; // 0 to 100
  verification: AntiProxyVerification;
  errorMessage?: string;
  warningMessage?: string;
}

/**
 * Extracts 8-10 digit student ID from institutional email (e.g., 6810710121@tsu.ac.th)
 */
export function extractStudentIdFromEmail(email: string): string | null {
  if (!email) return null;
  const username = email.split('@')[0];
  const digitsMatch = username.match(/^(\d{8,11})/);
  if (digitsMatch) {
    return digitsMatch[1];
  }
  return null;
}

/**
 * Evaluates whether the booking attempt is an unauthorized proxy booking.
 */
export function evaluateAntiProxyBooking(params: AntiProxyCheckParams): AntiProxyResult {
  const { authEmail, enteredStudentId, deviceFingerprint, previousBookedStudentIds = [] } = params;

  const normalizedEnteredId = enteredStudentId.trim();
  const idFromEmail = extractStudentIdFromEmail(authEmail);

  let riskScore = 0;
  let isVerified = false;
  let notes = '';
  let errorMessage: string | undefined;
  let warningMessage: string | undefined;

  // Rule 1: Email has institutional student ID and it mismatches entered ID
  if (idFromEmail) {
    if (idFromEmail === normalizedEnteredId) {
      riskScore = 0;
      isVerified = true;
      notes = `ตรวจสอบผ่าน: รหัสนิสิต (${normalizedEnteredId}) ตรงกับบัญชีอีเมลสถาบัน (${authEmail}) อย่างถูกต้อง`;
    } else {
      // Direct proxy detection!
      riskScore = 95;
      isVerified = false;
      errorMessage = `[ตรวจพบการจองแทน] บัญชี Google ที่เข้าสู่ระบบคือ ${authEmail} (รหัสประจำตัว ${idFromEmail}) แต่ท่านกรอกรหัสนิสิตเป็น ${normalizedEnteredId} ระบบไม่อนุญาตให้จองล่วงหน้าให้เพื่อน`;
      notes = `ตรวจพบการจองแทนเพื่อน: บัญชี ${authEmail} พยายามลงทะเบียนให้รหัสนิสิต ${normalizedEnteredId}`;
    }
  } else {
    // Non-institutional email (e.g. personal @gmail.com)
    // Rule 2: Device has booked for other student IDs recently
    if (previousBookedStudentIds.length > 0 && !previousBookedStudentIds.includes(normalizedEnteredId)) {
      riskScore = 75;
      warningMessage = `คำเตือน: ตรวจพบว่าอุปกรณ์นี้มีการจองในชื่อรหัสนิสิตอื่น (${previousBookedStudentIds.join(', ')}) กรุณายืนยันรหัส OTP เพื่อยืนยันว่าเป็นเจ้าของตัวจริง`;
      notes = `จองจากอุปกรณ์ร่วมกับรหัสอื่น (${previousBookedStudentIds.join(', ')}) แต่อยู่ในขั้นตอนตรวจสอบ OTP`;
      isVerified = true; // allowed with OTP
    } else {
      riskScore = 15;
      isVerified = true;
      notes = `เข้าสู่ระบบด้วยอีเมลทั่วไป (${authEmail}) ตรวจสอบผ่านการยืนยันตัวตน 2 ขั้นตอน`;
    }
  }

  const verification: AntiProxyVerification = {
    isVerified,
    method: idFromEmail && idFromEmail === normalizedEnteredId ? 'oauth_match' : 'student_otp',
    authEmail,
    studentIdExtractedFromEmail: idFromEmail || undefined,
    matchedStudentId: idFromEmail ? idFromEmail === normalizedEnteredId : true,
    deviceFingerprint,
    verifiedAt: new Date().toISOString(),
    riskScore,
    auditNotes: notes,
  };

  return {
    allowed: riskScore < 80,
    riskScore,
    verification,
    errorMessage,
    warningMessage,
  };
}

/**
 * Helper to generate a dummy device fingerprint string
 */
export function getOrCreateDeviceFingerprint(): string {
  let fp = localStorage.getItem('tsu_act_device_fp');
  if (!fp) {
    fp = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem('tsu_act_device_fp', fp);
  }
  return fp;
}
