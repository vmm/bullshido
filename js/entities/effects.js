/**
 * Effects System
 * Screen shake, hit-stop, particles, and floating text.
 */

export class Effects {
  constructor() {
    /** @type {Particle[]} */
    this.particles = [];
    /** @type {FloatingText[]} */
    this.floatingTexts = [];
    /** Hit-stop state */
    this.hitStopTimer = 0;
  }

  /** @returns {boolean} True if currently in hit-stop (freeze frame) */
  get isHitStopped() {
    return this.hitStopTimer > 0;
  }

  /**
   * Trigger a hit-stop (brief freeze frame).
   * @param {number} duration - Seconds to freeze
   */
  hitStop(duration) {
    this.hitStopTimer = duration;
  }

  /**
   * Spawn impact particles.
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {object} [opts]
   */
  spawnImpact(x, y, opts = {}) {
    const {
      count = 12,
      color = '#ffdd44',
      speed = 300,
      size = 4,
      life = 0.5
    } = opts;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 100,
        size: size * (0.5 + Math.random()),
        color,
        life,
        maxLife: life,
        gravity: 400
      });
    }
  }

  /**
   * Spawn a dust cloud at the feet.
   * @param {number} x
   * @param {number} y
   */
  spawnDust(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 80,
        vy: -(Math.random() * 60 + 20),
        size: 3 + Math.random() * 4,
        color: 'rgba(200,180,150,0.7)',
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.6,
        gravity: 30
      });
    }
  }

  /**
   * Spawn a shockwave ring effect.
   * @param {number} x
   * @param {number} y
   */
  spawnShockwave(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * 500,
        vy: Math.sin(angle) * 200 - 50,
        size: 3,
        color: '#88ccff',
        life: 0.3,
        maxLife: 0.3,
        gravity: 0
      });
    }
  }

  /**
   * Show floating text (move names like "THE FLICK!").
   * @param {string} text
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {object} [opts]
   */
  showText(text, x, y, opts = {}) {
    const { color = '#ffdd44', duration = 1.5, size = 12 } = opts;
    this.floatingTexts.push({
      text, x, y,
      vy: -40,
      life: duration,
      maxLife: duration,
      color,
      size
    });
  }

  /**
   * Update all effects.
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Hit-stop countdown
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  /**
   * Render all particles and floating text.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./camera.js').Camera} camera
   */
  render(ctx, camera) {
    // Particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sx = p.x - camera.effectiveX;
      const sy = p.y - camera.effectiveY;
      ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Floating texts
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `${ft.size}px "Press Start 2P"`;
      ctx.textAlign = 'center';
      const sx = ft.x - camera.effectiveX;
      const sy = ft.y - camera.effectiveY;

      // Text shadow for readability
      ctx.fillStyle = '#000';
      ctx.fillText(ft.text, sx + 2, sy + 2);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}
