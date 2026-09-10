import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  Users, 
  Award, 
  ShieldAlert, 
  CheckCircle2, 
  BellRing,
  Sparkles,
  Share2
} from 'lucide-react';
import { Activity } from '../types';

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  isEnrolled: boolean;
  onBook: (activity: Activity) => void;
  onWithdraw: (activity: Activity) => void;
  isSubscribedForSeats: boolean;
  onToggleSeatAlert: (activityId: string) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  isEnrolled,
  onBook,
  onWithdraw,
  isSubscribedForSeats,
  onToggleSeatAlert,
}) => {
  if (!isOpen || !activity) return null;

  const remainingSeats = Math.max(0, activity.maxSeats - activity.enrolledCount);
  const isFull = remainingSeats === 0;
  const percentFilled = Math.min(100, Math.round((activity.enrolledCount / activity.maxSeats) * 100));

  const dateObj = new Date(activity.startDate);
  const thaiDateFull = dateObj.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Banner */}
        <div className={`p-6 sm:p-7 bg-gradient-to-r ${activity.bannerGradient} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white mb-3">
            <span>{activity.categoryLabel}</span>
            <span>•</span>
            <span>{activity.activityHours} ชั่วโมงกิจกรรม</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            {activity.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs sm:text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {thaiDateFull}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {activity.startTime} - {activity.endTime} น.
            </span>
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium">จำนวนที่นั่งทั้งหมด</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {activity.maxSeats} ที่นั่ง
              </p>
              <div className="text-[11px] text-slate-500 mt-1">
                เหลือว่าง <span className={remainingSeats > 0 ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>{remainingSeats}</span> ที่นั่ง
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium">ชั่วโมงกิจกรรมที่ได้รับ</span>
              <p className="text-base font-bold text-blue-600 mt-0.5 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" />
                {activity.activityHours} ชั่วโมง
              </p>
              <span className="text-[10px] text-slate-400">บันทึกทรานสคริปต์กิจกรรม</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 font-medium">กลุ่มเป้าหมาย</span>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {activity.targetAudience}
              </p>
              <span className="text-[10px] text-slate-400">นิสิตระดับปริญญาตรี</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">รายละเอียดกิจกรรม</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {activity.description}
            </p>
          </div>

          {/* Venue & Speaker */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">สถานที่จัดกิจกรรม:</span>
                <p className="text-slate-600 mt-0.5">{activity.location}</p>
              </div>
            </div>

            {activity.speaker && (
              <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/60">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">วิทยากรบรรยาย:</span>
                  <p className="text-slate-600 mt-0.5">{activity.speaker}</p>
                </div>
              </div>
            )}
          </div>

          {/* Anti-Proxy Verification Policy Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">ระบบตรวจสอบและป้องกันการจองแทนเพื่อน (Anti-Proxy Booking)</span>
              ระบบทำการตรวจสอบความสอดคล้องระหว่างบัญชี Google และรหัสนิสิต เพื่อป้องกันการกั๊กที่นั่งหรือจองล่วงหน้าให้บุคคลอื่น นิสิตต้องลงทะเบียนด้วยบัญชีของตนเองเท่านั้น
            </div>
          </div>

          {/* Seat Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">สถานะที่นั่ง ({activity.enrolledCount}/{activity.maxSeats})</span>
              <span className={isFull ? 'text-rose-600' : 'text-emerald-600'}>
                {isFull ? 'เต็มจำนวนแล้ว' : `คงเหลือ ${remainingSeats} ที่นั่ง`}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            ย้อนกลับ
          </button>

          <div className="flex items-center gap-2">
            {isEnrolled ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  คุณได้จองกิจกรรมนี้แล้ว
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onWithdraw(activity);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  ถอนกิจกรรม
                </button>
              </div>
            ) : isFull ? (
              <button
                onClick={() => onToggleSeatAlert(activity.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSubscribedForSeats
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                <BellRing className="w-4 h-4" />
                <span>{isSubscribedForSeats ? 'เปิดรับแจ้งเตือนที่นั่งแล้ว' : 'แจ้งเตือนเมื่อมีที่นั่งว่าง'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onBook(activity);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>จองเข้าร่วมกิจกรรม</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
