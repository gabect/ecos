import { TILES } from './tiles.js';

export const WORLD_WIDTH = 88;
export const WORLD_HEIGHT = 62;

const fill = (value) => Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill(value));
const rect = (layer, x, y, w, h, value) => {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      if (layer[yy] && layer[yy][xx] !== undefined) layer[yy][xx] = value;
    }
  }
};
const ellipse = (layer, cx, cy, rx, ry, value) => {
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const n = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
      if (n <= 1 && layer[y] && layer[y][x] !== undefined) layer[y][x] = value;
    }
  }
};
const line = (layer, x0, y0, x1, y1, radius, value) => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    rect(layer, x - radius, y - radius, radius * 2 + 1, radius * 2 + 1, value);
  }
};

export function buildWorldLayers() {
  const ground = fill(TILES.grass);
  const detail = fill(-1);
  const blockers = fill(-1);
  const foreground = fill(-1);

  // Natural variation.
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      if ((x * 17 + y * 31) % 11 === 0) ground[y][x] = TILES.grassDark;
      if ((x * 13 + y * 7) % 43 === 0) detail[y][x] = TILES.flowers;
    }
  }

  // Lake, shore, river, and bridge.
  ellipse(ground, 18, 43, 13, 9, TILES.sand);
  ellipse(ground, 18, 43, 11, 7, TILES.waterA);
  ellipse(ground, 23, 40, 5, 3, TILES.waterB);
  line(ground, 29, 41, 41, 35, 1, TILES.waterA);
  rect(ground, 33, 37, 6, 2, TILES.bridge);

  // Main paths through the village and wilds.
  line(ground, 12, 50, 36, 38, 1, TILES.path);
  line(ground, 36, 38, 48, 26, 1, TILES.path);
  line(ground, 48, 26, 63, 28, 1, TILES.path);
  line(ground, 48, 26, 48, 13, 1, TILES.path);
  line(ground, 63, 28, 75, 43, 1, TILES.path);
  line(ground, 48, 26, 35, 20, 1, TILES.path);

  // Hills and cliffs along the north/east edges.
  rect(ground, 0, 0, WORLD_WIDTH, 4, TILES.cliffTop);
  rect(blockers, 0, 0, WORLD_WIDTH, 4, TILES.cliffTop);
  rect(ground, 70, 0, 18, 35, TILES.cliffTop);
  rect(blockers, 70, 0, 18, 35, TILES.cliffTop);
  line(ground, 66, 4, 66, 33, 1, TILES.cliff);
  line(blockers, 66, 4, 66, 33, 1, TILES.cliff);
  rect(ground, 58, 5, 10, 5, TILES.cliffTop);
  rect(blockers, 58, 5, 10, 5, TILES.cliffTop);

  // Cave mouth cut into the hills.
  rect(ground, 62, 8, 4, 3, TILES.cave);
  rect(blockers, 63, 9, 2, 1, -1);

  // Village homes.
  addHouse(ground, blockers, foreground, 43, 20, 7, 6);
  addHouse(ground, blockers, foreground, 55, 23, 8, 6);
  addHouse(ground, blockers, foreground, 47, 32, 7, 6);
  rect(detail, 41, 28, 24, 1, TILES.fence);
  rect(blockers, 41, 28, 24, 1, TILES.fence);

  // Ruins and hidden grove.
  rect(detail, 30, 15, 4, 1, TILES.ruin);
  rect(detail, 29, 16, 1, 4, TILES.ruin);
  rect(detail, 36, 16, 1, 4, TILES.ruin);
  rect(detail, 31, 20, 5, 1, TILES.ruin);
  rect(blockers, 29, 16, 1, 4, TILES.ruin);
  rect(blockers, 36, 16, 1, 4, TILES.ruin);
  rect(detail, 33, 18, 1, 1, TILES.torch);
  rect(ground, 10, 12, 10, 8, TILES.grassDark);
  line(ground, 20, 19, 28, 21, 0, TILES.path);

  // Forest clusters and boundaries.
  const trees = [
    [4, 8, 12, 18], [18, 5, 18, 8], [2, 28, 13, 18], [20, 28, 8, 8],
    [4, 52, 28, 8], [55, 42, 26, 14], [68, 36, 15, 20], [38, 48, 18, 10],
    [0, 4, 5, 56], [83, 34, 5, 28],
  ];
  trees.forEach(([x, y, w, h]) => scatterTrees(detail, blockers, foreground, x, y, w, h));

  // Lake collision after paths/bridge are laid down.
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      if ([TILES.waterA, TILES.waterB].includes(ground[y][x])) blockers[y][x] = TILES.waterA;
      if (ground[y][x] === TILES.bridge) blockers[y][x] = -1;
    }
  }

  return { ground, detail, blockers, foreground };
}

function addHouse(ground, blockers, foreground, x, y, w, h) {
  rect(ground, x, y + 2, w, h - 2, TILES.wall);
  rect(foreground, x, y, w, 2, TILES.roof);
  rect(ground, x + Math.floor(w / 2), y + h - 1, 1, 1, TILES.door);
  rect(blockers, x, y, w, h, TILES.wall);
  blockers[y + h - 1][x + Math.floor(w / 2)] = -1;
}

function scatterTrees(detail, blockers, foreground, x, y, w, h) {
  for (let yy = y; yy < y + h; yy += 2) {
    for (let xx = x; xx < x + w; xx += 2) {
      if ((xx * 5 + yy * 9) % 4 === 0) continue;
      if (!detail[yy] || detail[yy][xx] === undefined) continue;
      detail[yy][xx] = TILES.tree;
      foreground[Math.max(0, yy - 1)][xx] = TILES.treeTop;
      blockers[yy][xx] = TILES.tree;
    }
  }
}

export const interactions = [
  { id: 'elder_home', type: 'door', x: 46.5, y: 25, target: 'elderHome', text: 'A warm lamplight spills from the Elder House.' },
  { id: 'weaver_home', type: 'door', x: 59, y: 28, target: 'weaverHome', text: 'The Weaver House smells faintly of cedar and rain.' },
  { id: 'pond_home', type: 'door', x: 50.5, y: 37, target: 'pondHome', text: 'A quiet cottage faces the lake breeze.' },
  { id: 'village_sign', type: 'sign', x: 42, y: 30, text: 'Liora Hollow — listen for bells when the mist gathers.' },
  { id: 'ruin_tablet', type: 'lore', x: 33.5, y: 19, text: 'The stone is older than the village. Its carved spiral hums under your palm.' },
  { id: 'cave_mouth', type: 'lore', x: 64, y: 11, text: 'Cold air breathes from the sealed cave. Something glimmers far inside.' },
  { id: 'hidden_grove', type: 'discovery', x: 15, y: 16, text: 'Hidden Grove discovered. The grass here sways without wind.' },
  { id: 'lake_edge', type: 'lore', x: 25, y: 47, text: 'Silver fish move like tiny stars below the lake surface.' },
];
