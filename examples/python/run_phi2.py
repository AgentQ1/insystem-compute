#!/usr/bin/env python3
"""
Test Phi-2 model - Better reasoning and code generation
"""

import sys
import os

def check_llama_cpp():
    try:
        import llama_cpp
        return True
    except ImportError:
        print("❌ llama-cpp-python not installed")
        print("   Install: CMAKE_ARGS='-DLLAMA_METAL=on' pip3 install llama-cpp-python\n")
        return False

def main():
    print("🚀 Testing Phi-2 2.7B Model (Better Reasoning)\n")
    
    if not check_llama_cpp():
        sys.exit(1)
    
    from llama_cpp import Llama
    
    model_path = "models/phi-2.gguf"
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        print("   Download from: http://localhost:5500\n")
        sys.exit(1)
    
    print(f"📂 Loading Phi-2 (1.7GB)...")
    print("   This will take ~30-60 seconds...\n")
    
    llm = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=4,
        n_gpu_layers=0,
        verbose=False,
    )
    
    print("✅ Model loaded!\n")
    print("=" * 70)
    
    # Test different capabilities
    tests = [
        {
            "name": "Reasoning",
            "prompt": "If a train travels at 60 mph for 2 hours, how far does it go? Explain step by step.",
            "max_tokens": 150,
        },
        {
            "name": "Code Generation",
            "prompt": "Write a Python function to calculate fibonacci numbers:",
            "max_tokens": 200,
        },
        {
            "name": "Explanation",
            "prompt": "Explain what machine learning is in simple terms:",
            "max_tokens": 150,
        },
    ]
    
    for i, test in enumerate(tests, 1):
        print(f"\n[Test {i}] {test['name']}")
        print(f"Prompt: {test['prompt']}")
        print("\nGenerating...", end=" ", flush=True)
        
        output = llm(
            test['prompt'],
            max_tokens=test['max_tokens'],
            temperature=0.7,
            top_p=0.9,
            echo=False,
        )
        
        response = output['choices'][0]['text'].strip()
        print("\r" + " " * 50)
        print(f"Response:\n{response}")
        print("=" * 70)
    
    print("\n✅ All tests completed!")
    print("\n💡 Phi-2 is better at:")
    print("   • Mathematical reasoning")
    print("   • Code generation")
    print("   • Logical explanations")
    print("\n🌐 Model Hub: http://localhost:5500")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
