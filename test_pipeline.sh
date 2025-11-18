#!/bin/bash

echo "🧪 Testing YOLO + LLaVA Pipeline"
echo "================================"
echo ""

# Check if gateway is running
echo "1️⃣  Checking gateway..."
if curl -s -m 2 http://localhost:8080/api/v1/health > /dev/null; then
  echo "   ✅ Gateway is running"
else
  echo "   ❌ Gateway is not running"
  echo "   Start with: cd gateway && python3 gateway_py.py &"
  exit 1
fi

# Check models exist
echo ""
echo "2️⃣  Checking models..."
if [ -f "/private/tmp/insystem-compute/models/yolov8n.pt" ]; then
  echo "   ✅ YOLO model found ($(ls -lh /private/tmp/insystem-compute/models/yolov8n.pt | awk '{print $5}'))"
else
  echo "   ❌ YOLO model missing"
fi

if [ -f "/private/tmp/insystem-compute/models/llava-v1.6-7b.Q4_K_M.gguf" ]; then
  echo "   ✅ LLaVA model found ($(ls -lh /private/tmp/insystem-compute/models/llava-v1.6-7b.Q4_K_M.gguf | awk '{print $5}'))"
else
  echo "   ❌ LLaVA model missing"
fi

if [ -f "/private/tmp/insystem-compute/models/mmproj-model-f16.gguf" ]; then
  echo "   ✅ CLIP model found ($(ls -lh /private/tmp/insystem-compute/models/mmproj-model-f16.gguf | awk '{print $5}'))"
else
  echo "   ❌ CLIP model missing"
fi

# Test pipeline endpoint exists
echo ""
echo "3️⃣  Testing pipeline endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/vision/pipeline \
  -F "model=llava-v1.6-7b-q4" \
  -F "prompt=test" \
  -F "max_tokens=10" \
  -F "image=@/dev/null" 2>&1)

if echo "$RESPONSE" | grep -q "pipeline-"; then
  echo "   ✅ Pipeline endpoint responding"
else
  echo "   ❌ Pipeline endpoint error"
  echo "   Response: $RESPONSE"
fi

echo ""
echo "================================"
echo "📱 Open webapp: http://localhost:8080"
echo "🧪 Or test page: file:///private/tmp/insystem-compute/TEST_CAMERA.html"
echo ""
echo "✨ Steps to test:"
echo "   1. Open http://localhost:8080"
echo "   2. Select 'LLaVA v1.6 7B (Vision)' model"
echo "   3. Input type will auto-switch to Camera"
echo "   4. Click 'Start Camera'"
echo "   5. You should see:"
echo "      - Colored bounding boxes on detected objects"
echo "      - Object labels (e.g., 'person 94%')"
echo "      - Scene description below video"
echo "      - Timing stats (YOLO: ~100ms, LLaVA: ~2-5s)"
echo ""
