/**
 * Player Character — The Bullshido Grandmaster
 * 
 * States: IDLE, WALK, ATTACK
 * Moves: Flick, Ki Shout, No-Touch KO, Slow-Mo Palm, Lazy Sweep, Toe Poke
 */
import { GROUND_Y, clampToGround } from '../engine/physics.js';

/** Move definitions with their properties */
export const MOVES = {
  FLICK: {
    name: 'THE FLICK',
    key: 'KeyZ',
    duration: 0.4,
    range: 80,
    launchVX: 1200,
    launchVY: -300,
    spin: 15,
    shakeIntensity: 6,
    shakeDuration: 0.15,
    hitStopDuration: 0.08,
    particleColor: '#ffdd44',
    description: 'A single finger. Devastating.'
  },
  KI_SHOUT: {
    name: 'KI SHOUT',
    key: 'KeyX',
    duration: 0.5,
    range: 200,
    launchVX: 800,
    launchVY: -400,
    spin: 10,
    shakeIntensity: 10,
    shakeDuration: 0.25,
    hitStopDuration: 0.12,
    particleColor: '#88ccff',
    description: 'The voice of a true master.'
  },
  NO_TOUCH: {
    name: 'NO-TOUCH KO',
    key: 'KeyC',
    duration: 0.6,
    range: 150,
    launchVX: 200,
    launchVY: -600,
    spin: 20,
    shakeIntensity: 4,
    shakeDuration: 0.1,
    hitStopDuration: 0.15,
    particleColor: '#ff88ff',
    description: 'They fall... without being touched.'
  },
  SLOW_MO_PALM: {
    name: 'SLOW-MO PALM',
    key: 'KeyV',
    duration: 0.7,
    range: 90,
    launchVX: 600,
    launchVY: -500,
    spin: 25,
    shakeIntensity: 8,
    shakeDuration: 0.3,
    hitStopDuration: 0.2,
    particleColor: '#44ff88',
    description: 'Gentle. Devastating. Beautiful.',
    isLeg: false
  },
  LAZY_SWEEP: {
    name: 'LAZY SWEEP',
    key: 'KeyB',
    duration: 0.8,
    range: 110,
    launchVX: 900,
    launchVY: -150,
    spin: 30,
    shakeIntensity: 5,
    shakeDuration: 0.15,
    hitStopDuration: 0.1,
    particleColor: '#ff9944',
    description: 'Barely moved his foot. Tragic.',
    isLeg: true
  },
  TOE_POKE: {
    name: 'TOE POKE OF DOOM',
    key: 'KeyN',
    duration: 0.5,
    range: 70,
    launchVX: 300,
    launchVY: -900,
    spin: 35,
    shakeIntensity: 7,
    shakeDuration: 0.2,
    hitStopDuration: 0.15,
    particleColor: '#ff5577',
    description: 'One toe. Straight to orbit.',
    isLeg: true
  }
};

