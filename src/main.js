import { BootScene } from './scenes/BootScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { InteriorScene } from './scenes/InteriorScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#111827',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 512,
    height: 288,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, WorldScene, InteriorScene],
};

new Phaser.Game(config);
