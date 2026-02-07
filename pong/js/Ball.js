class Ball {
  constructor(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.dx = speed;
    this.dy = speed;
    this.speedMultiplier = 1;
  }

  update() {
    this.x += this.dx * this.speedMultiplier;
    this.y += this.dy * this.speedMultiplier;
  }

  reverseX() {
    this.dx = -this.dx;
  }

  reverseY() {
    this.dy = -this.dy;
  }

  increaseDifficulty() {
    this.speedMultiplier = Math.min(this.speedMultiplier + 0.1, 2.0);
  }

  reset(canvasWidth, canvasHeight) {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.speedMultiplier = 1;

    // Randomize direction
    this.dx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
    this.dy = (Math.random() > 0.5 ? 1 : -1) * this.speed;
  }
}
