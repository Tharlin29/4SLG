import { 
  Sparkles, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRightLeft, 
  Zap, 
  Layers, 
  Brain, 
  Flame,
  Crosshair,
  Volume2
} from 'lucide-react';
import { BettingEngineMode, AlgorithmType, AiFormula, AllMethodsStats } from '../types/lottery';

interface AiModeSwitcherBarProps {
  currentMode: BettingEngineMode;
  onSelectMode: (mode: BettingEngineMode) => void;
  activeFormula: AiFormula | null;
  currentAlgorithm: AlgorithmType;
  methodStats?: AllMethodsStats;
  isAutoBetActive: boolean;
  onApplyFormula: (formula: AiFormula) => void;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
}

export const AiModeSwitcherBar: React.FC<AiModeSwitcherBarProps> = ({
  currentMode,
  onSelectMode,
  activeFormula,
  currentAlgorithm,
  methodStats,
  isAutoBetActive,
  onApplyFormula,
  onSelectAlgorithm
}) => {
  const isFormulaMode = currentMode === 'FORMULA_MODE';
  const isSniper4Mode = currentMode === 'SNIPER_4LOSS_MODE';
  const isSniper5Mode = currentMode === 'SNIPER_5LOSS_MODE';
  const isSniper6Mode = currentMode === 'SNIPER_6LOSS_MODE';
  const isSniperMode = isSniper4Mode || isSniper5Mode || isSniper6Mode;
  const currentMethodWinRate = methodStats?.[currentAlgorithm]?.winRate ?? 95;

  return (
    <div className="rounded-2xl bg-slate-950/95 border-2 border-slate-800 shadow-2xl p-3.5 sm:p-4 space-y-3.5">
      
      {/* TOP HEADER & EXPLANATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-cyan-500 text-black shadow">
            <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-tech text-sm sm:text-base font-black text-white tracking-wider flex items-center gap-2">
              AI BETTING ENGINE SELECTOR (ကစားမည့် စနစ်ရွေးချယ်မှု)
            </h3>
            <span className="text-xs text-slate-400 font-sans block">
              မိမိကစားနေသော စနစ်အား ရှင်းလင်းစွာ ခွဲခြားသိရှိနိုင်စေရန် အောက်ပါ စနစ်များမှ စိတ်ကြိုက် ရွေးချယ်နိုင်ပါသည်
            </span>
          </div>
        </div>

        {/* ACTIVE STATUS CHIP */}
        <div className={`px-3 py-1 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 self-start sm:self-center shadow-lg ${
          isSniper4Mode
            ? 'bg-rose-500 text-white ring-2 ring-rose-400/50 shadow-rose-500/30 animate-pulse'
            : isSniper5Mode
            ? 'bg-red-500 text-white ring-2 ring-red-400/50 shadow-red-500/30'
            : isSniper6Mode
            ? 'bg-orange-500 text-white ring-2 ring-orange-400/50 shadow-orange-500/30'
            : isFormulaMode
            ? 'bg-amber-500 text-black ring-2 ring-amber-400/50 shadow-amber-500/20'
            : 'bg-cyan-500 text-black ring-2 ring-cyan-400/50 shadow-cyan-500/20'
        }`}>
          {isSniper4Mode ? (
            <>
              <Crosshair className="w-3.5 h-3.5 animate-spin text-yellow-300" style={{ animationDuration: '4s' }} />
              <span>4-LOSS SNIPER ("HEY! NOW I AM START BETTING") စနစ် အသုံးပြုနေသည်</span>
            </>
          ) : isSniper5Mode ? (
            <>
              <Crosshair className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
              <span>5-LOSS SNIPER ("I found 3 lose" Voice) စနစ် အသုံးပြုနေသည်</span>
            </>
          ) : isSniper6Mode ? (
            <>
              <Crosshair className="w-3.5 h-3.5 animate-pulse" />
              <span>6-LOSS SNIPER (Scatter Alarm) စနစ် အသုံးပြုနေသည်</span>
            </>
          ) : isFormulaMode ? (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>10-MIN FORMULA စနစ် အသုံးပြုနေသည်</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 fill-black" />
              <span>နည်းပညာ ၇ မျိုး စနစ် အသုံးပြုနေသည်</span>
            </>
          )}
        </div>
      </div>

      {/* THREE PROMINENT BIG MODE CARDS (SIDE-BY-SIDE / STACKED ON MOBILE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* MODE 1: 10-MINUTES AI FORMULA CARD */}
        <div 
          onClick={() => {
            onSelectMode('FORMULA_MODE');
            if (activeFormula) {
              onApplyFormula(activeFormula);
            }
          }}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            isFormulaMode
              ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 opacity-80 hover:opacity-100'
          }`}
        >
          {/* Card Top Pill */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              MODE 1: AI FORMULA
            </span>

            {isFormulaMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500 text-black flex items-center gap-1 shadow">
                <CheckCircle2 className="w-3 h-3" />
                ACTIVE IN USE
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-tech font-black text-white flex items-center gap-1.5">
              <span>🧬 10-MINUTES AI FORMULA စနစ်</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
              Game Website ၏ လတ်တလောထွက်ရှိခဲ့သော History များကို AI မှ Search ပြုလုပ်ပြီး <strong>၁၀ မိနစ်ပြည့်တိုင်း Formula အသစ်</strong> ကို အလိုအလျောက် ထုတ်ပေးသည့် စနစ်ဖြစ်ပါသည်။
            </p>
          </div>

          {/* Active Formula Details Strip */}
          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Formula:</span>
              <span className="text-amber-400 font-bold">{activeFormula?.code || 'Scanning...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Expected Win Rate:</span>
              <span className="text-emerald-400 font-bold">{activeFormula?.expectedWinRate || 95}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Method & Mult:</span>
              <span className="text-white font-bold">{activeFormula?.recommendedMethod || 'META'} ({activeFormula?.recommendedMultiplier || 2}×)</span>
            </div>
          </div>

          <button
            type="button"
            className={`w-full py-2 rounded-lg text-xs font-tech font-black flex items-center justify-center gap-1.5 transition-all shadow ${
              isFormulaMode
                ? 'bg-amber-500 text-black shadow-amber-500/30 ring-1 ring-amber-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {isFormulaMode ? '✅ ဤ FORMULA စနစ်ဖြင့် လောင်းနေပါသည်' : '👉 10-MIN FORMULA စနစ်သို့ ကူးပြောင်းမည်'}
          </button>
        </div>

        {/* MODE 2: 7-METHOD MULTI-AI CARD */}
        <div 
          onClick={() => {
            onSelectMode('METHODS_7_MODE');
          }}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            !isFormulaMode && !isSniperMode
              ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-cyan-950/20 border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 opacity-80 hover:opacity-100'
          }`}
        >
          {/* Card Top Pill */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              MODE 2: 7-METHOD MULTI-AI
            </span>

            {!isFormulaMode && !isSniperMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500 text-black flex items-center gap-1 shadow">
                <CheckCircle2 className="w-3 h-3" />
                ACTIVE IN USE
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-tech font-black text-white flex items-center gap-1.5">
              <span>⚡ နည်းပညာ ၇ မျိုး MULTI-AI စနစ်</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
              Meta-Consensus, Neural Matrix, 3-Gram အစရှိသည့် <strong>နည်းပညာ ၇ မျိုး</strong> အနက်မှ စွမ်းဆောင်ရည်အလိုက် စိတ်ကြိုက်ရွေးချယ် သို့မဟုတ် ၂ ကြိမ်ရှုံး Auto-Switch ဖြင့် ကစားသည့် စနစ်ဖြစ်ပါသည်။
            </p>
          </div>

          {/* Active 7-Method Details Strip */}
          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Method:</span>
              <span className="text-cyan-400 font-bold">{currentAlgorithm}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Live Win Rate:</span>
              <span className="text-emerald-400 font-bold">{currentMethodWinRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">2-Loss Protection:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                AUTO-SWITCH ON
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`w-full py-2 rounded-lg text-xs font-tech font-black flex items-center justify-center gap-1.5 transition-all shadow ${
              !isFormulaMode && !isSniperMode
                ? 'bg-cyan-500 text-black shadow-cyan-500/30 ring-1 ring-cyan-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {!isFormulaMode && !isSniperMode ? '✅ နည်းပညာ ၇ မျိုး စနစ်ဖြင့် လောင်းနေပါသည်' : '👉 နည်းပညာ ၇ မျိုး စနစ်သို့ ကူးပြောင်းမည်'}
          </button>
        </div>

        {/* MODE 3: 4-LOSS / 5-LOSS / 6-LOSS SNIPER WAIT & STRIKE CARD */}
        <div 
          className={`relative p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
            isSniperMode
              ? isSniper4Mode
                ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/20 border-rose-400 ring-2 ring-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                : isSniper5Mode
                ? 'bg-gradient-to-br from-red-950/40 via-slate-900 to-orange-950/20 border-red-400 ring-2 ring-red-400/40 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                : 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-rose-950/20 border-purple-400 ring-2 ring-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 opacity-80 hover:opacity-100'
          }`}
        >
          {/* Card Top Pill */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              isSniper4Mode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : isSniper5Mode
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            }`}>
              <Crosshair className="w-3 h-3 text-rose-400" />
              MODE 3: {isSniper4Mode ? '4-LOSS' : isSniper5Mode ? '5-LOSS' : '6-LOSS'} SNIPER
            </span>

            {isSniperMode && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black text-white flex items-center gap-1 shadow ${
                isSniper4Mode ? 'bg-rose-500 animate-pulse' : isSniper5Mode ? 'bg-red-500' : 'bg-purple-500'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                ACTIVE IN USE
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-tech font-black text-white flex items-center gap-1.5">
              <span>🎯 ၄ ကြိမ် / ၅ ကြိမ်ရှုံး SNIPER WAIT & STRIKE</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
              Method ၇ မျိုးထဲမှ <strong>၄ ကြိမ် (သို့) ၅ ကြိမ် ဆက်တိုက်ရှုံးသော Method</strong> ကို Auto ရှာပြီး Win မဖြစ်မချင်း ထို Method တမျိုးတည်း လောင်းကာ Win လျှင် Bet ရပ်၍ ပြန်စောင့်သော စနစ်ဖြစ်ပါသည်။
            </p>
          </div>

          {/* Active Sniper Details Strip */}
          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Alarm Audio:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                {isSniper4Mode 
                  ? '၄ ကြိမ်ရှုံး "HEY! NOW I AM START BETTING" Voice' 
                  : isSniper5Mode 
                  ? '၃ ကြိမ်ရှုံး "I found 3 lose" Voice' 
                  : '၄ ကြိမ်ရှုံး Scatter Alarm'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Lock Strike:</span>
              <span className="text-rose-400 font-bold">
                {isSniper4Mode ? '၄ ကြိမ်ရှုံး Method' : isSniper5Mode ? '၅ ကြိမ်ရှုံး Method' : '၆ ကြိမ်ရှုံး Method'} သီးသန့်
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Win Action:</span>
              <span className="text-emerald-400 font-bold">Bet ရပ်တန့်၍ ပြန်စောင့်ဆိုင်း</span>
            </div>
          </div>

          {/* Quick 3 switcher buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectMode('SNIPER_4LOSS_MODE')}
              className={`py-2 px-1 rounded-lg text-[10px] font-tech font-black flex items-center justify-center gap-1 transition-all shadow ${
                isSniper4Mode
                  ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-300'
                  : 'bg-slate-800 text-rose-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span>⭐ 4-Loss (Active)</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('SNIPER_5LOSS_MODE')}
              className={`py-2 px-1 rounded-lg text-[10px] font-tech font-black flex items-center justify-center gap-1 transition-all shadow ${
                isSniper5Mode
                  ? 'bg-red-500 text-white shadow-red-500/30 ring-2 ring-red-300'
                  : 'bg-slate-800 text-red-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span>🎯 5-Loss</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('SNIPER_6LOSS_MODE')}
              className={`py-2 px-1 rounded-lg text-[10px] font-tech font-black flex items-center justify-center gap-1 transition-all shadow ${
                isSniper6Mode
                  ? 'bg-purple-500 text-white shadow-purple-500/30 ring-2 ring-purple-300'
                  : 'bg-slate-800 text-purple-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span>🎯 6-Loss</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE MODE BOTTOM EXPLANATION BANNER */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
        isSniper4Mode
          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          : isSniper5Mode
          ? 'bg-red-950/30 border-red-500/40 text-red-200'
          : isSniper6Mode
          ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
          : isFormulaMode
          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
      }`}>
        <div className="flex items-center gap-2">
          {isSniperMode ? (
            <Crosshair className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
          ) : (
            <Zap className={`w-4 h-4 shrink-0 ${isFormulaMode ? 'text-amber-400' : 'text-cyan-400'}`} />
          )}
          <span>
            {isSniper4Mode ? (
              <>
                လက်ရှိတွင် <strong>4-Loss Sniper Wait & Strike စနစ်</strong> အတိုင်း အလိုအလျောက် စောင့်ကြည့်ကစားနေပါသည်။ ၄ ကြိမ်ဆက်တိုက်ရှုံးသော Method တွေ့ရှိသည်နှင့် <strong>"HEY! NOW I AM START BETTING" အသံမြည်</strong> ၍ အချက်ပြကာ Win မဖြစ်မချင်း ထို Method တမျိုးတည်းဖြင့် လောင်းပါမည်။ Win လျှင် Bet တာရပ်ပြီး အမြတ်သိမ်းကာ နောက်ထပ် ၄ ကြိမ်ရှုံး Method ကို ပြန်လည်စောင့်ဆိုင်းပါမည်။
              </>
            ) : isSniper5Mode ? (
              <>
                လက်ရှိတွင် <strong>5-Loss Sniper Wait & Strike စနစ်</strong> အတိုင်း အလိုအလျောက် စောင့်ကြည့်ကစားနေပါသည်။ ၃ ကြိမ်ရှုံးနေတာတွေ့လျှင် <strong>"I found 3 lose method" အသံမြည်</strong> ပေးပြီး၊ ၅ ကြိမ်ရှုံးသော Method တွေ့ရှိပါက Win မဖြစ်မချင်း ထို Method တမျိုးတည်းဖြင့် လောင်းပါမည်။ Win လျှင် Bet ရပ်ပြီး အမြတ်သိမ်းကာ ပြန်လည်စောင့်ဆိုင်းပါမည်။
              </>
            ) : isSniper6Mode ? (
              <>
                လက်ရှိတွင် <strong>6-Loss Sniper Wait & Strike စနစ်</strong> အတိုင်း အလိုအလျောက် စောင့်ကြည့်ကစားနေပါသည်။ ၄ ကြိမ်ရှုံးလျှင် Slot Scatter Alarm အသံပေးပြီး ၆ ကြိမ်ရှုံးသော Method တွေ့ရှိပါက Win မဖြစ်မချင်း သီးသန့် Bet ပါမည်။ Win ဖြစ်ပါက အမြတ်သိမ်း၍ ပြန်လည်စောင့်ဆိုင်းပါမည်။
              </>
            ) : isFormulaMode ? (
              <>
                လက်ရှိတွင် <strong>10-Minutes AI Formula ({activeFormula?.code})</strong> အတိုင်း အလိုအလျောက် ချိန်ညှိကစားနေပါသည်။ ၁၀ မိနစ်ပြည့်တိုင်း Formula အသစ်ပြောင်းလဲပေးပါမည်။
              </>
            ) : (
              <>
                လက်ရှိတွင် <strong>နည်းပညာ ၇ မျိုးမှ [{currentAlgorithm}]</strong> ဖြင့် တိုက်ရိုက်ကစားနေပါသည်။ ၂ ကြိမ်ဆက်တိုက်ရှုံးပါက အကောင်းဆုံး Method သို့ AI မှ Auto ပြောင်းပေးပါမည်။
              </>
            )}
          </span>
        </div>

        <span className="text-[10px] font-mono text-slate-400 shrink-0 self-end sm:self-center">
          {isAutoBetActive ? '🟢 Auto Bet Active' : '⚪ Auto Bet Idle'}
        </span>
      </div>
    </div>
  );
};

