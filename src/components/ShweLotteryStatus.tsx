import React, { useState } from 'react';
import { 
  Globe, 
  CheckCircle2, 
  Radio, 
  ExternalLink, 
  User, 
  Key, 
  Activity, 
  RefreshCw,
  Zap,
  Server
} from 'lucide-react';
import { ShweAccount } from '../types/lottery';

interface ShweLotteryStatusProps {
  account: ShweAccount;
  onRefreshLogin: (phone: string, pass: string) => Promise<{ success: boolean; message: string }> | void;
  isSyncing: boolean;
}

export const ShweLotteryStatus: React.FC<ShweLotteryStatusProps> = ({
  account,
  onRefreshLogin,
  isSyncing,
}) => {
  const [showEdit, setShowEdit] = useState(false);
  const [phone, setPhone] = useState(account.phone);
  const [password, setPassword] = useState(account.password || '');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onRefreshLogin(phone, password);
    setShowEdit(false);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Server & URL */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Server className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">ShweLottery Wingo 60s Stream</span>
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE LIVE
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
              <a 
                href={account.targetUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-amber-400 flex items-center gap-1 transition-colors underline decoration-slate-600"
              >
                <Globe className="w-3.5 h-3.5" />
                https://www.shwelottery.net/
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Activity className="w-3 h-3 text-amber-400" />
                {account.latencyMs}ms latency
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Account Credentials & Player Profile */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{account.nickName || 'MemberNNG0XDE5'}</span>
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {account.amount ? `K ${account.amount}` : 'K 1,000.00'}
              </span>
            </div>
            <div className="text-slate-400 flex items-center justify-between gap-3 text-[11px]">
              <span>Ph: <strong className="text-white">09××××××××</strong></span>
              <span className="text-slate-500">Pass: ••••••••</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => onRefreshLogin(account.phone, account.password || '')}
              disabled={isSyncing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Sync connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowEdit(!showEdit)}
              className="text-[10px] text-amber-400 hover:underline px-1 text-center"
            >
              {showEdit ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* EDIT CREDENTIALS ACCORDION */}
      {showEdit && (
        <form onSubmit={handleUpdate} className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2 items-center text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Ph:</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent text-white font-mono outline-none w-28"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Password:</span>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent text-white font-mono outline-none w-28"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold"
          >
            Save & Connect
          </button>
        </form>
      )}
    </div>
  );
};
