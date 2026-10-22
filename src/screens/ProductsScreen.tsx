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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const all = await getAllProducts();
    // Sort by most recently updated
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

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    setDeleteConfirm(null);
    await loadProducts();
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="safe-top bg-white border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          {settings.logo ? (
            <img src={settings.logo} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: settings.primaryColor }}>
              {settings.storeName ? settings.storeName[0] : 'س'}
            </div>
          )}
          <h1 className="text-base font-bold text-gray-900">المنتجات</h1>
          <span className="text-xs text-gray-400 mr-auto">{products.length} منتج</span>
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
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-3">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="14" y2="13" />
            </svg>
            {search ? (
              <p className="text-gray-400 text-sm">لا توجد نتائج لـ "{search}"</p>
            ) : (
              <p className="text-gray-400 text-sm">لا توجد منتجات مسجلة</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0" onClick={() => onEdit(product.barcode)}>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{product.barcode}</p>
                </div>
                <div className="text-left shrink-0" onClick={() => onEdit(product.barcode)}>
                  <span className="text-base font-bold" style={{ color: settings.primaryColor }}>
                    {product.price.toLocaleString('ar-IQ')}
                  </span>
                  <span className="text-xs text-gray-400 mr-1">د.ع</span>
                </div>
                <button
                  onClick={() => setDeleteConfirm(product.id)}
                  className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors btn-press"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5 animate-slide-up">
            <h3 className="text-base font-bold text-gray-900 mb-2">حذف المنتج</h3>
            <p className="text-sm text-gray-500 mb-4">هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذه العملية.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm btn-press"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm btn-press"
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
