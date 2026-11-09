import { AlgorithmType, AllMethodsStats, ScatterAlarmEvent } from '../types/lottery';

export interface MethodLossDetail {
  algorithm: AlgorithmType;
  label: string;
  burmeseLabel: string;
  consecutiveLosses: number;
  is3LossWarning: boolean; // >= 3 losses ("I found 3 lose method")
  isScatterWarning: boolean; // >= 4 losses (Slot scatter sound)
  isCriticalWarning: boolean; // >= 5 losses
  is4LossSniperReady: boolean; // >= 4 losses (4-loss wait & strike)
  is5LossSniperReady: boolean; // >= 5 losses
  is6LossSniperReady: boolean; // >= 6 losses
  isSniperReady: boolean; // >= target threshold
}

export interface SniperEvaluationResult {
  details: MethodLossDetail[];
  warningMethods3: MethodLossDetail[];
  warningMethods4: MethodLossDetail[];
  criticalMethods5: MethodLossDetail[];
  readyMethods4: MethodLossDetail[];
  readyMethods5: MethodLossDetail[];
  readyMethods6: MethodLossDetail[];
  lockedCandidate: MethodLossDetail | null;
  lockedCandidate4: MethodLossDetail | null;
  lockedCandidate5: MethodLossDetail | null;
  lockedCandidate6: MethodLossDetail | null;
  highestLossCount: number;
  highestLossAlgo: AlgorithmType | null;
}

export const ALL_7_ALGORITHMS: AlgorithmType[] = [
  'META_SUPER_AI',
  'STATISTICAL_PROB',
  'NGRAM_SEQUENCE',
  'NEURAL_MATRIX',
  'ENSEMBLE',
  'HMM',
  'MARKOV'
];

/**
 * ၇ မျိုးသော Method များ၏ Consecutive Loss များကို စစ်ဆေးတွက်ချက်ပေးသည့် Engine ဖြစ်ပါသည်။
 * User ကစားသည်ဖြစ်စေ မကစားသည်ဖြစ်စေ နောက်ကွယ်တွင် အမြဲတစေ Scan ပြုလုပ်နေပါသည်။
 */
export function evaluateAllMethodsLossStreaks(
  stats: AllMethodsStats,
  targetThreshold: 4 | 5 | 6 = 4
): SniperEvaluationResult {
  const details: MethodLossDetail[] = [];
  const warningMethods3: MethodLossDetail[] = [];
  const warningMethods4: MethodLossDetail[] = [];
  const criticalMethods5: MethodLossDetail[] = [];
  const readyMethods4: MethodLossDetail[] = [];
  const readyMethods5: MethodLossDetail[] = [];
  const readyMethods6: MethodLossDetail[] = [];

  let highestLossCount = 0;
  let highestLossAlgo: AlgorithmType | null = null;
  let lockedCandidate4: MethodLossDetail | null = null;
  let lockedCandidate5: MethodLossDetail | null = null;
  let lockedCandidate6: MethodLossDetail | null = null;

  for (const algo of ALL_7_ALGORITHMS) {
    const s = stats[algo];
    const streak = s?.streak || 0;
    const consecutiveLosses = streak < 0 ? Math.abs(streak) : 0;
    const label = s?.label || algo;
    const burmeseLabel = s?.burmeseLabel || algo;

    const is3LossWarning = consecutiveLosses >= 3;
    const isScatterWarning = consecutiveLosses >= 4;
    const isCriticalWarning = consecutiveLosses >= 5;
    const is4LossSniperReady = consecutiveLosses >= 4;
    const is5LossSniperReady = consecutiveLosses >= 5;
    const is6LossSniperReady = consecutiveLosses >= 6;
    const isSniperReady = consecutiveLosses >= targetThreshold;

    const item: MethodLossDetail = {
      algorithm: algo,
      label,
      burmeseLabel,
      consecutiveLosses,
      is3LossWarning,
      isScatterWarning,
      isCriticalWarning,
      is4LossSniperReady,
      is5LossSniperReady,
      is6LossSniperReady,
      isSniperReady
    };

    details.push(item);

    if (consecutiveLosses > highestLossCount) {
      highestLossCount = consecutiveLosses;
      highestLossAlgo = algo;
    }

    if (is6LossSniperReady) {
      readyMethods6.push(item);
    }
    if (is5LossSniperReady) {
      readyMethods5.push(item);
      criticalMethods5.push(item);
    }
    if (is4LossSniperReady) {
      readyMethods4.push(item);
    }

    if (consecutiveLosses === 4) {
      warningMethods4.push(item);
    } else if (consecutiveLosses === 3) {
      warningMethods3.push(item);
    }
  }

  // Pick candidates
  if (readyMethods4.length > 0) {
    readyMethods4.sort((a, b) => b.consecutiveLosses - a.consecutiveLosses);
    lockedCandidate4 = readyMethods4[0];
  }
  if (readyMethods5.length > 0) {
    readyMethods5.sort((a, b) => b.consecutiveLosses - a.consecutiveLosses);
    lockedCandidate5 = readyMethods5[0];
  }
  if (readyMethods6.length > 0) {
    readyMethods6.sort((a, b) => b.consecutiveLosses - a.consecutiveLosses);
    lockedCandidate6 = readyMethods6[0];
  }

  const lockedCandidate = targetThreshold === 4
    ? lockedCandidate4
    : targetThreshold === 5
    ? lockedCandidate5
    : lockedCandidate6;

  return {
    details,
    warningMethods3,
    warningMethods4,
    criticalMethods5,
    readyMethods4,
    readyMethods5,
    readyMethods6,
    lockedCandidate,
    lockedCandidate4,
    lockedCandidate5,
    lockedCandidate6,
    highestLossCount,
    highestLossAlgo
  };
}

