# YOLO + LLaVA Vision Pipeline

## ✅ Pipeline Complete

The vision system now uses a **two-stage pipeline** that combines:

1. **YOLOv8 nano** - Fast object detection (~50-100ms)
2. **LLaVA v1.6 7B** - Detailed scene understanding (~2-5s)

## 🎯 What You Get

### Real-time Object Detection (YOLO)
- **Speed**: ~50-100ms per frame
- **Bounding boxes**: Draws colored boxes around detected objects
- **Labels**: Shows object class + confidence %
- **Objects detected**: person, phone, laptop, cup, keyboard, mouse, etc. (80 COCO classes)

### Intelligent Scene Understanding (LLaVA)
- **Speed**: ~2-5 seconds per frame (after initial 10-30s load)
- **Description**: Natural language description of the scene
- **Context**: LLaVA receives YOLO detections to provide better descriptions

## 🚀 How It Works

```
Camera Frame → YOLO Detection (100ms) → Draw Bounding Boxes
                      ↓
              LLaVA Analysis (2-5s) → Text Description
```

### Pipeline Flow:
1. Camera captures frame every 1 second
2. YOLO processes frame instantly (~100ms):
   - Detects objects
   - Returns bounding box coordinates
   - Frontend draws colored boxes with labels
3. LLaVA analyzes same frame (~2-5s):
   - Receives detected objects as context
   - Generates detailed description
   - Updates text overlay

## 📊 Performance

| Component | Speed | Purpose |
|-----------|-------|---------|
| YOLO | ~50-100ms | Object detection + bounding boxes |
| LLaVA | ~2-5s | Scene understanding + descriptions |
| **Total** | ~2-5s | Combined pipeline per frame |

## 🎨 Visual Output

**Bounding Boxes:**
- Different colors for each object
- Class name + confidence % (e.g., "person 94%")
- Colored rectangles drawn on video overlay

**Text Analysis:**
- Detection count: "✓ Detected 3 objects (YOLO: 87ms)"
- Timing breakdown: "YOLO: 87ms | LLaVA: 2431ms"
- Scene description from LLaVA

## 🔌 API Endpoint

### POST `/api/v1/vision/pipeline`

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/vision/pipeline \
  -F "model=llava-v1.6-7b-q4" \
  -F "prompt=Describe what you see" \
  -F "image=@frame.jpg" \
  -F "max_tokens=100"
```

**Response:**
```json
{
  "id": "pipeline-1700123456",
  "detections": [
    {
      "class": "person",
      "confidence": 0.943,
      "bbox": {"x1": 120, "y1": 45, "x2": 580, "y2": 720}
    },
    {
      "class": "cell phone",
      "confidence": 0.876,
      "bbox": {"x1": 340, "y1": 380, "x2": 420, "y2": 520}
    }
  ],
  "detection_count": 2,
  "description": "A person is holding a cell phone in their hand. The phone appears to be a smartphone with a dark case.",
  "latency_ms": {
    "yolo": 87,
    "llava": 2431,
    "total": 2518
  },
  "model": {
    "yolo": "yolov8n",
    "llava": "llava-v1.6-7b-q4"
  }
}
```

## 📦 Models Used

| Model | Size | Purpose |
|-------|------|---------|
| YOLOv8n | 6.2 MB | Object detection |
| LLaVA v1.6 7B Q4 | 3.8 GB | Vision-language understanding |
| CLIP mmproj | 596 MB | Visual feature extraction |

## 🎮 How to Use

1. **Open webapp**: http://localhost:8080
2. **Select Model**: Choose "LLaVA v1.6 7B (Vision)"
3. **Input Type**: "Camera (Real-time Vision)" (auto-selected)
4. **Click "Start Camera"**: Camera opens with AR overlay
5. **See Results**:
   - Colored bounding boxes appear on detected objects
   - Object labels show class + confidence
   - Text description updates below video
   - Timing stats show YOLO and LLaVA performance

## 🔧 Technical Details

### YOLO Detection
- Model: YOLOv8n (nano variant for speed)
- Framework: Ultralytics
- Classes: 80 COCO categories
- Confidence threshold: Auto-adjusted

### LLaVA Integration
- Model: LLaVA v1.6 7B Q4_K_M quantized
- Context: Receives YOLO detections in prompt
- Enhanced prompt: "I detected: person, phone. Please describe the scene."

### Frontend Rendering
- Canvas overlay for bounding boxes (z-index: 2)
- Video feed with AR-style interface
- Real-time updates every 1 second
- Persistent labels (don't flicker)

## 💡 Why This Approach?

**Problem**: LLaVA alone can't draw bounding boxes (it's a vision-language model)

**Solution**: YOLO + LLaVA pipeline:
- YOLO handles fast object detection with precise coordinates
- LLaVA provides intelligent scene understanding
- Best of both worlds: speed + intelligence

## 🎯 Speed Improvements

- **Before**: LLaVA only (~2-5s per frame, no boxes)
- **After**: YOLO boxes appear instantly (~100ms), LLaVA description follows

This gives the perception of sub-second response because bounding boxes appear immediately!

## 🚦 Next Steps

Current performance is optimal for CPU-based inference. For faster LLaVA:
- Use GPU acceleration (10-50x faster)
- Use smaller vision model
- Reduce max_tokens for shorter responses

---

**Status**: ✅ Pipeline fully operational at http://localhost:8080
