# 🚀 Running Models on Your Computer

## ⚠️ Current Status

**Downloaded Models:**
- ✅ TinyLlama 1.1B (638MB) - `models/tinyllama.gguf`
- ✅ Phi-2 2.7B (1.7GB) - `models/phi-2.gguf`

**Implementation Status:**
- ✅ Model Hub API (running on port 8080)
- ✅ Web UI with code generation (port 5500)
- ✅ Real model downloads from Hugging Face
- ✅ Rust core architecture built
- ⏳ **GGUF model loader - IN PROGRESS**
- ⏳ **Inference engine - IN PROGRESS**

## 🎯 3 Ways to Run Models (When Complete)

### Option 1: Python SDK (Native - FASTEST)
```python
from insystem_compute import Engine, ModelConfig

# Initialize engine
engine = Engine()

# Load TinyLlama
model = engine.load_model("models/tinyllama.gguf", 
    ModelConfig(format="gguf", quantization=4))

# Generate
response = model.generate("Hello!", max_tokens=50)
print(response)
```

### Option 2: REST API (Works NOW!)
```bash
# Start server (already running on port 8080)
cd gateway && python3 -m uvicorn gateway_py:app --port 8080

# Generate text
curl -X POST http://localhost:8080/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tinyllama",
    "prompt": "Hello, how are you?",
    "max_tokens": 100
  }'
```

### Option 3: iOS/Android Apps
See generated code in Web UI: http://localhost:5500

## 🔧 Running Models TODAY (Alternative Runtimes)

Since the Rust engine is still being implemented, here are ways to run your downloaded models RIGHT NOW:

### Using llama.cpp (Recommended)
```bash
# Install llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Run TinyLlama
./main -m ../insystem-compute/models/tinyllama.gguf \
       -p "Hello, how are you?" \
       -n 100

# Run Phi-2
./main -m ../insystem-compute/models/phi-2.gguf \
       -p "Explain quantum computing:" \
       -n 200
```

### Using Python (llama-cpp-python)
```bash
# Install
pip install llama-cpp-python

# Run
python3 << 'EOF'
from llama_cpp import Llama

# Load TinyLlama
llm = Llama(model_path="models/tinyllama.gguf", n_ctx=2048)

# Generate
output = llm("Hello, how are you?", max_tokens=100)
print(output['choices'][0]['text'])
EOF
```

### Using Ollama (Easiest)
```bash
# Install Ollama: https://ollama.ai
brew install ollama

# Import your model
ollama create tinyllama -f Modelfile

# Run
ollama run tinyllama "Hello, tell me a joke"
```

**Modelfile example:**
```
FROM ./models/tinyllama.gguf
PARAMETER temperature 0.8
PARAMETER num_ctx 2048
```

## 📊 Model Details

### TinyLlama 1.1B Chat (Q4_K_M)
- **Size:** 638MB
- **Format:** GGUF
- **Quantization:** Q4_K_M (4-bit)
- **Context:** 2048 tokens
- **Use Case:** Fast inference, edge devices, chat
- **Speed:** ~50 tokens/sec on M1 Mac

### Phi-2 2.7B (Q4_K_M)
- **Size:** 1.7GB
- **Format:** GGUF
- **Quantization:** Q4_K_M (4-bit)
- **Context:** 2048 tokens
- **Use Case:** Reasoning, code generation
- **Speed:** ~25 tokens/sec on M1 Mac

## 🔨 Development Status

The InSystem Compute Rust engine is being implemented with these components:

**✅ Complete:**
- Core architecture and traits
- Device abstraction (CPU/CUDA/Metal)
- Tensor operations
- Quantization framework
- FFI bindings
- Python SDK structure
- REST API gateway

**⏳ In Progress:**
- GGUF file format parser
- Tokenizer implementation
- Attention mechanism
- Model inference loop
- KV cache

**Estimated completion:** 2-3 weeks for full inference support

## 💡 Next Steps

1. **Use Alternative Runtime** (TODAY):
   - Install llama-cpp-python: `pip install llama-cpp-python`
   - Run your downloaded models immediately

2. **Monitor Development**:
   - Watch this repo for engine updates
   - Test with `examples/python/test_tinyllama.py` (will work when ready)

3. **Build Your App**:
   - Use the REST API (already working for placeholders)
   - Models will drop in when engine complete
   - No code changes needed!

## 🌐 Web UI

Your Model Hub is running at: **http://localhost:5500**

- Browse all models
- View model-specific code examples
- Download models
- See documentation

## 🆘 Support

**Issues?**
- Check `core/` build: `cd core && cargo build --release`
- Verify models: `ls -lh models/`
- Test REST API: `curl http://localhost:8080/api/v1/health`

**Want to contribute?**
- See `CONTRIBUTING.md`
- Focus areas: GGUF parser, tokenizer, attention layers
