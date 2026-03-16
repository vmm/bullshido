/**
 * Physics
 * Simple 2D physics for gravity, velocity, and ragdoll effects.
 */

/** Gravity in pixels/sec² */
export const GRAVITY = 1200;

/** Ground Y position (from top of canvas) */
export const GROUND_Y = 320;

/**
 * Apply velocity and gravity to an entity.
 * Entity must have: x, y, vx, vy properties.
 * @param {object} entity
 * @param {number} dt - Delta time in seconds
 * @param {boolean} [applyGravity=true]
 */
export function applyPhysics(entity, dt, applyGravity = true) {
  if (applyGravity) {
    entity.vy += GRAVITY * dt;
  }
  entity.x += entity.vx * dt;
  entity.y += entity.vy * dt;

  // Angular velocity (for ragdoll spin)
  if (entity.angularVel !== undefined && entity.angle !== undefined) {
    entity.angle += entity.angularVel * dt;
  }
}

/**
 * Clamp entity to ground level.
 * @param {object} entity - Must have y, vy, height properties
 * @returns {boolean} True if entity is on the ground
 */
export function clampToGround(entity) {
  const feetY = entity.y + entity.height;
  if (feetY >= GROUND_Y) {
    entity.y = GROUND_Y - entity.height;
    entity.vy = 0;
    return true;
  }
  return false;
}

/**
 * Check AABB collision between two entities.
 * Entities must have x, y, width, height properties.
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
export function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Launch an entity with ragdoll physics (for comedic enemy reactions).
 * @param {object} entity
 * @param {number} launchVX - Horizontal launch velocity
 * @param {number} launchVY - Vertical launch velocity
 * @param {number} spin - Angular velocity in radians/sec
 */
export function launchEntity(entity, launchVX, launchVY, spin = 0) {
  entity.vx = launchVX;
  entity.vy = launchVY;
  if (entity.angle === undefined) entity.angle = 0;
  entity.angularVel = spin;
}
