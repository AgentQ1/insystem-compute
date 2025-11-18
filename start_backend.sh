#!/bin/bash

# Production deployment script
# This will run the backend server that Firebase will proxy to

set -e

echo "🚀 Starting InSystem Compute Backend"

# Install dependencies if needed
pip3 install -q fastapi uvicorn python-multipart llama-cpp-python ultralytics opencv-python pillow

# Start the server
cd "$(dirname "$0")/gateway"
echo "✅ Backend starting on port 8080"
python3 gateway_py.py
