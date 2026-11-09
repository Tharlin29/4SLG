import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  RotateCw, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  Layers, 
  Play, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Brain,
  Crosshair,
  Sliders,
  Target,
  ShieldAlert,
  RotateCcw,
  Plus,
  Minus,
  Coins
} from 'lucide-react';
import { AiFormula, AlgorithmType, BettingEngineMode } from '../types/lottery';
import { getFormulaRemainingSeconds } from '../utils/aiFormulaEngine';

interface AiFormulaPanelProps {
  formula: AiFormula | null;
  onRefreshFormula: () => void;
  onApplyFormula: (formula: AiFormula) => void;
  isAutoBetActive: boolean;
  currentAlgorithm: AlgorithmType;
  historyCount: number;
  bettingEngineMode?: BettingEngineMode;
}

const BASE_STAKE_PRESETS = [10, 50, 100, 500, 1000, 2000, 5000];
const WIN_STOP_PRESETS = [5000, 10000, 20000, 30000, 50000, 100000];
const LOSE_STOP_PRESETS = [5000, 10000, 15000, 20000, 30000, 50000];
const MULTIPLIER_PRESETS = [2, 3, 4];

export const AiFormulaPanel: React.FC<AiFormulaPanelProps> = ({
  formula,
  onRefreshFormula,
  onApplyFormula,
  isAutoBetActive,
  currentAlgorithm,
  historyCount,
  bettingEngineMode = 'METHODS_7_MODE'
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => getFormulaRemainingSeconds(formula));
  const [isRulesExpanded, setIsRulesExpanded] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // User customizable Formula parameters
  const [customBaseStake, setCustomBaseStake] = useState<number>(() => formula?.recommendedBaseStake || 10);
  const [customBaseStakeInput, setCustomBaseStakeInput] = useState<string>(() => String(formula?.recommendedBaseStake || 10));
  
  const [customMultiplier, setCustomMultiplier] = useState<number>(() => formula?.recommendedMultiplier || 2);
  const [customMultiplierInput, setCustomMultiplierInput] = useState<string>(() => String(formula?.recommendedMultiplier || 2));
  
  const [customWinStop, setCustomWinStop] = useState<number>(() => formula?.recommendedWinStop || 10000);
  const [customWinStopInput, setCustomWinStopInput] = useState<string>(() => String(formula?.recommendedWinStop || 10000));
  const [customWinStopEnabled, setCustomWinStopEnabled] = useState<boolean>(true);

  const [customLoseStop, setCustomLoseStop] = useState<number>(() => formula?.recommendedLoseStop || 10000);
  const [customLoseStopInput, setCustomLoseStopInput] = useState<string>(() => String(formula?.recommendedLoseStop || 10000));
  const [customLoseStopEnabled, setCustomLoseStopEnabled] = useState<boolean>(true);

  const [hasCustomized, setHasCustomized] = useState<boolean>(false);

  // Sync with new AI formula recommendation only if user hasn't explicitly customized
  useEffect(() => {
    if (formula && !hasCustomized) {
      setCustomBaseStake(formula.recommendedBaseStake);
      setCustomBaseStakeInput(String(formula.recommendedBaseStake));
      setCustomMultiplier(formula.recommendedMultiplier);
      setCustomMultiplierInput(String(formula.recommendedMultiplier));
      setCustomWinStop(formula.recommendedWinStop);
      setCustomWinStopInput(String(formula.recommendedWinStop));
      setCustomLoseStop(formula.recommendedLoseStop);
      setCustomLoseStopInput(String(formula.recommendedLoseStop));
    }
  }, [formula?.id]);

  // Countdown timer for the 30-minute formula refresh
  useEffect(() => {
    const timer = setInterval(() => {
      if (formula) {
        const remaining = getFormulaRemainingSeconds(formula);
        setSecondsRemaining(remaining);
        if (remaining <= 0) {
          onRefreshFormula();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [formula, onRefreshFormula]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Reset parameters to AI's calculated recommendations
  const handleResetToAiDefaults = () => {
    if (!formula) return;
    setCustomBaseStake(formula.recommendedBaseStake);
    setCustomBaseStakeInput(String(formula.recommendedBaseStake));
    setCustomMultiplier(formula.recommendedMultiplier);
    setCustomMultiplierInput(String(formula.recommendedMultiplier));
    setCustomWinStop(formula.recommendedWinStop);
    setCustomWinStopInput(String(formula.recommendedWinStop));
    setCustomWinStopEnabled(true);
    setCustomLoseStop(formula.recommendedLoseStop);
    setCustomLoseStopInput(String(formula.recommendedLoseStop));
    setCustomLoseStopEnabled(true);
    setHasCustomized(false);
  };

  // Base Stake Handlers
  const handleSelectBaseStake = (amount: number) => {
    setCustomBaseStake(amount);
    setCustomBaseStakeInput(String(amount));
    setHasCustomized(true);
  };

  const handleBaseStakeInputChange = (val: string) => {
    setCustomBaseStakeInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomBaseStake(parsed);
      setHasCustomized(true);
    }
  };

  const handleAdjustBaseStake = (delta: number) => {
    const current = customBaseStake || 10;
    const next = Math.max(1, current + delta);
    setCustomBaseStake(next);
    setCustomBaseStakeInput(String(next));
    setHasCustomized(true);
  };

  // Win Stop Handlers
  const handleSelectWinStop = (amount: number) => {
    setCustomWinStop(amount);
    setCustomWinStopInput(String(amount));
    setCustomWinStopEnabled(true);
    setHasCustomized(true);
  };

  const handleWinStopInputChange = (val: string) => {
    setCustomWinStopInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomWinStop(parsed);
      setHasCustomized(true);
    }
  };

  // Lose Stop Handlers
  const handleSelectLoseStop = (amount: number) => {
    setCustomLoseStop(amount);
    setCustomLoseStopInput(String(amount));
    setCustomLoseStopEnabled(true);
    setHasCustomized(true);
  };

  const handleLoseStopInputChange = (val: string) => {
    setCustomLoseStopInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomLoseStop(parsed);
      setHasCustomized(true);
    }
  };

  // Multiplier Handlers
  const handleSelectMultiplier = (mult: number) => {
    setCustomMultiplier(mult);
    setCustomMultiplierInput(String(mult));
    setHasCustomized(true);
  };

  const handleMultiplierInputChange = (val: string) => {
    setCustomMultiplierInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 1) {
      setCustomMultiplier(parsed);
      setHasCustomized(true);
    }
  };

  const handleApplyClick = () => {
    if (!formula) return;
    setIsApplying(true);

    const customizedFormula: AiFormula = {
      ...formula,
      recommendedBaseStake: customBaseStake,
      recommendedMultiplier: customMultiplier,
      recommendedWinStop: customWinStop,
      recommendedLoseStop: customLoseStop,
      winStopEnabled: customWinStopEnabled,
      loseStopEnabled: customLoseStopEnabled,
      isCustomized: hasCustomized
    };

    onApplyFormula(customizedFormula);
    setTimeout(() => setIsApplying(false), 1200);
  };

  if (!formula) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center animate-pulse">
        <Sparkles className="w-5 h-5 text-amber-400 mx-auto animate-spin mb-2" />
        <span className="text-xs font-mono text-slate-300">
          Game Website History များကို AI မှ Search လုပ်ပြီး 10-Min Formula တွက်ထုတ်နေပါသည်...
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 border-2 border-amber-500/40 shadow-2xl overflow-hidden ring-1 ring-amber-500/20">
      
      {/* HEADER BAR: 10-MINUTE CYCLE RADAR */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-lg shadow-amber-500/30 shrink-0">
            <Brain className="w-5 h-5 stroke-[2.2] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping"></span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-tech text-sm sm:text-base font-black text-white tracking-wider">
                AI HISTORY SEARCH & 10-MINUTES FORMULA ENGINE
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE BACKGROUND RUNNING
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
              Game Website ၏ လတ်တလောထွက်ရှိခဲ့သော History များကို AI မှ အမြဲတစေ Search လုပ်ပြီး ၁၀ မိနစ်ပြည့်တိုင်း အကောင်းဆုံး Formula အသစ်ကို အလိုအလျောက် ထုတ်ပေးပါသည်
            </p>
          </div>
        </div>

        {/* 10-MIN COUNTDOWN CLOCK & REFRESH ACTION */}
        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                NEXT FORMULA IN:
              </span>
              <span className="font-tech text-sm sm:text-base font-black text-amber-400 tracking-widest leading-none">
                {timeFormatted}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefreshFormula}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow active:scale-95"
            title="ချက်ချင်း Formula အသစ် ရှာဖွေထုတ်မည် (Instant Search & Generate)"
          >
            <RotateCw className="w-4 h-4 text-amber-400 hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* MAIN FORMULA BODY */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* FORMULA HERO BANNER */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 p-4 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow">
                {formula.code}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">
                (History {formula.sampleHistorySize} ပွဲ စစ်ဆေးပြီး)
              </span>
              {hasCustomized ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sliders className="w-2.5 h-2.5" />
                  စိတ်ကြိုက်ပြင်ဆင်ထားသည် (CUSTOMIZED)
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  AI မူလအကြံပြုချက် (AI DEFAULTS)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">EXPECTED WIN RATE:</span>
              <span className="font-tech text-base font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {formula.expectedWinRate}%
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-tech font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{formula.burmeseTitle}</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
              {formula.burmeseDescription}
            </p>
          </div>

          {/* ACTIVE PARAMETERS SPECIFICATION GRID (REFLECTS USER CUSTOM VALUES) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {/* 1. Method */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">
                AI METHOD
              </span>
              <span className="text-xs font-tech font-black text-amber-400 truncate block mt-0.5">
                {formula.recommendedMethod}
              </span>
              <span className="text-[9px] text-slate-500 block">အကြံပြုနည်းပညာ</span>
            </div>

            {/* 2. Base Stake */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              hasCustomized 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">
                  BASE BET
                </span>
                {hasCustomized && <span className="text-[8px] font-mono text-amber-400 font-bold">CUSTOM</span>}
              </div>
              <span className="text-xs font-tech font-black text-white truncate block mt-0.5">
                K {customBaseStake.toLocaleString()} MMK
              </span>
              <span className="text-[9px] text-slate-500 block">စတင်လောင်းကြေး</span>
            </div>

            {/* 3. Multiplier */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">
                MULTIPLIER
              </span>
              <span className="text-xs font-tech font-black text-emerald-400 truncate block mt-0.5">
                {customMultiplier}× Multiplier
              </span>
              <span className="text-[9px] text-slate-500 block">ရှုံးပါက ဆတိုး</span>
            </div>

            {/* 4. Win Stop */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              customWinStopEnabled
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/90 border-slate-800 text-slate-500'
            }`}>
              <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">
                WIN PROFIT STOP
              </span>
              <span className={`text-xs font-tech font-black truncate block mt-0.5 ${customWinStopEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {customWinStopEnabled ? `+K ${customWinStop.toLocaleString()}` : 'OFF (ပိတ်ထား)'}
              </span>
              <span className="text-[9px] text-slate-500 block">အမြတ်ရပ်တန့်မှု</span>
            </div>

            {/* 5. Lose Stop */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              customLoseStopEnabled
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-900/90 border-slate-800 text-slate-500'
            }`}>
              <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">
                LOSE STOP
              </span>
              <span className={`text-xs font-tech font-black truncate block mt-0.5 ${customLoseStopEnabled ? 'text-rose-400' : 'text-slate-500'}`}>
                {customLoseStopEnabled ? `-K ${customLoseStop.toLocaleString()}` : 'OFF (ပိတ်ထား)'}
              </span>
              <span className="text-[9px] text-slate-500 block">အရှုံးရပ်တန့်မှု</span>
            </div>

            {/* 6. Emergency Auto-Switch */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">
                2-LOSS AUTO-SWITCH
              </span>
              <span className="text-xs font-tech font-black text-cyan-400 truncate block mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                ENABLED
              </span>
              <span className="text-[9px] text-slate-500 block">၂ ကြိမ်ရှုံး AI ပြောင်း</span>
            </div>
          </div>

          {/* COLLAPSIBLE FORMULA STEP-BY-STEP RULES */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsRulesExpanded(!isRulesExpanded)}
              className="text-xs font-mono text-amber-400/90 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Formula ကစားနည်း အသေးစိတ် စည်းမျဉ်းများ ကြည့်ရန်</span>
              {isRulesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isRulesExpanded && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-sans text-slate-300 animate-in fade-in">
                {formula.burmeseRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CUSTOM FORMULA PARAMETERS CONFIGURATION SECTION (USER REQUIREMENT)      */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-amber-500/30 bg-slate-950/90 overflow-hidden shadow-lg">
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h5 className="font-tech text-xs sm:text-sm font-bold text-white tracking-wider">
                FORMULA စိတ်ကြိုက် ပြင်ဆင်သတ်မှတ်မှု (CUSTOM BET, WIN PROFIT STOP & LOSE STOP)
              </h5>
            </div>

            <div className="flex items-center gap-2">
              {hasCustomized && (
                <button
                  type="button"
                  onClick={handleResetToAiDefaults}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 border border-slate-700 transition-all shadow"
                  title="AI ၏ မူလအကြံပြုချက်တန်ဖိုးများအတိုင်း ပြန်လည်ထားရှိမည်"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>AI မူလအတိုင်းပြန်ထားမည်</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                {isSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSettingsOpen && (
            <div className="p-4 space-y-4 font-sans text-xs">
              
              {/* 1. BET (BASE STAKE) CUSTOM SETTINGS */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="font-tech text-xs font-bold text-white uppercase tracking-wider">
                      စတင်လောင်းကြေး (Base Bet Stake)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    လက်ရှိရွေးချယ်ထားသော စတင်ကြေး: <strong className="text-amber-400">K {customBaseStake.toLocaleString()} MMK</strong>
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {BASE_STAKE_PRESETS.map((amt) => {
                    const isSelected = customBaseStake === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectBaseStake(amt)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        K {amt.toLocaleString()}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Number Input & Stepper */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 px-2.5 py-1 w-full max-w-xs focus-within:border-amber-400">
                    <span className="text-slate-400 font-mono mr-1.5">K</span>
                    <input
                      type="number"
                      min="1"
                      step="10"
                      value={customBaseStakeInput}
                      onChange={(e) => handleBaseStakeInputChange(e.target.value)}
                      placeholder="စိတ်ကြိုက်ငွေပမာဏရိုက်ထည့်ပါ..."
                      className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-mono ml-1">MMK</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustBaseStake(-10)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                      title="-10 MMK"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustBaseStake(10)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                      title="+10 MMK"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustBaseStake(100)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 active:scale-95"
                    >
                      +100
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-sans">
                  * ပွဲစတင်ချိန်နှင့် win ဖြစ်ပြီးတိုင်း ဤစတင်လောင်းကြေးဖြင့် ပြန်လည်လောင်းပါမည်။
                </p>
              </div>

              {/* 2. WIN PROFIT STOP CUSTOM SETTINGS */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="font-tech text-xs font-bold text-white uppercase tracking-wider">
                      Win Profit Stop (အမြတ်ငွေ ရပ်တန့်မှု)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      သတ်မှတ်ချက်: <strong className={customWinStopEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                        {customWinStopEnabled ? `+K ${customWinStop.toLocaleString()} MMK` : 'ပိတ်ထားပါသည်'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomWinStopEnabled(!customWinStopEnabled);
                        setHasCustomized(true);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                        customWinStopEnabled
                          ? 'bg-emerald-500 text-black'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {customWinStopEnabled ? 'ဖွင့်ထား (ON)' : 'ပိတ်ထား (OFF)'}
                    </button>
                  </div>
                </div>

                {customWinStopEnabled && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    {/* Preset Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {WIN_STOP_PRESETS.map((amt) => {
                        const isSelected = customWinStop === amt;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleSelectWinStop(amt)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              isSelected
                                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-300'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                            }`}
                          >
                            +K {amt.toLocaleString()}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Input */}
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 px-2.5 py-1 w-full max-w-xs focus-within:border-emerald-400">
                      <span className="text-emerald-400 font-mono mr-1.5">+K</span>
                      <input
                        type="number"
                        min="100"
                        step="1000"
                        value={customWinStopInput}
                        onChange={(e) => handleWinStopInputChange(e.target.value)}
                        placeholder="စိတ်ကြိုက် Target Profit ရိုက်ထည့်ပါ..."
                        className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-mono ml-1">MMK</span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 font-sans">
                  * Auto Bet ကစားနေစဉ် အသားတင်အမြတ်ငွေ သတ်မှတ်ပမာဏ ပြည့်သွားပါက အလိုအလျောက် ရပ်တန့်ပေးမည်ဖြစ်ပါသည်။
                </p>
              </div>

              {/* 3. LOSE STOP CUSTOM SETTINGS */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="font-tech text-xs font-bold text-white uppercase tracking-wider">
                      Lose Stop (အရှုံး ကန့်သတ်ချက် ရပ်တန့်မှု)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      သတ်မှတ်ချက်: <strong className={customLoseStopEnabled ? 'text-rose-400' : 'text-slate-500'}>
                        {customLoseStopEnabled ? `-K ${customLoseStop.toLocaleString()} MMK` : 'ပိတ်ထားပါသည်'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLoseStopEnabled(!customLoseStopEnabled);
                        setHasCustomized(true);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                        customLoseStopEnabled
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {customLoseStopEnabled ? 'ဖွင့်ထား (ON)' : 'ပိတ်ထား (OFF)'}
                    </button>
                  </div>
                </div>

                {customLoseStopEnabled && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    {/* Preset Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {LOSE_STOP_PRESETS.map((amt) => {
                        const isSelected = customLoseStop === amt;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleSelectLoseStop(amt)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              isSelected
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-1 ring-rose-300'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                            }`}
                          >
                            -K {amt.toLocaleString()}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Input */}
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 px-2.5 py-1 w-full max-w-xs focus-within:border-rose-400">
                      <span className="text-rose-400 font-mono mr-1.5">-K</span>
                      <input
                        type="number"
                        min="100"
                        step="1000"
                        value={customLoseStopInput}
                        onChange={(e) => handleLoseStopInputChange(e.target.value)}
                        placeholder="စိတ်ကြိုက် Stop Loss ရိုက်ထည့်ပါ..."
                        className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-mono ml-1">MMK</span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 font-sans">
                  * Auto Bet ကစားနေစဉ် အရှုံးပမာဏ ကန့်သတ်ချက်သို့ ရောက်ရှိပါက အရင်းအနှီးကာကွယ်ရန် အလိုအလျောက် ရပ်တန့်ပေးမည်ဖြစ်ပါသည်။
                </p>
              </div>

              {/* 4. MULTIPLIER (ဆတိုးနှုန်း) SETTINGS */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="font-tech text-xs font-bold text-white uppercase tracking-wider">
                      Stake Multiplier (ရှုံးပါက ဆတိုးနှုန်း)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300">
                    လက်ရှိ: <strong>{customMultiplier}× ဆတိုး</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {MULTIPLIER_PRESETS.map((mult) => {
                    const isSelected = customMultiplier === mult;
                    return (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => handleSelectMultiplier(mult)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-black shadow ring-1 ring-cyan-300'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        {mult}× ဆတိုး
                      </button>
                    );
                  })}

                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 px-2 py-1 w-28 focus-within:border-cyan-400">
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={customMultiplierInput}
                      onChange={(e) => handleMultiplierInputChange(e.target.value)}
                      className="bg-transparent text-white font-mono text-xs w-full text-right focus:outline-none"
                    />
                    <span className="text-slate-400 font-mono ml-1">×</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* PROMINENT "PLAY THIS FORMULA" ACTION BUTTON */}
        <div className="pt-1">
          {isAutoBetActive && bettingEngineMode === 'FORMULA_MODE' ? (
            <div className="w-full py-3.5 px-4 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 font-tech font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <CheckCircle2 className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>
                ✅ 10-MIN FORMULA စနစ်ဖြင့် AUTO BET လတ်တလော ကစားနေပါသည် (Base: K {customBaseStake.toLocaleString()} | {customMultiplier}×)
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={isApplying}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-tech font-black text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98] cursor-pointer"
            >
              {isApplying ? (
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-black animate-spin" />
                  <span>FORMULA ချိန်ညှိနေပါသည်...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 fill-black text-black" />
                    <span>🎮 ဤ FORMULA အတိုင်း ကစားမည်</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-black/15 px-2 py-0.5 rounded-full text-black">
                    (Bet: K {customBaseStake.toLocaleString()} • Win Stop: {customWinStopEnabled ? '+' + customWinStop.toLocaleString() : 'OFF'} • Lose Stop: {customLoseStopEnabled ? '-' + customLoseStop.toLocaleString() : 'OFF'} • {customMultiplier}×)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
