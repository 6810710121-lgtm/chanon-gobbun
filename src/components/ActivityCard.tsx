import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Award, 
  ChevronRight, 
  BellRing, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  HeartHandshake,
  Sparkles,
  Globe,
  Activity as ActivityIcon,
  TrendingUp,
  BookOpen,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  isEnrolled: boolean;
  onViewDetails: (activity: Activity) => void;
  onBook: (activity: Activity) => void;
  onWithdraw: (activity: Activity) => void;
  isSubscribedForSeats: boolean;
  onToggleSeatAlert: (activityId: string) => void;
}

const renderCategoryIcon = (iconName: string) => {
  const iconProps = { className: "w-5 h-5 text-white" };
  switch (iconName) {
    case 'Cpu': return <Cpu {...iconProps} />;
    case 'HeartHandshake': return <HeartHandshake {...iconProps} />;
    case 'Sparkles': return <Sparkles {...iconProps} />;
    case 'Globe': return <Globe {...iconProps} />;
    case 'Activity': return <ActivityIcon {...iconProps} />;
    case 'TrendingUp': return <TrendingUp {...iconProps} />;
    case 'BookOpen': return <BookOpen {...iconProps} />;
    case 'ShieldAlert': return <ShieldAlert {...iconProps} />;
    default: return <Award {...iconProps} />;
  }
};

const getCategoryBadgeColor = (category: string) => {
  switch (category) {
    case 'academic': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'volunteer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'ethics': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'international': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'health': return 'bg-rose-50 text-rose-700 border-rose-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isEnrolled,
  onViewDetails,
  onBook,
  onWithdraw,
  isSubscribedForSeats,
  onToggleSeatAlert,
}) => {
  const remainingSeats = Math.max(0, activity.maxSeats - activity.enrolledCount);
  const isFull = remainingSeats === 0;
  const percentFilled = Math.min(100, Math.round((activity.enrolledCount / activity.maxSeats) * 100));

  // Format date to Thai format
  const dateObj = new Date(activity.startDate);
  const thaiDateStr = dateObj.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Header Accent / Category */}
      <div className={`p-4 bg-gradient-to-r ${activity.bannerGradient} text-white relative`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs shadow-xs">
              {renderCategoryIcon(activity.iconName)}
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-white/90">
                {activity.categoryLabel}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <Calendar className="w-3.5 h-3.5" />
                <span>{thaiDateStr} • {activity.startTime} - {activity.endTime} น.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              {activity.activityHours} ชม.
            </span>
            {activity.isPopular && (
              <span className="text-[10px] font-medium text-amber-200 mt-1 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> ยอดนิยม
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 
          onClick={() => onViewDetails(activity)}
          className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
        >
          {activity.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {activity.description}
        </p>

        {/* Info list */}
        <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
          {activity.speaker && (
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">วิทยากร: {activity.speaker}</span>
            </div>
          )}
        </div>

        {/* Seat Availability & Progress Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isFull ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> ที่นั่งเต็มแล้ว ({activity.maxSeats} ที่นั่ง)
                  </span>
                ) : remainingSeats <= 5 ? (
                  <span className="text-amber-600 font-semibold">
                    ด่วน! เหลือเพียง {remainingSeats} ที่นั่ง
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    ว่าง {remainingSeats} จาก {activity.maxSeats} ที่นั่ง
                  </span>
                )}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">
              {percentFilled}%
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isFull 
                  ? 'bg-rose-500' 
                  : remainingSeats <= 5 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {activity.tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => onViewDetails(activity)}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          >
            ดูข้อมูล
          </button>

          <div className="flex-1 flex justify-end gap-2">
            {isEnrolled ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  จองแล้ว
                </span>
                <button
                  onClick={() => onWithdraw(activity)}
                  title="ถอนกิจกรรม"
                  className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  ถอนตัว
                </button>
              </div>
            ) : isFull ? (
              <button
                onClick={() => onToggleSeatAlert(activity.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSubscribedForSeats
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                }`}
              >
                <BellRing className={`w-3.5 h-3.5 ${isSubscribedForSeats ? 'text-emerald-600 animate-bounce' : ''}`} />
                <span>{isSubscribedForSeats ? 'เตือนที่นั่งแล้ว' : 'แจ้งเมื่อมีที่นั่งว่าง'}</span>
              </button>
            ) : (
              <button
                onClick={() => onBook(activity)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <span>จองกิจกรรม</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
