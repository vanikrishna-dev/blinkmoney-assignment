const COIN_COUNT = 18;

const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// Non-overlapping placement via retry sampling
const scatterCoins = ({ rand, count, w, h, margin, minRadius, maxRadius, driftAmp }) => {
  const points = [];
  let attempts = 0;
  const maxAttempts = count * 200;
  while (points.length < count && attempts < maxAttempts) {
    attempts++;
    const radius = minRadius + rand() * (maxRadius - minRadius);
    const x = margin + radius + driftAmp + rand() * (w - (radius + driftAmp) * 2);
    const y = margin + radius + driftAmp + rand() * (h - (radius + driftAmp) * 2);
    let ok = true;
    for (const p of points) {
      const dx = p.x - x;
      const dy = p.y - y;
      const minDist = p.radius + radius + driftAmp * 2 + 4;
      if (dx * dx + dy * dy < minDist * minDist) {
        ok = false;
        break;
      }
    }
    if (ok) points.push({ x, y, radius });
  }
  return points;
};

export const buildCoins = ({ invested, canvasWidth, canvasHeight, seed = 42 }) => {
  const perCoinValue = invested / COIN_COUNT;
  const rand = seededRandom(seed);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const margin = 28;
  const w = Math.max(canvasWidth - margin * 2, 100);
  const h = Math.max(canvasHeight - margin * 2, 100);
  const driftAmp = 4;

  const placed = scatterCoins({
    rand,
    count: COIN_COUNT,
    w,
    h,
    margin,
    minRadius: 26,
    maxRadius: 32,
    driftAmp,
  });

  return placed.map((p, i) => {
    const ageDays = COIN_COUNT - i;
    return {
      id: i,
      value: perCoinValue,
      investedAt: now - ageDays * dayMs,
      ageDays,
      x: p.x,
      y: p.y,
      driftSeedX: rand() * Math.PI * 2,
      driftSeedY: rand() * Math.PI * 2,
      driftSpeedX: 0.25 + rand() * 0.25,
      driftSpeedY: 0.2 + rand() * 0.25,
      driftAmpX: 2 + rand() * driftAmp,
      driftAmpY: 2 + rand() * driftAmp,
      spinSpeed: 0.35 + rand() * 0.4,
      spinPhase: rand() * Math.PI * 2,
      radius: p.radius,
    };
  });
};

export const computeLienCount = ({ pledgedAmount, invested }) => {
  if (invested <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, pledgedAmount / invested));
  return Math.round(ratio * COIN_COUNT);
};

export const isPledged = (coinIndex, lienCount) => coinIndex < lienCount;

export const dailyEarnPerCoin = (coin, annualRate = 0.15) => {
  return (coin.value * annualRate) / 365;
};

export const perSecondEarn = (invested, annualRate = 0.15) => {
  return (invested * annualRate) / (365 * 24 * 60 * 60);
};

export const totalEarnedSince = (coin, annualRate = 0.15) => {
  const days = coin.ageDays;
  return dailyEarnPerCoin(coin, annualRate) * days;
};

export { COIN_COUNT };
