import { FLOOR_SOURCE_KEY, createTileTexture } from '../world/tiles.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image(FLOOR_SOURCE_KEY, 'assets/floor.png');
    this.load.image('jungle-floor', 'assets/junglefloor32x32.png');
    this.createPlayerSheet();
    this.createGlowTexture();
    this.createParticleTexture();
    this.createTorchTexture();
  }

  create() {
    createTileTexture(this);
    this.createPlayerAnimations();
    this.scene.start('WorldScene');
  }

  createPlayerSheet() {
    const canvas = document.createElement('canvas');
    const frameWidth = 18;
    const frameHeight = 26;
    const framesPerDirection = 4;
    canvas.width = frameWidth * framesPerDirection * 4;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const dirs = ['down', 'left', 'right', 'up'];
    dirs.forEach((dir, dirIndex) => {
      for (let step = 0; step < framesPerDirection; step += 1) {
        const x = (dirIndex * framesPerDirection + step) * frameWidth;
        drawHero(ctx, x, 0, dir, step);
      }
    });
    this.textures.addSpriteSheet('player', canvas, { frameWidth, frameHeight });
  }

  createPlayerAnimations() {
    const dirs = ['down', 'left', 'right', 'up'];
    dirs.forEach((dir, dirIndex) => {
      const start = dirIndex * 4;
      this.anims.create({ key: `idle-${dir}`, frames: [{ key: 'player', frame: start }], frameRate: 1, repeat: -1 });
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers('player', { start, end: start + 3 }),
        frameRate: 10,
        repeat: -1,
      });
    });
  }

  createGlowTexture() {
    const g = this.add.graphics();
    g.fillStyle(0xfff0a3, 0.7).fillCircle(8, 8, 8);
    g.generateTexture('interact-glow', 16, 16);
    g.destroy();
  }

  createParticleTexture() {
    const g = this.add.graphics();
    g.fillStyle(0xf1d37a, 0.8).fillRect(0, 0, 2, 2);
    g.generateTexture('leaf-particle', 2, 2);
    g.destroy();
  }

  createTorchTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ['#ffdf77', '#f4a641', '#e4572e'].forEach((color, i) => {
      const x = i * 8;
      ctx.fillStyle = '#5b3324';
      ctx.fillRect(x + 3, 4, 2, 4);
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, 1, 4, 5);
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(x + 3, 2, 2, 2);
    });
    this.textures.addSpriteSheet('torch-flame', canvas, { frameWidth: 8, frameHeight: 8 });
    this.anims.create({ key: 'torch-flicker', frames: this.anims.generateFrameNumbers('torch-flame', { start: 0, end: 2 }), frameRate: 9, repeat: -1 });
  }
}

function drawHero(ctx, x, y, dir, step) {
  const phase = step % 4;
  const bob = phase === 1 || phase === 3 ? 1 : 0;
  const swing = phase === 0 ? -2 : phase === 2 ? 2 : 0;
  const skin = '#e9bb86';
  const hair = '#52342e';
  const tunic = '#466fb0';
  const tunicDark = '#253f7a';
  const boot = '#20283c';
  const outline = '#171b28';

  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  ctx.fillRect(x + 4, y + 22, 10, 2);

  const headY = y + 2 + bob;
  const bodyY = y + 10 + bob;
  const leftLegY = phase === 0 ? y + 18 : phase === 2 ? y + 20 : y + 19;
  const rightLegY = phase === 0 ? y + 20 : phase === 2 ? y + 18 : y + 19;
  const leftArmY = y + 11 + bob - Math.sign(swing || -1);
  const rightArmY = y + 11 + bob + Math.sign(swing || 1);

  // Animated legs first so the tunic sits over the hips.
  ctx.fillStyle = boot;
  if (dir === 'left' || dir === 'right') {
    ctx.fillRect(x + 7 + Math.max(0, swing), leftLegY, 3, 5);
    ctx.fillRect(x + 8 + Math.min(0, swing), rightLegY, 3, 5);
  } else {
    ctx.fillRect(x + 5, leftLegY, 3, 5);
    ctx.fillRect(x + 10, rightLegY, 3, 5);
  }

  // Arms swing opposite the legs and remain visible in every direction.
  ctx.fillStyle = outline;
  ctx.fillRect(x + 3, leftArmY, 3, 8);
  ctx.fillRect(x + 12, rightArmY, 3, 8);
  ctx.fillStyle = skin;
  ctx.fillRect(x + 3, leftArmY, 2, 7);
  ctx.fillRect(x + 13, rightArmY, 2, 7);

  ctx.fillStyle = tunic;
  ctx.fillRect(x + 5, bodyY, 8, 9);
  ctx.fillStyle = tunicDark;
  ctx.fillRect(x + 6, bodyY + 6, 6, 3);

  ctx.fillStyle = hair;
  ctx.fillRect(x + 5, headY, 8, 5);
  ctx.fillStyle = skin;
  ctx.fillRect(x + 5, headY + 4, 8, 6);

  if (dir === 'up') {
    ctx.fillStyle = hair;
    ctx.fillRect(x + 5, headY + 4, 8, 4);
  }
  if (dir === 'left') {
    ctx.fillStyle = hair;
    ctx.fillRect(x + 4, headY + 5, 3, 4);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 6, headY + 6, 2, 2);
  }
  if (dir === 'right') {
    ctx.fillStyle = hair;
    ctx.fillRect(x + 11, headY + 5, 3, 4);
    ctx.fillStyle = skin;
    ctx.fillRect(x + 10, headY + 6, 2, 2);
  }
  if (dir === 'down') {
    ctx.fillStyle = '#20283c';
    ctx.fillRect(x + 7, headY + 7, 1, 1);
    ctx.fillRect(x + 11, headY + 7, 1, 1);
  }
}
