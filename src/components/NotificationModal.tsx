import React from 'react';
import { 
  X, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  CalendarClock,
  Trash2
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectActivity?: (activityId: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectActivity,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">ศูนย์การแจ้งเตือน</h3>
              <p className="text-xs text-slate-500">แจ้งเตือนกิจกรรมใกล้ถึง และที่นั่งว่างแบบ Real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action toolbar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              ทั้งหมด {notifications.length} รายการ ({notifications.filter(n => !n.read).length} ยังไม่อ่าน)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllAsRead}
                className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                อ่านทั้งหมด
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={onClearAll}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> ล้างข้อความ
              </button>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">ยังไม่มีการแจ้งเตือนใหม่</p>
              <p className="text-xs text-slate-400 mt-1">
                เมื่อมีกิจกรรมใกล้ถึงเวลา หรือมีที่นั่งว่างเปิดขึ้น ระบบจะแจ้งเตือนคุณที่นี่ทันที
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              let icon = <Bell className="w-4 h-4 text-blue-600" />;
              let bgClass = 'bg-blue-50/70 border-blue-200/60';

              if (notif.type === 'seat_opened') {
                icon = <Sparkles className="w-4 h-4 text-emerald-600" />;
                bgClass = 'bg-emerald-50/80 border-emerald-300';
              } else if (notif.type === 'upcoming') {
                icon = <CalendarClock className="w-4 h-4 text-amber-600" />;
                bgClass = 'bg-amber-50/80 border-amber-300';
              } else if (notif.type === 'proxy_warning') {
                icon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
                bgClass = 'bg-rose-50/80 border-rose-300';
              } else if (notif.type === 'booking_success') {
                icon = <CheckCircle className="w-4 h-4 text-blue-600" />;
                bgClass = 'bg-blue-50/60 border-blue-200';
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => notif.activityId && onSelectActivity && onSelectActivity(notif.activityId)}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all ${bgClass} ${
                    !notif.read ? 'ring-1 ring-blue-500/20 shadow-xs' : 'opacity-85'
                  } ${notif.activityId ? 'cursor-pointer hover:shadow-md' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notif.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.timestamp).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
