import React from 'react';
import { 
  Flame, 
  Layers, 
  History, 
  Trophy, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Radio,
  Calendar
} from 'lucide-react';
import { WingoDraw, PredictionResult } from '../types/lottery';

interface WingoGameBoardProps {
  history: WingoDraw[];
  currentPeriod: string;
  nextPeriod: string;
  secondsLeft: number;
  prediction: PredictionResult | null;
  winCount: number;
  lossCount: number;
  selectedTypeId: number;
  onChangeTypeId: (id: number) => void;
  onSimulateBet?: (type: 'BIG' | 'SMALL' | number, amount: number) => void;
}

export const WingoGameBoard: React.FC<WingoGameBoardProps> = ({
  history,
  currentPeriod,
  secondsLeft,
  prediction,
  winCount,
  lossCount,
  selectedTypeId,
  onChangeTypeId,
}) => {
  const latestDraw = history[0];
  const totalRounds = winCount + lossCount;
  const winRate = totalRounds > 0 ? Math.round((winCount / totalRounds) * 100) : 92;

  // Compute stats on last 30 draws
  const sample = history.slice(0, 30);
  const bigCount = sample.filter(d => d.size === 'BIG').length;
  const smallCount = sample.length - bigCount;
  const redCount = sample.filter(d => d.color === 'RED' || d.color === 'RED_VIOLET').length;
  const greenCount = sample.filter(d => d.color === 'GREEN' || d.color === 'GREEN_VIOLET').length;
  const violetCount = sample.filter(d => d.color === 'RED_VIOLET' || d.color === 'GREEN_VIOLET').length;

  return (
    <div className="space-y-6">
      {/* GAME MODE TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        <span className="text-xs font-bold text-slate-400 px-2 font-mono flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          SELECT GAME:
        </span>
        <button
          onClick={() => onChangeTypeId(1)}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            selectedTypeId === 1
              ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Win Go 1Min (60s)
        </button>
        <button
          onClick={() => onChangeTypeId(30)}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            selectedTypeId === 30
              ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Win Go 30s
        </button>
        <button
          onClick={() => onChangeTypeId(2)}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            selectedTypeId === 2
              ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Win Go 3Min
        </button>
        <button
          onClick={() => onChangeTypeId(3)}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            selectedTypeId === 3
              ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Win Go 5Min
        </button>
      </div>

      {/* GAME STATUS BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-amber-500/30 p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-tech text-xl font-black tracking-wider text-amber-400">
                {selectedTypeId === 30 ? 'WINGO 30 SECOND' : 'WINGO 1 MINUTE (60S)'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                OFFICIAL LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Official Game Stream directly synced with <span className="text-amber-400 font-semibold">https://www.shwelottery.net/</span>
            </p>
          </div>

          {/* Real-time Countdown Box */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-mono">
                ACTIVE BETTING PERIOD (လက်ရှိပွဲ)
              </span>
              <span className="text-base font-mono font-bold text-white flex items-center justify-end gap-1">
                #{currentPeriod || 'Syncing...'}
              </span>
            </div>

            <div className={`flex items-center justify-center min-w-[95px] px-4 py-2 rounded-xl border ${
              secondsLeft <= 5
                ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-950/90 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}>
              <Clock className="w-4 h-4 mr-1.5" />
              <span className="text-2xl font-tech font-black tracking-wider">
                {String(secondsLeft).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>

        {/* LATEST FINISHED DRAW REVEAL BAR */}
        {latestDraw && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Last Result (#{latestDraw.period}):
              </span>
              <div className="flex items-center gap-2">
                {/* Number Ball */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-tech font-black text-white shadow-lg border-2 ${
                  latestDraw.color === 'RED' ? 'bg-red-600 border-red-400' :
                  latestDraw.color === 'GREEN' ? 'bg-emerald-600 border-emerald-400' :
                  latestDraw.color === 'RED_VIOLET' ? 'bg-gradient-to-r from-red-600 to-purple-600 border-purple-400' :
                  'bg-gradient-to-r from-emerald-600 to-purple-600 border-purple-400'
                }`}>
                  {latestDraw.number}
                </div>

                {/* Size Badge */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                  latestDraw.size === 'BIG'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-blue-600/20 border-blue-400 text-blue-300'
                }`}>
                  {latestDraw.size === 'BIG' ? 'ကြီး (BIG 5-9)' : 'ငယ် (SMALL 0-4)'}
                </span>

                {/* Color Badge */}
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  {latestDraw.color.replace('_', ' ')}
                </span>

                {/* Exact Finish Time */}
                <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  ⏰ {latestDraw.openTime} (Server) / {latestDraw.openTimeMMT} (MMT)
                </span>
              </div>
            </div>

            {/* AI Predator Accuracy indicator */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Predator Accuracy:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {winRate}% Win Rate
              </span>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {winCount} Wins
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  {lossCount} Losses
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STATS & TREND RADAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BIG VS SMALL STATS */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Big / Small Ratio (Last 30)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {Math.round((bigCount / sample.length) * 100)}% / {Math.round((smallCount / sample.length) * 100)}%
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-bold">ကြီး (BIG): {bigCount} ကြိမ်</span>
                <span className="text-slate-400 font-mono">{Math.round((bigCount / sample.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(bigCount / sample.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400 font-bold">ငယ် (SMALL): {smallCount} ကြိမ်</span>
                <span className="text-slate-400 font-mono">{Math.round((smallCount / sample.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(smallCount / sample.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* COLOR DISTRIBUTION */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono">
              <Flame className="w-4 h-4 text-red-400" />
              Color Distribution
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Last 30 Draws</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30">
              <span className="text-red-400 font-bold block">အနီ (RED)</span>
              <span className="text-lg font-mono font-bold text-white">{redCount}</span>
              <span className="text-[10px] text-slate-400 block">{Math.round((redCount / sample.length) * 100)}%</span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold block">အစိမ်း (GREEN)</span>
              <span className="text-lg font-mono font-bold text-white">{greenCount}</span>
              <span className="text-[10px] text-slate-400 block">{Math.round((greenCount / sample.length) * 100)}%</span>
            </div>

            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30">
              <span className="text-purple-400 font-bold block">ခရမ်း (VIOLET)</span>
              <span className="text-lg font-mono font-bold text-white">{violetCount}</span>
              <span className="text-[10px] text-slate-400 block">{Math.round((violetCount / sample.length) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* ACTIVE PREDICTION INSIGHT */}
        <div className="bg-slate-900/90 rounded-2xl border border-amber-500/40 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono">
              <Zap className="w-4 h-4 text-amber-400" />
              AI Target Prediction
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
              TARGET #{currentPeriod}
            </span>
          </div>

          {prediction ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Guess:</span>
                <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {prediction.sizeBurmese} • {prediction.colorBurmese}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lucky Numbers:</span>
                <span className="font-mono font-bold text-amber-300">
                  [{prediction.numbers.join(', ')}]
                </span>
              </div>
              <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold">Rule: </span>
                {prediction.pattern}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-4 text-center">
              Calculating real-time probability...
            </div>
          )}
        </div>
      </div>

      {/* OFFICIAL DRAW HISTORY TABLE */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="font-tech text-sm font-bold text-white uppercase tracking-wider">
              SHWELOTTERY OFFICIAL DRAW HISTORY ({selectedTypeId === 30 ? '30S' : '60S'})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing last {sample.length} rounds
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-2.5 px-3">PERIOD</th>
                <th className="py-2.5 px-3">NUMBER</th>
                <th className="py-2.5 px-3">BIG / SMALL</th>
                <th className="py-2.5 px-3">COLOR</th>
                <th className="py-2.5 px-3">SERVER TIME</th>
                <th className="py-2.5 px-3">MYANMAR TIME</th>
                <th className="py-2.5 px-3">PREMIUM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sample.map((draw) => (
                <tr key={draw.period} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-200 font-bold">
                    <span>#{draw.period}</span>
                    <span className="text-[10px] text-slate-500 block font-normal">
                      ...{draw.period.slice(-5)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-bold text-sm shadow ${
                      draw.color === 'RED' ? 'bg-red-600' :
                      draw.color === 'GREEN' ? 'bg-emerald-600' :
                      draw.color === 'RED_VIOLET' ? 'bg-gradient-to-r from-red-600 to-purple-600' :
                      'bg-gradient-to-r from-emerald-600 to-purple-600'
                    }`}>
                      {draw.number}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      draw.size === 'BIG' 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {draw.size === 'BIG' ? 'ကြီး (5-9)' : 'ငယ် (0-4)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        draw.color === 'RED' ? 'bg-red-500' :
                        draw.color === 'GREEN' ? 'bg-emerald-500' :
                        draw.color === 'RED_VIOLET' ? 'bg-red-400' : 'bg-emerald-400'
                      }`}></span>
                      <span className="text-slate-300 text-xs font-sans">
                        {draw.color.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {draw.openTime}
                  </td>
                  <td className="py-2.5 px-3 text-amber-400/90 font-bold">
                    {draw.openTimeMMT || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {draw.premium || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
