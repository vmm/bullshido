/**
 * Game State Machine
 * Manages game states: MENU → PLAYING → STAGE_COMPLETE → GAME_OVER
 */
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { Effects } from '../entities/effects.js';
import { Player, MOVES } from '../entities/player.js';
import { GROUND_Y, checkCollision, launchEntity } from './physics.js';
import { DojoStage } from '../stages/stage.js';

/** Canvas resolution (internal, scaled to fit screen) */
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 400;

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./input.js').Input} input
   */
  constructor(canvas, input) {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    this.canvas = canvas;
    this.input = input;
    this.renderer = new Renderer(canvas);
    this.camera = new Camera(GAME_WIDTH, GAME_HEIGHT);
    this.effects = new Effects();
    this.ctx = this.renderer.ctx;

    // State
    this.state = 'MENU';
    this.stateTimer = 0;

    // Entities
    this.player = null;
    this.enemies = [];
    this.stage = null;

    // Menu animation
    this.menuTimer = 0;
    this.titleFlash = 0;
  }

  /** Start a new game */
  startGame() {
    this.state = 'PLAYING';
    this.player = new Player(100, GROUND_Y - 64);
    this.enemies = [];
    this.stage = new DojoStage();
    this.camera.x = 0;
    this.effects = new Effects();
  }

  /**
   * Main update.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.stateTimer += dt;

    switch (this.state) {
      case 'MENU':
        this._updateMenu(dt);
        break;
      case 'PLAYING':
        this._updatePlaying(dt);
        break;
      case 'STAGE_COMPLETE':
        this._updateStageComplete(dt);
        break;
      case 'GAME_OVER':
        this._updateGameOver(dt);
        break;
    }
  }

  /** Main render. */
  render() {
    this.renderer.clear();

    switch (this.state) {
      case 'MENU':
        this._renderMenu();
        break;
      case 'PLAYING':
        this._renderPlaying();
        break;
      case 'STAGE_COMPLETE':
        this._renderPlaying(); // Keep rendering the stage
        this._renderStageComplete();
        break;
      case 'GAME_OVER':
        this._renderPlaying();
        this._renderGameOver();
        break;
    }
  }

  // ───── MENU ─────

  _updateMenu(dt) {
    this.menuTimer += dt;
    this.titleFlash += dt;

    if (this.input.justPressed('Space') || this.input.justPressed('Enter')) {
      this.startGame();
    }
  }

  _renderMenu() {
    const ctx = this.ctx;
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a1e');
    grad.addColorStop(0.4, '#1a0a2e');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative karate silhouettes in background
    ctx.fillStyle = 'rgba(255,100,50,0.05)';
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 120 + Math.sin(this.menuTimer + i) * 10;
      const y = 200 + Math.cos(this.menuTimer * 0.5 + i * 2) * 20;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title with glow effect
    const titleY = 100 + Math.sin(this.menuTimer * 2) * 5;

    // Title glow
    ctx.save();
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 20 + Math.sin(this.menuTimer * 3) * 10;
    ctx.fillStyle = '#ff4444';
    ctx.font = '32px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('BULLSHIDO', w / 2, titleY);
    ctx.restore();

    // Title text (on top)
    ctx.fillStyle = '#ffddaa';
    ctx.font = '32px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('BULLSHIDO', w / 2, titleY);

    // Subtitle
    ctx.fillStyle = '#cc8844';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('~ The Way of the McDojo ~', w / 2, titleY + 25);

    // Controls info
    const controlsY = 200;
    ctx.fillStyle = '#888';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText('CONTROLS', w / 2, controlsY);

    ctx.fillStyle = '#666';
    ctx.font = '6px "Press Start 2P"';
    const controls = [
      '← →  or  A D  :  MOVE',
      'Z : FLICK    X : KI SHOUT    C : NO-TOUCH',
      'V : PALM    B : LAZY SWEEP  N : TOE POKE'
    ];
    controls.forEach((line, i) => {
      ctx.fillText(line, w / 2, controlsY + 20 + i * 14);
    });

    // "Press Start" with blink
    if (Math.sin(this.titleFlash * 4) > 0) {
      ctx.fillStyle = '#ffdd44';
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText('PRESS SPACE TO BEGIN', w / 2, 320);
    }

    // Version / credits
    ctx.fillStyle = '#333';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('v0.1  —  TOO POWERFUL TO CONTAIN', w / 2, 380);

    ctx.textAlign = 'left';
  }

  // ───── PLAYING ─────

  _updatePlaying(dt) {
    // Hit-stop: skip entity updates but keep effects going
    if (this.effects.isHitStopped) {
      this.effects.update(dt);
      return;
    }

    // Player
    const attack = this.player.update(this.input, dt);

    // Handle attack
    if (attack) {
      this._processAttack(attack);
    }

    // Stage waves
    this.stage.updateWaves(this.player, this.enemies, dt);

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.player, dt);

      // Cleanup
      if (enemy.shouldRemove(this.camera)) {
        this.enemies.splice(i, 1);
      }
    }

    // Camera
    this.camera.follow(this.player, this.stage.width, dt);

    // Effects
    this.effects.update(dt);

    // Clamp player to stage
    this.player.x = Math.max(0, Math.min(this.player.x, this.stage.width - this.player.width));

    // Check stage completion
    if (this.stage.completed) {
      this.state = 'STAGE_COMPLETE';
      this.stateTimer = 0;
    }
  }

  /**
   * Process a player attack — check hits against enemies.
   * @param {object} attack - { move, x, y, facing }
   */
  _processAttack(attack) {
    const { move, x, y, facing } = attack;
    let hitCount = 0;

    // Create attack hitbox
    const hitbox = {
      x: facing === 1 ? this.player.x + this.player.width - 10 : this.player.x - move.range + 10,
      y: this.player.y,
      width: move.range,
      height: this.player.height
    };

    for (const enemy of this.enemies) {
      if (enemy.state === 'RAGDOLL' || enemy.state === 'DEAD') continue;

      if (checkCollision(hitbox, enemy)) {
        enemy.takeHit(move, facing);
        hitCount++;

        // Spawn impact effects at enemy position
        this.effects.spawnImpact(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 3,
          { color: move.particleColor, count: 15 }
        );

        // Dust at feet
        this.effects.spawnDust(enemy.x + enemy.width / 2, GROUND_Y);

        // Score
        this.player.combo++;
        this.player.comboTimer = 3;
        const comboMultiplier = Math.min(this.player.combo, 10);
        this.player.score += enemy.score * comboMultiplier;
      }
    }

    if (hitCount > 0) {
      // Camera shake
      this.camera.shake(move.shakeIntensity, move.shakeDuration);

      // Hit-stop
      this.effects.hitStop(move.hitStopDuration);

      // Show move name
      this.effects.showText(
        move.name + '!',
        this.player.x + this.player.width / 2,
        this.player.y - 30,
        { color: move.particleColor, size: 10, duration: 1.2 }
      );

      // Combo text
      if (this.player.combo > 1) {
        this.effects.showText(
          `${this.player.combo}x COMBO`,
          this.player.x + this.player.width / 2,
          this.player.y - 50,
          { color: '#ffaa00', size: 8, duration: 1.0 }
        );
      }
    } else {
      // Shockwave effect even on miss (for Ki Shout)
      if (move === MOVES.KI_SHOUT) {
        this.effects.spawnShockwave(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2
        );
      }
    }
  }

  _renderPlaying() {
    const ctx = this.ctx;

    // Stage background
    this.stage.render(ctx, this.camera);

    // Enemies (behind player)
    for (const enemy of this.enemies) {
      enemy.render(ctx, this.camera);
    }

    // Player
    this.player.render(ctx, this.camera);

    // Effects (on top)
    this.effects.render(ctx, this.camera);

    // HUD
    this._renderHUD();
  }

  _renderHUD() {
    const ctx = this.ctx;
    const p = this.player;

    // Score
    ctx.fillStyle = '#ffdd44';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${p.score}`, 10, 20);

    // Combo
    if (p.combo > 1) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '7px "Press Start 2P"';
      ctx.fillText(`COMBO x${p.combo}`, 10, 35);
    }

    // Stage name
    ctx.fillStyle = '#888';
    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'right';
    ctx.fillText(this.stage.name, GAME_WIDTH - 10, 20);

    // Health bar (mostly full because grandmaster is OP)
    const hpBarX = GAME_WIDTH - 110;
    const hpBarY = 26;
    const hpBarW = 100;
    const hpBarH = 8;
    const hpRatio = p.health / p.maxHealth;

    ctx.fillStyle = '#333';
    ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
    ctx.fillStyle = hpRatio > 0.5 ? '#44cc44' : '#cc4444';
    ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

    // Move hints at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, GAME_HEIGHT - 18, GAME_WIDTH, 18);
    ctx.fillStyle = '#555';
    ctx.font = '5px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Z:FLICK X:KI SHOUT C:NO-TOUCH V:PALM B:SWEEP N:TOE POKE',
      GAME_WIDTH / 2, GAME_HEIGHT - 6
    );

    ctx.textAlign = 'left';
  }

  // ───── STAGE COMPLETE ─────

  _updateStageComplete(dt) {
    if (this.input.justPressed('Space') || this.input.justPressed('Enter')) {
      // For now, restart
      this.startGame();
    }
  }

  _renderStageComplete() {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffdd44';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE CLEAR!', GAME_WIDTH / 2, 150);

    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`SCORE: ${this.player.score}`, GAME_WIDTH / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText('Your Bullshido is too powerful.', GAME_WIDTH / 2, 240);

    if (Math.sin(this.stateTimer * 4) > 0) {
      ctx.fillStyle = '#ffdd44';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('PRESS SPACE TO CONTINUE', GAME_WIDTH / 2, 300);
    }

    ctx.textAlign = 'left';
  }

  // ───── GAME OVER ─────

  _updateGameOver(dt) {
    if (this.input.justPressed('Space') || this.input.justPressed('Enter')) {
      this.state = 'MENU';
      this.stateTimer = 0;
    }
  }

  _renderGameOver() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(100,0,0,0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEATED', GAME_WIDTH / 2, 160);

    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('Your Bullshido was not enough...', GAME_WIDTH / 2, 200);
    ctx.fillText(`SCORE: ${this.player.score}`, GAME_WIDTH / 2, 230);

    if (Math.sin(this.stateTimer * 4) > 0) {
      ctx.fillStyle = '#ffdd44';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('PRESS SPACE', GAME_WIDTH / 2, 300);
    }

    ctx.textAlign = 'left';
  }
}
