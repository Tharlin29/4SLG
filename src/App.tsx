/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Crosshair, 
  ShieldCheck, 
  Coins, 
  Globe, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Layers, 
  Monitor, 
  Activity,
  Zap,
  Sparkles,
  Info,
  Clock,
  Key,
  Gamepad2,
  Bot,
  Table,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  Cpu,
  Brain,
  Sliders,
  X
} from 'lucide-react';
import { FloatingPredator } from './components/FloatingPredator';
import { PlayableGameStation } from './components/PlayableGameStation';
import { WingoGameBoard } from './components/WingoGameBoard';
import { AdminPanel } from './components/AdminPanel';
import { ShweLotteryStatus } from './components/ShweLotteryStatus';
import { UserCoinModal } from './components/UserCoinModal';
import { WingoDraw, PredictionResult, ShweAccount, UserAccessState, AlgorithmType, AllMethodsStats, AutoSwitchEvent, AiFormula, BettingEngineMode, ScatterAlarmEvent } from './types/lottery';
import { calculateAutoGuess, calculateAllPredictions, calculateInitialMethodStats, updateMethodStatsWithResult, evaluateAutoSwitch } from './utils/predictionEngine';
import { playWinSound, playRadarLockSound, playTickSound, playAdminUnlockedSound, playSlotScatterSound, playSniperStrikeSound, playFound3LoseMethodVoice, playStartBettingVoice } from './utils/audio';
import { MultiMethodBenchmarkBar } from './components/MultiMethodBenchmarkBar';
import { AiFormulaPanel } from './components/AiFormulaPanel';
import { AiModeSwitcherBar } from './components/AiModeSwitcherBar';
import { Sniper6LossPanel } from './components/Sniper6LossPanel';
import { generateAiFormulaFromHistory, isFormulaExpired } from './utils/aiFormulaEngine';
import { checkScatterAlarmTrigger } from './utils/sniper6LossEngine';

