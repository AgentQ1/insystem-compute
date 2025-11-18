#!/usr/bin/env python3
"""
Test TinyLlama model - Quick test to verify model runs
"""

from insystem_compute import Engine, EngineConfig, ModelConfig, Device

def main():
    print("🚀 Testing TinyLlama 1.1B Chat Model\n")
    
    # Initialize engine
    print("1️⃣ Initializing engine...")
    config = EngineConfig(
        device=Device.AUTO,
        threads=4,
        memory_limit=2 * 1024 * 1024 * 1024,  # 2GB
    )
    engine = Engine(config)
    print(f"   ✅ Engine ready - Version: {engine.version()}\n")
    
    # Load TinyLlama model
    print("2️⃣ Loading TinyLlama model (638MB)...")
    model_config = ModelConfig(
        format="gguf",
        quantization=4,  # Q4_K_M quantization
        max_seq_len=2048,
    )
    
    model_path = "models/tinyllama.gguf"
    model = engine.load_model(model_path, model_config)
    print(f"   ✅ Model loaded: {model_path}\n")
    
    # Test generation
    print("3️⃣ Generating response...\n")
    prompt = "Hello! Tell me a short joke about computers."
    
    print(f"   📝 Prompt: {prompt}\n")
    
    response = model.generate(
        prompt=prompt,
        max_tokens=100,
        temperature=0.8,
        top_p=0.95,
    )
    
    print(f"   🤖 Response:\n   {response}\n")
    print("✅ Test completed successfully!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Note: The Rust engine needs to be fully implemented.")
        print("   Current status: Core structure exists but inference is stubbed.")
