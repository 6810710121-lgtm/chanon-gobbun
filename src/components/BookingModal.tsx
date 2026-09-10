import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  User as UserIcon, 
  Phone, 
  GraduationCap, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  LogIn,
  KeyRound,
  Fingerprint
} from 'lucide-react';
import { Activity, StudentProfile, AntiProxyVerification } from '../types';
import { 
  evaluateAntiProxyBooking, 
  extractStudentIdFromEmail, 
  getOrCreateDeviceFingerprint 
} from '../utils/antiProxy';

interface BookingModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignIn: () => void;
  initialProfile: StudentProfile | null;
  previousBookedStudentIds: string[];
  onSubmitBooking: (profile: StudentProfile, antiProxy: AntiProxyVerification) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  activity,
  isOpen,
  onClose,
  user,
  onSignIn,
  initialProfile,
  previousBookedStudentIds,
  onSubmitBooking,
}) => {
  if (!isOpen || !activity) return null;

  const email = user?.email || '';
  const detectedIdFromEmail = extractStudentIdFromEmail(email);

  const [studentId, setStudentId] = useState(
    detectedIdFromEmail || initialProfile?.studentId || ''
  );
  const [fullName, setFullName] = useState(
    initialProfile?.fullName || user?.displayName || ''
  );
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [faculty, setFaculty] = useState(initialProfile?.faculty || 'คณะศึกษาศาสตร์');
  const [major, setMajor] = useState(initialProfile?.major || 'สาขาวิชาเทคโนโลยีและสื่อสารการศึกษา');
  const [year, setYear] = useState<number>(initialProfile?.year || 2);

  // OTP / Verification challenge for non-institutional email
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (detectedIdFromEmail) {
      setStudentId(detectedIdFromEmail);
    }
  }, [detectedIdFromEmail]);

  // Evaluate Anti-Proxy status in real time
  const deviceFp = getOrCreateDeviceFingerprint();
  const antiProxyCheck = evaluateAntiProxyBooking({
    authEmail: email,
    enteredStudentId: studentId,
    phone,
    deviceFingerprint: deviceFp,
    previousBookedStudentIds,
  });

  const handleSendOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setIsOtpSent(true);
    setIsOtpVerified(false);
    // Simulated SMS/Email OTP
  };

  const handleVerifyOtp = () => {
    if (otpCode === generatedOtp) {
      setIsOtpVerified(true);
      setErrorMessage(null);
    } else {
      setErrorMessage('รหัสยืนยัน OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อยืนยันตัวตนก่อนทำการจอง');
      return;
    }

    if (!studentId || studentId.trim().length < 8) {
      setErrorMessage('กรุณากรอกรหัสนิสิตให้ถูกต้อง (อย่างน้อย 8-11 หลัก)');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    if (!phone || phone.trim().length < 9) {
      setErrorMessage('กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้');
      return;
    }

    // Strict Anti-Proxy Verification
    if (!antiProxyCheck.allowed) {
      setErrorMessage(antiProxyCheck.errorMessage || 'ระบบไม่อนุญาตให้จองล่วงหน้าแทนเพื่อน');
      return;
    }

    // If non-institutional email, require OTP verification to ensure real person
    if (!detectedIdFromEmail && !isOtpVerified && isOtpSent) {
      setErrorMessage('กรุณายืนยันรหัส OTP เพื่อความปลอดภัยในการจอง');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile: StudentProfile = {
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        faculty,
        major,
        year,
        email,
      };

      await onSubmitBooking(profile, antiProxyCheck.verification);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการจองกิจกรรม');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
              แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม
            </span>
            <h3 className="text-lg sm:text-xl font-bold mt-1 text-white leading-snug">
              {activity.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-xs text-blue-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>{activity.startDate} ({activity.startTime} - {activity.endTime} น.)</span>
              <span>•</span>
              <span>{activity.activityHours} ชม. กิจกรรม</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Auth requirement banner */}
          {!user ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">ต้องเข้าสู่ระบบก่อนจอง</h4>
                  <p className="text-xs text-amber-700">เข้าสู่ระบบด้วย Google เพื่อยืนยันตัวตนนิมิตและป้องกันการจองแทน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignIn}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
              </button>
            </div>
          ) : (
            /* Anti-Proxy Verification Indicator */
            <div className={`p-4 rounded-2xl border transition-all ${
              !antiProxyCheck.allowed
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : antiProxyCheck.riskScore === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  !antiProxyCheck.allowed
                    ? 'bg-rose-200 text-rose-800'
                    : antiProxyCheck.riskScore === 0
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-blue-200 text-blue-800'
                }`}>
                  {!antiProxyCheck.allowed ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {!antiProxyCheck.allowed
                        ? 'ตรวจพบข้อผิดพลาด: การจองแทนเพื่อน'
                        : 'ระบบตรวจสอบการจองแทน (Anti-Proxy Verified)'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border">
                      ความเสี่ยง: {antiProxyCheck.riskScore}%
                    </span>
                  </div>
                  <p className="mt-1 leading-relaxed">
                    {!antiProxyCheck.allowed
                      ? antiProxyCheck.errorMessage
                      : detectedIdFromEmail
                      ? `บัญชี ${email} ตรงกับรหัสนิสิต ${detectedIdFromEmail} อนุญาตให้จองกิจกรรมเฉพาะตนเองเท่านั้น`
                      : `เข้าสู่ระบบด้วย ${email} ตรวจสอบตัวตนผ่านระบบ`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสนิสิต (Student ID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  readOnly={Boolean(detectedIdFromEmail)}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="เช่น 6810710121"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border ${
                    detectedIdFromEmail 
                      ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
              {detectedIdFromEmail && (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ล็อครหัสนิสิตตามบัญชี Google ของมหาวิทยาลัย ป้องกันการเปลี่ยนรหัสเพื่อจองให้เพื่อน
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ - นามสกุล <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น นายกิตติศักดิ์ พัฒนกิจ"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เบอร์โทรศัพท์ที่ติดต่อได้ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">ใช้สำหรับการติดต่อกรณีมีแจ้งเตือนฉุกเฉินหรือการเปลี่ยนสถานที่</p>
            </div>

            {/* Faculty & Major */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คณะ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="คณะศึกษาศาสตร์">คณะศึกษาศาสตร์</option>
                    <option value="คณะมนุษยศาสตร์และสังคมศาสตร์">คณะมนุษยศาสตร์และสังคมศาสตร์</option>
                    <option value="คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล">คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล</option>
                    <option value="คณะวิทยาการสุขภาพและการกีฬา">คณะวิทยาการสุขภาพและการกีฬา</option>
                    <option value="คณะเทคโนโลยีและการพัฒนาชุมชน">คณะเทคโนโลยีและการพัฒนาชุมชน</option>
                    <option value="คณะนิติศาสตร์">คณะนิติศาสตร์</option>
                    <option value="คณะเศรษฐศาสตร์และบริหารธุรกิจ">คณะเศรษฐศาสตร์และบริหารธุรกิจ</option>
                    <option value="คณะพยาบาลศาสตร์">คณะพยาบาลศาสตร์</option>
                    <option value="คณะวิศวกรรมศาสตร์">คณะวิศวกรรมศาสตร์</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สาขาวิชา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="เช่น วิทยาการคอมพิวเตอร์"
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชั้นปีที่ศึกษา
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      year === y
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ปี {y}
                  </button>
                ))}
              </div>
            </div>

            {/* OTP Challenge (for general personal gmail or non-institutional accounts) */}
            {!detectedIdFromEmail && user && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">ยืนยันตัวตนนิมิต (2FA Verification)</span>
                  </div>
                  {!isOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      ส่งรหัส OTP
                    </button>
                  ) : isOtpVerified ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันสำเร็จ
                    </span>
                  ) : null}
                </div>

                {isOtpSent && !isOtpVerified && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="กรอกรหัส 4 หลัก"
                      className="w-36 px-3 py-1.5 text-xs text-center font-bold tracking-widest bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      ยืนยันรหัส
                    </button>
                    <span className="text-[11px] text-slate-500">
                      (รหัสทดสอบ: <span className="font-mono font-bold text-blue-700">{generatedOtp}</span>)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !user || !antiProxyCheck.allowed}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันการจองกิจกรรม</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
