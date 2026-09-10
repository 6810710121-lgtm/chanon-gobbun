import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  UserMinus, 
  Clock, 
  Calendar, 
  CheckCircle2 
} from 'lucide-react';
import { Activity, Registration } from '../types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  registration: Registration | null;
  onConfirmWithdraw: (reason: string) => Promise<void>;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  activity,
  registration,
  onConfirmWithdraw,
}) => {
  if (!isOpen || !activity || !registration) return null;

  const [reason, setReason] = useState('ติดภารกิจการเรียน/ติดสอบ');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const presetReasons = [
    'ติดภารกิจการเรียน/ติดสอบ',
    'ติดธุระสำคัญทางครอบครัว',
    'มีปัญหาสุขภาพ/เจ็บป่วย',
    'เวลาซ้อนทับกับกิจกรรมพัฒนานิสิตอื่น',
    'เหตุผลอื่นๆ',
  ];

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const finalReason = reason === 'เหตุผลอื่นๆ' ? customReason.trim() || 'ไม่ได้ระบุเหตุผล' : reason;
      await onConfirmWithdraw(finalReason);
      onClose();
    } catch (err) {
      console.error('Withdraw error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Warning Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserMinus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-rose-950">
              ยืนยันการถอนตัวจากกิจกรรม
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              คุณต้องการสละสิทธิ์และยกเลิกการจองกิจกรรมนี้ใช่หรือไม่?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Target Activity Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {activity.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {activity.startDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activity.startTime} - {activity.endTime} น.
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 flex justify-between">
              <span>ผู้จอง: <strong className="text-slate-800">{registration.fullName}</strong></span>
              <span>รหัส: <strong className="text-slate-800">{registration.studentId}</strong></span>
            </div>
          </div>

          {/* Real-time open notification note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              เมื่อคุณกดถอนตัว ระบบจะคืนที่นั่งว่าง 1 ที่นั่งทันที และจะส่งการแจ้งเตือน Real-time ให้เพื่อนนิสิตที่กำลังรอคอยที่นั่งในเดือนนี้
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              เหตุผลในการขอถอนตัว <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5">
              {presetReasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    reason === r
                      ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="withdrawReason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {reason === 'เหตุผลอื่นๆ' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="ระบุเหตุผลการถอนกิจกรรม..."
                rows={2}
                className="w-full mt-2 p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            ไม่ต้องการถอน
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span>กำลังดำเนินการ...</span>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                <span>ยืนยันการถอนกิจกรรม</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