const WALK_SPEED = 200;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 64;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.facing = 1; // 1 = right, -1 = left

    // State
    this.state = 'IDLE'; // IDLE, WALK, ATTACK
    this.attackTimer = 0;
    this.currentMove = null;

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;

    // Health (mostly cosmetic — grandmaster is nearly invincible)
    this.health = 100;
    this.maxHealth = 100;

    // Score
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;

    // Colors for procedural rendering
    this.colors = {
      gi: '#f0f0ff',        // White gi
      belt: '#1a1a1a',      // Black belt (of course)
      skin: '#e8b87a',
      hair: '#2a2a2a',
      headband: '#cc3333'   // Red headband
    };
  }

  /**
   * Update player state.
   * @param {import('../engine/input.js').Input} input
   * @param {number} dt
   * @returns {object|null} Attack info if attack was just triggered
   */
  update(input, dt) {
    let attackTriggered = null;

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Handle attack state
    if (this.state === 'ATTACK') {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = 'IDLE';
        this.currentMove = null;
      }
      this.vx = 0;
      return null;
    }

    // Check for attack inputs
    for (const move of Object.values(MOVES)) {
      if (input.justPressed(move.key)) {
        this.state = 'ATTACK';
        this.attackTimer = move.duration;
        this.currentMove = move;
        this.animFrame = 0;
        this.vx = 0;

        attackTriggered = {
          move,
          x: this.x + (this.facing === 1 ? this.width : 0),
          y: this.y + this.height * 0.4,
          facing: this.facing
        };
        return attackTriggered;
      }
    }

    // Movement
    this.vx = 0;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
      this.vx = WALK_SPEED;
      this.facing = 1;
      this.state = 'WALK';
    } else if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
      this.vx = -WALK_SPEED;
      this.facing = -1;
      this.state = 'WALK';
    } else {
      this.state = 'IDLE';
    }

    // Apply movement
    this.x += this.vx * dt;

    // Clamp to ground
    clampToGround(this);

    // Animation
    this.animTimer += dt;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    return attackTriggered;
  }

  /**
   * Render the player using procedural drawing (no sprites needed).
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('../engine/camera.js').Camera} camera
   */
  render(ctx, camera) {
    const sx = Math.round(this.x - camera.effectiveX);
    const sy = Math.round(this.y - camera.effectiveY);

    ctx.save();

    // Flip if facing left
    if (this.facing === -1) {
      ctx.translate(sx + this.width, sy);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(sx, sy);
    }

    const bobY = this.state === 'WALK' ? Math.sin(this.animFrame * Math.PI) * 2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    const legOffset = this.state === 'WALK' ? Math.sin(this.animFrame * Math.PI) * 6 : 0;
    const isLegAttack = this.state === 'ATTACK' && this.currentMove && this.currentMove.isLeg;

    if (isLegAttack) {
      // Standing leg
      ctx.fillStyle = this.colors.gi;
      ctx.fillRect(14, 44 + bobY, 8, 18);
      ctx.fillStyle = '#333';
      ctx.fillRect(12, 58 + bobY, 10, 5);

      // Kicking leg — lazily extended
      const kickProgress = 1 - (this.attackTimer / this.currentMove.duration);
      const kickAngle = Math.sin(kickProgress * Math.PI) * 0.8;
      ctx.save();
      ctx.translate(30, 48 + bobY);
      ctx.rotate(kickAngle);
      ctx.fillStyle = this.colors.gi;
      ctx.fillRect(0, -4, 8, 18);
      // Shoe / foot
      ctx.fillStyle = this.currentMove === MOVES.TOE_POKE ? this.colors.skin : '#333';
      if (this.currentMove === MOVES.TOE_POKE) {
        // Bare toe sticking out (sandal off)
        ctx.fillStyle = '#996633';
        ctx.fillRect(6, 12, 10, 4); // sandal
        ctx.fillStyle = this.colors.skin;
        ctx.fillRect(16, 12, 5, 3); // big toe of doom
      } else {
        // Lazy sweep shoe barely off ground
        ctx.fillRect(6, 12, 12, 5);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = this.colors.gi;
      ctx.fillRect(14, 44 + bobY, 8, 18);  // Left leg
      ctx.fillRect(26, 44 + bobY, 8, 18);  // Right leg

      // Shoes
      ctx.fillStyle = '#333';
      ctx.fillRect(12, 58 + bobY + (legOffset > 0 ? -2 : 0), 10, 5);
      ctx.fillRect(26, 58 + bobY + (legOffset <= 0 ? -2 : 0), 10, 5);
    }

    // Body (gi)
    ctx.fillStyle = this.colors.gi;
    ctx.fillRect(12, 20 + bobY, 24, 26);

    // Gi opening (V-neck)
    ctx.fillStyle = this.colors.skin;
    ctx.beginPath();
    ctx.moveTo(18, 20 + bobY);
    ctx.lineTo(24, 30 + bobY);
    ctx.lineTo(30, 20 + bobY);
    ctx.fill();

    // Belt
    ctx.fillStyle = this.colors.belt;
    ctx.fillRect(12, 40 + bobY, 24, 4);
    // Belt knot
    ctx.fillRect(22, 40 + bobY, 6, 7);

    // Arms
    if (this.state === 'ATTACK' && this.currentMove && !this.currentMove.isLeg) {
      // Attack pose — arm extended
      ctx.fillStyle = this.colors.gi;
      ctx.fillRect(36, 24 + bobY, 16, 8); // Extended arm
      // Hand
      ctx.fillStyle = this.colors.skin;
      if (this.currentMove === MOVES.FLICK) {
        // Flicking finger
        ctx.fillRect(52, 24 + bobY, 3, 8);
        ctx.fillRect(55, 26 + bobY, 6, 3); // Extended finger
      } else if (this.currentMove === MOVES.SLOW_MO_PALM) {
        // Open palm
        ctx.fillRect(52, 22 + bobY, 8, 12);
      } else {
        // Fist / open hand
        ctx.fillRect(52, 24 + bobY, 6, 8);
      }

      // Back arm (tucked)
      ctx.fillStyle = this.colors.gi;
      ctx.fillRect(6, 26 + bobY, 6, 10);
    } else if (this.state === 'ATTACK' && this.currentMove && this.currentMove.isLeg) {
      // Leg attacks — arms crossed or on hips (too lazy to use hands)
      ctx.fillStyle = this.colors.gi;
      // Arms crossed over chest
      ctx.fillRect(14, 24 + bobY, 20, 6);
      ctx.fillRect(12, 22 + bobY, 6, 12);
      ctx.fillRect(30, 22 + bobY, 6, 12);
      // Hands tucked
      ctx.fillStyle = this.colors.skin;
      ctx.fillRect(12, 24 + bobY, 5, 4);
      ctx.fillRect(31, 24 + bobY, 5, 4);
    } else {
      // Normal arms
      const armSwing = this.state === 'WALK' ? Math.sin(this.animFrame * Math.PI) * 4 : 0;
      ctx.fillStyle = this.colors.gi;
      ctx.fillRect(34, 22 + bobY + armSwing, 6, 14);  // Right arm
      ctx.fillRect(8, 22 + bobY - armSwing, 6, 14);   // Left arm
      // Hands
      ctx.fillStyle = this.colors.skin;
      ctx.fillRect(34, 34 + bobY + armSwing, 6, 5);
      ctx.fillRect(8, 34 + bobY - armSwing, 6, 5);
    }

    // Head
    ctx.fillStyle = this.colors.skin;
    ctx.fillRect(14, 2 + bobY, 20, 18);

    // Hair
    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(14, 1 + bobY, 20, 5);
    ctx.fillRect(14, 1 + bobY, 3, 10); // Sideburn

    // Headband
    ctx.fillStyle = this.colors.headband;
    ctx.fillRect(13, 6 + bobY, 23, 3);
    // Headband tail
    ctx.fillRect(13, 6 + bobY, 2, 8);

    // Eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(19, 10 + bobY, 3, 3);
    ctx.fillRect(27, 10 + bobY, 3, 3);
    // Eye gleam
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, 10 + bobY, 1, 1);
    ctx.fillRect(28, 10 + bobY, 1, 1);

    // Stern mouth
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(21, 15 + bobY, 6, 2);

    // Mustache (the grandmaster must have one)
    ctx.fillStyle = this.colors.hair;
    ctx.fillRect(19, 13 + bobY, 10, 2);

    ctx.restore();

    // Ki aura effect during attack
    if (this.state === 'ATTACK') {
      const attackProgress = 1 - (this.attackTimer / this.currentMove.duration);
      const auraAlpha = Math.sin(attackProgress * Math.PI) * 0.3;
      ctx.save();
      ctx.globalAlpha = auraAlpha;
      ctx.strokeStyle = this.currentMove.particleColor;
      ctx.lineWidth = 2;
      const auraSx = this.x + this.width / 2 - camera.effectiveX;
      const auraSy = this.y + this.height / 2 - camera.effectiveY;
      const auraRadius = 30 + Math.sin(attackProgress * Math.PI * 4) * 10;
      ctx.beginPath();
      ctx.arc(auraSx, auraSy, auraRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
