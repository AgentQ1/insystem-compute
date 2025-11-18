#!/bin/bash
# Quick start script for InSystem Model Hub webapp

set -e

echo "🚀 InSystem Model Hub - Quick Start"
echo "===================================="
echo ""

# Check if gateway is already running
if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "✅ Gateway already running on port 8080"
else
    echo "⚠️  Gateway not running. Please start it first:"
    echo ""
    echo "   cd gateway"
    echo "   go build -o bin/gateway cmd/main.go"
    echo "   PORT=8080 HUB_REGISTRY=../hub/registry.json ./bin/gateway"
    echo ""
    echo "Or if Go is not installed, you can test the Hub UI with mock data."
fi

echo ""
echo "Starting webapp server on http://localhost:5500"
echo ""
echo "Available views:"
echo "  • Model Hub - Browse and download models"
echo "  • Playground - Test models with prompts"
echo "  • Documentation - API reference"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Serve the webapp
cd examples/webapp
python3 -m http.server 5500
