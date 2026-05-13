const MAX_SPEED = 96;
const ACCELERATION = 720;
const DRAG = 760;

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(11, 8).setOffset(4, 17);
    this.setDepth(20);
    this.facing = 'down';
  }

  update(cursors, keys) {
    const input = new Phaser.Math.Vector2(0, 0);
    const left = keys.A ?? keys.a;
    const right = keys.D ?? keys.d;
    const up = keys.W ?? keys.w;
    const down = keys.S ?? keys.s;

    if (cursors.left.isDown || left.isDown) input.x -= 1;
    if (cursors.right.isDown || right.isDown) input.x += 1;
    if (cursors.up.isDown || up.isDown) input.y -= 1;
    if (cursors.down.isDown || down.isDown) input.y += 1;

    if (input.lengthSq() > 0) {
      input.normalize();
      this.body.setAcceleration(input.x * ACCELERATION, input.y * ACCELERATION);
      this.body.setMaxVelocity(MAX_SPEED);
      this.updateFacing(input);
      this.play(`walk-${this.facing}`, true);
    } else {
      this.body.setAcceleration(0, 0);
      this.body.setDrag(DRAG, DRAG);
      this.play(`idle-${this.facing}`, true);
    }
  }

  updateFacing(input) {
    if (Math.abs(input.x) > Math.abs(input.y)) this.facing = input.x > 0 ? 'right' : 'left';
    else this.facing = input.y > 0 ? 'down' : 'up';
  }
}
