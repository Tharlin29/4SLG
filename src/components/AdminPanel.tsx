import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  CheckCircle, 
  Coins, 
  Sliders, 
  RefreshCw, 
  ExternalLink, 
  PlusCircle, 
  X, 
  Sparkles,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { UserAccessState } from '../types/lottery';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userAccess: UserAccessState;
  onAdminLogin: (passcode: string) => boolean;
  onAdminLogout: () => void;
  onAddUserCoins: (amount: number, minutes: number) => void;
  sensitivity: 'BALANCED' | 'AGGRESSIVE' | 'HIGH_CONFIDENCE';
  onChangeSensitivity: (val: 'BALANCED' | 'AGGRESSIVE' | 'HIGH_CONFIDENCE') => void;
  onResetStats: () => void;
  onForceSync: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  userAccess,
  onAdminLogin,
  onAdminLogout,
  onAddUserCoins,
  sensitivity,
  onChangeSensitivity,
  onResetStats,
  onForceSync,
}) => {
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{ code: string; coins: number; minutes: number } | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onAdminLogin(passcode);
    if (success) {
      setLoginSuccess(true);
      setPasscode('');
      setTimeout(() => setLoginSuccess(false), 2000);
    } else {
      setLoginError('Admin Passcode မမှန်ကန်ပါ။ စစ်ဆေးပြီး ပြန်လည်ထည့်သွင်းပါ။');
    }
  };

  const handleCreateCode = (coins: number, minutes: number) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `SHWE-${coins}C-${randomSuffix}`;
    setGeneratedCode({ code, coins, minutes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-amber-500/20">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-tech text-base font-bold text-white flex items-center gap-2">
                ADMIN CONTROL CENTER
                {userAccess.isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold font-mono">
                    UNLIMITED VIP
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Time Limit Bypass, Auto Guess Algorithm, & ShweLottery Settings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
          {/* NOTICE: ADMIN ONLY SKIP TIME COIN */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/60 to-amber-950/40 border border-red-500/40 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white text-sm block mb-0.5">
                Admin Privilege: Time Coin & Time Limit Auto-Skip
              </span>
              Admin login ဝင်ထားသည့်အခါ Time Coin ကုန်ခြင်း သို့မဟုတ် Time Limit ဖြစ်ခြင်းများကို Admin အနေဖြင့် လုံးဝ ကျော်လွှား (ONLY SKIP) ကာ အကန့်အသတ်မရှိ အသုံးပြုနိုင်ပါသည်။
            </div>
          </div>

          {/* ADMIN LOGIN OR ADMIN STATUS */}
          {!userAccess.isAdmin ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Admin Passcode ဖြင့် Login ဝင်ပါ
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  <span className="text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Authorized Personnel Only</span>
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Enter Admin Passcode..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {loginError}
                  </p>
                )}

                {loginSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Admin Login အောင်မြင်ပါသည်။ Time limit ကို skip လုပ်ပြီးပါပြီ!
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm rounded-lg shadow-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Login ဝင်မည် (Unlock VIP)
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-sm font-bold text-white">ADMIN STATUS: ACTIVE</span>
                </div>
                <button
                  onClick={onAdminLogout}
                  className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                  Logout (ရိုးရိုး User သို့ ပြန်ပြောင်း)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Time Limit Status:</span>
                  <span className="text-emerald-400 font-bold font-mono">BYPASSED (မကုန်ပါ)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Time Coins:</span>
                  <span className="text-amber-400 font-bold font-mono">UNLIMITED (∞)</span>
                </div>
              </div>
            </div>
          )}

          {/* TIME COIN & VOUCHER GENERATOR */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              Time Coin စီမံခန့်ခွဲမှု (Manage Time Coins)
            </h4>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAddUserCoins(20, 60)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-white flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                +20 Coins (1 နာရီ) ပေါင်းမည်
              </button>
              <button
                onClick={() => onAddUserCoins(50, 180)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-white flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                +50 Coins (3 နာရီ) ပေါင်းမည်
              </button>
              <button
                onClick={() => onAddUserCoins(100, 720)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                +100 Coins (12 နာရီ) VIP
              </button>
            </div>

            {/* GENERATE REDEEM VOUCHER CODE */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 block mb-2">User များအတွက် Recharge Voucher Code ထုတ်ရန်:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCreateCode(30, 90)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Generate 30 Coin Code
                </button>
                <button
                  onClick={() => handleCreateCode(100, 300)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Generate 100 Coin VIP Code
                </button>
              </div>

              {generatedCode && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Generated Code:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm select-all">
                      {generatedCode.code}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    +{generatedCode.coins} Coins ({generatedCode.minutes} မိနစ်)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI ALGORITHM TUNING */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              AI Auto Guess Sensitivity (ခန့်မှန်းမှုမုဒ်)
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onChangeSensitivity('BALANCED')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  sensitivity === 'BALANCED'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="font-bold">Balanced (မျှတ)</div>
                <div className="text-[10px] text-slate-400 mt-1">Normal pattern + Dragon follow</div>
              </button>

              <button
                onClick={() => onChangeSensitivity('HIGH_CONFIDENCE')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  sensitivity === 'HIGH_CONFIDENCE'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="font-bold">High Conf (စိတ်ချရ)</div>
                <div className="text-[10px] text-slate-400 mt-1">Strict filter (90%+ only)</div>
              </button>

              <button
                onClick={() => onChangeSensitivity('AGGRESSIVE')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  sensitivity === 'AGGRESSIVE'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="font-bold">Aggressive (ဆန်းသစ်)</div>
                <div className="text-[10px] text-slate-400 mt-1">Dragon Breakers & Reversal</div>
              </button>
            </div>
          </div>

          {/* DATA & DIAGNOSTICS */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-white">ShweLottery Data & Cache Reset</h5>
              <p className="text-[11px] text-slate-400">
                Wingo 60s live data ချိတ်ဆက်မှုကို ပြန်လည်စစ်ဆေးပြီး စာရင်းပြန်ညှိရန်
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onResetStats}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700"
              >
                Reset Win/Loss
              </button>
              <button
                onClick={onForceSync}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Force Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
