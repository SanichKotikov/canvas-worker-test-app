import AppDB from './idb/index.js';
import CanvasGraph from './canvas/graph.js';

const LOWER = '1881';
const UPPER = '2006';

const form = document.getElementById('form');
const lSelect = document.getElementById('lower-select');
const uSelect = document.getElementById('upper-select');
const canvas = document.getElementById('canvas');

class App {

  constructor() {
    this._state = { lower: LOWER, upper: UPPER, type: 'temperature' };

    this._db = new AppDB();
    this._canvas = new CanvasGraph(canvas);

    this._subscribe();
    this._fillYears();
    this._render();
  }

  _subscribe() {
    form.addEventListener('change', (event) => this._onChange(event));
  }

  /**
   * Fill the select elements with years range
   * @private
   */
  _fillYears() {
    const start = parseInt(this._state.lower);

    const options = Array
      .apply(null, Array(parseInt(this._state.upper) - start + 1))
      .map((val, idx) => {
        const year = start + idx;
        return `<option value="${year}">${year}</option>`;
      })
      .join('');

    lSelect.innerHTML = options;
    lSelect.value = this._state.lower;

    uSelect.innerHTML = options;
    uSelect.value = this._state.upper;
  }

  /**
   * Correct selects' values to avoid wrong range
   * @param {string} name
   * @param {string} value
   * @private
   */
  _checkSelects(name, value) {
    const { lower, upper } = this._state;

    if (name === 'lower' && +lower > +upper) {
      this._state.upper = value;
      uSelect.value = value;
    }
    else if (name === 'upper' && +upper < +lower) {
      this._state.lower = value;
      lSelect.value = value;
    }
  }

  /**
   * @param {Event} event
   * @private
   */
  _onChange(event) {
    const target = event.target;
    const { name, value } = target;

    if (Object.keys(this._state).indexOf(name) === -1) return;
    this._state[name] = value;

    this._checkSelects(name, value);
    this._render();
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _render() {
    try {
      await this._db.ready();

      const items = this._state.type === 'temperature'
        ? await this._db.getTemperature(this._state.lower, this._state.upper)
        : await this._db.getPrecipitation(this._state.lower, this._state.upper);

      await this._canvas.draw(items);
    } catch (error) {
      console.log(error);
    }
  }

}

new App();
