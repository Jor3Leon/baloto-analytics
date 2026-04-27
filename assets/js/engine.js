/* Motor estadistico.
   Aqui vive la logica de ponderacion, muestreo, patrones y score. */
function buildModel(draws){
  const freq = {...baseFreq};
  const superFreq = {...baseSuperFreq};
  const counts = {};
  const superCounts = {};
  const lastSeen = {};
  const superLastSeen = {};
  const totalDraws = draws.length;
  let decayWeight = 1;

  for(let index = draws.length - 1; index >= 0; index--){
    const draw = draws[index];
    if(!draw || !Array.isArray(draw.nums) || typeof draw.super !== "number") continue;

    draw.nums.forEach(n => {
      if(n >= 1 && n <= NUM_MAX){
        freq[n] += decayWeight;
        counts[n] = (counts[n] || 0) + 1;
        if(lastSeen[n] === undefined){
          lastSeen[n] = totalDraws - 1 - index;
        }
      }
    });

    if(draw.super >= 1 && draw.super <= SUPER_MAX){
      superFreq[draw.super] += decayWeight;
      superCounts[draw.super] = (superCounts[draw.super] || 0) + 1;
      if(superLastSeen[draw.super] === undefined){
        superLastSeen[draw.super] = totalDraws - 1 - index;
      }
    }

    decayWeight *= DECAY;
  }

  return {
    draws,
    freq,
    superFreq,
    counts,
    superCounts,
    lastSeen,
    superLastSeen,
    totalDraws
  };
}

function weightedPick(freq, max, exclude = new Set()){
  let total = 0;
  for(let i = 1; i <= max; i++){
    if(!exclude.has(i)) total += (freq[i] || 0) + LAMBDA;
  }

  if(total === 0) return null;

  let roll = Math.random() * total;
  for(let i = 1; i <= max; i++){
    if(exclude.has(i)) continue;
    roll -= (freq[i] || 0) + LAMBDA;
    if(roll <= 0) return i;
  }

  return null;
}

function weightedSampleWithoutReplacement(freq, max, count, exclude = new Set()){
  const picked = [];
  const excluded = new Set(exclude);

  while(picked.length < count){
    const n = weightedPick(freq, max, excluded);
    if(n === null) break;
    picked.push(n);
    excluded.add(n);
  }

  return picked.sort((a, b) => a - b);
}

function scoreCombination(combo, freq){
  if(combo.length !== PICK_COUNT) return -Infinity;

  const weights = combo.reduce((sum, n) => sum + (freq[n] || 0), 0);
  const spread = combo[combo.length - 1] - combo[0];
  const parityBalance = Math.abs(combo.filter(n => n % 2 === 0).length - 2.5);
  const lowHighBalance = Math.abs(combo.filter(n => n <= 21).length - 2.5);

  return weights + (spread / 10) - parityBalance - lowHighBalance;
}

function generateBestCombination(freq){
  let best = weightedSampleWithoutReplacement(freq, NUM_MAX, PICK_COUNT);
  let bestScore = scoreCombination(best, freq);

  for(let i = 0; i < ITER; i++){
    const candidate = weightedSampleWithoutReplacement(freq, NUM_MAX, PICK_COUNT);
    const score = scoreCombination(candidate, freq);
    if(score > bestScore){
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function chooseSuper(freq, exclude = new Set()){
  const combination = weightedSampleWithoutReplacement(freq, SUPER_MAX, 1, exclude);
  if(combination.length){
    return combination[0];
  }
  return weightedPick(freq, SUPER_MAX, exclude);
}

function chooseDistinctSuper(freq, previous){
  const exclude = previous ? new Set([previous]) : new Set();
  return chooseSuper(freq, exclude);
}

function calculateZScores(counts, total, max, picksPerDraw){
  if(total === 0) return null;

  const expected = total * picksPerDraw / max;
  const probability = picksPerDraw / max;
  const sigma = Math.sqrt(total * probability * (1 - probability));
  if(sigma === 0) return null;

  const z = {};
  for(let i = 1; i <= max; i++){
    z[i] = ((counts[i] || 0) - expected) / sigma;
  }
  return z;
}

function pairKey(a, b){
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function tripleKey(a, b, c){
  return [a, b, c].sort((x, y) => x - y).join("-");
}

function analyzePatterns(draws){
  const pairCounts = {};
  const tripleCounts = {};

  draws.forEach(draw => {
    if(!draw || !Array.isArray(draw.nums)) return;
    const nums = [...new Set(draw.nums)].sort((a, b) => a - b);

    for(let i = 0; i < nums.length; i++){
      for(let j = i + 1; j < nums.length; j++){
        const key = pairKey(nums[i], nums[j]);
        pairCounts[key] = (pairCounts[key] || 0) + 1;
        for(let k = j + 1; k < nums.length; k++){
          const tKey = tripleKey(nums[i], nums[j], nums[k]);
          tripleCounts[tKey] = (tripleCounts[tKey] || 0) + 1;
        }
      }
    }
  });

  return { pairCounts, tripleCounts };
}

function buildRecommendationCard(candidate, freq, superFreq){
  const sum = candidate.reduce((acc, n) => acc + n, 0);
  const even = candidate.filter(n => n % 2 === 0).length;
  const low = candidate.filter(n => n <= 21).length;
  const spread = candidate[candidate.length - 1] - candidate[0];
  const score = scoreCombination(candidate, freq);
  const superPick = chooseSuper(superFreq);

  return {
    numbers: candidate,
    super: superPick,
    score,
    sum,
    even,
    low,
    spread
  };
}

function generateRecommendations(freq, superFreq){
  const unique = new Map();
  const attempts = 500;

  for(let i = 0; i < attempts; i++){
    const candidate = weightedSampleWithoutReplacement(freq, NUM_MAX, PICK_COUNT);
    if(candidate.length !== PICK_COUNT) continue;
    const key = candidate.join("-");
    if(unique.has(key)) continue;
    unique.set(key, buildRecommendationCard(candidate, freq, superFreq));
  }

  return [...unique.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
