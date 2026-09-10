import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw, 
  UserMinus, 
  Phone, 
  GraduationCap, 
  CheckCircle2,
  Building,
  Filter,
  Download
} from 'lucide-react';
import { Activity, Registration, CancellationRecord, GoogleSheetsConfig } from '../types';

interface AdminPortalProps {
  activities: Activity[];
  registrations: Registration[];
  cancellations: CancellationRecord[];
  sheetsConfig: GoogleSheetsConfig;
  onSyncGoogleSheets: () => Promise<void>;
  onOpenSheetsConfig: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activities,
  registrations,
  cancellations,
  sheetsConfig,
  onSyncGoogleSheets,
  onOpenSheetsConfig,
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    activities[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'students' | 'anti-proxy' | 'cancellations'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  // Registrations for the selected activity
  const activityRegistrations = registrations.filter(
    (r) => r.activityId === selectedActivityId && r.status === 'confirmed'
  );

  // Filtered list
  const filteredStudents = activityRegistrations.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.studentId.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      r.major.toLowerCase().includes(q) ||
      r.phone.includes(q)
    );
  });

  // Calculate proxy stats
  const proxyFlaggedCount = registrations.filter((r) => r.antiProxy && r.antiProxy.riskScore > 30).length;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await onSyncGoogleSheets();
      setSyncFeedback('ซิงค์ข้อมูลกับ Google Sheets สำเร็จเรียบร้อย');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header & Google Sheets Toolbar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              ระบบจัดการสำหรับผู้ดูแลระบบ (Admin Dashboard)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              เจ้าหน้าที่พัฒนานิสิต
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบข้อมูลส่วนตัวนิสิต สถิติจำนวนผู้เข้าร่วม ตรวจสอบการจองแทน และซิงค์ Google Sheets
          </p>
        </div>

        {/* Google Sheets Actions */}
        <div className="flex items-center gap-2.5">
          {sheetsConfig.spreadsheetUrl ? (
            <a
              href={sheetsConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>เปิดดู Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            </a>
          ) : (
            <button
              onClick={onOpenSheetsConfig}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>เชื่อมต่อ Google Sheets</span>
            </button>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลลงชีต'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          syncFeedback.includes('สำเร็จ')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">กิจกรรมทั้งหมด</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activities.length}</p>
          <span className="text-[10px] text-slate-400">ครอบคลุมทุกหมวดหมู่</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">นิสิตลงทะเบียนแล้ว</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {registrations.filter((r) => r.status === 'confirmed').length}
          </p>
          <span className="text-[10px] text-slate-400">จากนิสิตทุกชั้นปี</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">ตรวจพบความเสี่ยงจองแทน</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{proxyFlaggedCount}</p>
          <span className="text-[10px] text-slate-400">มีการแจ้งเตือน / ตรวจสอบ 2FA</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">ประวัติการถอนกิจกรรม</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{cancellations.length}</p>
          <span className="text-[10px] text-slate-400">ที่นั่งถูกนำกลับมาเปิดใหม่</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>รายชื่อนิสิตในแต่ละกิจกรรม ({registrations.filter(r => r.status === 'confirmed').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('anti-proxy')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'anti-proxy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>บันทึกตรวจสอบการจองแทน ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cancellations')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'cancellations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserMinus className="w-4 h-4" />
          <span>ประวัติการถอนกิจกรรม ({cancellations.length})</span>
        </button>
      </div>

      {/* Tab 1: Student List Per Activity */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Activity Selector & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 max-w-lg">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                เลือกกิจกรรมเพื่อดูรายชื่อนิสิต:
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    [{act.id}] {act.title} ({act.enrolledCount}/{act.maxSeats} คน)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัสนิสิต, สาขา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Activity Mini Banner */}
          {selectedActivity && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 px-2 py-0.5 rounded-full bg-blue-100">
                  {selectedActivity.categoryLabel}
                </span>
                <h3 className="font-bold text-slate-900 mt-1 text-sm sm:text-base">
                  {selectedActivity.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  วันที่จัด: {selectedActivity.startDate} | เวลา: {selectedActivity.startTime} - {selectedActivity.endTime} น. | สถานที่: {selectedActivity.location}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 font-medium">ยอดลงทะเบียน</span>
                <p className="text-lg font-bold text-blue-700">
                  {activityRegistrations.length} / {selectedActivity.maxSeats} คน
                </p>
                <span className="text-[10px] text-slate-400">
                  คงเหลือว่าง {Math.max(0, selectedActivity.maxSeats - activityRegistrations.length)} ที่นั่ง
                </span>
              </div>
            </div>
          )}

          {/* Student Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ลำดับ</th>
                    <th className="py-3 px-4">รหัสนิสิต</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-3 px-4">คณะ / สาขาวิชา</th>
                    <th className="py-3 px-4">ชั้นปี</th>
                    <th className="py-3 px-4">อีเมลที่ใช้จอง</th>
                    <th className="py-3 px-4">การตรวจสอบตัวตน</th>
                    <th className="py-3 px-4">เวลาลงทะเบียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลนิสิตที่ลงทะเบียนในกิจกรรมนี้
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-blue-600">{student.studentId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{student.fullName}</td>
                        <td className="py-3 px-4 text-slate-700 font-mono">{student.phone}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{student.major}</div>
                          <div className="text-[10px] text-slate-400">{student.faculty}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">ปี {student.year}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] truncate max-w-[150px]">
                          {student.userEmail}
                        </td>
                        <td className="py-3 px-4">
                          {student.antiProxy?.matchedStudentId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> ผ่านการตรวจสอบ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <AlertTriangle className="w-3 h-3" /> ยืนยัน 2FA
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(student.registeredAt).toLocaleDateString('th-TH')} {new Date(student.registeredAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Anti-Proxy Audit Log */}
      {activeTab === 'anti-proxy' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">รายงานตรวจสอบการจองแทนเพื่อน (Anti-Proxy Audit Trail)</h4>
              <p className="mt-0.5 text-indigo-700">
                ระบบทำการจับคู่รหัสนิสิตที่กรอกกับรหัสที่ได้จากอีเมลสถาบัน (@tsu.ac.th) พร้อมบันทึก Device Fingerprint เพื่อป้องกันการใช้บัญชีเดียวกันจองซ้ำให้เพื่อนหลายคน
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">วันเวลา</th>
                    <th className="py-3 px-4">รหัสนิสิตที่กรอก</th>
                    <th className="py-3 px-4">ชื่อนิสิต</th>
                    <th className="py-3 px-4">อีเมลที่ล็อกอิน</th>
                    <th className="py-3 px-4">รหัสจากอีเมล</th>
                    <th className="py-3 px-4">สถานะความสอดคล้อง</th>
                    <th className="py-3 px-4">คะแนนความเสี่ยง</th>
                    <th className="py-3 px-4">หมายเหตุระบบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(reg.registeredAt).toLocaleDateString('th-TH')} {new Date(reg.registeredAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{reg.studentId}</td>
                      <td className="py-3 px-4 text-slate-800">{reg.fullName}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{reg.userEmail}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {reg.antiProxy?.studentIdExtractedFromEmail || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {reg.antiProxy?.matchedStudentId ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200">
                            ตรงกัน 100%
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-bold border border-rose-200">
                            ไม่ตรงกัน (เฝ้าระวัง)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${
                          (reg.antiProxy?.riskScore || 0) > 50 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {reg.antiProxy?.riskScore || 0}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">
                        {reg.antiProxy?.auditNotes || 'ตรวจสอบสำเร็จ'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cancellations History */}
      {activeTab === 'cancellations' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">วันเวลาที่ถอน</th>
                  <th className="py-3 px-4">รหัสนิสิต</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3 px-4">กิจกรรมที่ขอถอน</th>
                  <th className="py-3 px-4">เหตุผลในการถอน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cancellations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ยังไม่มีประวัติการขอถอนตัวจากกิจกรรม
                    </td>
                  </tr>
                ) : (
                  cancellations.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(c.cancelledAt).toLocaleDateString('th-TH')} {new Date(c.cancelledAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.studentId}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{c.fullName}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{c.phone}</td>
                      <td className="py-3 px-4 text-blue-700 font-medium">{c.activityTitle}</td>
                      <td className="py-3 px-4 text-rose-700 bg-rose-50/50 rounded">{c.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
