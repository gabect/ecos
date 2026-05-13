import { TILES } from './tiles.js';

export const WORLD_WIDTH = 88;
export const WORLD_HEIGHT = 62;

const fill = (value) => Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill(value));
const inBounds = (layer, x, y) => layer[y] && layer[y][x] !== undefined;
const setTile = (layer, x, y, value) => {
  if (inBounds(layer, x, y)) layer[y][x] = value;
};
const rect = (layer, x, y, w, h, value) => {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) setTile(layer, xx, yy, value);
  }
};
const ellipse = (layer, cx, cy, rx, ry, value) => {
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const n = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
      if (n <= 1) setTile(layer, x, y, value);
    }
  }
};
const line = (layer, x0, y0, x1, y1, radius, value) => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    rect(layer, x - radius, y - radius, radius * 2 + 1, radius * 2 + 1, value);
  }
};
const curvedPath = (layer, points, radius, value) => {
  for (let i = 0; i < points.length - 1; i += 1) {
    line(layer, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], radius, value);
  }
};

export function buildWorldLayers() {
  const ground = fill(TILES.grass);
  const detail = fill(-1);
  const blockers = fill(-1);
  const foreground = fill(-1);

  paintGrassBase(ground, detail);
  paintWaterAndShore(ground, detail);
  paintPaths(ground, detail);
  paintCliffs(ground, blockers, detail);
  paintCamp(ground, blockers, foreground, detail);
  paintClearings(ground, detail, blockers);
  paintForest(detail, blockers, foreground);
  paintRocksAndBushes(detail, blockers);
  addWaterCollision(ground, blockers);

  return { ground, detail, blockers, foreground };
}

function paintGrassBase(ground, detail) {
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      const wave = Math.sin(x * 0.42) + Math.cos(y * 0.36) + Math.sin((x + y) * 0.18);
      if (wave > 1.45 || (x * 11 + y * 19) % 29 === 0) ground[y][x] = TILES.grassDark;
      if ((x * 7 + y * 13) % 97 === 0) detail[y][x] = TILES.flowers;
    }
  }

  ellipse(ground, 22, 18, 12, 6, TILES.grassDark);
  ellipse(ground, 56, 45, 16, 8, TILES.grassDark);
  ellipse(ground, 12, 51, 12, 5, TILES.grassDark);
  ellipse(ground, 61, 16, 8, 5, TILES.grassDark);
}

function paintWaterAndShore(ground, detail) {
  ellipse(ground, 18, 43, 14, 10, TILES.sand);
  ellipse(ground, 18, 43, 11, 7, TILES.waterA);
  ellipse(ground, 23, 40, 5, 3, TILES.waterB);
  ellipse(ground, 12, 45, 4, 3, TILES.waterB);
  curvedPath(ground, [[28, 41], [32, 39], [36, 38], [41, 35]], 1, TILES.waterA);
  rect(ground, 33, 37, 6, 2, TILES.bridge);

  [[7, 40], [9, 47], [15, 34], [28, 38], [27, 49], [22, 52], [31, 43]].forEach(([x, y]) => {
    setTile(detail, x, y, TILES.stone);
  });
}

function paintPaths(ground, detail) {
  curvedPath(ground, [[10, 51], [18, 48], [28, 43], [36, 38], [44, 31], [49, 27]], 1, TILES.path);
  curvedPath(ground, [[49, 27], [55, 25], [63, 28], [69, 35], [76, 43]], 1, TILES.path);
  curvedPath(ground, [[49, 27], [48, 22], [50, 17], [48, 13]], 1, TILES.path);
  curvedPath(ground, [[44, 31], [38, 26], [34, 22], [29, 21]], 0, TILES.path);
  curvedPath(ground, [[36, 38], [43, 38], [50, 37]], 0, TILES.path);

  [[18, 47], [23, 45], [31, 41], [41, 35], [53, 26], [66, 31], [72, 39]].forEach(([x, y]) => {
    setTile(detail, x, y - 1, TILES.flowers);
    setTile(detail, x + 1, y + 1, TILES.stone);
  });
}

function paintCliffs(ground, blockers, detail) {
  rect(ground, 0, 0, WORLD_WIDTH, 4, TILES.cliffTop);
  rect(blockers, 0, 0, WORLD_WIDTH, 4, TILES.cliffTop);
  rect(ground, 70, 0, 18, 34, TILES.cliffTop);
  rect(blockers, 70, 0, 18, 34, TILES.cliffTop);
  curvedPath(ground, [[66, 4], [66, 10], [67, 17], [66, 24], [66, 33]], 1, TILES.cliff);
  curvedPath(blockers, [[66, 4], [66, 10], [67, 17], [66, 24], [66, 33]], 1, TILES.cliff);
  rect(ground, 58, 5, 10, 5, TILES.cliffTop);
  rect(blockers, 58, 5, 10, 5, TILES.cliffTop);

  rect(ground, 62, 8, 4, 3, TILES.cave);
  rect(blockers, 63, 9, 2, 1, -1);
  [[57, 11], [60, 12], [65, 13], [67, 15], [62, 16], [69, 30]].forEach(([x, y]) => setTile(detail, x, y, TILES.stone));
}

