# دليل تشخيص المشاكل - Troubleshooting Guide

## المشاكل الحالية:
1. ❌ الحذف لا يعمل بشكل صحيح (القوالب تعود بعد الحذف)
2. ❌ الوصف (Description) وعداد التحميلات لا تظهر في Frontend

---

## خطوات التشخيص والحل:

### 1. تحديث الكود على VPS:

```bash
# 1. تحديث المشروع الرئيسي
cd /opt/petrodealhub
git pull origin main

# 2. تحديث Submodule
cd document-processor
git pull origin master
cd ..

# 3. التحقق من أن الملفات محدثة
ls -la document-processor/storage/deleted_templates.json
cat document-processor/storage/deleted_templates.json
```

---

### 2. فحص مشكلة الحذف:

#### أ. التحقق من ملف deleted_templates.json:
```bash
cd /opt/petrodealhub/document-processor
cat storage/deleted_templates.json

# إذا لم يكن موجوداً، أنشئه:
echo '{"deleted_templates": [], "last_updated": ""}' > storage/deleted_templates.json
chmod 644 storage/deleted_templates.json
```

#### ب. فحص Logs عند الحذف:
```bash
# راقب logs API عند الحذف
sudo journalctl -u petrodealhub-api -f

# أو عرض آخر 100 سطر
sudo journalctl -u petrodealhub-api -n 100 --no-pager

# فحص logs CMS
sudo journalctl -u petrodealhub-cms -n 100 --no-pager
```

#### ج. التحقق من أن الحذف يعمل:
```bash
# بعد الحذف، تحقق من:
# 1. هل تم حذف القالب من Supabase؟
curl -X GET "https://petrodealhub.com/api/templates" -H "Content-Type: application/json" | jq '.templates[] | select(.name == "TEMPLATE_NAME.docx")'

# 2. هل تم إضافته إلى deleted_templates.json؟
cat document-processor/storage/deleted_templates.json | jq '.deleted_templates'

# 3. هل الملف المحلي تم حذفه؟
ls -la document-processor/templates/ | grep TEMPLATE_NAME
```

---

### 3. فحص مشكلة Frontend (الوصف وعداد التحميلات):

#### أ. إعادة بناء Frontend (مهم جداً!):
```bash
cd /opt/petrodealhub

# حذف node_modules و package-lock.json إذا كان هناك مشاكل
# rm -rf node_modules package-lock.json

# تثبيت dependencies
npm install

# إعادة البناء
npm run build

# التحقق من أن البناء نجح
ls -la dist/assets/ | head -10
```

#### ب. فحص Console في المتصفح:
1. افتح صفحة تفاصيل السفينة
2. اضغط `F12` لفتح Developer Tools
3. افتح تبويب `Console`
4. ابحث عن:
   - `Template loaded:` - يجب أن يعرض البيانات
   - `description:` - يجب أن يحتوي على الوصف
   - `remaining_downloads:` - يجب أن يعرض العدد المتبقي
   - `Download limits for:` - يجب أن يعرض معلومات الحدود

#### ج. فحص Network Requests:
1. في Developer Tools، افتح تبويب `Network`
2. ابحث عن:
   - `/api/user-downloadable-templates` (إذا كان المستخدم مسجل دخول)
   - `/api/templates` (إذا لم يكن مسجل دخول)
3. انقر على الطلب وافحص:
   - `Response` - هل البيانات موجودة؟
   - `description` في response؟
   - `remaining_downloads` في response؟

#### د. مسح Cache المتصفح:
```bash
# على المتصفح:
# 1. اضغط Ctrl+Shift+Delete
# 2. اختر "Cached images and files"
# 3. اضغط "Clear data"

# أو افتح في وضع Incognito/Private
```

---

### 4. فحص API Response:

#### أ. اختبار endpoint مباشرة:
```bash
# إذا كان المستخدم مسجل دخول، اختبر:
curl -X POST "https://petrodealhub.com/api/user-downloadable-templates" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{"user_id": "YOUR_USER_ID"}' | jq '.'

# أو بدون تسجيل دخول:
curl -X GET "https://petrodealhub.com/api/templates" \
  -H "Content-Type: application/json" | jq '.templates[0]'
```

#### ب. التحقق من أن API يرسل البيانات بشكل صحيح:
```bash
# تحقق من logs API
sudo journalctl -u petrodealhub-api -n 100 --no-pager | grep -i "template\|description\|download"
```

---

### 5. فحص Supabase Database:

```bash
# إذا كان لديك access إلى Supabase:
# 1. تحقق من أن القوالب لها description في database
# 2. تحقق من أن plan_template_permissions موجودة
# 3. تحقق من أن user subscriptions صحيحة
```

---

### 6. إعادة تشغيل الخدمات:

```bash
# إعادة تشغيل API و CMS
sudo systemctl restart petrodealhub-api
sudo systemctl restart petrodealhub-cms

# التحقق من حالة الخدمات
sudo systemctl status petrodealhub-api
sudo systemctl status petrodealhub-cms

# إعادة تحميل Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

### 7. التحقق من الملفات المحدثة:

```bash
# التحقق من أن Frontend محدث:
cd /opt/petrodealhub
ls -lth dist/assets/*.js | head -5

# التحقق من أن Backend محدث:
cd document-processor
git log --oneline -5

# التحقق من أن main.py يحتوي على التحديثات:
grep -n "mark_template_as_deleted\|get_deleted_templates" main.py
```

---

## حلول سريعة:

### إذا كانت مشكلة الحذف:
```bash
# إنشاء ملف deleted_templates.json إذا لم يكن موجوداً
cd /opt/petrodealhub/document-processor
mkdir -p storage
echo '{"deleted_templates": [], "last_updated": ""}' > storage/deleted_templates.json

# إعادة تشغيل API و CMS
sudo systemctl restart petrodealhub-api
sudo systemctl restart petrodealhub-cms
```

### إذا كانت مشكلة Frontend:
```bash
# إعادة بناء Frontend
cd /opt/petrodealhub
npm run build

# مسح cache Nginx (إذا كان يستخدم cache)
sudo rm -rf /var/cache/nginx/*

# إعادة تحميل Nginx
sudo systemctl reload nginx
```

---

## التحقق النهائي:

بعد تطبيق كل الخطوات، تحقق من:

1. ✅ الحذف: حذف قالب وتحقق من أنه لا يعود بعد Refresh
2. ✅ الوصف: افتح صفحة تفاصيل السفينة وتحقق من ظهور الوصف
3. ✅ عداد التحميلات: تحقق من ظهور "Downloads: X / Y" للمستخدمين المسجلين
4. ✅ Console: افتح Console وتحقق من عدم وجود أخطاء

---

## إذا استمرت المشكلة:

1. أرسل logs من:
   - `sudo journalctl -u petrodealhub-api -n 100 --no-pager`
   - `sudo journalctl -u petrodealhub-cms -n 100 --no-pager`
   - Browser Console
   - Network tab في Browser
   
2. أرسل response من:
   - `/api/user-downloadable-templates` أو `/api/templates`
   - ملف `deleted_templates.json`

3. وصف الخطوات التي قمت بها والمشكلة بالضبط

