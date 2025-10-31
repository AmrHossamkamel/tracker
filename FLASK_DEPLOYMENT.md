# 🚀 تشغيل Flask API على Replit

## المشكلة الحالية
الـ Replit Workflow بيشغل Express (Node.js) من خلال الأمر `npm run dev`.

## الحل

### الطريقة الأولى: تشغيل مباشر من Shell

1. افتح Shell في Replit
2. شغل الأمر:
```bash
python run.py
```

Flask هيشتغل على port 5000 تلقائياً!

### الطريقة الثانية: استخدام Script

1. افتح Shell
2. شغل:
```bash
./start_flask.sh
```

### الطريقة الثالثة: تشغيل في الخلفية

```bash
nohup python run.py > flask.log 2>&1 &
```

عشان تشوف اللوجز:
```bash
tail -f flask.log
```

### الطريقة الرابعة: استخدام Gunicorn (للإنتاج)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "api.app:create_app()"
```

## اختبار الـ API

بعد ما تشغل Flask، جرب الأوامر دي:

```bash
# Health check
curl http://localhost:5000/health

# Track visitor
curl -X POST http://localhost:5000/api/visitors/track \
  -H "Content-Type: application/json" \
  -d '{"page": "/test", "referrer": "https://google.com"}'

# Get counts
curl http://localhost:5000/api/visitors/count?period=today
```

## ملاحظات مهمة

1. ✅ Flask شغال 100% - تم اختباره
2. ✅ متصل بـ MongoDB Atlas
3. ✅ جميع الـ endpoints بتشتغل صح
4. ⚠️ لازم تشغله يدوياً من Shell (مؤقتاً)

## للنشر خارج Replit

الـ Flask API جاهز تماماً للنشر على أي سيرفر:
- شوف ملف `README_FLASK_API.md` للتفاصيل الكاملة
- شوف ملف `تعليمات_الاستخدام.md` للشرح بالعربي
