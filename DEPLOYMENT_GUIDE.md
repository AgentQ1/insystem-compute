# 🚀 Full Stack Deployment Guide

## Current Status

✅ **Frontend Deployed**: https://insystem-compute-ai.web.app
❌ **Backend**: Requires separate hosting (Cloud Run needs billing)

## Solution: Run Backend Locally + Firebase Frontend

### Option 1: Local Backend (Recommended for Testing)

1. **Start Backend Server**:
```bash
cd /private/tmp/insystem-compute
./start_backend.sh
```

2. **Access Full App**:
- Frontend: https://insystem-compute-ai.web.app
- Configure browser to allow CORS or use local: http://localhost:8080

### Option 2: Deploy to Your Own Server

Deploy the backend to any server with Python:

```bash
# On your server
git clone https://github.com/AgentQ1/insystem-compute
cd insystem-compute
pip install fastapi uvicorn python-multipart llama-cpp-python ultralytics opencv-python pillow
cd gateway
python3 gateway_py.py
```

Then update `examples/webapp/config.js`:
```javascript
API_BASE: 'https://your-server.com/api/v1'
```

### Option 3: Cloud Run (Requires Billing)

Enable billing on your Google Cloud project, then:

```bash
gcloud run deploy insystem-compute-backend \
  --source ./gateway \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi
```

## Quick Local Testing

```bash
# Terminal 1: Start backend
cd /private/tmp/insystem-compute
python3 gateway/gateway_py.py

# Terminal 2: Open browser
open http://localhost:8080
```

## What's Deployed

✅ Frontend on Firebase:
- UI (Material Design)
- All static assets
- https://insystem-compute-ai.web.app

⚠️ Backend needs:
- Python server
- YOLO model (6MB)
- LLaVA model (3.8GB)  
- CLIP model (596MB)

## Alternative: All-in-One Local

Just run the backend server - it serves both frontend and API:

```bash
python3 gateway/gateway_py.py
# Visit: http://localhost:8080
```

This works exactly like before!

## Notes

- Firebase Hosting is free (frontend only)
- Cloud Run requires billing ($$$)
- Local backend is free and fully functional
- Models need to be downloaded on the backend server
