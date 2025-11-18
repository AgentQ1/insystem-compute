#!/usr/bin/env python3
"""
Quick Vision Model Test
Creates a simple test image and runs vision inference
"""

import sys
import os

# Test 1: Create a simple test image
print("🔷 Vision Model Quick Test\n")
print("Step 1: Creating test image...")

try:
    from PIL import Image, ImageDraw
    
    # Create a simple test image with shapes
    img = Image.new('RGB', (400, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw some recognizable shapes
    draw.rectangle([50, 50, 150, 150], fill='red', outline='black', width=3)
    draw.ellipse([250, 50, 350, 150], fill='blue', outline='black', width=3)
    draw.polygon([(200, 200), (150, 260), (250, 260)], fill='green', outline='black')
    
    img.save('test_vision_quick.jpg')
    print("✅ Test image created: test_vision_quick.jpg")
    print("   Contents: Red square, blue circle, green triangle\n")
except ImportError:
    print("⚠️  PIL not available. Install with: pip3 install pillow")
    print("   Or use your own image file\n")
    sys.exit(1)

# Test 2: Check if gateway is running
print("Step 2: Checking gateway...")

try:
    import requests
    
    response = requests.get("http://localhost:8080/api/v1/health", timeout=2)
    if response.ok:
        print("✅ Gateway is running\n")
    else:
        print("❌ Gateway returned error")
        print("   Start with: cd gateway && python3 gateway_py.py")
        sys.exit(1)
except ImportError:
    print("⚠️  requests not available. Install with: pip3 install requests")
    sys.exit(1)
except requests.exceptions.ConnectionError:
    print("❌ Gateway not running")
    print("   Start with: cd gateway && python3 gateway_py.py")
    sys.exit(1)
except requests.exceptions.Timeout:
    print("❌ Gateway not responding")
    sys.exit(1)

# Test 3: Check model file exists
print("Step 3: Checking model file...")

model_path = "models/llava-v1.6-7b.Q4_K_M.gguf"
clip_path = "models/mmproj-model-f16.gguf"

if os.path.exists(model_path):
    size_gb = os.path.getsize(model_path) / (1024**3)
    print(f"✅ LLaVA model: {model_path} ({size_gb:.1f} GB)")
else:
    print(f"❌ Model not found: {model_path}")
    print("   Download guide: VISION_MODEL_COMPLETE.md")
    sys.exit(1)

if os.path.exists(clip_path):
    size_mb = os.path.getsize(clip_path) / (1024**2)
    print(f"✅ CLIP model: {clip_path} ({size_mb:.0f} MB)\n")
else:
    print(f"⚠️  CLIP model not found: {clip_path}")
    print("   Vision may not work without it")

# Test 4: Run vision inference
print("Step 4: Running vision inference...")
print("This may take 10-30 seconds on first run (model loading)...\n")

try:
    import time
    
    start_time = time.time()
    
    with open('test_vision_quick.jpg', 'rb') as f:
        response = requests.post(
            'http://localhost:8080/api/v1/vision/analyze',
            files={'image': f},
            data={
                'model': 'llava-v1.6-7b-q4',
                'prompt': 'What shapes and colors do you see in this image?',
                'max_tokens': 100
            },
            timeout=60  # Allow time for model loading
        )
    
    elapsed = time.time() - start_time
    
    if response.ok:
        result = response.json()
        
        print("="*60)
        print("✅ VISION INFERENCE SUCCESSFUL!")
        print("="*60)
        print(f"\nPrompt: What shapes and colors do you see in this image?")
        print(f"\nVision Model Response:")
        print(f"{result.get('text', 'No response')}")
        print(f"\nPerformance:")
        print(f"  • Latency: {result.get('latency_ms', int(elapsed * 1000))} ms")
        print(f"  • Model: {result.get('model', 'unknown')}")
        print(f"  • Image size: {result.get('image_size', 'unknown')} bytes")
        print("="*60)
        
        print("\n✅ All tests passed!")
        print("\nYou can now:")
        print("  • Test in playground: http://localhost:8080")
        print("  • Use REST API: examples/python/07_vision_analysis.py")
        print("  • Read guide: VISION_MODEL_COMPLETE.md")
        
    else:
        print("❌ Vision inference failed")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if "not available" in response.text:
            print("\nTip: Vision support requires CLIP model.")
            print("     See VISION_MODEL_COMPLETE.md for setup")

except requests.exceptions.Timeout:
    print("❌ Request timed out")
    print("   Vision inference can take 10-30 seconds on first run")
    print("   Try running again (should be faster with cached model)")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
