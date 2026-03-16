/**
 * Stage Base + Dojo Stage
 * Defines background rendering and enemy wave spawning.
 */
import { GROUND_Y } from '../engine/physics.js';
import { Enemy } from '../entities/enemy.js';

export class Stage {
  /**
   * @param {object} config
   * @param {string} config.name
   * @param {number} config.width - Total stage width in pixels
   * @param {object[]} config.waves - Enemy wave definitions
   */
  constructor(config) {
    this.name = config.name;
    this.width = config.width;
    this.waves = config.waves;
    this.currentWaveIndex = 0;
    this.waveActive = false;
    this.waveEnemies = [];
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.completed = false;
  }

  /**
   * Check and spawn enemy waves based on player position.
   * @param {import('../entities/player.js').Player} player
   * @param {Enemy[]} enemies - Active enemies array to push to
   * @param {number} dt
   */
  updateWaves(player, enemies, dt) {
    if (this.completed) return;

    // Check if we should trigger the next wave
    if (this.currentWaveIndex < this.waves.length) {
      const wave = this.waves[this.currentWaveIndex];

      if (player.x >= wave.triggerX && !wave.triggered) {
        wave.triggered = true;
        this.waveActive = true;

        // Queue up enemies to spawn with staggered timing
        for (let i = 0; i < wave.count; i++) {
          this.spawnQueue.push({
            delay: i * (wave.spawnInterval || 0.8),
            x: player.x + 500 + Math.random() * 200,
            type: wave.enemyType
          });
        }
        this.currentWaveIndex++;
      }
    }

    // Process spawn queue
    for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
      this.spawnQueue[i].delay -= dt;
      if (this.spawnQueue[i].delay <= 0) {
        const spawn = this.spawnQueue.splice(i, 1)[0];
        const enemy = new Enemy(spawn.x, GROUND_Y - 56, spawn.type);
        enemies.push(enemy);
      }
    }

    // Check if all waves are done
    if (
      this.currentWaveIndex >= this.waves.length &&
      this.spawnQueue.length === 0 &&
      enemies.every(e => e.state === 'DEAD' || e.state === 'RAGDOLL')
    ) {
      this.completed = true;
    }
  }

  /**
   * Render the stage background.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('../engine/camera.js').Camera} camera
   */
  render(ctx, camera) {
    // Override in subclass
  }
}


/**
 * The Dojo — First Stage
 * Traditional dojo with wooden floor, hanging scrolls, window with sunset.
 */
export class DojoStage extends Stage {
  constructor() {
    super({
      name: 'The Dojo',
      width: 3000,
      waves: [
        { triggerX: 200, count: 2, enemyType: 'TIMID_STUDENT', spawnInterval: 1.0 },
        { triggerX: 600, count: 3, enemyType: 'TIMID_STUDENT', spawnInterval: 0.8 },
        { triggerX: 1000, count: 2, enemyType: 'OVERCONFIDENT_BLACKBELT', spawnInterval: 0.6 },
        { triggerX: 1400, count: 4, enemyType: 'ANGRY_YOUTUBER', spawnInterval: 0.7 },
        { triggerX: 1800, count: 3, enemyType: 'OVERCONFIDENT_BLACKBELT', spawnInterval: 0.5 },
        { triggerX: 2200, count: 5, enemyType: 'ANGRY_YOUTUBER', spawnInterval: 0.5 },
        { triggerX: 2600, count: 1, enemyType: 'STRIP_MALL_SENSEI', spawnInterval: 0 }
      ]
    });
  }

  render(ctx, camera) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // === Sky / back wall ===
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.5, '#2a1a3e');
    grad.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // === Back wall (slow parallax) ===
    const wallOffset = -(camera.effectiveX * 0.2) % 200;
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(0, 0, w, GROUND_Y);

    // Wall panels
    ctx.strokeStyle = '#3a2a2a';
    ctx.lineWidth = 2;
    for (let x = wallOffset; x < w; x += 200) {
      ctx.strokeRect(x + 10, 20, 180, GROUND_Y - 40);
    }

    // Hanging scrolls (decorative)
    const scrollOffset = -(camera.effectiveX * 0.3);
    for (let i = 0; i < 6; i++) {
      const scrollX = 250 * i + scrollOffset % (250 * 6);
      const adjustedX = ((scrollX % w) + w) % w;

      // Scroll
      ctx.fillStyle = '#f5e6c8';
      ctx.fillRect(adjustedX, 30, 30, 80);
      // Scroll rod
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(adjustedX - 3, 28, 36, 4);
      ctx.fillRect(adjustedX - 3, 108, 36, 4);

      // Kanji-like marks
      ctx.fillStyle = '#2a1a1a';
      ctx.fillRect(adjustedX + 10, 45, 10, 3);
      ctx.fillRect(adjustedX + 8, 55, 14, 3);
      ctx.fillRect(adjustedX + 12, 65, 8, 3);
      ctx.fillRect(adjustedX + 10, 75, 10, 3);
    }

    // Windows with sunset glow
    const windowOffset = -(camera.effectiveX * 0.15);
    for (let i = 0; i < 4; i++) {
      const winX = 400 * i + 100 + windowOffset % (400 * 4);
      const adjustedWinX = ((winX % w) + w) % w;

      // Window frame
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(adjustedWinX, 50, 60, 80);
      // Window light (sunset gradient)
      const winGrad = ctx.createLinearGradient(adjustedWinX, 52, adjustedWinX, 128);
      winGrad.addColorStop(0, '#ff8844');
      winGrad.addColorStop(0.5, '#ffaa66');
      winGrad.addColorStop(1, '#cc6633');
      ctx.fillStyle = winGrad;
      ctx.fillRect(adjustedWinX + 4, 54, 52, 72);
      // Window cross
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(adjustedWinX + 28, 54, 4, 72);
      ctx.fillRect(adjustedWinX + 4, 88, 52, 4);
    }

    // === Floor ===
    // Main floor
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);

    // Floor boards (with parallax)
    const floorOffset = -(camera.effectiveX * 1.0) % 80;
    ctx.strokeStyle = '#4a2a0a';
    ctx.lineWidth = 1;
    for (let x = floorOffset - 80; x < w + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Floor highlight line
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(0, GROUND_Y, w, 2);

    // Floor shine
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, GROUND_Y + 2, w, 15);
  }
}
