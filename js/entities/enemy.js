/**
 * Enemy System
 * Enemies approach the player, then get obliterated by Bullshido techniques.
 */
import { GROUND_Y, applyPhysics, clampToGround } from '../engine/physics.js';

/** Enemy type definitions */
const ENEMY_TYPES = {
  TIMID_STUDENT: {
    name: 'Timid Student',
    speed: 60,
    health: 1,
    width: 40,
    height: 56,
    score: 100,
    colors: {
      gi: '#ffffff',
      belt: '#ffdd44', // Yellow belt
      skin: '#e8c49a',
      hair: '#5a3a1a'
    }
  },
  OVERCONFIDENT_BLACKBELT: {
    name: 'Overconfident Black Belt',
    speed: 90,
    health: 1,
    width: 44,
    height: 60,
    score: 250,
    colors: {
      gi: '#222222',
      belt: '#111111',
      skin: '#d4a574',
      hair: '#1a1a1a'
    }
  },
  ANGRY_YOUTUBER: {
    name: 'Angry YouTuber',
    speed: 70,
    health: 1,
    width: 42,
    height: 58,
    score: 200,
    colors: {
      gi: '#cc3333',
      belt: '#ffffff',
      skin: '#f0c8a0',
      hair: '#8a4a2a'
    }
  },
  STRIP_MALL_SENSEI: {
    name: 'Strip Mall Sensei',
    speed: 50,
    health: 1,
    width: 46,
    height: 62,
    score: 500,
    colors: {
      gi: '#4444aa',
      belt: '#ff4444',
      skin: '#d4a070',
      hair: '#999999'
    }
  }
};

const ENEMY_TYPE_KEYS = Object.keys(ENEMY_TYPES);

export class Enemy {
  /**
   * @param {number} x
   * @param {number} y
   * @param {string} [typeName] - Key from ENEMY_TYPES
   */
  constructor(x, y, typeName) {
    const key = typeName || ENEMY_TYPE_KEYS[Math.floor(Math.random() * ENEMY_TYPE_KEYS.length)];
    const type = ENEMY_TYPES[key];

    this.typeName = key;
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = type.width;
    this.height = type.height;
    this.facing = -1; // Face left (toward player)

    // State: APPROACH, ATTACK_WINDUP, RAGDOLL, DEAD
    this.state = 'APPROACH';
    this.health = type.health;
    this.score = type.score;

    // Ragdoll
    this.angle = 0;
    this.angularVel = 0;

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;

    // Attack
    this.attackWindupTimer = 0;
    this.attackRange = 50;

    // Approach behavior
    this.pauseTimer = 0;
    this.hasPaused = false;

    // Off-screen cleanup
    this.offScreenTimer = 0;
  }

