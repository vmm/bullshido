/**
 * Input Handler
 * Tracks keyboard state with support for "just pressed" detection.
 */
export class Input {
  constructor() {
    /** @type {Set<string>} Currently held keys */
    this.keys = new Set();
    /** @type {Set<string>} Keys pressed this frame */
    this.justPressedKeys = new Set();
    /** @type {Set<string>} Buffer for next frame's justPressed */
    this._pendingJustPressed = new Set();

    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this._pendingJustPressed.add(e.code);
      }
      this.keys.add(e.code);
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      e.preventDefault();
    });
  }

  /** Call at the START of each frame to refresh justPressed state */
  update() {
    this.justPressedKeys = new Set(this._pendingJustPressed);
    this._pendingJustPressed.clear();
  }

  /** @param {string} code - KeyboardEvent.code, e.g. 'ArrowRight' */
  isDown(code) {
    return this.keys.has(code);
  }

  /** @param {string} code - Returns true only on the first frame the key is pressed */
  justPressed(code) {
    return this.justPressedKeys.has(code);
  }
}
