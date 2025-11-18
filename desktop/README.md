# InSystem Compute - Desktop App

Beautiful desktop application for running AI models locally on your Mac/Windows/Linux.

## Features

- **Double-click .gguf files** to open them in the app
- **Chat interface** for interacting with models
- **100% local** - No internet required, data stays on your device
- **Fast inference** - Uses llama-cpp-python backend
- **Cross-platform** - Works on macOS, Windows, and Linux

## Quick Start

### 1. Install Dependencies

```bash
cd desktop
npm install
```

### 2. Start the App (Development)

```bash
# Make sure Python backend is running
cd ../gateway
python3 -m uvicorn gateway_py:app --port 8080 &

# Start Electron app
cd ../desktop
npm start
```

### 3. Use the App

1. Click "Load Model" button
2. Select a `.gguf` file (e.g., `tinyllama.gguf` or `phi-2.gguf`)
3. Start chatting!

## Build Distributables

### macOS (.dmg)
```bash
npm run build:mac
# Output: dist/InSystem Compute-1.0.0.dmg
```

### Windows (.exe)
```bash
npm run build:win
# Output: dist/InSystem Compute Setup 1.0.0.exe
```

### Linux (.AppImage)
```bash
npm run build:linux
# Output: dist/InSystem Compute-1.0.0.AppImage
```

## File Association

After installing the built app:

**macOS:**
- Right-click any `.gguf` file
- Choose "Get Info"
- Under "Open with", select "InSystem Compute"
- Click "Change All..."
- Now double-clicking `.gguf` files opens them in the app!

**Windows:**
- Right-click any `.gguf` file
- Choose "Open with" → "Choose another app"
- Select "InSystem Compute"
- Check "Always use this app"

**Linux:**
- Right-click `.gguf` file
- Properties → "Open With"
- Select "InSystem Compute"

## How It Works

1. **Electron** provides the native desktop wrapper
2. **Python backend** (gateway_py.py) handles model inference via llama-cpp-python
3. **Communication** happens via REST API (localhost:8080)
4. **Models** run entirely on your local machine - no cloud, 100% private

## Architecture

```
Desktop App (Electron)
    ↓
REST API (localhost:8080)
    ↓
Python Gateway (FastAPI)
    ↓
llama-cpp-python
    ↓
GGUF Model File
```

## Development

- `main.js` - Electron main process, manages windows and backend
- `renderer.js` - Frontend logic, handles chat UI
- `index.html` - Chat interface
- `styles.css` - UI styling (Google-inspired design)
- `preload.js` - Secure bridge between Electron and renderer

## Tips

- **First message is slow** (2-5 seconds) as model loads into memory
- **Subsequent messages are fast** (~300-500ms)
- **TinyLlama** - Fast, 85 tok/s, 640MB
- **Phi-2** - Smarter, 40 tok/s, 1.7GB
- Adjust temperature (0-2) for creativity
- Lower max tokens for faster responses

## Troubleshooting

**Backend not connecting:**
```bash
# Check if backend is running
curl http://localhost:8080/api/v1/health

# Restart backend
cd gateway
python3 -m uvicorn gateway_py:app --port 8080
```

**Models not found:**
```bash
# Make sure models are in the models/ directory
ls -lh ../models/*.gguf
```

**App won't start:**
```bash
# Reinstall dependencies
npm install

# Check Electron version
npm list electron
```

## License

MIT
