import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Award, 
  UserMinus, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Timer,
  BookOpenCheck
} from 'lucide-react';
import { Activity, Registration } from '../types';

interface MyActivitiesViewProps {
  registrations: Registration[];
  activities: Activity[];
  onWithdraw: (activity: Activity, registration: Registration) => void;
  onExploreActivities: () => void;
  onSelectActivity: (activity: Activity) => void;
}

export const MyActivitiesView: React.FC<MyActivitiesViewProps> = ({
  registrations,
  activities,
  onWithdraw,
  onExploreActivities,
  onSelectActivity,
}) => {
  // Join registration with activity
  const myBookings = registrations
    .filter((r) => r.status === 'confirmed')
    .map((reg) => {
      const act = activities.find((a) => a.id === reg.activityId);
      return {
        registration: reg,
        activity: act,
      };
    })
    .filter((item): item is { registration: Registration; activity: Activity } => Boolean(item.activity));

  // Calculate total hours
  const totalHours = myBookings.reduce((sum, item) => sum + item.activity.activityHours, 0);

  // Find nearest upcoming activity
  const sortedUpcoming = [...myBookings].sort((a, b) => {
    return new Date(a.activity.startDate).getTime() - new Date(b.activity.startDate).getTime();
  });
  const nextActivity = sortedUpcoming[0];

  // Helper to calculate days remaining
  const getRemainingDays = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actDate = new Date(dateStr);
    actDate.setHours(0, 0, 0, 0);
    const diffTime = actDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bookings Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              กิจกรรมที่ลงทะเบียน
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {myBookings.length} <span className="text-sm font-normal text-slate-500">กิจกรรม</span>
            </p>
          </div>
        </div>

        {/* Total Activity Hours Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              ชั่วโมงกิจกรรมสะสม
            </span>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">
              {totalHours} <span className="text-sm font-normal text-slate-500">ชม. (จากเกณฑ์ 100 ชม.)</span>
            </p>
          </div>
        </div>

        {/* Next Upcoming Activity Alert */}
        <div className="bg-gradient-to-tr from-blue-700 to-indigo-800 p-5 rounded-2xl text-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" /> กิจกรรมถัดไป
            </span>
            {nextActivity && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {getRemainingDays(nextActivity.activity.startDate) <= 0 
                  ? 'จัดวันนี้!' 
                  : `อีก ${getRemainingDays(nextActivity.activity.startDate)} วัน`}
              </span>
            )}
          </div>
          {nextActivity ? (
            <div className="mt-2">
              <h4 className="text-sm font-bold truncate leading-tight">
                {nextActivity.activity.title}
              </h4>
              <p className="text-xs text-blue-100 mt-1">
                {nextActivity.activity.startDate} ({nextActivity.activity.startTime} น.)
              </p>
            </div>
          ) : (
            <p className="text-xs text-blue-200 mt-2">ยังไม่มีกิจกรรมที่กำลังจะมาถึง</p>
          )}
        </div>
      </div>

      {/* Main List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              กิจกรรมที่ฉันลงทะเบียนไว้
            </h2>
            <p className="text-xs text-slate-500">
              ตรวจสอบกำหนดการ สถานที่ และสามารถถอนกิจกรรมได้หากติดภารกิจ
            </p>
          </div>
          <button
            onClick={onExploreActivities}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <span>ค้นหากิจกรรมเพิ่ม</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myBookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              ยังไม่มีกิจกรรมที่ลงทะเบียน
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              คุณยังไม่ได้ลงทะเบียนเข้าร่วมกิจกรรมพัฒนานิสิตใดๆ ในขณะนี้ สามารถเลือกดูและจองกิจกรรมได้ทันที
            </p>
            <button
              onClick={onExploreActivities}
              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>ไปที่หน้ารายการกิจกรรม</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myBookings.map(({ registration, activity }) => {
              const daysLeft = getRemainingDays(activity.startDate);
              const isImminent = daysLeft >= 0 && daysLeft <= 2;

              return (
                <div
                  key={registration.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs hover:shadow-md ${
                    isImminent ? 'border-amber-300 ring-1 ring-amber-300/50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {activity.categoryLabel}
                        </span>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {activity.activityHours} ชม.
                        </span>

                        {isImminent && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {daysLeft === 0 ? 'กำลังจะจัดขึ้นวันนี้!' : `ใกล้ถึงแล้ว (อีก ${daysLeft} วัน)`}
                          </span>
                        )}

                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          ตรวจสอบตัวตนแล้ว
                        </span>
                      </div>

                      <h3 
                        onClick={() => onSelectActivity(activity)}
                        className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {activity.title}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            วันที่: {activity.startDate} ({activity.startTime} - {activity.endTime} น.)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                        <span>รหัสการจอง: <strong className="text-slate-600">{registration.id}</strong></span>
                        <span>•</span>
                        <span>รหัสนิสิต: <strong className="text-slate-600">{registration.studentId}</strong></span>
                        <span>•</span>
                        <span>จองเมื่อ: {new Date(registration.registeredAt).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        onClick={() => onSelectActivity(activity)}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        ดูรายละเอียด
                      </button>

                      {/* Prominent Withdraw Button */}
                      <button
                        onClick={() => onWithdraw(activity, registration)}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="ถอนตัวจากกิจกรรมนี้เพื่อเปิดที่นั่งให้ผู้อื่น"
                      >
                        <UserMinus className="w-4 h-4" />
                        <span>ถอนกิจกรรม</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
