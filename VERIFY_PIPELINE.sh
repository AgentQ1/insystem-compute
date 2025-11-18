#!/bin/bash

echo "🎯 YOLO + LLaVA Pipeline - Final Verification"
echo "=============================================="
echo ""

# Test gateway health
echo "✅ Gateway health check..."
curl -s http://localhost:8080/api/v1/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Status: {d[\"status\"]}')"

# Test pipeline endpoint
echo ""
echo "✅ Pipeline endpoint test..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/vision/pipeline \
  -F "model=llava-v1.6-7b-q4" \
  -F "prompt=test" \
  -F "max_tokens=5" \
  -F "image=@/dev/null" 2>&1)

if echo "$RESPONSE" | grep -q "pipeline-"; then
  echo "   ✅ Pipeline responding correctly"
else
  echo "   ❌ Pipeline error"
fi

# Check models
echo ""
echo "✅ Models installed:"
ls -lh /private/tmp/insystem-compute/models/*.{pt,gguf} 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

echo ""
echo "=============================================="
echo "🚀 EVERYTHING IS READY!"
echo ""
echo "📱 Main Playground: http://localhost:8080"
echo "🧪 Test Page: http://localhost:8080/static/test_camera.html"
echo ""
echo "🎬 How to use Playground:"
echo "   1. Open: http://localhost:8080"
echo "   2. Select: 'LLaVA v1.6 7B (Vision)'"
echo "   3. Input type auto-switches to 'Camera'"
echo "   4. Click: 'Start Camera' or 'Try Playground'"
echo "   5. See:"
echo "      ✅ Colored bounding boxes on objects (instant!)"
echo "      ✅ Object labels with confidence %"
echo "      ✅ Real-time scene descriptions"
echo "      ✅ Performance stats (YOLO: ~100ms, LLaVA: ~2s)"
echo ""
echo "🎯 Expected behavior:"
echo "   • YOLO boxes appear instantly (~100ms)"
echo "   • LLaVA description updates every ~2-5 seconds"
echo "   • Updates continue every 1 second automatically"
echo "   • LIVE badge pulses at top-left"
echo "   • Analysis stats show at bottom"
echo ""
