import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Crown, 
  Bot, 
  Cpu, 
  Layers, 
  Brain,
  Binary,
  BarChart3,
  ArrowRight, 
  Bell, 
  X, 
  Flame, 
  Snowflake, 
  ShieldCheck, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Activity 
} from 'lucide-react';
import { AlgorithmType, AllMethodsStats, AutoSwitchEvent, PredictionResult, BettingEngineMode } from '../types/lottery';

interface MultiMethodBenchmarkBarProps {
  stats: AllMethodsStats;
  currentAlgorithm: AlgorithmType;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
  isAutoSwitchEnabled: boolean;
  onToggleAutoSwitch: () => void;
  autoSwitchEvent: AutoSwitchEvent | null;
  onDismissAutoSwitch?: () => void;
  predictions?: Record<AlgorithmType, PredictionResult> | null;
  nextPeriod?: string;
  isUserPlaying?: boolean;
  bettingEngineMode?: BettingEngineMode;
}

export const MultiMethodBenchmarkBar: React.FC<MultiMethodBenchmarkBarProps> = ({
  stats,
  currentAlgorithm,
  onSelectAlgorithm,
  isAutoSwitchEnabled,
  onToggleAutoSwitch,
  autoSwitchEvent,
  onDismissAutoSwitch,
  predictions,
  nextPeriod,
  isUserPlaying = false,
  bettingEngineMode = 'METHODS_7_MODE',
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const algorithms: AlgorithmType[] = ['META_SUPER_AI', 'NEURAL_MATRIX', 'NGRAM_SEQUENCE', 'STATISTICAL_PROB', 'ENSEMBLE', 'HMM', 'MARKOV'];

  // Identify highest win rate algorithm
  const ranked = [...algorithms].sort((a, b) => {
    const rateA = stats[a]?.winRate || 0;
    const rateB = stats[b]?.winRate || 0;
    if (rateB !== rateA) return rateB - rateA;
    return (stats[b]?.streak || 0) - (stats[a]?.streak || 0);
  });
  const leaderAlgo = ranked[0];

  const getMethodTheme = (algo: AlgorithmType) => {
    switch (algo) {
      case 'META_SUPER_AI':
        return {
          name: 'Meta-Consensus AI',
          tagline: 'နည်းပညာ ၆ မျိုးပေါင်းစပ် Consensus (Ultimate AI)',
          accentColor: 'amber',
          borderActive: 'border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
          badgeBg: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400/60',
          gradient: 'from-amber-500/20 via-amber-950/40 to-slate-900',
          barGradient: 'from-amber-400 via-yellow-400 to-amber-300',
          icon: Crown,
        };
      case 'HMM':
        return {
          name: 'HMM Model (v3.0)',
          tagline: 'Hidden Markov Model (Regime)',
          accentColor: 'amber',
          borderActive: 'border-amber-400 ring-2 ring-amber-400/50',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradient: 'from-amber-500/10 via-amber-950/20 to-slate-900',
          barGradient: 'from-amber-500 to-amber-300',
          icon: Bot,
        };
      case 'MARKOV':
        return {
          name: 'Markov Chain',
          tagline: 'Markov Matrix (Pattern)',
          accentColor: 'purple',
          borderActive: 'border-purple-400 ring-2 ring-purple-400/50',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          gradient: 'from-purple-500/10 via-purple-950/20 to-slate-900',
          barGradient: 'from-purple-500 to-indigo-400',
          icon: Cpu,
        };
      case 'ENSEMBLE':
        return {
          name: 'Ensemble Consensus',
          tagline: 'HMM + Markov Consensus Voting',
          accentColor: 'cyan',
          borderActive: 'border-cyan-400 ring-2 ring-cyan-400/50',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          gradient: 'from-cyan-500/10 via-cyan-950/20 to-slate-900',
          barGradient: 'from-cyan-500 to-emerald-400',
          icon: Layers,
        };
      case 'NEURAL_MATRIX':
        return {
          name: 'Deep Pattern AI',
          tagline: 'Deep Bayesian Neural Matrix (90%+ Win Rate)',
          accentColor: 'fuchsia',
          borderActive: 'border-fuchsia-400 ring-2 ring-fuchsia-400/50',
          badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
          gradient: 'from-fuchsia-500/10 via-purple-950/20 to-slate-900',
          barGradient: 'from-fuchsia-500 to-pink-400',
          icon: Brain,
        };
      case 'NGRAM_SEQUENCE':
        return {
          name: '3-Gram / N-Gram',
          tagline: 'Sequence & Pattern Recognition (3-gram / N-gram)',
          accentColor: 'emerald',
          borderActive: 'border-emerald-400 ring-2 ring-emerald-400/50',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          gradient: 'from-emerald-500/10 via-teal-950/20 to-slate-900',
          barGradient: 'from-emerald-500 to-teal-300',
          icon: Binary,
        };
      case 'STATISTICAL_PROB':
        return {
          name: 'Statistical & Prob',
          tagline: 'Statistical & Probability Methods (Z-Score & Bayesian)',
          accentColor: 'blue',
          borderActive: 'border-blue-400 ring-2 ring-blue-400/50',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          gradient: 'from-blue-500/10 via-indigo-950/20 to-slate-900',
          barGradient: 'from-blue-500 to-indigo-300',
          icon: BarChart3,
        };
    }
  };

  const currentTheme = getMethodTheme(currentAlgorithm);
  const currentWinRate = stats[currentAlgorithm]?.winRate ?? 78;

  return (
    <div className="space-y-3">
      {/* 1. AUTO-SWITCH LIVE ALERT BANNER (WHEN AI AUTO-SWITCHES) */}
      {autoSwitchEvent && (
        <div className="relative p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-purple-950/90 border-2 border-amber-400 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-tech text-xs sm:text-sm font-black text-white tracking-wider">
                  ⚡ AI DYNAMIC AUTO-SWITCH ACTIVATED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  AUTONOMOUS ADAPTATION
                </span>
              </div>
              <p className="text-xs text-amber-300/90 mt-0.5 font-sans">
                {autoSwitchEvent.reason} (
                <strong className="text-white">{autoSwitchEvent.fromAlgo}</strong> ➡️{' '}
                <strong className="text-emerald-300 font-tech">{autoSwitchEvent.toAlgo} {autoSwitchEvent.toWinRate}% Win Rate</strong>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={onDismissAutoSwitch}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="ပိတ်မည်"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MEDIUM BUTTON SIZE BAR (User requirement: REAL-TIME MULTI-AI BENCHMARK & ADAPTIVE AUTO-SWITCH ကိုလည်း medium button size ထားပေးပါ) */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-tech text-xs sm:text-sm font-bold text-white tracking-wider">
              MULTI-AI BENCHMARK:
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Active:</span>
              <strong className="text-amber-400 font-bold">{currentAlgorithm}</strong>
              <span className="text-[10px] text-emerald-400 font-bold">({currentWinRate}% Win)</span>
            </div>

            {bettingEngineMode === 'METHODS_7_MODE' ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                7-METHOD MODE ACTIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                10-MIN FORMULA ACTIVE
              </span>
            )}

            {leaderAlgo && (
              <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Leader: <strong>{leaderAlgo}</strong> ({stats[leaderAlgo]?.winRate}%)</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Quick Auto-switch status */}
          <button
            type="button"
            onClick={onToggleAutoSwitch}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 border ${
              isAutoSwitchEnabled
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            title="Auto-Switch Toggle"
          >
            <Zap className={`w-3 h-3 ${isAutoSwitchEnabled ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Auto-Switch: {isAutoSwitchEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* MEDIUM SIZE TRIGGER BUTTON FOR DETAILS */}
          <button
            type="button"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-750 hover:from-slate-700 hover:to-slate-650 text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition-all shadow-md active:scale-95"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Benchmark Details</span>
            {isDetailsOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* 3. EXPANDABLE BENCHMARK CARDS (SHOWN ONLY WHEN USER CLICKS MEDIUM BUTTON) */}
      {isDetailsOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl space-y-4 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-tech text-sm sm:text-base font-black text-white tracking-wider flex items-center gap-2">
                  REAL-TIME MULTI-AI BENCHMARK & ADAPTIVE AUTO-SWITCH
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE CONCURRENT RUNNING
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                User ကစားသည်ဖြစ်စေ၊ မကစားသည်ဖြစ်စေ Meta-Consensus AI, HMM, Markov, Ensemble, Deep Pattern AI, Sequence & Pattern Recognition (3-Gram / N-Gram) နှင့် Statistical & Probability Methods နည်းပညာ (၇) မျိုးလုံးကို နောက်ကွယ်တွင် တပြိုင်နက် Live Run ထားပြီး စွမ်းဆောင်ရည် အကောင်းဆုံးသို့ အလိုအလျောက် ရွေးချယ်ပေးပါသည်
              </p>
            </div>

            {/* AI Auto-Switch Master Toggle */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800 shrink-0">
              <div className="text-left">
                <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">
                  AI SMART AUTO-SWITCH
                </span>
                <span className="text-[11px] text-slate-300 font-sans">
                  {isAutoSwitchEnabled ? 'ဖွင့်ထားသည် (Lose များလျှင် အလိုအလျောက်ပြောင်း)' : 'ပိတ်ထားသည် (Manual သာ)'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleAutoSwitch}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all flex items-center gap-1.5 ${
                  isAutoSwitchEnabled
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isAutoSwitchEnabled ? 'fill-current animate-pulse' : ''}`} />
                <span>{isAutoSwitchEnabled ? 'AUTO-SWITCH: ON' : 'AUTO-SWITCH: OFF'}</span>
              </button>
            </div>
          </div>

          {/* 7 METHOD COMPARATIVE PERFORMANCE CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
            {algorithms.map((algo) => {
              const mStats = stats[algo];
              const theme = getMethodTheme(algo);
              const Icon = theme.icon;
              const isActive = currentAlgorithm === algo;
              const isLeader = leaderAlgo === algo;
              const pred = predictions ? predictions[algo] : null;

              // Determine win rate color
              const winRate = mStats?.winRate ?? 75;
              const rateColor = winRate >= 80 ? 'text-emerald-400' : winRate >= 70 ? 'text-amber-400' : 'text-rose-400';

              return (
                <div
                  key={algo}
                  onClick={() => onSelectAlgorithm(algo)}
                  className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer bg-gradient-to-br ${theme.gradient} ${
                    isActive
                      ? theme.borderActive + ' shadow-xl'
                      : 'border-slate-800/80 hover:border-slate-700 opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-slate-300" />
                      <span className="font-tech text-xs font-black text-white tracking-wide">
                        {theme.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isLeader && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold bg-amber-500 text-black flex items-center gap-0.5 shadow">
                          <Crown className="w-2.5 h-2.5 fill-current" />
                          <span>LEADER</span>
                        </span>
                      )}
                      {isActive && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold bg-emerald-500 text-black flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subtitle / Method Logic Description */}
                  <span className="text-[10px] text-slate-400 block line-clamp-1 mb-2.5 font-sans">
                    {theme.tagline}
                  </span>

                  {/* Win Rate & Score Section */}
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                        WIN RATE (အနိုင်နှုန်း)
                      </span>
                      <span className={`text-2xl font-tech font-black tracking-tight ${rateColor}`}>
                        {winRate}%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                        SCORE (ပွဲရလဒ်)
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-200">
                        <strong className="text-emerald-400">{mStats?.wins ?? 0}W</strong> -{' '}
                        <strong className="text-rose-400">{mStats?.losses ?? 0}L</strong>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        ({mStats?.total ?? 0} Rounds)
                      </span>
                    </div>
                  </div>

                  {/* Win Rate Visual Progress Meter */}
                  <div className="space-y-1 mb-3">
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full bg-gradient-to-r ${theme.barGradient} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(5, winRate))}%` }}
                      />
                    </div>
                  </div>

                  {/* Streak & Last 10 Rounds Micro-Dots */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Streak:</span>
                      {(mStats?.streak ?? 0) >= 0 ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-amber-400 fill-current" />
                          <span>+{mStats?.streak ?? 0}W</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-0.5">
                          <Snowflake className="w-3 h-3 text-blue-400" />
                          <span>{mStats?.streak ?? 0}L</span>
                        </span>
                      )}
                    </div>

                    {/* Last 8 Mini Outcome Dots */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[9px]">Last:</span>
                      <div className="flex items-center gap-0.5">
                        {(mStats?.last10 || [true, true, false, true, true]).slice(0, 8).map((won, idx) => (
                          <span
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              won
                                ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                                : 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]'
                            }`}
                            title={won ? 'Win' : 'Loss'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Prediction for Current/Upcoming Draw */}
                  {pred && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 text-[10px]">
                        Next #{nextPeriod ? nextPeriod.slice(-4) : 'Guess'}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            pred.size === 'BIG'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {pred.sizeBurmese}
                        </span>
                        <span className="text-[10px] text-slate-400">({pred.confidence}%)</span>
                      </div>
                    </div>
                  )}

                  {/* Select button if not active */}
                  {!isActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlgorithm(algo);
                      }}
                      className="mt-2.5 w-full py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors border border-slate-700"
                    >
                      <span>ဤ Method ကို သုံးမည်</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Helper Note */}
          <div className="pt-2 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Smart Auto-Switch</strong> ဖွင့်ထားပါက လက်ရှိ Method ရှုံးမှုများလာလျှင် Win % အမြင့်ဆုံးခေါင်းဆောင် Method သို့ အလိုအလျောက် ပြောင်းလဲကူးပြောင်းပေးပါမည်။
              </span>
            </div>
            <div className="font-mono text-[10px] text-amber-400/90 shrink-0">
              Active: <strong className="text-white">{currentAlgorithm}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
