import { TILES } from './tiles.js';

export const WORLD_WIDTH = 264;
export const WORLD_HEIGHT = 186;

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
  paintExpandedWaterAndShore(ground, detail);
  paintExpandedPaths(ground, detail);
  paintExpandedSettlements(ground, blockers, foreground, detail);
  paintExpandedRuins(ground, blockers, detail);
  paintExpandedClearings(ground, detail, blockers);
  paintForest(ground, detail, blockers, foreground);
  paintRocksAndBushes(detail, blockers);
  paintExpandedRocksAndBushes(detail, blockers);
  addWaterCollision(ground, blockers);
  paintWorldBoundaries(ground, detail, blockers, foreground);
  sealWorldBounds(ground, blockers);

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
  [[46, 25], [59, 28], [50, 37]].forEach(([doorX, doorY]) => {
    rect(detail, doorX - 1, 28, 3, 1, -1);
    rect(blockers, doorX - 1, 28, 3, 1, -1);
    setTile(blockers, doorX, doorY, -1);
  });

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


function paintExpandedWaterAndShore(ground, detail) {
  curvedPath(ground, [[7, 111], [26, 106], [48, 103], [70, 96], [96, 100], [119, 93], [142, 91]], 4, TILES.sand);
  curvedPath(ground, [[4, 111], [25, 107], [48, 104], [70, 97], [96, 101], [119, 94], [142, 92]], 2, TILES.waterA);
  curvedPath(ground, [[46, 108], [70, 114], [92, 123], [116, 127], [140, 122], [163, 127]], 2, TILES.waterB);
  rect(ground, 83, 96, 8, 3, TILES.bridge);
  rect(ground, 132, 89, 7, 3, TILES.bridge);
  rect(ground, 104, 123, 8, 3, TILES.bridge);

  ellipse(ground, 198, 128, 20, 12, TILES.sand);
  ellipse(ground, 198, 128, 16, 9, TILES.waterA);
  ellipse(ground, 206, 124, 8, 5, TILES.waterB);
  curvedPath(ground, [[214, 132], [226, 140], [240, 146], [256, 149]], 2, TILES.waterA);

  [[57, 101], [76, 94], [120, 90], [151, 126], [188, 117], [217, 133], [235, 143]].forEach(([x, y]) => {
    setTile(detail, x, y, TILES.stone);
    setTile(detail, x + 2, y + 1, TILES.flowers);
  });
}

function paintExpandedPaths(ground, detail) {
  curvedPath(ground, [[36, 39], [54, 55], [76, 63], [100, 73], [125, 77], [151, 88], [176, 94], [198, 111]], 1, TILES.path);
  curvedPath(ground, [[100, 73], [96, 90], [90, 105], [82, 121], [74, 142], [64, 166]], 1, TILES.path);
  curvedPath(ground, [[125, 77], [133, 58], [151, 45], [176, 39], [205, 43], [228, 38]], 1, TILES.path);
  curvedPath(ground, [[151, 88], [150, 106], [160, 123], [177, 137], [198, 143], [222, 151]], 1, TILES.path);
  curvedPath(ground, [[76, 63], [56, 81], [42, 98], [32, 120]], 0, TILES.path);
  curvedPath(ground, [[176, 94], [199, 84], [220, 72], [239, 58]], 0, TILES.path);

  [[58, 57], [82, 65], [111, 75], [142, 84], [167, 92], [93, 104], [73, 145], [152, 46], [205, 43], [185, 139]].forEach(([x, y]) => {
    setTile(detail, x, y - 1, TILES.flowers);
    setTile(detail, x + 1, y + 1, TILES.stone);
  });
}

function paintExpandedSettlements(ground, blockers, foreground, detail) {
  ellipse(ground, 126, 78, 20, 12, TILES.grassDark);
  addHouse(ground, blockers, foreground, 113, 68, 8, 6);
  addHouse(ground, blockers, foreground, 127, 70, 8, 6);
  addHouse(ground, blockers, foreground, 139, 80, 7, 6);
  rect(detail, 110, 84, 36, 1, TILES.fence);
  rect(blockers, 110, 84, 36, 1, TILES.fence);
  rect(detail, 123, 84, 3, 1, -1);
  rect(blockers, 123, 84, 3, 1, -1);
  [[112, 79], [121, 82], [134, 78], [145, 87], [129, 65]].forEach(([x, y]) => setTile(detail, x, y, TILES.bush));

  ellipse(ground, 66, 166, 14, 9, TILES.grassDark);
  addHouse(ground, blockers, foreground, 56, 158, 7, 6);
  addHouse(ground, blockers, foreground, 70, 161, 8, 6);
  [[62, 169], [68, 156], [78, 170], [54, 167]].forEach(([x, y]) => setTile(detail, x, y, TILES.flowers));
}

