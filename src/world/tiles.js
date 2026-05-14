export const TILE_SIZE = 16;
export const FLOOR_TILESET_KEY = 'floor-tileset';

// The uploaded terrain sheet is a 16x16 pixel-art tileset with dark gutters.
// Keep Phaser from sampling those gutters by copying source cells into this clean
// runtime atlas before any tilemap binds the texture.
export const FLOOR_TILESET_GRID = {
  tileWidth: TILE_SIZE,
  tileHeight: TILE_SIZE,
  margin: 1,
  spacing: 1,
};

export const TILES = {
  grass: 0,
  grassDark: 1,
  flowers: 2,
  path: 3,
  waterA: 4,
  waterB: 5,
  sand: 6,
  bridge: 7,
  cliff: 8,
  cliffTop: 9,
  stone: 10,
  stoneBlock: 11,
  roof: 12,
  wall: 13,
  door: 14,
  tree: 15,
  treeTop: 16,
  bush: 17,
  shadow: 18,
  floor: 19,
  rug: 20,
  cave: 21,
  fence: 22,
  torch: 23,
};

const TILE_COLUMNS = 8;
const TILE_COUNT = Object.keys(TILES).length;

const terrainTileTargets = {
  [TILES.grass]: { color: [79, 159, 80], prefer: 'green' },
  [TILES.grassDark]: { color: [63, 136, 71], prefer: 'green-dark' },
  [TILES.flowers]: { color: [112, 174, 88], prefer: 'green-detail' },
  [TILES.path]: { color: [185, 131, 82], prefer: 'dirt' },
  [TILES.waterA]: { color: [45, 128, 189], prefer: 'water' },
  [TILES.waterB]: { color: [35, 111, 174], prefer: 'water-dark' },
  [TILES.sand]: { color: [216, 189, 118], prefer: 'sand' },
  // TODO: If the source sheet has a dedicated bridge plank, pin this to that cell.
  [TILES.bridge]: { color: [141, 86, 52], prefer: 'wood' },
  [TILES.cliff]: { color: [114, 87, 74], prefer: 'rock-brown' },
  [TILES.cliffTop]: { color: [127, 142, 86], prefer: 'rock-grass' },
  [TILES.stone]: { color: [127, 135, 145], prefer: 'stone' },
  [TILES.stoneBlock]: { color: [95, 102, 112], prefer: 'stone-dark' },
  [TILES.cave]: { color: [36, 38, 50], prefer: 'cave' },
};

const tilePalette = {
  [TILES.grass]: ['#4f9f50', '#76c96b', '#2f7437'],
  [TILES.grassDark]: ['#3f8847', '#5aaa58', '#286336'],
  [TILES.flowers]: ['#4f9a4d', '#ffe07a', '#e57aa7'],
  [TILES.path]: ['#b98352', '#d6a46d', '#80583d'],
  [TILES.waterA]: ['#2d80bd', '#61c8e8', '#1c5a91'],
  [TILES.waterB]: ['#236fae', '#8de0f4', '#184779'],
  [TILES.sand]: ['#d8bd76', '#f1d993', '#a48857'],
  [TILES.bridge]: ['#8d5634', '#b47442', '#5d3428'],
  [TILES.cliff]: ['#72574a', '#937061', '#3d3230'],
  [TILES.cliffTop]: ['#7f8e56', '#9cac63', '#59623f'],
  [TILES.stone]: ['#7f8791', '#aab0b8', '#515761'],
  [TILES.stoneBlock]: ['#5f6670', '#8d94a0', '#393f49'],
  [TILES.roof]: ['#8d3e5c', '#b65773', '#572b44'],
  [TILES.wall]: ['#c8a16d', '#f0c786', '#8b6848'],
  [TILES.door]: ['#5e3c2f', '#8a593d', '#33211f'],
  [TILES.tree]: ['#4f3226', '#7a4a32', '#2c1d19'],
  [TILES.treeTop]: ['#1f6d46', '#2f965d', '#16452f'],
  [TILES.bush]: ['#2e7d4d', '#43a667', '#1c5638'],
  [TILES.shadow]: ['#1d2630', '#283645', '#101821'],
  [TILES.floor]: ['#8a6a4f', '#a77f5c', '#5f493a'],
  [TILES.rug]: ['#5c588f', '#8d79bf', '#3b3b6f'],
  [TILES.cave]: ['#242632', '#383a48', '#0f1118'],
  [TILES.fence]: ['#7a4a32', '#a1663e', '#4a2d24'],
  [TILES.torch]: ['#5b3324', '#f4a641', '#ffdf77'],
};

