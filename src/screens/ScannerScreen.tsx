import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, StoreSettings } from '../types';
import { getProductByBarcode, getAllProducts } from '../db';

interface ScannerScreenProps {
  settings: StoreSettings;
  onAddProduct: (barcode: string) => void;
}

export default function ScannerScreen({ settings, onAddProduct }: ScannerScreenProps) {
  const [scanResult, setScanResult] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasProducts, setHasProducts] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStartingRef = useRef(false);

  // Check if there are any products
  useEffect(() => {
    getAllProducts().then(products => {
      setHasProducts(products.length > 0);
    });
  }, []);

  const handleScan = useCallback(async (barcode: string) => {
    const now = Date.now();
    // Prevent duplicate scans within 3 seconds
    if (barcode === lastScannedRef.current && now - lastScanTimeRef.current < 3000) {
      return;
    }
    lastScannedRef.current = barcode;
    lastScanTimeRef.current = now;

    const product = await getProductByBarcode(barcode);
    if (product) {
      setScanResult(product);
      setNotFound(null);
      // Clear result after 5 seconds
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
      } catch (e) {
        // Ignore stop errors
      }
      try {
        scannerRef.current.clear();
      } catch (e) {
        // Ignore clear errors
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
    
    try {
      setCameraError(null);
      setPermissionDenied(false);
      
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

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 140 },
        aspectRatio: 1.777,
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {} // Ignore scan errors
      );

      scannerRef.current = scanner;
      setIsScanning(true);
    } catch (err: any) {
      const errMsg = err?.toString() || '';
      console.error('Camera error:', err);
      
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission') || errMsg.includes('permission')) {
        setPermissionDenied(true);
        setCameraError('لم يتم السماح بالوصول إلى الكاميرا. يرجى تفعيل الإذن من إعدادات الهاتف.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('NotFound') || errMsg.includes('not found')) {
        setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
      } else if (errMsg.includes('OverconstrainedError')) {
        setCameraError('الكاميرا لا تدعم الإعدادات المطلوبة.');
      } else {
        setCameraError('تعذر تشغيل الكاميرا. يمكنك إدخال الباركود يدويًا.');
      }
      setShowManual(true);
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
  }, []); // Only run on mount/unmount

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    await handleScan(manualInput.trim());
    setManualInput('');
  };

  const toggleFlash = async () => {
    // Flash control through html5-qrcode is limited
    // This is a visual toggle only - actual flash requires native Android code
    setFlashOn(!flashOn);
  };

  const requestCameraPermission = async () => {
    setPermissionDenied(false);
    setCameraError(null);
    await startScanner();
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Header */}
      <div className="safe-top bg-gray-900/90 backdrop-blur-sm z-20 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {settings.logo ? (
            <img src={settings.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: settings.primaryColor }}>
              {settings.storeName ? settings.storeName.charAt(0) : 'س'}
            </div>
          )}
          <span className="text-white font-semibold text-sm">
            {settings.storeName || 'سعري'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFlash}
            className="p-2 rounded-full text-white/80 hover:text-white transition-colors btn-press"
            title="الفلاش"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={flashOn ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </button>
          <button
            onClick={() => setShowManual(!showManual)}
            className={`p-2 rounded-full transition-colors btn-press ${showManual ? 'text-teal-400' : 'text-white/80 hover:text-white'}`}
            title="إدخال يدوي"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <div id="scanner-container" className="absolute inset-0" />
        
        {/* Scanner Frame Overlay */}
        {!cameraError && (
          <div className="scanner-overlay">
            <div className="scanner-frame" />
          </div>
        )}

        {/* Permission Denied State */}
        {permissionDenied && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center z-10">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M1 1h22v22H1z" strokeDasharray="4 2" />
                <path d="M1 1l22 22" stroke="#ef4444" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-4 max-w-[250px]">{cameraError}</p>
            <button
              onClick={requestCameraPermission}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-medium btn-press"
              style={{ backgroundColor: settings.primaryColor }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Camera Error (not permission) */}
        {cameraError && !permissionDenied && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center z-10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="mb-4">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p className="text-gray-300 text-sm mb-4 max-w-[250px]">{cameraError}</p>
          </div>
        )}

        {/* Manual Input Panel */}
        {showManual && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm rounded-t-2xl p-4 z-30 shadow-lg animate-slide-up">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="أدخل رقم الباركود..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500"
                dir="ltr"
                autoFocus
              />
              <button
                onClick={handleManualSearch}
                className="px-4 py-3 rounded-xl text-white text-sm font-medium btn-press"
                style={{ backgroundColor: settings.primaryColor }}
              >
                بحث
              </button>
            </div>
            <button
              onClick={() => setShowManual(false)}
              className="mt-2 text-xs text-gray-400 btn-press"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* First time hint */}
        {!hasProducts && !scanResult && !notFound && !showManual && !cameraError && (
          <div className="absolute bottom-24 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 z-10 shadow-lg text-center animate-fade-in">
            <p className="text-gray-700 text-sm mb-1">مرحبًا بك 👋</p>
            <p className="text-gray-500 text-xs">اضغط على "إضافة" في الأسفل لتسجيل أول منتج</p>
          </div>
        )}
      </div>

      {/* Result Panel */}
      {(scanResult || notFound) && (
        <div className="bg-white rounded-t-2xl shadow-2xl z-20 animate-slide-up shrink-0">
          {scanResult ? (
            <div className="p-4 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-600 text-xs font-medium">تم العثور على المنتج</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{scanResult.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black" style={{ color: settings.primaryColor }}>
                  {scanResult.price.toLocaleString('ar-IQ')}
                </span>
                <span className="text-gray-500 text-sm font-medium">د.ع</span>
              </div>
              <p className="text-gray-400 text-xs mt-2" dir="ltr">#{scanResult.barcode}</p>
            </div>
          ) : (
            <div className="p-4 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-amber-600 text-xs font-medium">المنتج غير مسجل</span>
              </div>
              <p className="text-gray-500 text-sm mb-3" dir="ltr">#{notFound}</p>
              <button
                onClick={() => onAddProduct(notFound!)}
                className="w-full py-3 rounded-xl text-white font-medium text-sm btn-press"
                style={{ backgroundColor: settings.primaryColor }}
              >
                إضافة المنتج
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scanning indicator */}
      {isScanning && !scanResult && !notFound && !showManual && !cameraError && (
        <div className="absolute bottom-20 left-0 right-0 text-center z-10">
          <span className="text-white/70 text-xs bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
            وجّه الكاميرا نحو الباركود
          </span>
        </div>
      )}
    </div>
  );
}
