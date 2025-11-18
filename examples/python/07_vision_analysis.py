#!/usr/bin/env python3
"""
Vision Model Example - LLaVA Image Analysis
Demonstrates image analysis with vision models
"""

from insystem_compute import Engine, EngineConfig
import requests
import json
from pathlib import Path

def main():
    print("🔷 InSystem Vision Model Demo\n")
    
    # Method 1: Using REST API (recommended)
    print("Method 1: REST API")
    print("-" * 60)
    
    # Check if gateway is running
    try:
        health_response = requests.get("http://localhost:8080/api/v1/health")
        if health_response.ok:
            print("✅ Gateway connected")
            
            # Analyze image using vision API
            # Note: You need to provide an actual image file
            image_path = "test_image.jpg"
            
            if Path(image_path).exists():
                with open(image_path, 'rb') as f:
                    files = {'image': f}
                    data = {
                        'model': 'llava-v1.6-7b-q4',
                        'prompt': 'Describe this image in detail',
                        'max_tokens': 150
                    }
                    
                    response = requests.post(
                        "http://localhost:8080/api/v1/vision/analyze",
                        files=files,
                        data=data
                    )
                    
                    if response.ok:
                        result = response.json()
                        print(f"Vision Analysis:\n{result['text']}")
                        print(f"\nLatency: {result['latency_ms']}ms")
                    else:
                        print(f"❌ Error: {response.text}")
            else:
                print(f"⚠️  Image not found: {image_path}")
                print("Create test_image.jpg or use your own image")
    except requests.ConnectionError:
        print("❌ Gateway offline. Start with:")
        print("   cd gateway && python gateway_py.py")
    
    print("\n")
    
    # Method 2: Using Python SDK (requires llama-cpp-python)
    print("Method 2: Python SDK")
    print("-" * 60)
    
    try:
        engine = Engine(EngineConfig(threads=4))
        
        model_path = "../models/llava-v1.6-7b.Q4_K_M.gguf"
        image_path = "test_image.jpg"
        
        if Path(model_path).exists() and Path(image_path).exists():
            response = engine.analyze_image(
                model_path=model_path,
                image_path=image_path,
                prompt="What objects do you see in this image?",
                max_tokens=100
            )
            
            print(f"Vision Response:\n{response}")
        else:
            print("⚠️  Model or image not found")
            print(f"Model: {model_path}")
            print(f"Image: {image_path}")
            
    except Exception as e:
        print(f"⚠️  SDK vision not available: {e}")
        print("Install: pip install llama-cpp-python")
    
    print("\n" + "="*60)
    print("Vision Model Use Cases:")
    print("  • Visual Q&A: 'What color is the car?'")
    print("  • Object Detection: 'List all objects in this image'")
    print("  • OCR: 'Extract text from this image'")
    print("  • Scene Understanding: 'Describe what's happening'")
    print("  • Robotics Vision: 'Identify obstacles in this camera feed'")
    print("="*60)

if __name__ == "__main__":
    main()
