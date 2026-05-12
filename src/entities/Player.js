const MAX_SPEED = 96;
const ACCELERATION = 720;
const DRAG = 760;

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 1);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(10, 8).setOffset(3, 15);
    this.setDepth(20);
    this.facing = 'down';
  }

  update(cursors, keys) {
    const input = new Phaser.Math.Vector2(0, 0);
    if (cursors.left.isDown || keys.a.isDown) input.x -= 1;
    if (cursors.right.isDown || keys.d.isDown) input.x += 1;
    if (cursors.up.isDown || keys.w.isDown) input.y -= 1;
    if (cursors.down.isDown || keys.s.isDown) input.y += 1;

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
