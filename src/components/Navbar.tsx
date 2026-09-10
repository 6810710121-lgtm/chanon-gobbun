import React from 'react';
import { User } from 'firebase/auth';
import { 
  GraduationCap, 
  Calendar, 
  BookmarkCheck, 
  ShieldCheck, 
  Bell, 
  FileSpreadsheet, 
  LogOut, 
  LogIn,
  Sparkles
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

interface NavbarProps {
  currentView: 'catalog' | 'my-bookings' | 'admin';
  setCurrentView: (view: 'catalog' | 'my-bookings' | 'admin') => void;
  myBookingsCount: number;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  sheetsConfig: GoogleSheetsConfig;
  onOpenSheetsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  myBookingsCount,
  unreadNotifsCount,
  onOpenNotifications,
  user,
  onSignIn,
  onSignOut,
  isLoggingIn,
  sheetsConfig,
  onOpenSheetsModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentView('catalog')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900">
                  ระบบจองกิจกรรมพัฒนานิสิต
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3" /> นอกชั้นเรียน
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                ระบบจัดการกิจกรรม ตรวจสอบการจองแทน และซิงค์ Google Sheets
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80">
            <button
              id="nav-catalog-btn"
              onClick={() => setCurrentView('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'catalog'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>กิจกรรมทั้งหมด</span>
            </button>

            <button
              id="nav-my-bookings-btn"
              onClick={() => setCurrentView('my-bookings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'my-bookings'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>กิจกรรมของฉัน</span>
              {myBookingsCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">
                  {myBookingsCount}
                </span>
              )}
            </button>

            <button
              id="nav-admin-btn"
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ข้อมูลผู้ดูแลระบบ</span>
            </button>
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Sheets status pill */}
            <button
              id="btn-sheets-indicator"
              onClick={onOpenSheetsModal}
              title={sheetsConfig.spreadsheetId ? 'เปิดการจัดการ Google Sheets' : 'เชื่อมต่อ Google Sheets'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg border transition-colors bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets</span>
              {sheetsConfig.spreadsheetId ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="text-[10px] bg-emerald-200/80 px-1 rounded text-emerald-900">เชื่อมต่อ</span>
              )}
            </button>

            {/* Notification Bell */}
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="การแจ้งเตือน"
              aria-label="การแจ้งเตือน"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 text-left">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'ผู้ใช้งาน'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {user.displayName ? user.displayName.charAt(0) : 'U'}
                    </div>
                  )}
                  <div className="hidden xl:block">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                      {user.displayName || 'นิสิต'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  id="btn-signout"
                  onClick={onSignOut}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-signin-google"
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setCurrentView('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              currentView === 'catalog' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>กิจกรรมทั้งหมด</span>
          </button>
          <button
            onClick={() => setCurrentView('my-bookings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              currentView === 'my-bookings' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>กิจกรรมของฉัน</span>
            {myBookingsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                {myBookingsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              currentView === 'admin' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ผู้ดูแลระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
