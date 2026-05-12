import { BootScene } from './scenes/BootScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { InteriorScene } from './scenes/InteriorScene.js';

if (typeof Phaser === 'undefined') {
  throw new Error('Phaser failed to load before the game module.');
}

const gameContainer = document.getElementById('game');
gameContainer.textContent = '';

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
