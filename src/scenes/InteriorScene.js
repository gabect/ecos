import { Player } from '../entities/Player.js';
import { SaveManager } from '../systems/SaveManager.js';
import { TILE_SIZE, TILES } from '../world/tiles.js';

const INTERIORS = {
  elderHome: {
    name: 'Elder House',
    message: 'Maps, bells, and dried moonflowers crowd the elder\'s table.',
    tint: 0xf0b46b,
  },
  weaverHome: {
    name: 'Weaver House',
    message: 'A half-finished tapestry shows the lake under three impossible moons.',
    tint: 0xb08cff,
  },
  pondHome: {
    name: 'Lake Cottage',
    message: 'Shells on the windowsill click softly, though no hand touches them.',
    tint: 0x8fd7ff,
  },
};

export class InteriorScene extends Phaser.Scene {
  constructor() {
    super('InteriorScene');
  }

  create(data = {}) {
    this.returnTo = data.returnTo ?? { x: 48.5, y: 30 };
    this.interior = INTERIORS[data.interior] ?? INTERIORS.elderHome;
    this.createRoom();
    this.createPlayer();
    this.createCamera();
    this.createHud();
    this.createInput();
    this.cameras.main.fadeIn(360, 12, 18, 28);
  }

  createRoom() {
    const width = 20;
    const height = 14;
    const floor = Array.from({ length: height }, () => Array(width).fill(TILES.floor));
    const walls = Array.from({ length: height }, () => Array(width).fill(-1));
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) walls[y][x] = TILES.wall;
      }
    }
    walls[height - 1][Math.floor(width / 2)] = TILES.door;
    floor[7][8] = TILES.rug;
    floor[7][9] = TILES.rug;
    floor[8][8] = TILES.rug;
    floor[8][9] = TILES.rug;

    this.map = this.make.tilemap({ data: floor, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = this.map.addTilesetImage('liora-tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0, 0);
    this.map.createLayer(0, tileset, 96, 32);
    this.wallLayer = this.map.createBlankLayer('walls', tileset, 96, 32, width, height);
    walls.forEach((row, y) => row.forEach((tile, x) => {
      if (tile >= 0) this.wallLayer.putTileAt(tile, x, y);
    }));
    this.wallLayer.setCollisionByExclusion([-1, TILES.door]);
    this.physics.world.setBounds(96, 32, width * TILE_SIZE, height * TILE_SIZE);

    this.add.rectangle(256, 144, width * TILE_SIZE, height * TILE_SIZE, this.interior.tint, 0.08)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(30);
    this.add.text(112, 44, this.interior.name, { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#f8efd0' }).setDepth(40);
    this.add.sprite(180, 96, 'torch-flame').play('torch-flicker').setDepth(25);
    this.add.sprite(324, 96, 'torch-flame').play('torch-flicker').setDepth(25);
  }

  createPlayer() {
    this.player = new Player(this, 256, 205);
    this.physics.add.collider(this.player, this.wallLayer);
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, 512, 288);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(60, 40);
  }

  createHud() {
    this.prompt = this.add.text(256, 250, 'E / Space: inspect   ↓ at door: leave', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff3ba',
      backgroundColor: '#192033cc',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.dialogue = this.add.text(256, 222, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#f8efd0',
      backgroundColor: '#182033ee',
      padding: { x: 10, y: 8 },
      wordWrap: { width: 430 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE');
  }

  update() {
    this.player.update(this.cursors, this.keys);
    this.player.setDepth(this.player.y);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.inspect();
    if (this.player.y > 228 && Math.abs(this.player.x - 256) < 20) this.leave();
  }

  inspect() {
    this.dialogue.setText(this.interior.message).setAlpha(1);
    this.time.delayedCall(2800, () => this.tweens.add({ targets: this.dialogue, alpha: 0, duration: 400 }));
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    SaveManager.save({ scene: 'WorldScene', player: this.returnTo });
    this.cameras.main.fadeOut(320, 12, 18, 28);
    this.time.delayedCall(330, () => this.scene.start('WorldScene', { fromInterior: true, exit: this.returnTo }));
  }
}
