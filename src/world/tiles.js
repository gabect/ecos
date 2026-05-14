export const TILE_SIZE = 16;
export const FLOOR_SOURCE_KEY = 'floor-source';
export const FLOOR_TILESET_KEY = 'floor-tileset';

// The uploaded floor sheet is a 16x16 tile source. It may contain dark gutters,
// so production tilemaps bind to FLOOR_TILESET_KEY: a clean runtime atlas copied
// from explicit source cells without color matching or generated terrain picks.
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

export const FLOOR_SOURCE_TILES = {
  grass: { col: 0, row: 0 },
  grassDark: { col: 1, row: 0 },
  flowers: { col: 2, row: 0 },
  path: { col: 0, row: 2 },
  road: { col: 0, row: 5 },
  waterA: { col: 0, row: 8 },
  waterB: { col: 1, row: 8 },
  sand: { col: 0, row: 6 },
  cliff: { col: 0, row: 10 },
  cliffTop: { col: 1, row: 10 },
  stone: { col: 0, row: 11 },
  stoneBlock: { col: 1, row: 11 },
  bush: { col: 2, row: 1 },
  groundDetail: { col: 2, row: 0 },
};

const TILE_COLUMNS = 8;
const TILE_COUNT = Object.keys(TILES).length;

const SOURCE_TILE_BY_INDEX = {
  [TILES.grass]: FLOOR_SOURCE_TILES.grass,
  [TILES.grassDark]: FLOOR_SOURCE_TILES.grassDark,
  [TILES.flowers]: FLOOR_SOURCE_TILES.flowers,
  [TILES.path]: FLOOR_SOURCE_TILES.path,
  [TILES.waterA]: FLOOR_SOURCE_TILES.waterA,
  [TILES.waterB]: FLOOR_SOURCE_TILES.waterB,
  [TILES.sand]: FLOOR_SOURCE_TILES.sand,
  [TILES.bridge]: FLOOR_SOURCE_TILES.road,
  [TILES.cliff]: FLOOR_SOURCE_TILES.cliff,
  [TILES.cliffTop]: FLOOR_SOURCE_TILES.cliffTop,
  [TILES.stone]: FLOOR_SOURCE_TILES.stone,
  [TILES.stoneBlock]: FLOOR_SOURCE_TILES.stoneBlock,
  [TILES.bush]: FLOOR_SOURCE_TILES.bush,
  [TILES.cave]: FLOOR_SOURCE_TILES.cliff,
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
  const sourceImage = getLoadedFloorSourceImage(scene);
  if (scene.textures.exists(FLOOR_TILESET_KEY)) scene.textures.remove(FLOOR_TILESET_KEY);

  const rows = Math.ceil(TILE_COUNT / TILE_COLUMNS);
  const canvas = scene.textures.createCanvas(FLOOR_TILESET_KEY, TILE_COLUMNS * TILE_SIZE, rows * TILE_SIZE);
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;

  if (sourceImage) {
    paintCleanTilesetFromSource(ctx, sourceImage);
  } else {
    paintFallbackAtlas(ctx);
  }

  canvas.refresh();
}

function getLoadedFloorSourceImage(scene) {
  if (!scene.textures.exists(FLOOR_SOURCE_KEY)) return null;
  const image = scene.textures.get(FLOOR_SOURCE_KEY).getSourceImage();
  if (!image || !image.width || !image.height) return null;
  return image;
}

function paintCleanTilesetFromSource(ctx, image) {
  Object.entries(SOURCE_TILE_BY_INDEX).forEach(([tileIndex, sourceTile]) => {
    copySourceTile(ctx, image, Number(tileIndex), sourceTile);
  });

  // floor.png is the source of overworld terrain. Non-terrain props/interior
  // placeholders remain generated so unchanged scenes still have visible tiles.
  Object.keys(tilePalette).forEach((tileIndex) => {
    const index = Number(tileIndex);
    if (SOURCE_TILE_BY_INDEX[index]) return;
    paintFallbackTileByIndex(ctx, index);
  });
}

function copySourceTile(ctx, image, tileIndex, sourceTile) {
  const { margin, spacing } = resolveFloorGrid(image);
  const sx = margin + sourceTile.col * (TILE_SIZE + spacing);
  const sy = margin + sourceTile.row * (TILE_SIZE + spacing);
  if (sx + TILE_SIZE > image.width || sy + TILE_SIZE > image.height) return;

  ctx.drawImage(
    image,
    sx,
    sy,
    TILE_SIZE,
    TILE_SIZE,
    (tileIndex % TILE_COLUMNS) * TILE_SIZE,
    Math.floor(tileIndex / TILE_COLUMNS) * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE,
  );
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

function paintFallbackAtlas(ctx) {
  Object.keys(tilePalette).forEach((tileIndex) => paintFallbackTileByIndex(ctx, Number(tileIndex)));
}

function paintFallbackTileByIndex(ctx, index) {
  const x = (index % TILE_COLUMNS) * TILE_SIZE;
  const y = Math.floor(index / TILE_COLUMNS) * TILE_SIZE;
  paintTile(ctx, x, y, tilePalette[index], index);
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
