#!/bin/bash
cd /private/tmp/insystem-compute/models
echo "📥 Model Download Status"
echo "======================="
echo ""
for file in tinyllama.gguf phi-2.gguf embed.onnx; do
  if [ -f "$file" ]; then
    size=$(ls -lh "$file" | awk '{print $5}')
    echo "✅ $file - $size"
  else
    echo "⏳ $file - downloading..."
  fi
done
echo ""
echo "💡 Models are being downloaded from Hugging Face"
echo "   TinyLlama: ~638MB"
echo "   Phi-2: ~1.6GB"
