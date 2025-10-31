# Flask API - دليل الاستخدام

هذا الـ API تم تحويله من Express.js إلى Flask وتم تصميمه للعمل في أي مكان خارج Replit.

## متطلبات التشغيل

```bash
# تثبيت Python (يفضل 3.11+)
python3 --version

# تثبيت المكتبات المطلوبة
pip install flask flask-cors pymongo python-dotenv marshmallow gunicorn
```

## إعدادات قاعدة البيانات

### الطريقة الأولى: MongoDB (مُوصى بها)
1. قم بإنشاء حساب على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. أنشئ Cluster جديد
3. احصل على connection string
4. أضفه في ملف `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
PORT=5000
```

### الطريقة الثانية: ملفات JSON (للتجربة)
إذا لم تضع `MONGODB_URI`، سيستخدم النظام ملفات JSON في مجلد `data/`.

## تشغيل الـ API

### للتطوير (Development)
```bash
python run.py
```

### للإنتاج (Production)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 "api.app:create_app()"
```

## API Endpoints

### 1. تتبع الزوار
**POST** `/api/visitors/track`

```bash
curl -X POST http://localhost:5000/api/visitors/track \
  -H "Content-Type: application/json" \
  -d '{
    "page": "/home",
    "referrer": "https://google.com",
    "userId": "user123"
  }'
```

Response:
```json
{
  "status": "success",
  "message": "Visitor tracked successfully",
  "visitor_id": "uuid-here",
  "metadata": {
    "processing_time": "5ms"
  }
}
```

### 2. إحصائيات الزوار
**GET** `/api/visitors/count?period=today`

Parameters:
- `period`: `today`, `week`, `month`, `year`, `all`

```bash
curl http://localhost:5000/api/visitors/count?period=today
```

Response:
```json
{
  "status": "success",
  "timestamp": "2025-01-31T02:00:00Z",
  "data": {
    "today": 150
  },
  "metadata": {
    "endpoint": "/api/visitors/count",
    "period": "today",
    "processing_time": "12ms"
  }
}
```

### 3. جميع الزوار
**GET** `/api/visitors/all`

```bash
curl http://localhost:5000/api/visitors/all
```

## هيكل المشروع

```
api/
├── __init__.py         # ملف فارغ
├── app.py              # Flask application
├── routes.py           # API endpoints
├── storage.py          # MongoDB & JSON storage
└── schemas.py          # Validation schemas

run.py                  # نقطة البداية
.env.example           # مثال للإعدادات
```

## الفرق بين MongoDB و JSON Storage

| الميزة | MongoDB | JSON Files |
|--------|---------|------------|
| السرعة | سريع جداً | بطيء مع البيانات الكثيرة |
| المرونة | يدعم ملايين السجلات | محدود |
| التوزيع | يعمل على أي سيرفر | يحتاج ملفات محلية |
| الأمان | آمن ومشفر | ليس آمن |

## نشر الـ API

### على أي سيرفر Linux
```bash
# Upload files
scp -r api/ run.py user@server:/path/to/app/

# Install dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "api.app:create_app()"
```

### Docker
يمكنك إنشاء Dockerfile:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install flask flask-cors pymongo python-dotenv marshmallow gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "api.app:create_app()"]
```

## CORS Settings

الـ API يسمح بجميع الطلبات من أي مصدر (`*`). للإنتاج، يُنصح بتحديد الدومين:

في `api/app.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com"],  # حط دومينك هنا
        "methods": ["POST", "GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

## استخدام الـ API من WordPress

```javascript
// في أي صفحة WordPress
fetch('http://your-api-server.com/api/visitors/track', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    page: window.location.pathname,
    referrer: document.referrer
  })
});
```

## الدعم والمساعدة

- Flask Documentation: https://flask.palletsprojects.com/
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Gunicorn: https://docs.gunicorn.org/
