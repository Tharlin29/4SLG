import React, { useState } from 'react';
import { 
  Crosshair, 
  Flame, 
  Volume2, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  Play, 
  RotateCw, 
  Layers,
  Sparkles,
  Target,
  Radio
} from 'lucide-react';
import { AllMethodsStats, AlgorithmType, BettingEngineMode, ScatterAlarmEvent } from '../types/lottery';
import { evaluateAllMethodsLossStreaks } from '../utils/sniper6LossEngine';
import { playSlotScatterSound, playSniperStrikeSound, playFound3LoseMethodVoice, playStartBettingVoice } from '../utils/audio';

interface Sniper6LossPanelProps {
  stats: AllMethodsStats;
  currentMode: BettingEngineMode;
  onSelectMode: (mode: BettingEngineMode) => void;
  isAutoBetActive: boolean;
  onActivateSniperAutoBet?: (threshold?: 4 | 5 | 6) => void;
  onStopSniperAutoBet?: () => void;
  activeScatterAlarm?: ScatterAlarmEvent | null;
  onDismissScatterAlarm?: () => void;
  sniperLockedAlgo?: AlgorithmType | null;
}

export const Sniper6LossPanel: React.FC<Sniper6LossPanelProps> = ({
  stats,
  currentMode,
  onSelectMode,
  isAutoBetActive,
  onActivateSniperAutoBet,
  onStopSniperAutoBet,
  activeScatterAlarm,
  onDismissScatterAlarm,
  sniperLockedAlgo
}) => {
  const [selectedThreshold, setSelectedThreshold] = useState<4 | 5 | 6>(
    currentMode === 'SNIPER_4LOSS_MODE' ? 4 : currentMode === 'SNIPER_6LOSS_MODE' ? 6 : 5
  );

  React.useEffect(() => {
    if (currentMode === 'SNIPER_4LOSS_MODE') {
      setSelectedThreshold(4);
    } else if (currentMode === 'SNIPER_6LOSS_MODE') {
      setSelectedThreshold(6);
    } else if (currentMode === 'SNIPER_5LOSS_MODE') {
      setSelectedThreshold(5);
    }
  }, [currentMode]);

  const evaluation = evaluateAllMethodsLossStreaks(stats, selectedThreshold);
  const isSniper4Active = currentMode === 'SNIPER_4LOSS_MODE';
  const isSniper5Active = currentMode === 'SNIPER_5LOSS_MODE';
  const isSniper6Active = currentMode === 'SNIPER_6LOSS_MODE';
  const isSniperModeActive = isSniper4Active || isSniper5Active || isSniper6Active;

  const handleTestStartBettingVoice = () => {
    try {
      playStartBettingVoice();
    } catch {}
  };

  const handleTestFound3Voice = () => {
    try {
      playFound3LoseMethodVoice();
    } catch {}
  };

  const handleTestScatterSound = () => {
    try {
      playSlotScatterSound();
    } catch {}
  };

  const handleActivate = (threshold: 4 | 5 | 6) => {
    setSelectedThreshold(threshold);
    onSelectMode(threshold === 4 ? 'SNIPER_4LOSS_MODE' : threshold === 6 ? 'SNIPER_6LOSS_MODE' : 'SNIPER_5LOSS_MODE');
    onActivateSniperAutoBet?.(threshold);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 border-2 border-rose-500/40 shadow-2xl overflow-hidden ring-1 ring-rose-500/20 space-y-4">
      
      {/* HEADER BAR */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/30 shrink-0">
            <Crosshair className="w-5 h-5 stroke-[2.2] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-400 border-2 border-slate-950 animate-ping"></span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-tech text-sm sm:text-base font-black text-white tracking-wider">
                4-LOSS / 5-LOSS / 6-LOSS WAIT & STRIKE SNIPER ENGINE
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                BACKGROUND LIVE SCANNING (User ကစားသည်ဖြစ်စေ မကစားသည်ဖြစ်စေ Run ထားသည်)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
              Method ၇ မျိုးထဲမှ ၄ ကြိမ်ဆက်တိုက်ရှုံးသော Method ကို AI မှ အမြဲ Auto ရှာပြီး တွေ့ရှိပါက "HEY! NOW I AM START BETTING" အချက်ပြကာ Win မဖြစ်မချင်း ထို Method တမျိုးတည်း လောင်းပြီး Win လျှင် Bet ရပ်၍ ပြန်လည် wait သော စနစ်
            </p>
          </div>
        </div>

        {/* SOUND TEST BUTTONS & THRESHOLD SWITCHER */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          <button
            type="button"
            onClick={handleTestStartBettingVoice}
            className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold border border-rose-500/50 flex items-center gap-1.5 transition-all shadow active:scale-95 animate-pulse"
            title="4 ကြိမ်ရှုံး Alarm Sound: 'HEY! NOW I AM START BETTING' စမ်းသပ်နားဆင်ရန်"
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-400" />
            <span>🔊 "Start Betting" Alarm</span>
          </button>

          <button
            type="button"
            onClick={handleTestFound3Voice}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-mono font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow active:scale-95"
            title="3 ကြိမ်ရှုံး Voice Alarm: 'I found 3 lose method' စမ်းသပ်နားဆင်ရန်"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>🔊 "I found 3 lose"</span>
          </button>

          <button
            type="button"
            onClick={handleTestScatterSound}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-purple-300 text-xs font-mono font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow active:scale-95"
            title="Slot Scatter Alarm အသံ စမ်းသပ်ရန်"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>🎰 Scatter</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        
        {/* THRESHOLD SELECTOR PILLS: 4-LOSS (PRIMARY) VS 5-LOSS VS 6-LOSS */}
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Target Loss Strike Threshold:</span>
            <span className="text-rose-400 font-bold">
              {selectedThreshold === 4
                ? '🎯 ၄ ကြိမ်ရှုံးပါက Lock Strike ("HEY! NOW I AM START BETTING" Alarm)'
                : selectedThreshold === 5
                ? '🎯 ၅ ကြိမ်ရှုံးပါက Strike (၃ ကြိမ်ရှုံး Voice Alarm)'
                : '🎯 ၆ ကြိမ်ရှုံးပါက Strike (၄ ကြိမ်ရှုံး Scatter Alarm)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedThreshold(4);
                onSelectMode('SNIPER_4LOSS_MODE');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-tech font-black transition-all cursor-pointer ${
                selectedThreshold === 4
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg ring-2 ring-rose-300 animate-pulse'
                  : 'bg-slate-800 text-rose-300 hover:text-white'
              }`}
            >
              ⭐ 4-LOSS MODE ("Start Betting" Alarm)
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedThreshold(5);
                onSelectMode('SNIPER_5LOSS_MODE');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-tech font-black transition-all cursor-pointer ${
                selectedThreshold === 5
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow ring-1 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              5-LOSS MODE (3-Loss Voice)
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedThreshold(6);
                onSelectMode('SNIPER_6LOSS_MODE');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-tech font-black transition-all cursor-pointer ${
                selectedThreshold === 6
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow ring-1 ring-purple-300'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              6-LOSS MODE (Scatter Sound)
            </button>
          </div>
        </div>

        {/* ACTIVE ALARM NOTIFICATION BANNER (When any method has 3, 4, 5, or 6 losses) */}
        {activeScatterAlarm && (
          <div className={`p-4 rounded-xl border-2 transition-all shadow-xl animate-in fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            activeScatterAlarm.level === 'START_BET_ACTIVE_4'
              ? 'bg-rose-950/70 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.5)] text-rose-100 ring-2 ring-rose-400/70 animate-pulse'
              : activeScatterAlarm.level === 'FOUND_3_LOSS'
              ? 'bg-yellow-950/60 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] text-amber-100 ring-2 ring-amber-400/50'
              : activeScatterAlarm.level === 'LOCKED_5' || activeScatterAlarm.level === 'LOCKED_6'
              ? 'bg-rose-950/60 border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)] text-rose-100 ring-2 ring-rose-400/50'
              : 'bg-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-amber-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/20 shrink-0">
                <Sparkles className="w-6 h-6 text-rose-400 animate-spin" style={{ animationDuration: '4s' }} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black shadow ${
                    activeScatterAlarm.level === 'START_BET_ACTIVE_4'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-400 text-white animate-pulse'
                      : activeScatterAlarm.level === 'FOUND_3_LOSS'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black'
                      : 'bg-gradient-to-r from-rose-500 to-orange-400 text-white'
                  }`}>
                    {activeScatterAlarm.level === 'START_BET_ACTIVE_4'
                      ? `🚨 START BET ACTIVE: "HEY! NOW I AM START BETTING" (${activeScatterAlarm.consecutiveLosses}/4)`
                      : activeScatterAlarm.level === 'FOUND_3_LOSS'
                      ? `🔊 I FOUND 3 LOSE METHOD (${activeScatterAlarm.consecutiveLosses}/5)`
                      : activeScatterAlarm.level === 'LOCKED_5'
                      ? `🎯 5-LOSS SNIPER LOCK (${activeScatterAlarm.consecutiveLosses}/5)`
                      : activeScatterAlarm.level === 'LOCKED_6'
                      ? `🎯 6-LOSS SNIPER LOCK (${activeScatterAlarm.consecutiveLosses}/6)`
                      : `🎰 SLOT SCATTER SIGNAL (${activeScatterAlarm.consecutiveLosses})`}
                  </span>
                  <span className="font-tech text-xs font-bold text-white uppercase">
                    Period #{activeScatterAlarm.period.slice(-5)}
                  </span>
                </div>
                <p className="text-xs font-sans font-bold mt-1 leading-relaxed">
                  {activeScatterAlarm.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  if (activeScatterAlarm.level === 'START_BET_ACTIVE_4') {
                    handleTestStartBettingVoice();
                  } else if (activeScatterAlarm.level === 'FOUND_3_LOSS') {
                    handleTestFound3Voice();
                  } else {
                    handleTestScatterSound();
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-xs font-mono font-bold border border-white/20 flex items-center gap-1 text-rose-300"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>
                  {activeScatterAlarm.level === 'START_BET_ACTIVE_4'
                    ? 'Start Betting Alarm အသံ'
                    : activeScatterAlarm.level === 'FOUND_3_LOSS'
                    ? 'Voice အသံ'
                    : 'Alarm အသံ'}
                </span>
              </button>
              {onDismissScatterAlarm && (
                <button
                  type="button"
                  onClick={onDismissScatterAlarm}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700"
                >
                  ပိတ်မည်
                </button>
              )}
            </div>
          </div>
        )}

        {/* MULTI-METHOD LOSE RATE RANKING INTELLIGENCE BANNER */}
        {evaluation.lockedCandidate && (
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/40 shadow-lg space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <Target className="w-4 h-4 animate-pulse" />
                </span>
                <div>
                  <span className="font-tech text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                    <span>🎯 MAIN LOCKED METHOD:</span>
                    <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                      {evaluation.lockedCandidate.label}
                    </span>
                    <span className="text-amber-300 font-mono text-xs">
                      ({evaluation.lockedCandidate.consecutiveLosses} ကြိမ် ဆက်တိုက်ရှုံး)
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                    {evaluation.selectionReason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40">
                  🔥 LOSE RATE: {evaluation.lockedCandidate.loseRate}%
                </span>
                <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                  WIN: {evaluation.lockedCandidate.winRate}%
                </span>
              </div>
            </div>

            {/* If multiple methods reached threshold, show the ranked list with their Lose Rates */}
            {evaluation.hasMultipleCandidates && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                  ⚡ အချက်ပြ Method အားလုံး၏ LOSE RATE အလိုက် အဆင့်သတ်မှတ်ချက် (PRIORITY RANKING):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(selectedThreshold === 4
                    ? evaluation.readyMethods4
                    : selectedThreshold === 5
                    ? evaluation.readyMethods5
                    : evaluation.readyMethods6
                  ).map((cand, idx) => (
                    <div
                      key={cand.algorithm}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                        idx === 0
                          ? 'bg-rose-950/60 border-rose-400 ring-1 ring-rose-400/50 text-white font-bold'
                          : 'bg-slate-900/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-black">
                            #{idx + 1}
                          </span>
                          <span className="truncate">{cand.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {cand.consecutiveLosses} ကြိမ်ရှုံး • Total {cand.losses}L
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-mono font-black ${idx === 0 ? 'text-rose-300' : 'text-slate-300'}`}>
                          {cand.loseRate}% Lose
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] block text-emerald-400 font-sans font-bold">
                            ⭐ MAIN BET
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7 METHODS LOSS STREAK RADAR MONITOR (User requirement: Background monitoring) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-tech font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-rose-400" />
              <span>METHOD ၇ မျိုး၏ လက်ရှိဆက်တိုက်ရှုံးမှု စောင့်ကြည့်ရေဒါ (CONSECUTIVE LOSS & LOSE RATE TRACKER)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedThreshold === 4
                ? '၄ ကြိမ် = START BET ACTIVE ("HEY! NOW I AM START BETTING" Alarm)'
                : selectedThreshold === 5
                ? '၃ ကြိမ် = "I found 3 lose" Voice | ၅ ကြိမ် = Sniper Lock'
                : '၄ ကြိမ် = Scatter Alarm | ၆ ကြိမ် = Sniper Lock'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {evaluation.details.map((m) => {
              const losses = m.consecutiveLosses;
              const isLocked = sniperLockedAlgo === m.algorithm || (evaluation.lockedCandidate?.algorithm === m.algorithm);
              const isWarning = selectedThreshold === 4 ? losses === 3 : selectedThreshold === 5 ? losses >= 3 : losses >= 4;

              return (
                <div
                  key={m.algorithm}
                  className={`p-3 rounded-xl border transition-all ${
                    isLocked
                      ? 'bg-rose-950/40 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-400/50'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-tech text-xs font-bold text-white truncate">
                      {m.label}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isLocked
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-black animate-bounce'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {losses >= selectedThreshold 
                        ? `🎯 ${losses}/${selectedThreshold} READY` 
                        : selectedThreshold === 4 && losses === 3
                        ? `⚠️ 3/4 WARNING`
                        : selectedThreshold === 5 && losses >= 3 
                        ? `🔊 ${losses}/5 VOICE`
                        : losses >= 4 
                        ? `🚨 ${losses}/6 SCATTER` 
                        : `${losses}/${selectedThreshold} Loss`}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                    {m.burmeseLabel}
                  </span>

                  {/* Visual Segment Meter (Steps 1 to 6) */}
                  <div className="grid grid-cols-6 gap-1 mt-2.5">
                    {[1, 2, 3, 4, 5, 6].map((step) => {
                      const isFilled = losses >= step;

                      return (
                        <div
                          key={step}
                          className={`h-2 rounded-sm transition-all ${
                            isFilled
                              ? step >= selectedThreshold
                                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                : step >= 3
                                ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                                : 'bg-cyan-500'
                              : 'bg-slate-800'
                          } ${step > selectedThreshold ? 'opacity-30' : ''}`}
                          title={`အဆင့် ${step}`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[9px] font-mono">
                    <span className="text-slate-400">
                      Lose Rate: <strong className="text-rose-400 font-bold">{m.loseRate}%</strong>
                    </span>
                    <span className={`font-bold ${isLocked ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}`}>
                      {losses} ကြိမ် ဆက်တိုက် ({m.losses}L/{m.total})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STRATEGY EXPLANATION & ACTION BUTTON */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-sans text-slate-300">
          <div className="font-tech font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Zap className="w-4 h-4 text-rose-400" />
            <span>၄ ကြိမ် / ၅ ကြိမ် / ၆ ကြိမ်ရှုံး စောင့်ဆိုင်းကစားနည်း စည်းမျဉ်း (Sniper Rules & Management):</span>
          </div>
          <ul className="space-y-1.5 text-slate-400 pl-4 list-disc text-[11px] leading-relaxed">
            <li>Method ၇ မျိုးထဲမှ <strong>၄ ကြိမ်ဆက်တိုက်ရှုံးသော Method</strong> ကို AI မှ နောက်ကွယ်တွင် Auto အမြဲစောင့်ကြည့်ရှာဖွေနေပါမည် (User ကစားသည်ဖြစ်စေ မကစားသည်ဖြစ်စေ Run ထားပါသည်)။</li>
            <li><strong>START BET ACTIVE ဖြစ်သည်နှင့်တပြိုင်နက်</strong> Alarm Sound အနေဖြင့် <strong>"HEY! NOW I AM START BETTING"</strong> အသံမြည်၍ Signal ပြပေးပါမည်။</li>
            <li><strong>Method အများအပြား (ဥပမာ- ၃ မျိုးတွင် ၄/၅/၆ ကြိမ်) ရှုံးနေပါက</strong>: Lose Rate (အရှုံးရာခိုင်နှုန်း) အများဆုံးဖြစ်နေသော Method ကိုသာ <strong>Main Method အဖြစ် ရွေးချယ် Lock</strong> လုပ်ပြီး Bet ပါမည်။ အကြိမ်အရေအတွက် တူညီနေပါကလည်း Error မဖြစ်အောင် စနစ်တကျ အဆင့်ခွဲထားပါသည်။</li>
            <li>အဆိုပါ Locked Method တမျိုးတည်းကို သီးသန့် Lock ပြုလုပ်ပြီး တခြားဘယ် Method ကိုမှ မသုံးဘဲ <strong>Win မဖြစ်မချင်း ဆက်တိုက် Bet</strong> ပါမည်။</li>
            <li><strong>Win ဖြစ်ပါက Bet တာချက်ချင်းရပ်ပြီး</strong> အမြတ်သိမ်းဆည်းကာ နောက်တစ်ကြိမ် Method အသစ်အတွက် <strong>Step 1 (Base Stake မူလစတင်ငွေ)</strong> မှသာ စတင် Bet ပါမည် (Multiplier သယ်ဆောင်ခြင်း မရှိပါ)။</li>
          </ul>
        </div>

        {/* PRIMARY CALL-TO-ACTION BUTTON */}
        <div>
          {isSniperModeActive && isAutoBetActive ? (
            <div className="w-full p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-400 text-rose-200 font-tech font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
                <span className="text-left font-sans">
                  ✅ <strong>{selectedThreshold}-LOSS SNIPER WAIT & STRIKE စနစ်ဖြင့် AUTO BET လတ်တလော စတင်ကစားနေပါသည်</strong> (စနစ်ဖွင့်ထားပြီးဖြစ်ပါသည်)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onStopSniperAutoBet?.()}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
              >
                🛑 STOP AUTO BET (ရပ်မည်)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleActivate(selectedThreshold)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-tech font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all active:scale-[0.98] cursor-pointer"
            >
              <Crosshair className="w-5 h-5 text-white" />
              <span>🎯 ဤ {selectedThreshold}-LOSS SNIPER စနစ်ဖြင့် AUTO BET စတင်ကစားမည် (WAIT & STRIKE MODE)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
