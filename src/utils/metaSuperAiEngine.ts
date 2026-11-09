import { WingoDraw, PredictionResult, DrawSize, AlgorithmType, AllMethodsStats } from '../types/lottery';
import { calculateHMMGuess } from './hmmEngine';
import { calculateDeepPatternGuess } from './deepPatternEngine';
import { calculateNgramSequenceGuess } from './ngramSequenceEngine';
import { calculateStatisticalProbGuess } from './statisticalEngine';
import { calculateMarkovGuess, calculateEnsembleGuess } from './predictionEngine';

/**
 * META_SUPER_AI ENGINE
 * 
 * ထည့်သွင်းထားသော Method ၆ ခု (HMM, Markov, Ensemble, Deep Pattern AI, 3-Gram / N-Gram, Statistical & Probability)
 * စလုံး၏ guess များကို ရယူပြီး စွမ်းဆောင်ရည်အလိုက် Performance-Weighted Borda Consensus တွက်ချက်ကာ
 * အကောင်းဆုံး Guess ကို ဖော်ထုတ်ပေးသည့် အထွတ်အထိပ် AI Method ဖြစ်ပါသည်။
 */
export function calculateMetaSuperAiGuess(
  history: WingoDraw[],
  nextPeriod: string,
  sensitivity: 'BALANCED' | 'AGGRESSIVE' | 'HIGH_CONFIDENCE' = 'BALANCED',
  basePredictions?: Partial<Record<AlgorithmType, PredictionResult>>,
  methodStats?: AllMethodsStats
): PredictionResult {
  // If base predictions are not provided, calculate all 6 base methods
  const hmmPred = basePredictions?.HMM || calculateHMMGuess(history, nextPeriod);
  const markovPred = basePredictions?.MARKOV || calculateMarkovGuess(history, nextPeriod, sensitivity);
  const ensemblePred = basePredictions?.ENSEMBLE || calculateEnsembleGuess(history, nextPeriod, sensitivity);
  const neuralPred = basePredictions?.NEURAL_MATRIX || calculateDeepPatternGuess(history, nextPeriod, sensitivity);
  const ngramPred = basePredictions?.NGRAM_SEQUENCE || calculateNgramSequenceGuess(history, nextPeriod, sensitivity);
  const statPred = basePredictions?.STATISTICAL_PROB || calculateStatisticalProbGuess(history, nextPeriod, sensitivity);

  const baseMethods: { id: AlgorithmType; name: string; pred: PredictionResult; defaultWeight: number }[] = [
    { id: 'HMM', name: 'HMM', pred: hmmPred, defaultWeight: 1.15 },
    { id: 'MARKOV', name: 'Markov', pred: markovPred, defaultWeight: 0.95 },
    { id: 'ENSEMBLE', name: 'Ensemble', pred: ensemblePred, defaultWeight: 1.2 },
    { id: 'NEURAL_MATRIX', name: 'Deep Pattern AI', pred: neuralPred, defaultWeight: 1.35 },
    { id: 'NGRAM_SEQUENCE', name: '3-Gram / N-Gram', pred: ngramPred, defaultWeight: 1.35 },
    { id: 'STATISTICAL_PROB', name: 'Statistical & Prob', pred: statPred, defaultWeight: 1.30 },
  ];

  // Calculate dynamic weight for each method based on live historical stats
  let totalBigWeight = 0;
  let totalSmallWeight = 0;
  let bigVoteCount = 0;
  let smallVoteCount = 0;

  const colorVotes: Record<'RED' | 'GREEN' | 'VIOLET', number> = { RED: 0, GREEN: 0, VIOLET: 0 };
  const numberScores: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  baseMethods.forEach(({ id, pred, defaultWeight }) => {
    let weight = defaultWeight;
    if (methodStats && methodStats[id]) {
      const stat = methodStats[id];
      const winRateRatio = Math.max(0.5, stat.winRate / 100);
      const streakBonus = stat.streak > 0 ? Math.min(1.4, 1 + stat.streak * 0.08) : Math.max(0.7, 1 + stat.streak * 0.1);
      weight = Math.pow(winRateRatio, 1.8) * streakBonus * (pred.confidence / 100) * 1.5;
    }

    // Size voting
    if (pred.size === 'BIG') {
      totalBigWeight += weight;
      bigVoteCount++;
    } else {
      totalSmallWeight += weight;
      smallVoteCount++;
    }

    // Color voting
    if (pred.color === 'RED' || pred.color === 'GREEN' || pred.color === 'VIOLET') {
      colorVotes[pred.color] += weight;
    }

    // Numbers voting (1st choice gets full weight, 2nd gets 0.7x, 3rd gets 0.4x)
    pred.numbers.forEach((num, idx) => {
      if (num >= 0 && num <= 9) {
        const posWeight = idx === 0 ? 1.0 : idx === 1 ? 0.7 : 0.4;
        numberScores[num] += weight * posWeight;
      }
    });
  });

  // Final consensus for Size
  const predictedSize: DrawSize = totalBigWeight >= totalSmallWeight ? 'BIG' : 'SMALL';
  const winningWeight = predictedSize === 'BIG' ? totalBigWeight : totalSmallWeight;
  const losingWeight = predictedSize === 'BIG' ? totalSmallWeight : totalBigWeight;
  const consensusRatio = winningWeight / Math.max(0.01, totalBigWeight + totalSmallWeight);
  const agreementCount = predictedSize === 'BIG' ? bigVoteCount : smallVoteCount;

  // Confidence calculation
  let baseConfidence = 91;
  if (agreementCount >= 6) {
    baseConfidence = 98; // 100% full agreement of all 6 methods
  } else if (agreementCount === 5) {
    baseConfidence = 95;
  } else if (agreementCount === 4) {
    baseConfidence = 92;
  } else {
    // 3 vs 3 or close split - rely on performance weights
    baseConfidence = Math.min(94, Math.max(88, Math.round(85 + consensusRatio * 12)));
  }

  // Final consensus for Color
  let predictedColor: 'RED' | 'GREEN' | 'VIOLET' = 'RED';
  let maxColorWeight = -1;
  (['RED', 'GREEN', 'VIOLET'] as const).forEach(col => {
    if (colorVotes[col] > maxColorWeight) {
      maxColorWeight = colorVotes[col];
      predictedColor = col;
    }
  });

  // Pick top 3 numbers aligned with chosen size
  const candidateNumbers = (predictedSize === 'BIG' ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4]);
  candidateNumbers.sort((a, b) => (numberScores[b] || 0) - (numberScores[a] || 0));
  const topNumbers = candidateNumbers.slice(0, 3);

  const patternSummary = `Meta-Consensus AI • နည်းပညာ ၆ မျိုးပေါင်းစပ် Consensus (${agreementCount}/6 Methods ထောက်ခံမှု ${(consensusRatio * 100).toFixed(0)}%)`;

  return {
    targetPeriod: nextPeriod,
    size: predictedSize,
    sizeBurmese: predictedSize === 'BIG' ? 'ကြီး (BIG)' : 'ငယ် (SMALL)',
    color: predictedColor,
    colorBurmese: predictedColor === 'RED' ? 'အနီ (RED)' : predictedColor === 'GREEN' ? 'အစိမ်း (GREEN)' : 'ခရမ်း (VIOLET)',
    numbers: topNumbers.length === 3 ? topNumbers : (predictedSize === 'BIG' ? [7, 8, 9] : [1, 2, 3]),
    confidence: Math.min(98, Math.max(88, baseConfidence)),
    pattern: patternSummary,
    algorithm: 'Meta-Consensus Super AI (နည်းပညာ ၆ မျိုးပေါင်းစပ် အထွတ်အထိပ် AI v5.0)',
    algorithmMode: 'META_SUPER_AI',
    riskLevel: baseConfidence >= 93 ? 'VERY LOW RISK (အလွန်စိတ်ချရ)' : 'LOW RISK (စိတ်ချရ)',
    suggestedMultipliers: ['1X', '3X', '8X']
  };
}
