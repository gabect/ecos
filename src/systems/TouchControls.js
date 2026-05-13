const TOUCH_UI_DEPTH = 5000;

function hasCoarsePointer() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches;
}

function isSmallViewport() {
  return typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) <= 768;
}

export class TouchControls {
  constructor(scene, { onInteract } = {}) {
    this.scene = scene;
    this.onInteract = onInteract;
    this.vector = new Phaser.Math.Vector2(0, 0);
    this.joystickPointerId = null;
    this.buttonPointerId = null;
    this.joystickRadius = 34;
    this.thumbRadius = 13;
    this.thumbLimit = 25;
    this.buttonRadius = 28;

    this.createControls();
    this.updateVisibility();
    this.updateLayout();
    this.registerEvents();
  }

  get movementVector() {
    return this.vector;
  }

  createControls() {
    this.joystickBase = this.scene.add.circle(0, 0, this.joystickRadius, 0x111827, 0.5)
      .setStrokeStyle(2, 0xf8efd0, 0.45)
      .setScrollFactor(0)
      .setDepth(TOUCH_UI_DEPTH);

    this.joystickThumb = this.scene.add.circle(0, 0, this.thumbRadius, 0xf8efd0, 0.62)
      .setStrokeStyle(2, 0x1f2937, 0.45)
      .setScrollFactor(0)
      .setDepth(TOUCH_UI_DEPTH + 1);

    this.interactButton = this.scene.add.circle(0, 0, this.buttonRadius, 0x192033, 0.62)
      .setStrokeStyle(2, 0xfff3ba, 0.55)
      .setScrollFactor(0)
      .setDepth(TOUCH_UI_DEPTH);

    this.interactLabel = this.scene.add.text(0, 0, 'E', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fff3ba',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(TOUCH_UI_DEPTH + 1);

    this.controls = [this.joystickBase, this.joystickThumb, this.interactButton, this.interactLabel];
  }

  registerEvents() {
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
    this.scene.input.on('pointerupoutside', this.handlePointerUp, this);
    this.scene.scale.on('resize', this.handleResize, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  handleResize() {
    this.updateVisibility();
    this.updateLayout();
  }

  updateVisibility() {
    const supportsTouch = this.scene.sys.game.device.input.touch || hasCoarsePointer();
    this.visible = supportsTouch || isSmallViewport();
    this.controls?.forEach((control) => control.setVisible(this.visible).setAlpha(this.visible ? 1 : 0));
  }

  updateLayout() {
    const { width, height } = this.scene.scale.gameSize;
    this.joystickCenter = new Phaser.Math.Vector2(58, height - 54);
    this.buttonCenter = new Phaser.Math.Vector2(width - 56, height - 54);

    this.joystickBase.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    this.joystickThumb.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    this.interactButton.setPosition(this.buttonCenter.x, this.buttonCenter.y);
    this.interactLabel.setPosition(this.buttonCenter.x, this.buttonCenter.y);
  }

  handlePointerDown(pointer) {
    if (!this.visible) return;
    const point = new Phaser.Math.Vector2(pointer.x, pointer.y);

    if (this.joystickPointerId === null && point.distance(this.joystickCenter) <= this.joystickRadius + 22) {
      this.joystickPointerId = pointer.id;
      this.updateJoystick(point);
      return;
    }

    if (this.buttonPointerId === null && point.distance(this.buttonCenter) <= this.buttonRadius + 10) {
      this.buttonPointerId = pointer.id;
      this.setButtonPressed(true);
      this.onInteract?.();
    }
  }

  handlePointerMove(pointer) {
    if (pointer.id !== this.joystickPointerId) return;
    this.updateJoystick(new Phaser.Math.Vector2(pointer.x, pointer.y));
  }

  handlePointerUp(pointer) {
    if (pointer.id === this.joystickPointerId) this.resetJoystick();
    if (pointer.id === this.buttonPointerId) this.setButtonPressed(false);
  }

  updateJoystick(point) {
    const offset = point.clone().subtract(this.joystickCenter);
    if (offset.length() > this.thumbLimit) offset.setLength(this.thumbLimit);

    this.joystickThumb.setPosition(this.joystickCenter.x + offset.x, this.joystickCenter.y + offset.y);
    this.vector.copy(offset).scale(1 / this.thumbLimit);
  }

  resetJoystick() {
    this.joystickPointerId = null;
    this.vector.set(0, 0);
    this.joystickThumb.setPosition(this.joystickCenter.x, this.joystickCenter.y);
  }

  setButtonPressed(isPressed) {
    this.buttonPointerId = isPressed ? this.buttonPointerId : null;
    this.interactButton.setFillStyle(isPressed ? 0xfff3ba : 0x192033, isPressed ? 0.82 : 0.62);
    this.interactButton.setScale(isPressed ? 0.92 : 1);
    this.interactLabel.setColor(isPressed ? '#192033' : '#fff3ba');
  }

  destroy() {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.input.off('pointerupoutside', this.handlePointerUp, this);
    this.scene.scale.off('resize', this.handleResize, this);
    this.controls?.forEach((control) => control.destroy());
    this.controls = [];
  }
}
