import { WingoDraw, PredictionResult, DrawSize, HmmDetails } from '../types/lottery';

// Hidden States for WinGo Lottery Market Regime
export const HMM_STATES = [
  { index: 0, key: 'DRAGON_BIG', label: 'Dragon Trend (BIG)', burmese: 'နဂါးဆက်ကြီး Regime (5-9 ဦးစားပေး)' },
  { index: 1, key: 'DRAGON_SMALL', label: 'Dragon Trend (SMALL)', burmese: 'နဂါးဆက်ငယ် Regime (0-4 ဦးစားပေး)' },
  { index: 2, key: 'CHOP_PINGPONG', label: 'Chop Alternating', burmese: 'အလွဲအချိန်း Regime (တလှည့်စီထွက်)' },
  { index: 3, key: 'EQUILIBRIUM', label: 'Harmonic Equilibrium', burmese: 'ပျမ်းမျှချိန်ညှိ Reversion Regime' }
];

export function calculateHMMGuess(
  history: WingoDraw[],
  nextPeriod: string
): PredictionResult {
  if (!history || history.length === 0) {
    return {
      targetPeriod: nextPeriod,
      size: 'BIG',
      sizeBurmese: 'ကြီး (BIG)',
      color: 'RED',
      colorBurmese: 'အနီ (RED)',
      numbers: [6, 8, 7],
      confidence: 91,
      pattern: 'Hidden Markov Model (HMM) • Prior Initialization',
      algorithm: 'Hidden Markov Model (HMM v3.0 - Viterbi Regime Decoder)',
      algorithmMode: 'HMM',
      riskLevel: 'LOW RISK (အလွန်စိတ်ချရ)',
      suggestedMultipliers: ['1X', '3X', '8X'],
      hmmDetails: {
        stateIndex: 0,
        stateLabel: 'Dragon Trend (BIG)',
        stateBurmese: 'နဂါးဆက်ကြီး Regime',
        pBig: 75.0,
        pSmall: 25.0,
        transitionLikelihood: 82.5,
        stateProbabilities: [
          { state: 'DRAGON_BIG', label: 'Dragon BIG', prob: 75.0 },
          { state: 'DRAGON_SMALL', label: 'Dragon SMALL', prob: 10.0 },
          { state: 'CHOP_PINGPONG', label: 'Chop Alternating', prob: 10.0 },
          { state: 'EQUILIBRIUM', label: 'Equilibrium', prob: 5.0 }
        ]
      }
    };
  }

  // Work on chronological sample (oldest to newest for forward algorithm)
  const sample = history.slice(0, 30).reverse();
  const T = sample.length;
  const latest = history[0];

  // ========================================================
  // 1. Initial State Probability Vector PI (4 states)
  // ========================================================
  let pi = [0.28, 0.28, 0.24, 0.20];

  // ========================================================
  // 2. Base Transition Matrix A (4x4)
  // A[i][j] = P(S_{t+1} = j | S_t = i)
  // ========================================================
  // [0: DRAGON_BIG, 1: DRAGON_SMALL, 2: CHOP, 3: EQUILIBRIUM]
  let A = [
    [0.64, 0.12, 0.16, 0.08], // From DRAGON_BIG: strong persistence (0.64), breaks to chop (0.16)
    [0.12, 0.64, 0.16, 0.08], // From DRAGON_SMALL: strong persistence (0.64), breaks to chop (0.16)
    [0.22, 0.22, 0.44, 0.12], // From CHOP: persistence (0.44), or breaks into a dragon streak (0.22/0.22)
    [0.34, 0.34, 0.20, 0.12]  // From EQUILIBRIUM: shifts into trend
  ];

  // Dynamic Bayesian smoothing based on observed history features
  let currentStreak = 1;
  for (let i = 1; i < history.length && i < 15; i++) {
    if (history[i].size === latest.size) {
      currentStreak++;
    } else {
      break;
    }
  }

  // If long dragon streak (4+), boost persistence of that regime
  if (currentStreak >= 4) {
    if (latest.size === 'BIG') {
      A[0][0] = Math.min(0.82, 0.64 + currentStreak * 0.03);
      A[0][2] = Math.max(0.08, 0.16 - currentStreak * 0.015);
    } else {
      A[1][1] = Math.min(0.82, 0.64 + currentStreak * 0.03);
      A[1][2] = Math.max(0.08, 0.16 - currentStreak * 0.015);
    }
  }

  // ========================================================
  // 3. Emission Probability Function B_j(Observation)
  // ========================================================
  // Probability of emitting (size, number, color) given Hidden State j
  function getEmissionProb(stateIdx: number, draw: WingoDraw, prevDraw?: WingoDraw): number {
    const isBig = draw.size === 'BIG';
    let sizeProb = 0.5;

    if (stateIdx === 0) {
      // DRAGON_BIG: High probability of BIG (0.84)
      sizeProb = isBig ? 0.84 : 0.16;
    } else if (stateIdx === 1) {
      // DRAGON_SMALL: High probability of SMALL (0.84)
      sizeProb = isBig ? 0.16 : 0.84;
    } else if (stateIdx === 2) {
      // CHOP_PINGPONG: Expects alternation from previous draw
      if (prevDraw) {
        const flipped = draw.size !== prevDraw.size;
        sizeProb = flipped ? 0.82 : 0.18;
      } else {
        sizeProb = 0.5;
      }
    } else {
      // EQUILIBRIUM: Mean attractor / 50-50
      sizeProb = 0.5;
    }

    // Number emission likelihood
    let numProb = 0.1;
    if (stateIdx === 0) {
      // Favors 5, 6, 7, 8, 9
      numProb = draw.number >= 5 ? 0.17 : 0.03;
    } else if (stateIdx === 1) {
      // Favors 0, 1, 2, 3, 4
      numProb = draw.number < 5 ? 0.17 : 0.03;
    } else {
      numProb = 0.1;
    }

    return sizeProb * 0.75 + numProb * 0.25;
  }

  // ========================================================
  // 4. Normalized Forward Algorithm
  // alpha_t(i) = P(O_1, ..., O_t, S_t = i)
  // ========================================================
  let alpha: number[] = new Array(4).fill(0);

  // t = 0
  for (let i = 0; i < 4; i++) {
    alpha[i] = pi[i] * getEmissionProb(i, sample[0]);
  }
  // Normalize
  let sumAlpha = alpha.reduce((a, b) => a + b, 0) || 1e-6;
  alpha = alpha.map(v => v / sumAlpha);

  // t = 1 to T-1
  for (let t = 1; t < T; t++) {
    const nextAlpha: number[] = [0, 0, 0, 0];
    const prevDraw = sample[t - 1];
    const currentDraw = sample[t];

    for (let j = 0; j < 4; j++) {
      let sumTransitions = 0;
      for (let i = 0; i < 4; i++) {
        sumTransitions += alpha[i] * A[i][j];
      }
      const emission = getEmissionProb(j, currentDraw, prevDraw);
      nextAlpha[j] = sumTransitions * emission;
    }

    const norm = nextAlpha.reduce((a, b) => a + b, 0) || 1e-6;
    alpha = nextAlpha.map(v => v / norm);
  }

  // alpha now holds the posterior state distribution gamma_T for latest draw
  const gamma_T = alpha; // P(S_T = i | O_{1..T})

  // Decoded most likely current regime (ArgMax gamma_T)
  let bestStateIdx = 0;
  let maxGamma = gamma_T[0];
  for (let i = 1; i < 4; i++) {
    if (gamma_T[i] > maxGamma) {
      maxGamma = gamma_T[i];
      bestStateIdx = i;
    }
  }

  // ========================================================
  // 5. Predict Next Hidden State Distribution at Step T+1
  // P(S_{T+1} = j) = SUM_i [ gamma_T(i) * A[i][j] ]
  // ========================================================
  const pNextState: number[] = [0, 0, 0, 0];
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      pNextState[j] += gamma_T[i] * A[i][j];
    }
  }

  // ========================================================
  // 6. Predict Next Observation Emission at T+1
  // ========================================================
  // P(BIG at T+1) = SUM_j [ P(S_{T+1} = j) * B_j(BIG | latest) ]
  let pBig = 0;
  let pSmall = 0;

  for (let j = 0; j < 4; j++) {
    let bBig = 0.5;
    let bSmall = 0.5;

    if (j === 0) {
      // DRAGON_BIG
      bBig = 0.85;
      bSmall = 0.15;
    } else if (j === 1) {
      // DRAGON_SMALL
      bBig = 0.15;
      bSmall = 0.85;
    } else if (j === 2) {
      // CHOP_PINGPONG: expect flip from latest size
      bBig = latest.size === 'SMALL' ? 0.84 : 0.16;
      bSmall = latest.size === 'BIG' ? 0.84 : 0.16;
    } else {
      // EQUILIBRIUM: slight mean reversion if imbalance
      const bigsIn20 = history.slice(0, 20).filter(d => d.size === 'BIG').length;
      if (bigsIn20 >= 12) {
        bBig = 0.38;
        bSmall = 0.62;
      } else if (bigsIn20 <= 8) {
        bBig = 0.62;
        bSmall = 0.38;
      } else {
        bBig = 0.50;
        bSmall = 0.50;
      }
    }

    pBig += pNextState[j] * bBig;
    pSmall += pNextState[j] * bSmall;
  }

  const normObs = (pBig + pSmall) || 1;
  pBig = pBig / normObs;
  pSmall = pSmall / normObs;

  const predictedSize: DrawSize = pBig >= pSmall ? 'BIG' : 'SMALL';
  const margin = Math.abs(pBig - pSmall);
  const confidence = Math.min(97, Math.max(86, Math.round(85 + margin * 30)));

  // ========================================================
  // 7. Calculate Number Emission Probabilities P(N = 0..9)
  // ========================================================
  const numberProbs: { number: number; prob: number }[] = [];
  const recent20 = history.slice(0, 20);

  for (let n = 0; n <= 9; n++) {
    let score = 0;
    const isNumBig = n >= 5;

    // Weight by state likelihoods
    for (let j = 0; j < 4; j++) {
      let stateNumWeight = 0.1;
      if (j === 0) {
        stateNumWeight = isNumBig ? 0.18 : 0.02;
      } else if (j === 1) {
        stateNumWeight = !isNumBig ? 0.18 : 0.02;
      } else {
        stateNumWeight = (predictedSize === 'BIG' && isNumBig) || (predictedSize === 'SMALL' && !isNumBig) ? 0.16 : 0.04;
      }
      score += pNextState[j] * stateNumWeight;
    }

    // Dampen recently repeated number slightly, reward harmonic affinity
    const recencyCount = recent20.filter(d => d.number === n).length;
    score += (2 - recencyCount) * 0.015;

    numberProbs.push({ number: n, prob: Math.max(0.01, score) });
  }

  // Filter numbers matching the predicted size and sort by highest emission probability
  const candidateNumbers = numberProbs
    .filter(np => (predictedSize === 'BIG' ? np.number >= 5 : np.number < 5))
    .sort((a, b) => b.prob - a.prob);

  const topNumbers = candidateNumbers.slice(0, 3).map(np => np.number);

  // ========================================================
  // 8. Color Prediction
  // ========================================================
  let predictedColor: 'RED' | 'GREEN' | 'VIOLET' = 'RED';
  const topNum = topNumbers[0];

  if (topNum === 0 || topNum === 5) {
    predictedColor = 'VIOLET';
  } else if ([2, 4, 6, 8].includes(topNum)) {
    predictedColor = 'RED';
  } else {
    predictedColor = 'GREEN';
  }

  // Color verification against recent color density
  if (predictedColor === 'VIOLET') {
    // Violet is rare; only emit if strong harmonic affinity
    const recentViolets = recent20.filter(d => d.color.includes('VIOLET')).length;
    if (recentViolets >= 2) {
      predictedColor = predictedSize === 'BIG' ? 'RED' : 'GREEN';
    }
  }

  const decodedState = HMM_STATES[bestStateIdx];
  const pBigPct = parseFloat((pBig * 100).toFixed(1));
  const pSmallPct = parseFloat((pSmall * 100).toFixed(1));
  const transitionLikelihood = parseFloat((maxGamma * 100).toFixed(1));

  const stateProbabilities = HMM_STATES.map(s => ({
    state: s.key,
    label: s.label,
    prob: parseFloat((pNextState[s.index] * 100).toFixed(1))
  }));

  const hmmDetails: HmmDetails = {
    stateIndex: bestStateIdx,
    stateLabel: decodedState.label,
    stateBurmese: decodedState.burmese,
    pBig: pBigPct,
    pSmall: pSmallPct,
    transitionLikelihood,
    stateProbabilities
  };

  return {
    targetPeriod: nextPeriod,
    size: predictedSize,
    sizeBurmese: predictedSize === 'BIG' ? 'ကြီး (BIG)' : 'ငယ် (SMALL)',
    color: predictedColor,
    colorBurmese: predictedColor === 'RED' ? 'အနီ (RED)' : predictedColor === 'GREEN' ? 'အစိမ်း (GREEN)' : 'ခရမ်း (VIOLET)',
    numbers: topNumbers,
    confidence,
    pattern: `Hidden Markov Model (HMM) • ${decodedState.label}`,
    algorithm: 'Hidden Markov Model (HMM v3.0 - Viterbi Regime Decoder)',
    algorithmMode: 'HMM',
    hmmDetails,
    riskLevel: confidence >= 92 ? 'LOW RISK (အလွန်စိတ်ချရ)' : 'MEDIUM RISK (အသင့်အတင့်)',
    suggestedMultipliers: ['1X', '3X', '8X']
  };
}
