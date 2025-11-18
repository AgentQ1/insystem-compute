"""
Quick Python gateway for Model Hub - FastAPI based
Run: uvicorn gateway_py:app --port 8080
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from pathlib import Path
import time
import base64

app = FastAPI(title="InSystem Model Hub", version="1.0.0")

# Mount static files for webapp
WEBAPP_PATH = Path(__file__).parent.parent / "examples" / "webapp"
if WEBAPP_PATH.exists():
    app.mount("/static", StaticFiles(directory=str(WEBAPP_PATH)), name="static")

# Global model cache
_loaded_models = {}

def get_llama_cpp():
    """Check if llama-cpp-python is available"""
    try:
        from llama_cpp import Llama
        return Llama
    except ImportError:
        return None

def get_llama_cpp_vision():
    """Check if llama-cpp-python with vision support is available"""
    try:
        from llama_cpp import Llama
        from llama_cpp.llama_chat_format import Llava15ChatHandler
        return Llama, Llava15ChatHandler
    except ImportError:
        return None, None

def load_model_for_inference(model_id: str, vision_mode: bool = False):
    """Load a model for inference (cached)"""
    cache_key = f"{model_id}_{'vision' if vision_mode else 'text'}"
    if cache_key in _loaded_models:
        return _loaded_models[cache_key]
    
    Llama = get_llama_cpp()
    if not Llama:
        return None
    
    # Map model IDs to files - use absolute paths
    base_dir = Path(__file__).parent.parent / "models"
    model_paths = {
        "tinyllama-1b-q4": str(base_dir / "tinyllama.gguf"),
        "phi-2-q4": str(base_dir / "phi-2.gguf"),
        "llava-v1.6-7b-q4": str(base_dir / "llava-v1.6-7b.Q4_K_M.gguf"),
    }
    
    model_path = model_paths.get(model_id)
    if not model_path or not os.path.exists(model_path):
        print(f"❌ Model file not found: {model_path}")
        return None
    
    try:
        print(f"Loading model: {model_id} from {model_path} (vision={vision_mode})")
        
        if vision_mode and model_id == "llava-v1.6-7b-q4":
            # Load vision model with chat handler
            Llama, Llava15ChatHandler = get_llama_cpp_vision()
            if not Llava15ChatHandler:
                print("❌ Vision support not available. Install: pip3 install llama-cpp-python")
                return None
            
            clip_path = str(base_dir / "mmproj-model-f16.gguf")
            print(f"Loading CLIP model from: {clip_path}")
            chat_handler = Llava15ChatHandler(clip_model_path=clip_path, verbose=False)
            llm = Llama(
                model_path=model_path,
                chat_handler=chat_handler,
                n_ctx=2048,
                n_threads=4,
                n_gpu_layers=0,
                verbose=False,
            )
        else:
            llm = Llama(
                model_path=model_path,
                n_ctx=2048,
                n_threads=4,
                n_gpu_layers=0,
                verbose=False,
            )
        
        _loaded_models[cache_key] = llm
        print(f"✅ Model loaded: {model_id}")
        return llm
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return None

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

REGISTRY_PATH = os.getenv("HUB_REGISTRY", "../hub/registry.json")

# Models
class ModelFile(BaseModel):
    filename: str
    path: str
    size_bytes: int = 0
    sha256: Optional[str] = None
    format: Optional[str] = None

class ModelCard(BaseModel):
    id: Optional[str] = None
    name: str
    task: str
    arch: Optional[str] = None
    quantization: Optional[str] = None
    license: Optional[str] = None
    tags: List[str] = []
    targets: List[str] = []
    created_at: Optional[str] = None
    downloads: int = 0
    files: List[ModelFile] = []
    readme_markdown: Optional[str] = None

# Registry helpers
def load_registry():
    try:
        with open(REGISTRY_PATH) as f:
            return json.load(f)
    except:
        return []

def save_registry(models):
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(models, f, indent=2)

# Endpoints
@app.get("/", response_class=HTMLResponse)
def root():
    """Serve the webapp interface"""
    index_path = WEBAPP_PATH / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse("<h1>InSystem Model Hub</h1><p>API running. Webapp not found.</p>")

@app.get("/api/v1/health")
def health():
    return {"status": "healthy", "version": "1.0.0", "uptime_seconds": 0, "memory": {}}

@app.get("/api/v1/info")
def info():
    return {"version": "1.0.0", "device": "auto", "threads": 8}

@app.get("/api/v1/hub/models")
def list_models():
    models = load_registry()
    return {"models": models, "count": len(models)}

@app.get("/api/v1/hub/models/{model_id}")
def get_model(model_id: str):
    models = load_registry()
    for m in models:
        if m.get("id") == model_id:
            return m
    raise HTTPException(404, "Model not found")

@app.post("/api/v1/hub/models")
def register_model(card: ModelCard):
    models = load_registry()
    if not card.id:
        card.id = f"model-{len(models)+1}"
    
    # Update if exists, otherwise append
    found = False
    for i, m in enumerate(models):
        if m.get("id") == card.id:
            models[i] = card.dict()
            found = True
            break
    
    if not found:
        models.append(card.dict())
    
    save_registry(models)
    return card

@app.get("/api/v1/hub/models/{model_id}/download")
def download_file(model_id: str, file: Optional[str] = None):
    models = load_registry()
    model = None
    for m in models:
        if m.get("id") == model_id:
            model = m
            break
    
    if not model:
        raise HTTPException(404, "Model not found")
    
    files = model.get("files", [])
    if not files:
        raise HTTPException(404, "No files available")
    
    # Find requested file or use first
    target_file = None
    for f in files:
        if not file or f.get("filename") == file:
            target_file = f
            break
    
    if not target_file:
        raise HTTPException(404, "File not found")
    
    file_path = target_file.get("path", "")
    if not os.path.exists(file_path):
        raise HTTPException(404, f"File not found on disk: {file_path}")
    
    return FileResponse(file_path, filename=target_file.get("filename"))

@app.post("/api/v1/generate")
def generate(payload: dict):
    """Generate text using loaded model"""
    model_id = payload.get("model", "tinyllama-1b-q4")
    prompt = payload.get("prompt", "")
    max_tokens = payload.get("max_tokens", 150)
    temperature = payload.get("temperature", 0.7)
    top_p = payload.get("top_p", 0.9)
    
    # Check if llama-cpp-python is available
    if not get_llama_cpp():
        return {
            "id": f"gen-{int(time.time())}",
            "text": "⚠️ llama-cpp-python not installed. Install with: pip3 install llama-cpp-python",
            "tokens": 0,
            "latency_ms": 0,
            "error": "llama-cpp-python not available"
        }
    
    # Load model
    start_time = time.time()
    llm = load_model_for_inference(model_id)
    
    if not llm:
        return {
            "id": f"gen-{int(time.time())}",
            "text": f"❌ Model '{model_id}' not available. Check models/ directory.",
            "tokens": 0,
            "latency_ms": 0,
            "error": "Model not found or failed to load"
        }
    
    try:
        # Generate
        result = llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            echo=False,
        )
        
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)
        
        generated_text = result['choices'][0]['text'].strip()
        tokens_generated = len(result['choices'][0]['text'].split())
        
        return {
            "id": f"gen-{int(time.time())}",
            "text": generated_text,
            "tokens": tokens_generated,
            "latency_ms": latency_ms,
            "model": model_id,
            "tokens_per_sec": round(tokens_generated / (latency_ms / 1000), 1) if latency_ms > 0 else 0
        }
    except Exception as e:
        return {
            "id": f"gen-{int(time.time())}",
            "text": f"❌ Error during generation: {str(e)}",
            "tokens": 0,
            "latency_ms": 0,
            "error": str(e)
        }

@app.post("/api/v1/vision/preload")
async def preload_vision_model(model_id: str = "llava-v1.6-7b-q4"):
    """Preload vision model to avoid first-time delay"""
    try:
        start = time.time()
        llm = load_model_for_inference(model_id, vision_mode=True)
        elapsed = time.time() - start
        
        if llm:
            return {
                "status": "loaded",
                "model": model_id,
                "load_time_seconds": round(elapsed, 2),
                "message": "Vision model loaded and ready for real-time analysis"
            }
        else:
            return {
                "status": "error",
                "model": model_id,
                "message": "Failed to load vision model"
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/v1/vision/analyze")
async def analyze_vision(
    model: str = Form("llava-v1.6-7b-q4"),
    prompt: str = Form("What's in this image?"),
    image: UploadFile = File(...),
    max_tokens: int = Form(150)
):
    """Analyze image using vision model"""
    
    # Check if vision support available
    Llama, Llava15ChatHandler = get_llama_cpp_vision()
    if not Llama or not Llava15ChatHandler:
        return {
            "id": f"vision-{int(time.time())}",
            "text": "⚠️ Vision support not available. Install: pip3 install llama-cpp-python (with vision support)",
            "error": "Vision support not available"
        }
    
    try:
        start_time = time.time()
        
        # Read image data
        image_data = await image.read()
        
        # Convert to base64 data URI
        import base64
        b64_image = base64.b64encode(image_data).decode('utf-8')
        data_uri = f"data:image/jpeg;base64,{b64_image}"
        
        # Load vision model
        llm = load_model_for_inference(model, vision_mode=True)
        
        if not llm:
            return {
                "id": f"vision-{int(time.time())}",
                "text": f"❌ Vision model '{model}' not available. Make sure llava-v1.6-7b.Q4_K_M.gguf exists in models/",
                "error": "Model not found"
            }
        
        # Create vision prompt
        result = llm.create_chat_completion(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_uri}}
                    ]
                }
            ],
            max_tokens=max_tokens
        )
        
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)
        
        response_text = result['choices'][0]['message']['content']
        
        return {
            "id": f"vision-{int(time.time())}",
            "text": response_text,
            "latency_ms": latency_ms,
            "model": model,
            "image_size": len(image_data),
            "prompt": prompt
        }
        
    except Exception as e:
        return {
            "id": f"vision-{int(time.time())}",
            "text": f"❌ Error during vision analysis: {str(e)}",
            "error": str(e)
        }

@app.post("/api/v1/vision/pipeline")
async def vision_pipeline(
    model: str = Form("llava-v1.6-7b-q4"),
    prompt: str = Form("Describe what you see"),
    image: UploadFile = File(...),
    max_tokens: int = Form(100)
):
    """
    Vision pipeline: YOLO (fast object detection) + LLaVA (detailed understanding)
    Returns: {detections: [{class, confidence, bbox}], description: str, latency_ms: int}
    """
    try:
        start = time.time()
        
        # Read image data once
        image_data = await image.read()
        
        # Step 1: YOLO object detection (fast ~50-100ms)
        yolo_start = time.time()
        detections = []
        
        try:
            from ultralytics import YOLO
            import cv2
            import numpy as np
            
            # Load YOLO model (cached automatically by ultralytics)
            yolo_model_path = Path(__file__).parent.parent / "models" / "yolov8n.pt"
            yolo_model = YOLO(str(yolo_model_path))
            
            # Convert image to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is not None:
                # Run YOLO detection
                results = yolo_model(img, verbose=False)
                
                # Extract detections
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        class_name = result.names[cls]
                        
                        detections.append({
                            "class": class_name,
                            "confidence": round(conf, 3),
                            "bbox": {
                                "x1": round(x1),
                                "y1": round(y1),
                                "x2": round(x2),
                                "y2": round(y2)
                            }
                        })
                
                yolo_time = round((time.time() - yolo_start) * 1000, 2)
        except Exception as yolo_error:
            print(f"⚠️ YOLO error: {yolo_error}")
            yolo_time = 0
        
        # Step 2: LLaVA detailed understanding (slow ~2-5s)
        llava_start = time.time()
        description = ""
        
        # Build context-aware prompt with YOLO detections
        if detections:
            objects_found = ", ".join([d["class"] for d in detections])
            enhanced_prompt = f"{prompt}. I detected: {objects_found}. Please describe the scene in detail."
        else:
            enhanced_prompt = prompt
        
        # Load LLaVA model
        llm = load_model_for_inference(model, vision_mode=True)
        if not llm:
            description = "LLaVA model not available"
        else:
            # Convert image to base64 data URI
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            image_uri = f"data:image/jpeg;base64,{image_b64}"
            
            # Run LLaVA inference
            result = llm.create_chat_completion(
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_uri}},
                        {"type": "text", "text": enhanced_prompt}
                    ]
                }],
                max_tokens=max_tokens
            )
            description = result['choices'][0]['message']['content']
        
        llava_time = round((time.time() - llava_start) * 1000, 2)
        total_time = round((time.time() - start) * 1000, 2)
        
        return {
            "id": f"pipeline-{int(time.time())}",
            "detections": detections,
            "detection_count": len(detections),
            "description": description,
            "latency_ms": {
                "yolo": yolo_time,
                "llava": llava_time,
                "total": total_time
            },
            "model": {
                "yolo": "yolov8n",
                "llava": model
            }
        }
        
    except Exception as e:
        return {
            "id": f"pipeline-{int(time.time())}",
            "error": str(e),
            "detections": [],
            "description": f"❌ Pipeline error: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
