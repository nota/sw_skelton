let _db = null
export function openDB () {
  return new Promise(function (resolve, reject) {
    if (_db) return resolve(_db)

    // Open (or create) the database
    const open = indexedDB.open('cache', 1);

    // Create the schema
    open.onupgradeneeded = function (event) {
      const db = event.target.result
      db.createObjectStore('version', {keyPath: 'key'})
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

export function setItem (store, key, value) {
  return openDB().then(function (db) {
    const objectStore = db.transaction(store, 'readwrite').objectStore(store)
    objectStore.put({key, value})
  })
}

export function getItem (store, key) {
  return openDB().then(function (db) {
    return new Promise(function(resolve, reject) {
      const objectStore = db.transaction(store, 'readonly').objectStore(store)
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
