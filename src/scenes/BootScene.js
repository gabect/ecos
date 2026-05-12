import { createTileTexture } from '../world/tiles.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    createTileTexture(this);
    this.createPlayerSheet();
    this.createGlowTexture();
    this.createParticleTexture();
    this.createTorchTexture();
  }

  create() {
    this.createPlayerAnimations();
    this.scene.start('WorldScene');
  }

  createPlayerSheet() {
    const canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const dirs = ['down', 'left', 'right', 'up'];
    dirs.forEach((dir, dirIndex) => {
      for (let step = 0; step < 3; step += 1) {
        const x = (dirIndex * 3 + step) * 12;
        drawHero(ctx, x, 0, dir, step);
      }
    });
    this.textures.addSpriteSheet('player', canvas, { frameWidth: 12, frameHeight: 24 });
  }

  createPlayerAnimations() {
    const dirs = ['down', 'left', 'right', 'up'];
    dirs.forEach((dir, dirIndex) => {
      const start = dirIndex * 3;
      this.anims.create({ key: `idle-${dir}`, frames: [{ key: 'player', frame: start + 1 }], frameRate: 1, repeat: -1 });
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers('player', { start, end: start + 2 }),
        frameRate: 8,
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
  const bob = step === 1 ? 0 : 1;
  const skin = '#e3b27d';
  const tunic = '#466fb0';
  const shadow = '#1b2030';
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 2, y + 20, 8, 2);
  ctx.fillStyle = '#52342e';
  ctx.fillRect(x + 3, y + bob, 6, 5);
  ctx.fillStyle = skin;
  ctx.fillRect(x + 3, y + 4 + bob, 6, 5);
  ctx.fillStyle = tunic;
  ctx.fillRect(x + 2, y + 9 + bob, 8, 8);
  ctx.fillStyle = '#253f7a';
  ctx.fillRect(x + 3, y + 17, 2, 4);
  ctx.fillRect(x + 7, y + 17, 2, 4);
  ctx.fillStyle = shadow;
  if (dir === 'up') ctx.fillRect(x + 3, y + 4 + bob, 6, 2);
  if (dir === 'left') ctx.fillRect(x + 2, y + 5 + bob, 2, 3);
  if (dir === 'right') ctx.fillRect(x + 8, y + 5 + bob, 2, 3);
  if (dir === 'down') {
    ctx.fillStyle = '#20283c';
    ctx.fillRect(x + 4, y + 6 + bob, 1, 1);
    ctx.fillRect(x + 7, y + 6 + bob, 1, 1);
  }
}
