import { useState, useRef } from 'react';
import { StoreSettings } from '../types';
import { saveSettings, exportBackup, importBackup } from '../db';

interface SettingsScreenProps {
  settings: StoreSettings;
  onSettingsSaved: () => void;
}

const COLORS = [
  { name: 'تركوازي', value: '#0d9488' },
  { name: 'أخضر داكن', value: '#065f46' },
  { name: 'أزرق', value: '#2563eb' },
  { name: 'بنفسجي', value: '#7c3aed' },
  { name: 'برتقالي', value: '#ea580c' },
  { name: 'وردي', value: '#db2777' },
];

export default function SettingsScreen({ settings, onSettingsSaved }: SettingsScreenProps) {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [logo, setLogo] = useState<string | null>(settings.logo);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'حجم الصورة كبير جدًا (الحد الأقصى 2 ميجابايت)', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogo(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings({ storeName: storeName.trim(), logo, primaryColor });
      onSettingsSaved();
      setMessage({ text: 'تم حفظ الإعدادات بنجاح', type: 'success' });
    } catch (e) {
      setMessage({ text: 'حدث خطأ أثناء الحفظ', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `saari-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ text: 'تم تصدير النسخة الاحتياطية بنجاح', type: 'success' });
    } catch (e) {
      setMessage({ text: 'فشل تصدير النسخة الاحتياطية', type: 'error' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      const result = await importBackup(content);
      setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
      if (result.success) {
        onSettingsSaved();
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="safe-top bg-white border-b border-gray-100 px-4 py-3 shrink-0">
        <h1 className="text-base font-bold text-gray-900">الإعدادات</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="space-y-5">
          {/* Store Identity Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">هوية المحل</h2>
            
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                {logo ? (
                  <img src={logo} alt="شعار" className="w-full h-full object-cover" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium btn-press"
                  style={{ color: primaryColor }}
                >
                  {logo ? 'تغيير الشعار' : 'اختيار شعار'}
                </button>
                {logo && (
                  <button
                    onClick={() => setLogo(null)}
                    className="block text-xs text-red-500 mt-1 btn-press"
                  >
                    إزالة الشعار
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">اسم المحل</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: محل أبو أحمد"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Color Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">اللون الأساسي</h2>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className="w-10 h-10 rounded-full border-2 transition-all btn-press flex items-center justify-center"
                  style={{
                    backgroundColor: color.value,
                    borderColor: primaryColor === color.value ? color.value : 'transparent',
                    boxShadow: primaryColor === color.value ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : 'none',
                  }}
                  title={color.name}
                >
                  {primaryColor === color.value && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">معاينة</h2>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              {logo ? (
                <img src={logo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: primaryColor }}>
                  {storeName ? storeName[0] : 'س'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{storeName || 'سعري'}</p>
                <p className="text-xs text-gray-400">ماسح الأسعار</p>
              </div>
            </div>
          </div>

          {/* Backup Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">النسخ الاحتياطي</h2>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 btn-press flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                تصدير نسخة احتياطية
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 btn-press flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                استيراد نسخة احتياطية
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm btn-press disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>

          {/* App Info */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">سعري - ماسح الأسعار</p>
            <p className="text-xs text-gray-300 mt-1">الإصدار 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
