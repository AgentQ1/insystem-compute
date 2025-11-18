# 🚀 Firebase Deployment Guide

## Prerequisites

You need to have Node.js and Firebase CLI installed on your local machine.

### Install Node.js
```bash
# On macOS (install Homebrew first if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node

# Verify installation
node --version
npm --version
```

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

## 🔥 Firebase Setup

### 1. Login to Firebase
```bash
firebase login
```

### 2. Create a New Firebase Project
Two options:

**Option A: Via Firebase Console (Recommended)**
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: `insystem-compute`
4. Follow the setup wizard
5. Copy your project ID

**Option B: Via CLI**
```bash
firebase projects:create insystem-compute
```

### 3. Link This Repository to Firebase
```bash
cd /private/tmp/insystem-compute
firebase use --add
# Select your project from the list
# Set alias as 'default'
```

## 📦 What Gets Deployed

The Firebase hosting configuration is already set up in `firebase.json`:

- **Public Directory**: `examples/webapp/`
- **Files Deployed**:
  - `index.html` - Main UI
  - `app.js` - Frontend logic (50KB)
  - `styles.css` - Material Design styles (14KB)
  
**Note**: The backend (`gateway_py.py`) won't run on Firebase Hosting (static only). You'll need to:
- Deploy backend to Cloud Run, App Engine, or another server
- Update API endpoints in `app.js` to point to your backend URL

## 🚀 Deploy to Firebase

### Deploy Hosting Only
```bash
cd /private/tmp/insystem-compute
firebase deploy --only hosting
```

### View Your Live Site
After deployment completes, Firebase will provide a URL:
```
Hosting URL: https://insystem-compute.web.app
```

## 🔧 Update API Endpoints

After deploying the backend separately, update the API URL in `examples/webapp/app.js`:

```javascript
// Change from localhost to your backend URL
const API_BASE = 'https://your-backend-url.com/api/v1';
```

## 📝 Configuration Files Created

1. **firebase.json** - Firebase hosting configuration
2. **.firebaserc** - Project settings (created after `firebase use`)

## 🎯 Full Stack Deployment Options

Since this project has a Python backend, consider:

### Option 1: Firebase Hosting + Cloud Run
```bash
# Frontend on Firebase Hosting
firebase deploy --only hosting

# Backend on Cloud Run
gcloud run deploy gateway \
  --source ./gateway \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: Firebase Hosting + App Engine
```bash
# Deploy Python backend to App Engine
gcloud app deploy gateway/app.yaml

# Deploy frontend to Firebase Hosting
firebase deploy --only hosting
```

### Option 3: All-in-One Server (Current Setup)
Keep using the Python FastAPI server that serves both API and static files:
```bash
python3 gateway/gateway_py.py
# Access at http://localhost:8080
```

## 🔍 Testing Before Deploy

Test the webapp locally:
```bash
# Start the gateway
python3 gateway/gateway_py.py

# Visit in browser
open http://localhost:8080
```

## 📚 Additional Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Cloud Run Python Quickstart](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-python-service)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

## ⚠️ Important Notes

1. **Static Files Only**: Firebase Hosting serves static files. The Python backend needs separate hosting.
2. **Model Files**: Large model files (YOLO, LLaVA) won't be deployed with the frontend.
3. **CORS**: Update CORS settings in `gateway_py.py` to allow your Firebase domain.
4. **Environment Variables**: Set API endpoint in production build.

## 🎨 Quick Deploy (Static Demo Only)

If you just want to deploy the UI for demonstration (without working backend):

```bash
firebase login
firebase use --add  # Select your project
firebase deploy --only hosting
```

The UI will work but API calls will fail until you deploy the backend.
