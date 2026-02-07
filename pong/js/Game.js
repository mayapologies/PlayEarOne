class Game {
  constructor() {
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;

    this.score1 = 0;
    this.score2 = 0;
    this.winner = '';
    this.gameState = 'waiting'; // waiting, playing, paused, gameover

    this.ball = new Ball(
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      BALL_SIZE,
      BALL_SPEED
    );

    this.leftPaddle = new Paddle(
      10,
      (this.canvasHeight - PADDLE_HEIGHT) / 2,
      PADDLE_WIDTH,
      PADDLE_HEIGHT,
      PADDLE_SPEED,
      'w',
      's'
    );

    this.rightPaddle = new Paddle(
      this.canvasWidth - 10 - PADDLE_WIDTH,
      (this.canvasHeight - PADDLE_HEIGHT) / 2,
      PADDLE_WIDTH,
      PADDLE_HEIGHT,
      PADDLE_SPEED,
      'ArrowUp',
      'ArrowDown'
    );

    initInput();
    this.spaceHandled = false;
  }

  handleInput() {
    if (keys[' ']) {
      if (this.spaceHandled) return;
      this.spaceHandled = true;

      if (this.gameState === 'waiting') {
        this.ball.reset(this.canvasWidth, this.canvasHeight);
        this.gameState = 'playing';
      } else if (this.gameState === 'playing') {
        this.gameState = 'paused';
      } else if (this.gameState === 'paused') {
        this.gameState = 'playing';
      } else if (this.gameState === 'gameover') {
        this.reset();
      }
    } else {
      this.spaceHandled = false;
    }
  }

  checkCollisions() {
    const ball = this.ball;

    // Ball-wall collisions (top and bottom)
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.reverseY();
      // Sound: wall bounce
    }
    if (ball.y + ball.radius >= this.canvasHeight) {
      ball.y = this.canvasHeight - ball.radius;
      ball.reverseY();
      // Sound: wall bounce
    }

    // Ball-left paddle collision
    const lp = this.leftPaddle;
    if (
      ball.dx < 0 &&
      ball.x - ball.radius <= lp.x + lp.width &&
      ball.x + ball.radius >= lp.x &&
      ball.y + ball.radius >= lp.y &&
      ball.y - ball.radius <= lp.y + lp.height
    ) {
      ball.x = lp.x + lp.width + ball.radius;
      ball.reverseX();
      ball.increaseDifficulty();
      // Sound: paddle hit
    }

    // Ball-right paddle collision
    const rp = this.rightPaddle;
    if (
      ball.dx > 0 &&
      ball.x + ball.radius >= rp.x &&
      ball.x - ball.radius <= rp.x + rp.width &&
      ball.y + ball.radius >= rp.y &&
      ball.y - ball.radius <= rp.y + rp.height
    ) {
      ball.x = rp.x - ball.radius;
      ball.reverseX();
      ball.increaseDifficulty();
      // Sound: paddle hit
    }
  }

  handleScoring() {
    if (this.ball.x - this.ball.radius < 0) {
      this.score2++;
      // Sound: score
      if (this.score2 >= WINNING_SCORE) {
        this.winner = 'Player 2';
        this.gameState = 'gameover';
        return;
      }
      this.ball.reset(this.canvasWidth, this.canvasHeight);
      return;
    }
    if (this.ball.x + this.ball.radius > this.canvasWidth) {
      this.score1++;
      // Sound: score
      if (this.score1 >= WINNING_SCORE) {
        this.winner = 'Player 1';
        this.gameState = 'gameover';
        return;
      }
      this.ball.reset(this.canvasWidth, this.canvasHeight);
    }
  }

  update() {
    this.handleInput();

    if (this.gameState !== 'playing') return;

    this.leftPaddle.update(keys, this.canvasHeight);
    this.rightPaddle.update(keys, this.canvasHeight);
    this.ball.update();
    this.checkCollisions();
    this.handleScoring();
  }

  reset() {
    this.score1 = 0;
    this.score2 = 0;
    this.winner = '';
    this.ball.reset(this.canvasWidth, this.canvasHeight);
    this.leftPaddle.y = (this.canvasHeight - PADDLE_HEIGHT) / 2;
    this.rightPaddle.y = (this.canvasHeight - PADDLE_HEIGHT) / 2;
    this.gameState = 'waiting';
  }

  gameLoop() {
    this.update();
    render(
      this.ball, this.leftPaddle, this.rightPaddle,
      this.score1, this.score2,
      this.gameState, this.winner
    );
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  start() {
    this.gameLoop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