function paintExpandedRuins(ground, blockers, detail) {
  ellipse(ground, 207, 55, 22, 13, TILES.grassDark);
  rect(detail, 197, 48, 5, 1, TILES.stoneBlock);
  rect(detail, 196, 49, 1, 7, TILES.stoneBlock);
  rect(detail, 213, 48, 1, 7, TILES.stoneBlock);
  rect(detail, 201, 60, 10, 1, TILES.stoneBlock);
  rect(blockers, 197, 48, 5, 1, TILES.stoneBlock);
  rect(blockers, 196, 49, 1, 7, TILES.stoneBlock);
  rect(blockers, 213, 48, 1, 7, TILES.stoneBlock);
  rect(blockers, 201, 60, 10, 1, TILES.stoneBlock);
  rect(ground, 226, 34, 7, 5, TILES.cave);
  rect(blockers, 226, 34, 7, 5, TILES.cave);
  rect(blockers, 229, 37, 2, 1, -1);
  [[202, 53], [207, 50], [211, 57], [219, 62], [224, 44], [235, 40]].forEach(([x, y]) => {
    setTile(detail, x, y, TILES.stone);
    setTile(blockers, x, y, TILES.stone);
  });
}

function paintExpandedClearings(ground, detail, blockers) {
  [[44, 84, 11, 7], [96, 146, 14, 8], [164, 31, 14, 7], [178, 118, 18, 9], [235, 90, 12, 7]].forEach(([x, y, rx, ry]) => {
    ellipse(ground, x, y, rx, ry, TILES.grassDark);
  });
  [[42, 84], [46, 82], [91, 148], [100, 143], [162, 28], [170, 34], [181, 117], [234, 92]].forEach(([x, y]) => setTile(detail, x, y, TILES.flowers));
  [[98, 146], [181, 121], [237, 88]].forEach(([x, y]) => {
    setTile(detail, x, y, TILES.stone);
    setTile(blockers, x, y, TILES.stone);
  });
}

function paintForest(ground, detail, blockers, foreground) {
  const trees = [
    [4, 8, 12, 18, 2], [18, 5, 18, 8, 3], [2, 28, 13, 18, 2], [20, 28, 8, 8, 2],
    [4, 52, 28, 8, 3], [55, 42, 26, 14, 2], [68, 36, 15, 20, 2], [38, 48, 18, 10, 3],
    [0, 4, 5, 56, 2], [83, 34, 5, 28, 2], [8, 20, 8, 7, 3], [30, 6, 14, 6, 3],
  ];
  trees.forEach(([x, y, w, h, spacing]) => scatterTrees(ground, detail, blockers, foreground, x, y, w, h, spacing));

  const groves = [
    [46, 86, 28, 18, 3], [78, 110, 34, 24, 4], [122, 24, 40, 20, 4], [150, 136, 42, 28, 4],
    [184, 84, 36, 24, 3], [206, 124, 28, 18, 3], [26, 132, 34, 22, 3], [96, 150, 28, 18, 4],
  ];
  groves.forEach(([cx, cy, rx, ry, spacing]) => scatterOrganicTrees(ground, detail, blockers, foreground, cx, cy, rx, ry, spacing));
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

function paintExpandedRocksAndBushes(detail, blockers) {
  const bushes = [
    [52, 61], [70, 67], [89, 77], [106, 83], [151, 92], [168, 98], [192, 109], [214, 116],
    [41, 126], [72, 151], [85, 162], [120, 132], [159, 139], [207, 148], [230, 154], [242, 68],
  ];
  bushes.forEach(([x, y]) => setTile(detail, x, y, TILES.bush));

  const rocks = [[74, 93], [116, 96], [143, 115], [182, 102], [191, 136], [220, 139], [51, 143], [105, 154], [157, 31], [239, 53]];
  rocks.forEach(([x, y]) => {
    setTile(detail, x, y, TILES.stone);
    setTile(blockers, x, y, TILES.stone);
  });
}

function paintWorldBoundaries(ground, detail, blockers, foreground) {
  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    const northDepth = 5 + Math.floor(Math.sin(x * 0.11) * 2 + Math.cos(x * 0.037) * 2);
    const southDepth = 7 + Math.floor(Math.sin(x * 0.08) * 2 + Math.cos(x * 0.051) * 2);
    for (let y = 0; y <= northDepth; y += 1) {
      const tile = y < northDepth - 1 ? TILES.cliffTop : TILES.cliff;
      setTile(ground, x, y, tile);
      setTile(blockers, x, y, tile);
      if (y === northDepth && (x * 13 + y * 5) % 7 === 0) setTile(detail, x, y + 1, TILES.stone);
    }
    for (let y = WORLD_HEIGHT - southDepth; y < WORLD_HEIGHT; y += 1) {
      const tile = y === WORLD_HEIGHT - southDepth ? TILES.sand : ((x + y) % 5 === 0 ? TILES.waterB : TILES.waterA);
      setTile(ground, x, y, tile);
      setTile(blockers, x, y, tile);
    }
  }

  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    const westDepth = 6 + Math.floor(Math.sin(y * 0.13) * 2 + Math.cos(y * 0.043) * 2);
    const eastDepth = 7 + Math.floor(Math.sin(y * 0.1) * 2 + Math.cos(y * 0.033) * 2);
    for (let x = 0; x <= westDepth; x += 1) {
      setTile(ground, x, y, TILES.grassDark);
      if ((x + y) % 3 === 0 || x < westDepth - 2) {
        setTile(detail, x, y, TILES.tree);
        setTile(foreground, x, Math.max(0, y - 1), TILES.treeTop);
        setTile(blockers, x, y, TILES.tree);
      } else {
        setTile(detail, x, y, TILES.bush);
        setTile(blockers, x, y, TILES.bush);
      }
    }
    for (let x = WORLD_WIDTH - eastDepth; x < WORLD_WIDTH; x += 1) {
      const tile = x < WORLD_WIDTH - eastDepth + 3 ? TILES.cliff : TILES.cliffTop;
      setTile(ground, x, y, tile);
      setTile(blockers, x, y, tile);
      if ((x * 3 + y) % 13 === 0) setTile(detail, x - 1, y, TILES.stone);
    }
  }
}

