import { Player } from '../entities/Player.js';
import { AudioManager } from '../systems/AudioManager.js';
import { SaveManager } from '../systems/SaveManager.js';
import { TILE_SIZE, TILES } from '../world/tiles.js';
import { buildWorldLayers, interactions, WORLD_HEIGHT, WORLD_WIDTH } from '../world/worldData.js';

const CAMERA_ROTATION = -Math.PI / 4;

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
  }

  create(data = {}) {
    this.audioManager = new AudioManager(this);
    this.audioManager.playAmbientBed();
    this.createMap();
    this.createAtmosphere();
    this.createPlayer(data);
    this.createInteractions();
    this.createHud();
    this.createCamera();
    this.createInput();
    this.cameras.main.fadeIn(450, 12, 18, 28);
  }

  createMap() {
    const layers = buildWorldLayers();
    this.map = this.make.tilemap({ data: layers.ground, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = this.map.addTilesetImage('liora-tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0, 0);
    this.groundLayer = this.map.createLayer(0, tileset, 0, 0);
    this.detailLayer = this.map.createBlankLayer('detail', tileset, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.blockerLayer = this.map.createBlankLayer('blockers', tileset, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.foregroundLayer = this.map.createBlankLayer('foreground', tileset, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.paintLayer(this.detailLayer, layers.detail);
    this.paintLayer(this.blockerLayer, layers.blockers);
    this.paintLayer(this.foregroundLayer, layers.foreground);
    this.blockerLayer.setCollisionByExclusion([-1]);
    this.blockerLayer.setAlpha(0);
    this.foregroundLayer.setDepth(50);
  }

  paintLayer(layer, data) {
    data.forEach((row, y) => row.forEach((tile, x) => {
      if (tile >= 0) layer.putTileAt(tile, x, y);
    }));
  }

  createPlayer(data) {
    const save = SaveManager.load();
    const start = data.fromInterior ? data.exit ?? { x: 48.5, y: 30 } : save?.player ?? { x: 36, y: 39 };
    this.player = new Player(this, start.x * TILE_SIZE, start.y * TILE_SIZE);
    this.physics.add.collider(this.player, this.blockerLayer);
    this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => SaveManager.save({ scene: 'WorldScene', player: { x: this.player.x / TILE_SIZE, y: this.player.y / TILE_SIZE } }),
    });
  }

  createCamera() {
    const worldCamera = this.cameras.main;
    worldCamera.setBounds(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE);
    worldCamera.startFollow(this.player, true, 0.08, 0.08);
    worldCamera.setDeadzone(112, 72);
    worldCamera.setZoom(1);
    worldCamera.setRotation(CAMERA_ROTATION);

    const uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height, false, 'UICamera');
    const worldObjects = [
      this.groundLayer,
      this.detailLayer,
      this.blockerLayer,
      this.foregroundLayer,
      this.player,
      this.worldTint,
      this.leaves,
      this.waterOverlay,
      ...this.interactables.map((item) => item.marker),
      ...this.torches,
    ].filter(Boolean);
    const uiObjects = [this.dialogue, this.prompt, this.minimap, this.cameraBadge].filter(Boolean);

    worldCamera.ignore(uiObjects);
    uiCamera.ignore(worldObjects);
    this.worldCamera = worldCamera;
    this.uiCamera = uiCamera;
  }

  createInteractions() {
    this.interactables = interactions.map((item) => {
      const marker = this.add.sprite(item.x * TILE_SIZE, item.y * TILE_SIZE, 'interact-glow')
        .setAlpha(0)
        .setDepth(18)
        .setBlendMode(Phaser.BlendModes.ADD);
      return { ...item, marker };
    });
    this.torches = [
      this.add.sprite(33.5 * TILE_SIZE, 18 * TILE_SIZE, 'torch-flame').play('torch-flicker').setDepth(19),
      this.add.sprite(63.2 * TILE_SIZE, 10.7 * TILE_SIZE, 'torch-flame').play('torch-flicker').setDepth(19),
    ];
  }

  createAtmosphere() {
    this.worldTint = this.add.rectangle(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE, 0x172033, 0.18)
      .setOrigin(0)
      .setDepth(45)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.leaves = this.add.particles(0, 0, 'leaf-particle', {
      x: { min: 0, max: WORLD_WIDTH * TILE_SIZE },
      y: { min: 0, max: WORLD_HEIGHT * TILE_SIZE },
      lifespan: 9000,
      speedX: { min: -8, max: 16 },
      speedY: { min: 6, max: 18 },
      quantity: 1,
      frequency: 550,
      alpha: { start: 0.45, end: 0 },
    }).setDepth(60);

    this.waterOverlay = this.add.tileSprite(18 * TILE_SIZE, 43 * TILE_SIZE, 22 * TILE_SIZE, 14 * TILE_SIZE, 'interact-glow')
      .setTint(0x68d7ff)
      .setAlpha(0.08)
      .setDepth(3)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  createHud() {
    this.dialogue = this.add.container(12, 218).setScrollFactor(0).setDepth(100).setAlpha(0);
    const box = this.add.rectangle(0, 0, 488, 58, 0x182033, 0.92).setOrigin(0).setStrokeStyle(1, 0xf3d891, 0.9);
    this.dialogueText = this.add.text(14, 12, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#f8efd0',
      wordWrap: { width: 458 },
    });
    this.dialogue.add([box, this.dialogueText]);

    this.prompt = this.add.text(256, 250, 'E / Espacio: interactuar', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff3ba',
      backgroundColor: '#192033cc',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.cameraBadge = this.add.text(12, 12, 'Mapa abierto · cámara 45° · WASD/Flechas para caminar', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#f8efd0',
      backgroundColor: '#141b2dcc',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(101);

    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(90);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE');
  }

  update(time, delta) {
    this.player.update(this.cursors, this.keys, this.worldCamera?.rotation ?? 0);
    this.player.setRotation(-(this.worldCamera?.rotation ?? 0));
    this.player.setDepth(this.player.y);
    this.updateAmbientAnimations(time);
    this.updateNearestInteraction();
    this.drawMinimap();
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.tryInteract();
  }

  updateAmbientAnimations(time) {
    this.waterOverlay.tilePositionX = time * 0.012;
    this.waterOverlay.tilePositionY = Math.sin(time / 700) * 4;
    this.detailLayer.forEachTile((tile) => {
      if (tile.index === TILES.flowers && (tile.x + tile.y + Math.floor(time / 550)) % 8 === 0) tile.alpha = 0.72;
      else if (tile.index === TILES.flowers) tile.alpha = 1;
    });
  }

  updateNearestInteraction() {
    let nearest = null;
    let nearestDistance = Infinity;
    this.interactables.forEach((item) => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x * TILE_SIZE, item.y * TILE_SIZE);
      item.marker.setAlpha(distance < 38 ? 0.38 + Math.sin(this.time.now / 180) * 0.12 : 0);
      if (distance < 34 && distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    });
    this.nearestInteraction = nearest;
    this.prompt.setAlpha(nearest ? 1 : 0);
  }

  tryInteract() {
    const item = this.nearestInteraction;
    if (!item) return;
    if (item.type === 'door') {
      this.cameras.main.fadeOut(320, 12, 18, 28);
      this.time.delayedCall(330, () => this.scene.start('InteriorScene', { interior: item.target, returnTo: { x: item.x, y: item.y + 1.5 } }));
      return;
    }
    if (item.type === 'discovery') SaveManager.rememberDiscovery(item.id);
    this.showDialogue(item.text);
  }

  showDialogue(text) {
    this.dialogueText.setText(text);
    this.tweens.killTweensOf(this.dialogue);
    this.dialogue.setAlpha(1);
    this.time.delayedCall(3200, () => this.tweens.add({ targets: this.dialogue, alpha: 0, duration: 450 }));
  }

  drawMinimap() {
    const g = this.minimap.clear();
    const x = 420;
    const y = 12;
    g.fillStyle(0x121826, 0.72).fillRoundedRect(x - 4, y - 4, 80, 60, 5);
    g.fillStyle(0x4e9f50, 0.88).fillRect(x, y, 70, 50);
    g.fillStyle(0x2f80c8, 0.95).fillEllipse(x + 14, y + 34, 20, 12);
    g.fillStyle(0xb68a56, 0.95).fillRect(x + 32, y + 20, 22, 3);
    g.fillStyle(0xefd36d, 1).fillCircle(x + (this.player.x / (WORLD_WIDTH * TILE_SIZE)) * 70, y + (this.player.y / (WORLD_HEIGHT * TILE_SIZE)) * 50, 2);
  }
}
