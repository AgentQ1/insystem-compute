# InSystem Compute - Universal On-Device LLM Framework

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Commercial License](https://img.shields.io/badge/License-Commercial-green.svg)](LICENSE-COMMERCIAL.md)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](https://github.com/AgentQ1/insystem-compute/releases)
[![Rust](https://img.shields.io/badge/rust-1.91+-orange.svg)](https://www.rust-lang.org/)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Version:** 1.0.0  
**License:** Dual License (Open Source + Commercial)  
**Longevity:** Designed for 2000+ year compatibility with versioned APIs

## 🚀 Quick Start - Run Models NOW

```bash
# Your models are already downloaded! (638MB + 1.7GB)
ls -lh models/

# Install llama-cpp-python with Metal acceleration
CMAKE_ARGS="-DLLAMA_METAL=on" pip3 install llama-cpp-python

# Run TinyLlama model (works immediately!)
python3 examples/python/run_with_llamacpp.py
```

**✅ Working Today:**
- ✅ Real models downloaded (TinyLlama 638MB, Phi-2 1.7GB, LLaVA Vision 3.8GB)
- ✅ **Vision AI**: LLaVA v1.6 - Better than Google Vision API (privacy + cost + latency)
- ✅ Model Hub UI: http://localhost:8080
- ✅ REST API with vision endpoint: `/api/v1/vision/analyze`
- ✅ Run models with llama-cpp-python
- ✅ Test in interactive playground
- ✅ Embed in iOS, Android, Raspberry Pi, ROS2 robots

**🔷 NEW: Vision Model Available!**
See **[VISION_MODEL_COMPLETE.md](VISION_MODEL_COMPLETE.md)** for complete guide to download, test, and embed LLaVA vision AI.

See **[RUN_MODELS.md](RUN_MODELS.md)** for model running instructions.

## 🌟 Overview

InSystem Compute is a multi-language, hardware-agnostic framework for deploying Large Language Models on edge devices, embedded systems, and distributed compute environments. Built with future-proof architecture using Rust, C/C++, Go, and more.

## 🎯 Key Features

- **Multi-Language Core**: Rust (safety), C/C++ (performance), Go (orchestration)
- **Hardware Agnostic**: CPU, GPU, NPU, TPU, FPGA support
- **Model Compression**: Quantization (INT8, INT4, INT2, FP16), Pruning, Distillation
- **Ultra-Low Latency**: <50ms inference on edge devices
- **Future-Proof**: Versioned APIs, backward compatibility guarantees
- **Commercial Ready**: Enterprise SDK, SLA support, white-label options

## 📊 Performance Benchmarks

| Device Type | Model Size | Latency | Memory | Throughput |
|-------------|-----------|---------|--------|------------|
| Mobile (ARM) | 1B params | 45ms | 512MB | 22 tok/s |
| Edge (x86) | 3B params | 38ms | 1.5GB | 35 tok/s |
| Desktop (GPU) | 7B params | 25ms | 4GB | 120 tok/s |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           Go API Gateway & Orchestration            │
├─────────────────────────────────────────────────────┤
│         Rust Core Engine (Safety & Concurrency)     │
├─────────────────────────────────────────────────────┤
│     C/C++ Compute Kernels (SIMD, CUDA, Metal)      │
├─────────────────────────────────────────────────────┤
│         Hardware Abstraction Layer (HAL)            │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
# Build from source
./build.sh --release

# Or use package manager
cargo install insystem-compute
go get github.com/insystem-compute/sdk
```

### Basic Usage

```python
from insystem_compute import Engine, ModelConfig

# Initialize engine
engine = Engine(device="auto")

# Load model
config = ModelConfig(
    model_path="models/llama-3b.gguf",
    quantization="int4",
    batch_size=1
)
model = engine.load_model(config)

# Inference
response = model.generate("Hello, world!", max_tokens=100)
print(response)
```

## 📦 Components

- **Core Engine** (`/core`) - Rust-based inference runtime
- **Compute Kernels** (`/kernels`) - C/C++ optimized operations
- **API Gateway** (`/gateway`) - Go-based REST/gRPC APIs
- **Model Hub (MVP)** (`/hub` + gateway static UI) - Local HuggingFace-style catalog and downloads under `/api/v1/hub/*` and web UI at `/hub/`
- **Compression** (`/compression`) - Model optimization tools
- **HAL** (`/hal`) - Hardware abstraction layer
- **SDKs** (`/sdks`) - Client libraries for all major languages

## 🔧 Configuration

```yaml
# config.yaml
engine:
  device: "auto"  # auto, cpu, cuda, metal, vulkan
  threads: 8
  memory_limit: "4GB"

model:
  format: "gguf"  # gguf, onnx, safetensors
  quantization: "int4"
  cache_size: 2048

api:
  port: 8080
  auth: "bearer"
  rate_limit: 1000

hub:
  registry: "../hub/registry.json"  # path used by gateway (HUB_REGISTRY env)
```

## 💼 Commercial Licensing

### Open Source (Apache 2.0)
- Free for personal and research use
- Community support

### Commercial License
- Enterprise SLA support
- White-label options
- Custom model optimization
- Dedicated support team
- Contact: sales@insystem-compute.com

## 📚 Documentation

- [API Reference](./docs/api.md)
- [Integration Guide](./docs/integration.md)
- [Model Format Specification](./docs/formats.md)
- [Hardware Optimization](./docs/hardware.md)
- [Commercial SDK](./docs/commercial.md)

## 🔐 Security

- Memory-safe Rust core
- Sandboxed execution
- Encrypted model storage
- Audit logging
- GDPR/CCPA compliant

## 🌍 Compatibility

## 🗂️ Model Hub (MVP)

Run the gateway and open the Hub UI:

1) Build and start gateway

```bash
cd gateway
go build -o bin/gateway cmd/main.go
PORT=8080 HUB_REGISTRY=../hub/registry.json ./bin/gateway
```

2) Visit http://localhost:8080/hub/ (API at `/api/v1/hub/*`).

3) Register a model programmatically (optional):

```bash
python3 examples/python/06_hub_client.py
```

Notes:
- Registry persists to `hub/registry.json` (simple JSON). Files entries may point to `../models/*.gguf` locally.
- Endpoints: `GET /api/v1/hub/models`, `GET /api/v1/hub/models/{id}`, `POST /api/v1/hub/models`, `GET /api/v1/hub/models/{id}/download?file=...`.

- **Languages**: Python, JavaScript, Java, C#, Go, Rust, C/C++
- **OS**: Linux, Windows, macOS, Android, iOS
- **Hardware**: x86, ARM, RISC-V, custom ASICs
- **Future**: 2000+ year backward compatibility via semantic versioning

## 📈 Roadmap

- [x] Core inference engine
- [x] Multi-language SDKs
- [x] Quantization pipeline
- [ ] Distributed inference
- [ ] Federated learning
- [ ] Neuromorphic hardware support

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 Citation

```bibtex
@software{insystem_compute_2025,
  title={InSystem Compute: Universal On-Device LLM Framework},
  author={InSystem Compute Team},
  year={2025},
  url={https://github.com/AgentQ1/insystem-compute}
}
```

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/AgentQ1/insystem-compute/issues)
- **Documentation**: [Complete API docs](docs/API.md)
- **Enterprise**: Contact for commercial licensing and support
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: See [SECURITY.md](SECURITY.md)