  /**
   * @param {import('./player.js').Player} player
   * @param {number} dt
   */
  update(player, dt) {
    if (this.state === 'APPROACH') {
      // Face the player
      this.facing = player.x > this.x ? 1 : -1;

      const distToPlayer = Math.abs((this.x + this.width / 2) - (player.x + player.width / 2));

      // Occasionally pause nervously before approaching
      if (!this.hasPaused && distToPlayer < 300 && Math.random() < 0.005) {
        this.pauseTimer = 0.5 + Math.random() * 1.0;
        this.hasPaused = true;
      }

      if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
        this.vx = 0;
      } else if (distToPlayer > this.attackRange) {
        // Walk toward player
        this.vx = this.type.speed * this.facing;
      } else {
        // In attack range — wind up
        this.state = 'ATTACK_WINDUP';
        this.attackWindupTimer = 0.6 + Math.random() * 0.4;
        this.vx = 0;
      }

      this.x += this.vx * dt;
      clampToGround(this);

      // Animation
      this.animTimer += dt;
      if (this.animTimer > 0.2) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }

    } else if (this.state === 'ATTACK_WINDUP') {
      this.attackWindupTimer -= dt;
      if (this.attackWindupTimer <= 0) {
        // They never actually get to attack 😂
        // Reset to approach
        this.state = 'APPROACH';
      }

    } else if (this.state === 'RAGDOLL') {
      applyPhysics(this, dt, true);

      // Bounce off floor with energy loss
      const feetY = this.y + this.height;
      if (feetY >= GROUND_Y) {
        this.y = GROUND_Y - this.height;
        this.vy *= -0.4; // Bounce
        this.vx *= 0.7;  // Friction
        this.angularVel *= 0.6;

        // If nearly still, die
        if (Math.abs(this.vy) < 30 && Math.abs(this.vx) < 30) {
          this.state = 'DEAD';
        }
      }
    }

    // Track off-screen time for cleanup
    if (this.state === 'RAGDOLL' || this.state === 'DEAD') {
      this.offScreenTimer += dt;
    }
  }

  /**
   * Check if enemy should be cleaned up.
   * @param {import('../engine/camera.js').Camera} camera
   * @returns {boolean}
   */
  shouldRemove(camera) {
    // Remove if off-screen for too long or way off-screen
    const screenX = this.x - camera.effectiveX;
    if (screenX < -300 || screenX > camera.viewWidth + 600) {
      return true;
    }
    if (this.state === 'DEAD' && this.offScreenTimer > 2) {
      return true;
    }
    return false;
  }

  /**
   * Apply a Bullshido move hit to this enemy.
   * @param {object} move - Move definition from MOVES
   * @param {number} facing - Direction the player is facing
   */
  takeHit(move, facing) {
    this.state = 'RAGDOLL';
    this.health = 0;
    this.vx = move.launchVX * facing;
    this.vy = move.launchVY;
    this.angularVel = move.spin * facing;
    this.angle = 0;
  }

  /**
   * Render enemy with procedural pixel art.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('../engine/camera.js').Camera} camera
   */
  render(ctx, camera) {
    const sx = Math.round(this.x - camera.effectiveX);
    const sy = Math.round(this.y - camera.effectiveY);

    ctx.save();

    if (this.state === 'RAGDOLL') {
      // Rotate around center for ragdoll
      ctx.translate(sx + this.width / 2, sy + this.height / 2);
      ctx.rotate(this.angle);
      ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      if (this.facing === -1) {
        ctx.translate(sx + this.width, sy);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(sx, sy);
      }
    }

    const c = this.type.colors;
    const bobY = this.state === 'APPROACH' ? Math.sin(this.animFrame * Math.PI) * 1.5 : 0;

    // Shadow (only when grounded)
    if (this.state !== 'RAGDOLL') {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(this.width / 2, this.height, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs
    ctx.fillStyle = c.gi;
    ctx.fillRect(10, 38 + bobY, 7, 16);
    ctx.fillRect(23, 38 + bobY, 7, 16);

    // Shoes
    ctx.fillStyle = '#333';
    ctx.fillRect(9, 51 + bobY, 9, 4);
    ctx.fillRect(22, 51 + bobY, 9, 4);

    // Body
    ctx.fillStyle = c.gi;
    ctx.fillRect(10, 16 + bobY, 20, 24);

    // Belt
    ctx.fillStyle = c.belt;
    ctx.fillRect(10, 34 + bobY, 20, 3);

    // Arms
    const armY = this.state === 'ATTACK_WINDUP' ? -4 : 0;
    ctx.fillStyle = c.gi;
    ctx.fillRect(30, 18 + bobY + armY, 5, 12);
    ctx.fillRect(5, 18 + bobY, 5, 12);
    // Hands
    ctx.fillStyle = c.skin;
    ctx.fillRect(30, 28 + bobY + armY, 5, 4);
    ctx.fillRect(5, 28 + bobY, 5, 4);

    // Fists raised during windup
    if (this.state === 'ATTACK_WINDUP') {
      ctx.fillStyle = c.skin;
      ctx.fillRect(30, 14 + bobY, 6, 6);
    }

    // Head
    ctx.fillStyle = c.skin;
    ctx.fillRect(12, 2 + bobY, 16, 14);

    // Hair
    ctx.fillStyle = c.hair;
    ctx.fillRect(12, 1 + bobY, 16, 4);

    // Eyes
    if (this.state === 'RAGDOLL') {
      // X eyes when hit
      ctx.fillStyle = '#111';
      ctx.fillRect(16, 8, 2, 2);
      ctx.fillRect(18, 6, 2, 2);
      ctx.fillRect(16, 6, 2, 2);
      ctx.fillRect(18, 8, 2, 2);

      ctx.fillRect(24, 8, 2, 2);
      ctx.fillRect(26, 6, 2, 2);
      ctx.fillRect(24, 6, 2, 2);
      ctx.fillRect(26, 8, 2, 2);

      // Open mouth (shock)
      ctx.fillRect(19, 12, 4, 3);
    } else if (this.state === 'ATTACK_WINDUP') {
      // Angry eyes
      ctx.fillStyle = '#111';
      ctx.fillRect(16, 7 + bobY, 3, 4);
      ctx.fillRect(24, 7 + bobY, 3, 4);
      // Angry brows
      ctx.fillRect(15, 5 + bobY, 5, 2);
      ctx.fillRect(23, 5 + bobY, 5, 2);
      // Gritting teeth
      ctx.fillStyle = '#fff';
      ctx.fillRect(18, 12 + bobY, 6, 2);
    } else {
      // Normal worried eyes
      ctx.fillStyle = '#111';
      ctx.fillRect(16, 7 + bobY, 3, 3);
      ctx.fillRect(24, 7 + bobY, 3, 3);
      // Nervous mouth
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(19, 12 + bobY, 4, 2);
    }

    ctx.restore();
  }
}

/**
 * Create a random enemy at a position.
 * @param {number} x
 * @param {number} y
 * @returns {Enemy}
 */
export function spawnRandomEnemy(x, y) {
  return new Enemy(x, y);
}
