class Paddle {
  constructor(x, y, width, height, speed, upKey, downKey) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.upKey = upKey;
    this.downKey = downKey;
  }

  update(keys, canvasHeight) {
    if (keys[this.upKey]) {
      this.y -= this.speed;
    }
    if (keys[this.downKey]) {
      this.y += this.speed;
    }

    // Clamp within canvas bounds
    if (this.y < 0) {
      this.y = 0;
    }
    if (this.y + this.height > canvasHeight) {
      this.y = canvasHeight - this.height;
    }
  }
}
