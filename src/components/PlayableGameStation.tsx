import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, 
  Clock, 
  Sparkles, 
  Flame, 
  Trophy, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  User, 
  Key, 
  RefreshCw,
  Play,
  Pause,
  Bot,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Target,
  X,
  Hourglass,
  Activity,
  Settings,
  HelpCircle,
  Cpu,
  Crosshair
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WingoDraw, PredictionResult, ShweAccount, AlgorithmType, AllMethodsStats, AutoSwitchEvent, AutoMonitoringState, AiFormula, BettingEngineMode } from '../types/lottery';
import { playWinSound, playYouWinVoice, playTickSound, playMyanmarTargetProfitVoice, playRadarLockSound, playSniperStrikeSound, playStartBettingVoice } from '../utils/audio';
import { evaluateAllMethodsLossStreaks } from '../utils/sniper6LossEngine';
import { calculateAllPredictions } from '../utils/predictionEngine';

interface PlayableGameStationProps {
  currentPeriod: string;
  secondsLeft: number;
  history: WingoDraw[];
  prediction: PredictionResult | null;
  account: ShweAccount;
  selectedTypeId: number;
  onChangeTypeId: (id: number) => void;
  onRefreshSession: () => void;
  onApplyAiGuess?: () => void;
  onRefreshLogin?: (phone: string, pass: string) => Promise<{ success: boolean; message: string }>;
  aiAlgorithm?: AlgorithmType;
  onChangeAiAlgorithm?: (algo: AlgorithmType) => void;
  methodStats?: AllMethodsStats;
  isAutoSwitchEnabled?: boolean;
  onToggleAutoSwitch?: () => void;
  autoSwitchEvent?: AutoSwitchEvent | null;
  methodPredictions?: Record<AlgorithmType, PredictionResult> | null;
  onAutoMonitoringChange?: (state: AutoMonitoringState) => void;
  onAutoBetActiveChange?: (active: boolean) => void;
  activeFormula?: AiFormula | null;
  pendingFormula?: AiFormula | null;
  onFormulaConsumed?: () => void;
  onApplyFormula?: (formula: AiFormula) => void;
  bettingEngineMode?: BettingEngineMode;
  onSelectMode?: (mode: BettingEngineMode) => void;
  autoBetTrigger?: { id: number; mode: BettingEngineMode; threshold?: 4 | 5 | 6 } | null;
  sniperLockedAlgo?: AlgorithmType | null;
  onSniperLockedAlgoChange?: (algo: AlgorithmType | null) => void;
  sevenMethodLockedAlgo?: AlgorithmType | null;
  onSevenMethodLockedAlgoChange?: (algo: AlgorithmType | null) => void;
  soundEnabled?: boolean;
}

export interface ActiveBet {
  id: string;
  period: string;
  type: 'SIZE' | 'COLOR' | 'NUMBER';
  selection: string | number;
  amount: number;
  multiplier: number;
  total: number;
  status: 'PENDING' | 'WON' | 'LOST';
  payout?: number;
  isAuto: boolean;
}

// ShweLottery denomination normalizer
export function normalizeShweBetAmount(rawAmount: number, rawBetCount: number = 1): { amount: number; betCount: number; total: number } {
  const total = Math.max(10, Math.round((Number(rawAmount) || 10) * (Number(rawBetCount) || 1)));
  if (total >= 10000 && total % 10000 === 0) {
    return { amount: 10000, betCount: Math.max(1, Math.floor(total / 10000)), total };
  } else if (total >= 1000 && total % 1000 === 0) {
    return { amount: 1000, betCount: Math.max(1, Math.floor(total / 1000)), total };
  } else if (total >= 100 && total % 100 === 0) {
    return { amount: 100, betCount: Math.max(1, Math.floor(total / 100)), total };
  } else {
    const count = Math.max(1, Math.round(total / 10));
    return { amount: 10, betCount: count, total: count * 10 };
  }
}

// Streak detector for Wait Bot (Dragon Hunter)
export function getConsecutiveStreak(draws: WingoDraw[]): {
  count: number;
  size: 'BIG' | 'SMALL' | null;
  opposite: 'BIG' | 'SMALL' | null;
} {
  if (!draws || draws.length === 0) {
    return { count: 0, size: null, opposite: null };
  }
  const firstSize = draws[0].size;
  if (firstSize !== 'BIG' && firstSize !== 'SMALL') {
    return { count: 0, size: null, opposite: null };
  }
  let count = 0;
  for (const draw of draws) {
    if (draw.size === firstSize) {
      count++;
    } else {
      break;
    }
  }
  const opposite: 'BIG' | 'SMALL' = firstSize === 'BIG' ? 'SMALL' : 'BIG';
  return { count, size: firstSize, opposite };
}

