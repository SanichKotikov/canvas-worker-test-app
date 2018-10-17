self.importScripts('./promise.js');

const DB_NAME = 'GraphTestAppBD';
const TEMPERATURE_NAME = 'TemperatureStore';
const PRECIPITATION_NAME = 'PrecipitationStore';
const KEY_PATH = 'mId';
const YEAR_INDEX = 'y';

const TEMPERATURE_JSON = '../../data/temperature.json';
const PRECIPITATION_JSON = '../../data/precipitation.json';

/**
 * App's DB that lives in Web Worker
 */
class AppWorkerDB {

  constructor() {
    this._db = new PromiseIDB(DB_NAME, 1, AppWorkerDB._onUpgradeNeeded);
  }

  ready() { return this._db.ready(); }

  /**
   * Init empty DB (onupgradeneeded handler)
   * @param {IDBVersionChangeEvent} event
   * @private
   */
  static _onUpgradeNeeded(event) {
    if (event.oldVersion === 0 && event.newVersion === 1) {
      const db = event.target.result;

      [TEMPERATURE_NAME, PRECIPITATION_NAME]
        .forEach(name => {
          db.createObjectStore(name, { keyPath: KEY_PATH })
            .createIndex(YEAR_INDEX, YEAR_INDEX, { unique: false });
        });
    }
  };

  static _fetchTemperature() {
    return self.fetch(TEMPERATURE_JSON)
      .then(resp => resp.json());
  }

  static _fetchPrecipitation() {
    return self.fetch(PRECIPITATION_JSON)
      .then(resp => resp.json());
  }

  /**
   * Split data to months
   * @param {Object} items
   * @returns {Object[]}
   * @private
   */
  static _daysToMonths(items) {
    const data = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const mId = item.t.slice(0, 7);

      (!data.length || data[data.length - 1].mId !== mId)
        ? data.push({ mId: mId, y: item.t.slice(0, 4), v: [item] })
        : data[data.length - 1].v.push(item);
    }

    return data;
  }

  /**
   * Get only values (numbers)
   * @param {Object[]} items
   * @returns {number[]}
   * @private
   */
  static _getValues(items) {
    const data = [];

    for (let m = 0; m < items.length; m++) {
      for (let d = 0; d < items[m].v.length; d++) {
        data.push(items[m].v[d].v);
      }
    }

    return data;
  }

  /**
   * @param {string} storeName
   * @param fetcher
   * @param {Object} params
   * @returns {Promise<*>}
   */
  async getRange(storeName, fetcher, params) {
    try {
      const { lower, upper } = params;

      const count = (parseInt(upper) - parseInt(lower) + 1) * 12;
      const range = PromiseIDB.getBoundRange(lower, upper);
      let items = await this._db.getAll(storeName, YEAR_INDEX, range);

      if (items.length !== count) {
        const data = await fetcher();
        items = AppWorkerDB._daysToMonths(data);
        this._db.putAll(storeName, items); // Do not await this Promise
      }

      return AppWorkerDB._getValues(items);
    } catch (error) {
      return Promise.reject(error);
    }
  }

}

const db = new AppWorkerDB();

function wrapPromise(id, promise) {
  promise
    .then((data) => self.postMessage({ id, data }))
    .catch((error) => self.postMessage({ id, error }));
}

/**
 * Handler for catching messages from main thread
 * @param {MessageEvent} event
 * @constructor
 */
function MessageHandler(event) {
  const { id, message, data } = event.data;

  switch (message) {
    case 'get_ready':
      wrapPromise(id, db.ready());
      break;
    case 'get_temperature':
      wrapPromise(id, db.getRange(TEMPERATURE_NAME, AppWorkerDB._fetchTemperature, data));
      break;
    case 'get_precipitation':
      wrapPromise(id, db.getRange(PRECIPITATION_NAME, AppWorkerDB._fetchPrecipitation, data));
      break;
    default: break;
  }
}

self.addEventListener('message', MessageHandler, false);
