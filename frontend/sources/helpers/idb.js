const DB_NAME = "zpg_idb";
const DB_VERSION = 3; // Incremented to force upgrade
const STORE_NAME = "querytab";
const COMPLETION_STORE_NAME = "completion";

function idbOK() {
  return "indexedDB" in window && !/iPad|iPhone|iPod/.test(navigator.platform);
}

// Helper function to recreate database if corrupted
export function recreateIDB() {
  return new Promise((resolve, reject) => {
    if (!idbOK()) {
      reject("IndexedDB not supported");
      return;
    }

    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = function () {
      console.log("Database deleted successfully, recreating...");
      openIDB(DB_VERSION)
        .then(resolve)
        .catch(reject);
    };
    deleteRequest.onerror = function () {
      console.error("Error deleting database");
      reject("Failed to delete database");
    };
  });
}

export function openIDB(dbVersion) {
  if (typeof dbVersion == "undefined") {
    dbVersion = DB_VERSION;
  }
  if (!idbOK()) {
    console.log("IndexedDB not support");
    return;
  }

  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME, dbVersion);

    openRequest.onupgradeneeded = function (e) {
      const db = e.target.result;
      console.log("onupgradeneeded triggered, creating object stores");

      try {
        if (!db.objectStoreNames.contains(`${STORE_NAME}`)) {
          db.createObjectStore(`${STORE_NAME}`, {
            autoIncrement: false,
          });
          console.log(`Created object store: ${STORE_NAME}`);
        }
        if (!db.objectStoreNames.contains(`${COMPLETION_STORE_NAME}`)) {
          db.createObjectStore(`${COMPLETION_STORE_NAME}`, {
            autoIncrement: false,
          });
          console.log(`Created object store: ${COMPLETION_STORE_NAME}`);
        }
      } catch (err) {
        console.error("Error creating object stores:", err);
        reject(err);
      }
    };

    openRequest.onsuccess = function (e) {
      const db = e.target.result;

      // Verify that required stores exist
      if (!db.objectStoreNames.contains(STORE_NAME) ||
          !db.objectStoreNames.contains(COMPLETION_STORE_NAME)) {
        console.warn("Required object stores not found, recreating database...");
        db.close();
        recreateIDB()
          .then(resolve)
          .catch(reject);
      } else {
        resolve(db);
      }
    };

    openRequest.onerror = function (e) {
      let errObj = e.target.error;
      let msg = `Database error: ${errObj && errObj.message ? errObj.message : "Unknown error"}`;
      console.error(`openIDB: ${msg}`);
      console.error("Full error:", errObj);
      reject(msg);
    };

    openRequest.onblocked = function () {
      console.warn("Database open blocked - another connection may be using it");
    };
  });
}

export function upsertStoreIDB(data, key) {

  openIDB(DB_VERSION).then((dbx) => {
    try {
      const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
      const store = tx.objectStore(`${STORE_NAME}`);
      let requestExist = store.get(key);
      let request;
      requestExist.onsuccess = function (e) {
        const existing = e.target.result;
        if (!existing) {
          // count existing records to assign next order index
          const countReq = store.count();
          countReq.onsuccess = function (ce) {
            request = store.add(Object.assign({}, data, { order: ce.target.result }), key);
            request.onerror = function (e) { console.log("Error", e.target.error.name); };
          };
        } else {
          // preserve existing fields/order so partial updates (e.g. tab color) do not delete data
          const preserved = Object.assign({}, existing, data, {
            order: typeof existing.order === "number" ? existing.order : 0,
          });
          request = store.put(preserved, key);
          request.onerror = function (e) { console.log("Error", e.target.error.name); };
        }
      };

      requestExist.onerror = function (e) {
        console.log("Error", e.target.error.name);
      };

      tx.onerror = function (e) {
        console.error("Transaction error in upsertStoreIDB:", e.target.error);
      };
    } catch (err) {
      console.error("Error in upsertStoreIDB:", err);
      recreateIDB().catch(e => console.error("Failed to recreate DB:", e));
    }
  }).catch(err => {
    console.error("Failed to open IDB in upsertStoreIDB:", err);
  });
}

