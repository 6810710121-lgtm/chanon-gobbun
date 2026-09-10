import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Table,
  Layers
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsConfig: GoogleSheetsConfig;
  onSync: () => Promise<void>;
  onCreateOrFindSheet: () => Promise<void>;
  isSignedIn: boolean;
  onSignIn: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  sheetsConfig,
  onSync,
  onCreateOrFindSheet,
  isSignedIn,
  onSignIn,
}) => {
  if (!isOpen) return null;

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAction = async (action: 'connect' | 'sync') => {
    setIsLoading(true);
    setFeedback(null);
    try {
      if (action === 'connect') {
        await onCreateOrFindSheet();
        setFeedback('เชื่อมต่อและตั้งค่า Google Sheets สำเร็จเรียบร้อย');
      } else {
        await onSync();
        setFeedback('ซิงค์ข้อมูลลง Google Sheets เรียบร้อยแล้ว');
      }
    } catch (err: any) {
      setFeedback(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถดำเนินการได้'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">การจัดการ Google Sheets</h3>
              <p className="text-xs text-emerald-100">บันทึกข้อมูลกิจกรรม การจอง และประวัติการถอน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {!isSignedIn ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-amber-900">ต้องเข้าสู่ระบบ Google ก่อน</h4>
              <p className="text-xs text-amber-700">
                กรุณาเข้าสู่ระบบเพื่ออนุญาตให้แอปพลิเคชันเข้าถึงและบันทึกสเปรดชีตบน Google Drive ของท่าน
              </p>
              <button
                onClick={onSignIn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                เข้าสู่ระบบ Google
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">สถานะการเชื่อมต่อ:</span>
                  {sheetsConfig.spreadsheetId ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> เชื่อมต่อแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      ยังไม่ได้เชื่อมต่อ
                    </span>
                  )}
                </div>

                {sheetsConfig.spreadsheetId && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                    <p>
                      <strong>ชื่อไฟล์:</strong> {sheetsConfig.spreadsheetTitle}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      <strong>ID:</strong> <span className="font-mono">{sheetsConfig.spreadsheetId}</span>
                    </p>
                    {sheetsConfig.lastSyncedAt && (
                      <p className="text-[11px] text-slate-500">
                        <strong>ซิงค์ล่าสุดเมื่อ:</strong> {new Date(sheetsConfig.lastSyncedAt).toLocaleString('th-TH')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Worksheets structure overview */}
              <div className="border border-slate-200 rounded-2xl p-3.5 space-y-2 bg-white">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" /> แผ่นงาน (Worksheets) ใน Google Sheets:
                </h5>
                <ul className="text-xs text-slate-600 space-y-1 pl-1">
                  <li className="flex items-center gap-2">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span><strong>กิจกรรมทั้งหมด:</strong> ข้อมูลกิจกรรม, วันเวลา, ที่นั่ง, ชั่วโมง</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span><strong>รายชื่อผู้ลงทะเบียน:</strong> รหัสนิสิต, ชื่อ, เบอร์โทร, สาขา, สถานะ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span><strong>ประวัติการถอนกิจกรรม:</strong> รายการถอนตัว, เวลา, เหตุผล</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Table className="w-3 h-3 text-slate-400" />
                    <span><strong>ประวัติตรวจสอบการจองแทน:</strong> บันทึกผลการตรวจ Anti-Proxy</span>
                  </li>
                </ul>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  feedback.includes('สำเร็จ') || feedback.includes('เรียบร้อย')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{feedback}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          {sheetsConfig.spreadsheetUrl ? (
            <a
              href={sheetsConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดไฟล์บน Google Drive</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              ปิด
            </button>

            {isSignedIn && (
              sheetsConfig.spreadsheetId ? (
                <button
                  onClick={() => handleAction('sync')}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleAction('connect')}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'กำลังสร้างไฟล์...' : 'สร้าง / เชื่อมต่อสเปรดชีต'}</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
