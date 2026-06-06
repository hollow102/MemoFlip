import { openDB } from './db';

/**
 * IndexedDB の 1 ストアに対する汎用 CRUD を提供する基底クラス。
 * 各エンティティは plain object として保存し、put による upsert を基本とする。
 */
export abstract class BaseRepository<T> {
  constructor(protected readonly storeName: string) {}

  /** 単一リクエストを Promise でラップして実行する。 */
  protected async run<R>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<R>,
  ): Promise<R> {
    const db = await openDB();
    return new Promise<R>((resolve, reject) => {
      const tx = db.transaction(this.storeName, mode);
      const request = fn(tx.objectStore(this.storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  put(item: T): Promise<IDBValidKey> {
    return this.run('readwrite', (store) => store.put(item));
  }

  get(key: IDBValidKey): Promise<T | undefined> {
    return this.run('readonly', (store) => store.get(key) as IDBRequest<T | undefined>);
  }

  getAll(): Promise<T[]> {
    return this.run('readonly', (store) => store.getAll() as IDBRequest<T[]>);
  }

  delete(key: IDBValidKey): Promise<undefined> {
    return this.run('readwrite', (store) => store.delete(key));
  }

  clear(): Promise<undefined> {
    return this.run('readwrite', (store) => store.clear());
  }

  /** インデックス値で絞り込んで全件取得する。 */
  protected getAllByIndex(indexName: string, value: IDBValidKey): Promise<T[]> {
    return this.run('readonly', (store) => store.index(indexName).getAll(value) as IDBRequest<T[]>);
  }

  /** 複数件をまとめて upsert する。 */
  async bulkPut(items: T[]): Promise<void> {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      for (const item of items) store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** インデックス値に一致するレコードをまとめて削除する。 */
  protected async deleteByIndex(indexName: string, value: IDBValidKey): Promise<void> {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.index(indexName).openKeyCursor(value);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