export function createTileTexture(scene) {
  const sourceImage = getLoadedFloorImage(scene);
  if (scene.textures.exists(FLOOR_TILESET_KEY)) scene.textures.remove(FLOOR_TILESET_KEY);

  const rows = Math.ceil(TILE_COUNT / TILE_COLUMNS);
  const canvas = scene.textures.createCanvas(FLOOR_TILESET_KEY, TILE_COLUMNS * TILE_SIZE, rows * TILE_SIZE);
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;

  paintFallbackAtlas(ctx);
  if (sourceImage) paintFloorTilesFromSource(ctx, sourceImage);

  canvas.refresh();
}

function getLoadedFloorImage(scene) {
  if (!scene.textures.exists(FLOOR_TILESET_KEY)) return null;
  const image = scene.textures.get(FLOOR_TILESET_KEY).getSourceImage();
  if (!image || !image.width || !image.height) return null;
  return image;
}

function paintFallbackAtlas(ctx) {
  Object.entries(tilePalette).forEach(([tileIndex, colors]) => {
    const index = Number(tileIndex);
    const x = (index % TILE_COLUMNS) * TILE_SIZE;
    const y = Math.floor(index / TILE_COLUMNS) * TILE_SIZE;
    paintTile(ctx, x, y, colors, index);
  });
}

function paintFloorTilesFromSource(ctx, image) {
  const sourceTiles = readSourceTiles(image);
  if (!sourceTiles.length) return;

  const used = new Set();
  Object.entries(terrainTileTargets).forEach(([tileIndex, target]) => {
    const tile = findClosestSourceTile(sourceTiles, target, used);
    if (!tile) return;
    used.add(tile.index);
    const index = Number(tileIndex);
    ctx.drawImage(
      image,
      tile.x,
      tile.y,
      TILE_SIZE,
      TILE_SIZE,
      (index % TILE_COLUMNS) * TILE_SIZE,
      Math.floor(index / TILE_COLUMNS) * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
    );
  });
}

function readSourceTiles(image) {
  const { margin, spacing } = resolveFloorGrid(image);
  const columns = Math.floor((image.width - margin + spacing) / (TILE_SIZE + spacing));
  const rows = Math.floor((image.height - margin + spacing) / (TILE_SIZE + spacing));
  if (columns <= 0 || rows <= 0) return [];

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = image.width;
  sampleCanvas.height = image.height;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  sampleCtx.imageSmoothingEnabled = false;
  sampleCtx.drawImage(image, 0, 0);

  const tiles = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const sx = margin + x * (TILE_SIZE + spacing);
      const sy = margin + y * (TILE_SIZE + spacing);
      if (sx + TILE_SIZE > image.width || sy + TILE_SIZE > image.height) continue;
      tiles.push({ index: y * columns + x, x: sx, y: sy, color: averageTileColor(sampleCtx, sx, sy) });
    }
  }
  return tiles;
}

function resolveFloorGrid(image) {
  const preferred = FLOOR_TILESET_GRID;
  if (fitsGrid(image, preferred.margin, preferred.spacing)) return preferred;

  const candidates = [
    { margin: 1, spacing: 1 },
    { margin: 0, spacing: 1 },
    { margin: 1, spacing: 0 },
    { margin: 0, spacing: 0 },
    { margin: 2, spacing: 1 },
    { margin: 1, spacing: 2 },
  ];
  return candidates.find(({ margin, spacing }) => fitsGrid(image, margin, spacing)) ?? preferred;
}

function fitsGrid(image, margin, spacing) {
  const usableW = image.width - margin;
  const usableH = image.height - margin;
  if (usableW < TILE_SIZE || usableH < TILE_SIZE) return false;
  return (usableW + spacing) % (TILE_SIZE + spacing) === 0 && (usableH + spacing) % (TILE_SIZE + spacing) === 0;
}

function averageTileColor(ctx, x, y) {
  const data = ctx.getImageData(x, y, TILE_SIZE, TILE_SIZE).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const sum = data[i] + data[i + 1] + data[i + 2];
    if (alpha < 32 || sum < 72) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }
  if (!count) return [0, 0, 0];
  return [r / count, g / count, b / count];
}

