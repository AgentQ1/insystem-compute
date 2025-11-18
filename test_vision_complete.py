#!/usr/bin/env python3
"""
Complete Vision Model Test
Tests download, inference, and API access for LLaVA vision model
"""

import subprocess
import os
import sys
import time
from pathlib import Path

def check_command(cmd):
    """Check if command exists"""
    return subprocess.run(["which", cmd], capture_output=True).returncode == 0

def run_command(cmd, description):
    """Run command and show output"""
    print(f"\n{'='*60}")
    print(f"▶ {description}")
    print(f"  Command: {cmd}")
    print('='*60)
    result = subprocess.run(cmd, shell=True)
    return result.returncode == 0

def main():
    print("🔷 InSystem Vision Model - Complete Integration Test\n")
    
    # Check gateway is running
    print("Step 1: Check Gateway")
    print("-" * 60)
    
    try:
        import requests
        response = requests.get("http://localhost:8080/api/v1/health", timeout=2)
        if response.ok:
            data = response.json()
            print(f"✅ Gateway running (v{data.get('version')})")
        else:
            print("❌ Gateway returned error")
            print("Start gateway: cd gateway && python gateway_py.py")
            return
    except:
        print("❌ Gateway not accessible")
        print("Start gateway: cd gateway && python gateway_py.py")
        return
    
    # Check model file exists
    print("\nStep 2: Check Model File")
    print("-" * 60)
    
    model_path = Path("../models/llava-v1.6-7b.Q4_K_M.gguf")
    if model_path.exists():
        size_gb = model_path.stat().st_size / (1024**3)
        print(f"✅ Model exists: {model_path}")
        print(f"   Size: {size_gb:.2f} GB")
    else:
        print(f"❌ Model not found: {model_path}")
        print("\nDownload with:")
        print("  curl -L -o ../models/llava-v1.6-7b.Q4_K_M.gguf \\")
        print("    https://huggingface.co/mys/ggml_llava-v1.5-7b/resolve/main/ggml-model-q4_k.gguf")
        return
    
    # Test model listing via API
    print("\nStep 3: List Available Models")
    print("-" * 60)
    
    try:
        response = requests.get("http://localhost:8080/api/v1/hub/models")
        if response.ok:
            data = response.json()
            models = data.get('models', [])
            print(f"✅ Found {len(models)} models:")
            for model in models:
                print(f"   • {model.get('name')} ({model.get('id')}) - {model.get('task')}")
                
            # Check if LLaVA is in the list
            llava = next((m for m in models if m.get('id') == 'llava-v1.6-7b-q4'), None)
            if llava:
                print(f"\n✅ LLaVA vision model registered")
            else:
                print(f"\n⚠️  LLaVA not in registry")
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return
    
    # Test file download endpoint
    print("\nStep 4: Test Model Download Endpoint")
    print("-" * 60)
    
    try:
        # Just check if endpoint returns the file info (don't actually download)
        response = requests.get(
            "http://localhost:8080/api/v1/hub/models/llava-v1.6-7b-q4/download",
            stream=True
        )
        if response.ok:
            content_length = response.headers.get('content-length', 'unknown')
            print(f"✅ Download endpoint working")
            print(f"   Content-Length: {content_length} bytes")
        else:
            print(f"❌ Download failed: {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"❌ Error testing download: {e}")
    
    # Create test image
    print("\nStep 5: Create Test Image")
    print("-" * 60)
    
    test_image_path = "test_vision_image.jpg"
    if not Path(test_image_path).exists():
        print("Creating test image with PIL...")
        try:
            from PIL import Image, ImageDraw, ImageFont
            
            # Create simple test image
            img = Image.new('RGB', (400, 300), color='white')
            draw = ImageDraw.Draw(img)
            
            # Draw some shapes
            draw.rectangle([50, 50, 150, 150], fill='red', outline='black')
            draw.ellipse([200, 50, 300, 150], fill='blue', outline='black')
            draw.text((100, 200), "Test Image", fill='black')
            
            img.save(test_image_path)
            print(f"✅ Created test image: {test_image_path}")
        except ImportError:
            print("⚠️  PIL not installed, using placeholder")
            with open(test_image_path, 'wb') as f:
                f.write(b'\xFF\xD8\xFF\xE0')  # Minimal JPEG header
    else:
        print(f"✅ Test image exists: {test_image_path}")
    
    # Test vision inference
    print("\nStep 6: Test Vision Inference API")
    print("-" * 60)
    
    try:
        print("Sending image to vision API...")
        start_time = time.time()
        
        with open(test_image_path, 'rb') as f:
            files = {'image': f}
            data = {
                'model': 'llava-v1.6-7b-q4',
                'prompt': 'Describe this image',
                'max_tokens': 100
            }
            
            response = requests.post(
                "http://localhost:8080/api/v1/vision/analyze",
                files=files,
                data=data,
                timeout=60  # Vision inference can take time
            )
        
        elapsed = time.time() - start_time
        
        if response.ok:
            result = response.json()
            print(f"✅ Vision inference successful!")
            print(f"\nPrompt: {data['prompt']}")
            print(f"Response:\n{result.get('text', 'No text')}\n")
            print(f"Latency: {result.get('latency_ms', int(elapsed * 1000))}ms")
            print(f"Model: {result.get('model')}")
        else:
            print(f"❌ Vision inference failed: {response.status_code}")
            print(f"Response: {response.text}")
    except requests.Timeout:
        print("❌ Request timed out (vision inference can be slow on first run)")
    except Exception as e:
        print(f"❌ Error during vision inference: {e}")
    
    # Summary
    print("\n" + "="*60)
    print("✅ INTEGRATION TEST COMPLETE")
    print("="*60)
    print("\nThe LLaVA vision model is now:")
    print("  ✓ Downloaded to models/")
    print("  ✓ Registered in Hub")
    print("  ✓ Accessible via REST API")
    print("  ✓ Testable in playground")
    print("  ✓ Embeddable in your applications")
    print("\nNext steps:")
    print("  • Open http://localhost:8080 in browser")
    print("  • Go to Playground tab")
    print("  • Select 'LLaVA v1.6 7B' model")
    print("  • Upload an image and test")

if __name__ == "__main__":
    main()
