# سعري - ماسح الأسعار

تطبيق ويب احترافي لأصحاب المحلات التجارية لقراءة الباركود وعرض الأسعار مباشرة، يعمل بدون إنترنت.

## المميزات

- 📷 **مسح الباركود بالكاميرا** - يدعم EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39
- 💾 **تخزين محلي كامل** - جميع البيانات محفوظة على الجهاز باستخدام IndexedDB
- 🌐 **يعمل بدون إنترنت** - لا يحتاج أي اتصال بالإنترنت بعد التثبيت
- 🏪 **تخصيص المحل** - إضافة اسم المحل وشعاره ولون مميز
- 📊 **إنشاء باركود** - إنشاء باركود EAN-13 للمنتجات التي لا تملك باركود
- 💿 **نسخ احتياطي** - تصدير واستيراد البيانات كملف JSON
- 📱 **واجهة عربية** - تصميم RTL احترافي مناسب للهواتف

## التشغيل

### للتطوير المحلي

```bash
# تثبيت المكتبات
npm install

# تشغيل خادم التطوير
npm run dev
```

ثم افتح المتصفح على: `http://localhost:3000`

### للبناء والإنتاج

```bash
# بناء المشروع
npm run build
```

سيتم إنشاء مجلد `dist/` يحتوي على الملفات الجاهزة للنشر:
- `dist/index.html` - الصفحة الرئيسية
- `dist/assets/` - ملفات CSS و JavaScript

## النشر

### على خادم ويب

انقل محتويات مجلد `dist/` إلى خادم الويب الخاص بك.

### في Android WebView

1. انشئ مشروع Android Studio جديد مع WebView
2. انقل ملفات `dist/` إلى مجلد `assets/` في مشروع Android
3. أضف الأذونات المطلوبة في `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
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

## Important Note / ملاحظة مهمة

**Do not open `index.html` from the project root directly in a browser.** This file references TypeScript source files (`./src/main.tsx`) which require Vite's development server to transform them.

**لا تفتح `index.html` من جذر المشروع مباشرة في المتصفح.** هذا الملف يشير إلى ملفات TypeScript الخام (`./src/main.tsx`) التي تحتاج إلى خادم Vite لتحويلها.

### Correct Usage / الاستخدام الصحيح

- **For development / للتطوير**: Use `npm run dev` and open `http://localhost:3000`
- **For production / للإنتاج**: Open `dist/index.html` or serve the `dist/` folder

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
├── index.html              # نقطة الدخول للتطوير (Vite dev server)
├── dist/                   # الملفات المبنية للإنتاج
│   ├── index.html          # الصفحة الرئيسية المبنية
│   └── assets/             # ملفات CSS و JavaScript
├── src/
│   ├── main.tsx            # نقطة الدخول الرئيسية
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
