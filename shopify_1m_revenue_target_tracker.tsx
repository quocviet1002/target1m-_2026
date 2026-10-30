import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Rocket,
  Trophy,
  TrendingUp,
  TrendingDown,
  Store,
  Plus,
  Minus,
  Calendar,
  DollarSign,
  Target,
  Award,
  Sparkles,
  Settings,
  Maximize2,
  Minimize2,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileSpreadsheet,
  Sliders,
  History,
  X,
  Save,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

// --- INITIAL SAMPLE DATA ---
const DEFAULT_TARGET = 1000000; // $1,000,000

const INITIAL_STORES = [
  {
    id: 'store-1',
    name: 'Hamyso (US Flagship)',
    domain: 'hamyso-official.myshopify.com',
    color: '#10b981', // emerald
    ytdRevenue: 385000,
    todayRevenue: 5420,
    ordersToday: 86
  },
  {
    id: 'store-2',
    name: 'Gavafam (US / CA Pod)',
    domain: 'gavafam-store.myshopify.com',
    color: '#06b6d4', // cyan
    ytdRevenue: 274500,
    todayRevenue: 3890,
    ordersToday: 62
  },
  {
    id: 'store-3',
    name: 'Store EU #3 (DE / UK)',
    domain: 'eu-niche-trends.myshopify.com',
    color: '#f59e0b', // amber
    ytdRevenue: 142000,
    todayRevenue: 2150,
    ordersToday: 34
  },
  {
    id: 'store-4',
    name: 'Store Q4 Scale #4',
    domain: 'q4-global-scale.myshopify.com',
    color: '#ec4899', // pink
    ytdRevenue: 53500,
    todayRevenue: 1140,
    ordersToday: 19
  }
];

const INITIAL_LOGS = [
  { id: 'log-1', date: '2026-10-30', storeName: 'Tất cả Stores', amount: 12600, type: 'daily_add', note: 'Chốt doanh thu ngày + Win camp mới trên Hamyso', totalAfter: 855000 },
  { id: 'log-2', date: '2026-10-29', storeName: 'Gavafam (US / CA Pod)', amount: -1450, type: 'adjustment', note: 'Trừ Refund / Dispute cổng thanh toán tuần này', totalAfter: 842400 },
  { id: 'log-3', date: '2026-10-28', storeName: 'Hamyso (US Flagship)', amount: 11800, type: 'daily_add', note: 'Scale ngân sách Ads US lên $3k/day', totalAfter: 843850 },
  { id: 'log-4', date: '2026-10-27', storeName: 'Store EU #3 (DE / UK)', amount: 9400, type: 'daily_add', note: 'Doanh thu ổn định đầu tuần', totalAfter: 832050 },
  { id: 'log-5', date: '2026-10-26', storeName: 'Tất cả Stores', amount: 14200, type: 'daily_add', note: 'Bùng nổ đơn cuối tuần (Weekend Push)', totalAfter: 822650 },
];

const MILESTONES = [
  { pct: 25, value: 250000, label: '$250K', title: 'Khởi động vững chắc' },
  { pct: 50, value: 500000, label: '$500K', title: 'Nửa chặng đường' },
  { pct: 75, value: 750000, label: '$750K', title: 'Tăng tốc Q4' },
  { pct: 100, value: 1000000, label: '$1M TARGET', title: 'Chạm đỉnh Triệu Đô!' }
];

// Utility for formatting currency
const formatUSD = (num, showDecimals = false) => {
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
};

// Custom Hook for smooth number animation
function useAnimatedNumber(targetValue, duration = 750) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    let animationFrame;
    const updateNumber = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValueRef.current + (targetValue - startValueRef.current) * easeOut;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrame = requestAnimationFrame(updateNumber);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetValue, duration]);

  return displayValue;
}

