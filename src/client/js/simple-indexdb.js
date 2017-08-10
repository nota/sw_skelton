let _db = null
export function openDB () {
  return new Promise(function (resolve, reject) {
    if (_db) return resolve(_db)

    // Open (or create) the database
    const open = indexedDB.open('MyDatabase', 1);

    // Create the schema
    open.onupgradeneeded = function (event) {
      const db = event.target.result
      db.createObjectStore('version', {keyPath: 'id'})
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

export function setItem (storeName, data) {
  return openDB().then(function (db) {
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName)
    store.put(data)
  })
}

export function getItem (storeName, id) {
  return openDB().then(function (db) {
    return new Promise(function(resolve, reject) {
      const store = db.transaction(storeName, 'readonly').objectStore(storeName)
      const request = store.get(id)
      request.onsuccess = function(event){
        resolve(event.target.result)
      }
      request.onerror = function (event) {
        reject(event)
      }
    })
  })
}
