const WORKER = './scripts/idb/worker.js';

/**
 * Wrapper that communicates with IndexedDB in Web Worker
 */
class AppDB {

  constructor() {
    this._msgId = 0;
    this._resolves = {};
    this._rejects = {};

    this._worker = new Worker(WORKER);
    this._worker.onmessage = (event) => this._onMessage(event);
  }

  /**
   * On message handler for catching answers form the worker
   * @param {MessageEvent} event
   * @private
   */
  _onMessage(event) {
    const { id, error, data } = event.data;

    error
      ? this._rejects[id] && this._rejects[id](error)
      : this._resolves[id] && this._resolves[id](data);

    delete this._resolves[id];
    delete this._rejects[id];
  }

  /**
   * Send message with/without date to the worker
   * @param {string} message
   * @param {Object} [data]
   * @returns {Promise<number[] | undefined>}
   * @private
   */
  _postMessage(message, data) {
    // It's better to use random string for ID.
    const id = this._msgId++;

    return new Promise((resolve, reject) => {
      this._resolves[id] = resolve;
      this._rejects[id] = reject;
      this._worker.postMessage({ id, message, data });
    })
  }

  /**
   * Check that the DB is ready
   * @returns {Promise<void>}
   */
  ready() {
    return this._postMessage('get_ready');
  }

  /**
   * Get temperature data
   * @param {string} lower
   * @param {string} upper
   * @returns {Promise<number[]>}
   */
  getTemperature(lower, upper) {
    return this._postMessage('get_temperature', { lower, upper });
  }

  /**
   * Get precipitation data
   * @param {string} lower
   * @param {string} upper
   * @returns {Promise<number[]>}
   */
  getPrecipitation(lower, upper) {
    return this._postMessage('get_precipitation', { lower, upper });
  }

}

export default AppDB
