import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  Calendar, 
  Search, 
  Filter, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Clock, 
  Flame, 
  ChevronRight,
  ShieldCheck,
  Award,
  BellRing,
  Info,
  CalendarClock
} from 'lucide-react';
import { 
  Activity, 
  Registration, 
  CancellationRecord, 
  NotificationItem, 
  StudentProfile, 
  AntiProxyVerification,
  GoogleSheetsConfig,
  ActivityCategory
} from './types';
import { INITIAL_ACTIVITIES } from './data/initialActivities';
import { INITIAL_REGISTRATIONS } from './data/initialRegistrations';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken, 
  setAccessToken 
} from './services/firebaseAuth';
import { 
  findOrCreateSpreadsheet, 
  syncFullStateToSheet 
} from './services/googleSheets';
import { extractStudentIdFromEmail } from './utils/antiProxy';

// Components
import { Navbar } from './components/Navbar';
import { ActivityCard } from './components/ActivityCard';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { BookingModal } from './components/BookingModal';
import { WithdrawModal } from './components/WithdrawModal';
import { MyActivitiesView } from './components/MyActivitiesView';
import { AdminPortal } from './components/AdminPortal';
import { NotificationModal } from './components/NotificationModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

export default function App() {
  // 1. Auth & Google Sheets Access Token
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 2. Primary Data State
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('tsu_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const saved = localStorage.getItem('tsu_registrations');
    return saved ? JSON.parse(saved) : INITIAL_REGISTRATIONS;
  });

  const [cancellations, setCancellations] = useState<CancellationRecord[]>(() => {
    const saved = localStorage.getItem('tsu_cancellations');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('tsu_notifications');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'NOTIF-INIT-1',
        type: 'upcoming',
        title: 'กิจกรรมใกล้ถึงกำหนดการ',
        message: 'กิจกรรม GenAI & Prompt Engineering จะจัดขึ้นในวันที่ 12 ก.ย. 2569 เวลา 13:00 น. ณ IT Digital Hub',
        timestamp: new Date().toISOString(),
        activityId: 'ACT-2026-001',
        read: false,
      },
      {
        id: 'NOTIF-INIT-2',
        type: 'seat_opened',
        title: 'แจ้งเตือนที่นั่งว่างประจำเดือนกันยายน',
        message: 'กิจกรรมสัมมนาเสริมสร้างภาวะผู้นำ คุณธรรมและจรรยาบรรณวิชาชีพ มีที่นั่งว่าง 25 ที่นั่ง เปิดรับสมัครแล้ว',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        activityId: 'ACT-2026-003',
        read: false,
      },
    ];
  });

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('tsu_sheets_config');
    return saved
      ? JSON.parse(saved)
      : {
          spreadsheetId: null,
          spreadsheetUrl: null,
          spreadsheetTitle: 'ระบบจองกิจกรรมพัฒนานิสิต - TSU Activities',
          lastSyncedAt: null,
          isSyncing: false,
          syncError: null,
        };
  });

  const [subscribedSeatAlerts, setSubscribedSeatAlerts] = useState<string[]>(() => {
    const saved = localStorage.getItem('tsu_subscribed_seat_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. UI Navigation & Modals
  const [currentView, setCurrentView] = useState<'catalog' | 'my-bookings' | 'admin'>('catalog');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [bookingActivity, setBookingActivity] = useState<Activity | null>(null);
  const [withdrawActivity, setWithdrawActivity] = useState<{ activity: Activity; registration: Registration } | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // 4. Filters
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 5. Toast alerts
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: string } | null>(null);

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem('tsu_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('tsu_registrations', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('tsu_cancellations', JSON.stringify(cancellations));
  }, [cancellations]);

  useEffect(() => {
    localStorage.setItem('tsu_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('tsu_sheets_config', JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  useEffect(() => {
    localStorage.setItem('tsu_subscribed_seat_alerts', JSON.stringify(subscribedSeatAlerts));
  }, [subscribedSeatAlerts]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
      },
      () => {
        // Logged out
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setAccessToken(res.accessToken);
        addNotification({
          type: 'booking_success',
          title: 'เข้าสู่ระบบสำเร็จ',
          message: `ยินดีต้อนรับ ${res.user.displayName || res.user.email} เข้าสู่ระบบจองกิจกรรมพัฒนานิสิต`,
        });

        // Automatically connect or find Google Sheet in Drive
        try {
          const sheetInfo = await findOrCreateSpreadsheet(res.accessToken);
          setSheetsConfig((prev) => ({
            ...prev,
            spreadsheetId: sheetInfo.id,
            spreadsheetUrl: sheetInfo.url,
            spreadsheetTitle: sheetInfo.name,
            lastSyncedAt: new Date().toISOString(),
          }));
        } catch (sheetErr) {
          console.warn('Google Sheets auto-connect warning:', sheetErr);
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  // Notification helper
  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newItem, ...prev]);

    // Show temporary toast alert
    setToastMessage({
      title: item.title,
      message: item.message,
      type: item.type,
    });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // Extract current student's registered activities
  const userStudentId = useMemo(() => {
    if (!user?.email) return '6810710121';
    return extractStudentIdFromEmail(user.email) || '6810710121';
  }, [user]);

  const userRegistrations = useMemo(() => {
    return registrations.filter(
      (r) => (r.userEmail === user?.email || r.studentId === userStudentId) && r.status === 'confirmed'
    );
  }, [registrations, user, userStudentId]);

  const enrolledActivityIds = useMemo(() => {
    return new Set(userRegistrations.map((r) => r.activityId));
  }, [userRegistrations]);

  const previousBookedStudentIds = useMemo(() => {
    return Array.from(new Set(registrations.map((r) => r.studentId)));
  }, [registrations]);

  // Handle Booking submission
  const handleBookingSubmit = async (
    profile: StudentProfile,
    antiProxy: AntiProxyVerification
  ) => {
    if (!bookingActivity) return;

    // Check if seats remain
    if (bookingActivity.enrolledCount >= bookingActivity.maxSeats) {
      throw new Error('ขออภัย ขณะนี้ที่นั่งในกิจกรรมนี้เต็มแล้ว');
    }

    // Check if already registered
    const existing = registrations.find(
      (r) => r.activityId === bookingActivity.id && r.studentId === profile.studentId && r.status === 'confirmed'
    );
    if (existing) {
      throw new Error('ท่านได้ลงทะเบียนในกิจกรรมนี้เรียบร้อยแล้ว ไม่สามารถจองซ้ำได้');
    }

    const newRegId = 'REG-' + Date.now().toString().slice(-6);
    const newReg: Registration = {
      id: newRegId,
      activityId: bookingActivity.id,
      activityTitle: bookingActivity.title,
      studentId: profile.studentId,
      fullName: profile.fullName,
      phone: profile.phone,
      faculty: profile.faculty,
      major: profile.major,
      year: profile.year,
      userEmail: user?.email || profile.email,
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
      antiProxy,
    };

    // Update state
    const updatedRegistrations = [newReg, ...registrations];
    const updatedActivities = activities.map((a) => {
      if (a.id === bookingActivity.id) {
        return {
          ...a,
          enrolledCount: Math.min(a.maxSeats, a.enrolledCount + 1),
        };
      }
      return a;
    });

    setRegistrations(updatedRegistrations);
    setActivities(updatedActivities);

    addNotification({
      type: 'booking_success',
      title: 'จองกิจกรรมสำเร็จ!',
      message: `คุณได้ลงทะเบียนเข้าร่วมกิจกรรม "${bookingActivity.title}" เรียบร้อยแล้ว (รหัสการจอง: ${newRegId})`,
      activityId: bookingActivity.id,
    });

    // Auto-sync with Google Sheets if token available
    const activeToken = token || getAccessToken();
    if (activeToken && sheetsConfig.spreadsheetId) {
      syncFullStateToSheet(
        activeToken,
        sheetsConfig.spreadsheetId,
        updatedActivities,
        updatedRegistrations,
        cancellations
      ).catch((err) => console.warn('Background sheet sync failed:', err));
    }
  };

  // Handle Withdrawal (ถอนกิจกรรม)
  const handleWithdrawConfirm = async (reason: string) => {
    if (!withdrawActivity) return;
    const { activity, registration } = withdrawActivity;

    // 1. Record Cancellation
    const cancelRecord: CancellationRecord = {
      id: 'CAN-' + Date.now().toString().slice(-6),
      registrationId: registration.id,
      activityId: activity.id,
      activityTitle: activity.title,
      studentId: registration.studentId,
      fullName: registration.fullName,
      phone: registration.phone,
      faculty: registration.faculty,
      major: registration.major,
      cancelledAt: new Date().toISOString(),
      reason,
    };

    const updatedCancellations = [cancelRecord, ...cancellations];
    const updatedRegistrations = registrations.filter((r) => r.id !== registration.id);

    // 2. Increase seat availability (Free up 1 seat!)
    const updatedActivities = activities.map((a) => {
      if (a.id === activity.id) {
        return {
          ...a,
          enrolledCount: Math.max(0, a.enrolledCount - 1),
        };
      }
      return a;
    });

    setCancellations(updatedCancellations);
    setRegistrations(updatedRegistrations);
    setActivities(updatedActivities);

    // 3. Trigger notification for withdrawal
    addNotification({
      type: 'booking_cancelled',
      title: 'ถอนกิจกรรมเรียบร้อยแล้ว',
      message: `คุณได้ยกเลิกการเข้าร่วมกิจกรรม "${activity.title}" เรียบร้อยแล้ว ระบบได้เปิดที่นั่งคืนให้เพื่อนนิสิต`,
      activityId: activity.id,
    });

    // 4. REAL-TIME SEAT OPEN ALERT!
    // Since a seat just opened up, notify anyone interested in this month or subscribed!
    setTimeout(() => {
      addNotification({
        type: 'seat_opened',
        title: '🔔 ที่นั่งว่างแล้ว (Real-time Alert)',
        message: `มีที่นั่งว่างเปิดขึ้นใหม่ในกิจกรรม "${activity.title}" (เดือน ${activity.month}/2569) จำนวน 1 ที่นั่ง รีบจองก่อนเต็ม!`,
        activityId: activity.id,
      });
    }, 1200);

    // Auto-sync to Google Sheets
    const activeToken = token || getAccessToken();
    if (activeToken && sheetsConfig.spreadsheetId) {
      syncFullStateToSheet(
        activeToken,
        sheetsConfig.spreadsheetId,
        updatedActivities,
        updatedRegistrations,
        updatedCancellations
      ).catch((err) => console.warn('Background sheet sync failed:', err));
    }
  };

  // Toggle seat alert subscription
  const handleToggleSeatAlert = (activityId: string) => {
    setSubscribedSeatAlerts((prev) => {
      if (prev.includes(activityId)) {
        return prev.filter((id) => id !== activityId);
      } else {
        addNotification({
          type: 'seat_opened',
          title: 'เปิดรับการแจ้งเตือนที่นั่งว่างแล้ว',
          message: 'ระบบจะแจ้งเตือนคุณแบบ Real-time ทันทีที่มีนิสิตถอนตัวจากกิจกรรมนี้',
          activityId,
        });
        return [...prev, activityId];
      }
    });
  };

  // Google Sheets manual sync
  const handleSyncGoogleSheets = async () => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      setIsSheetsModalOpen(true);
      throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อรับสิทธิ์การซิงค์ข้อมูล');
    }

    let currentSheetId = sheetsConfig.spreadsheetId;
    if (!currentSheetId) {
      const newSheet = await findOrCreateSpreadsheet(activeToken);
      currentSheetId = newSheet.id;
      setSheetsConfig((prev) => ({
        ...prev,
        spreadsheetId: newSheet.id,
        spreadsheetUrl: newSheet.url,
        spreadsheetTitle: newSheet.name,
      }));
    }

    await syncFullStateToSheet(
      activeToken,
      currentSheetId,
      activities,
      registrations,
      cancellations
    );

    setSheetsConfig((prev) => ({
      ...prev,
      lastSyncedAt: new Date().toISOString(),
    }));
  };

  const handleCreateOrFindSheet = async () => {
    const activeToken = token || getAccessToken();
    if (!activeToken) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนทำการเชื่อมต่อ Google Sheets');
    }

    const sheetInfo = await findOrCreateSpreadsheet(activeToken);
    await syncFullStateToSheet(
      activeToken,
      sheetInfo.id,
      activities,
      registrations,
      cancellations
    );

    setSheetsConfig({
      spreadsheetId: sheetInfo.id,
      spreadsheetUrl: sheetInfo.url,
      spreadsheetTitle: sheetInfo.name,
      lastSyncedAt: new Date().toISOString(),
      isSyncing: false,
      syncError: null,
    });
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Month filter
      if (selectedMonth !== 'all' && act.month !== selectedMonth) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && act.category !== selectedCategory) {
        return false;
      }
      // Keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description.toLowerCase().includes(q);
        const matchSpeaker = act.speaker.toLowerCase().includes(q);
        const matchLoc = act.location.toLowerCase().includes(q);
        const matchTag = act.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSpeaker && !matchLoc && !matchTag) {
          return false;
        }
      }
      return true;
    });
  }, [activities, selectedMonth, selectedCategory, searchKeyword]);

  // Statistics for selected month
  const monthlyStats = useMemo(() => {
    const currentMonthNum = selectedMonth === 'all' ? 9 : selectedMonth;
    const monthActs = activities.filter((a) => a.month === currentMonthNum);
    const totalSeats = monthActs.reduce((sum, a) => sum + a.maxSeats, 0);
    const enrolledSeats = monthActs.reduce((sum, a) => sum + a.enrolledCount, 0);
    const vacantSeats = Math.max(0, totalSeats - enrolledSeats);
    return {
      monthNum: currentMonthNum,
      activityCount: monthActs.length,
      vacantSeats,
      totalSeats,
    };
  }, [activities, selectedMonth]);

  // Upcoming activities (in next 5 days)
  const imminentActivity = useMemo(() => {
    return activities.find((a) => a.startDate === '2026-09-12' || a.id === 'ACT-2026-001');
  }, [activities]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        myBookingsCount={userRegistrations.length}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
        sheetsConfig={sheetsConfig}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
      />

      {/* 2. Real-Time Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                {toastMessage.title}
              </h4>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {toastMessage.message}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* A. Banner for Upcoming Activity & Real-time Monthly Seats */}
        {currentView === 'catalog' && (
          <div className="space-y-4">
            {/* Real-time Monthly Seat Availability Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-800/40">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>ระบบแจ้งเตือนที่นั่งว่าง Real-time ประจำเดือน</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    กิจกรรมพัฒนานิสิตนอกชั้นเรียน
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    ระบบจองกิจกรรมพร้อมระบบป้องกันการจองแทนเพื่อน (Anti-Proxy) แจ้งเตือนที่นั่งว่างแบบ Real-time และบันทึกข้อมูลทรานสคริปต์กิจกรรมลง Google Sheets อัตโนมัติ
                  </p>
                </div>

                {/* Live Seat Stats Widget */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-300 font-medium">
                      ที่นั่งว่างพร้อมเปิดรับ
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-400">
                      {monthlyStats.vacantSeats} <span className="text-xs font-semibold text-slate-300">ที่นั่ง</span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      จาก {monthlyStats.activityCount} กิจกรรมในระบบ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Imminent Upcoming Activity Alert Banner */}
            {imminentActivity && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        ⚡ กิจกรรมกำลังจะเกิดขึ้นเร็วๆ นี้
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                        12 ก.ย. 2569 (13:00 น.)
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {imminentActivity.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      สถานที่: {imminentActivity.location} • ชั่วโมงกิจกรรม: {imminentActivity.activityHours} ชม.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedActivity(imminentActivity)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    ดูรายละเอียด
                  </button>
                  {!enrolledActivityIds.has(imminentActivity.id) && imminentActivity.enrolledCount < imminentActivity.maxSeats && (
                    <button
                      onClick={() => setBookingActivity(imminentActivity)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      จองทันที
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* B. VIEW 1: Activity Catalog */}
        {currentView === 'catalog' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหากิจกรรม, วิทยากร, สถานที่ หรือแท็ก..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                  />
                  {searchKeyword && (
                    <button
                      onClick={() => setSearchKeyword('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Month Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> เดือน:
                  </span>
                  {[
                    { label: 'ทุกเดือน', val: 'all' as const },
                    { label: 'ก.ย. 69', val: 9 },
                    { label: 'ต.ค. 69', val: 10 },
                    { label: 'พ.ย. 69', val: 11 },
                  ].map((m) => (
                    <button
                      key={m.label}
                      onClick={() => setSelectedMonth(m.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedMonth === m.val
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> หมวดหมู่:
                </span>
                {[
                  { label: 'ทั้งหมด', val: 'all' as const },
                  { label: 'ทักษะวิชาการ & นวัตกรรม', val: 'academic' as const },
                  { label: 'บำเพ็ญประโยชน์ & จิตอาสา', val: 'volunteer' as const },
                  { label: 'คุณธรรม & จริยธรรม', val: 'ethics' as const },
                  { label: 'ภาษา & สากล', val: 'international' as const },
                  { label: 'สุขภาพ & กีฬา', val: 'health' as const },
                ].map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setSelectedCategory(c.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === c.val
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activities Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  รายการกิจกรรมที่เปิดรับสมัคร ({filteredActivities.length} กิจกรรม)
                </h2>
                <span className="text-xs text-slate-500">
                  เลือกกิจกรรมเพื่อดูข้อมูลและลงทะเบียน
                </span>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">
                    ไม่พบกิจกรรมตามเงื่อนไขที่ค้นหา
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ลองปรับเปลี่ยนตัวกรองเดือน หมวดหมู่ หรือคำค้นหา
                  </p>
                  <button
                    onClick={() => {
                      setSelectedMonth('all');
                      setSelectedCategory('all');
                      setSearchKeyword('');
                    }}
                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredActivities.map((act) => {
                    const isEnrolled = enrolledActivityIds.has(act.id);
                    const isSubscribed = subscribedSeatAlerts.includes(act.id);

                    return (
                      <ActivityCard
                        key={act.id}
                        activity={act}
                        isEnrolled={isEnrolled}
                        onViewDetails={(a) => setSelectedActivity(a)}
                        onBook={(a) => setBookingActivity(a)}
                        onWithdraw={(a) => {
                          const reg = registrations.find(
                            (r) => r.activityId === a.id && r.status === 'confirmed'
                          );
                          if (reg) setWithdrawActivity({ activity: a, registration: reg });
                        }}
                        isSubscribedForSeats={isSubscribed}
                        onToggleSeatAlert={handleToggleSeatAlert}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* C. VIEW 2: My Registered Activities */}
        {currentView === 'my-bookings' && (
          <MyActivitiesView
            registrations={userRegistrations}
            activities={activities}
            onWithdraw={(activity, registration) => {
              setWithdrawActivity({ activity, registration });
            }}
            onExploreActivities={() => setCurrentView('catalog')}
            onSelectActivity={(activity) => setSelectedActivity(activity)}
          />
        )}

        {/* D. VIEW 3: Administrator Portal */}
        {currentView === 'admin' && (
          <AdminPortal
            activities={activities}
            registrations={registrations}
            cancellations={cancellations}
            sheetsConfig={sheetsConfig}
            onSyncGoogleSheets={handleSyncGoogleSheets}
            onOpenSheetsConfig={() => setIsSheetsModalOpen(true)}
          />
        )}
      </main>

      {/* 4. Modals */}
      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        isEnrolled={Boolean(selectedActivity && enrolledActivityIds.has(selectedActivity.id))}
        onBook={(act) => setBookingActivity(act)}
        onWithdraw={(act) => {
          const reg = registrations.find(
            (r) => r.activityId === act.id && r.status === 'confirmed'
          );
          if (reg) setWithdrawActivity({ activity: act, registration: reg });
        }}
        isSubscribedForSeats={Boolean(selectedActivity && subscribedSeatAlerts.includes(selectedActivity.id))}
        onToggleSeatAlert={handleToggleSeatAlert}
      />

      {/* Booking Modal with Anti-Proxy System */}
      <BookingModal
        activity={bookingActivity}
        isOpen={Boolean(bookingActivity)}
        onClose={() => setBookingActivity(null)}
        user={user}
        onSignIn={handleSignIn}
        initialProfile={{
          studentId: userStudentId,
          fullName: user?.displayName || 'นายกิตติศักดิ์ พัฒนกิจ',
          phone: '0812345678',
          faculty: 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล',
          major: 'สาขาวิชาวิทยาการคอมพิวเตอร์',
          year: 2,
          email: user?.email || '6810710121@tsu.ac.th',
        }}
        previousBookedStudentIds={previousBookedStudentIds}
        onSubmitBooking={handleBookingSubmit}
      />

      {/* Withdraw Modal with Reason & Real-time Seat Reopen */}
      <WithdrawModal
        isOpen={Boolean(withdrawActivity)}
        onClose={() => setWithdrawActivity(null)}
        activity={withdrawActivity?.activity || null}
        registration={withdrawActivity?.registration || null}
        onConfirmWithdraw={handleWithdrawConfirm}
      />

      {/* Notification Center Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearAll={() => setNotifications([])}
        onSelectActivity={(actId) => {
          setIsNotifModalOpen(false);
          const target = activities.find((a) => a.id === actId);
          if (target) setSelectedActivity(target);
        }}
      />

      {/* Google Sheets Integration Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        sheetsConfig={sheetsConfig}
        onSync={handleSyncGoogleSheets}
        onCreateOrFindSheet={handleCreateOrFindSheet}
        isSignedIn={Boolean(user)}
        onSignIn={handleSignIn}
      />

      {/* 5. Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 มหาวิทยาลัยทักษิณ (TSU) • ระบบจองกิจกรรมพัฒนานิสิตนอกชั้นเรียน</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>ระบบป้องกันการจองแทน (Anti-Proxy)</span>
            <span>•</span>
            <span>Google Sheets Integration</span>
            <span>•</span>
            <span>Real-time Seat Alert</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
