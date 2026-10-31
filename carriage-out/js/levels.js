export const PALETTE = {
  Ruby:     { id: 0, name: "Ruby",     hi: "#ff8577", primary: "#e03a2b", dark: "#6e130b", trim: "#ffe28a", symbol: "♦" },
  Sapphire: { id: 1, name: "Sapphire", hi: "#6ec0f7", primary: "#1f6fb2", dark: "#0c3152", trim: "#b3e8ff", symbol: "▲" },
  Emerald:  { id: 2, name: "Emerald",  hi: "#68e89e", primary: "#1e9952", dark: "#0a4220", trim: "#bdf5d4", symbol: "●" },
  Topaz:    { id: 3, name: "Topaz",    hi: "#ffbe55", primary: "#d97218", dark: "#6b3103", trim: "#fff0d4", symbol: "★" },
  Amethyst: { id: 4, name: "Amethyst", hi: "#cf9fe3", primary: "#8034a1", dark: "#39114a", trim: "#f2e6f7", symbol: "☀" },
  Onyx:     { id: 5, name: "Onyx",     hi: "#9aa8b5", primary: "#34495e", dark: "#131b24", trim: "#e1e6eb", symbol: "❖" }
};

export const COLOR_KEYS = Object.keys(PALETTE);

const CAMPAIGN_LEVELS = [
  {
    name: "Pharaoh's Gate",
    stage: "Campaign • Act 1",
    grid: 6,
    carriages: [
      { id: 1, color: "Ruby",     length: 2, dir: "UP",    r: 1, c: 1, cap: 4 },
      { id: 2, color: "Sapphire", length: 2, dir: "RIGHT", r: 3, c: 2, cap: 4 },
      { id: 3, color: "Emerald",  length: 3, dir: "DOWN",  r: 2, c: 5, cap: 6 },
      { id: 4, color: "Ruby",     length: 2, dir: "LEFT",  r: 4, c: 0, cap: 4 },
      { id: 5, color: "Sapphire", length: 2, dir: "UP",    r: 0, c: 3, cap: 4 }
    ]
  },
  {
    name: "Golden Obelisk",
    stage: "Campaign • Act 2",
    grid: 7,
    carriages: [
      { id: 1, color: "Topaz",    length: 2, dir: "UP",    r: 0, c: 2, cap: 4 },
      { id: 2, color: "Amethyst", length: 2, dir: "RIGHT", r: 1, c: 4, cap: 4 },
      { id: 3, color: "Ruby",     length: 3, dir: "DOWN",  r: 2, c: 1, cap: 6 },
      { id: 4, color: "Topaz",    length: 2, dir: "LEFT",  r: 3, c: 3, cap: 4 },
      { id: 5, color: "Sapphire", length: 2, dir: "DOWN",  r: 4, c: 5, cap: 4 },
      { id: 6, color: "Amethyst", length: 2, dir: "LEFT",  r: 6, c: 0, cap: 4 },
      { id: 7, color: "Ruby",     length: 2, dir: "UP",    r: 4, c: 3, cap: 4 }
    ]
  },
  {
    name: "Karnak Avenue",
    stage: "Campaign • Act 3",
    grid: 7,
    carriages: [
      { id: 1, color: "Emerald",  length: 2, dir: "LEFT",  r: 0, c: 1, cap: 4 },
      { id: 2, color: "Sapphire", length: 3, dir: "UP",    r: 1, c: 3, cap: 6 },
      { id: 3, color: "Ruby",     length: 2, dir: "RIGHT", r: 2, c: 4, cap: 4 },
      { id: 4, color: "Topaz",    length: 2, dir: "UP",    r: 3, c: 0, cap: 4 },
      { id: 5, color: "Emerald",  length: 2, dir: "RIGHT", r: 4, c: 1, cap: 4 },
      { id: 6, color: "Amethyst", length: 3, dir: "LEFT",  r: 6, c: 1, cap: 6 },
      { id: 7, color: "Ruby",     length: 2, dir: "UP",    r: 2, c: 6, cap: 4 },
      { id: 8, color: "Topaz",    length: 2, dir: "DOWN",  r: 4, c: 5, cap: 4 }
    ]
  }
];

export function getLevelData(idx) {
  if (idx < CAMPAIGN_LEVELS.length) return CAMPAIGN_LEVELS[idx];
  return generateGuaranteedSolvableLevel(idx);
}

