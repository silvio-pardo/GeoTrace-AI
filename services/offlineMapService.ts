
/**
 * Offline Map Service
 * Handles storing and retrieving map tiles using IndexedDB.
 */

const DB_NAME = 'GeoTraceOfflineMaps';
const STORE_NAME = 'tiles';
const DB_VERSION = 1;

export interface OfflineTile {
  url: string;
  blob: Blob;
  timestamp: number;
}

class OfflineMapService {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveTile(url: string, blob: Blob): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.put({
      url,
      blob,
      timestamp: Date.now()
    });
  }

  async getTile(url: string): Promise<Blob | null> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve) => {
      const request = store.get(url);
      request.onsuccess = () => {
        resolve(request.result ? request.result.blob : null);
      };
      request.onerror = () => resolve(null);
    });
  }

  async clearCache(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
  }

  async getStats(): Promise<{ count: number; size: number }> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result as OfflineTile[];
        const size = items.reduce((acc, item) => acc + item.blob.size, 0);
        resolve({ count: items.length, size });
      };
    });
  }
}

export const offlineMapService = new OfflineMapService();
