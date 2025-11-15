# حل سريع للمشاكل - Quick Fix

## ⚡ تحديث سريع على VPS:

```bash
cd /opt/petrodealhub

# 1. تحديث الكود
git pull origin main
cd document-processor && git pull origin master && cd ..

# 2. إنشاء ملف deleted_templates.json إذا لم يكن موجوداً
mkdir -p document-processor/storage
[ ! -f document-processor/storage/deleted_templates.json ] && \
  echo '{"deleted_templates": [], "last_updated": ""}' > document-processor/storage/deleted_templates.json

# 3. إعادة بناء Frontend (مهم جداً!)
npm install
npm run build

# 4. إعادة تشغيل الخدمات
sudo systemctl restart petrodealhub-api
sudo systemctl restart petrodealhub-cms

# 5. التحقق من الحالة
sudo systemctl status petrodealhub-api
sudo systemctl status petrodealhub-cms

# 6. فحص Logs
sudo journalctl -u petrodealhub-api -n 50 --no-pager
sudo journalctl -u petrodealhub-cms -n 50 --no-pager
```

---

## 🔍 التحقق السريع:

### 1. فحص Frontend:
```bash
# افتح المتصفح وافتح Developer Console (F12)
# في Console ابحث عن:
# - "Template loaded:"
# - "description:"
# - "remaining_downloads:"
```

### 2. فحص الحذف:
```bash
# بعد حذف قالب:
cat document-processor/storage/deleted_templates.json

# يجب أن يحتوي على القالب المحذوف
```

### 3. فحص API:
```bash
# اختبر API مباشرة
curl -X GET "https://petrodealhub.com/api/templates" | jq '.templates[0] | {name, description, remaining_downloads}'
```

---

## ⚠️ إذا لم تعمل بعد:

1. **مسح Cache المتصفح**: Ctrl+Shift+Delete → Clear Cache
2. **فتح في Incognito**: لاختبار بدون cache
3. **فحص Console**: ابحث عن أخطاء JavaScript
4. **فحص Network Tab**: تأكد من أن API يرجع البيانات بشكل صحيح

---

## 📝 Checklist:

- [ ] تم تحديث الكود (`git pull`)
- [ ] تم تحديث Submodule (`cd document-processor && git pull`)
- [ ] ملف `deleted_templates.json` موجود
- [ ] تم إعادة بناء Frontend (`npm run build`)
- [ ] تم إعادة تشغيل API (`sudo systemctl restart petrodealhub-api`)
- [ ] تم إعادة تشغيل CMS (`sudo systemctl restart petrodealhub-cms`)
- [ ] تم مسح Cache المتصفح
- [ ] فتح Console وفحص البيانات
- [ ] فتح Network Tab وفحص API response