export function addStoreIDB(data, key) {

  openIDB(DB_VERSION).then((dbx) => {
    try {
      const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
      const store = tx.objectStore(`${STORE_NAME}`);
      let request = store.add(data, key);

      request.onerror = function (e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function (e) {
        // console.log(`Ok ${STORE_NAME} added`);
      };

      tx.onerror = function (e) {
        console.error("Transaction error in addStoreIDB:", e.target.error);
      };
    } catch (err) {
      console.error("Error in addStoreIDB:", err);
      recreateIDB().catch(e => console.error("Failed to recreate DB:", e));
    }
  }).catch(err => {
    console.error("Failed to open IDB in addStoreIDB:", err);
  });
}

export function updateStoreIDB(data, key) {

  openIDB(DB_VERSION).then((dbx) => {
    try {
      const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
      const store = tx.objectStore(`${STORE_NAME}`);
      let request = store.put(data, key);

      request.onerror = function (e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function (e) {
        // console.log(`Ok ${STORE_NAME} updated`);
      };

      tx.onerror = function (e) {
        console.error("Transaction error in updateStoreIDB:", e.target.error);
      };
    } catch (err) {
      console.error("Error in updateStoreIDB:", err);
      recreateIDB().catch(e => console.error("Failed to recreate DB:", e));
    }
  }).catch(err => {
    console.error("Failed to open IDB in updateStoreIDB:", err);
  });
}

export function emptyStoreIDB() {

  openIDB(DB_VERSION).then((dbx) => {
    try {
      const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
      const store = tx.objectStore(`${STORE_NAME}`);
      let request = store.clear();

      request.onerror = function (e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function (e) {
        // console.log(`Ok ${STORE_NAME} emptied`);
      };

      tx.onerror = function (e) {
        console.error("Transaction error in emptyStoreIDB:", e.target.error);
      };
    } catch (err) {
      console.error("Error in emptyStoreIDB:", err);
      recreateIDB().catch(e => console.error("Failed to recreate DB:", e));
    }
  }).catch(err => {
    console.error("Failed to open IDB in emptyStoreIDB:", err);
  });
}

// Keyed by profileId, so each connection/tab keeps its own completion cache
export function upsertCompletionIDB(data, profileId) {
  openIDB(DB_VERSION).then((dbx) => {
    try {
      const tx = dbx.transaction([`${COMPLETION_STORE_NAME}`], "readwrite");
      const store = tx.objectStore(`${COMPLETION_STORE_NAME}`);
      const request = store.put(data, String(profileId));
      request.onerror = function (e) {
        console.log("Error", e.target.error.name);
      };

      tx.onerror = function (e) {
        console.error("Transaction error in upsertCompletionIDB:", e.target.error);
      };
    } catch (err) {
      console.error("Error in upsertCompletionIDB:", err);
      recreateIDB().catch(e => console.error("Failed to recreate DB:", e));
    }
  }).catch(err => {
    console.error("Failed to open IDB in upsertCompletionIDB:", err);
  });
}

export function readCompletionIDBByKey(profileId) {
  return new Promise((resolve, reject) => {
    openIDB(DB_VERSION)
      .then((db) => {
        const request = db
          .transaction([`${COMPLETION_STORE_NAME}`], "readonly")
          .objectStore(`${COMPLETION_STORE_NAME}`)
          .get(String(profileId));

        request.onsuccess = function (event) {
          resolve(event.target.result);
        };
        request.onerror = function (event) {
          console.error(request.error);
          reject(request.error);
        };
      })
      .catch(reject);
  });
}

function sortItemsByOrder(items) {
  return items.sort((a, b) => {
    const aOrder = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return String(a.tab).localeCompare(String(b.tab));
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
            items.push(Object.assign({}, cursor.value, { tab: cursor.key }));
            cursor.continue();
          } else {
            resolve({ db: db, items: sortItemsByOrder(items) });
          }
        };

        request.onerror = function (event) {
          console.error(request.error);
          reject(request.error);
        };
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

export function reorderStoreIDB(orderTabs) {
  if (!Array.isArray(orderTabs)) {
    return Promise.reject(new Error("orderTabs must be an array"));
  }

  console.log("reorderStoreIDB called with:", orderTabs);

  // Read raw items without sorting to avoid corrupted order values
  return new Promise((resolve, reject) => {
    const itemMap = new Map();
    openIDB(DB_VERSION)
      .then((db) => {
        const request = db
          .transaction([`${STORE_NAME}`], "readonly")
          .objectStore(`${STORE_NAME}`)
          .openCursor();

        request.onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {
            itemMap.set(cursor.key, Object.assign({}, cursor.value));
            cursor.continue();
          } else {
            // build array in exact order from orderTabs
            const sortedItems = [];
            orderTabs.forEach((tabId) => {
              if (itemMap.has(tabId)) {
                sortedItems.push(Object.assign({ tab: tabId }, itemMap.get(tabId)));
              }
            });

            // add any tabs not in orderTabs
            itemMap.forEach((item, tabId) => {
              if (!orderTabs.includes(tabId)) {
                sortedItems.push(Object.assign({ tab: tabId }, item));
              }
            });

            console.log("sortedItems to write:", sortedItems.map((i, idx) => ({ tab: i.tab, order: idx })));

            // write with correct order
            const txWrite = db.transaction([`${STORE_NAME}`], "readwrite");
            const store = txWrite.objectStore(`${STORE_NAME}`);

            sortedItems.forEach((item, index) => {
              const { tab, ...rest } = item;
              const toStore = Object.assign({}, rest, { order: index });
              console.log(`Writing ${tab} with order ${index}:`, toStore);
              store.put(toStore, tab);
            });

            txWrite.oncomplete = function () {
              console.log("Transaction complete, resolving");
              resolve(sortedItems);
            };

            txWrite.onerror = function (event) {
              console.error(event.target.error);
              reject(event.target.error);
            };
          }
        };

        request.onerror = function (event) {
          console.error(request.error);
          reject(request.error);
        };
      })
      .catch((error) => {
        reject(error);
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
    try {
      const tx = dbx.transaction([`${STORE_NAME}`], "readwrite");
      const store = tx.objectStore(`${STORE_NAME}`);
      let request = store.delete(key);

      request.onerror = function (e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function (e) {
        // console.log(`Ok ${STORE_NAME} deleted`);
      };

      tx.onerror = function (e) {
        console.error("Transaction error in deleteStoreIDB:", e.target.error);
      };
    } catch (err) {
      console.error("Error in deleteStoreIDB:", err);
      recreateIDB().catch(e => console.error("Failed to recreate DB:", e));
    }
  }).catch(err => {
    console.error("Failed to open IDB in deleteStoreIDB:", err);
  });
}

// Exposed function for manual clearing if needed (call from browser console)
export function clearCorruptedIDB() {
  return recreateIDB()
    .then(() => {
      console.log("✓ IndexedDB successfully cleared and recreated");
      return true;
    })
    .catch(err => {
      console.error("✗ Failed to clear IndexedDB:", err);
      return false;
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

// Manual fix if IndexedDB errors persist (run in browser console):
// import { clearCorruptedIDB } from './sources/helpers/idb.js';
// clearCorruptedIDB().then(() => location.reload());

*/
