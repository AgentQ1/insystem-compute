#!/bin/bash

# Firebase Deployment Script
# Run this to deploy to Firebase Hosting

set -e

echo "🚀 InSystem Compute - Firebase Deployment"
echo "=========================================="
echo ""

# Check if firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
echo "✓ Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || {
    echo "❌ Not logged in to Firebase"
    echo "Run: firebase login"
    exit 1
}

echo "✓ Firebase CLI ready"
echo ""

# Create project if it doesn't exist
PROJECT_ID="insystem-compute-ai"
echo "📦 Checking project: $PROJECT_ID"

if firebase projects:list | grep -q "$PROJECT_ID"; then
    echo "✓ Project exists"
else
    echo "Creating new Firebase project..."
    firebase projects:create "$PROJECT_ID" --display-name "InSystem Compute AI"
    echo "✓ Project created"
fi

echo ""

# Link project
echo "🔗 Linking project..."
firebase use "$PROJECT_ID"
echo "✓ Project linked"
echo ""

# Deploy
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app is live at:"
echo "https://$PROJECT_ID.web.app"
echo "https://$PROJECT_ID.firebaseapp.com"
echo ""
echo "⚠️  Note: Backend API calls will fail until you deploy the Python backend"
echo "See FIREBASE_DEPLOY.md for backend deployment options"
