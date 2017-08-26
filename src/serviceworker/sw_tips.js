
// Open (or create) the database
var open = indexedDB.open("MyDatabase", 3);

// Create the schema
open.onupgradeneeded = function (event) {
  var db = event.target.result; // or open.result
  db.createObjectStore("version", {keyPath: 'id'});

//    var store = db.createObjectStore("MyObjectStore", {keyPath: "id"});
//    var index = store.createIndex("NameIndex", ["name.last", "name.first"]);
};

open.onsuccess = function (event) {
    // Start a new transaction
    var db = open.result;

    var store = db.transaction("version", "readwrite").objectStore("version")
    store.put({id: 'version', name: 'aaa'})

    var getReq = store.get('version')
    getReq.onsuccess = function(event){
      console.log(event.target.result) // {id : 'A1', name : 'test'}
    }
/*
    var tx = db.transaction("MyObjectStore", "readwrite");
    var store = tx.objectStore("MyObjectStore");
    var index = store.index("NameIndex");

    // Add some data
    store.put({id: 12345, name: {first: "John", last: "Doe"}, age: 42});
    store.put({id: 67890, name: {first: "Bob", last: "Smith"}, age: 35});

    // Query the data
    var getJohn = store.get(12345);
    var getBob = index.get(["Smith", "Bob"]);

    getJohn.onsuccess = function() {
        console.log(getJohn.result.name.first);  // => "John"
    };

    getBob.onsuccess = function() {
        console.log(getBob.result.name.first);   // => "Bob"
    };

    // Close the db when the transaction is done
    tx.oncomplete = function() {
        db.close();
    };
*/
}








    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHENAME && k.indexOf('app-assets-') === 0) {
          console.log('sw: delete cache', k)
          return caches.delete(k)
        } else {
          console.log('sw: keep cache', k)
          return Promise.resolve()
        }
      }))
    }).then(function () {
      // `claim()` sets this worker as the active worker for all clients that
      // match the workers scope and triggers an `oncontrollerchange` event for
      // the clients.
      console.log('sw: claim')
      return self.clients.claim()
    })
