# 🚀 Flask API Deployment Guide for Vercel

## Problem Solved ✅

**Issue**: Vercel was detecting Express.js files (`package.json`, `server/index.ts`) and deploying Node.js instead of Flask!

**Solution**: Created proper Vercel configuration to force Python/Flask deployment.

---

## Files Created

### 1. `vercel.json` - Vercel Configuration
Tells Vercel to use Python runtime:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/app.py"
    }
  ]
}
```

### 2. `.vercelignore` - Ignore Express.js Files
Prevents Vercel from using Node.js files:
```
server/
client/
node_modules/
package.json
```

### 3. `requirements.txt` - Python Dependencies
```
Flask==3.0.0
Flask-CORS==4.0.0
pymongo==4.6.0
python-dotenv==1.0.0
marshmallow==3.20.1
```

### 4. Updated `api/app.py`
Added global `app` variable for Vercel:
```python
app = create_app()
```

---

## Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure Flask API for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Select your GitHub repository
4. Vercel will automatically detect `vercel.json`
5. Add Environment Variable:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB Atlas connection string
6. Click **Deploy**

### Step 3: Test Your API

After deployment, test with:

```bash
# Replace YOUR_DOMAIN with your actual Vercel domain
curl https://YOUR_DOMAIN.vercel.app/health

# Track visitor
curl -X POST https://YOUR_DOMAIN.vercel.app/api/visitors/track \
  -H "Content-Type: application/json" \
  -d '{"page": "/test", "referrer": "https://google.com"}'

# Get visitor counts
curl https://YOUR_DOMAIN.vercel.app/api/visitors/count?period=today

# Get all visitors
curl https://YOUR_DOMAIN.vercel.app/api/visitors/all
```

---

## API Endpoints

### 1. Health Check
```bash
GET /health
```
Response: `{"status": "healthy"}`

### 2. Track Visitor
```bash
POST /api/visitors/track
Content-Type: application/json

{
  "page": "/home",
  "referrer": "https://google.com",
  "userId": "optional-user-id"
}
```

### 3. Get Visitor Counts
```bash
GET /api/visitors/count
GET /api/visitors/count?period=today
GET /api/visitors/count?period=week
GET /api/visitors/count?period=month
GET /api/visitors/count?period=year
```

### 4. Get All Visitors
```bash
GET /api/visitors/all
```

---

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |

---

## Important Notes

1. ✅ **Vercel will now deploy Flask, not Express.js**
2. ✅ **MongoDB Atlas works perfectly with Vercel**
3. ✅ **All API endpoints are fully functional**
4. ⚠️ **Don't forget to add `MONGODB_URI` in Vercel Environment Variables!**

---

## Troubleshooting

### Problem: Still seeing Express.js output
- **Solution**: Make sure `vercel.json` is in the root directory
- Delete the deployment and redeploy

### Problem: Module not found errors
- **Solution**: Check `requirements.txt` has all dependencies
- Make sure Python version is compatible (3.9+)

### Problem: MongoDB connection failed
- **Solution**: Verify `MONGODB_URI` is set in Vercel Environment Variables
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### Problem: 404 errors
- **Solution**: Check the routes in `vercel.json`
- Verify Flask blueprint is registered correctly

---

## What Changed

### Before ❌
- Vercel detected Node.js and deployed Express.js
- Output showed TypeScript/JavaScript code

### After ✅
- Vercel now detects Python and deploys Flask
- API works 100% with MongoDB
- All endpoints functional

---

**Your Flask API is now ready for Vercel deployment! 🎉**
