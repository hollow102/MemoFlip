export const DB_NAME = 'memoflip';
export const DB_VERSION = 1;

export const STORE = {
  Decks: 'decks',
  Cards: 'cards',
  Sessions: 'sessions',
  CardResults: 'card_results',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * onupgradeneeded 時に全 objectStore とインデックスを作成する。
 */
function createStores(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(STORE.Decks)) {
    db.createObjectStore(STORE.Decks, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(STORE.Cards)) {
    const store = db.createObjectStore(STORE.Cards, { keyPath: 'key' });
    store.createIndex('deckId', 'deckId', { unique: false });
  }
  if (!db.objectStoreNames.contains(STORE.Sessions)) {
    const store = db.createObjectStore(STORE.Sessions, { keyPath: 'id' });
    store.createIndex('deckId', 'deckId', { unique: false });
  }
  if (!db.objectStoreNames.contains(STORE.CardResults)) {
    const store = db.createObjectStore(STORE.CardResults, { keyPath: 'id' });
    store.createIndex('deckId', 'deckId', { unique: false });
    store.createIndex('sessionId', 'sessionId', { unique: false });
  }
}

/**
 * DB をオープンする。接続はキャッシュして使い回す。
 */
export function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => createStores(request.result);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}
