#!/usr/bin/env python3
"""
Run InSystem models using llama-cpp-python (works TODAY!)
This is a temporary solution while the Rust engine is being implemented.
"""

import sys
import os

def check_llama_cpp():
    """Check if llama-cpp-python is installed"""
    try:
        import llama_cpp
        return True
    except ImportError:
        return False

def install_instructions():
    """Show installation instructions"""
    print("❌ llama-cpp-python not found\n")
    print("📦 Install with:")
    print("   pip install llama-cpp-python\n")
    print("Or for Metal (Mac M1/M2) acceleration:")
    print("   CMAKE_ARGS='-DLLAMA_METAL=on' pip install llama-cpp-python\n")
    sys.exit(1)

def main():
    print("🚀 InSystem Compute - Run Models with llama.cpp\n")
    
    if not check_llama_cpp():
        install_instructions()
    
    from llama_cpp import Llama
    
    # Check if models exist
    model_path = "models/tinyllama.gguf"
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        print("\n💡 Download from Model Hub: http://localhost:5500")
        sys.exit(1)
    
    print(f"📂 Loading model: {model_path}")
    print("   (This may take 10-30 seconds...)\n")
    
    # Load model
    llm = Llama(
        model_path=model_path,
        n_ctx=2048,          # Context window
        n_threads=4,          # CPU threads
        n_gpu_layers=0,       # GPU layers (0 = CPU only)
        verbose=False,
    )
    
    print("✅ Model loaded!\n")
    
    # Test prompts
    prompts = [
        "Hello! Tell me a short joke about computers.",
        "What is quantum computing in one sentence?",
        "Write a haiku about AI.",
    ]
    
    for i, prompt in enumerate(prompts, 1):
        print(f"[{i}] Prompt: {prompt}")
        print("    Generating...", end=" ", flush=True)
        
        output = llm(
            prompt,
            max_tokens=100,
            temperature=0.8,
            top_p=0.95,
            echo=False,          # Don't repeat prompt
            stop=["\n\n"],       # Stop at double newline
        )
        
        response = output['choices'][0]['text'].strip()
        print("\r" + " " * 50 + "\r", end="")  # Clear "Generating..."
        print(f"    Response: {response}\n")
    
    print("=" * 60)
    print("✅ All tests completed!")
    print("\n💡 Tips:")
    print("   • Modify prompts in this script")
    print("   • Try phi-2.gguf for better reasoning")
    print("   • Increase max_tokens for longer responses")
    print("\n🌐 Model Hub: http://localhost:5500")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n💡 Check that:")
        print("   1. llama-cpp-python is installed")
        print("   2. Model exists: ls -lh models/tinyllama.gguf")
        sys.exit(1)