export default function App() {
  // --- STATE ---
  const [teamName, setTeamName] = useState(() => localStorage.getItem('shopify_v2_team_name') || 'SHOPIFY MILLIONAIRE TEAM');
  const [targetRevenue, setTargetRevenue] = useState(() => Number(localStorage.getItem('shopify_v2_target_rev')) || DEFAULT_TARGET);
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('shopify_v2_stores_data');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('shopify_v2_revenue_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // UI Modals & Modes
  const [isTvMode, setIsTvMode] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [flashState, setFlashState] = useState(null); // 'up' | 'down' | null
  const [recentDelta, setRecentDelta] = useState(null); // { amount: +5000, id }

  // Daily Update Form State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [updateAmountInput, setUpdateAmountInput] = useState('');
  const [updateType, setUpdateType] = useState('add'); // 'add' | 'subtract'
  const [updateNote, setUpdateNote] = useState('');

  // Edit Log State
  const [editingLogId, setEditingLogId] = useState(null);

  // New / Edit Store Form State
  const [editingStore, setEditingStore] = useState(null);
  const [storeForm, setStoreForm] = useState({ name: '', domain: '', ytdRevenue: '', todayRevenue: '', color: '#10b981' });

  // Google Sheets / Webhook URL state
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('shopify_v2_sheet_url') || '');
  const [syncStatus, setSyncStatus] = useState('');

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('shopify_v2_team_name', teamName);
    localStorage.setItem('shopify_v2_target_rev', targetRevenue.toString());
    localStorage.setItem('shopify_v2_stores_data', JSON.stringify(stores));
    localStorage.setItem('shopify_v2_revenue_logs', JSON.stringify(logs));
  }, [teamName, targetRevenue, stores, logs]);

  // --- DERIVED METRICS ---
  const totalYtdRevenue = useMemo(() => {
    return stores.reduce((sum, s) => sum + (Number(s.ytdRevenue) || 0), 0);
  }, [stores]);

  const totalTodayRevenue = useMemo(() => {
    return stores.reduce((sum, s) => sum + (Number(s.todayRevenue) || 0), 0);
  }, [stores]);

  const totalOrdersToday = useMemo(() => {
    return stores.reduce((sum, s) => sum + (Number(s.ordersToday) || 0), 0);
  }, [stores]);

  const animatedTotalRevenue = useAnimatedNumber(totalYtdRevenue, 750);
  const rawPercentage = targetRevenue > 0 ? (totalYtdRevenue / targetRevenue) * 100 : 0;
  const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
  const remainingRevenue = Math.max(targetRevenue - totalYtdRevenue, 0);

  // Date & Run-rate Calculation
  const yearMetrics = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const totalDaysInYear = ((year % 4 === 0 && year % 100 > 0) || year % 400 === 0) ? 366 : 365;
    const dayOfYear = Math.max(1, Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1);
    const daysRemaining = Math.max(1, totalDaysInYear - dayOfYear);
    const yearTimePercentage = (dayOfYear / totalDaysInYear) * 100;

    // Expected revenue by today to be linearly on track
    const expectedRevenueToday = (targetRevenue / totalDaysInYear) * dayOfYear;
    const paceDifference = totalYtdRevenue - expectedRevenueToday;
    const isOnTrack = paceDifference >= 0;

    // Current daily average vs Required daily average for remaining days
    const currentDailyAvg = totalYtdRevenue / dayOfYear;
    const requiredDailyRunRate = remainingRevenue / daysRemaining;
    const projectedEndOfYear = currentDailyAvg * totalDaysInYear;

    // Projected Hit Date based on current daily average
    let projectedHitDateStr = 'Chưa xác định';
    if (remainingRevenue <= 0) {
      projectedHitDateStr = 'Đã cán đích $1M! 🎉';
    } else if (currentDailyAvg > 0) {
      const daysNeeded = Math.ceil(remainingRevenue / currentDailyAvg);
      const hitDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
      projectedHitDateStr = hitDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    return {
      year,
      dayOfYear,
      totalDaysInYear,
      daysRemaining,
      yearTimePercentage,
      expectedRevenueToday,
      paceDifference,
      isOnTrack,
      currentDailyAvg,
      requiredDailyRunRate,
      projectedEndOfYear,
      projectedHitDateStr
    };
  }, [totalYtdRevenue, targetRevenue, remainingRevenue]);

  // Cumulative Trajectory Chart Data (Monthly YTD progression vs Linear Target)
  const chartData = useMemo(() => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const currentMonthIdx = new Date().getMonth(); // 0-11
    return months.map((m, idx) => {
      const targetPace = Math.round(((idx + 1) / 12) * targetRevenue);
      let actual = null;
      if (idx < currentMonthIdx) {
        // Smooth curve up to current month
        const curveRatio = Math.pow((idx + 1) / (currentMonthIdx + 1), 1.08);
        actual = Math.round(totalYtdRevenue * curveRatio);
      } else if (idx === currentMonthIdx) {
        actual = Math.round(totalYtdRevenue);
      }
      return {
        name: m,
        actual,
        targetPace
      };
    });
  }, [totalYtdRevenue, targetRevenue]);

  // Trigger confetti if hitting >= 100%
  useEffect(() => {
    if (rawPercentage >= 100) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [rawPercentage >= 100]);

  // --- VISUAL FEEDBACK TRIGGER ---
  const triggerDeltaFeedback = (amount) => {
    if (amount === 0) return;
    setRecentDelta({ amount, id: Date.now() });
    setFlashState(amount > 0 ? 'up' : 'down');
    setTimeout(() => setFlashState(null), 900);
    setTimeout(() => setRecentDelta(null), 3800);
  };

  // --- HANDLERS ---
  // Quick adjustment or slider change
  const handleQuickAdjust = (deltaAmount, customNote = '', targetStoreId = 'all') => {
    if (stores.length === 0 || deltaAmount === 0) return;

    const updatedStores = stores.map((store, idx) => {
      if (targetStoreId !== 'all' && store.id !== targetStoreId) return store;

      let storeDelta = deltaAmount;
      if (targetStoreId === 'all') {
        const share = totalYtdRevenue > 0 ? store.ytdRevenue / totalYtdRevenue : 1 / stores.length;
        storeDelta = Math.round(deltaAmount * share);
      }

      const newYtd = Math.max(0, store.ytdRevenue + storeDelta);
      const newToday = store.todayRevenue + (targetStoreId !== 'all' ? deltaAmount : Math.round(deltaAmount * (idx === 0 ? 0.5 : 0.2)));
      return {
        ...store,
        ytdRevenue: newYtd,
        todayRevenue: newToday
      };
    });

    const newTotal = updatedStores.reduce((sum, s) => sum + s.ytdRevenue, 0);
    const actualDelta = newTotal - totalYtdRevenue;
    setStores(updatedStores);
    triggerDeltaFeedback(actualDelta);

    const storeObj = stores.find(s => s.id === targetStoreId);
    const newLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      storeName: storeObj ? storeObj.name : 'Tất cả Stores',
      amount: actualDelta,
      type: actualDelta >= 0 ? 'daily_add' : 'adjustment',
      note: customNote || (actualDelta >= 0 ? 'Cập nhật cộng doanh thu ngày' : 'Trừ Refund / Chargeback / Điều chỉnh'),
      totalAfter: newTotal
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  // Direct Slider Change to test exact Loading Bar position
  const handleSliderSetTotal = (newTotalValue) => {
    const targetVal = Math.max(0, Number(newTotalValue));
    const delta = targetVal - totalYtdRevenue;
    if (delta === 0) return;

    const updatedStores = stores.map((store) => {
      const share = totalYtdRevenue > 0 ? store.ytdRevenue / totalYtdRevenue : 1 / stores.length;
      return {
        ...store,
        ytdRevenue: Math.max(0, Math.round(targetVal * share))
      };
    });

    setStores(updatedStores);
    setFlashState(delta > 0 ? 'up' : 'down');
    setRecentDelta({ amount: delta, id: Date.now() });
  };

  // Submit Daily Revenue Form
  const handleDailyFormSubmit = (e) => {
    e.preventDefault();
    const rawVal = Math.abs(parseFloat(updateAmountInput) || 0);
    if (rawVal === 0) return;

    const signedAmount = updateType === 'subtract' ? -rawVal : rawVal;

    if (editingLogId) {
      // Update existing log & adjust revenue difference
      const oldLog = logs.find(l => l.id === editingLogId);
      const diff = oldLog ? signedAmount - oldLog.amount : signedAmount;
      handleQuickAdjust(diff, updateNote || 'Chỉnh sửa bản ghi doanh thu', selectedStoreId);
      setLogs(prev =>
        prev.map(l =>
          l.id === editingLogId
            ? { ...l, date: selectedDate, amount: signedAmount, note: updateNote || l.note, type: signedAmount >= 0 ? 'daily_add' : 'adjustment' }
            : l
        )
      );
      setEditingLogId(null);
    } else {
      handleQuickAdjust(
        signedAmount,
        updateNote || (signedAmount >= 0 ? `Doanh thu ngày ${selectedDate}` : `Trừ Refund / Điều chỉnh ngày ${selectedDate}`),
        selectedStoreId
      );
    }

    setUpdateAmountInput('');
    setUpdateNote('');
    setShowUpdateModal(false);
  };

  // Delete Log Entry (and revert its impact on loading bar)
  const handleDeleteLog = (log) => {
    setLogs(prev => prev.filter(l => l.id !== log.id));
    // Revert the amount from total so loading goes up/down accurately
    const revertDelta = -log.amount;
    const updatedStores = stores.map((store) => {
      const share = totalYtdRevenue > 0 ? store.ytdRevenue / totalYtdRevenue : 1 / stores.length;
      return {
        ...store,
        ytdRevenue: Math.max(0, Math.round(store.ytdRevenue + revertDelta * share))
      };
    });
    setStores(updatedStores);
    triggerDeltaFeedback(revertDelta);
  };

  // Open Edit Log Modal
  const openEditLog = (log) => {
    setEditingLogId(log.id);
    setSelectedDate(log.date);
    setUpdateType(log.amount >= 0 ? 'add' : 'subtract');
    setUpdateAmountInput(Math.abs(log.amount).toString());
    setUpdateNote(log.note);
    setShowUpdateModal(true);
  };

  // Handle Add/Edit Store
  const openAddStoreModal = (store = null) => {
    if (store) {
      setEditingStore(store);
      setStoreForm({
        name: store.name,
        domain: store.domain,
        ytdRevenue: store.ytdRevenue,
        todayRevenue: store.todayRevenue,
        color: store.color || '#10b981'
      });
    } else {
      setEditingStore(null);
      setStoreForm({
        name: '',
        domain: '',
        ytdRevenue: '',
        todayRevenue: '',
        color: '#8b5cf6'
      });
    }
    setShowStoreModal(true);
  };

  const handleSaveStore = (e) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;

    const ytd = parseFloat(storeForm.ytdRevenue) || 0;
    const today = parseFloat(storeForm.todayRevenue) || 0;

    if (editingStore) {
      const diff = ytd - editingStore.ytdRevenue;
      const updated = stores.map(s =>
        s.id === editingStore.id
          ? { ...s, name: storeForm.name, domain: storeForm.domain, ytdRevenue: ytd, todayRevenue: today, color: storeForm.color }
          : s
      );
      setStores(updated);
      if (diff !== 0) triggerDeltaFeedback(diff);
    } else {
      const newStore = {
        id: `store-${Date.now()}`,
        name: storeForm.name,
        domain: storeForm.domain || `${storeForm.name.toLowerCase().replace(/\s+/g, '-')}.myshopify.com`,
        ytdRevenue: ytd,
        todayRevenue: today,
        ordersToday: Math.max(1, Math.round(today / 60)),
        color: storeForm.color
      };
      setStores([...stores, newStore]);
      if (ytd !== 0) triggerDeltaFeedback(ytd);
    }
    setShowStoreModal(false);
  };

  const handleDeleteStore = (id) => {
    const target = stores.find(s => s.id === id);
    if (!target || stores.length <= 1) return;
    setStores(stores.filter(s => s.id !== id));
    triggerDeltaFeedback(-target.ytdRevenue);
  };

  const handleResetDemo = () => {
    setStores(INITIAL_STORES);
    setLogs(INITIAL_LOGS);
    setTargetRevenue(DEFAULT_TARGET);
    triggerDeltaFeedback(INITIAL_STORES.reduce((s, a) => s + a.ytdRevenue, 0) - totalYtdRevenue);
  };

  const toggleTvMode = () => {
    setIsTvMode(!isTvMode);
    if (!document.fullscreenElement && !isTvMode) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-15%] left-[25%] w-[600px] h-[400px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

      {/* Custom Animations for Shimmer, Glow & Confetti Particles */}
      <style>{`
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes pulseGlowGreen {
          0%, 100% { box-shadow: 0 0 22px rgba(16, 185, 129, 0.45), 0 0 45px rgba(6, 182, 212, 0.25); }
          50% { box-shadow: 0 0 36px rgba(16, 185, 129, 0.85), 0 0 70px rgba(6, 182, 212, 0.45); }
        }
        @keyframes floatRocket {
          0%, 100% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-4px) rotate(45deg); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .loading-bar-glow {
          animation: pulseGlowGreen 2.8s infinite ease-in-out;
        }
        .shimmer-overlay {
          animation: shimmerSlide 2.4s infinite linear;
        }
        .rocket-float {
          animation: floatRocket 1.8s infinite ease-in-out;
        }
        .confetti-piece {
          position: fixed;
          top: -10px;
          width: 10px;
          height: 16px;
          z-index: 60;
          pointer-events: none;
          animation: confettiFall 4.2s ease-in forwards;
        }
      `}</style>

      {/* Confetti Particles & Banner when hitting >= 100% ($1M) */}
      {showConfetti && (
        <>
          {Array.from({ length: 42 }).map((_, idx) => {
            const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#a855f7', '#fde047'];
            return (
              <div
                key={idx}
                className="confetti-piece rounded-sm"
                style={{
                  left: `${(idx * 2.4) % 100}%`,
                  backgroundColor: colors[idx % colors.length],
                  animationDelay: `${(idx % 10) * 0.25}s`,
                  animationDuration: `${3 + (idx % 4)}s`
                }}
              />
            );
          })}
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none px-4">
            <div className="bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-500 p-[2px] rounded-2xl shadow-2xl animate-bounce">
              <div className="bg-slate-950/95 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3">
                <Trophy className="w-7 h-7 text-amber-400" />
                <div>
                  <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 text-base sm:text-lg">
                    CHÚC MỪNG TEAM ĐÃ CHẠM ĐỈNH $1,000,000 DOANH THU!
                  </p>
                  <p className="text-xs text-slate-300">Mục tiêu 1 triệu đô đã hoàn thành xuất sắc!</p>
                </div>
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- TOP HEADER BAR --- */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Rocket className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Shopify $1M Target
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  YTD Live Tracker {yearMetrics.year}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                {teamName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setEditingLogId(null);
                setUpdateAmountInput('');
                setUpdateNote('');
                setShowUpdateModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Cập nhật Doanh thu Ngày</span>
            </button>

            <button
              onClick={() => setShowSyncModal(true)}
              className="hidden md:flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Auto-Sync Sheet</span>
            </button>

            <button
              onClick={toggleTvMode}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isTvMode
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
              }`}
              title="Chế độ trình chiếu TV văn phòng"
            >
              {isTvMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isTvMode ? 'Thoát TV Mode' : 'TV Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ============================================================
            1. HERO SECTION: THE $1M LOADING BAR & TARGET TRACKER
           ============================================================ */}
        <section
          className={`relative rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border p-5 sm:p-8 shadow-2xl overflow-hidden transition-all duration-500 ${
            flashState === 'up'
              ? 'border-emerald-400 shadow-emerald-500/25 ring-2 ring-emerald-500/40'
              : flashState === 'down'
              ? 'border-rose-500 shadow-rose-500/25 ring-2 ring-rose-500/40'
              : 'border-slate-800/90'
          }`}
        >
          {/* Decorative Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Top Status Row inside Hero */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>MỤC TIÊU NĂM {yearMetrics.year}:</span>
                <span className="text-white font-black">{formatUSD(targetRevenue)}</span>
              </div>

              {/* Dynamic Pacing Status Badge (Ahead or Behind Schedule) */}
              {yearMetrics.isOnTrack ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  <span>Vượt tiến độ năm: +{formatUSD(yearMetrics.paceDifference)}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Cần tăng tốc: Thiếu {formatUSD(Math.abs(yearMetrics.paceDifference))} so với mốc thời gian năm</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ngày <strong className="text-slate-200">{yearMetrics.dayOfYear}</strong>/{yearMetrics.totalDaysInYear}</span>
              <span className="text-slate-600">•</span>
              <span>Còn <strong className="text-amber-400">{yearMetrics.daysRemaining} ngày</strong> cuối năm</span>
            </div>
          </div>

          {/* Big Numbers Counter & Remaining Goal */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-8">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400">
                  TỔNG DOANH THU TỪ ĐẦU NĂM ĐẾN NAY (YTD REVENUE)
                </span>
                {recentDelta && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black animate-bounce ${
                      recentDelta.amount >= 0
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                        : 'bg-rose-500/25 text-rose-300 border border-rose-400/50'
                    }`}
                  >
                    {recentDelta.amount >= 0 ? '▲ +' : '▼ '}
                    {formatUSD(recentDelta.amount)}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-4 flex-wrap">
                <h2
                  className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight tabular-nums transition-colors duration-300 ${
                    flashState === 'up'
                      ? 'text-emerald-300'
                      : flashState === 'down'
                      ? 'text-rose-400'
                      : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-cyan-300'
                  }`}
                >
                  {formatUSD(animatedTotalRevenue)}
                </h2>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                    {rawPercentage.toFixed(2)}%
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Loading Tiến Độ
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-bold">CÒN THIẾU ĐẾN $1M</span>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-white tabular-nums">
                  {remainingRevenue > 0 ? formatUSD(remainingRevenue) : 'ĐÃ ĐẠT $1,000,000!'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Chuẩn hôm nay: <strong className="text-slate-200">{formatUSD(yearMetrics.expectedRevenueToday)}</strong>
                </p>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/25 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                  <span className="font-bold">DOANH THU HÔM NAY</span>
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <p
                  className={`text-lg sm:text-2xl font-black tabular-nums ${
                    totalTodayRevenue >= 0 ? 'text-emerald-300' : 'text-rose-400'
                  }`}
                >
                  {totalTodayRevenue >= 0 ? '+' : ''}
                  {formatUSD(totalTodayRevenue)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tổng <strong className="text-slate-200">{totalOrdersToday} đơn</strong> ({stores.length} stores)
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================
              THE INTERACTIVE GAMIFIED LOADING PROGRESS BAR
             ============================================================ */}
          <div className="relative z-10 pt-5 pb-6">
            {/* Expected Year Pace Marker above the bar */}
            <div className="relative h-7 mb-1.5">
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-700"
                style={{ left: `${Math.min(Math.max(yearMetrics.yearTimePercentage, 6), 94)}%` }}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/40 whitespace-nowrap shadow">
                  Mốc thời gian năm {yearMetrics.year} ({yearMetrics.yearTimePercentage.toFixed(1)}% • {formatUSD(yearMetrics.expectedRevenueToday)})
                </span>
                <div className="w-0.5 h-2 bg-cyan-400" />
              </div>
            </div>

            {/* Outer Track */}
            <div className="relative h-11 sm:h-14 w-full bg-slate-950 rounded-2xl p-1.5 border border-slate-800 shadow-inner overflow-visible">
              {/* Expected Year Pace vertical dashed line */}
              <div
                className="absolute top-0 bottom-0 w-[2px] border-r-2 border-dashed border-cyan-400/70 z-20 pointer-events-none"
                style={{ left: `${Math.min(yearMetrics.yearTimePercentage, 100)}%` }}
              />

              {/* Milestone vertical ticks inside track */}
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-1.5 bottom-1.5 w-[1px] bg-slate-800 z-10"
                  style={{ left: `${pct}%` }}
                />
              ))}

              {/* Active Animated Fill Bar */}
              <div
                className={`relative h-full rounded-xl transition-all duration-700 ease-out loading-bar-glow overflow-hidden flex items-center justify-end ${
                  flashState === 'down'
                    ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-orange-400'
                    : 'bg-gradient-to-r from-cyan-600 via-emerald-500 to-teal-300'
                }`}
                style={{ width: `${Math.max(clampedPercentage, 2)}%` }}
              >
                {/* Animated Diagonal Stripes + Shimmer */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, rgba(255,255,255,0.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.35) 75%, transparent 75%, transparent)',
                    backgroundSize: '28px 28px'
                  }}
                />
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent shimmer-overlay" />

                {clampedPercentage > 10 && (
                  <span className="relative z-10 pr-5 text-xs sm:text-sm font-black text-slate-950 drop-shadow">
                    {rawPercentage.toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Rocket / Fire Tip Indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 transition-all duration-700 ease-out"
                style={{ left: `${Math.max(clampedPercentage, 2)}%` }}
              >
                <div
                  className={`relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-900 border-2 shadow-xl transition-colors ${
                    flashState === 'down'
                      ? 'border-rose-400 shadow-rose-500/40'
                      : 'border-emerald-400 shadow-emerald-500/40'
                  }`}
                >
                  {rawPercentage >= 100 ? (
                    <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                  ) : (
                    <Rocket
                      className={`w-6 h-6 rocket-float ${
                        flashState === 'down' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    />
                  )}
                  <span
                    className={`absolute -bottom-7 px-2 py-0.5 rounded-md font-black text-[10px] shadow whitespace-nowrap ${
                      flashState === 'down'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {formatUSD(totalYtdRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Milestone Markers below the bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-9 pt-2 border-t border-slate-800/60">
              {MILESTONES.map((m) => {
                const reached = totalYtdRevenue >= m.value;
                return (
                  <div
                    key={m.value}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                      reached
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-900/40 border-slate-800/70 text-slate-500'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        reached ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {reached ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : <Award className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-black truncate">
                        {m.label} <span className="text-[10px] opacity-75">({m.pct}%)</span>
                      </div>
                      <div className="text-[11px] opacity-80 truncate">{m.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              QUICK SIMULATION CONTROLS & INTERACTIVE SLIDER (TEST UP/DOWN)
             ============================================================ */}
          {!isTvMode && (
            <div className="relative z-10 mt-2 pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Bảng Test Nhanh Loading Tăng / Giảm (Cộng đơn mới hoặc Trừ Refund):</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleQuickAdjust(-10000, 'Trừ Refund / Hold cổng thanh toán (-$10,000)')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    -$10,000
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(-1000, 'Trừ Refund đơn hàng trong ngày (-$1,000)')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    -$1,000 (Refund)
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(1000, 'Cộng doanh thu ngày (+$1,000)')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    +$1,000
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(10000, 'Cộng doanh thu ngày (+$10,000)')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    +$10,000
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(50000, 'Bùng nổ doanh thu tuần (+$50,000)')}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    +$50,000
                  </button>
                  <button
                    onClick={() => {
                      const diff = targetRevenue - totalYtdRevenue;
                      if (diff !== 0) handleQuickAdjust(diff, 'Chạm đỉnh $1,000,000 Target!');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test Đạt $1M</span>
                  </button>
                  <button
                    onClick={handleResetDemo}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Reset Demo
                  </button>
                </div>
              </div>

              {/* Interactive Range Slider to scrub YTD Revenue */}
              <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                  Kéo thử thanh Loading ($0 → $1.1M):
                </span>
                <input
                  type="range"
                  min="0"
                  max={Math.round(targetRevenue * 1.1)}
                  step="5000"
                  value={Math.min(totalYtdRevenue, Math.round(targetRevenue * 1.1))}
                  onChange={(e) => handleSliderSetTotal(e.target.value)}
                  className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <span className="text-xs font-black text-emerald-400 tabular-nums whitespace-nowrap">
                  {formatUSD(totalYtdRevenue)} ({rawPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================
            2. KPI RUN-RATE CARDS ROW
           ============================================================ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Net Change */}
          <div className="bg-slate-900/75 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Doanh thu hôm nay (Net)</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black tabular-nums ${
                totalTodayRevenue >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalTodayRevenue >= 0 ? '+' : ''}
              {formatUSD(totalTodayRevenue)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Cập nhật theo ngày từ <strong className="text-slate-200">{stores.length} stores</strong>
            </p>
          </div>

          {/* Card 2: Daily Average YTD */}
          <div className="bg-slate-900/75 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Trung bình ngày từ đầu năm</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {formatUSD(yearMetrics.currentDailyAvg)}
              <span className="text-xs font-normal text-slate-400"> / ngày</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Đã chạy qua <strong className="text-slate-200">{yearMetrics.dayOfYear} ngày</strong> năm {yearMetrics.year}
            </p>
          </div>

          {/* Card 3: Required Daily Run-rate to hit $1M */}
          <div className="bg-slate-900/75 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Cần đạt mỗi ngày đến 31/12</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-300 tabular-nums">
              {formatUSD(yearMetrics.requiredDailyRunRate)}
              <span className="text-xs font-normal text-slate-400"> / ngày</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Trong <strong className="text-slate-200">{yearMetrics.daysRemaining} ngày</strong> còn lại để đạt $1M
            </p>
          </div>

          {/* Card 4: Projected Hit Date */}
          <div className="bg-slate-900/75 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Dự kiến ngày chạm mốc $1M</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 tabular-nums">
              {yearMetrics.projectedHitDateStr}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Dự phóng cuối năm: <strong className="text-slate-200">{formatUSD(yearMetrics.projectedEndOfYear)}</strong>
            </p>
          </div>
        </section>

        {/* ============================================================
            3. MULTI-STORE SHOPIFY BREAKDOWN & CUMULATIVE CHART
           ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Multi-Store Shopify Breakdown */}
          <div className="lg:col-span-7 bg-slate-900/75 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-400" />
                    <span>Tỷ Trọng Các Website Shopify Trong Team</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tổng doanh thu các Store cộng lại quyết định % Loading tới $1,000,000
                  </p>
                </div>

                {!isTvMode && (
                  <button
                    onClick={() => openAddStoreModal(null)}
                    className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Store</span>
                  </button>
                )}
              </div>

              {/* Stacked Bar of Stores */}
              <div className="mb-6">
                <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
                  {stores.map((store) => {
                    const share = totalYtdRevenue > 0 ? (store.ytdRevenue / totalYtdRevenue) * 100 : 0;
                    return (
                      <div
                        key={store.id}
                        style={{ width: `${share}%`, backgroundColor: store.color }}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-700"
                        title={`${store.name}: ${share.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2.5">
                  {stores.map((store) => {
                    const share = totalYtdRevenue > 0 ? (store.ytdRevenue / totalYtdRevenue) * 100 : 0;
                    return (
                      <div key={store.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: store.color }} />
                        <span className="font-semibold truncate max-w-[150px]">{store.name}</span>
                        <span className="text-slate-400 font-bold">({share.toFixed(1)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Store Cards List */}
              <div className="space-y-3">
                {stores.map((store) => {
                  const shareOfTotal = totalYtdRevenue > 0 ? (store.ytdRevenue / totalYtdRevenue) * 100 : 0;
                  const shareOfTarget = (store.ytdRevenue / targetRevenue) * 100;

                  return (
                    <div
                      key={store.id}
                      className="p-4 rounded-2xl bg-slate-950/75 border border-slate-800/80 hover:border-slate-700 transition-all group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-10 rounded-full shrink-0"
                            style={{ backgroundColor: store.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-white text-sm sm:text-base">{store.name}</h4>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                {shareOfTotal.toFixed(1)}% tổng team
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{store.domain}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-black text-white tabular-nums">
                              {formatUSD(store.ytdRevenue)}
                            </div>
                            <div className="text-xs text-emerald-400 font-bold">
                              Hôm nay: +{formatUSD(store.todayRevenue)}
                            </div>
                          </div>

                          {!isTvMode && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuickAdjust(2000, `Cộng nhanh +$2k cho ${store.name}`, store.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer"
                                title="Cộng nhanh +$2,000 cho Store này"
                              >
                                +$2k
                              </button>
                              <button
                                onClick={() => openAddStoreModal(store)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                title="Chỉnh sửa Store"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {stores.length > 1 && (
                                <button
                                  onClick={() => handleDeleteStore(store.id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                                  title="Xóa Store"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(shareOfTotal, 100)}%`,
                            backgroundColor: store.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                        <span>Đóng góp {shareOfTarget.toFixed(2)}% vào mục tiêu $1,000,000</span>
                        <span>~{store.ordersToday || 0} đơn hôm nay</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Cumulative Chart & Daily History Logs */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Cumulative YTD Trajectory Chart */}
            <div className="bg-slate-900/75 border border-slate-800/90 rounded-3xl p-5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Biểu Đồ Lũy Kế Năm vs Chuẩn $1M</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Đường xanh: Doanh thu thực tế YTD • Đường nét đứt: Mốc chuẩn $1M
                  </p>
                </div>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ytdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                      formatter={(val, name) => [
                        formatUSD(val),
                        name === 'actual' ? 'Lũy kế thực tế' : 'Chuẩn mục tiêu $1M'
                      ]}
                    />
                    <ReferenceLine y={targetRevenue} stroke="#f59e0b" strokeDasharray="4 4" />
                    <Area
                      type="monotone"
                      dataKey="targetPace"
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      fill="none"
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#ytdGrad)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily History Log Card */}
            <div className="bg-slate-900/75 border border-slate-800/90 rounded-3xl p-5 backdrop-blur-md flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>Nhật Ký Cập Nhật Theo Ngày</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Có thể sửa hoặc xóa từng lần nhập để cập nhật lại Loading
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingLogId(null);
                    setUpdateAmountInput('');
                    setUpdateNote('');
                    setShowUpdateModal(true);
                  }}
                  className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  + Thêm ngày mới
                </button>
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {logs.map((log) => {
                  const isPositive = log.amount >= 0;
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-slate-950/75 border border-slate-800/80 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{log.note}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{log.date}</span>
                            <span>•</span>
                            <span className="text-slate-400 truncate">{log.storeName || 'Tất cả Stores'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-xs sm:text-sm font-black tabular-nums ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatUSD(log.amount)}
                          </div>
                          <div className="text-[10px] text-slate-500 tabular-nums">
                            YTD: {formatUSD(log.totalAfter)}
                          </div>
                        </div>

                        {!isTvMode && (
                          <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100">
                            <button
                              onClick={() => openEditLog(log)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title="Sửa bản ghi này"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log)}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                              title="Xóa & hoàn tác doanh thu"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================
          MODAL 1: CẬP NHẬT DOANH THU NGÀY (DAILY REVENUE UPDATE)
         ============================================================ */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingLogId ? 'Chỉnh Sửa Bản Ghi Doanh Thu' : 'Cập Nhật Doanh Thu Ngày'}
                  </h3>
                  <p className="text-xs text-slate-400">Tự động tăng hoặc giảm thanh Loading $1M</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDailyFormSubmit} className="space-y-4 mt-4">
              {/* Toggle Increase vs Decrease */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUpdateType('add')}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    updateType === 'add'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cộng Doanh Thu (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateType('subtract')}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    updateType === 'subtract'
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Trừ Refund / Giảm (-)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ngày ghi nhận</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Chọn Store</label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Tất cả Stores (Chia đều)</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Số tiền {updateType === 'add' ? 'cộng thêm (+)' : 'trừ đi (-)'} ($ USD) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ví dụ: 8500"
                  value={updateAmountInput}
                  onChange={(e) => setUpdateAmountInput(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-lg font-black focus:outline-none ${
                    updateType === 'add'
                      ? 'border-emerald-500/40 text-emerald-400 focus:border-emerald-400'
                      : 'border-rose-500/40 text-rose-400 focus:border-rose-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="VD: Doanh thu ngày + Win camp mới trên Hamyso..."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer ${
                    updateType === 'add'
                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950'
                      : 'bg-gradient-to-r from-rose-500 to-orange-500 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu & Cập Nhật Loading</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: THÊM / SỬA SHOPIFY STORE
         ============================================================ */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">
                {editingStore ? 'Chỉnh Sửa Store Shopify' : 'Thêm Store Shopify Mới'}
              </h3>
              <button
                onClick={() => setShowStoreModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Store *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hamyso US #2"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Domain (.myshopify.com)</label>
                <input
                  type="text"
                  placeholder="hamyso-us.myshopify.com"
                  value={storeForm.domain}
                  onChange={(e) => setStoreForm({ ...storeForm, domain: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Doanh thu từ đầu năm ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="200000"
                    value={storeForm.ytdRevenue}
                    onChange={(e) => setStoreForm({ ...storeForm, ytdRevenue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Doanh thu hôm nay ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="3500"
                    value={storeForm.todayRevenue}
                    onChange={(e) => setStoreForm({ ...storeForm, todayRevenue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Màu hiển thị</label>
                <div className="flex items-center gap-2.5">
                  {['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'].map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setStoreForm({ ...storeForm, color: clr })}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        storeForm.color === clr ? 'scale-125 ring-2 ring-white' : 'opacity-70'
                      }`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
                >
                  Lưu Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: AUTO-SYNC GOOGLE SHEETS / SHOPIFY WEBHOOK GUIDE
         ============================================================ */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-black text-white">Đồng Bộ Tự Động Từ Shopify / Google Sheets</h3>
                  <p className="text-xs text-slate-400">Tự động cập nhật doanh thu các Store mỗi ngày</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                Mọi thay đổi bạn nhập đã được <strong>lưu tự động trên trình duyệt (LocalStorage)</strong>. Để tự động hóa việc lấy doanh thu từ nhiều store Shopify về Dashboard mỗi ngày:
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-400">Quy trình 3 bước qua Google Sheets:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Dùng <strong>Shopify Flow</strong> hoặc <strong>Make.com / Coupler.io</strong> đẩy doanh thu chốt ngày của các Store vào 1 file Google Sheet.</li>
                  <li>Trong Google Sheet, vào <em>Extensions &gt; Apps Script</em>, triển khai Web App trả về JSON danh sách stores.</li>
                  <li>Dán URL Web App vào ô dưới đây để cập nhật chỉ với 1 click.</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Google Apps Script / Webhook JSON URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={sheetUrl}
                    onChange={(e) => {
                      setSheetUrl(e.target.value);
                      localStorage.setItem('shopify_v2_sheet_url', e.target.value);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!sheetUrl) {
                        setSyncStatus('Vui lòng dán URL JSON trước khi đồng bộ.');
                        return;
                      }
                      setSyncStatus('Đang tải dữ liệu...');
                      try {
                        const res = await fetch(sheetUrl);
                        const data = await res.json();
                        if (Array.isArray(data.stores)) {
                          setStores(data.stores);
                          setSyncStatus('Đồng bộ thành công!');
                        } else {
                          setSyncStatus('Đã kết nối! Hãy đảm bảo JSON có trường "stores".');
                        }
                      } catch (err) {
                        setSyncStatus('Không thể kết nối URL. Hãy kiểm tra quyền truy cập Anyone.');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer"
                  >
                    Đồng bộ ngay
                  </button>
                </div>
                {syncStatus && <p className="text-xs text-amber-400 mt-2">{syncStatus}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}