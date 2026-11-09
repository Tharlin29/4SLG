import React, { useState } from 'react';
import { Coins, X, CheckCircle2, AlertCircle, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { UserAccessState } from '../types/lottery';

interface UserCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccess: UserAccessState;
  onRedeemCode: (code: string) => Promise<{ success: boolean; message: string; coins?: number; minutes?: number }>;
  onOpenAdmin: () => void;
}

export const UserCoinModal: React.FC<UserCoinModalProps> = ({
  isOpen,
  onClose,
  userAccess,
  onRedeemCode,
  onOpenAdmin,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await onRedeemCode(code.trim());
      setFeedback(res);
      if (res.success) {
        setCode('');
      }
    } catch (e) {
      setFeedback({ success: false, message: 'ချိတ်ဆက်မှု မအောင်မြင်ပါ။' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-amber-500/20">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Time Coin & Access Pass</h3>
              <p className="text-xs text-slate-400">AI Predator Auto Guess အသုံးပြုချိန် ဖြည့်သွင်းရန်</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          {/* BALANCE CARDS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Time Coins
              </span>
              <span className="text-2xl font-tech font-bold text-amber-400 mt-1">
                {userAccess.isAdmin ? 'UNLIMITED' : userAccess.timeCoins}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Remaining Time
              </span>
              <span className="text-xl font-mono font-bold text-white mt-1">
                {userAccess.isAdmin ? 'NO LIMIT' : `${Math.floor(userAccess.remainingSeconds / 60)}m ${userAccess.remainingSeconds % 60}s`}
              </span>
            </div>
          </div>

          {/* REDEEM FORM */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Voucher / Redeem Code ရိုက်ထည့်ပါ:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. PREDATOR-VIP, WINGO60-WIN"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shadow transition-all disabled:opacity-50"
              >
                {loading ? 'စစ်ဆေးနေသည်...' : 'Redeem'}
              </button>
            </div>

            {feedback && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.success 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                  : 'bg-red-950/40 border-red-500/50 text-red-300'
              }`}>
                {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}
          </form>

          {/* ADMIN BYPASS SHORTCUT */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Admin အကောင့်ဖြစ်ပါက:</span>
            <button
              onClick={() => { onClose(); onOpenAdmin(); }}
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Login (Skip Time Limit)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
