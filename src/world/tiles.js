export const TILE_SIZE = 16;

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
  const columns = 8;
  const rows = 3;
  const canvas = scene.textures.createCanvas('tiles', columns * TILE_SIZE, rows * TILE_SIZE);
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;

  Object.entries(tilePalette).forEach(([tileIndex, colors]) => {
    const index = Number(tileIndex);
    const x = (index % columns) * TILE_SIZE;
    const y = Math.floor(index / columns) * TILE_SIZE;
    paintTile(ctx, x, y, colors, index);
  });

  canvas.refresh();
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
