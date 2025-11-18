#!/bin/bash
# Quick status check for InSystem Gateway

echo "🔷 InSystem Gateway Status Check"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if gateway is running
if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "✅ Gateway: RUNNING on port 8080"
else
    echo "❌ Gateway: NOT RUNNING"
    echo ""
    echo "Start with: cd gateway && python3 -m uvicorn gateway_py:app --port 8080 &"
    exit 1
fi

echo ""

# Test API speed
echo "⚡ API Performance:"
echo "  Health:  $(curl -w '%{time_total}s' -s http://localhost:8080/api/v1/health -o /dev/null)"
echo "  Models:  $(curl -w '%{time_total}s' -s http://localhost:8080/api/v1/hub/models -o /dev/null)"

echo ""

# Check static files
echo "📁 Static Files:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/static/styles.css | grep -q 200; then
    echo "  ✅ CSS loaded"
else
    echo "  ❌ CSS not found"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/static/app.js | grep -q 200; then
    echo "  ✅ JavaScript loaded"
else
    echo "  ❌ JavaScript not found"
fi

echo ""

# Count models
MODEL_COUNT=$(curl -s http://localhost:8080/api/v1/hub/models | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['count'])" 2>/dev/null)
echo "🤖 Models Available: $MODEL_COUNT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Open in browser: http://localhost:8080"
echo ""
echo "💡 Tips:"
echo "  • First load may take 2-3 seconds (downloading fonts/assets)"
echo "  • Subsequent loads are instant (cached)"
echo "  • API responses are < 5ms (very fast!)"
echo "  • Press F12 in browser to see console/network tab"
echo ""