function sealWorldBounds(ground, blockers) {
  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    setTile(blockers, x, 0, ground[0][x] === TILES.waterA ? TILES.waterA : TILES.cliffTop);
    setTile(blockers, x, WORLD_HEIGHT - 1, ground[WORLD_HEIGHT - 1][x] === TILES.waterB ? TILES.waterB : ground[WORLD_HEIGHT - 1][x]);
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    setTile(blockers, 0, y, ground[y][0] === TILES.tree ? TILES.tree : ground[y][0]);
    setTile(blockers, WORLD_WIDTH - 1, y, ground[y][WORLD_WIDTH - 1]);
  }
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

function canPlaceTree(ground, blockers, x, y) {
  if (!ground[y] || ground[y][x] === undefined) return false;
  if (blockers[y][x] >= 0) return false;
  return ![TILES.path, TILES.bridge, TILES.waterA, TILES.waterB, TILES.sand, TILES.door, TILES.wall, TILES.cliff, TILES.cliffTop].includes(ground[y][x]);
}

function placeTree(ground, detail, blockers, foreground, x, y) {
  if (!canPlaceTree(ground, blockers, x, y)) return;
  detail[y][x] = TILES.tree;
  foreground[Math.max(0, y - 1)][x] = TILES.treeTop;
  blockers[y][x] = TILES.tree;
}

function scatterTrees(ground, detail, blockers, foreground, x, y, w, h, spacing = 2) {
  for (let yy = y; yy < y + h; yy += spacing) {
    for (let xx = x; xx < x + w; xx += spacing) {
      if ((xx * 5 + yy * 9) % 5 === 0) continue;
      placeTree(ground, detail, blockers, foreground, xx, yy);
    }
  }
}

function scatterOrganicTrees(ground, detail, blockers, foreground, cx, cy, rx, ry, spacing = 3) {
  for (let y = cy - ry; y <= cy + ry; y += spacing) {
    for (let x = cx - rx; x <= cx + rx; x += spacing) {
      const n = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
      const edgeNoise = Math.sin(x * 0.31) * 0.16 + Math.cos(y * 0.27) * 0.14;
      if (n > 1 + edgeNoise) continue;
      if ((x * 17 + y * 23) % 11 < 2) continue;
      placeTree(ground, detail, blockers, foreground, x, y);
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
  { id: 'water', type: 'label', x: 30, y: 50, label: 'Water' },
  { id: 'north_village_a', type: 'door', x: 117, y: 73, target: 'homeA', label: 'Enter' },
  { id: 'north_village_b', type: 'door', x: 131, y: 75, target: 'homeB', label: 'Enter' },
  { id: 'south_camp_a', type: 'door', x: 59.5, y: 163, target: 'homeC', label: 'Enter' },
  { id: 'east_ruins', type: 'label', x: 207, y: 55, label: 'Ruins' },
  { id: 'east_cave', type: 'label', x: 230, y: 37, label: 'Cave' },
  { id: 'lake', type: 'label', x: 181, y: 128, label: 'Water' },
];
