# 🔄 تحديث Frontend على VPS - خطوات مهمة جداً

## ⚠️ المشكلة الحالية:
- Frontend لا يزال يعرض أسماء الملفات بدلاً من `display_name`
- لا يظهر `description`
- لا يظهر `plan_name`

## ✅ الحل: إعادة بناء Frontend

### الخطوات المطلوبة على VPS:

```bash
# 1. الانتقال إلى مجلد المشروع
cd /opt/petrodealhub

# 2. تحديث الكود من GitHub
git pull origin main

# 3. تحديث Submodule
cd document-processor
git pull origin master
cd ..

# 4. ⚠️ مهم جداً: إعادة بناء Frontend
npm install
npm run build

# 5. إعادة تشغيل API
sudo systemctl restart petrodealhub-api

# 6. إعادة تحميل Nginx (لضمان تقديم الملفات الجديدة)
sudo systemctl reload nginx

# 7. مسح Browser Cache (على جهازك)
# اضغط Ctrl+Shift+R أو Ctrl+F5 لإعادة تحميل الصفحة بدون cache
```

## 🔍 للتحقق من أن التحديث نجح:

1. افتح vessel detail page
2. افتح Developer Console (F12)
3. ابحث عن console logs:
   - `✅ User downloadable templates loaded:` - يجب أن يظهر عدد الـ templates
   - `📋 Sample enriched template:` - يجب أن يظهر template مع `display_name`, `description`, `plan_name`
   - `Template "..." rendering data:` - يجب أن يظهر البيانات عند العرض

4. تحقق من أن:
   - ✅ الأسماء المعروضة هي `display_name` وليس `file_name`
   - ✅ يظهر `description` تحت كل template
   - ✅ يظهر `Plan: [plan_name]` إذا كان المستخدم مسجلاً

## 🐛 إذا لم يعمل:

1. تحقق من console logs لمعرفة ما تأتي من API
2. تأكد من أن `npm run build` تم بنجاح (لا توجد أخطاء)
3. تحقق من أن Nginx يقدم الملفات من `dist/` folder
4. امسح browser cache تماماً (Ctrl+Shift+Delete)

## 📝 ملاحظات:

- **مهم جداً**: يجب إعادة بناء Frontend (`npm run build`) بعد كل تحديث للكود
- Frontend code في `src/components/VesselDocumentGenerator.tsx` تم تحديثه
- Backend code في `document-processor/main.py` تم تحديثه أيضاً
- كلاهما يحتاج إلى إعادة تشغيل بعد التحديث