export default function App() {
  // Navigation tabs: 'PLAY' (Default playable console), 'WEBVIEW' (shwelottery.net), 'HISTORY'
  const [activeTab, setActiveTab] = useState<'PLAY' | 'WEBVIEW' | 'HISTORY'>('PLAY');

  // Game Type Selector: 1 = Win Go 1Min (60s), 30 = Win Go 30s
  const [selectedTypeId, setSelectedTypeId] = useState<number>(1);

  // Wingo Live Game State
  const [history, setHistory] = useState<WingoDraw[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>(''); // Active ongoing period on website
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Win/Loss statistics
  const [winCount, setWinCount] = useState<number>(18);
  const [lossCount, setLossCount] = useState<number>(2);

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // ShweLottery Account State (Phone: 9798023829, Pass: 166061kp)
  const [account, setAccount] = useState<ShweAccount>({
    phone: '9798023829',
    password: '166061kp',
    isConnected: true,
    latencyMs: 34,
    lastPing: Date.now(),
    targetUrl: 'https://www.shwelottery.net/',
    nickName: 'MemberNNG0XDE5',
    amount: '1,000.00'
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // User Access & Admin State (ADMIN BYPASSES ALL TIME LIMITS)
  const [userAccess, setUserAccess] = useState<UserAccessState>({
    isAdmin: false,
    timeCoins: 5,
    remainingSeconds: 1800, // 30 minutes for normal user
    unlimitedTime: false
  });

  // Modal dialog states
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState<boolean>(false);

  // AI Sensitivity setting & Model Selection (Meta-Consensus Super AI as default premier method)
  const [sensitivity, setSensitivity] = useState<'BALANCED' | 'AGGRESSIVE' | 'HIGH_CONFIDENCE'>('BALANCED');
  const [aiAlgorithm, setAiAlgorithm] = useState<AlgorithmType>('META_SUPER_AI');

  // Multi-Method Real-Time Benchmarking & Adaptive Auto-Switching States
  const [methodStats, setMethodStats] = useState<AllMethodsStats>(() => calculateInitialMethodStats([]));
  const [methodPredictions, setMethodPredictions] = useState<Record<AlgorithmType, PredictionResult> | null>(null);
  const [isAutoSwitchEnabled, setIsAutoSwitchEnabled] = useState<boolean>(true);
  const [autoSwitchEvent, setAutoSwitchEvent] = useState<AutoSwitchEvent | null>(null);
  const [isAutoBotActive, setIsAutoBotActive] = useState<boolean>(false);
  const [isPredatorVisible, setIsPredatorVisible] = useState<boolean>(true);

  // AI 10-Minutes Formula Generator State (runs concurrently in background)
  const [aiFormula, setAiFormula] = useState<AiFormula | null>(null);
  const [pendingFormulaToApply, setPendingFormulaToApply] = useState<AiFormula | null>(null);
  const aiFormulaRef = useRef<AiFormula | null>(null);

  // Active Betting Engine Mode ('FORMULA_MODE' | 'METHODS_7_MODE' | 'SNIPER_6LOSS_MODE')
  const [bettingEngineMode, setBettingEngineMode] = useState<BettingEngineMode>('METHODS_7_MODE');
  const bettingEngineModeRef = useRef<BettingEngineMode>(bettingEngineMode);

  // 4-Loss / 6-Loss Sniper Wait & Strike Engine State (Background continuous scan)
  const [scatterAlarmEvent, setScatterAlarmEvent] = useState<ScatterAlarmEvent | null>(null);
  const [sniperLockedAlgo, setSniperLockedAlgo] = useState<AlgorithmType | null>(null);
  const [autoBetTrigger, setAutoBetTrigger] = useState<{ id: number; mode: BettingEngineMode; threshold?: 4 | 5 | 6 } | null>(null);
  const lastScatterTriggerRef = useRef<string>('');

  // Collapsible Secondary Dashboards (Default: ALL false / title-only, so LIVE AUTO MONITORING DASHBOARD is the primary main focus)
  const [expandedDashboards, setExpandedDashboards] = useState<{
    formula: boolean;
    benchmark: boolean;
    modeSwitcher: boolean;
    sniper: boolean;
    gateway: boolean;
  }>({
    formula: false,
    benchmark: false,
    modeSwitcher: false,
    sniper: false,
    gateway: false,
  });

  const toggleDashboard = (key: keyof typeof expandedDashboards) => {
    setExpandedDashboards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Tracking refs to accurately detect draw transitions
  const lastDrawnPeriodRef = useRef<string>('');
  const lastPredictedPeriodRef = useRef<string>('');
  const currentPredictionRef = useRef<PredictionResult | null>(null);
  const aiAlgorithmRef = useRef<AlgorithmType>(aiAlgorithm);
  const isAutoSwitchEnabledRef = useRef<boolean>(isAutoSwitchEnabled);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const activeMethodPredictionsRef = useRef<{
    targetPeriod: string;
    predictions: Record<AlgorithmType, PredictionResult>;
  } | null>(null);
  const bootstrappedHistoryRef = useRef<boolean>(false);
  const userConsecutiveLossesRef = useRef<number>(0);

  // Copy helper state
  const [copiedLogin, setCopiedLogin] = useState(false);

  useEffect(() => {
    currentPredictionRef.current = prediction;
  }, [prediction]);

  useEffect(() => {
    aiAlgorithmRef.current = aiAlgorithm;
  }, [aiAlgorithm]);

  useEffect(() => {
    isAutoSwitchEnabledRef.current = isAutoSwitchEnabled;
  }, [isAutoSwitchEnabled]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    aiFormulaRef.current = aiFormula;
  }, [aiFormula]);

  useEffect(() => {
    bettingEngineModeRef.current = bettingEngineMode;
  }, [bettingEngineMode]);

  // Background 10-minute Formula cycle runner (runs concurrently whether user plays or not)
  useEffect(() => {
    const formulaInterval = setInterval(() => {
      if (history && history.length > 0) {
        if (!aiFormulaRef.current || isFormulaExpired(aiFormulaRef.current)) {
          const freshFormula = generateAiFormulaFromHistory(history, aiFormulaRef.current);
          setAiFormula(freshFormula);
          aiFormulaRef.current = freshFormula;
        }
      }
    }, 10000);

    return () => clearInterval(formulaInterval);
  }, [history]);

  const handleApplyAiFormula = (formula: AiFormula) => {
    setBettingEngineMode('FORMULA_MODE');
    setAiAlgorithm(formula.recommendedMethod);
    aiAlgorithmRef.current = formula.recommendedMethod;
    setAiFormula(formula);
    aiFormulaRef.current = formula;
    setPendingFormulaToApply({ ...formula });
  };

  const handleRefreshAiFormula = () => {
    if (history && history.length > 0) {
      const freshFormula = generateAiFormulaFromHistory(history, aiFormulaRef.current);
      setAiFormula(freshFormula);
      aiFormulaRef.current = freshFormula;
    }
  };

  // Main Data Fetcher function
  const fetchWingoData = async (typeIdToFetch = selectedTypeId) => {
    try {
      const res = await fetch(`/api/shwelottery/wingo-history?typeid=${typeIdToFetch}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          const freshHistory: WingoDraw[] = data.history;
          setHistory(freshHistory);

          // Bootstrap initial backtested track record from available real history
          if (!bootstrappedHistoryRef.current && freshHistory.length >= 8) {
            bootstrappedHistoryRef.current = true;
            const initialBacktested = calculateInitialMethodStats(freshHistory, sensitivity);
            setMethodStats(initialBacktested);
          }

          // Bootstrap or refresh 10-minute AI Formula based on recent history
          if (!aiFormulaRef.current || isFormulaExpired(aiFormulaRef.current)) {
            const initialFormula = generateAiFormulaFromHistory(freshHistory, aiFormulaRef.current);
            setAiFormula(initialFormula);
            aiFormulaRef.current = initialFormula;
          }

          // The active period currently open on shwelottery.net
          const activePeriod = data.currentBettingPeriod || data.currentPeriod;
          setCurrentPeriod(activePeriod);
          setSecondsLeft(data.secondsLeft);

          if (data.session) {
            setAccount((prev) => ({
              ...prev,
              nickName: data.session.nickName || prev.nickName,
              amount: data.session.amount || prev.amount,
              userId: data.session.userId || prev.userId
            }));
          }

          // Check if a new draw was completed since our last check!
          const latestCompleted = freshHistory[0];
          if (latestCompleted && latestCompleted.period !== lastDrawnPeriodRef.current) {
            // 1. Concurrently evaluate all 3 algorithms for this completed draw (runs even if user doesn't bet)
            const targetPreds = activeMethodPredictionsRef.current?.targetPeriod === latestCompleted.period
              ? activeMethodPredictionsRef.current.predictions
              : calculateAllPredictions(freshHistory.slice(1), latestCompleted.period, sensitivity);

            setMethodStats((prevStats) => {
              const updated = updateMethodStatsWithResult(prevStats, targetPreds, latestCompleted);

              // 2. 4-Loss / 5-Loss / 6-Loss Sniper Wait & Strike Engine Background Evaluation
              // User requirement: Method 7 မျိုးထဲမှ 4 ကြိမ်ဆက်တိုက်ရှုံးသော METHOD ကို AI မှ Auto ရှာနေမည် ရပြီဆိုလျှင် အဲ့ဒီ method တမျိုးတည်းကို သုံးပြီး တခြားဘယ် METHOD ကိုမှမသုံးဘဲ win မဖြစ်မချင်း BET မည်
              // START BET ACTIVE ဖြစ်သည်နှင့်တပြိုင်နက် ALARM SOUND အနေဖြင့် HEY! NOW I AM START BETTING ကို use ပြီး signal ပြပေးမည်
              const currentThreshold: 4 | 5 | 6 = bettingEngineModeRef.current === 'SNIPER_6LOSS_MODE' 
                ? 6 
                : bettingEngineModeRef.current === 'SNIPER_5LOSS_MODE' 
                ? 5 
                : 4;
              const scatterEvent = checkScatterAlarmTrigger(updated, latestCompleted.period, lastScatterTriggerRef, currentThreshold);
              if (scatterEvent) {
                setScatterAlarmEvent(scatterEvent);
                if (soundEnabledRef.current) {
                  if (scatterEvent.level === 'START_BET_ACTIVE_4') {
                    // User requirement: "START BET ACTIVE ဖြစ်သည်နှင့်တပြိုင်နက် ALARM SOUND အနေဖြင့် HEY! NOW I AM START BETTING ကို use ပြီး signal ပြပေးပါ"
                    playStartBettingVoice();
                  } else if (scatterEvent.level === 'FOUND_3_LOSS') {
                    // User requirement: 3 ကြိမ် ဆက်တိုက်ရှုံးနေတာ တွေ့ပြီဆိုရင် "I found 3 lose method" Voice Alarm
                    playFound3LoseMethodVoice();
                  } else if (scatterEvent.level === 'WARNING_4') {
                    playSlotScatterSound();
                  } else if (scatterEvent.level === 'LOCKED_5' || scatterEvent.level === 'LOCKED_6' || scatterEvent.level === 'LOCKED_4') {
                    playSniperStrikeSound();
                  }
                }
                if (
                  scatterEvent.level === 'START_BET_ACTIVE_4' || 
                  scatterEvent.level === 'LOCKED_4' || 
                  scatterEvent.level === 'LOCKED_5' || 
                  scatterEvent.level === 'LOCKED_6'
                ) {
                  setSniperLockedAlgo(scatterEvent.algorithm);
                  if (
                    bettingEngineModeRef.current === 'SNIPER_4LOSS_MODE' ||
                    bettingEngineModeRef.current === 'SNIPER_5LOSS_MODE' || 
                    bettingEngineModeRef.current === 'SNIPER_6LOSS_MODE'
                  ) {
                    setAiAlgorithm(scatterEvent.algorithm);
                    aiAlgorithmRef.current = scatterEvent.algorithm;
                  }
                }
              }

              // 3. Evaluate Dynamic AI Smart Auto-Switch (User lose % များနေလျှင် Win % အမြင့်ဆုံးသို့ AI မှ Auto change လုပ်ပေးခြင်း)
              // Only active when NOT in SNIPER mode (sniper mode locks onto 4-loss, 5-loss, or 6-loss method exclusively until win)
              if (
                isAutoSwitchEnabledRef.current && 
                bettingEngineModeRef.current !== 'SNIPER_4LOSS_MODE' &&
                bettingEngineModeRef.current !== 'SNIPER_5LOSS_MODE' && 
                bettingEngineModeRef.current !== 'SNIPER_6LOSS_MODE'
              ) {
                const switchResult = evaluateAutoSwitch(aiAlgorithmRef.current, updated, true, userConsecutiveLossesRef.current);
                if (switchResult.shouldSwitch) {
                  const prevAlgo = aiAlgorithmRef.current;
                  setAiAlgorithm(switchResult.bestAlgo);
                  aiAlgorithmRef.current = switchResult.bestAlgo;

                  setAutoSwitchEvent({
                    fromAlgo: prevAlgo,
                    toAlgo: switchResult.bestAlgo,
                    fromWinRate: updated[prevAlgo]?.winRate || 0,
                    toWinRate: updated[switchResult.bestAlgo]?.winRate || 0,
                    reason: switchResult.reason,
                    timestamp: Date.now()
                  });

                  if (soundEnabledRef.current) {
                    playRadarLockSound();
                  }
                }
              }

              return updated;
            });

            // Track AI prediction model accuracy (Mute 'You Win' and confetti here: only actual user winning bets trigger 'You Win')
            if (lastDrawnPeriodRef.current !== '' && currentPredictionRef.current) {
              if (currentPredictionRef.current.targetPeriod === latestCompleted.period) {
                const won = currentPredictionRef.current.size === latestCompleted.size;
                if (won) {
                  setWinCount((w) => w + 1);
                } else {
                  setLossCount((l) => l + 1);
                }
              }
            }
            lastDrawnPeriodRef.current = latestCompleted.period;
          }

          // Generate predictions for the CURRENT ACTIVE period for all 7 algorithms concurrently (Meta Super AI, HMM, Markov, Ensemble, Neural Matrix, N-Gram Sequence, Statistical Probability)
          if (activePeriod && activePeriod !== lastPredictedPeriodRef.current) {
            const allPreds = calculateAllPredictions(freshHistory, activePeriod, sensitivity);
            setMethodPredictions(allPreds);
            activeMethodPredictionsRef.current = { targetPeriod: activePeriod, predictions: allPreds };

            const currentSelected = allPreds[aiAlgorithmRef.current] || allPreds['META_SUPER_AI'] || allPreds['NEURAL_MATRIX'] || allPreds['HMM'];
            setPrediction(currentSelected);
            lastPredictedPeriodRef.current = activePeriod;
            if (soundEnabledRef.current) playRadarLockSound();
          }
        }
      }
    } catch (e) {
      // Graceful retry on transient network reconnection
      console.warn('Wingo history sync retry:', e);
    }
  };

  useEffect(() => {
    lastDrawnPeriodRef.current = '';
    lastPredictedPeriodRef.current = '';
    fetchWingoData(selectedTypeId);
  }, [selectedTypeId, sensitivity, aiAlgorithm]);

  // Recalculate prediction immediately when AI model changes
  useEffect(() => {
    if (methodPredictions && methodPredictions[aiAlgorithm]) {
      setPrediction(methodPredictions[aiAlgorithm]);
    } else if (history.length > 0 && currentPeriod) {
      const newPred = calculateAutoGuess(history, currentPeriod, sensitivity, aiAlgorithm);
      setPrediction(newPred);
      lastPredictedPeriodRef.current = currentPeriod;
    }
  }, [aiAlgorithm, methodPredictions]);

  // Poller: Keeps timer and period locked to shwelottery.net
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchWingoData(selectedTypeId);
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedTypeId]);

  // 1-Second Local Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextVal = prev <= 1 ? 0 : prev - 1;

        if (soundEnabled && nextVal <= 5 && nextVal > 0) {
          playTickSound();
        }

        if (nextVal === 0) {
          fetchWingoData(selectedTypeId);
        }

        return nextVal;
      });

      // Deduct regular user timer ONLY if user is NOT admin
      setUserAccess((prev) => {
        if (prev.isAdmin || prev.unlimitedTime) {
          return prev;
        }

        if (prev.remainingSeconds > 0) {
          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1
          };
        } else if (prev.timeCoins > 0) {
          return {
            ...prev,
            timeCoins: prev.timeCoins - 1,
            remainingSeconds: 360
          };
        } else {
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [soundEnabled, selectedTypeId]);

  // Admin Login Handler (Passcode: 166061kp)
  const handleAdminLogin = (passcode: string): boolean => {
    const validCodes = ['166061kp', '166061', 'admin888', 'shwe999'];
    if (validCodes.includes(passcode.trim())) {
      setUserAccess((prev) => ({
        ...prev,
        isAdmin: true,
        unlimitedTime: true,
        timeCoins: 9999,
        remainingSeconds: 999999
      }));
      if (soundEnabled) {
        playAdminUnlockedSound();
      }
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setUserAccess((prev) => ({
      ...prev,
      isAdmin: false,
      unlimitedTime: false,
      timeCoins: 3,
      remainingSeconds: 600
    }));
  };

  const handleAddUserCoins = (coins: number, minutes: number) => {
    setUserAccess((prev) => ({
      ...prev,
      timeCoins: prev.timeCoins + coins,
      remainingSeconds: prev.remainingSeconds + (minutes * 60)
    }));
  };

  const handleRedeemCode = async (code: string) => {
    try {
      const res = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        handleAddUserCoins(data.coinsAdded || 20, data.minutesAdded || 60);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'ကုဒ်မမှန်ကန်ပါ။' };
    } catch (e) {
      return { success: false, message: 'စနစ်ချိတ်ဆက်မှု မအောင်မြင်ပါ။' };
    }
  };

  const handleRefreshLogin = async (phone: string, pass: string): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/shwelottery/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccount({
          phone: phone,
          password: pass,
          isConnected: true,
          latencyMs: data.connection?.latencyMs || 34,
          lastPing: Date.now(),
          targetUrl: 'https://www.shwelottery.net/',
          nickName: data.account?.nickName || 'MemberNNG0XDE5',
          amount: data.account?.amount || '1,000.00'
        });
        await fetchWingoData(selectedTypeId);
        return { success: true, message: data.message || 'ShweLottery အကောင့်ဖြင့် အောင်မြင်စွာ Login ဝင်ရောက်ပြီးပါပြီ!' };
      } else {
        return { success: false, message: data.message || 'Login မအောင်မြင်ပါ။ ဖုန်းနံပါတ် သို့မဟုတ် စကားဝှက် စစ်ဆေးပါ။' };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || 'ဆာဗာချိတ်ဆက်မှု မအောင်မြင်ပါ။' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 1-Click Apply AI prediction from Floating Predator to Play Station
  const handleApplyAiFromPredator = () => {
    setActiveTab('PLAY');
  };

  const handleActivateSniper = (threshold: 4 | 5 | 6 = 4) => {
    const mode: BettingEngineMode = threshold === 4 
      ? 'SNIPER_4LOSS_MODE' 
      : threshold === 6 
      ? 'SNIPER_6LOSS_MODE' 
      : 'SNIPER_5LOSS_MODE';
    setBettingEngineMode(mode);
    bettingEngineModeRef.current = mode;
    setIsAutoBotActive(true);
    setAutoBetTrigger({ id: Date.now(), mode, threshold });
    setActiveTab('PLAY');
    if (threshold === 4) {
      try {
        playStartBettingVoice();
      } catch {}
    } else {
      try {
        playSniperStrikeSound();
      } catch {}
    }
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText('Phone: 9798023829\nPassword: 166061kp');
    setCopiedLogin(true);
    setTimeout(() => setCopiedLogin(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* FLOATING PREDATOR HUD WIDGET (DRAGGABLE OVERLAY OVER ALL VIEWS) */}
      {isPredatorVisible && (
        <FloatingPredator
          prediction={prediction}
          secondsLeft={secondsLeft}
          currentPeriod={currentPeriod}
          nextPeriod={currentPeriod}
          selectedTypeId={selectedTypeId}
          onChangeTypeId={(id) => setSelectedTypeId(id)}
          lastDrawnItem={history[0] || null}
          history={history}
          userAccess={userAccess}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenRecharge={() => setIsRechargeOpen(true)}
          onApplyAiBet={handleApplyAiFromPredator}
          winCount={winCount}
          lossCount={lossCount}
          aiAlgorithm={aiAlgorithm}
          onChangeAiAlgorithm={setAiAlgorithm}
          methodStats={methodStats}
          methodPredictions={methodPredictions}
          isAutoSwitchEnabled={isAutoSwitchEnabled}
          onToggleAutoSwitch={() => setIsAutoSwitchEnabled(!isAutoSwitchEnabled)}
          autoSwitchEvent={autoSwitchEvent}
          activeFormula={aiFormula}
          onApplyFormula={handleApplyAiFormula}
          bettingEngineMode={bettingEngineMode}
          onSelectMode={setBettingEngineMode}
          activeScatterAlarm={scatterAlarmEvent}
          onDismissScatterAlarm={() => setScatterAlarmEvent(null)}
          onActivateSniper={handleActivateSniper}
          onActivateSniperAutoBet={handleActivateSniper}
          onClose={() => setIsPredatorVisible(false)}
        />
      )}

      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Crosshair className="w-6 h-6 stroke-[2.5] animate-pulse" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-tech text-base sm:text-lg font-black tracking-wider text-white">
                  FLOATING AI PREDATOR
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {selectedTypeId === 30 ? 'WINGO 30S' : 'WINGO 60S (1M)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Target Prediction & Live Play • Synchronized with shwelottery.net
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('PLAY')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'PLAY'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Auto Bot Station (အော်တိုကစားမည်)
            </button>

            <button
              onClick={() => setActiveTab('WEBVIEW')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'WEBVIEW'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ShweLottery</span> Web View
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Draw History
            </button>
          </div>

          {/* Right Header Status Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin VIP / Time Coins */}
            {userAccess.isAdmin ? (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 text-xs hover:bg-red-600/30 transition-all font-mono"
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span className="font-bold">ADMIN VIP</span>
                <span className="hidden md:inline text-[10px] text-red-200">(Time Skip Active)</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRechargeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs hover:border-amber-500/40 transition-all font-mono"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold">{userAccess.timeCoins}</span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">Coins</span>
              </button>
            )}

            {/* Floating Predator HUD Toggle */}
            <button
              onClick={() => setIsPredatorVisible(!isPredatorVisible)}
              className={`p-2 rounded-xl border transition-all ${
                isPredatorVisible
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={isPredatorVisible ? 'Floating AI Predator HUD ပိတ်ရန် (Hide HUD)' : 'Floating AI Predator HUD ဖွင့်ရန် (Show HUD)'}
            >
              <Crosshair className={`w-4 h-4 ${isPredatorVisible ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title={soundEnabled ? 'Mute' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Admin Entry Button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
              title="Admin Panel"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        
        {/* TOP ALARM NOTIFICATION (User requirement: 4 ကြိမ် ဆက်တိုက်ရှုံးသော METHOD ကို AI မှ Auto ရှာနေမည် ရပြီဆိုလျှင် "HEY! NOW I AM START BETTING" Alarm ဖြင့် Signal ပြပေးမည်) */}
        {scatterAlarmEvent && (
          <div className={`p-3.5 sm:p-4 rounded-2xl border-2 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in ${
            scatterAlarmEvent.level === 'START_BET_ACTIVE_4'
              ? 'bg-gradient-to-r from-emerald-950/90 via-rose-950/90 to-slate-950/90 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/50'
              : scatterAlarmEvent.level === 'FOUND_3_LOSS'
              ? 'bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-slate-950/90 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
              : scatterAlarmEvent.level === 'LOCKED_5' || scatterAlarmEvent.level === 'LOCKED_6' || scatterAlarmEvent.level === 'LOCKED_4'
              ? 'bg-gradient-to-r from-rose-950/90 via-red-950/80 to-slate-950/90 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
              : 'bg-gradient-to-r from-rose-950/80 via-amber-950/80 to-slate-950/90 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                scatterAlarmEvent.level === 'START_BET_ACTIVE_4'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-bounce'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}>
                <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-full shadow ${
                    scatterAlarmEvent.level === 'START_BET_ACTIVE_4'
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-black animate-pulse'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black'
                  }`}>
                    {scatterAlarmEvent.level === 'START_BET_ACTIVE_4'
                      ? `🚨 START BET ACTIVE: "HEY! NOW I AM START BETTING" (${scatterAlarmEvent.consecutiveLosses}/4)`
                      : scatterAlarmEvent.level === 'FOUND_3_LOSS'
                      ? `🔊 I FOUND 3 LOSE METHOD (${scatterAlarmEvent.consecutiveLosses}/5)`
                      : scatterAlarmEvent.level === 'LOCKED_4'
                      ? `🎯 4-LOSS SNIPER LOCK (${scatterAlarmEvent.consecutiveLosses}/4)`
                      : scatterAlarmEvent.level === 'LOCKED_5'
                      ? `🎯 5-LOSS SNIPER LOCK (${scatterAlarmEvent.consecutiveLosses}/5)`
                      : scatterAlarmEvent.level === 'LOCKED_6'
                      ? `🎯 6-LOSS SNIPER LOCK (${scatterAlarmEvent.consecutiveLosses}/6)`
                      : `🎰 SLOT SCATTER SIGNAL (${scatterAlarmEvent.consecutiveLosses})`}
                  </span>
                  <span className="font-tech text-xs text-white font-bold">
                    Period #{scatterAlarmEvent.period ? scatterAlarmEvent.period.slice(-5) : 'LIVE'}
                  </span>
                </div>
                <p className="text-xs font-sans text-slate-200 mt-1 font-bold">
                  {scatterAlarmEvent.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  if (scatterAlarmEvent.level === 'START_BET_ACTIVE_4') {
                    playStartBettingVoice();
                  } else if (scatterAlarmEvent.level === 'FOUND_3_LOSS') {
                    playFound3LoseMethodVoice();
                  } else {
                    playSlotScatterSound();
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 cursor-pointer ${
                  scatterAlarmEvent.level === 'START_BET_ACTIVE_4'
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>
                  {scatterAlarmEvent.level === 'START_BET_ACTIVE_4'
                    ? '"Start Betting" အသံ'
                    : scatterAlarmEvent.level === 'FOUND_3_LOSS'
                    ? 'Voice အသံ'
                    : 'Alarm အသံ'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpandedDashboards(prev => ({ ...prev, sniper: true }));
                  const targetThresh: 4 | 5 | 6 = scatterAlarmEvent.consecutiveLosses >= 6 
                    ? 6 
                    : scatterAlarmEvent.consecutiveLosses === 5 
                    ? 5 
                    : 4;
                  handleActivateSniper(targetThresh);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-white font-tech font-black text-xs shadow cursor-pointer ${
                  scatterAlarmEvent.level === 'START_BET_ACTIVE_4'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                    : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500'
                }`}
              >
                🎯 Sniper Auto Bet ဖွင့်မည်
              </button>
              <button
                type="button"
                onClick={() => setScatterAlarmEvent(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COLLAPSIBLE DASHBOARDS & BANNERS (SHOWN AS TITLE-ONLY, CLICK TO EXPAND)   */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          {/* 1. 10-MINUTES AI FORMULA ENGINE TITLE BAR */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleDashboard('formula')}
              className="w-full p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-850/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide">
                      🧬 AI HISTORY SEARCH & 10-MINUTES FORMULA ENGINE
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      {aiFormula?.code || 'ACTIVE'} ({aiFormula?.expectedWinRate || 95}% Win)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Game History ပေါ်အခြေခံထားသော ၁၀ မိနစ် Formula နှင့် စိတ်ကြိုက် Bet / Win Stop / Lose Stop စည်းမျဉ်းများ (နှိပ်၍ အသေးစိတ် ကြည့်ရှုနိုင်ပါသည်)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-amber-400 font-bold hidden md:inline">
                  {expandedDashboards.formula ? 'အသေးစိတ် ပြန်ပိတ်မည်' : 'အသေးစိတ် ဖွင့်ကြည့်မည်'}
                </span>
                <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                  {expandedDashboards.formula ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {expandedDashboards.formula && (
              <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 animate-in fade-in">
                <AiFormulaPanel
                  formula={aiFormula}
                  onRefreshFormula={handleRefreshAiFormula}
                  onApplyFormula={handleApplyAiFormula}
                  isAutoBetActive={isAutoBotActive}
                  currentAlgorithm={aiAlgorithm}
                  historyCount={history.length}
                  bettingEngineMode={bettingEngineMode}
                />
              </div>
            )}
          </div>

          {/* 2. 7-METHOD MULTI-AI BENCHMARK & CONSENSUS RADAR TITLE BAR */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/90 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleDashboard('benchmark')}
              className="w-full p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-855 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide">
                      ⚡ 7 ALGORITHMS PERFORMANCE BENCHMARK & AUTO-SWITCH
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      7 METHODS LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    နည်းပညာ ၇ မျိုး၏ Real-Time Win Rate စာရင်း၊ တပြိုင်နက် ခန့်မှန်းချက်များနှင့် ၂ ကြိမ်ရှုံး AI Auto-Switch (နှိပ်၍ အသေးစိတ် ကြည့်ရှုနိုင်ပါသည်)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-cyan-400 font-bold hidden md:inline">
                  {expandedDashboards.benchmark ? 'အသေးစိတ် ပြန်ပိတ်မည်' : 'အသေးစိတ် ဖွင့်ကြည့်မည်'}
                </span>
                <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                  {expandedDashboards.benchmark ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {expandedDashboards.benchmark && (
              <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 animate-in fade-in">
                <MultiMethodBenchmarkBar
                  stats={methodStats}
                  currentAlgorithm={aiAlgorithm}
                  onSelectAlgorithm={(algo) => {
                    setBettingEngineMode('METHODS_7_MODE');
                    setAiAlgorithm(algo);
                  }}
                  isAutoSwitchEnabled={isAutoSwitchEnabled}
                  onToggleAutoSwitch={() => setIsAutoSwitchEnabled(!isAutoSwitchEnabled)}
                  autoSwitchEvent={autoSwitchEvent}
                  onDismissAutoSwitch={() => setAutoSwitchEvent(null)}
                  predictions={methodPredictions}
                  nextPeriod={currentPeriod}
                  isUserPlaying={activeTab === 'PLAY'}
                  bettingEngineMode={bettingEngineMode}
                />
              </div>
            )}
          </div>

          {/* 3. DUAL-MODE / MULTI-MODE BETTING ENGINE SELECTOR TITLE BAR */}
          <div className="rounded-xl border border-purple-500/30 bg-slate-900/90 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleDashboard('modeSwitcher')}
              className="w-full p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-855 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide">
                      🔀 MULTI-MODE BETTING ENGINE SELECTOR & STATUS
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      bettingEngineMode === 'SNIPER_4LOSS_MODE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : bettingEngineMode === 'SNIPER_6LOSS_MODE' || bettingEngineMode === 'SNIPER_5LOSS_MODE'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : bettingEngineMode === 'FORMULA_MODE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      ACTIVE: {
                        bettingEngineMode === 'SNIPER_4LOSS_MODE'
                          ? '⭐ 4-LOSS SNIPER'
                          : bettingEngineMode === 'SNIPER_6LOSS_MODE'
                          ? '🎯 6-LOSS SNIPER'
                          : bettingEngineMode === 'SNIPER_5LOSS_MODE'
                          ? '🎯 5-LOSS SNIPER'
                          : bettingEngineMode === 'FORMULA_MODE'
                          ? '🧬 10-MIN FORMULA'
                          : '⚡ 7-METHOD MULTI-AI'
                      }
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    10-Min Formula၊ နည်းပညာ ၇ မျိုး Multi-AI နှင့် ၄/၆ ကြိမ်ရှုံး Sniper စနစ်များ အကြား စိတ်ကြိုက် ကူးပြောင်းထိန်းချုပ်မှု (နှိပ်၍ အသေးစိတ် ကြည့်ရှုနိုင်ပါသည်)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-purple-400 font-bold hidden md:inline">
                  {expandedDashboards.modeSwitcher ? 'အသေးစိတ် ပြန်ပိတ်မည်' : 'အသေးစိတ် ဖွင့်ကြည့်မည်'}
                </span>
                <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                  {expandedDashboards.modeSwitcher ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {expandedDashboards.modeSwitcher && (
              <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 animate-in fade-in">
                <AiModeSwitcherBar
                  currentMode={bettingEngineMode}
                  onSelectMode={setBettingEngineMode}
                  activeFormula={aiFormula}
                  currentAlgorithm={aiAlgorithm}
                  methodStats={methodStats}
                  isAutoBetActive={isAutoBotActive}
                  onApplyFormula={handleApplyAiFormula}
                  onSelectAlgorithm={(algo) => {
                    setBettingEngineMode('METHODS_7_MODE');
                    setAiAlgorithm(algo);
                  }}
                />
              </div>
            )}
          </div>

          {/* 4. 4-LOSS / 6-LOSS SNIPER WAIT & STRIKE ENGINE TITLE BAR */}
          <div className="rounded-xl border border-rose-500/30 bg-slate-900/90 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleDashboard('sniper')}
              className="w-full p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-855 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                  <Crosshair className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide">
                      🎯 4-LOSS / 5-LOSS / 6-LOSS SNIPER WAIT & STRIKE ENGINE
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      bettingEngineMode === 'SNIPER_4LOSS_MODE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-400/50'
                        : bettingEngineMode === 'SNIPER_5LOSS_MODE' || bettingEngineMode === 'SNIPER_6LOSS_MODE'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-400/50'
                        : scatterAlarmEvent
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {bettingEngineMode === 'SNIPER_4LOSS_MODE'
                        ? '⭐ 4-LOSS SNIPER ACTIVE'
                        : bettingEngineMode === 'SNIPER_5LOSS_MODE'
                        ? '🎯 5-LOSS SNIPER ACTIVE'
                        : bettingEngineMode === 'SNIPER_6LOSS_MODE'
                        ? '🎯 6-LOSS SNIPER ACTIVE'
                        : scatterAlarmEvent?.level === 'START_BET_ACTIVE_4'
                        ? `🚨 START BET ACTIVE (${scatterAlarmEvent.consecutiveLosses}/4)`
                        : scatterAlarmEvent?.level === 'FOUND_3_LOSS'
                        ? `🚨 3-LOSS ALARM (${scatterAlarmEvent.consecutiveLosses}/5)`
                        : scatterAlarmEvent?.level === 'LOCKED_4'
                        ? `🎯 4-LOSS LOCKED (100% READY)`
                        : scatterAlarmEvent?.level === 'LOCKED_5'
                        ? `🎯 5-LOSS LOCKED (100% READY)`
                        : scatterAlarmEvent
                        ? `🚨 SCATTER ALARM (${scatterAlarmEvent.consecutiveLosses}/6)`
                        : 'SCANNING FOR 4-LOSS METHODS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Method ၇ မျိုးထဲမှ ၄ ကြိမ်ရှုံးသော Method အား ရှာဖွေပြီး Win မဖြစ်မချင်း တမျိုးတည်း သီးသန့်လောင်း၍ Win လျှင်ရပ်ပြီး ပြန်စောင့်သော စနစ် ("HEY! NOW I AM START BETTING" Voice Alarm ပါဝင်သည်)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-rose-400 font-bold hidden md:inline">
                  {expandedDashboards.sniper ? 'အသေးစိတ် ပြန်ပိတ်မည်' : 'အသေးစိတ် ဖွင့်ကြည့်မည်'}
                </span>
                <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                  {expandedDashboards.sniper ? <ChevronUp className="w-4 h-4 text-rose-400" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {expandedDashboards.sniper && (
              <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 animate-in fade-in">
                <Sniper6LossPanel
                  stats={methodStats}
                  currentMode={bettingEngineMode}
                  onSelectMode={setBettingEngineMode}
                  isAutoBetActive={isAutoBotActive}
                  onActivateSniperAutoBet={handleActivateSniper}
                  onStopSniperAutoBet={() => setIsAutoBotActive(false)}
                  activeScatterAlarm={scatterAlarmEvent}
                  onDismissScatterAlarm={() => setScatterAlarmEvent(null)}
                  sniperLockedAlgo={sniperLockedAlgo}
                />
              </div>
            )}
          </div>

          {/* 4. SHWELOTTERY GATEWAY & SESSION STATUS TITLE BAR */}
          <div className="rounded-xl border border-emerald-500/30 bg-slate-900/90 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleDashboard('gateway')}
              className="w-full p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-855 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide">
                      🔗 OFFICIAL SHWELOTTERY GATEWAY & CONNECTION STATUS
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      account.isConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {account.isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'} • {account.latencyMs}ms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Official ShweLottery API Session၊ အကောင့်လက်ကျန်ငွေ၊ User ID နှင့် ဆာဗာ Ping အခြေအနေ (နှိပ်၍ အသေးစိတ် ကြည့်ရှုနိုင်ပါသည်)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-emerald-400 font-bold hidden md:inline">
                  {expandedDashboards.gateway ? 'အသေးစိတ် ပြန်ပိတ်မည်' : 'အသေးစိတ် ဖွင့်ကြည့်မည်'}
                </span>
                <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                  {expandedDashboards.gateway ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {expandedDashboards.gateway && (
              <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 animate-in fade-in">
                <ShweLotteryStatus
                  account={account}
                  onRefreshLogin={handleRefreshLogin}
                  isSyncing={isSyncing}
                />
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: INTERACTIVE PLAY STATION (USER CAN PLAY WHILE PREDATOR FLOATS) */}
        {activeTab === 'PLAY' && (
          <PlayableGameStation
            currentPeriod={currentPeriod}
            secondsLeft={secondsLeft}
            soundEnabled={soundEnabled}
            history={history}
            prediction={prediction}
            account={account}
            selectedTypeId={selectedTypeId}
            onChangeTypeId={(id) => setSelectedTypeId(id)}
            onRefreshSession={() => fetchWingoData(selectedTypeId)}
            onApplyAiGuess={handleApplyAiFromPredator}
            onRefreshLogin={handleRefreshLogin}
            aiAlgorithm={aiAlgorithm}
            onChangeAiAlgorithm={(algo) => {
              setBettingEngineMode('METHODS_7_MODE');
              setAiAlgorithm(algo);
            }}
            methodStats={methodStats}
            isAutoSwitchEnabled={isAutoSwitchEnabled}
            onToggleAutoSwitch={() => setIsAutoSwitchEnabled(!isAutoSwitchEnabled)}
            autoSwitchEvent={autoSwitchEvent}
            methodPredictions={methodPredictions}
            activeFormula={aiFormula}
            pendingFormula={pendingFormulaToApply}
            onFormulaConsumed={() => setPendingFormulaToApply(null)}
            onApplyFormula={handleApplyAiFormula}
            bettingEngineMode={bettingEngineMode}
            onSelectMode={setBettingEngineMode}
            autoBetTrigger={autoBetTrigger}
            sniperLockedAlgo={sniperLockedAlgo}
            onSniperLockedAlgoChange={setSniperLockedAlgo}
            onAutoBetActiveChange={(active) => {
              setIsAutoBotActive((prev) => (prev !== active ? active : prev));
            }}
            onAutoMonitoringChange={(state) => {
              userConsecutiveLossesRef.current = state.consecutiveLosses;
            }}
          />
        )}

        {/* TAB 2: EMBEDDED SHWELOTTERY WEB VIEW */}
        {activeTab === 'WEBVIEW' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  Official ShweLottery Web View (https://www.shwelottery.net/)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  အောက်ပါ Web View ပေါ်တွင် Floating AI Predator ဝစ်ဂျက်သည် လွတ်လပ်စွာ ပျံဝဲနေမည်ဖြစ်ပြီး ဂိမ်းကစားရာတွင် တွဲဖက်ကြည့်ရှုနိုင်ပါသည်။
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyCredentials}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 flex items-center gap-1.5"
                >
                  {copiedLogin ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLogin ? 'Copied Login!' : 'Copy Login (09××××××××)'}</span>
                </button>

                <a
                  href="https://www.shwelottery.net/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
              </div>
            </div>

            {/* Embedded Iframe Container */}
            <div className="w-full h-[750px] rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-slate-950 shadow-2xl relative">
              <iframe
                src="https://www.shwelottery.net/"
                className="w-full h-full border-none"
                title="ShweLottery Official Website"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          </div>
        )}

        {/* TAB 3: DRAW HISTORY & STATS */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-6">
            <WingoGameBoard
              history={history}
              currentPeriod={currentPeriod}
              nextPeriod={currentPeriod}
              secondsLeft={secondsLeft}
              prediction={prediction}
              winCount={winCount}
              lossCount={lossCount}
              selectedTypeId={selectedTypeId}
              onChangeTypeId={(id) => setSelectedTypeId(id)}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Floating AI Predator v4.2 • ShweLottery Official Gateway Stream</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Target URL: https://www.shwelottery.net/ • ShweLottery Official Stream
        </p>
      </footer>

      {/* ADMIN CONTROL MODAL */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        userAccess={userAccess}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
        onAddUserCoins={handleAddUserCoins}
        sensitivity={sensitivity}
        onChangeSensitivity={setSensitivity}
        onResetStats={() => { setWinCount(0); setLossCount(0); }}
        onForceSync={() => fetchWingoData(selectedTypeId)}
      />

      {/* TIME COIN RECHARGE MODAL */}
      <UserCoinModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        userAccess={userAccess}
        onRedeemCode={handleRedeemCode}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
}
