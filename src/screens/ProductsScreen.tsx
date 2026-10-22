import { useState, useEffect, useCallback } from 'react';
import { Product, StoreSettings } from '../types';
import { getAllProducts, deleteProduct } from '../db';

interface ProductsScreenProps {
  settings: StoreSettings;
  onEdit: (barcode: string) => void;
}

export default function ProductsScreen({ settings, onEdit }: ProductsScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const all = await getAllProducts();
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    setProducts(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteProduct(deleteConfirm.id);
    setDeleteConfirm(null);
    await loadProducts();
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="safe-top bg-white px-4 pt-4 pb-3 shrink-0 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">المنتجات</h1>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {products.length} منتج
          </span>
        </div>
        {/* Search */}
        <div className="relative">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الباركود..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 border border-transparent text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: settings.primaryColor }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            {search ? (
              <p className="text-gray-500 text-sm">لا توجد نتائج لـ "{search}"</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium mb-1">لا توجد منتجات</p>
                <p className="text-gray-400 text-xs">اضغط على "إضافة" لتسجيل منتج جديد</p>
              </>
            )}
          </div>
        ) : (
          <div className="py-2">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="mx-3 mb-2 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <div className="flex items-center p-3.5">
                  <div className="flex-1 min-w-0" onClick={() => onEdit(product.barcode)}>
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-0.5">{product.name}</h3>
                    <p className="text-xs text-gray-400" dir="ltr">{product.barcode}</p>
                  </div>
                  <div className="text-left shrink-0 mr-3" onClick={() => onEdit(product.barcode)}>
                    <span className="price-display text-lg font-bold" style={{ color: settings.primaryColor }}>
                      {product.price.toLocaleString('ar-IQ')}
                    </span>
                    <span className="text-xs text-gray-400 mr-0.5">د.ع</span>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(product)}
                    className="touchable p-2 rounded-lg text-gray-300 mr-1"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center fade-in">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5 slide-up">
            <h3 className="text-base font-bold text-gray-900 mb-1">حذف المنتج</h3>
            <p className="text-sm text-gray-500 mb-4">
              هل تريد حذف "{deleteConfirm.name}"؟ لا يمكن التراجع عن هذه العملية.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="touchable flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="touchable flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
