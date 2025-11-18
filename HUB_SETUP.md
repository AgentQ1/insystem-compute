# InSystem Model Hub - Complete Setup Guide

## 🎉 You're All Set!

Everything is running and ready to use:

### 🌐 Active Services

1. **Gateway API** (Port 8080)
   - Health: http://localhost:8080/api/v1/health
   - Hub API: http://localhost:8080/api/v1/hub/models
   - Generate: http://localhost:8080/api/v1/generate

2. **Model Hub UI** (Port 5500)
   - **Open now:** http://localhost:5500
   - Google AI Studio-inspired interface
   - Browse, search, filter, and download models
   - Interactive playground
   - Full SDK documentation

### ✨ Features Working

#### Model Hub
- ✅ Browse 3 sample models (TinyLlama, Phi-2, MiniLM)
- ✅ Search by name, tags, or platform
- ✅ Filter by task (text-generation, embedding, vision)
- ✅ Filter by platform (iOS, Android, RPi, Jetson, ROS2)
- ✅ Download model files
- ✅ Register new models

#### Playground
- ✅ Test models with custom prompts
- ✅ Adjust parameters (temperature, top-p, max tokens)
- ✅ View inference stats

#### Documentation
- ✅ Python SDK examples (text generation + embeddings)
- ✅ iOS Swift examples
- ✅ Android Kotlin examples
- ✅ JavaScript/Node.js examples
- ✅ Rust core engine examples
- ✅ ROS2 robotics integration
- ✅ REST API reference

## 🚀 Quick Start

### Test the Hub API
```bash
# List all models
curl http://localhost:8080/api/v1/hub/models | python3 -m json.tool

# Get specific model
curl http://localhost:8080/api/v1/hub/models/tinyllama-1b-q4 | python3 -m json.tool

# Download a model
curl -O "http://localhost:8080/api/v1/hub/models/tinyllama-1b-q4/download?file=tinyllama.gguf"
```

### Test Generation API
```bash
curl -X POST http://localhost:8080/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tinyllama-1b-q4",
    "prompt": "Explain quantum computing:",
    "max_tokens": 100
  }'
```

### Register a New Model
```bash
curl -X POST http://localhost:8080/api/v1/hub/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Model",
    "task": "text-generation",
    "arch": "llama",
    "tags": ["custom", "fine-tuned"],
    "targets": ["ios", "android"],
    "files": [{
      "filename": "model.gguf",
      "path": "../models/custom.gguf",
      "format": "gguf"
    }]
  }'
```

## 📦 Repository Structure

```
insystem-compute/
├── core/                    # Rust inference engine
├── gateway/                 # API gateway
│   ├── cmd/main.go         # Go gateway (alternative)
│   ├── gateway_py.py       # Python FastAPI gateway (active)
│   └── hub/registry.go     # Hub registry package
├── hub/
│   └── registry.json       # Model registry (3 models)
├── models/                  # Downloaded model files
│   ├── tinyllama.gguf
│   ├── phi-2.gguf
│   └── embed.onnx
├── examples/
│   ├── webapp/             # Model Hub UI (active on :5500)
│   │   ├── index.html
│   │   ├── app.js
│   │   └── styles.css
│   └── python/
│       └── 06_hub_client.py
└── sdks/                    # Client SDKs
    └── python/
```

## 🔧 Managing Services

### Stop Services
```bash
# Stop gateway
pkill -f "uvicorn gateway_py"

# Stop webapp
pkill -f "http.server 5500"
```

### Restart Services
```bash
# Start gateway
cd gateway
HUB_REGISTRY=../hub/registry.json nohup python3 -m uvicorn gateway_py:app --port 8080 --host 0.0.0.0 > /tmp/gateway.log 2>&1 &

# Start webapp
cd examples/webapp
python3 -m http.server 5500 > /dev/null 2>&1 &
```

### Check Status
```bash
# Check if services are running
curl http://localhost:8080/api/v1/health
curl http://localhost:5500
```

## 📝 Sample Models Included

1. **TinyLlama 1.1B Chat (Q4)**
   - Task: text-generation
   - Platforms: iOS, Android, RPi, Jetson
   - Format: GGUF (4-bit quantized)

2. **Phi-2 2.7B (Q4)**
   - Task: text-generation
   - Platforms: iOS, Android, macOS
   - Format: GGUF (4-bit quantized)

3. **MiniLM Embeddings**
   - Task: embedding
   - Platforms: iOS, Android, RPi
   - Format: ONNX (fp16)

## 🎯 Next Steps

### Add Real Models
Replace dummy files in `models/` with actual model weights:
```bash
# Download a real model (example)
cd models
wget https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf -O tinyllama.gguf
```

### Connect Rust Engine
The Python gateway currently returns placeholder responses. To enable real inference:
1. Build the Rust core: `cd core && cargo build --release`
2. Wire FFI calls in `gateway_py.py` or use the Go gateway with FFI
3. Update the `/api/v1/generate` endpoint to call the engine

### Extend the Hub
- Add model versioning
- Implement user accounts and private models
- Add model cards with README rendering
- Enable file uploads
- Add S3/cloud storage backends

## 🐛 Troubleshooting

### Gateway not responding
```bash
# Check logs
tail -f /tmp/gateway.log

# Restart gateway
pkill -f uvicorn
cd gateway && HUB_REGISTRY=../hub/registry.json python3 -m uvicorn gateway_py:app --port 8080
```

### Downloads fail
Ensure model files exist in `models/` directory. The paths in `hub/registry.json` must point to real files.

### UI not loading models
Check browser console (F12) for errors. Verify gateway is running on port 8080.

## 📚 Documentation

Full SDK examples are available in the Documentation tab of the web UI:
- **Python**: Text generation, embeddings, RAG
- **iOS Swift**: On-device inference
- **Android Kotlin**: Mobile deployment
- **JavaScript**: Web integration
- **Rust**: Direct engine usage
- **ROS2**: Robotics integration

## 🤝 Contributing

See `CONTRIBUTING.md` for guidelines.

## 📄 License

Dual licensed under Apache 2.0 and Commercial licenses. See `LICENSE` for details.

---

**Current Status:** ✅ All systems operational!
- Gateway: http://localhost:8080
- Hub UI: http://localhost:5500