export function isBoardCompletelyClearable(carriageList, gridSize) {
  let remaining = carriageList.map(c => ({ ...c }));
  let progress = true;

  while (remaining.length > 0 && progress) {
    progress = false;
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    remaining.forEach(c => {
      const isH = c.dir === "LEFT" || c.dir === "RIGHT";
      for (let i = 0; i < c.length; i++) {
        grid[isH ? c.r : c.r + i][isH ? c.c + i : c.c] = c.id;
      }
    });

    for (let i = remaining.length - 1; i >= 0; i--) {
      const car = remaining[i];
      let blocked = false;
      if (car.dir === "UP") {
        for (let r = car.r - 1; r >= 0; r--) if (grid[r][car.c] !== null) blocked = true;
      } else if (car.dir === "DOWN") {
        for (let r = car.r + car.length; r < gridSize; r++) if (grid[r][car.c] !== null) blocked = true;
      } else if (car.dir === "LEFT") {
        for (let c = car.c - 1; c >= 0; c--) if (grid[car.r][c] !== null) blocked = true;
      } else if (car.dir === "RIGHT") {
        for (let c = car.c + car.length; c < gridSize; c++) if (grid[car.r][c] !== null) blocked = true;
      }
      if (!blocked) {
        remaining.splice(i, 1);
        progress = true;
      }
    }
  }
  return remaining.length === 0;
}

function generateGuaranteedSolvableLevel(idx) {
  const gridSize = 7;
  const occupied = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const numColors = Math.min(COLOR_KEYS.length, 3 + Math.floor(idx / 2));
  const paletteSubset = COLOR_KEYS.slice(0, numColors);
  const targetCount = Math.min(13, 7 + Math.floor(idx * 0.8));
  const carriages = [];
  let id = 1;

  const canOccupy = (r, c, len, isHoriz) => {
    for (let i = 0; i < len; i++) {
      const rr = isHoriz ? r : r + i;
      const cc = isHoriz ? c + i : c;
      if (rr < 0 || rr >= gridSize || cc < 0 || cc >= gridSize) return false;
      if (occupied[rr][cc]) return false;
    }
    return true;
  };

  let attempts = 0;
  while (carriages.length < targetCount && attempts < 550) {
    attempts++;
    const len = Math.random() > 0.72 ? 3 : 2;
    const isHoriz = Math.random() > 0.5;
    const dir = isHoriz ? (Math.random() > 0.5 ? "LEFT" : "RIGHT") : (Math.random() > 0.5 ? "UP" : "DOWN");
    const maxR = isHoriz ? gridSize : gridSize - len;
    const maxC = isHoriz ? gridSize - len : gridSize;
    const r = Math.floor(Math.random() * maxR);
    const c = Math.floor(Math.random() * maxC);

    if (!canOccupy(r, c, len, isHoriz)) continue;

    const color = paletteSubset[(id - 1) % paletteSubset.length];
    const candidate = { id, color, length: len, dir, r, c, cap: len * 2 };
    if (isBoardCompletelyClearable([...carriages, candidate], gridSize)) {
      for (let i = 0; i < len; i++) occupied[isHoriz ? r : r + i][isHoriz ? c + i : c] = true;
      carriages.push(candidate);
      id++;
    }
  }

  return {
    name: `Grand Citadel ${idx + 1}`,
    stage: `Royal Challenge • Tier ${idx + 1}`,
    grid: gridSize,
    carriages
  };
}

export function buildSolvablePassengerQueue(carriages, gridSize) {
  let sim = carriages.map(c => ({ ...c }));
  const peelOrder = [];

  while (sim.length > 0) {
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    sim.forEach(c => {
      const isH = c.dir === "LEFT" || c.dir === "RIGHT";
      for (let i = 0; i < c.length; i++) grid[isH ? c.r : c.r + i][isH ? c.c + i : c.c] = c.id;
    });

    const unblocked = sim.filter(car => {
      if (car.dir === "UP")    { for (let r = car.r - 1; r >= 0; r--) if (grid[r][car.c] !== null) return false; }
      if (car.dir === "DOWN")  { for (let r = car.r + car.length; r < gridSize; r++) if (grid[r][car.c] !== null) return false; }
      if (car.dir === "LEFT")  { for (let c = car.c - 1; c >= 0; c--) if (grid[car.r][c] !== null) return false; }
      if (car.dir === "RIGHT") { for (let c = car.c + car.length; c < gridSize; c++) if (grid[car.r][c] !== null) return false; }
      return true;
    });

    const chosen = unblocked.length > 0 ? unblocked[Math.floor(Math.random() * unblocked.length)] : sim[0];
    peelOrder.push(chosen);
    sim = sim.filter(c => c.id !== chosen.id);
  }

  const queue = [];
  for (let i = 0; i < peelOrder.length; i += 2) {
    const chunk = [];
    for (let j = i; j < Math.min(i + 2, peelOrder.length); j++) {
      for (let k = 0; k < peelOrder[j].cap; k++) chunk.push(peelOrder[j].color);
    }
    for (let m = chunk.length - 1; m > 0; m--) {
      const n = Math.floor(Math.random() * (m + 1));
      [chunk[m], chunk[n]] = [chunk[n], chunk[m]];
    }
    queue.push(...chunk);
  }
  return queue;
}