/**
 * Check if a new Scatter / 3-Loss / 4-Loss START BET Alarm Event should trigger for this period
 */
export function checkScatterAlarmTrigger(
  stats: AllMethodsStats,
  currentPeriod: string,
  lastTriggeredKeyRef: { current: string },
  targetThreshold: 4 | 5 | 6 = 4
): ScatterAlarmEvent | null {
  const result = evaluateAllMethodsLossStreaks(stats, targetThreshold);

  if (targetThreshold === 4) {
    // 4-LOSS SNIPER MODE: Target is 4 consecutive losses
    // "Method 7 မျိုးထဲ မှ 4 ကြိမ်ဆက်တိုက်ရှုံးသော METHOD ကို AI မှ Auto ရှာနေမယ် ရပြီဆိုရင် အဲ့ ဒီ method တမျိုးတည်းကို သုံးပြီး တခြားဘယ် METHOD ကိုမှမသုံးဘဲ win မဖြစ်မချင်း BET မယ်"
    // "START BET ACTIVE ဖြစ်သည်နှင့်တပြိုင်နက် ALARM SOUND အနေဖြင့် HEY! NOW I AM START BETTING ကို use ပြီး signal ပြပေးပါ"
    if (result.readyMethods4.length > 0) {
      const target = result.readyMethods4[0];
      const key = `${currentPeriod}-${target.algorithm}-START_BET_ACTIVE_4`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'START_BET_ACTIVE_4',
          message: `🚨 [START BET ACTIVE] "HEY! NOW I AM START BETTING" — Method [${target.label}] သည် ၄ ကြိမ် ဆက်တိုက် ရှုံးထားသဖြင့် Win မဖြစ်မချင်း ဤ Method တမျိုးတည်းဖြင့်သာ စတင်လောင်းပါပြီ!`
        };
      }
    } else if (result.warningMethods3.length > 0) {
      const target = result.warningMethods3[0];
      const key = `${currentPeriod}-${target.algorithm}-FOUND_3_LOSS`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'FOUND_3_LOSS',
          message: `⚠️ [4-LOSS MODE APPROACHING] Method [${target.label}] သည် ၃ ကြိမ် ဆက်တိုက် ရှုံးနေပါပြီ! (၃/၄ အဆင့် - နောက်တစ်ကြိမ်ရှုံးပါက ၄ ကြိမ်ရှုံး "HEY! NOW I AM START BETTING" အချက်ပေးပြီး စတင်လောင်းမည်)`
        };
      }
    }
  } else if (targetThreshold === 6) {
    // 6-LOSS SNIPER MODE: Target is 6 consecutive losses
    if (result.readyMethods6.length > 0) {
      const target = result.readyMethods6[0];
      const key = `${currentPeriod}-${target.algorithm}-LOCKED_6`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'LOCKED_6',
          message: `🎯 [6-LOSS SNIPER LOCK ACTIVATED] Method [${target.label}] သည် ၆ ကြိမ် ဆက်တိုက် ရှုံးသွားပါပြီ! Win ဖြစ်သည်အထိ ဤ Method တမျိုးတည်းဖြင့် စတင်လောင်းပါမည်!`
        };
      }
    } else if (result.criticalMethods5.length > 0) {
      const target = result.criticalMethods5[0];
      const key = `${currentPeriod}-${target.algorithm}-CRITICAL_5`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'CRITICAL_5',
          message: `⚠️ [6-LOSS MODE APPROACHING] Method [${target.label}] သည် ၅ ကြိမ် ဆက်တိုက် ရှုံးနေပါပြီ! (၅/၆ အဆင့် ရောက်ရှိ - နောက်တစ်ကြိမ်ရှုံးပါက ၆ ကြိမ်ရှုံး Sniper Strike စတင်မည်)`
        };
      }
    } else if (result.warningMethods4.length > 0) {
      const target = result.warningMethods4[0];
      const key = `${currentPeriod}-${target.algorithm}-WARNING_4`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'WARNING_4',
          message: `🎰 [SLOT SCATTER ALARM] Method [${target.label}] သည် ၄ ကြိမ် ဆက်တိုက် ရှုံးနေပါပြီ! (၄/၆ အဆင့် Slot Scatter Alarm အသံမြည်ပါသည်)`
        };
      }
    }
  } else {
    // 5-LOSS SNIPER MODE: Target is 5 consecutive losses
    if (result.readyMethods5.length > 0) {
      const target = result.readyMethods5[0];
      const key = `${currentPeriod}-${target.algorithm}-LOCKED_5`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'LOCKED_5',
          message: `🎯 [5-LOSS SNIPER LOCK ACTIVATED] Method [${target.label}] သည် ၅ ကြိမ် ဆက်တိုက် ရှုံးသွားပါပြီ! Win ဖြစ်သည်အထိ ဤ Method တမျိုးတည်းဖြင့် စတင်လောင်းပါမည်!`
        };
      }
    } else if (result.warningMethods4.length > 0) {
      const target = result.warningMethods4[0];
      const key = `${currentPeriod}-${target.algorithm}-WARNING_4`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'WARNING_4',
          message: `⚠️ [5-LOSS MODE APPROACHING] Method [${target.label}] သည် ၄ ကြိမ် ဆက်တိုက် ရှုံးနေပါပြီ! (၄/၅ အဆင့် ရောက်ရှိ - နောက်တစ်ကြိမ်ရှုံးပါက ၅ ကြိမ်ရှုံး Sniper Strike စတင်မည်)`
        };
      }
    } else if (result.warningMethods3.length > 0) {
      const target = result.warningMethods3[0];
      const key = `${currentPeriod}-${target.algorithm}-FOUND_3_LOSS`;
      if (lastTriggeredKeyRef.current !== key) {
        lastTriggeredKeyRef.current = key;
        return {
          algorithm: target.algorithm,
          label: target.label,
          burmeseLabel: target.burmeseLabel,
          consecutiveLosses: target.consecutiveLosses,
          period: currentPeriod,
          timestamp: Date.now(),
          level: 'FOUND_3_LOSS',
          message: `🚨 [I FOUND 3 LOSE METHOD] Method [${target.label}] သည် ၃ ကြိမ် ဆက်တိုက် ရှုံးနေပါပြီ! (၃/၅ အဆင့် - "I found 3 lose method" voice alarm!)`
        };
      }
    }
  }

  return null;
}