function findClosestSourceTile(tiles, target, used) {
  return tiles
    .filter((tile) => !used.has(tile.index))
    .map((tile) => ({ tile, score: colorDistance(tile.color, target.color) - preferenceBonus(tile.color, target.prefer) }))
    .sort((a, b) => a.score - b.score)[0]?.tile;
}

function colorDistance(a, b) {
  return ((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2) + ((a[2] - b[2]) ** 2);
}

function preferenceBonus(color, prefer) {
  const [r, g, b] = color;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  if (prefer === 'green' && g > r && g > b) return 2400;
  if (prefer === 'green-dark' && g > r && g > b && g < 150) return 3200;
  if (prefer === 'green-detail' && g > r && saturation > 35) return 1400;
  if (prefer === 'water' && b > r && b >= g) return 3200;
  if (prefer === 'water-dark' && b > r && b >= g && b < 190) return 3800;
  if (prefer === 'sand' && r > b && g > b && Math.abs(r - g) < 70) return 2600;
  if (prefer === 'dirt' && r > g && g > b) return 2200;
  if (prefer === 'wood' && r > g && g > b && r < 170) return 1500;
  if (prefer === 'stone' && saturation < 45 && r > 70) return 2600;
  if (prefer === 'stone-dark' && saturation < 45 && r < 130) return 2800;
  if (prefer === 'rock-brown' && r >= g && g >= b && saturation < 70) return 1800;
  if (prefer === 'rock-grass' && g >= r && r >= b) return 1600;
  if (prefer === 'cave' && r < 70 && g < 70 && b < 85) return 4200;
  return 0;
}

function paintTile(ctx, x, y, colors, index) {
  const [base, hi, low] = colors;
  ctx.fillStyle = base;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  if (index === TILES.grass || index === TILES.grassDark) {
    ctx.fillStyle = hi;
    ctx.fillRect(x + 2, y + 3, 1, 3);
    ctx.fillRect(x + 11, y + 8, 1, 4);
    ctx.fillRect(x + 6, y + 13, 3, 1);
    ctx.fillStyle = low;
    ctx.fillRect(x + 4, y + 6, 1, 2);
    ctx.fillRect(x + 13, y + 2, 1, 2);
    ctx.fillRect(x + 1, y + 14, 5, 1);
    return;
  }

  ctx.fillStyle = hi;
  ctx.fillRect(x + 2, y + 2, 4, 2);
  ctx.fillRect(x + 10, y + 9, 3, 2);
  ctx.fillStyle = low;
  ctx.fillRect(x, y + 14, TILE_SIZE, 2);

  if ([TILES.waterA, TILES.waterB].includes(index)) {
    ctx.fillStyle = low;
    ctx.fillRect(x, y + 13, TILE_SIZE, 3);
    ctx.fillStyle = hi;
    ctx.fillRect(x + 1, y + 4, 8, 1);
    ctx.fillRect(x + 6, y + 10, 9, 1);
    ctx.fillRect(x + 3, y + 13, 4, 1);
  }

  if (index === TILES.path || index === TILES.sand) {
    ctx.fillStyle = hi;
    ctx.fillRect(x + 1, y + 1, 5, 1);
    ctx.fillRect(x + 9, y + 4, 5, 1);
    ctx.fillStyle = low;
    ctx.fillRect(x + 3, y + 6, 2, 2);
    ctx.fillRect(x + 11, y + 12, 1, 1);
    ctx.fillRect(x + 7, y + 9, 1, 1);
  }

  if (index === TILES.treeTop || index === TILES.bush) {
    ctx.fillStyle = low;
    ctx.fillRect(x + 1, y + 9, 14, 5);
    ctx.fillRect(x + 4, y + 3, 9, 8);
    ctx.fillStyle = hi;
    ctx.fillRect(x + 4, y + 1, 7, 4);
    ctx.fillRect(x + 2, y + 6, 4, 3);
    ctx.fillRect(x + 10, y + 6, 3, 2);
  }

  if (index === TILES.roof) {
    ctx.fillStyle = low;
    ctx.fillRect(x, y + 11, TILE_SIZE, 5);
    ctx.fillStyle = hi;
    for (let i = 0; i < TILE_SIZE; i += 4) ctx.fillRect(x + i, y + 2, 2, 10);
  }

  if (index === TILES.stoneBlock || index === TILES.stone) {
    ctx.fillStyle = low;
    ctx.fillRect(x + 3, y + 4, 10, 1);
    ctx.fillRect(x + 2, y + 10, 12, 1);
  }
}
