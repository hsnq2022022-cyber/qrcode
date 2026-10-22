import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, StoreSettings } from '../types';
import { getProductByBarcode, getAllProducts } from '../db';

interface ScannerScreenProps {
  settings: StoreSettings;
  onAddProduct: (barcode: string) => void;
  onOpenSettings: () => void;
}

export default function ScannerScreen({ settings, onAddProduct, onOpenSettings }: ScannerScreenProps) {
  const [scanResult, setScanResult] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStartingRef = useRef(false);

  const handleScan = useCallback(async (barcode: string) => {
    const now = Date.now();
    if (barcode === lastScannedRef.current && now - lastScanTimeRef.current < 3000) {
      return;
    }
    lastScannedRef.current = barcode;
    lastScanTimeRef.current = now;

    const product = await getProductByBarcode(barcode);
    if (product) {
      setScanResult(product);
      setNotFound(null);
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = setTimeout(() => {
        setScanResult(null);
      }, 5000);
    } else {
      setNotFound(barcode);
      setScanResult(null);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      try {
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
    
    try {
      setCameraError(null);
      
      const scanner = new Html5Qrcode('scanner-container', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 140 },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );

      scannerRef.current = scanner;
      setIsScanning(true);
    } catch (err: any) {
      const errMsg = err?.toString() || '';
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('permission');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('NotFound')) {
        setCameraError('notfound');
      } else {
        setCameraError('other');
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [handleScan]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    await handleScan(manualInput.trim());
    setManualInput('');
    setShowManual(false);
  };

  const retryCamera = async () => {
    setCameraError(null);
    await startScanner();
  };

  return (
    <div className="w-full h-full flex flex-col bg-black relative overflow-hidden">
      {/* Header */}
      <div className="safe-top absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {settings.logo ? (
              <img src={settings.logo} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/20"
                style={{ backgroundColor: settings.primaryColor }}>
                {settings.storeName ? settings.storeName.charAt(0) : 'س'}
              </div>
            )}
            <span className="text-white font-semibold text-sm">
              {settings.storeName || 'سعري'}
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="touchable w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <div id="scanner-container" className="absolute inset-0" />
        
        {/* Scanner Frame */}
        {!cameraError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="scanner-frame">
              <div className="scanner-corners-bottom absolute inset-0" />
              <div className="scan-line" />
            </div>
          </div>
        )}

        {/* Camera Permission Error */}
        {cameraError === 'permission' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">نحتاج إلى إذن الكاميرا</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-[260px]">اسمح باستخدام الكاميرا لقراءة الباركود</p>
            <button
              onClick={retryCamera}
              className="touchable px-6 py-3 rounded-xl text-white font-medium text-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              إعادة المحاولة
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="touchable mt-3 text-gray-400 text-sm"
            >
              إدخال الباركود يدويًا
            </button>
          </div>
        )}

        {/* Other Camera Errors */}
        {cameraError && cameraError !== 'permission' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              {cameraError === 'notfound' ? 'لا توجد كاميرا' : 'تعذر تشغيل الكاميرا'}
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-[260px]">
              {cameraError === 'notfound' ? 'لم يتم العثور على كاميرا في هذا الجهاز' : 'يمكنك إدخال الباركود يدويًا'}
            </p>
            <button
              onClick={() => setShowManual(true)}
              className="touchable px-6 py-3 rounded-xl text-white font-medium text-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              إدخال الباركود يدويًا
            </button>
          </div>
        )}

        {/* Instruction */}
        {!cameraError && !scanResult && !notFound && isScanning && (
          <div className="absolute bottom-24 left-0 right-0 text-center pointer-events-none">
            <span className="text-white/80 text-xs bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
              وجّه الكاميرا نحو الباركود
            </span>
          </div>
        )}

        {/* Manual Input */}
        {showManual && (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 z-40 slide-up shadow-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="أدخل رقم الباركود..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-teal-500 focus:bg-white"
                dir="ltr"
                autoFocus
              />
              <button
                onClick={handleManualSearch}
                className="touchable px-5 py-3 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: settings.primaryColor }}
              >
                بحث
              </button>
            </div>
            <button
              onClick={() => setShowManual(false)}
              className="touchable mt-2 text-gray-400 text-xs w-full text-center py-1"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      {/* Price Result Panel */}
      {scanResult && (
        <div className="bg-white rounded-t-3xl shadow-2xl z-20 slide-up">
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-600 text-xs font-medium">تم العثور على المنتج</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{scanResult.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="price-display text-4xl font-black" style={{ color: settings.primaryColor }}>
                {scanResult.price.toLocaleString('ar-IQ')}
              </span>
              <span className="text-gray-500 text-base font-medium">د.ع</span>
            </div>
          </div>
        </div>
      )}

      {/* Not Found Panel */}
      {notFound && (
        <div className="bg-white rounded-t-3xl shadow-2xl z-20 slide-up">
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-600 text-xs font-medium">المنتج غير مسجل</span>
            </div>
            <p className="text-gray-500 text-sm mb-4" dir="ltr">#{notFound}</p>
            <button
              onClick={() => onAddProduct(notFound)}
              className="touchable w-full py-3.5 rounded-xl text-white font-medium text-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              إضافة المنتج
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Button */}
      {!showManual && !cameraError && !scanResult && !notFound && (
        <div className="absolute bottom-20 left-4 right-4 z-20">
          <button
            onClick={() => setShowManual(true)}
            className="touchable w-full py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white text-xs font-medium border border-white/20"
          >
            إدخال الباركود يدويًا
          </button>
        </div>
      )}
    </div>
  );
}