function paintCamp(ground, blockers, foreground, detail) {
  ellipse(ground, 51, 29, 15, 10, TILES.grassDark);
  addHouse(ground, blockers, foreground, 43, 20, 7, 6);
  addHouse(ground, blockers, foreground, 55, 23, 8, 6);
  addHouse(ground, blockers, foreground, 47, 32, 7, 6);
  rect(detail, 41, 28, 24, 1, TILES.fence);
  rect(blockers, 41, 28, 24, 1, TILES.fence);
  rect(detail, 48, 29, 2, 1, -1);
  rect(blockers, 48, 28, 2, 1, -1);

  [[42, 31], [45, 30], [54, 31], [61, 31], [52, 24], [57, 21]].forEach(([x, y]) => setTile(detail, x, y, TILES.bush));
  [[45, 27], [53, 29], [59, 30], [50, 39]].forEach(([x, y]) => setTile(detail, x, y, TILES.flowers));
}

function paintClearings(ground, detail, blockers) {
  ellipse(ground, 15, 16, 8, 5, TILES.grassDark);
  ellipse(ground, 33, 18, 7, 4, TILES.grassDark);
  rect(detail, 30, 15, 4, 1, TILES.stone);
  rect(detail, 29, 16, 1, 4, TILES.stone);
  rect(detail, 36, 16, 1, 4, TILES.stone);
  rect(blockers, 29, 16, 1, 4, TILES.stone);
  rect(blockers, 36, 16, 1, 4, TILES.stone);
  rect(detail, 31, 20, 5, 1, TILES.stone);
  [[14, 15], [16, 15], [18, 17], [31, 18], [34, 19], [36, 21]].forEach(([x, y]) => setTile(detail, x, y, TILES.flowers));
  curvedPath(ground, [[20, 19], [24, 20], [28, 21]], 0, TILES.path);
}


function paintForest(detail, blockers, foreground) {
  const trees = [
    [4, 8, 12, 18, 2], [18, 5, 18, 8, 3], [2, 28, 13, 18, 2], [20, 28, 8, 8, 2],
    [4, 52, 28, 8, 3], [55, 42, 26, 14, 2], [68, 36, 15, 20, 2], [38, 48, 18, 10, 3],
    [0, 4, 5, 56, 2], [83, 34, 5, 28, 2], [8, 20, 8, 7, 3], [30, 6, 14, 6, 3],
  ];
  trees.forEach(([x, y, w, h, spacing]) => scatterTrees(detail, blockers, foreground, x, y, w, h, spacing));
}

function paintRocksAndBushes(detail, blockers) {
  const bushes = [
    [24, 16], [27, 17], [20, 22], [39, 22], [40, 24], [35, 35], [31, 36], [39, 40],
    [63, 39], [61, 41], [75, 36], [78, 46], [12, 38], [7, 48], [13, 53], [29, 51],
  ];
  bushes.forEach(([x, y]) => setTile(detail, x, y, TILES.bush));

  const rocks = [[52, 12], [55, 14], [62, 14], [67, 28], [71, 35], [74, 41], [42, 36], [29, 39], [22, 47], [11, 33]];
  rocks.forEach(([x, y]) => {
    setTile(detail, x, y, TILES.stone);
    setTile(blockers, x, y, TILES.stone);
  });
}

function addWaterCollision(ground, blockers) {
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      if ([TILES.waterA, TILES.waterB].includes(ground[y][x])) blockers[y][x] = TILES.waterA;
      if (ground[y][x] === TILES.bridge) blockers[y][x] = -1;
    }
  }
}

function addHouse(ground, blockers, foreground, x, y, w, h) {
  rect(ground, x, y + 2, w, h - 2, TILES.wall);
  rect(foreground, x, y, w, 2, TILES.roof);
  rect(ground, x + Math.floor(w / 2), y + h - 1, 1, 1, TILES.door);
  rect(blockers, x, y, w, h, TILES.wall);
  blockers[y + h - 1][x + Math.floor(w / 2)] = -1;
}

function scatterTrees(detail, blockers, foreground, x, y, w, h, spacing = 2) {
  for (let yy = y; yy < y + h; yy += spacing) {
    for (let xx = x; xx < x + w; xx += spacing) {
      if ((xx * 5 + yy * 9) % 5 === 0) continue;
      if (!detail[yy] || detail[yy][xx] === undefined) continue;
      detail[yy][xx] = TILES.tree;
      foreground[Math.max(0, yy - 1)][xx] = TILES.treeTop;
      blockers[yy][xx] = TILES.tree;
    }
  }
}

export const interactions = [
  { id: 'home_a', type: 'door', x: 46.5, y: 25, target: 'homeA', label: 'Enter' },
  { id: 'home_b', type: 'door', x: 59, y: 28, target: 'homeB', label: 'Enter' },
  { id: 'home_c', type: 'door', x: 50.5, y: 37, target: 'homeC', label: 'Enter' },
  { id: 'sign', type: 'label', x: 42, y: 30, label: 'Sign' },
  { id: 'stone_circle', type: 'label', x: 33.5, y: 19, label: 'Stone' },
  { id: 'cave', type: 'label', x: 64, y: 11, label: 'Cave' },
  { id: 'clearing', type: 'label', x: 15, y: 16, label: 'Clearing' },
  { id: 'water', type: 'label', x: 25, y: 47, label: 'Water' },
];
