const RATIO = window.devicePixelRatio || 1;
const BORDER = 10;

/**
 * Helper that render data to canvas element
 */
class CanvasGraph {

  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    // if (!canvas) throw new Error('No canvas');
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._upper = BORDER;
    this._lower = -BORDER;
    this._vShift = 0;
    this._hShift = 0;

    this._canvas.style.cssText = `width: ${this._width}px; height: ${this._height}px;`;
    this._canvas.width = this._width * RATIO;
    this._canvas.height = this._height * RATIO;

    this._ctx.scale(RATIO, RATIO);
  }

  /**
   * Calculate upper and lower values, and shift values for rendering
   * @param {number[]} items
   * @returns {Promise<void>}
   * @private
   */
  async _calc(items) {
    this._upper = Math.max(Math.ceil(Math.max.apply(null, items) + BORDER), 1);
    this._lower = Math.min(Math.floor(Math.min.apply(null, items) - BORDER), -1);

    this._hShift = this._width / items.length;
    this._vShift = this._height / (this._upper - this._lower);
  }

  /**
   * Clear canvas and render zero line
   * @returns {Promise<void>}
   * @private
   */
  async _reset() {
    this._ctx.clearRect(0, 0, this._width, this._height);
    const zY = this._upper * this._vShift;

    this._ctx.beginPath();
    this._ctx.moveTo(0, zY);
    this._ctx.lineTo(this._width, zY);
    this._ctx.lineWidth = 0.5;
    this._ctx.strokeStyle = 'red';
    this._ctx.stroke();
  }

  /**
   * Render the curve
   * @param {number[]} items
   * @returns {Promise<void>}
   * @private
   */
  async _renderItems(items) {
    const count = items.length;

    this._ctx.beginPath();
    this._ctx.moveTo(0, (this._upper - items[0]) * this._vShift);

    for (let i = 1; i < count; i++) {
      this._ctx.lineTo(
        i * this._hShift,
        (this._upper - items[i]) * this._vShift
      );
    }

    this._ctx.lineWidth = 0.5;
    this._ctx.strokeStyle = 'blue';
    this._ctx.stroke();
  }

  /**
   * Render data
   * @param {number[]} items
   * @returns {Promise<void>}
   */
  async draw(items) {
    try {
      await this._calc(items);
      await this._reset();
      await this._renderItems(items);
    } catch (error) {
      return Promise.reject(error);
    }
  }

}

export default CanvasGraph;
