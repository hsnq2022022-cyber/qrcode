import { openDB, IDBPDatabase } from 'idb';
import { Product, StoreSettings } from './types';

const DB_NAME = 'saari-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('barcode', 'barcode', { unique: true });
        productStore.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
  return dbInstance;
}

// Products
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const db = await getDB();
  return db.getFromIndex('products', 'barcode', barcode);
}

export async function addProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.put('products', product);
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.put('products', product);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('products', id);
}

export async function barcodeExists(barcode: string, excludeId?: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.getFromIndex('products', 'barcode', barcode);
  if (existing && existing.id !== excludeId) return true;
  return false;
}

// Settings
export async function getSettings(): Promise<StoreSettings> {
  const db = await getDB();
  const result = await db.get('settings', 'store');
  if (result) return result.value;
  return { storeName: '', logo: null, primaryColor: '#0d9488' };
}

export async function saveSettings(settings: StoreSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: 'store', value: settings });
}

// Backup
export async function exportBackup(): Promise<string> {
  const products = await getAllProducts();
  const settings = await getSettings();
  return JSON.stringify({ products, settings, version: 1, exportedAt: Date.now() }, null, 2);
}

export async function importBackup(json: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(json);
    if (!data.version || !Array.isArray(data.products)) {
      return { success: false, message: 'ملف النسخة الاحتياطية غير صالح' };
    }
    const db = await getDB();
    const tx = db.transaction(['products', 'settings'], 'readwrite');
    
    // Clear existing data
    await tx.objectStore('products').clear();
    
    // Import products
    for (const product of data.products) {
      await tx.objectStore('products').put(product);
    }
    
    // Import settings if available
    if (data.settings) {
      await tx.objectStore('settings').put({ key: 'store', value: data.settings });
    }
    
    await tx.done;
    return { success: true, message: `تم استعادة ${data.products.length} منتج بنجاح` };
  } catch (e) {
    return { success: false, message: 'فشل استيراد النسخة الاحتياطية' };
  }
}
