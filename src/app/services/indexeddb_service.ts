import { openDB } from '../repositories/db';

/**
 * アプリ起動時に DB をオープンしてストア作成（onupgradeneeded）を確実に走らせる。
 */
export async function initDatabase(): Promise<void> {
  await openDB();
}
