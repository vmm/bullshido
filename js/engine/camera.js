/**
 * Camera
 * Horizontal-follow camera with smooth lerp and stage clamping.
 */
export class Camera {
  /**
   * @param {number} viewWidth  - Canvas width
   * @param {number} viewHeight - Canvas height
   */
  constructor(viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.lerpSpeed = 0.08;

    // Shake state
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Follow a target entity horizontally.
   * @param {object} target - Entity with x, y properties
   * @param {number} stageWidth - Total stage width for clamping
   * @param {number} dt - Delta time in seconds
   */
  follow(target, stageWidth, dt) {
    // Target position: center player at 1/3 of screen from left
    const targetX = target.x - this.viewWidth * 0.33;

    // Smooth lerp toward target
    this.x += (targetX - this.x) * this.lerpSpeed;

    // Clamp to stage bounds
    this.x = Math.max(0, Math.min(this.x, stageWidth - this.viewWidth));

    // Keep Y fixed (side-scroller)
    this.y = 0;

    // Update shake
    this._updateShake(dt);
  }

  /**
   * Trigger screen shake.
   * @param {number} intensity - Max pixel offset
   * @param {number} duration - Duration in seconds
   */
  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  _updateShake(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  /** Get the effective camera X (with shake) */
  get effectiveX() {
    return this.x + this.shakeOffsetX;
  }

  /** Get the effective camera Y (with shake) */
  get effectiveY() {
    return this.y + this.shakeOffsetY;
  }
}
