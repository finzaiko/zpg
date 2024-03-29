const DB_NAME = "zpg_idb";
const DB_VERSION = 1;
const STORE_NAME = "querytab";

function idbOK() {
  return "indexedDB" in window && !/iPad|iPhone|iPod/.test(navigator.platform);
}
export function openIDB(dbVersion) {
  if (typeof dbVersion != "undefined") {
    dbVersion = 1;
  }
  if (!idbOK()) {
    console.log("IndexedDB not support");
    return;
  }

  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME, dbVersion);

    openRequest.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(`${STORE_NAME}`)) {
        db.createObjectStore(`${STORE_NAME}`, {
          autoIncrement: false,
        });
      }
    };
    openRequest.onsuccess = function (e) {
      // db = e.target.result;
      resolve(e.target.result);
    };
    openRequest.onerror = function (e) {
      let msg = `Database error: ${theDB.error}`;
      console.error(`openIDB: ${msg}`);
      webix.alert({
        title: "Database Error",
        text: msg,
        type: "alert-error",
      });
      reject(msg);
      console.dir(e);
    };
  });
}

export function upsertStoreIDB(data, key) {

  openIDB(DB_VERSION).then((dbx) => {
    const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
    const store = tx.objectStore(`${STORE_NAME}`);
    let requestExist = store.get(key);
    let request;
    requestExist.onsuccess = function (e) {
      if (!e.target.result) {
        request = store.add(data, key);
      } else {
        request = store.put(data, key);
      }
      request.onerror = function (e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function (e) {
        // console.log(`Ok ${STORE_NAME} upserted`);
      };
    };

    requestExist.onerror = function (e) {
      console.log("Error", e.target.error.name);
    };
  });
}

export function addStoreIDB(data, key) {

  openIDB(DB_VERSION).then((dbx) => {
    const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
    const store = tx.objectStore(`${STORE_NAME}`);
    let request = store.add(data, key);

    request.onerror = function (e) {
      console.log("Error", e.target.error.name);
    };
    request.onsuccess = function (e) {
      // console.log(`Ok ${STORE_NAME} added`);
    };
  });
}

export function updateStoreIDB(data, key) {

  openIDB(DB_VERSION).then((dbx) => {
    const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
    const store = tx.objectStore(`${STORE_NAME}`);
    let request = store.put(data, key);

    request.onerror = function (e) {
      console.log("Error", e.target.error.name);
    };
    request.onsuccess = function (e) {
      // console.log(`Ok ${STORE_NAME} updated`);
    };
  });
}

export function emptyStoreIDB() {

  openIDB(DB_VERSION).then((dbx) => {
    const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
    const store = tx.objectStore(`${STORE_NAME}`);
    let request = store.clear();

    request.onerror = function (e) {
      console.log("Error", e.target.error.name);
    };
    request.onsuccess = function (e) {
      // console.log(`Ok ${STORE_NAME} emptied`);
    };
  });
}

export function readStoreIDB() {
  return new Promise((resolve, reject) => {
    let items = [];
    openIDB(DB_VERSION)
      .then((db) => {
        let request = db
          .transaction([`${STORE_NAME}`], "readonly")
          .objectStore(`${STORE_NAME}`)
          .openCursor();

        request.onsuccess = function (event) {
          let cursor = event.target.result;
          if (cursor) {
            items.push(Object.assign(cursor.value, {tab: cursor.key}));
            cursor.continue();
          } else {
            resolve({ db: db, items: items });
          }
        };

        request.onerror = function (event) {
          console.error(request.error);
          reject(request.error);
        };
      })
      .catch((error) => {
        console.error(request.error);
        reject(request.error);
      });
  });
}

export function readStoreIDBByKey(key) {
  return new Promise((resolve, reject) => {
    openIDB(DB_VERSION).then((db) => {
      let request = db
        .transaction([`${STORE_NAME}`], "readonly")
        .objectStore(`${STORE_NAME}`)
        .get(key);

      request.onsuccess = function (event) {
        console.log("event", event);
        var cursor = event.target.result;
        resolve(cursor);
      };

      request.onerror = function (event) {
        console.error(request.error);
        reject(request.error);
      };
    });
  });
}

export function deleteStoreIDB(key) {
  openIDB(DB_VERSION).then((dbx) => {
    const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
    const store = tx.objectStore(`${STORE_NAME}`);
    let request = store.delete(key);

    request.onerror = function (e) {
      console.log("Error", e.target.error.name);
    };
    request.onsuccess = function (e) {
      // console.log(`Ok ${STORE_NAME} deleted`);
    };
  });
}

/*
// Usage: currently not implement yet for offline data
addStoreIDB(PROJECT_STORE_NAME, [array_data]);

// Delete all DB
(async () => {
    const dbs = await window.indexedDB.databases();
    dbs.forEach(db => { window.indexedDB.deleteDatabase(db.name) });
})();

*/
