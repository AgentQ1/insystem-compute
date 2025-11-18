#!/bin/bash

echo "🚀 Starting InSystem Compute Desktop App..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the desktop/ directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if backend dependencies are installed
echo "🔍 Checking Python dependencies..."
python3 -c "import llama_cpp" 2>/dev/null || {
    echo "�� Installing llama-cpp-python..."
    pip3 install llama-cpp-python fastapi uvicorn
}

# Start backend in background
echo "🐍 Starting Python inference backend..."
cd ../gateway
python3 -m uvicorn gateway_py:app --port 8080 > /tmp/insystem-backend.log 2>&1 &
BACKEND_PID=$!
cd ../desktop

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend is running (PID: $BACKEND_PID)"
else
    echo "⚠️  Backend might not be ready yet, but continuing..."
fi

echo ""
echo "🎨 Launching desktop app..."
echo ""
npm start

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
