const indexedDB = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB;
const IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange || self.msIDBKeyRange;

const IDBTransactionMode = {
  READ_ONLY: 'readonly',
  READ_WRITE: 'readwrite',
  VERSION_CHANGE: 'versionchange',
};

/**
 * A simple Promise interface for IndexedDB
 */
class PromiseIDB {

  /**
   * @param {string} name
   * @param {number} [version]
   * @param [onUpgradeNeeded]
   */
  constructor(name, version, onUpgradeNeeded) {
    this._name = name;
    this._version = version | 0;
    this._onUpgradeNeeded = onUpgradeNeeded;
    this._db = null;
    this._ready = null;
  }

  /**
   * @param {string} lower
   * @param {string} upper
   * @returns {IDBKeyRange}
   */
  static getBoundRange(lower, upper) {
    return IDBKeyRange.bound(lower, upper, false, false);
  }

  /**
   * @param {string} storeName
   * @param {IDBTransactionMode} mode
   * @param onComplete
   * @param onError
   * @returns {IDBObjectStore}
   * @private
   */
  _getStore(storeName, mode, onComplete, onError) {
    const transaction = this._db.transaction(storeName, IDBTransactionMode.READ_WRITE);
    transaction.oncomplete = (event) => onComplete(event);
    transaction.onerror = (event) => onError(event.target.error);
    return transaction.objectStore(storeName);
  }

  ready() {
    if (this._ready === null) {
      this._ready = new Promise((resolve, reject) => {
        if (!this._onUpgradeNeeded) { reject(); return; }

        const request = indexedDB.open(this._name, this._version);
        request.onupgradeneeded = (event) => this._onUpgradeNeeded(event);
        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          this._db = request.result;
          resolve();
        };
      });
    }

    return this._ready;
  }

  /**
   * @param {string} storeName
   * @param {string} indexName
   * @param {IDBKeyRange} range
   * @returns {Promise<Object[]>}
   */
  getAll(storeName, indexName, range) {
    return new Promise((resolve, reject) => {
      let result = [];
      const store = this._getStore(storeName, IDBTransactionMode.READ_ONLY, () => resolve(result), reject);
      store.index(indexName).getAll(range).onsuccess = (event) => result = event.target.result;
    })
  }

  /**
   * @param {string} storeName
   * @param {Object[]} values
   * @returns {Promise<void>}
   */
  putAll(storeName, values) {
    return new Promise((resolve, reject) => {
      const result = [];
      const store = this._getStore(storeName, IDBTransactionMode.READ_WRITE, () => resolve(result), reject);

      for (let i = 0; i < values.length; i++) {
        store.put(values[i]).onsuccess = (event) => result.push(event.target.result);
      }
    })
  }

}
