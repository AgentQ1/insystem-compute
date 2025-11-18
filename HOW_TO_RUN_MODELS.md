# How to Run Downloaded Models

## Quick Start (3 Steps)

### 1. Download a Model
- Open http://localhost:5500 (the Model Hub)
- Click on any model card
- Click "Download & View Code" button
- Save the `.gguf` file (e.g., to `~/Downloads/`)

### 2. Install Python Dependencies
```bash
pip3 install llama-cpp-python
```

### 3. Run the Model
```bash
# From project root:
python3 run_downloaded_model.py ~/Downloads/tinyllama.gguf

# Or if model is already in models/ folder:
python3 run_downloaded_model.py models/tinyllama.gguf
```

## What is a .gguf file?

**It's a model file, NOT an application!**

Think of it like:
- `.mp3` = music file (needs music player)
- `.gguf` = AI model file (needs Python/llama-cpp)

You can't "open" a .gguf file directly. You need to load it with code.

## Examples

### Interactive Chat
```bash
python3 run_downloaded_model.py ~/Downloads/tinyllama.gguf
```
Then type your questions!

### Python Script
```python
from llama_cpp import Llama

# Load model
llm = Llama("~/Downloads/tinyllama.gguf", n_ctx=2048)

# Generate
result = llm("What is AI?", max_tokens=100)
print(result['choices'][0]['text'])
```

### Use REST API (Easiest)
```bash
# Start the gateway first:
cd gateway && python3 -m uvicorn gateway_py:app --port 8080

# Then call API:
curl -X POST http://localhost:8080/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "tinyllama-1b-q4", "prompt": "Hello!", "max_tokens": 50}'
```

## Model Locations

**After download from Hub:**
- macOS: `~/Downloads/tinyllama.gguf`
- The file will be 638MB (TinyLlama) or 1.7GB (Phi-2)

**Pre-installed models:**
- `models/tinyllama.gguf` (already in repo)
- `models/phi-2.gguf` (already in repo)

## Troubleshooting

### "No application can open this file"
✅ **This is normal!** .gguf files need Python to run them.

Use: `python3 run_downloaded_model.py <path-to-file>`

### "Module not found: llama_cpp"
```bash
pip3 install llama-cpp-python
```

### "File not found"
Check the path:
```bash
ls -lh ~/Downloads/*.gguf
```

## See Also

- `examples/python/run_with_llamacpp.py` - More examples
- `examples/python/run_phi2.py` - Phi-2 example
- Documentation tab in Hub - Complete API guide
