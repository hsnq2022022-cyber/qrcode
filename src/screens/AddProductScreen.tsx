import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { StoreSettings, Product } from '../types';
import { addProduct, getProductByBarcode, barcodeExists } from '../db';

interface AddProductScreenProps {
  settings: StoreSettings;
  initialBarcode: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateEAN13(): string {
  const prefix = '200';
  let code = prefix;
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return code + check.toString();
}

export default function AddProductScreen({ settings, initialBarcode, onSaved, onCancel }: AddProductScreenProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [showBarcode, setShowBarcode] = useState(false);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialBarcode) {
      getProductByBarcode(initialBarcode).then(product => {
        if (product) {
          setEditMode(true);
          setExistingProduct(product);
          setName(product.name);
          setBarcode(product.barcode);
          setPrice(product.price.toString());
        } else {
          setBarcode(initialBarcode);
        }
      });
    }
    setTimeout(() => nameInputRef.current?.focus(), 300);
  }, [initialBarcode]);

  const handleGenerateBarcode = () => {
    const newBarcode = generateEAN13();
    setBarcode(newBarcode);
    setShowBarcode(true);
  };

  useEffect(() => {
    if (showBarcode && barcodeCanvasRef.current && barcode) {
      try {
        JsBarcode(barcodeCanvasRef.current, barcode, {
          format: 'EAN13',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [showBarcode, barcode]);

  const handleSave = async () => {
    setError('');
    
    if (!name.trim()) {
      setError('يرجى إدخال اسم المنتج');
      return;
    }
    if (!barcode.trim()) {
      setError('يرجى إدخال رقم الباركود');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) < 0) {
      setError('يرجى إدخال سعر صحيح');
      return;
    }

    const exists = await barcodeExists(barcode.trim(), editMode ? existingProduct?.id : undefined);
    if (exists) {
      setError('رقم الباركود مسجل مسبقًا لمنتج آخر');
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      const product: Product = {
        id: editMode && existingProduct ? existingProduct.id : generateId(),
        name: name.trim(),
        barcode: barcode.trim(),
        price: Number(price),
        createdAt: editMode && existingProduct ? existingProduct.createdAt : now,
        updatedAt: now,
      };
      await addProduct(product);
      onSaved();
    } catch (e) {
      setError('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBarcode = () => {
    if (!barcodeCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `barcode-${barcode}.png`;
    link.href = barcodeCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="safe-top bg-white px-4 py-3 shrink-0 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="touchable p-2 -mr-2 rounded-lg text-gray-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {editMode ? 'تعديل المنتج' : 'إضافة منتج'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5">
        <div className="space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنتج</label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شيبس ليز كلاسيك"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الباركود</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="أدخل الباركود"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500 transition-colors"
                dir="ltr"
                readOnly={editMode}
              />
              {!editMode && (
                <button
                  onClick={handleGenerateBarcode}
                  className="touchable px-4 py-3 rounded-xl border border-gray-200 text-gray-600 bg-white shrink-0"
                  title="إنشاء باركود"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="3" height="16" /><rect x="7" y="4" width="1" height="16" />
                    <rect x="10" y="4" width="2" height="16" /><rect x="14" y="4" width="1" height="16" />
                    <rect x="17" y="4" width="3" height="16" /><rect x="22" y="4" width="1" height="16" />
                  </svg>
                </button>
              )}
            </div>
            {!editMode && (
              <p className="text-xs text-gray-400 mt-1.5">
                يمكنك إنشاء باركود جديد للمنتجات التي لا تملك باركودًا
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">سعر البيع (د.ع)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500 transition-colors"
              dir="ltr"
              inputMode="numeric"
              min="0"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Generated Barcode Preview */}
          {showBarcode && barcode && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-3">الباركود المُنشأ</p>
              <canvas ref={barcodeCanvasRef} className="mx-auto max-w-full" />
              <p className="text-xs text-gray-400 mt-3 mb-3">
                هذا الرمز تعريفي جديد ولا يُضاف تلقائيًا لقواعد بيانات المتاجر الأخرى
              </p>
              <button
                onClick={handleDownloadBarcode}
                className="touchable px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs bg-gray-50"
              >
                حفظ صورة الباركود
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="safe-bottom bg-white border-t border-gray-100 px-4 py-3 shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="touchable w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-opacity shadow-md"
          style={{ backgroundColor: settings.primaryColor }}
        >
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'حفظ المنتج'}
        </button>
      </div>
    </div>
  );
}
