/**
 * Renderer
 * Canvas drawing helpers with camera-aware coordinate transformations.
 */
export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
  }

  /** Clear the entire canvas */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw a filled rectangle in world-space.
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {number} w - Width
   * @param {number} h - Height
   * @param {string} color - Fill color
   * @param {import('./camera.js').Camera} camera
   */
  drawRect(x, y, w, h, color, camera) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.round(x - camera.effectiveX),
      Math.round(y - camera.effectiveY),
      w, h
    );
  }

  /**
   * Draw a sprite frame from a spritesheet.
   * @param {HTMLImageElement} image - Spritesheet image
   * @param {number} sx - Source X on sheet
   * @param {number} sy - Source Y on sheet
   * @param {number} sw - Source width
   * @param {number} sh - Source height
   * @param {number} dx - Destination world X
   * @param {number} dy - Destination world Y
   * @param {number} dw - Destination width
   * @param {number} dh - Destination height
   * @param {import('./camera.js').Camera} camera
   * @param {boolean} [flip=false] - Flip horizontally
   */
  drawSprite(image, sx, sy, sw, sh, dx, dy, dw, dh, camera, flip = false) {
    const screenX = Math.round(dx - camera.effectiveX);
    const screenY = Math.round(dy - camera.effectiveY);

    this.ctx.save();
    if (flip) {
      this.ctx.translate(screenX + dw, screenY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
    } else {
      this.ctx.drawImage(image, sx, sy, sw, sh, screenX, screenY, dw, dh);
    }
    this.ctx.restore();
  }

  /**
   * Draw text in screen-space (HUD).
   * @param {string} text
   * @param {number} x - Screen X
   * @param {number} y - Screen Y
   * @param {object} [opts]
   * @param {string} [opts.color='#fff']
   * @param {string} [opts.font='8px "Press Start 2P"']
   * @param {string} [opts.align='left']
   */
  drawText(text, x, y, opts = {}) {
    const { color = '#fff', font = '8px "Press Start 2P"', align = 'left' } = opts;
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Draw a parallax background layer.
   * @param {HTMLImageElement|null} image - Background image (null = skip)
   * @param {number} scrollFactor - 0 = static, 1 = same as camera
   * @param {import('./camera.js').Camera} camera
   */
  drawParallax(image, scrollFactor, camera) {
    if (!image) return;
    const offset = -(camera.effectiveX * scrollFactor) % this.canvas.width;
    this.ctx.drawImage(image, offset, 0, this.canvas.width, this.canvas.height);
    // Tile for seamless scrolling
    if (offset < 0) {
      this.ctx.drawImage(image, offset + this.canvas.width, 0, this.canvas.width, this.canvas.height);
    } else if (offset > 0) {
      this.ctx.drawImage(image, offset - this.canvas.width, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Fill the entire canvas with a solid color.
   * @param {string} color
   */
  fillBackground(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
