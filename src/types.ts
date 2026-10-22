export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoreSettings {
  storeName: string;
  logo: string | null;
  primaryColor: string;
}

export interface ScanResult {
  product: Product | null;
  barcode: string;
}

export type Screen = 'scanner' | 'products' | 'add' | 'settings';
