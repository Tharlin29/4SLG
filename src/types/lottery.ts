export type DrawSize = 'BIG' | 'SMALL';
export type DrawColor = 'RED' | 'GREEN' | 'VIOLET' | 'RED_VIOLET' | 'GREEN_VIOLET';

export interface WingoDraw {
  period: string;
  number: number;
  size: DrawSize;
  color: DrawColor;
  timestamp: number;
  openTime: string;
  openTimeMMT?: string;
  fullTime?: string;
  premium?: string;
}

export type AlgorithmType = 'HMM' | 'MARKOV' | 'ENSEMBLE' | 'NEURAL_MATRIX' | 'NGRAM_SEQUENCE' | 'STATISTICAL_PROB' | 'META_SUPER_AI';

export type BettingEngineMode = 'FORMULA_MODE' | 'METHODS_7_MODE' | 'SNIPER_4LOSS_MODE' | 'SNIPER_5LOSS_MODE' | 'SNIPER_6LOSS_MODE';

export interface MethodPerformanceStats {
  algorithm: AlgorithmType;
  label: string;
  burmeseLabel: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number; // percentage, e.g. 78.4
  streak: number; // positive for win streak, negative for loss streak
  last10: boolean[]; // history of last 10 outcomes (true = win, false = loss)
}

export type AllMethodsStats = Record<AlgorithmType, MethodPerformanceStats>;

export interface ScatterAlarmEvent {
  algorithm: AlgorithmType;
  label: string;
  burmeseLabel: string;
  consecutiveLosses: number; // 3, 4, 5, or 6+
  period: string;
  timestamp: number;
  message: string;
  level: 'FOUND_3_LOSS' | 'WARNING_4' | 'CRITICAL_5' | 'LOCKED_4' | 'LOCKED_5' | 'LOCKED_6' | 'START_BET_ACTIVE_4';
}

export interface AutoSwitchEvent {
  fromAlgo: AlgorithmType;
  toAlgo: AlgorithmType;
  fromWinRate: number;
  toWinRate: number;
  reason: string;
  timestamp: number;
}

export interface HmmDetails {
  stateIndex: number;
  stateLabel: string;
  stateBurmese: string;
  pBig: number; // percentage, e.g. 78.4
  pSmall: number; // percentage, e.g. 21.6
  transitionLikelihood: number; // percentage, e.g. 84.2
  stateProbabilities: {
    state: string;
    label: string;
    prob: number;
  }[];
}

export interface PredictionResult {
  targetPeriod: string;
  size: DrawSize;
  sizeBurmese: string;
  color: 'RED' | 'GREEN' | 'VIOLET';
  colorBurmese: string;
  numbers: number[];
  confidence: number;
  pattern: string;
  algorithm: string;
  algorithmMode?: AlgorithmType;
  hmmDetails?: HmmDetails;
  riskLevel: string;
  suggestedMultipliers: string[];
  actualResult?: {
    number: number;
    size: DrawSize;
    color: DrawColor;
    isWin: boolean;
  };
}

export interface ShweAccount {
  phone: string;
  password?: string;
  isConnected: boolean;
  latencyMs: number;
  lastPing: number;
  targetUrl: string;
  userId?: string;
  nickName?: string;
  amount?: string;
}

export interface UserAccessState {
  isAdmin: boolean;
  timeCoins: number;
  remainingSeconds: number;
  unlimitedTime: boolean; // True for admin (bypasses all time limit)
}

export interface AutoMonitoringState {
  isActive: boolean;
  autoProfit: number;
  autoWins: number;
  autoLosses: number;
  currentAutoStake: number;
  autoBaseAmount: number;
  consecutiveLosses: number;
  autoMultiplierMode: number;
  winStopEnabled: boolean;
  winStopAmount: number;
  loseStopEnabled: boolean;
  loseStopAmount: number;
  stopReason: 'WIN_STOP' | 'LOSE_STOP' | 'INSUFFICIENT_BALANCE' | null;
  autoStrategy: 'AI_GUESS' | 'MANUAL_CHOICE' | 'WAIT_BOT' | 'SNIPER_4LOSS' | 'SNIPER_5LOSS' | 'SNIPER_6LOSS';
  startTime: number | null;
  elapsedSeconds: number;
  targetReachedDuration: number | null; // Exact seconds taken to achieve target profit
  nonStopAutoBet?: boolean;
  nonStopCountdown?: number | null;
  nonStopWaitSeconds?: number;
  bettingEngineMode?: BettingEngineMode;
  sniperStatus?: 'SCANNING_WAIT' | 'LOCKED_BETTING' | 'WON_RESET';
  sniperLockedAlgo?: AlgorithmType | null;
}

export interface AiFormula {
  id: string;
  code: string;
  title: string;
  burmeseTitle: string;
  description: string;
  burmeseDescription: string;
  generatedAt: number;
  nextRefreshAt: number; // timestamp in ms (10 mins after generation)
  expectedWinRate: number; // e.g. 95.2%
  sampleHistorySize: number;
  regimeType: 'DRAGON_MOMENTUM' | 'CHOP_ALTERNATING' | 'DOUBLET_TWIN' | 'MEAN_REVERSION' | 'META_CONSENSUS';
  recommendedMethod: AlgorithmType;
  recommendedMultiplier: number;
  recommendedBaseStake: number;
  recommendedWinStop: number;
  recommendedLoseStop: number;
  recommendedStrategy: 'AI_GUESS' | 'WAIT_BOT';
  dominantSize: DrawSize;
  rules: string[];
  burmeseRules: string[];
  liveFormulaWins: number;
  liveFormulaLosses: number;
  winStopEnabled?: boolean;
  loseStopEnabled?: boolean;
  isCustomized?: boolean;
}