// Duration formatting (HH:MM:SS or MM:SS)
function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export const PlayableGameStation: React.FC<PlayableGameStationProps> = ({
  currentPeriod,
  secondsLeft,
  history,
  prediction,
  account,
  selectedTypeId,
  onChangeTypeId,
  onRefreshSession,
  onRefreshLogin,
  aiAlgorithm = 'HMM',
  onChangeAiAlgorithm,
  methodStats,
  isAutoSwitchEnabled = true,
  onToggleAutoSwitch,
  autoSwitchEvent,
  methodPredictions,
  onAutoMonitoringChange,
  onAutoBetActiveChange,
  activeFormula,
  pendingFormula,
  onFormulaConsumed,
  onApplyFormula: externalApplyFormula,
  bettingEngineMode = 'METHODS_7_MODE',
  onSelectMode,
  autoBetTrigger,
  sniperLockedAlgo: externalSniperLockedAlgo,
  onSniperLockedAlgoChange,
  sevenMethodLockedAlgo: externalSevenMethodLockedAlgo,
  onSevenMethodLockedAlgoChange,
  soundEnabled = true,
}) => {
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // User Balance (synchronized with ShweLottery account)
  const initialBalance = parseFloat(account.amount?.replace(/,/g, '') || '1000') || 1000;
  const [userBalance, setUserBalance] = useState<number>(initialBalance);

  // Sync balance with account updates
  useEffect(() => {
    if (account.amount) {
      const parsed = parseFloat(account.amount.replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        setUserBalance(parsed);
      }
    }
  }, [account.amount]);

  // Fetch real live balance directly from backend gateway
  const fetchRealLiveBalance = async () => {
    try {
      const res = await fetch('/api/shwelottery/balance');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.realBalance === 'number') {
          setUserBalance(data.realBalance);
        }
      }
    } catch (err) {
      // Graceful retry on transient network glitch or dev server restart
      console.warn('Real balance sync retry:', err);
    }
  };

  useEffect(() => {
    fetchRealLiveBalance();
    const balInterval = setInterval(fetchRealLiveBalance, 6000);
    return () => clearInterval(balInterval);
  }, []);

  // ==========================================
  // AUTO BET ONLY STATE & MARTINGALE PROGRESSION
  // ==========================================
  const [isAutoBetActive, setIsAutoBetActive] = useState<boolean>(false);
  const [autoMultiplierMode, setAutoMultiplierMode] = useState<number>(2); // 2X, 3X, custom
  const [isCustomMultiplier, setIsCustomMultiplier] = useState<boolean>(false);
  const [customMultiplierInput, setCustomMultiplierInput] = useState<string>('2.5');

  const [autoBaseAmount, setAutoBaseAmount] = useState<number>(10);
  const [isCustomBaseAmount, setIsCustomBaseAmount] = useState<boolean>(false);
  const [customBaseAmountInput, setCustomBaseAmountInput] = useState<string>('10');

  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
  const [currentAutoStake, setCurrentAutoStake] = useState<number>(10);
  const [autoStrategy, setAutoStrategy] = useState<'AI_GUESS' | 'WAIT_BOT' | 'SNIPER_4LOSS' | 'SNIPER_5LOSS' | 'SNIPER_6LOSS'>('AI_GUESS');
  const [autoWins, setAutoWins] = useState<number>(0);
  const [autoLosses, setAutoLosses] = useState<number>(0);
  const [autoProfit, setAutoProfit] = useState<number>(0);
  const [autoFeedback, setAutoFeedback] = useState<string | null>(null);
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);

  // ==========================================
  // LIVE TIMER: AUTO BOT START TO TARGET PROFIT
  // ==========================================
  const [botStartTime, setBotStartTime] = useState<number | null>(null);
  const [botElapsedSeconds, setBotElapsedSeconds] = useState<number>(0);
  const [targetProfitDuration, setTargetProfitDuration] = useState<number | null>(null);

  // Wait Bot Streak Settings
  const [waitStreakThreshold, setWaitStreakThreshold] = useState<number>(5);
  const [waitBotStatus, setWaitBotStatus] = useState<'WAITING' | 'BETTING'>('WAITING');
  const [waitBotTarget, setWaitBotTarget] = useState<'BIG' | 'SMALL' | null>(null);

  // 6-Loss Sniper Wait & Strike Bot Settings
  const [sniperBotStatus, setSniperBotStatus] = useState<'WAITING' | 'STRIKING'>('WAITING');
  const [sniperLockedAlgo, setSniperLockedAlgo] = useState<AlgorithmType | null>(null);

  // 7-Method 1-Loss Highest Lose Rate Lock Bot Setting (Locks onto highest lose rate method on 1 loss until win)
  const [sevenMethodLockedAlgo, setSevenMethodLockedAlgo] = useState<AlgorithmType | null>(externalSevenMethodLockedAlgo || null);

  // Win Stop & Lose Stop Configuration
  const [winStopEnabled, setWinStopEnabled] = useState<boolean>(true);
  const [winStopAmount, setWinStopAmount] = useState<number>(1000);
  const [winStopInput, setWinStopInput] = useState<string>('1000');

  const [loseStopEnabled, setLoseStopEnabled] = useState<boolean>(true);
  const [loseStopAmount, setLoseStopAmount] = useState<number>(1000);
  const [loseStopInput, setLoseStopInput] = useState<string>('1000');

  const [stopReason, setStopReason] = useState<'WIN_STOP' | 'LOSE_STOP' | 'INSUFFICIENT_BALANCE' | null>(null);

  // Nan Stop Auto Bet (Custom Auto Restart after Win Profit, default 1m 35s = 95s)
  const [nonStopAutoBet, setNonStopAutoBet] = useState<boolean>(false);
  const [nonStopCountdown, setNonStopCountdown] = useState<number | null>(null);
  const [nonStopWaitSeconds, setNonStopWaitSeconds] = useState<number>(95);
  const [customWaitInput, setCustomWaitInput] = useState<string>('95');

  // Synchronize internal autoStrategy when bettingEngineMode changes from parent / outside
  useEffect(() => {
    if (bettingEngineMode === 'SNIPER_4LOSS_MODE') {
      setAutoStrategy('SNIPER_4LOSS');
    } else if (bettingEngineMode === 'SNIPER_5LOSS_MODE') {
      setAutoStrategy('SNIPER_5LOSS');
    } else if (bettingEngineMode === 'SNIPER_6LOSS_MODE') {
      setAutoStrategy('SNIPER_6LOSS');
    } else if (bettingEngineMode === 'METHODS_7_MODE') {
      if (autoStrategy === 'SNIPER_4LOSS' || autoStrategy === 'SNIPER_5LOSS' || autoStrategy === 'SNIPER_6LOSS') {
        setAutoStrategy('AI_GUESS');
      }
    }
  }, [bettingEngineMode]);

  // Synchronize external sniper locked algo if provided
  useEffect(() => {
    if (externalSniperLockedAlgo && (bettingEngineMode === 'SNIPER_4LOSS_MODE' || bettingEngineMode === 'SNIPER_5LOSS_MODE' || bettingEngineMode === 'SNIPER_6LOSS_MODE')) {
      setSniperLockedAlgo(externalSniperLockedAlgo);
      sniperLockedAlgoRef.current = externalSniperLockedAlgo;
      setSniperBotStatus('STRIKING');
      sniperBotStatusRef.current = 'STRIKING';
    }
  }, [externalSniperLockedAlgo, bettingEngineMode]);

  // Synchronize external 7-method locked algo
  useEffect(() => {
    if (externalSevenMethodLockedAlgo !== undefined) {
      setSevenMethodLockedAlgo(externalSevenMethodLockedAlgo);
      sevenMethodLockedAlgoRef.current = externalSevenMethodLockedAlgo;
    }
  }, [externalSevenMethodLockedAlgo]);

  // Handle external Auto Bet Start Trigger (from Sniper Panel, Floating Predator, or Alarm Banners)
  useEffect(() => {
    if (autoBetTrigger) {
      const mode = autoBetTrigger.mode;
      const threshold: 4 | 5 | 6 = autoBetTrigger.threshold || (mode === 'SNIPER_4LOSS_MODE' ? 4 : mode === 'SNIPER_6LOSS_MODE' ? 6 : 5);
      
      onSelectMode?.(mode);
      if (mode === 'SNIPER_4LOSS_MODE') {
        setAutoStrategy('SNIPER_4LOSS');
      } else if (mode === 'SNIPER_6LOSS_MODE') {
        setAutoStrategy('SNIPER_6LOSS');
      } else if (mode === 'SNIPER_5LOSS_MODE') {
        setAutoStrategy('SNIPER_5LOSS');
      }

      setStopReason(null);
      setNonStopCountdown(null);
      lastAutoBetPeriodRef.current = '';
      setIsAutoBetActive(true);

      const now = Date.now();
      setBotStartTime(now);
      botStartTimeRef.current = now;
      setBotElapsedSeconds(0);
      setTargetProfitDuration(null);

      // User requirement: Win ဖြစ်ခဲ့လျှင် နောက်ထပ် Method အရ ချက်ချင်းထပ်ပြန် bet ခဲ့ရလျှင်လည်း user သတ်မှတ်ပေးထားသော base bet အတိုင်း step 1(base stake)မှသာလျှင်ပြန် bet စေပါ
      consecutiveLossesRef.current = 0;
      setConsecutiveLosses(0);
      setCurrentAutoStake(autoBaseAmount);

      const evalResult = methodStats ? evaluateAllMethodsLossStreaks(methodStats, threshold) : null;
      const readyList = threshold === 4 ? evalResult?.readyMethods4 : threshold === 6 ? evalResult?.readyMethods6 : evalResult?.readyMethods5;

      if (readyList && readyList.length > 0) {
        const target = readyList[0];
        const multiNote = readyList.length > 1
          ? ` (Method ${readyList.length} မျိုးအနက် Lose Rate ${target.loseRate}% အများဆုံးဖြစ်သဖြင့် Main အဖြစ် Lock)`
          : ` (Lose Rate: ${target.loseRate}%)`;
        setSniperBotStatus('STRIKING');
        sniperBotStatusRef.current = 'STRIKING';
        setSniperLockedAlgo(target.algorithm);
        sniperLockedAlgoRef.current = target.algorithm;
        onSniperLockedAlgoChange?.(target.algorithm);
        if (threshold === 4) {
          try { playStartBettingVoice(); } catch {}
          setAutoFeedback(`🚨 [START BET ACTIVE] "HEY! NOW I AM START BETTING" Method [${target.label}] သည် ${target.consecutiveLosses} ကြိမ် ဆက်တိုက် ရှုံးထားပြီး${multiNote} Win မဖြစ်မချင်း Step 1 (K ${autoBaseAmount.toLocaleString()} MMK) ဖြင့် ဤ Method တမျိုးတည်း စတင်လောင်းပါပြီ!`);
        } else {
          try { playSniperStrikeSound(); } catch {}
          setAutoFeedback(`🎯 [${threshold}-LOSS SNIPER STRIKE ACTIVE] Method [${target.label}] သည် ${target.consecutiveLosses} ကြိမ် ဆက်တိုက် ရှုံးထားပြီး${multiNote} Win မဖြစ်မချင်း Step 1 (K ${autoBaseAmount.toLocaleString()} MMK) ဖြင့် ဤ Method တမျိုးတည်း စတင်လောင်းပါပြီ!`);
        }
      } else {
        setSniperBotStatus('WAITING');
        sniperBotStatusRef.current = 'WAITING';
        setSniperLockedAlgo(null);
        sniperLockedAlgoRef.current = null;
        onSniperLockedAlgoChange?.(null);
        const maxLoss = evalResult?.highestLossCount || 0;
        const maxAlgo = evalResult?.highestLossAlgo;
        setAutoFeedback(`🎯 [${threshold}-Loss Sniper စောင့်ဆိုင်းနေပါသည်] ${threshold} ကြိမ် ဆက်တိုက်ရှုံးသော Method ကို စောင့်နေပါသည်... (လက်ရှိ အများဆုံးရှုံး: [${maxAlgo || 'Scanning'}] ${maxLoss}/${threshold} ကြိမ်) • ${threshold} ကြိမ် ပြည့်ပါက Step 1 မူလငွေဖြင့် အလိုအလျောက် စတင်လောင်းပါမည်။`);
      }
    }
  }, [autoBetTrigger]);

  // Modal Dialog states for Settings & Risk Management
  const [isBetSettingsModalOpen, setIsBetSettingsModalOpen] = useState<boolean>(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Synchronous refs
  const nonStopAutoBetRef = useRef(nonStopAutoBet);
  const nonStopWaitSecondsRef = useRef(nonStopWaitSeconds);
  const winStopEnabledRef = useRef(winStopEnabled);
  const winStopAmountRef = useRef(winStopAmount);
  const loseStopEnabledRef = useRef(loseStopEnabled);
  const loseStopAmountRef = useRef(loseStopAmount);
  const autoBaseAmountRef = useRef(autoBaseAmount);
  const autoMultiplierModeRef = useRef(autoMultiplierMode);
  const consecutiveLossesRef = useRef<number>(consecutiveLosses);
  const autoStrategyRef = useRef(autoStrategy);
  const waitStreakThresholdRef = useRef(waitStreakThreshold);
  const waitBotStatusRef = useRef(waitBotStatus);
  const waitBotTargetRef = useRef(waitBotTarget);
  const sniperBotStatusRef = useRef<'WAITING' | 'STRIKING'>(sniperBotStatus);
  const sniperLockedAlgoRef = useRef<AlgorithmType | null>(sniperLockedAlgo);
  const sevenMethodLockedAlgoRef = useRef<AlgorithmType | null>(sevenMethodLockedAlgo);
  const botStartTimeRef = useRef(botStartTime);
  const lastAutoBetPeriodRef = useRef<string>('');
  const prevHistoryPeriodRef = useRef<string>('');

  const autoProfitRef = useRef(autoProfit);
  const prevIsAutoBetActiveRef = useRef<boolean>(isAutoBetActive);

  useEffect(() => {
    autoProfitRef.current = autoProfit;
  }, [autoProfit]);

  useEffect(() => {
    if (prevIsAutoBetActiveRef.current !== isAutoBetActive) {
      prevIsAutoBetActiveRef.current = isAutoBetActive;
      onAutoBetActiveChange?.(isAutoBetActive);
    }
  }, [isAutoBetActive, onAutoBetActiveChange]);

  useEffect(() => {
    winStopEnabledRef.current = winStopEnabled;
    winStopAmountRef.current = winStopAmount;
    loseStopEnabledRef.current = loseStopEnabled;
    loseStopAmountRef.current = loseStopAmount;
    autoBaseAmountRef.current = autoBaseAmount;
    autoMultiplierModeRef.current = autoMultiplierMode;
    consecutiveLossesRef.current = consecutiveLosses;
    autoStrategyRef.current = autoStrategy;
    waitStreakThresholdRef.current = waitStreakThreshold;
    waitBotStatusRef.current = waitBotStatus;
    waitBotTargetRef.current = waitBotTarget;
    sniperBotStatusRef.current = sniperBotStatus;
    sniperLockedAlgoRef.current = sniperLockedAlgo;
    sevenMethodLockedAlgoRef.current = sevenMethodLockedAlgo;
    botStartTimeRef.current = botStartTime;
  }, [winStopEnabled, winStopAmount, loseStopEnabled, loseStopAmount, autoBaseAmount, autoMultiplierMode, consecutiveLosses, autoStrategy, waitStreakThreshold, waitBotStatus, waitBotTarget, sniperBotStatus, sniperLockedAlgo, sevenMethodLockedAlgo, botStartTime]);

  useEffect(() => {
    nonStopAutoBetRef.current = nonStopAutoBet;
  }, [nonStopAutoBet]);

  useEffect(() => {
    nonStopWaitSecondsRef.current = nonStopWaitSeconds;
  }, [nonStopWaitSeconds]);

  // Synchronize state with parent
  useEffect(() => {
    onAutoMonitoringChange?.({
      isActive: isAutoBetActive,
      autoProfit,
      autoWins,
      autoLosses,
      currentAutoStake,
      autoBaseAmount,
      consecutiveLosses,
      autoMultiplierMode,
      winStopEnabled,
      winStopAmount,
      loseStopEnabled,
      loseStopAmount,
      stopReason,
      autoStrategy,
      startTime: botStartTime,
      elapsedSeconds: botElapsedSeconds,
      targetReachedDuration: targetProfitDuration,
      nonStopAutoBet,
      nonStopCountdown,
      nonStopWaitSeconds
    });
  }, [isAutoBetActive, autoProfit, autoWins, autoLosses, currentAutoStake, autoBaseAmount, consecutiveLosses, autoMultiplierMode, winStopEnabled, winStopAmount, loseStopEnabled, loseStopAmount, stopReason, autoStrategy, botStartTime, botElapsedSeconds, targetProfitDuration, nonStopAutoBet, nonStopCountdown, nonStopWaitSeconds]);

  // Live timer tick for Auto Bot
  useEffect(() => {
    let timer: any = null;
    if (isAutoBetActive && botStartTime && stopReason !== 'WIN_STOP') {
      timer = setInterval(() => {
        setBotElapsedSeconds(Math.floor((Date.now() - botStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoBetActive, botStartTime, stopReason]);

  // Nan Stop Auto Bet countdown tick: uses custom user-configured wait time (default 95 seconds)
  useEffect(() => {
    let timer: any = null;
    if (nonStopAutoBet && stopReason === 'WIN_STOP' && nonStopCountdown !== null && nonStopCountdown > 0) {
      timer = setInterval(() => {
        setNonStopCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => {
              handleRestartAutoBot();
              const waitSec = nonStopWaitSecondsRef.current || 95;
              const m = Math.floor(waitSec / 60);
              const s = waitSec % 60;
              const formatted = m > 0 ? `${m} မိနစ် ${s > 0 ? `${s} စက္ကန့်` : ''}` : `${s} စက္ကန့်`;
              setAutoFeedback(`⚡ [Nan Stop Auto Bet] သတ်မှတ်စောင့်ဆိုင်းချိန် ${formatted} (${waitSec}s) ပြည့်ပါသဖြင့် Auto Bet စနစ် အလိုအလျောက် ပြန်လည်စတင်လိုက်ပါပြီ!`);
            }, 0);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [nonStopAutoBet, stopReason, nonStopCountdown]);

  // Recalculate current auto stake when base amount or multiplier changes
  useEffect(() => {
    if (consecutiveLosses === 0) {
      setCurrentAutoStake(autoBaseAmount);
    } else {
      const nextStake = Math.round(autoBaseAmount * Math.pow(autoMultiplierMode, consecutiveLosses));
      setCurrentAutoStake(nextStake);
    }
  }, [autoBaseAmount, autoMultiplierMode, consecutiveLosses]);

  // Reset Session
  const handleResetAutoSession = () => {
    setAutoWins(0);
    setAutoLosses(0);
    setAutoProfit(0);
    consecutiveLossesRef.current = 0;
    setConsecutiveLosses(0);
    setCurrentAutoStake(autoBaseAmount);
    setStopReason(null);
    setWaitBotStatus('WAITING');
    waitBotStatusRef.current = 'WAITING';
    setWaitBotTarget(null);
    waitBotTargetRef.current = null;
    setSniperBotStatus('WAITING');
    sniperBotStatusRef.current = 'WAITING';
    setSniperLockedAlgo(null);
    sniperLockedAlgoRef.current = null;
    setSevenMethodLockedAlgo(null);
    sevenMethodLockedAlgoRef.current = null;
    onSevenMethodLockedAlgoChange?.(null);
    setBotStartTime(null);
    setBotElapsedSeconds(0);
    setTargetProfitDuration(null);
    setNonStopCountdown(null);
    setAutoFeedback('Auto Bot စာရင်းနှင့် Timer ကို အသစ်ပြန်လည်စတင်လိုက်ပါပြီ။');
  };

  // Restart Auto Bot
  const handleRestartAutoBot = () => {
    setAutoProfit(0);
    consecutiveLossesRef.current = 0;
    setConsecutiveLosses(0);
    setCurrentAutoStake(autoBaseAmount);
    setStopReason(null);
    setNonStopCountdown(null);
    setWaitBotStatus('WAITING');
    waitBotStatusRef.current = 'WAITING';
    setWaitBotTarget(null);
    waitBotTargetRef.current = null;
    setSniperBotStatus('WAITING');
    sniperBotStatusRef.current = 'WAITING';
    setSniperLockedAlgo(null);
    sniperLockedAlgoRef.current = null;
    setSevenMethodLockedAlgo(null);
    sevenMethodLockedAlgoRef.current = null;
    onSevenMethodLockedAlgoChange?.(null);
    
    const now = Date.now();
    setBotStartTime(now);
    botStartTimeRef.current = now;
    setBotElapsedSeconds(0);
    setTargetProfitDuration(null);
    setIsAutoBetActive(true);

    if (autoStrategyRef.current === 'WAIT_BOT') {
      setAutoFeedback(`🔄 Wait Bot စတင်ပါပြီ! ကြီး/ငယ် ${waitStreakThresholdRef.current} ကြိမ် ပြည့်လျှင် ဆန့်ကျင်ဘက်ကို win ဖြစ်သည်အထိ စတင်လောင်းပါမည်။`);
    } else if (
      autoStrategyRef.current === 'SNIPER_4LOSS' ||
      bettingEngineMode === 'SNIPER_4LOSS_MODE'
    ) {
      setAutoFeedback(`🎯 [4-Loss Sniper Bot စတင်ပါပြီ!] Method ၇ မျိုးထဲမှ ၄ ကြိမ်ဆက်တိုက်ရှုံးသော Method ကို စတင်စောင့်ဆိုင်းနေပါသည် (၄ ကြိမ်ရှုံးပါက "HEY! NOW I AM START BETTING" အချက်ပြကာ စတင်လောင်းပါမည်)...`);
    } else if (
      autoStrategyRef.current === 'SNIPER_5LOSS' ||
      bettingEngineMode === 'SNIPER_5LOSS_MODE'
    ) {
      setAutoFeedback(`🎯 [5-Loss Sniper Bot စတင်ပါပြီ!] Method ၇ မျိုးထဲမှ ၅ ကြိမ်ဆက်တိုက်ရှုံးသော Method ကို စတင်စောင့်ဆိုင်းနေပါသည် (၃ ကြိမ်ရှုံးလျှင် "I found 3 lose method" အသံမြည်ပါမည်)...`);
    } else if (
      autoStrategyRef.current === 'SNIPER_6LOSS' ||
      bettingEngineMode === 'SNIPER_6LOSS_MODE'
    ) {
      setAutoFeedback(`🎯 [6-Loss Sniper Bot စတင်ပါပြီ!] Method ၇ မျိုးထဲမှ ၆ ကြိမ်ဆက်တိုက်ရှုံးသော Method ကို စတင်စောင့်ဆိုင်းနေပါသည်...`);
    } else {
      setAutoFeedback(`🔄 Auto Bot အသစ်စတင်ပါပြီ! စတင်လောင်းကြေး K ${autoBaseAmount.toLocaleString()} MMK (${autoMultiplierMode}× ဆတိုး) ဖြင့် Timer စတင်ပါပြီ။`);
    }
  };

  // Function to apply AI Formula and start Auto Bet
  const applyFormulaToAutoBet = (targetFormula: AiFormula) => {
    setAutoBaseAmount(targetFormula.recommendedBaseStake);
    setAutoMultiplierMode(targetFormula.recommendedMultiplier);
    setAutoStrategy(targetFormula.recommendedStrategy);
    setWinStopAmount(targetFormula.recommendedWinStop);
    setWinStopInput(String(targetFormula.recommendedWinStop));
    if (targetFormula.winStopEnabled !== undefined) {
      setWinStopEnabled(targetFormula.winStopEnabled);
    }
    setLoseStopAmount(targetFormula.recommendedLoseStop);
    setLoseStopInput(String(targetFormula.recommendedLoseStop));
    if (targetFormula.loseStopEnabled !== undefined) {
      setLoseStopEnabled(targetFormula.loseStopEnabled);
    }
    onChangeAiAlgorithm?.(targetFormula.recommendedMethod);
    onSelectMode?.('FORMULA_MODE');

    // Reset loss counters and start auto bot
    consecutiveLossesRef.current = 0;
    setConsecutiveLosses(0);
    setCurrentAutoStake(targetFormula.recommendedBaseStake);
    setStopReason(null);
    setNonStopCountdown(null);

    const now = Date.now();
    setBotStartTime(now);
    botStartTimeRef.current = now;
    setBotElapsedSeconds(0);
    setTargetProfitDuration(null);
    setIsAutoBetActive(true);

    try {
      playRadarLockSound();
    } catch {}

    const winTxt = targetFormula.winStopEnabled === false ? 'OFF' : `+K ${targetFormula.recommendedWinStop.toLocaleString()}`;
    const loseTxt = targetFormula.loseStopEnabled === false ? 'OFF' : `-K ${targetFormula.recommendedLoseStop.toLocaleString()}`;

    setAutoFeedback(
      `🎮 [10-MIN FORMULA အတိုင်း ကစားခြင်း] ${targetFormula.burmeseTitle} စနစ်ဖြင့် ${targetFormula.recommendedMethod} (စတင်ကြေး: K ${targetFormula.recommendedBaseStake.toLocaleString()} • ${targetFormula.recommendedMultiplier}× ဆတိုး • Win Stop: ${winTxt} • Lose Stop: ${loseTxt}) Auto Bot စတင်လောင်းပါပြီ!`
    );
  };

  // Listen for pendingFormula passed from parent
  useEffect(() => {
    if (pendingFormula) {
      applyFormulaToAutoBet(pendingFormula);
      onFormulaConsumed?.();
    }
  }, [pendingFormula]);

  // Master Toggle Button for Auto Bet
  const handleToggleAutoBet = () => {
    const nextState = !isAutoBetActive;
    if (nextState) {
      if (
        stopReason === 'LOSE_STOP' || 
        stopReason === 'WIN_STOP' ||
        (winStopEnabled && winStopAmount > 0 && autoProfit >= winStopAmount) ||
        (loseStopEnabled && loseStopAmount > 0 && autoProfit <= -loseStopAmount)
      ) {
        handleRestartAutoBot();
        return;
      }

      setStopReason(null);
      setNonStopCountdown(null);
      lastAutoBetPeriodRef.current = '';
      setIsAutoBetActive(true);

      const now = Date.now();
      setBotStartTime(now);
      botStartTimeRef.current = now;
      setBotElapsedSeconds(0);
      setTargetProfitDuration(null);

      // User requirement: Win ဖြစ်ခဲ့လျှင် နောက်ထပ် Method အရ ချက်ချင်းထပ်ပြန် bet ခဲ့ရလျှင်လည်း user သတ်မှတ်ပေးထားသော base bet အတိုင်း step 1(base stake)မှသာလျှင်ပြန် bet စေပါ
      consecutiveLossesRef.current = 0;
      setConsecutiveLosses(0);
      setCurrentAutoStake(autoBaseAmount);

      const isSniperActive = 
        bettingEngineMode === 'SNIPER_4LOSS_MODE' || 
        bettingEngineMode === 'SNIPER_5LOSS_MODE' || 
        bettingEngineMode === 'SNIPER_6LOSS_MODE' || 
        autoStrategy === 'SNIPER_4LOSS' || 
        autoStrategy === 'SNIPER_6LOSS' || 
        autoStrategy === 'SNIPER_5LOSS';

      if (isSniperActive) {
        const threshold: 4 | 5 | 6 = (bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS')
          ? 4
          : (bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS')
          ? 6
          : 5;
        const evalResult = methodStats ? evaluateAllMethodsLossStreaks(methodStats, threshold) : null;
        const readyList = threshold === 4 ? evalResult?.readyMethods4 : threshold === 6 ? evalResult?.readyMethods6 : evalResult?.readyMethods5;

        if (readyList && readyList.length > 0) {
          const target = readyList[0];
          const multiNote = readyList.length > 1
            ? ` (Method ${readyList.length} မျိုးအနက် Lose Rate ${target.loseRate}% အများဆုံးဖြစ်သဖြင့် Main အဖြစ် Lock)`
            : ` (Lose Rate: ${target.loseRate}%)`;
          setSniperBotStatus('STRIKING');
          sniperBotStatusRef.current = 'STRIKING';
          setSniperLockedAlgo(target.algorithm);
          sniperLockedAlgoRef.current = target.algorithm;
          onSniperLockedAlgoChange?.(target.algorithm);
          if (threshold === 4) {
            try { playStartBettingVoice(); } catch {}
            setAutoFeedback(`🚨 [START BET ACTIVE] "HEY! NOW I AM START BETTING" Method [${target.label}] သည် ${target.consecutiveLosses} ကြိမ် ဆက်တိုက် ရှုံးထားပြီး${multiNote} Win မဖြစ်မချင်း Step 1 (K ${autoBaseAmount.toLocaleString()} MMK) ဖြင့် ဤ Method တမျိုးတည်း စတင်လောင်းပါပြီ!`);
          } else {
            try { playSniperStrikeSound(); } catch {}
            setAutoFeedback(`🎯 [${threshold}-LOSS SNIPER STRIKE ACTIVE] Method [${target.label}] သည် ${target.consecutiveLosses} ကြိမ် ဆက်တိုက် ရှုံးထားပြီး${multiNote} Win မဖြစ်မချင်း Step 1 (K ${autoBaseAmount.toLocaleString()} MMK) ဖြင့် ဤ Method တမျိုးတည်း စတင်လောင်းပါပြီ!`);
          }
        } else {
          setSniperBotStatus('WAITING');
          sniperBotStatusRef.current = 'WAITING';
          setSniperLockedAlgo(null);
          sniperLockedAlgoRef.current = null;
          onSniperLockedAlgoChange?.(null);
          const maxLoss = evalResult?.highestLossCount || 0;
          const maxAlgo = evalResult?.highestLossAlgo;
          setAutoFeedback(`🎯 [${threshold}-Loss Sniper စောင့်ဆိုင်းနေပါသည်] ${threshold} ကြိမ် ဆက်တိုက်ရှုံးသော Method ကို စောင့်နေပါသည်... (လက်ရှိ အများဆုံးရှုံး: [${maxAlgo || 'Scanning'}] ${maxLoss}/${threshold} ကြိမ်) • ${threshold} ကြိမ် ပြည့်ပါက Step 1 မူလငွေဖြင့် အလိုအလျောက် စတင်လောင်းပါမည်။`);
        }
      } else {
        setAutoFeedback(`⚡ Auto Bet စတင်ဖွင့်လှစ်လိုက်ပါပြီ! စတင်ငွေ K ${autoBaseAmount.toLocaleString()} MMK၊ ${autoMultiplierMode}× ဆတိုး၊ Target Profit Timer စတင်ရေတွက်ပါပြီ။`);
      }
    } else {
      setIsAutoBetActive(false);
      setNonStopCountdown(null);
      setSevenMethodLockedAlgo(null);
      sevenMethodLockedAlgoRef.current = null;
      onSevenMethodLockedAlgoChange?.(null);
      setAutoFeedback('Auto Bet ကို ခေတ္တရပ်တန့်လိုက်ပါပြီ။');
    }
  };

  // ==========================================
  // AUTO BET ONLY AUTOMATIC REAL EXECUTION
  // ==========================================
  useEffect(() => {
    if (!isAutoBetActive) return;

    if (winStopEnabled && winStopAmount > 0 && autoProfit >= winStopAmount) {
      setIsAutoBetActive(false);
      setStopReason('WIN_STOP');
      const finalSecs = botStartTime ? Math.floor((Date.now() - botStartTime) / 1000) : botElapsedSeconds;
      setTargetProfitDuration(finalSecs);
      setAutoFeedback(`🏆 [Win Stop အောင်မြင်ပါပြီ!] သတ်မှတ်ထားသော အနိုင်ငွေ (+K ${autoProfit.toLocaleString()} MMK) ပြည့်မီသဖြင့် Auto Bet ကို ရပ်တန့်လိုက်ပါပြီ! ကြာချိန်: ${formatDuration(finalSecs)}`);
      return;
    }

    if (loseStopEnabled && loseStopAmount > 0 && autoProfit <= -loseStopAmount) {
      setIsAutoBetActive(false);
      setStopReason('LOSE_STOP');
      setAutoFeedback(`🛑 [Lose Stop သတ်မှတ်ချက်!] သတ်မှတ်ထားသော အရှုံးငွေ (-K ${Math.abs(autoProfit).toLocaleString()} MMK) သို့ ရောက်ရှိသဖြင့် Auto Bet ကို ရပ်တန့်လိုက်ပါပြီ!`);
      return;
    }

    if (secondsLeft > 5 && currentPeriod && currentPeriod !== lastAutoBetPeriodRef.current) {
      const hasImmediatePendingAutoBet = activeBets.some(
        (b) => b.isAuto && b.status === 'PENDING' && b.period !== currentPeriod
      );
      if (hasImmediatePendingAutoBet && secondsLeft > 8) {
        return;
      }

      let currentLosses = consecutiveLossesRef.current;
      let requiredStake = currentLosses === 0
        ? autoBaseAmountRef.current
        : Math.round(autoBaseAmountRef.current * Math.pow(autoMultiplierModeRef.current, currentLosses));

      if (userBalance < requiredStake) {
        setIsAutoBetActive(false);
        setStopReason('INSUFFICIENT_BALANCE');
        setAutoFeedback(`လက်ကျန်ငွေ မလုံလောက်တော့ပါ (လက်ကျန်: K ${userBalance.toLocaleString()} MMK၊ လိုအပ်ချက်: K ${requiredStake.toLocaleString()} MMK)။ Auto Bet ရပ်တန့်ပါပြီ။`);
        return;
      }

      let betType: 'SIZE' = 'SIZE';
      let betChoice: 'BIG' | 'SMALL' = prediction?.size || 'BIG';

      const isSniperActive = 
        bettingEngineMode === 'SNIPER_4LOSS_MODE' || 
        bettingEngineMode === 'SNIPER_5LOSS_MODE' || 
        bettingEngineMode === 'SNIPER_6LOSS_MODE' || 
        autoStrategy === 'SNIPER_4LOSS' || 
        autoStrategy === 'SNIPER_6LOSS' || 
        autoStrategy === 'SNIPER_5LOSS';

      if (autoStrategy === 'AI_GUESS' && !isSniperActive) {
        if (sevenMethodLockedAlgoRef.current && methodPredictions && methodPredictions[sevenMethodLockedAlgoRef.current]) {
          betChoice = methodPredictions[sevenMethodLockedAlgoRef.current].size;
        } else {
          betChoice = prediction?.size || 'BIG';
        }
      } else if (autoStrategy === 'WAIT_BOT' && !isSniperActive) {
        const streak = getConsecutiveStreak(history);

        if (waitBotStatusRef.current === 'WAITING') {
          if (streak.count >= waitStreakThresholdRef.current && streak.opposite) {
            const target = streak.opposite;
            setWaitBotStatus('BETTING');
            waitBotStatusRef.current = 'BETTING';
            setWaitBotTarget(target);
            waitBotTargetRef.current = target;
            betChoice = target;
            setAutoFeedback(`🔥 [Wait Bot စတင်လောင်းပါပြီ!] ${streak.size === 'BIG' ? 'ကြီး' : 'ငယ်'} ${streak.count} ကြိမ် ဆက်တိုက်ထွက်ပြီးဖြစ်၍ ဆန့်ကျင်ဘက် [${target === 'BIG' ? 'ကြီး (BIG)' : 'ငယ် (SMALL)'}] ကို စတင်လောင်းပါမည်!`);
          } else {
            setAutoFeedback(`⏳ [Wait Bot စောင့်ဆိုင်းနေသည်] လက်ရှိ streak: ${streak.size === 'BIG' ? 'ကြီး' : 'ငယ်'} (${streak.count}/${waitStreakThresholdRef.current} ကြိမ်) • ${waitStreakThresholdRef.current} ကြိမ် ပြည့်လျှင် ဆန့်ကျင်ဘက်ကို win ဖြစ်သည်အထိ စတင်လောင်းပါမည်။`);
            return;
          }
        } else {
          betChoice = waitBotTargetRef.current || streak.opposite || 'BIG';
        }
      } else if (isSniperActive) {
        const targetThreshold: 4 | 5 | 6 = (bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS')
          ? 4
          : (bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS')
          ? 6
          : 5;
        // 4-LOSS, 5-LOSS OR 6-LOSS SNIPER WAIT & STRIKE STRATEGY
        if (sniperBotStatusRef.current === 'STRIKING' && sniperLockedAlgoRef.current) {
          // Already locked onto a method: continue betting ONLY with this method until win!
          const lockedAlgo = sniperLockedAlgoRef.current;
          const lockedPred = methodPredictions?.[lockedAlgo] || (history.length > 0 ? calculateAllPredictions(history, currentPeriod)[lockedAlgo] : null);
          betChoice = lockedPred?.size || prediction?.size || 'BIG';
          setAutoFeedback(
            `🎯 [${targetThreshold}-Loss Sniper Strike လောင်းနေပါသည်] ${targetThreshold} ကြိမ်ရှုံးထားသော [${lockedAlgo}] အား Win ဖြစ်သည်အထိ K ${requiredStake.toLocaleString()} MMK [${betChoice === 'BIG' ? 'ကြီး (BIG)' : 'ငယ် (SMALL)'}] ဆက်တိုက်လောင်းနေပါသည်! (Strike အဆင့် ${currentLosses + 1})`
          );
        } else {
          // In WAITING status: scan all 7 methods to find if any reached target consecutive losses
          const evalResult = methodStats ? evaluateAllMethodsLossStreaks(methodStats, targetThreshold) : null;
          const readyList = targetThreshold === 4 ? evalResult?.readyMethods4 : targetThreshold === 6 ? evalResult?.readyMethods6 : evalResult?.readyMethods5;

          if (readyList && readyList.length > 0) {
            // Target found! Lock onto the highest lose rate method!
            const target = readyList[0];
            const multiNote = readyList.length > 1
              ? ` (Method ${readyList.length} မျိုးအနက် Lose Rate ${target.loseRate}% အများဆုံးဖြစ်သဖြင့် Main အဖြစ် Lock)`
              : ` (Lose Rate: ${target.loseRate}%)`;

            setSniperBotStatus('STRIKING');
            sniperBotStatusRef.current = 'STRIKING';
            setSniperLockedAlgo(target.algorithm);
            sniperLockedAlgoRef.current = target.algorithm;
            onSniperLockedAlgoChange?.(target.algorithm);

            // User requirement: Win ဖြစ်ခဲ့လျှင် နောက်ထပ် Method အရ ချက်ချင်းထပ်ပြန် bet ခဲ့ရလျှင်လည်း user သတ်မှတ်ပေးထားသော base bet အတိုင်း step 1(base stake)မှသာလျှင်ပြန် bet စေပါ
            consecutiveLossesRef.current = 0;
            setConsecutiveLosses(0);
            currentLosses = 0;
            requiredStake = autoBaseAmountRef.current;
            setCurrentAutoStake(autoBaseAmountRef.current);

            const lockedPred = methodPredictions?.[target.algorithm] || (history.length > 0 ? calculateAllPredictions(history, currentPeriod)[target.algorithm] : null);
            betChoice = lockedPred?.size || prediction?.size || 'BIG';

            if (targetThreshold === 4) {
              try {
                playStartBettingVoice();
              } catch {}
              setAutoFeedback(
                `🚨 [START BET ACTIVE] "HEY! NOW I AM START BETTING" Method [${target.label}] သည် ${target.consecutiveLosses} ကြိမ် ဆက်တိုက် ရှုံးထားပြီး${multiNote} Win ဖြစ်သည်အထိ Step 1 (K ${requiredStake.toLocaleString()} MMK) ဖြင့် ဤ Method တမျိုးတည်း စတင်လောင်းပါပြီ!`
              );
            } else {
              try {
                playSniperStrikeSound();
              } catch {}
              setAutoFeedback(
                `🎯 [${targetThreshold}-LOSS SNIPER LOCK!] Method [${target.label}] သည် ${target.consecutiveLosses} ကြိမ် ဆက်တိုက် ရှုံးထားပြီး${multiNote} Win ဖြစ်သည်အထိ Step 1 (K ${requiredStake.toLocaleString()} MMK) ဖြင့် ဤ Method တမျိုးတည်း စတင်လောင်းပါပြီ!`
              );
            }
          } else {
            // No method has reached target losses yet: wait quietly!
            const maxLoss = evalResult?.highestLossCount || 0;
            const maxAlgo = evalResult?.highestLossAlgo;
            setAutoFeedback(
              `🎯 [${targetThreshold}-Loss Sniper စောင့်ဆိုင်းနေပါသည်] ${targetThreshold} ကြိမ် ဆက်တိုက်ရှုံးသော Method ကို စောင့်နေပါသည်... (လက်ရှိ အများဆုံးရှုံး: [${maxAlgo || 'Scanning'}] ${maxLoss}/${targetThreshold} ကြိမ်) • ${targetThreshold} ကြိမ် ပြည့်ပါက Step 1 မူလငွေဖြင့် အလိုအလျောက် စတင်လောင်းပါမည်။`
            );
            return; // DO NOT BET! Wait for target consecutive losses!
          }
        }
      }

      lastAutoBetPeriodRef.current = currentPeriod;
      const normalized = normalizeShweBetAmount(requiredStake, 1);
      const effectiveStake = normalized.total;

      setUserBalance((prev) => Math.max(0, prev - effectiveStake));

      const newAutoBet: ActiveBet = {
        id: `AUTO-${Date.now().toString().slice(-6)}`,
        period: currentPeriod,
        type: betType,
        selection: betChoice,
        amount: normalized.amount,
        multiplier: normalized.betCount,
        total: effectiveStake,
        status: 'PENDING',
        isAuto: true,
      };

      setActiveBets((prev) => [newAutoBet, ...prev.slice(0, 19)]);
      setAutoFeedback(`⚡ [Auto Bet #${currentPeriod.slice(-5)}] ShweLottery game website သို့ K ${effectiveStake.toLocaleString()} MMK (${normalized.amount} × ${normalized.betCount}) [${currentLosses > 0 ? `${autoMultiplierModeRef.current}× အဆင့် ${currentLosses + 1}` : 'မူလစတင်ငွေ'}] လောင်းနေပါသည်...`);
      playTickSound();

      // EXECUTE REAL BET ON SHWELOTTERY OFFICIAL SERVER
      fetch('/api/shwelottery/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeId: selectedTypeId,
          issueNumber: currentPeriod,
          type: betType,
          selection: betChoice,
          amount: normalized.amount,
          multiplier: normalized.betCount
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.realBalance === 'number') {
            setUserBalance(data.realBalance);
          }
          if (data.success) {
            setAutoFeedback(`✅ [Auto Bet #${currentPeriod.slice(-5)}] ShweLottery တွင် K ${effectiveStake.toLocaleString()} MMK [${betChoice === 'BIG' ? 'ကြီး (BIG)' : 'ငယ် (SMALL)'}] အမှန်တကယ် လောင်းပြီးပါပြီ! (လက်ကျန်: K ${data.realBalance?.toLocaleString()} MMK)`);
          } else {
            if (data.msgCode === 1003 || data.msg?.includes('recharge')) {
              setAutoFeedback(`⚡ [Auto Bet #${currentPeriod.slice(-5)}] Station Mode ဖြင့် K ${effectiveStake.toLocaleString()} MMK [${betChoice === 'BIG' ? 'ကြီး' : 'ငယ်'}] လောင်းပြီးပါပြီ (ဝဘ်ဆိုက်အကောင့် recharge လိုအပ်ပါသည်)`);
            } else {
              setAutoFeedback(`⚡ [Auto Bet #${currentPeriod.slice(-5)}] Website: ${data.msg || 'ဂိမ်းဝဘ်ဆိုက်မှ အတည်ပြုချက်'}`);
            }
          }
        })
        .catch((err) => {
          console.error('Auto bet network error:', err);
        });
    }
  }, [
    isAutoBetActive,
    secondsLeft,
    currentPeriod,
    autoBaseAmount,
    autoMultiplierMode,
    consecutiveLosses,
    userBalance,
    autoStrategy,
    prediction,
    selectedTypeId,
    winStopEnabled,
    winStopAmount,
    loseStopEnabled,
    loseStopAmount,
    autoProfit,
    activeBets,
    history,
    waitStreakThreshold,
    waitBotStatus,
    waitBotTarget,
    sniperBotStatus,
    sniperLockedAlgo,
    bettingEngineMode,
    methodStats,
    methodPredictions,
    botStartTime,
    botElapsedSeconds
  ]);

  // ==========================================
  // DRAW EVALUATION ENGINE
  // ==========================================
  useEffect(() => {
    const latestDraw = history[0];
    if (latestDraw && latestDraw.period !== prevHistoryPeriodRef.current) {
      if (prevHistoryPeriodRef.current !== '') {
        fetchRealLiveBalance();

        setActiveBets((prev) => {
          const pendingBets = prev.filter(
            (b) => b.status === 'PENDING' && history.some((d) => d.period === b.period)
          );
          if (pendingBets.length === 0) return prev;

          // Schedule state updates & parent notifications outside the pure updater function
          queueMicrotask(() => {
            let runningProfit = autoProfitRef.current;

            for (const bet of pendingBets) {
              const matchedDraw = history.find((d) => d.period === bet.period);
              if (!matchedDraw) continue;

              const won = bet.selection === matchedDraw.size;
              const payoutRate = 1.98;

              if (won) {
                const payout = Math.round(bet.total * payoutRate);
                const netGain = payout - bet.total;
                runningProfit += netGain;

                if (soundEnabledRef.current) {
                  playYouWinVoice();
                }
                setUserBalance((b) => b + payout);

                consecutiveLossesRef.current = 0;
                setConsecutiveLosses(0);
                const resetStake = autoBaseAmountRef.current;
                setCurrentAutoStake(resetStake);
                setAutoWins((w) => w + 1);

                const wasSevenMethodLocked = sevenMethodLockedAlgoRef.current !== null;
                const prevSevenMethodLocked = sevenMethodLockedAlgoRef.current;
                if (sevenMethodLockedAlgoRef.current) {
                  sevenMethodLockedAlgoRef.current = null;
                  setSevenMethodLockedAlgo(null);
                  onSevenMethodLockedAlgoChange?.(null);
                }

                if (autoStrategyRef.current === 'WAIT_BOT') {
                  setWaitBotStatus('WAITING');
                  waitBotStatusRef.current = 'WAITING';
                  setWaitBotTarget(null);
                  waitBotTargetRef.current = null;
                } else if (
                  autoStrategyRef.current === 'SNIPER_4LOSS' ||
                  autoStrategyRef.current === 'SNIPER_5LOSS' ||
                  autoStrategyRef.current === 'SNIPER_6LOSS' ||
                  bettingEngineMode === 'SNIPER_4LOSS_MODE' ||
                  bettingEngineMode === 'SNIPER_5LOSS_MODE' ||
                  bettingEngineMode === 'SNIPER_6LOSS_MODE'
                ) {
                  // User requirement: Win ဖြစ်ရင် bet တာရပ်ပြီး နောက်တကြိမ် Bet ဖို့ 4 ကြိမ် / 5 ကြိမ် / 6 ကြိမ်ဆက်တိုက်ရှုံးတဲ့ METHOD ကိုပြန် wait ပြီး bet မယ်
                  setSniperBotStatus('WAITING');
                  sniperBotStatusRef.current = 'WAITING';
                  setSniperLockedAlgo(null);
                  sniperLockedAlgoRef.current = null;
                  onSniperLockedAlgoChange?.(null);
                  // User requirement: Win ဖြစ်ခဲ့လျှင် နောက်ထပ် Method အရ ချက်ချင်းထပ်ပြန် bet ခဲ့ရလျှင်လည်း user သတ်မှတ်ပေးထားသော base bet အတိုင်း step 1(base stake)မှသာလျှင်ပြန် bet စေပါ
                  consecutiveLossesRef.current = 0;
                  setConsecutiveLosses(0);
                  setCurrentAutoStake(autoBaseAmountRef.current);
                }

                // TARGET PROFIT REACHED CHECK
                if (winStopEnabledRef.current && winStopAmountRef.current > 0 && runningProfit >= winStopAmountRef.current) {
                  setIsAutoBetActive(false);
                  setStopReason('WIN_STOP');

                  const durationSecs = botStartTimeRef.current 
                    ? Math.floor((Date.now() - botStartTimeRef.current) / 1000)
                    : botElapsedSeconds;
                  setTargetProfitDuration(durationSecs);
                  setBotElapsedSeconds(durationSecs);

                  if (soundEnabledRef.current) {
                    playMyanmarTargetProfitVoice();
                  }

                  if (nonStopAutoBetRef.current) {
                    const waitTime = nonStopWaitSecondsRef.current || 95;
                    setNonStopCountdown(waitTime);
                    const m = Math.floor(waitTime / 60);
                    const s = waitTime % 60;
                    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    const waitDesc = m > 0 ? `${m} မိနစ် ${s > 0 ? `${s} စက္ကန့်` : ''}` : `${s} စက္ကန့်`;
                    setAutoFeedback(`🏆 [TARGET PROFIT ပြည့်မီပါပြီ!] သတ်မှတ်အနိုင်ငွေ (+K ${runningProfit.toLocaleString()} MMK) ရရှိပါပြီ! ကြာချိန်: ${formatDuration(durationSecs)} • Nan Stop Auto Bet ဖွင့်ထားသဖြင့် ${waitDesc} (${waitTime}s) အကြာတွင် အလိုအလျောက် ပြန်လည်စတင်ပါမည် (${timeStr})...`);
                  } else {
                    setAutoFeedback(`🏆 [TARGET PROFIT ပြည့်မီပါပြီ!] သတ်မှတ်အနိုင်ငွေ (+K ${runningProfit.toLocaleString()} MMK / Target: K ${winStopAmountRef.current.toLocaleString()}) ရရှိပါပြီ! ကြာချိန်: ${formatDuration(durationSecs)}`);
                  }
                  confetti({
                    particleCount: 140,
                    spread: 90,
                    origin: { y: 0.5 }
                  });
                } else {
                  if (autoStrategyRef.current === 'WAIT_BOT') {
                    setAutoFeedback(`🎉 [Wait Bot Win!] ဆန့်ကျင်ဘက် [${bet.selection === 'BIG' ? 'ကြီး' : 'ငယ်'}] နိုင်ပါသဖြင့် (+K ${netGain.toLocaleString()} MMK) မူလစတင်ငွေ K ${resetStake.toLocaleString()} MMK သို့ ပြန်သတ်မှတ်ကာ streak ပြန်လည်စောင့်ဆိုင်းပါမည်!`);
                  } else if (
                    autoStrategyRef.current === 'SNIPER_4LOSS' ||
                    autoStrategyRef.current === 'SNIPER_5LOSS' ||
                    autoStrategyRef.current === 'SNIPER_6LOSS' ||
                    bettingEngineMode === 'SNIPER_4LOSS_MODE' ||
                    bettingEngineMode === 'SNIPER_5LOSS_MODE' ||
                    bettingEngineMode === 'SNIPER_6LOSS_MODE'
                  ) {
                    setAutoFeedback(`🏆 [SNIPER WIN & PROFIT BANKED!] Locked Method ဖြင့် အနိုင်ရရှိပါသဖြင့် (+K ${netGain.toLocaleString()} MMK) Bet တာချက်ချင်းရပ်တန့်ပြီး အမြတ်သိမ်းဆည်းလိုက်ပါပြီ! နောက်ထပ် Method အရ ချက်ချင်းထပ်ပြန်လောင်းရလျှင်လည်း Step 1 မူလစတင်ငွေ (K ${resetStake.toLocaleString()} MMK) မှသာ စတင်လောင်းပါမည်!`);
                  } else if (wasSevenMethodLocked) {
                    setAutoFeedback(`🏆 [7-METHOD LOCKED WIN & PROFIT BANKED!] Lock ထားသော Method [${prevSevenMethodLocked}] ဖြင့် အနိုင်ရရှိပါသဖြင့် (+K ${netGain.toLocaleString()} MMK) Lock ကို အောင်မြင်စွာ ဖြုတ်လိုက်ပြီး Step 1 မူလစတင်ငွေ (K ${resetStake.toLocaleString()} MMK) သို့ ပြန်လည်သတ်မှတ်လိုက်ပါပြီ!`);
                  } else {
                    setAutoFeedback(`🎉 [Auto Bet #${latestDraw.period.slice(-5)}] နိုင်ပါသဖြင့် (+K ${netGain.toLocaleString()} MMK) မူလစတင်ငွေ K ${resetStake.toLocaleString()} MMK သို့ ချက်ချင်း ပြန်သတ်မှတ်ပြီးပါပြီ!`);
                  }
                  confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                  });
                }
              } else {
                setAutoLosses((l) => l + 1);
                const lossAmount = bet.total;
                runningProfit -= lossAmount;

                if (loseStopEnabledRef.current && loseStopAmountRef.current > 0 && runningProfit <= -loseStopAmountRef.current) {
                  setIsAutoBetActive(false);
                  setStopReason('LOSE_STOP');
                  setAutoFeedback(`🛑 [LOSE STOP သတ်မှတ်ချက်!] သတ်မှတ်အရှုံးငွေ (-K ${Math.abs(runningProfit).toLocaleString()} MMK) ရောက်ရှိသဖြင့် Auto Bot ကို ဘေးကင်းစွာ ရပ်တန့်လိုက်ပါပြီ!`);
                } else {
                  const nextLosses = consecutiveLossesRef.current + 1;
                  consecutiveLossesRef.current = nextLosses;
                  setConsecutiveLosses(nextLosses);
                  const mult = autoMultiplierModeRef.current;
                  const nextStake = Math.round(autoBaseAmountRef.current * Math.pow(mult, nextLosses));
                  setCurrentAutoStake(nextStake);

                  // 7-Method Multi-AI: ၁ ကြိမ်ရှုံးလျှင် Method ၇ မျိုးထဲမှ Lose Rate အများဆုံး Method သို့ Auto Change ပေးပြီး Win မဖြစ်မချင်း Lock ၍ Bet ပါသည်
                  const isSniperActive =
                    autoStrategyRef.current === 'SNIPER_4LOSS' ||
                    autoStrategyRef.current === 'SNIPER_5LOSS' ||
                    autoStrategyRef.current === 'SNIPER_6LOSS' ||
                    bettingEngineMode === 'SNIPER_4LOSS_MODE' ||
                    bettingEngineMode === 'SNIPER_5LOSS_MODE' ||
                    bettingEngineMode === 'SNIPER_6LOSS_MODE';

                  if (!isSniperActive && methodStats) {
                    if (!sevenMethodLockedAlgoRef.current) {
                      // First loss: rank 7 methods by highest lose rate (100 - winRate)
                      const algos: AlgorithmType[] = ['HMM', 'MARKOV', 'ENSEMBLE', 'NEURAL_MATRIX', 'NGRAM_SEQUENCE', 'STATISTICAL_PROB', 'META_SUPER_AI'];
                      const rankedByLoseRate = [...algos].sort((a, b) => {
                        const winA = methodStats[a]?.winRate ?? 75;
                        const winB = methodStats[b]?.winRate ?? 75;
                        const loseA = 100 - winA;
                        const loseB = 100 - winB;
                        if (loseB !== loseA) return loseB - loseA;
                        return (methodStats[b]?.streak || 0) - (methodStats[a]?.streak || 0);
                      });
                      const highestLoseAlgo = rankedByLoseRate[0] || 'META_SUPER_AI';
                      sevenMethodLockedAlgoRef.current = highestLoseAlgo;
                      setSevenMethodLockedAlgo(highestLoseAlgo);
                      onSevenMethodLockedAlgoChange?.(highestLoseAlgo);
                      if (onChangeAiAlgorithm && highestLoseAlgo !== aiAlgorithm) {
                        onChangeAiAlgorithm(highestLoseAlgo);
                      }
                      try {
                        playRadarLockSound();
                      } catch {}
                      const targetStats = methodStats[highestLoseAlgo];
                      const targetLoseRate = targetStats ? (100 - targetStats.winRate).toFixed(1) : '0';
                      setAutoFeedback(`⚡ [7-METHOD 1-LOSS AUTO-SWITCH] ၁ ကြိမ် ရှုံးသွားပါသဖြင့် Method ၇ မျိုးထဲမှ Lose Rate (${targetLoseRate}%) အများဆုံးဖြစ်သော [${targetStats?.label || highestLoseAlgo}] သို့ Auto Switch ပေးပြီး Win မဖြစ်မချင်း Lock ထားပါသည်!`);
                    } else {
                      // Already locked onto this method: hold lock until win
                      const lockedAlgo = sevenMethodLockedAlgoRef.current;
                      const targetStats = methodStats[lockedAlgo];
                      setAutoFeedback(`🔒 [7-METHOD LOCKED HOLD] Lose Rate အများဆုံး Lock Method [${targetStats?.label || lockedAlgo}] ဖြင့် Win မဖြစ်မချင်း ${mult}× ဆတိုးပြီး K ${nextStake.toLocaleString()} MMK ဆက်လက်လောင်းပါမည်! (အဆင့်: ${nextLosses + 1})`);
                    }
                  }

                  if (autoStrategyRef.current === 'WAIT_BOT') {
                    setAutoFeedback(`⚠️ [Wait Bot #${latestDraw.period.slice(-5)}] ဆန့်ကျင်ဘက် [${bet.selection === 'BIG' ? 'ကြီး' : 'ငယ်'}] မထွက်သေးသဖြင့် ${mult}× ဆတိုးပြီး နောက်ပွဲအတွက် K ${nextStake.toLocaleString()} MMK ဆက်လောင်းပါမည်! (အဆင့်: ${nextLosses + 1})`);
                  } else if (
                    autoStrategyRef.current === 'SNIPER_4LOSS' ||
                    autoStrategyRef.current === 'SNIPER_5LOSS' ||
                    autoStrategyRef.current === 'SNIPER_6LOSS' ||
                    bettingEngineMode === 'SNIPER_4LOSS_MODE' ||
                    bettingEngineMode === 'SNIPER_5LOSS_MODE' ||
                    bettingEngineMode === 'SNIPER_6LOSS_MODE'
                  ) {
                    setAutoFeedback(`⚠️ [SNIPER STRIKE HOLD] Locked Method [${sniperLockedAlgoRef.current}] ဖြင့် Win မဖြစ်မချင်း ${mult}× ဆတိုးပြီး K ${nextStake.toLocaleString()} MMK ဆက်လက်လောင်းပါမည်! (Strike အဆင့်: ${nextLosses + 1})`);
                  } else {
                    setAutoFeedback(`⚠️ [Auto Bet #${latestDraw.period.slice(-5)}] ရှုံးသဖြင့် ${mult}× ဆတိုးပြီး နောက်ပွဲအတွက် K ${nextStake.toLocaleString()} MMK သတ်မှတ်လိုက်ပါပြီ! (အဆင့်: ${nextLosses + 1})`);
                  }
                }
              }
            }

            setAutoProfit(runningProfit);
          });

          return prev.map((bet) => {
            if (bet.status === 'PENDING') {
              const matchedDraw = history.find((d) => d.period === bet.period);
              if (matchedDraw) {
                const won = bet.selection === matchedDraw.size;
                const payoutRate = 1.98;
                const payout = won ? Math.round(bet.total * payoutRate) : 0;
                return { ...bet, status: won ? ('WON' as const) : ('LOST' as const), payout };
              }
            }
            return bet;
          });
        });
      }
      prevHistoryPeriodRef.current = latestDraw.period;
    }
  }, [history]);

  // Account login modal state
  const [inputPhone, setInputPhone] = useState<string>(account.phone || '9798023829');
  const [inputPassword, setInputPassword] = useState<string>(account.password || '166061kp');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginFeedback, setLoginFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleAccountLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRefreshLogin) return;

    setIsLoggingIn(true);
    setLoginFeedback(null);
    try {
      const result = await onRefreshLogin(inputPhone.trim(), inputPassword.trim());
      setLoginFeedback(result);
      if (result.success) {
        await fetchRealLiveBalance();
        setTimeout(() => {
          setIsLoginModalOpen(false);
          setLoginFeedback(null);
        }, 1500);
      }
    } catch (err: any) {
      setLoginFeedback({ success: false, message: err.message || 'Login error' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER TOOLBAR: PROFILE, AUTO BOT ONLY BADGE & GAME SELECTOR       */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
        {/* User Account Info */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black shadow-lg shrink-0">
            <User className="w-6 h-6 text-black stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {account.nickName || 'MemberNNG0XDE5'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40">
                🤖 AUTO BOT ONLY
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5 flex-wrap">
              <span>Ph: <strong className="text-white">09××××××××</strong></span>
              <span>•</span>
              <span className="text-amber-400 font-bold">
                Balance: K {userBalance.toLocaleString()} MMK
              </span>
              <button
                type="button"
                onClick={() => {
                  setUserBalance((b) => b + 10000);
                  setAutoFeedback('+10,000 MMK Station Balance ဖြည့်သွင်းပြီးပါပြီ!');
                  setTimeout(() => setAutoFeedback(null), 2500);
                }}
                className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-[10px] text-amber-300 font-bold border border-amber-500/40 transition-colors"
                title="Station Balance ပြန်လည်ဖြည့်သွင်းရန်"
              >
                +10,000 MMK
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls: Game Mode, Settings, Refresh */}
        <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-between md:justify-end">
          {/* Game Type Selector */}
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onChangeTypeId(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedTypeId === 1
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Win Go 60s
            </button>
            <button
              type="button"
              onClick={() => onChangeTypeId(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedTypeId === 30
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Win Go 30s
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Login / Account change"
          >
            <Key className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={onRefreshSession}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Account Balance"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE HERO: LIVE AUTO MONITORING DASHBOARD (100% AUTO BET ONLY)           */}
      {/* ========================================================================= */}
      <div className={`p-5 sm:p-6 rounded-2xl border-2 transition-all shadow-2xl relative overflow-hidden ${
        isAutoBetActive 
          ? 'bg-slate-900/95 border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50' 
          : stopReason === 'WIN_STOP'
          ? 'bg-slate-900/95 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
          : stopReason === 'LOSE_STOP'
          ? 'bg-slate-900/95 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/50'
          : 'bg-slate-950 border-slate-800'
      }`}>
        {/* Glow ambient accent */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isAutoBetActive ? 'bg-emerald-500/10' : stopReason === 'WIN_STOP' ? 'bg-amber-500/10' : 'bg-slate-800/10'
        }`} />

        {/* DASHBOARD HEADER WITH AUTO BETTING MASTER BUTTON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isAutoBetActive 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-inner' 
                : stopReason === 'WIN_STOP'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <Bot className={`w-7 h-7 ${isAutoBetActive ? 'animate-bounce text-emerald-400' : ''}`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-tech text-base sm:text-lg font-black text-white tracking-wider flex items-center gap-2">
                  LIVE AUTO MONITORING DASHBOARD
                </h3>

                {isAutoBetActive && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase font-mono animate-pulse flex items-center gap-1 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                    RUNNING ACTIVE
                  </span>
                )}

                {stopReason === 'WIN_STOP' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase font-mono flex items-center gap-1 shadow">
                    <Trophy className="w-3 h-3 fill-current" />
                    TARGET ACHIEVED
                  </span>
                )}

                {stopReason === 'LOSE_STOP' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase font-mono flex items-center gap-1 shadow">
                    <ShieldAlert className="w-3 h-3 fill-current" />
                    LOSE STOPPED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                100% Autonomous Trading • Martingale Progression ({autoMultiplierMode}×) • Loss-Guard Protection
              </p>
            </div>
          </div>

          {/* AUTO BETTING BUTTON INSIDE THE DASHBOARD */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={handleToggleAutoBet}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                isAutoBetActive
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/60 ring-2 ring-red-500/50'
                  : stopReason === 'LOSE_STOP'
                  ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 hover:from-rose-400 hover:to-emerald-400 text-black shadow-rose-950/60 ring-2 ring-rose-400 animate-pulse'
                  : stopReason === 'WIN_STOP'
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 text-black shadow-emerald-950/60 ring-2 ring-emerald-400'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-emerald-950/60 ring-2 ring-emerald-400/50'
              }`}
            >
              {isAutoBetActive ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>STOP AUTO BET (ရပ်မည်)</span>
                </>
              ) : stopReason === 'LOSE_STOP' ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESTART AUTO BOT (ပြန်လည်စတင်မည်)</span>
                </>
              ) : stopReason === 'WIN_STOP' ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START NEW CYCLE (Session အသစ်စမည်)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START AUTO BET (စတင်မည်)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MULTI-MODE BETTING ENGINE EXPLICIT STATUS BANNER (Formula mode vs Method 7 မျိုး vs 4-Loss, 5-Loss & 6-Loss Sniper) */}
        <div className={`p-3.5 sm:p-4 rounded-xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${
          bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS'
            ? 'bg-gradient-to-r from-rose-600/30 via-slate-950 to-amber-950/30 border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
            : bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS'
            ? 'bg-gradient-to-r from-red-600/25 via-slate-950 to-orange-950/30 border-red-400/90 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
            : bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS'
            ? 'bg-gradient-to-r from-purple-500/20 via-slate-950 to-rose-950/30 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
            : bettingEngineMode === 'FORMULA_MODE'
            ? 'bg-gradient-to-r from-amber-500/20 via-slate-950 to-amber-950/30 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            : 'bg-gradient-to-r from-cyan-500/20 via-slate-950 to-cyan-950/30 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border shrink-0 ${
              bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS'
                ? 'bg-rose-500/25 border-rose-500/50 text-rose-300'
                : bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS'
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS'
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                : bettingEngineMode === 'FORMULA_MODE'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
            }`}>
              {bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS' || bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS' || bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS' ? (
                <Crosshair className="w-5 h-5 text-rose-400 animate-pulse" />
              ) : bettingEngineMode === 'FORMULA_MODE' ? (
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              ) : (
                <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                  bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS'
                    ? 'bg-rose-500 text-white shadow ring-2 ring-rose-300 animate-pulse'
                    : bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS'
                    ? 'bg-red-500 text-white shadow ring-1 ring-red-300'
                    : bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS'
                    ? 'bg-purple-500 text-white shadow'
                    : bettingEngineMode === 'FORMULA_MODE'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-cyan-500 text-black shadow'
                }`}>
                  {bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS'
                    ? '🎯 4-LOSS SNIPER MODE ACTIVE'
                    : bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS'
                    ? '🎯 5-LOSS SNIPER MODE ACTIVE'
                    : bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS'
                    ? '🎯 6-LOSS SNIPER MODE ACTIVE'
                    : bettingEngineMode === 'FORMULA_MODE'
                    ? '🧬 10-MIN FORMULA MODE ACTIVE'
                    : '⚡ 7-METHOD MULTI-AI MODE ACTIVE'}
                </span>
                <span className="text-xs font-tech font-bold text-white">
                  {bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS'
                    ? `[၄ ကြိမ်ရှုံး စောင့်ဆိုင်း SNIPER စနစ် ("HEY! NOW I AM START BETTING" အချက်ပြသံ)]`
                    : bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS'
                    ? `[၅ ကြိမ်ရှုံး စောင့်ဆိုင်း SNIPER စနစ် (၃ ကြိမ်ရှုံး "I found 3 lose method" အသံ)]`
                    : bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS'
                    ? `[၆ ကြိမ်ရှုံး စောင့်ဆိုင်း SNIPER စနစ် (၄ ကြိမ်ရှုံး Scatter အသံ)]`
                    : bettingEngineMode === 'FORMULA_MODE'
                    ? `[10-MINUTES AI FORMULA စနစ်ဖြင့် လောင်းနေပါသည်]`
                    : `[နည်းပညာ ၇ မျိုး MULTI-AI စနစ်ဖြင့် လောင်းနေပါသည်]`}
                </span>
              </div>

              <span className="text-[11px] text-slate-300 font-sans block mt-1">
                {bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS' || bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS' || bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS'
                  ? `Sniper Status: ${
                      sniperBotStatus === 'STRIKING'
                        ? `🔥 STRIKING ON [${sniperLockedAlgo}] (Win မဖြစ်မချင်း ဤ Method တမျိုးတည်း လောင်းမည်)`
                        : `⏳ WAITING FOR ${bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS' ? '4-LOSS' : bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS' ? '5-LOSS' : '6-LOSS'} METHOD (${bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS' ? '၄' : bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS' ? '၅' : '၆'} ကြိမ်ရှုံး Method စောင့်နေပါသည်)`
                    }`
                  : bettingEngineMode === 'FORMULA_MODE'
                  ? `Formula: ${activeFormula?.code || 'Active'} • ${activeFormula?.burmeseTitle || ''} • (Base: K ${autoBaseAmount.toLocaleString()} • Win Stop: ${winStopEnabled ? '+' + winStopAmount.toLocaleString() : 'OFF'} • Lose Stop: ${loseStopEnabled ? '-' + loseStopAmount.toLocaleString() : 'OFF'} • ${autoMultiplierMode}× Mult)`
                  : sevenMethodLockedAlgo
                  ? `Method: [${sevenMethodLockedAlgo}] • 🔒 ၁ ကြိမ်ရှုံးသဖြင့် Lose Rate အများဆုံး Method ကို Lock ထားပြီး Win မဖြစ်မချင်း ဤ Method ဖြင့်သာ လောင်းပါမည်`
                  : `Method: [${aiAlgorithm}] • တိုက်ရိုက်ရွေးချယ်ထားသော စနစ်ဖြင့် လောင်းနေပါသည် (၁ ကြိမ်ရှုံးလျှင် Lose Rate အများဆုံး Method သို့ Auto-Switch & Lock)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => {
                onSelectMode?.('SNIPER_4LOSS_MODE');
                setAutoStrategy('SNIPER_4LOSS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                bettingEngineMode === 'SNIPER_4LOSS_MODE' || autoStrategy === 'SNIPER_4LOSS'
                  ? 'bg-rose-500 text-white ring-2 ring-rose-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>⭐ 4-Loss (Active)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectMode?.('SNIPER_5LOSS_MODE');
                setAutoStrategy('SNIPER_5LOSS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                bettingEngineMode === 'SNIPER_5LOSS_MODE' || autoStrategy === 'SNIPER_5LOSS'
                  ? 'bg-red-500 text-white ring-2 ring-red-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-red-300 border border-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>🎯 5-Loss</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectMode?.('SNIPER_6LOSS_MODE');
                setAutoStrategy('SNIPER_6LOSS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                bettingEngineMode === 'SNIPER_6LOSS_MODE' || autoStrategy === 'SNIPER_6LOSS'
                  ? 'bg-purple-500 text-white ring-1 ring-purple-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>🎯 6-Loss</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectMode?.('METHODS_7_MODE');
                setAutoStrategy('AI_GUESS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                bettingEngineMode === 'METHODS_7_MODE' && autoStrategy !== 'SNIPER_6LOSS' && autoStrategy !== 'SNIPER_5LOSS'
                  ? 'bg-cyan-500 text-black ring-1 ring-cyan-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>⚡ နည်းပညာ ၇ မျိုး</span>
            </button>

            {activeFormula && (
              <button
                type="button"
                onClick={() => {
                  onSelectMode?.('FORMULA_MODE');
                  applyFormulaToAutoBet(activeFormula);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-tech font-black flex items-center gap-1.5 shadow transition-all ${
                  bettingEngineMode === 'FORMULA_MODE'
                    ? 'bg-amber-500 text-black ring-1 ring-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🧬 10-Min Formula</span>
              </button>
            )}
          </div>
        </div>

        {/* TIMER BAR: LIVE RUNNING TIMER & COUNTDOWN */}
        <div className="pt-4 pb-2 grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
          {/* Target Profit Duration Timer Box */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Hourglass className={`w-6 h-6 ${isAutoBetActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                  {targetProfitDuration !== null ? 'TARGET PROFIT ရရှိသည့်ကြာချိန်:' : 'AUTO BOT START ချိန်မှ စတင်ကြာချိန်:'}
                </span>
                <div className="text-2xl sm:text-3xl font-tech font-black text-amber-400 font-mono tracking-wider flex items-center gap-2">
                  <span>{formatDuration(targetProfitDuration !== null ? targetProfitDuration : botElapsedSeconds)}</span>
                  {isAutoBetActive && (
                    <span className="text-[10px] font-sans font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-pulse">
                      Live Ticking
                    </span>
                  )}
                  {targetProfitDuration !== null && (
                    <span className="text-[10px] font-sans font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                      Completed 🏆
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono block">Win Target</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                +K {winStopAmount.toLocaleString()} MMK
              </span>
            </div>
          </div>

          {/* Current Target Period & Countdown */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                CURRENT DRAW & PREDICTION:
              </span>
              <div className="text-base sm:text-lg font-mono font-bold text-white flex items-center gap-2">
                <span className="text-amber-400">#{currentPeriod ? currentPeriod.slice(-5) : '...'}</span>
                {prediction && (
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    prediction.size === 'BIG' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}>
                    {prediction.sizeBurmese} ({prediction.confidence}%)
                  </span>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border font-tech font-black text-2xl font-mono ${
              secondsLeft <= 5
                ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-900 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}>
              <Clock className="w-5 h-5 mr-1 text-slate-400" />
              <span>{String(secondsLeft).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* 4 CORE LIVE PERFORMANCE METRICS */}
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center relative z-10">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Next Auto Stake</span>
            <span className="text-lg sm:text-xl font-tech font-black text-amber-300 font-mono block">
              K {currentAutoStake.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              Base: K {autoBaseAmount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Progression Step</span>
            <span className="text-lg sm:text-xl font-tech font-bold text-white font-mono block">
              Step {consecutiveLosses + 1}
            </span>
            <span className="text-[10px] text-amber-400/90 font-mono block">
              {consecutiveLosses > 0 ? `${autoMultiplierMode}× Multiplier` : 'Base Stake'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Loss Streak</span>
            <span className={`text-lg sm:text-xl font-tech font-bold font-mono block ${consecutiveLosses > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {consecutiveLosses} ဆက်တိုက်
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              Score: {autoWins}W - {autoLosses}L
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Session Profit</span>
            <span className={`text-lg sm:text-xl font-tech font-black font-mono block ${autoProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {autoProfit >= 0 ? `+K ${autoProfit.toLocaleString()}` : `-K ${Math.abs(autoProfit).toLocaleString()}`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              Total {autoWins + autoLosses} Rounds
            </span>
          </div>
        </div>

        {/* WIN STOP & LOSE STOP PROGRESS GAUGES */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {/* Win Stop Progress Bar */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                Win Stop Target:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {winStopEnabled
                  ? `+K ${Math.max(0, autoProfit).toLocaleString()} / ${winStopAmount.toLocaleString()} MMK (${Math.min(100, Math.max(0, Math.round((autoProfit / winStopAmount) * 100)))}%)`
                  : 'OFF'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: winStopEnabled && winStopAmount > 0
                    ? `${Math.min(100, Math.max(0, (autoProfit / winStopAmount) * 100))}%`
                    : '0%'
                }}
              />
            </div>
          </div>

          {/* Lose Stop Progress Bar */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-rose-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Lose Stop Limit:
              </span>
              <span className="font-mono font-bold text-rose-400">
                {loseStopEnabled
                  ? `K ${Math.abs(Math.min(0, autoProfit)).toLocaleString()} / ${loseStopAmount.toLocaleString()} MMK (${Math.min(100, Math.round((Math.abs(Math.min(0, autoProfit)) / loseStopAmount) * 100))}% used)`
                  : 'OFF'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-500"
                style={{
                  width: loseStopEnabled && loseStopAmount > 0
                    ? `${Math.min(100, Math.round((Math.abs(Math.min(0, autoProfit)) / loseStopAmount) * 100))}%`
                    : '0%'
                }}
              />
            </div>
          </div>
        </div>

        {/* WIN STOP ACHIEVED SPECIAL BANNER */}
        {stopReason === 'WIN_STOP' && (
          <div className="mt-3.5 p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border-2 border-emerald-400 text-emerald-300 text-xs flex flex-col gap-3 shadow-[0_0_25px_rgba(16,185,129,0.35)] relative z-10 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shrink-0">
                  <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />
                </div>
                <div>
                  <strong className="text-sm font-bold text-white block">
                    🎉 TARGET PROFIT ရရှိပါပြီ! (Win Stop Achieved)
                  </strong>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    သတ်မှတ်ထားသောအမြတ်ငွေ <strong>+K {autoProfit.toLocaleString()} MMK</strong> ရရှိခဲ့ပါပြီ! 
                    ကြာချိန်: <strong className="text-amber-300 font-mono text-sm">{formatDuration(targetProfitDuration || botElapsedSeconds)}</strong>
                  </p>
                  <p className="text-[11px] text-amber-300/90 italic mt-0.5">
                    "ဂုဏ်ယူပါတယ် မင်းသတ်မှတ်ထားသောအမြတ်ငွေကိုရရှိပါပြီ"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRestartAutoBot}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Session အသစ်စမည်</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAutoSession}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Nan Stop Auto Bet Countdown Strip if enabled */}
            {nonStopAutoBet && nonStopCountdown !== null && (
              <div className="pt-2.5 border-t border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/40 p-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <div>
                    <span className="font-tech text-xs font-bold text-amber-300 block">
                      ⚡ Nan Stop Auto Bet Activated:
                    </span>
                    <span className="text-[11px] text-emerald-200">
                      နောက်တစ်ကျော့ Auto Bet အလိုအလျောက် စတင်ရန်{' '}
                      <strong className="text-white font-mono text-sm font-black px-1.5 py-0.5 rounded bg-black border border-amber-500/40">
                        {Math.floor(nonStopCountdown / 60).toString().padStart(2, '0')}:{(nonStopCountdown % 60).toString().padStart(2, '0')}
                      </strong>{' '}
                      ကျန်ရှိပါသည် (1m 35s Auto Restart)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNonStopCountdown(null);
                      handleRestartAutoBot();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs shadow active:scale-95"
                  >
                    ချက်ချင်းစတင်မည် (Start Now)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNonStopCountdown(null);
                      setAutoFeedback('Nan Stop Auto Bet အလိုအလျောက် စတင်ခြင်းကို ပယ်ဖျက်လိုက်ပါပြီ။');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                  >
                    ပယ်ဖျက်မည်
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOSE STOP REACHED ALERT BANNER */}
        {stopReason === 'LOSE_STOP' && (
          <div className="mt-3.5 p-4 rounded-xl bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 border-2 border-rose-500 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(239,68,68,0.35)] relative z-10 animate-in fade-in">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
              <div>
                <strong className="text-sm font-bold text-white block">
                  🛑 LOSE STOP REACHED (အရှုံးကာကွယ် ရပ်တန့်ပါပြီ)
                </strong>
                <p className="text-xs text-rose-200 mt-0.5">
                  အရှုံးငွေ <strong>-K {Math.abs(autoProfit).toLocaleString()} MMK</strong> ရောက်ရှိသဖြင့် Auto Bot ကို ဘေးကင်းစွာ ရပ်တန့်လိုက်ပါသည်။
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestartAutoBot}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 text-black font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all animate-pulse"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ချက်ချင်းပြန်စမည် (Restart)</span>
              </button>
              <button
                type="button"
                onClick={handleResetAutoSession}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* In-Dashboard Feedback Strip */}
        {autoFeedback && (
          <div className="mt-3.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-amber-300 flex items-center gap-2.5 relative z-10">
            <Bot className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-sans leading-relaxed">{autoFeedback}</span>
          </div>
        )}

        {/* MEDIUM BUTTONS FOR SETTINGS & RISK DETAILS */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2.5 flex-wrap relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsBetSettingsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 border border-slate-700/80 transition-all shadow active:scale-95"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Auto Bet Settings ({autoBaseAmount} MMK • {autoMultiplierMode}×)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRiskModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 border border-slate-700/80 transition-all shadow active:scale-95"
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Win/Lose Stop (+{winStopAmount} / -{loseStopAmount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAutoSession}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition-colors"
              title="Reset session statistics"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset စာရင်း</span>
            </button>
          </div>
        </div>

        {/* NAN STOP AUTO BET ON/OFF CONTROL BAR (Under Win/Lose Stop button) */}
        <div className="mt-3.5 p-3 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col gap-3 relative z-10 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border transition-all ${
                nonStopAutoBet
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Zap className={`w-4 h-4 ${nonStopAutoBet ? 'animate-bounce text-amber-400 fill-amber-400' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-tech text-xs sm:text-sm font-bold text-white tracking-wider">
                    Nan Stop Auto Bet
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    nonStopAutoBet
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {nonStopAutoBet ? 'ACTIVATED (ON)' : 'OFF'}
                  </span>
                  {nonStopAutoBet && nonStopCountdown !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold animate-pulse flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Auto-Start: {Math.floor(nonStopCountdown / 60).toString().padStart(2, '0')}:{(nonStopCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Win Profit ရရှိပြီး Auto Bet ရပ်တန့်သွားပါက သတ်မှတ်ထားသော <strong className="text-amber-300 font-mono">{Math.floor(nonStopWaitSeconds / 60) > 0 ? `${Math.floor(nonStopWaitSeconds / 60)}m ` : ''}{nonStopWaitSeconds % 60}s ({nonStopWaitSeconds}s)</strong> အကြာတွင် auto bet စနစ် အလိုအလျောက် Auto start ဖြစ်စေပါမည်။
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextVal = !nonStopAutoBet;
                  setNonStopAutoBet(nextVal);
                  nonStopAutoBetRef.current = nextVal;
                  if (!nextVal) {
                    setNonStopCountdown(null);
                  }
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                  nonStopAutoBet ? 'bg-amber-500' : 'bg-slate-800'
                }`}
                title="Toggle Nan Stop Auto Bet"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    nonStopAutoBet ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-mono font-bold ${nonStopAutoBet ? 'text-amber-400' : 'text-slate-500'}`}>
                {nonStopAutoBet ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Custom Wait Time Selector */}
          <div className="pt-2.5 border-t border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono text-slate-300 font-bold">
                Auto Restart စောင့်ဆိုင်းချိန် (Wait Time):
              </span>
              <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                {Math.floor(nonStopWaitSeconds / 60) > 0 ? `${Math.floor(nonStopWaitSeconds / 60)} min ` : ''}{nonStopWaitSeconds % 60} sec ({nonStopWaitSeconds}s)
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: '30s', val: 30 },
                { label: '60s (1m)', val: 60 },
                { label: '95s (1m 35s)', val: 95 },
                { label: '120s (2m)', val: 120 },
                { label: '180s (3m)', val: 180 },
                { label: '300s (5m)', val: 300 }
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => {
                    setNonStopWaitSeconds(preset.val);
                    setCustomWaitInput(String(preset.val));
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                    nonStopWaitSeconds === preset.val
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                <input
                  type="number"
                  min="5"
                  max="3600"
                  value={customWaitInput}
                  onChange={(e) => {
                    setCustomWaitInput(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 5) {
                      setNonStopWaitSeconds(val);
                    }
                  }}
                  className="w-12 bg-transparent text-amber-300 font-mono text-xs font-bold outline-none text-center"
                  placeholder="95"
                />
                <span className="text-[10px] font-mono text-slate-400">sec</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECENT AUTO BETS LOG                                                   */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            RECENT AUTO BETS (အော်တိုလောင်းထားသော မှတ်တမ်း):
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {activeBets.length} Rounds Tracked
          </span>
        </div>

        {activeBets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Auto Bet မစတင်ရသေးပါ။ အပေါ်ရှိ "START AUTO BET (စတင်မည်)" ခလုတ်ကို နှိပ်၍ စတင်လိုက်ပါ။
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {activeBets.map((bet) => (
              <div
                key={bet.id}
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">#{bet.period.slice(-5)}</span>
                  <span className="text-white font-bold">
                    {bet.selection === 'BIG' ? 'ကြီး (BIG)' : 'ငယ် (SMALL)'}
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-extrabold">
                    AUTO
                  </span>
                  <span className="text-slate-500">
                    (K {bet.amount} x {bet.multiplier}X)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-300">K {bet.total.toLocaleString()}</span>
                  {bet.status === 'PENDING' && (
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                      PENDING
                    </span>
                  )}
                  {bet.status === 'WON' && (
                    <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      +K {bet.payout?.toLocaleString()} WON!
                    </span>
                  )}
                  {bet.status === 'LOST' && (
                    <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-bold">
                      LOST
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL 1: AUTO BET SETTINGS & MULTIPLIER MODAL                          */}
      {/* ========================================================================= */}
      {isBetSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-amber-500/30">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="font-tech text-base font-bold text-white">
                  AUTO BET SETTINGS & PROGRESSION METHOD
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBetSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 1. Base Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase block">
                    1. စတင်လောင်းကြေးငွေ (BASE STAKE AMOUNT):
                  </label>
                  <span className="text-xs font-mono font-black text-amber-400">
                    K {autoBaseAmount.toLocaleString()} MMK
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[10, 20, 50, 100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAutoBaseAmount(amt);
                        setCustomBaseAmountInput(String(amt));
                        setIsCustomBaseAmount(false);
                        if (consecutiveLosses === 0) {
                          setCurrentAutoStake(amt);
                        }
                      }}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                        !isCustomBaseAmount && autoBaseAmount === amt
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      K {amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomBaseAmount(true);
                      setCustomBaseAmountInput(String(autoBaseAmount));
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                      isCustomBaseAmount
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                        : 'bg-slate-950 text-amber-400 border-amber-500/40 hover:border-amber-400'
                    }`}
                  >
                    Custom ✏️
                  </button>
                </div>

                {/* Custom Base Amount Input Box */}
                {isCustomBaseAmount && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-amber-400 font-bold">စိတ်ကြိုက်လောင်းကြေး ပမာဏ (Custom Base Stake):</span>
                      <span className="text-slate-400 font-bold">လက်ရှိ: K {autoBaseAmount.toLocaleString()} MMK</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">K</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={customBaseAmountInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setCustomBaseAmountInput(raw);
                            const val = parseInt(raw, 10);
                            if (!isNaN(val) && val > 0) {
                              setAutoBaseAmount(val);
                              if (consecutiveLosses === 0) {
                                setCurrentAutoStake(val);
                              }
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-amber-500/50 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="ဥပမာ- 25, 250, 1500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(customBaseAmountInput, 10);
                          if (!isNaN(val) && val > 0) {
                            setAutoBaseAmount(val);
                            if (consecutiveLosses === 0) setCurrentAutoStake(val);
                            setAutoFeedback(`စတင်လောင်းကြေးငွေ K ${val.toLocaleString()} MMK သတ်မှတ်ပြီးပါပြီ`);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs shadow active:scale-95"
                      >
                        သတ်မှတ်မည်
                      </button>
                    </div>

                    {/* Quick increment chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">အမြန်ပေါင်းထည့်ရန်:</span>
                      {[10, 50, 100, 500, 1000, 5000].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const current = parseInt(customBaseAmountInput, 10) || autoBaseAmount || 10;
                            const updated = Math.max(1, current + inc);
                            setCustomBaseAmountInput(String(updated));
                            setAutoBaseAmount(updated);
                            if (consecutiveLosses === 0) setCurrentAutoStake(updated);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700 font-bold active:scale-95 transition-all"
                        >
                          +{inc.toLocaleString()}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setCustomBaseAmountInput('10');
                          setAutoBaseAmount(10);
                          if (consecutiveLosses === 0) setCurrentAutoStake(10);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-800 ml-auto"
                      >
                        Reset (10)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Martingale Multiplier */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase block">
                  2. ရှုံးပါက ဆတိုးစနစ် (MARTINGALE MULTIPLIER):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAutoMultiplierMode(2);
                      setIsCustomMultiplier(false);
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      !isCustomMultiplier && autoMultiplierMode === 2
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg font-tech font-black block">2X MULTIPLIER</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Classic Martingale (Standard)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAutoMultiplierMode(3);
                      setIsCustomMultiplier(false);
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      !isCustomMultiplier && autoMultiplierMode === 3
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg font-tech font-black block">3X MULTIPLIER</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Aggressive High Recovery</span>
                  </button>
                </div>
              </div>

              {/* 3. Auto Strategy */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase block">
                  3. AUTO BET STRATEGY (လောင်းမည့် အော်တိုနည်းလမ်း):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAutoStrategy('AI_GUESS');
                      onSelectMode?.('METHODS_7_MODE');
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                      autoStrategy === 'AI_GUESS' && bettingEngineMode === 'METHODS_7_MODE'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-500/40 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold block mb-0.5 text-cyan-300">⚡ Follow AI (၇ မျိုး)</div>
                    <span className="text-[10px] text-slate-400 font-sans font-normal block leading-tight">Meta-Consensus AI နည်းပညာ (၇) မျိုးမှ အကောင်းဆုံး Method အတိုင်း လိုက်လောင်းသည် (၁ ကြိမ်ရှုံးလျှင် Lose Rate အများဆုံး Method သို့ Auto-Switch & Lock)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAutoStrategy('SNIPER_4LOSS');
                      onSelectMode?.('SNIPER_4LOSS_MODE');
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                      autoStrategy === 'SNIPER_4LOSS' || bettingEngineMode === 'SNIPER_4LOSS_MODE'
                        ? 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-500/60 shadow-lg animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold block mb-0.5 text-rose-300">⭐ 4-Loss Sniper Mode ("Start Betting" Voice)</div>
                    <span className="text-[10px] text-slate-400 font-sans font-normal block leading-tight">၄ ကြိမ်ရှုံးသော Method ကို စောင့်ပြီး "HEY! NOW I AM START BETTING" အချက်ပြကာ Win မဖြစ်မချင်း ထို Method တမျိုးတည်း လောင်းသည်</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAutoStrategy('SNIPER_5LOSS');
                      onSelectMode?.('SNIPER_5LOSS_MODE');
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                      autoStrategy === 'SNIPER_5LOSS' || bettingEngineMode === 'SNIPER_5LOSS_MODE'
                        ? 'bg-red-500/25 border-red-400 text-red-200 ring-1 ring-red-500/50 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold block mb-0.5 text-red-300">🎯 5-Loss Sniper Mode</div>
                    <span className="text-[10px] text-slate-400 font-sans font-normal block leading-tight">၃ ကြိမ်ရှုံး Voice Alarm မြည်မည်။ ၅ ကြိမ်ရှုံးသော Method ကို စောင့်ပြီး Win မဖြစ်မချင်း ထို Method ဖြင့် လောင်းသည်</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAutoStrategy('SNIPER_6LOSS');
                      onSelectMode?.('SNIPER_6LOSS_MODE');
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                      autoStrategy === 'SNIPER_6LOSS' || bettingEngineMode === 'SNIPER_6LOSS_MODE'
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 ring-1 ring-purple-500/50 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold block mb-0.5 text-purple-300">🎯 6-Loss Sniper Mode</div>
                    <span className="text-[10px] text-slate-400 font-sans font-normal block leading-tight">၄ ကြိမ်ရှုံး Scatter Alarm မြည်မည်။ ၆ ကြိမ်ရှုံးသော Method ကို စောင့်ပြီး Win မဖြစ်မချင်း ထို Method ဖြင့် လောင်းသည်</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAutoStrategy('WAIT_BOT');
                      onSelectMode?.('METHODS_7_MODE');
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
                      autoStrategy === 'WAIT_BOT'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/30 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold block mb-0.5 text-emerald-300">🐉 Wait Bot (Streak)</div>
                    <span className="text-[10px] text-slate-400 font-sans font-normal block leading-tight">ကြီး သို့မဟုတ် ငယ် ဆက်တိုက်ထွက်ပြီးမှ ဆန့်ကျင်ဘက်ကို win ဖြစ်သည်အထိ လိုက်လောင်းသည်</span>
                  </button>
                </div>
              </div>

              {/* Wait Bot Streak Threshold */}
              {autoStrategy === 'WAIT_BOT' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono text-amber-300 font-bold block">
                    Wait Bot: စောင့်ဆိုင်းမည့် ဆက်တိုက်အကြိမ်ရေ (Threshold):
                  </span>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6, 7].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setWaitStreakThreshold(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                          waitStreakThreshold === s
                            ? 'bg-amber-500 text-black'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {s} ကြိမ်
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBetSettingsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow"
              >
                ပြီးပါပြီ (Save & Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL 2: WIN STOP & LOSE STOP RISK MANAGEMENT                           */}
      {/* ========================================================================= */}
      {isRiskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-emerald-500/30">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="font-tech text-base font-bold text-white">
                  WIN STOP & LOSE STOP (အမြတ်/အရှုံး ကန့်သတ်ချက်)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRiskModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Win Stop Setting */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    WIN STOP (TARGET PROFIT အနိုင်ရယူရေး)
                  </span>
                  <button
                    type="button"
                    onClick={() => setWinStopEnabled(!winStopEnabled)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                      winStopEnabled ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {winStopEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={winStopInput}
                    onChange={(e) => {
                      setWinStopInput(e.target.value);
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) setWinStopAmount(val);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-sm focus:border-emerald-400 outline-none"
                    placeholder="1000"
                  />
                  <span className="text-xs font-mono text-emerald-400 font-bold">MMK</span>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {[500, 1000, 2000, 5000, 10000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setWinStopAmount(v);
                        setWinStopInput(String(v));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                    >
                      +K {v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lose Stop Setting */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    LOSE STOP (STOP LOSS အရှုံးကာကွယ်ရေး)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLoseStopEnabled(!loseStopEnabled)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                      loseStopEnabled ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {loseStopEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={loseStopInput}
                    onChange={(e) => {
                      setLoseStopInput(e.target.value);
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) setLoseStopAmount(val);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-rose-300 font-mono text-sm focus:border-rose-400 outline-none"
                    placeholder="1000"
                  />
                  <span className="text-xs font-mono text-rose-400 font-bold">MMK</span>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {[500, 1000, 2000, 5000, 10000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setLoseStopAmount(v);
                        setLoseStopInput(String(v));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                    >
                      -K {v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nan Stop Auto Bet Setting in Risk Modal */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    NAN STOP AUTO BET (Auto Restart)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !nonStopAutoBet;
                      setNonStopAutoBet(nextVal);
                      nonStopAutoBetRef.current = nextVal;
                      if (!nextVal) setNonStopCountdown(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                      nonStopAutoBet ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {nonStopAutoBet ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  အကယ်၍ ဖွင့်ထားပါက Win Profit ရရှိပြီး Auto bet ရပ်တန့်သွားပြီးနောက် သတ်မှတ်ထားသော <strong className="text-amber-300 font-mono">{Math.floor(nonStopWaitSeconds / 60) > 0 ? `${Math.floor(nonStopWaitSeconds / 60)} မိနစ် ` : ''}{nonStopWaitSeconds % 60} စက္ကန့် ({nonStopWaitSeconds}s)</strong> အကြာတွင် Auto Bet စနစ် အလိုအလျောက် Auto Start ပြန်လည်ဖြစ်စေပါမည်။
                </p>

                {/* Wait time presets in modal */}
                <div className="pt-2 border-t border-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      စောင့်ဆိုင်းချိန် (Wait Time Preset):
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {nonStopWaitSeconds}s
                    </span>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { label: '30s', val: 30 },
                      { label: '60s (1m)', val: 60 },
                      { label: '95s (1m 35s)', val: 95 },
                      { label: '120s (2m)', val: 120 },
                      { label: '180s (3m)', val: 180 },
                      { label: '300s (5m)', val: 300 }
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => {
                          setNonStopWaitSeconds(p.val);
                          setCustomWaitInput(String(p.val));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                          nonStopWaitSeconds === p.val
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-slate-400">စိတ်ကြိုက် (Custom):</span>
                    <input
                      type="number"
                      min="5"
                      max="3600"
                      value={customWaitInput}
                      onChange={(e) => {
                        setCustomWaitInput(e.target.value);
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 5) setNonStopWaitSeconds(val);
                      }}
                      className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs font-bold text-center outline-none focus:border-amber-400"
                      placeholder="95"
                    />
                    <span className="text-xs font-mono text-slate-400">စက္ကန့် (seconds)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsRiskModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow"
              >
                သတ်မှတ်ချက်များ သိမ်းဆည်းမည် (Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL 3: SHWELOTTERY GAME LOGIN CHANGE                                 */}
      {/* ========================================================================= */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-amber-500/30">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-tech text-base font-bold text-white">
                    SHWELOTTERY GAME LOGIN
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ဖုန်းနံပါတ်နှင့် စကားဝှက် ပြောင်းလဲ၍ Login ဝင်ရောက်ပါ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAccountLoginSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                  ဖုန်းနံပါတ် (Myanmar Phone):
                </label>
                <input
                  type="text"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-amber-400 outline-none"
                  placeholder="09798023829"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                  စကားဝှက် (Password):
                </label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-amber-400 outline-none"
                  placeholder="166061kp"
                />
              </div>

              {loginFeedback && (
                <div className={`p-2.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
                  loginFeedback.success
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputPhone('9798023829');
                    setInputPassword('166061kp');
                  }}
                  className="text-xs text-amber-400 underline font-mono"
                >
                  Default အကောင့်သုံးမည်
                </button>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs shadow flex items-center gap-1.5"
                >
                  {isLoggingIn && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isLoggingIn ? 'Login ဝင်နေပါသည်...' : 'Login ဝင်မည်'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
