# 🚀 Quick Firebase Deployment

## Project Setup
- **Project ID**: `insystem-compute-ai`
- **Display Name**: InSystem Compute AI
- **Configuration**: Ready in `.firebaserc` and `firebase.json`

## Deploy Now

### Option 1: Automated Script (Recommended)
```bash
./deploy.sh
```

### Option 2: Manual Commands
```bash
# Create project (if doesn't exist)
firebase projects:create insystem-compute-ai --display-name "InSystem Compute AI"

# Link project
firebase use insystem-compute-ai

# Deploy
firebase deploy --only hosting
```

## After Deployment

Your app will be live at:
- **Main URL**: https://insystem-compute-ai.web.app
- **Alt URL**: https://insystem-compute-ai.firebaseapp.com

## Current Setup

✅ Firebase configuration ready
✅ Webapp files in `examples/webapp/`
✅ Deployment script created
✅ Pushed to GitHub

## What Gets Deployed

- `index.html` - Main UI (29KB)
- `app.js` - Frontend logic (50KB)  
- `styles.css` - Material Design styles (14KB)
- `config.js` - API configuration

## ⚠️ Important

The Python backend (gateway_py.py) is NOT deployed with Firebase Hosting.

You'll need to either:
1. Keep running backend locally: `python3 gateway/gateway_py.py`
2. Deploy backend to Cloud Run/App Engine (see FIREBASE_DEPLOY.md)
3. Update API endpoint in `config.js` to point to your backend server

## Quick Test

After deployment:
```bash
curl https://insystem-compute-ai.web.app
```

Should return the HTML page.
