import { Player } from '../entities/Player.js';
import { SaveManager } from '../systems/SaveManager.js';
import { TouchControls } from '../systems/TouchControls.js';
import { TILESET_TEXTURE_KEY, TILE_SIZE, TILES } from '../world/tiles.js';

const INTERIORS = {
  homeA: { tint: 0xf0b46b },
  homeB: { tint: 0xb08cff },
  homeC: { tint: 0x8fd7ff },
};

const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 14;
const ROOM_ORIGIN_X = 6 * TILE_SIZE;
const ROOM_ORIGIN_Y = 2 * TILE_SIZE;
const ROOM_CENTER_X = ROOM_ORIGIN_X + (ROOM_WIDTH * TILE_SIZE) / 2;
const ROOM_CENTER_Y = ROOM_ORIGIN_Y + (ROOM_HEIGHT * TILE_SIZE) / 2;

const roomX = (tileX) => ROOM_ORIGIN_X + tileX * TILE_SIZE;
const roomY = (tileY) => ROOM_ORIGIN_Y + tileY * TILE_SIZE;

export class InteriorScene extends Phaser.Scene {
  constructor() {
    super('InteriorScene');
  }

  create(data = {}) {
    this.returnTo = data.returnTo ?? { x: 48.5, y: 30 };
    this.interior = INTERIORS[data.interior] ?? INTERIORS.homeA;
    this.createRoom();
    this.createPlayer();
    this.createCamera();
    this.createHud();
    this.createInput();
    this.createTouchControls();
    this.cameras.main.fadeIn(360, 12, 18, 28);
  }

  createRoom() {
    const width = ROOM_WIDTH;
    const height = ROOM_HEIGHT;
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
    const tileset = this.map.addTilesetImage(TILESET_TEXTURE_KEY, TILESET_TEXTURE_KEY, TILE_SIZE, TILE_SIZE, 0, 0, 0);
    this.map.createLayer(0, tileset, ROOM_ORIGIN_X, ROOM_ORIGIN_Y);
    this.wallLayer = this.map.createBlankLayer('walls', tileset, ROOM_ORIGIN_X, ROOM_ORIGIN_Y, width, height);
    walls.forEach((row, y) => row.forEach((tile, x) => {
      if (tile >= 0) this.wallLayer.putTileAt(tile, x, y);
    }));
    this.wallLayer.setCollisionByExclusion([-1, TILES.door]);
    this.physics.world.setBounds(ROOM_ORIGIN_X, ROOM_ORIGIN_Y, width * TILE_SIZE, height * TILE_SIZE);

    this.add.rectangle(ROOM_CENTER_X, ROOM_CENTER_Y, width * TILE_SIZE, height * TILE_SIZE, this.interior.tint, 0.08)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(30);
    this.add.text(roomX(1), roomY(0.75), 'Room', { fontFamily: 'monospace', fontSize: '11px', color: '#f8efd0' }).setDepth(40);
    this.add.sprite(roomX(5.25), roomY(4), 'torch-flame').play('torch-flicker').setDepth(25);
    this.add.sprite(roomX(14.25), roomY(4), 'torch-flame').play('torch-flicker').setDepth(25);
  }

  createPlayer() {
    this.player = new Player(this, roomX(10), roomY(10.8125));
    this.physics.add.collider(this.player, this.wallLayer);
  }

  createCamera() {
    this.cameras.main.setBounds(ROOM_ORIGIN_X, ROOM_ORIGIN_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(60, 40);
  }

  createHud() {
    this.prompt = this.add.text(256, 252, 'E / Space: Interact   ↓: Exit', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#fff3ba',
      backgroundColor: '#192033cc',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.label = this.add.text(256, 226, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#f8efd0',
      backgroundColor: '#141b2dcc',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE');
  }

  createTouchControls() {
    this.touchInput = new Phaser.Math.Vector2(0, 0);
    this.touchInteractPressed = false;
    this.touchControls = new TouchControls(this, {
      onInteract: () => {
        this.touchInteractPressed = true;
      },
    });
    this.touchInput = this.touchControls.movementVector;
  }

  updateTouchControls() {
    if (!this.touchInteractPressed) return;
    this.touchInteractPressed = false;
    this.inspect();
  }

  update() {
    this.player.update(this.cursors, this.keys, this.touchInput);
    this.player.setDepth(this.player.y);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.inspect();
    this.updateTouchControls();
    if (this.player.y > roomY(12.25) && Math.abs(this.player.x - roomX(10)) < 1.25 * TILE_SIZE) this.leave();
  }

  inspect() {
    this.label.setText('Interact').setAlpha(1);
    this.tweens.killTweensOf(this.label);
    this.tweens.add({ targets: this.label, alpha: 0, delay: 500, duration: 220 });
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    SaveManager.save({ scene: 'WorldScene', player: this.returnTo });
    this.cameras.main.fadeOut(320, 12, 18, 28);
    this.time.delayedCall(330, () => this.scene.start('WorldScene', { fromInterior: true, exit: this.returnTo }));
  }
}
