let _db = null

const DB_NAME = 'cache'
const STORE_NAME = 'version'

export function openDB () {
  return new Promise(function (resolve, reject) {
    if (_db) return resolve(_db)

    // Open (or create) the database
    const open = indexedDB.open(DB_NAME, 1);

    // Create the schema
    open.onupgradeneeded = function (event) {
      const db = event.target.result
      db.createObjectStore(STORE_NAME, {keyPath: 'key'})
    }

    open.onsuccess = function (event) {
      const db = event.target.result
      _db = db // save in global
      resolve(db)
    }

    open.onblocked = function (event) {
      reject(event)
    }

    open.onerror = function (event) {
      reject(event)
    }
  })
}

export function setItem (key, value) {
  return openDB().then(function (db) {
    const objectStore = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
    objectStore.put({key, value})
  })
}

export function getItem (key) {
  return openDB().then(function (db) {
    return new Promise(function(resolve, reject) {
      const objectStore = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME)
      const request = objectStore.get(key)
      request.onsuccess = function(event){
        resolve(event.target.result)
      }
      request.onerror = function (event) {
        reject(event)
      }
    })
  })
}
