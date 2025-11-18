#!/bin/bash

echo "🔄 Refreshing webapp..."
echo ""

# Add timestamp to force browser to reload
TIMESTAMP=$(date +%s)
echo "Timestamp: $TIMESTAMP"

# Check if gateway is running
if ps aux | grep -q "[g]ateway_py"; then
  echo "✅ Gateway is running"
else
  echo "⚠️  Starting gateway..."
  cd /private/tmp/insystem-compute/gateway
  python3 gateway_py.py > /tmp/gateway.log 2>&1 &
  sleep 3
  echo "✅ Gateway started"
fi

echo ""
echo "📱 Open in browser:"
echo "   Main app: http://localhost:8080?t=$TIMESTAMP"
echo "   Test page: http://localhost:8080/static/test_camera.html?t=$TIMESTAMP"
echo ""
echo "🎯 To test:"
echo "   1. Open main app link above (with ?t= parameter to bypass cache)"
echo "   2. Select 'LLaVA v1.6 7B (Vision)' model"
echo "   3. Input type auto-switches to Camera"
echo "   4. Camera opens FULL SCREEN with bounding boxes"
echo "   5. Real-time analysis shows at bottom"
echo ""
echo "✨ What you should see:"
echo "   - Full camera view (no preview box)"
echo "   - LIVE badge at top left"
echo "   - 'YOLO + LLaVA Pipeline' title at top"
echo "   - Colored bounding boxes on detected objects"
echo "   - Object labels (e.g., 'person 94%')"
echo "   - Status text at bottom with timing"
echo ""
