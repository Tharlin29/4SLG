import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Crosshair, 
  Minimize2, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Zap, 
  Lock, 
  Unlock, 
  Flame, 
  ArrowRight, 
  X,
  Crown,
  TrendingUp,
  Radio,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Target,
  Cpu
} from 'lucide-react';
import { PredictionResult, WingoDraw, AlgorithmType, AllMethodsStats, AutoSwitchEvent, UserAccessState, AiFormula, BettingEngineMode, ScatterAlarmEvent } from '../types/lottery';

interface FloatingPredatorProps {
  prediction: PredictionResult | null;
  secondsLeft: number;
  currentPeriod: string;
  nextPeriod?: string;
  selectedTypeId?: number;
  onChangeTypeId?: (id: number) => void;
  lastDrawnItem?: WingoDraw | null;
  history?: WingoDraw[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  aiAlgorithm?: AlgorithmType;
  onChangeAiAlgorithm?: (algo: AlgorithmType) => void;
  methodStats?: AllMethodsStats;
  methodPredictions?: Record<AlgorithmType, PredictionResult> | null;
  isAutoSwitchEnabled?: boolean;
  onToggleAutoSwitch?: () => void;
  autoSwitchEvent?: AutoSwitchEvent | null;
  onApplyAiBet?: () => void;
  onClose?: () => void;
  activeFormula?: AiFormula | null;
  onApplyFormula?: (formula: AiFormula) => void;
  bettingEngineMode?: BettingEngineMode;
  onSelectMode?: (mode: BettingEngineMode) => void;
  activeScatterAlarm?: ScatterAlarmEvent | null;
  onDismissScatterAlarm?: () => void;
  onActivateSniper?: () => void;
  onActivateSniperAutoBet?: (threshold: 4 | 5 | 6) => void;
  // Optional for backward compatibility with App
  userAccess?: UserAccessState;
  onOpenAdmin?: () => void;
  onOpenRecharge?: () => void;
  winCount?: number;
  lossCount?: number;
}

interface MethodMetadata {
  id: AlgorithmType;
  name: string;
  burmeseName: string;
  shortCode: string;
  badgeColor: string;
}

const METHOD_METADATA: Record<AlgorithmType, MethodMetadata> = {
  META_SUPER_AI: {
    id: 'META_SUPER_AI',
    name: 'Meta-Consensus Super AI',
    burmeseName: 'နည်းပညာ ၆ မျိုးပေါင်းစပ် Consensus',
    shortCode: 'META-AI',
    badgeColor: 'from-amber-400 to-yellow-500 text-black',
  },
  NEURAL_MATRIX: {
    id: 'NEURAL_MATRIX',
    name: 'Deep Pattern AI',
    burmeseName: 'Deep Pattern Neural Matrix',
    shortCode: 'NEURAL',
    badgeColor: 'from-fuchsia-500 to-pink-500 text-white',
  },
  NGRAM_SEQUENCE: {
    id: 'NGRAM_SEQUENCE',
    name: '3-Gram / N-Gram',
    burmeseName: 'Sequence & Pattern Recognition',
    shortCode: 'N-GRAM',
    badgeColor: 'from-emerald-400 to-teal-500 text-black',
  },
  STATISTICAL_PROB: {
    id: 'STATISTICAL_PROB',
    name: 'Statistical & Prob',
    burmeseName: 'စာရင်းအင်းနှင့် ဖြစ်တန်စွမ်းတွက်နည်း',
    shortCode: 'STATS',
    badgeColor: 'from-blue-500 to-cyan-400 text-white',
  },
  ENSEMBLE: {
    id: 'ENSEMBLE',
    name: 'Ensemble Consensus',
    burmeseName: 'HMM + Markov ပေါင်းစပ်မဲပေးစနစ်',
    shortCode: 'ENSEMBLE',
    badgeColor: 'from-cyan-400 to-sky-500 text-black',
  },
  HMM: {
    id: 'HMM',
    name: 'HMM Model (v3.0)',
    burmeseName: 'Hidden Markov Regime',
    shortCode: 'HMM',
    badgeColor: 'from-amber-500 to-orange-500 text-black',
  },
  MARKOV: {
    id: 'MARKOV',
    name: 'Markov Chain',
    burmeseName: 'Markov Harmonic Matrix',
    shortCode: 'MARKOV',
    badgeColor: 'from-purple-500 to-indigo-500 text-white',
  },
};

export const FloatingPredator: React.FC<FloatingPredatorProps> = ({
  prediction,
  secondsLeft,
  currentPeriod,
  nextPeriod,
  selectedTypeId = 1,
  onChangeTypeId,
  lastDrawnItem,
  history = [],
  soundEnabled,
  onToggleSound,
  aiAlgorithm = 'META_SUPER_AI',
  onChangeAiAlgorithm,
  methodStats,
  methodPredictions,
  isAutoSwitchEnabled = true,
  onToggleAutoSwitch,
  autoSwitchEvent,
  onApplyAiBet,
  onClose,
  activeFormula,
  onApplyFormula,
  bettingEngineMode = 'METHODS_7_MODE',
  onSelectMode,
  activeScatterAlarm,
  onDismissScatterAlarm,
  onActivateSniper,
  onActivateSniperAutoBet,
}) => {
  const [isMinimized, setIsMinimized] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  });
  const [isPinned, setIsPinned] = useState(false);

  // Dragging coordinates
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { x: 10, y: 75 };
    }
    return { x: 24, y: 110 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 110
  });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPinned) return;
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const w = widgetRef.current?.offsetWidth || 340;
      const h = widgetRef.current?.offsetHeight || 200;
      const maxX = Math.max(0, window.innerWidth - w - 8);
      const maxY = Math.max(0, window.innerHeight - h - 8);
      const newX = Math.max(8, Math.min(maxX, dragStartRef.current.posX + dx));
      const newY = Math.max(8, Math.min(maxY, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const dx = touch.clientX - dragStartRef.current.startX;
      const dy = touch.clientY - dragStartRef.current.startY;
      const w = widgetRef.current?.offsetWidth || 340;
      const h = widgetRef.current?.offsetHeight || 200;
      const maxX = Math.max(0, window.innerWidth - w - 8);
      const maxY = Math.max(0, window.innerHeight - h - 8);
      const newX = Math.max(8, Math.min(maxX, dragStartRef.current.posX + dx));
      const newY = Math.max(8, Math.min(maxY, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchcancel', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [isDragging]);

  // Rank all 7 methods based on past history performance
  const allAlgos: AlgorithmType[] = ['META_SUPER_AI', 'NEURAL_MATRIX', 'NGRAM_SEQUENCE', 'STATISTICAL_PROB', 'ENSEMBLE', 'HMM', 'MARKOV'];

  const rankedMethods = useMemo(() => {
    return [...allAlgos].map((algo) => {
      const stats = methodStats ? methodStats[algo] : null;
      const pred = methodPredictions ? methodPredictions[algo] : null;
      const meta = METHOD_METADATA[algo];
      const winRate = stats?.winRate ?? 85.0;
      const streak = stats?.streak ?? 0;
      const wins = stats?.wins ?? 0;
      const losses = stats?.losses ?? 0;
      const total = stats?.total ?? 0;

      // Composite historical signal score
      const signalScore = winRate * 0.7 + (streak > 0 ? streak * 2.5 : streak * 1.5);

      let signalTier: 'STRONG' | 'ACTIVE' | 'COOLING' = 'ACTIVE';
      if (winRate >= 90 || streak >= 4) {
        signalTier = 'STRONG';
      } else if (winRate < 75 || streak <= -2) {
        signalTier = 'COOLING';
      }

      return {
        algo,
        meta,
        stats,
        pred,
        winRate,
        streak,
        wins,
        losses,
        total,
        signalScore,
        signalTier
      };
    }).sort((a, b) => b.signalScore - a.signalScore);
  }, [allAlgos, methodStats, methodPredictions]);

  // The Top Recommended Method based on historical draw analysis
  const recommended = rankedMethods[0];
  const recommendedPred = recommended?.pred || prediction;

  const targetPeriodFormatted = currentPeriod ? currentPeriod.slice(-5) : '';

  return (
    <div
      ref={widgetRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        zIndex: 50,
      }}
      className="fixed top-0 left-0 select-none z-50 will-change-transform"
    >
      {/* MINIMIZED FLOATING RADAR PILL */}
      {isMinimized ? (
        <div 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 bg-slate-950/95 border-2 border-amber-500/80 rounded-full px-3.5 py-2 shadow-2xl backdrop-blur-md cursor-pointer hover:border-amber-400 hover:scale-105 transition-all group"
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400">
            <Radio className="w-4 h-4 animate-pulse text-amber-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                {recommended?.meta.shortCode || 'AI SIGNAL'}
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1 rounded border border-emerald-500/40">
                {recommended?.winRate}% WIN
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white">
                {secondsLeft}s
              </span>
              {recommendedPred && (
                <span className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                  recommendedPred.size === 'BIG' ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                }`}>
                  {recommendedPred.size === 'BIG' ? 'ကြီး (BIG)' : 'ငယ် (SMALL)'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
              className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700"
              title="Expand Method Signal Radar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1 rounded-full text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-700"
                title="Close Radar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* EXPANDED AI METHOD SIGNAL RADAR HUD */
        <div className="w-[calc(100vw-20px)] max-w-[370px] rounded-2xl bg-slate-950/95 border-2 border-amber-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden ring-1 ring-amber-500/30">
          
          {/* DRAG HEADER */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-amber-500/30 cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Target className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-tech text-xs font-black tracking-widest text-amber-400">
                    AI METHOD SIGNAL RADAR
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <span>#{currentPeriod ? currentPeriod.slice(-5) : '...'}</span>
                  <span>•</span>
                  <span className={`font-bold ${secondsLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {secondsLeft}s left
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPinned ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isPinned ? 'Pinned (နေရာအတည်တကျဖြစ်နေသည်)' : 'Pin position'}
              >
                {isPinned ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onToggleSound}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title={soundEnabled ? 'Mute Alert' : 'Unmute Sound'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Minimize Widget"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Hide Widget"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* MULTI-MODE SWITCHER IN FLOATING RADAR HUD */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[10px]">
            <span className="font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <span>MODE:</span>
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  onSelectMode?.('FORMULA_MODE');
                  if (activeFormula && onApplyFormula) onApplyFormula(activeFormula);
                }}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-all flex items-center gap-1 ${
                  bettingEngineMode === 'FORMULA_MODE'
                    ? 'bg-amber-500 text-black shadow ring-1 ring-amber-300'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>10-MIN</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode?.('METHODS_7_MODE')}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-all flex items-center gap-1 ${
                  bettingEngineMode === 'METHODS_7_MODE'
                    ? 'bg-cyan-500 text-black shadow ring-1 ring-cyan-300'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-2.5 h-2.5" />
                <span>၇ မျိုး</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectMode?.('SNIPER_4LOSS_MODE');
                  onActivateSniperAutoBet?.(4);
                  onActivateSniper?.();
                }}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-all flex items-center gap-1 ${
                  bettingEngineMode === 'SNIPER_4LOSS_MODE'
                    ? 'bg-rose-500 text-white shadow ring-1 ring-rose-300 animate-pulse'
                    : 'bg-slate-800 text-rose-300 hover:text-white'
                }`}
              >
                <Crosshair className="w-2.5 h-2.5" />
                <span>⭐ 4-SNIPER</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectMode?.('SNIPER_5LOSS_MODE');
                  onActivateSniper?.();
                }}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-all flex items-center gap-1 ${
                  bettingEngineMode === 'SNIPER_5LOSS_MODE'
                    ? 'bg-red-500 text-white shadow ring-1 ring-red-300'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Crosshair className="w-2.5 h-2.5" />
                <span>5-SNIPER</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectMode?.('SNIPER_6LOSS_MODE');
                  onActivateSniper?.();
                }}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-all flex items-center gap-1 ${
                  bettingEngineMode === 'SNIPER_6LOSS_MODE'
                    ? 'bg-purple-500 text-white shadow ring-1 ring-purple-300'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Crosshair className="w-2.5 h-2.5" />
                <span>6-SNIPER</span>
              </button>
            </div>
          </div>

          {/* MAIN RADAR BODY: HISTORY-BASED SIGNAL RECOMMENDATION */}
          <div className="p-3 space-y-2.5 max-h-[75vh] overflow-y-auto">
            
            {/* 3-LOSS VOICE / 4-LOSS START BET ACTIVE / SCATTER ALARM STRIP IN RADAR */}
            {activeScatterAlarm && (
              <div className={`p-2.5 rounded-xl border shadow space-y-1.5 animate-pulse ${
                activeScatterAlarm.level === 'START_BET_ACTIVE_4'
                  ? 'bg-gradient-to-r from-rose-950/95 via-amber-950/90 to-slate-950 border-rose-400 ring-1 ring-rose-400/80 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : activeScatterAlarm.level === 'FOUND_3_LOSS' || activeScatterAlarm.level === 'LOCKED_5'
                  ? 'bg-gradient-to-r from-red-950/90 via-orange-950/80 to-slate-950 border-red-400'
                  : 'bg-gradient-to-r from-purple-950/80 via-amber-950/80 to-slate-950 border-purple-400'
              }`}>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    {activeScatterAlarm.level === 'START_BET_ACTIVE_4' ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                        <span className="text-rose-300">🚨 START BET ACTIVE: "HEY! NOW I AM START BETTING" ({activeScatterAlarm.consecutiveLosses}/4)</span>
                      </>
                    ) : activeScatterAlarm.level === 'FOUND_3_LOSS' || activeScatterAlarm.level === 'LOCKED_5' ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
                        <span className="text-yellow-300">🔊 I FOUND 3 LOSE METHOD ({activeScatterAlarm.consecutiveLosses}/5)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>🎰 SLOT SCATTER ({activeScatterAlarm.consecutiveLosses}/6)</span>
                      </>
                    )}
                  </span>
                  <span className="text-white font-bold">
                    #{activeScatterAlarm.period ? activeScatterAlarm.period.slice(-5) : 'LIVE'}
                  </span>
                </div>
                <div className="text-[11px] font-sans font-bold text-slate-100">
                  {activeScatterAlarm.message}
                </div>
                <div className="flex items-center justify-between gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const threshold: 4 | 5 | 6 = activeScatterAlarm.level === 'START_BET_ACTIVE_4'
                        ? 4
                        : (activeScatterAlarm.level === 'FOUND_3_LOSS' || activeScatterAlarm.level === 'LOCKED_5')
                        ? 5
                        : 6;
                      const mode = threshold === 4 ? 'SNIPER_4LOSS_MODE' : threshold === 6 ? 'SNIPER_6LOSS_MODE' : 'SNIPER_5LOSS_MODE';
                      onSelectMode?.(mode);
                      if (onActivateSniperAutoBet) {
                        onActivateSniperAutoBet(threshold);
                      } else {
                        onActivateSniper?.();
                      }
                    }}
                    className="px-2 py-1 rounded bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-tech font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>🎯 {activeScatterAlarm.level === 'START_BET_ACTIVE_4' ? '4-Loss Sniper Bet စတင်မည်' : activeScatterAlarm.level === 'FOUND_3_LOSS' ? '5-Loss Sniper ဖွင့်မည်' : 'Sniper စနစ်ဖွင့်မည်'}</span>
                  </button>
                  {onDismissScatterAlarm && (
                    <button
                      type="button"
                      onClick={onDismissScatterAlarm}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                    >
                      ပိတ်မည်
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* HERO CARD: TOP RECOMMENDED METHOD ACCORDING TO PAST DRAW HISTORY */}
            {recommended && (
              <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 p-3 shadow-lg space-y-2">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-[11px] font-black font-tech tracking-wider text-amber-300 uppercase">
                      အကြံပြုထားသော အကောင်းဆုံး METHOD
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow">
                    🔥 STRONG SIGNAL
                  </span>
                </div>

                {/* Method Name & Stats */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-tech font-black text-white flex items-center gap-1.5">
                      <span>{recommended.meta.name}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">
                      {recommended.meta.burmeseName}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-tech font-black text-emerald-400 leading-none block">
                      {recommended.winRate}%
                    </span>
                    <span className="text-[9px] font-mono text-amber-300 font-bold flex items-center justify-end gap-0.5">
                      <Flame className="w-2.5 h-2.5 text-amber-400 fill-current" />
                      +{recommended.streak}W Streak
                    </span>
                  </div>
                </div>

                {/* Live Prediction Output from this Top Method */}
                {recommendedPred && (
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Target #{targetPeriodFormatted}:</span>
                      <span className="text-emerald-400 font-bold">
                        {recommendedPred.confidence}% Accuracy
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black shadow ${
                          recommendedPred.size === 'BIG'
                            ? 'bg-amber-500 text-black'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {recommendedPred.sizeBurmese}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold text-white ${
                          recommendedPred.color === 'RED' ? 'bg-red-600' : recommendedPred.color === 'GREEN' ? 'bg-emerald-600' : 'bg-purple-600'
                        }`}>
                          {recommendedPred.colorBurmese}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        {recommendedPred.numbers.map((n) => (
                          <span
                            key={n}
                            className="w-5 h-5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center border border-slate-700"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Apply / Switch Button */}
                <div className="flex gap-1.5 pt-0.5">
                  {aiAlgorithm !== recommended.algo ? (
                    <button
                      type="button"
                      onClick={() => onChangeAiAlgorithm?.(recommended.algo)}
                      className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-tech font-black text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      <span>ဤ Method သို့ ပြောင်းလဲအသုံးပြုမည်</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>လက်ရှိ အသုံးပြုနေသော Method ဖြစ်ပါသည်</span>
                    </div>
                  )}

                  {onApplyAiBet && (
                    <button
                      type="button"
                      onClick={onApplyAiBet}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] font-bold border border-slate-700 flex items-center gap-1"
                      title="Apply Bet"
                    >
                      <span>လောင်းမည်</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 10-MINUTES AI FORMULA SIGNAL STRIP */}
            {activeFormula && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-950/30 border border-amber-500/40 space-y-1.5 shadow">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>10-MIN AI FORMULA:</span>
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    {activeFormula.expectedWinRate}% WIN
                  </span>
                </div>

                <div className="text-[11px] font-sans font-bold text-white line-clamp-1">
                  {activeFormula.burmeseTitle}
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[9px] font-mono text-slate-400 truncate">
                    {activeFormula.recommendedMethod} • {activeFormula.recommendedMultiplier}× Mult
                  </span>

                  {onApplyFormula && (
                    <button
                      type="button"
                      onClick={() => onApplyFormula(activeFormula)}
                      className="px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-tech font-black text-[10px] flex items-center gap-1 shadow active:scale-95 shrink-0 cursor-pointer"
                    >
                      <span>🎮 FORMULA ဖြင့် ကစားမည်</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* RADAR RANKING LIST OF ALL 7 METHODS (BASED ON HISTORY) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400 uppercase">
                <span className="flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3 h-3 text-amber-400" />
                  HISTORY METHOD RANKING (စွမ်းဆောင်ရည်အလိုက် အဆင့်များ)
                </span>
                <span>WIN %</span>
              </div>

              <div className="space-y-1">
                {rankedMethods.map((item, idx) => {
                  const isActive = aiAlgorithm === item.algo;
                  const isTop = idx === 0;

                  return (
                    <div
                      key={item.algo}
                      onClick={() => onChangeAiAlgorithm?.(item.algo)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800/80'
                      }`}
                    >
                      {/* Left: Rank & Method Info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${
                          isTop
                            ? 'bg-amber-500 text-black shadow'
                            : idx < 3
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-slate-950 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-tech text-xs font-bold text-white truncate">
                              {item.meta.shortCode}
                            </span>
                            {isTop && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                                RECOM
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 truncate block">
                            {item.meta.name}
                          </span>
                        </div>
                      </div>

                      {/* Right: Guess & Win Rate */}
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        {item.pred && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.pred.size === 'BIG'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {item.pred.size === 'BIG' ? 'ကြီး' : 'ငယ်'}
                          </span>
                        )}

                        <div className="text-right min-w-[50px]">
                          <span className="text-xs font-mono font-bold text-emerald-400 block leading-tight">
                            {item.winRate}%
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {item.streak >= 0 ? `+${item.streak}W` : `${item.streak}L`}
                          </span>
                        </div>

                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AUTO-SWITCH NOTIFICATION & STATUS */}
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-sans text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>၂ ကြိမ် Lose ကာကွယ်မှု</strong>: ၂ ကြိမ်ဆက်တိုက် ရှုံးပါက Win Rate အများဆုံး Method သို့ AI မှ Auto ချက်ချင်း ပြောင်းပါမည်
                </span>
              </div>
              {onToggleAutoSwitch && (
                <button
                  type="button"
                  onClick={onToggleAutoSwitch}
                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                    isAutoSwitchEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-950'
                  }`}
                >
                  {isAutoSwitchEnabled ? 'AUTO: ON' : 'AUTO: OFF'}
                </button>
              )}
            </div>

            {/* Quick Auto-Switch Recent Alert */}
            {autoSwitchEvent && (
              <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono text-amber-300 flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Auto-swapped to: <strong>{autoSwitchEvent.toAlgo}</strong> ({autoSwitchEvent.toWinRate}%)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
