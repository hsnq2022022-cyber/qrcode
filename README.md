# سعري - ماسح الأسعار

تطبيق احترافي لأصحاب المحلات التجارية لقراءة الباركود وعرض الأسعار مباشرة، يعمل بدون إنترنت.

## المميزات

- 📷 **مسح الباركود بالكاميرا** - يدعم EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39
- 💾 **تخزين محلي كامل** - جميع البيانات محفوظة على الجهاز باستخدام IndexedDB
- 🌐 **يعمل بدون إنترنت** - لا يحتاج أي اتصال بالإنترنت بعد التثبيت
- 🏪 **تخصيص المحل** - إضافة اسم المحل وشعاره ولون مميز
- 📊 **إنشاء باركود** - إنشاء باركود EAN-13 للمنتجات التي لا تملك باركود
- 💿 **نسخ احتياطي** - تصدير واستيراد البيانات كملف JSON
- 📱 **واجهة عربية** - تصميم RTL احترافي مناسب للهواتف

## المتطلبات

- Node.js 18+
- npm أو yarn

## التثبيت والتشغيل

```bash
# تثبيت المكتبات
npm install

# تشغيل بيئة التطوير
npm run dev

# بناء المشروع للإنتاج
npm run build
```

## البناء للتطبيق

### الملفات الناتجة

بعد تنفيذ `npm run build`، ستجد الملفات في مجلد `dist/`:
- `dist/index.html` - الصفحة الرئيسية
- `dist/assets/` - ملفات CSS و JavaScript

### التحويل إلى APK

لتحويل المشروع إلى تطبيق Android:

1. أنشئ مشروع Android Studio جديد مع WebView
2. انقل ملفات `dist/` إلى مجلد `assets/` في مشروع Android
3. أضف الأذونات المطلوبة في `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

4. أضف معالجة الأذونات في `WebChromeClient`:

```java
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onPermissionRequest(final PermissionRequest request) {
        if (Arrays.asList(request.getResources()).contains("android.permission.CAMERA")) {
            request.grant(request.getResources());
        }
    }
});
```

5. فعّل JavaScript والوصول للكاميرا:

```java
WebSettings settings = webView.getSettings();
settings.setJavaScriptEnabled(true);
settings.setDomStorageEnabled(true);
settings.setMediaPlaybackRequiresUserGesture(false);
```

## المكتبات المستخدمة

| المكتبة | الإصدار | الغرض | الترخيص |
|---------|---------|-------|---------|
| React | 18.x | واجهة المستخدم | MIT |
| TypeScript | 5.x | لغة البرمجة | Apache-2.0 |
| Vite | 6.x | أداة البناء | MIT |
| Tailwind CSS | 4.x | تنسيق الواجهة | MIT |
| html5-qrcode | 2.x | مسح الباركود بالكاميرا | Apache-2.0 / MIT |
| JsBarcode | 3.x | إنشاء الباركود | MIT |
| idb | 8.x | واجهة IndexedDB | ISC |

## هيكل المشروع

```
├── index.html              # الصفحة الرئيسية
├── src/
│   ├── main.tsx            # نقطة الدخول
│   ├── App.tsx             # المكون الرئيسي
│   ├── types.ts            # أنواع TypeScript
│   ├── db.ts               # طبقة قاعدة البيانات (IndexedDB)
│   ├── index.css           # الأنماط العامة
│   ├── components/
│   │   └── BottomNav.tsx   # شريط التنقل السفلي
│   └── screens/
│       ├── ScannerScreen.tsx    # شاشة المسح
│       ├── ProductsScreen.tsx   # قائمة المنتجات
│       ├── AddProductScreen.tsx # إضافة/تعديل منتج
│       └── SettingsScreen.tsx   # الإعدادات
├── package.json
├── tsconfig.json
└── vite.config.js
```

## ملاحظات تقنية

### الكاميرا في WebView

- يجب إضافة إذن `CAMERA` في `AndroidManifest.xml`
- يجب معالجة `WebChromeClient.onPermissionRequest` للسماح بالكاميرا
- يجب تعطيل `setMediaPlaybackRequiresUserGesture` لتشغيل الكاميرا تلقائيًا
- في بعض أجهزة Android، قد تحتاج `WebView.setMixedContentMode(MIXED_CONTENT_ALWAYS_ALLOW)`

### التخزين المحلي

- يستخدم التطبيق IndexedDB كمخزن أساسي
- البيانات تبقى محفوظة بعد إغلاق التطبيق
- لا يعتمد على localStorage للبيانات الأساسية
- يدعم التصدير والاستيراد كملف JSON

### العمل بدون إنترنت

- جميع ملفات JavaScript و CSS مضمنة في البناء
- لا يتم تحميل أي مورد من CDN
- الخطوط تستخدم خطوط النظام الافتراضية
- مكتبة المسح مضمنة بالكامل

## الترخيص

هذا المشروع مفتوح المصدر للاستخدام الشخصي والتجاري.
