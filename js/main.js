/**
 * Bullshido — Main Entry Point
 * 
 * Initializes the game loop with delta-time and handles canvas scaling.
 */
import { Input } from './engine/input.js';
import { Game, GAME_WIDTH, GAME_HEIGHT } from './engine/game.js';

// ── Canvas Setup ──
const canvas = document.getElementById('game-canvas');
const input = new Input();
const game = new Game(canvas, input);

// ── Responsive Scaling ──
function resizeCanvas() {
  const scaleX = window.innerWidth / GAME_WIDTH;
  const scaleY = window.innerHeight / GAME_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  canvas.style.width = `${Math.floor(GAME_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(GAME_HEIGHT * scale)}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Game Loop ──
let lastTime = 0;
const TARGET_FPS = 60;
const MAX_DT = 1 / 30; // Cap delta to prevent spiral of death

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, MAX_DT);
  lastTime = timestamp;

  // Refresh just-pressed state
  input.update();

  // Update & render
  game.update(dt);
  game.render();

  requestAnimationFrame(gameLoop);
}

// ── Start ──
requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  gameLoop(timestamp);
});
