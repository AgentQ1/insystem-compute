// InSystem Model Hub - Google AI Studio inspired UI
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080/api/v1'
  : 'http://localhost:8080/api/v1'; // Change this to your backend URL after deployment

let allModels = [];
let activeFilters = {
  task: 'all',
  platform: null,
  search: ''
};

// Demo data for when backend is offline
const DEMO_MODELS = [
  {
    id: "tinyllama-1b-q4",
    name: "TinyLlama 1.1B Chat (Q4)",
    task: "text-generation",
    arch: "llama",
    quantization: "q4_k_m",
    tags: ["gguf", "int4", "edge"],
    targets: ["ios", "android", "rpi", "jetson"],
    downloads: 1250,
    files: [{filename: "tinyllama.gguf", size_bytes: 669376512, format: "gguf"}]
  },
  {
    id: "phi-2-q4",
    name: "Phi-2 2.7B (Q4)",
    task: "text-generation",
    arch: "phi",
    tags: ["gguf", "reasoning"],
    targets: ["ios", "android", "macos"],
    downloads: 3420,
    files: [{filename: "phi-2.gguf", size_bytes: 1610612736, format: "gguf"}]
  },
  {
    id: "llava-v1.6-7b",
    name: "LLaVA v1.6 7B (Q4)",
    task: "vision",
    arch: "llava",
    tags: ["gguf", "vision", "multimodal"],
    targets: ["desktop", "server"],
    downloads: 892,
    files: [{filename: "llava-v1.6-7b.Q4_K_M.gguf", size_bytes: 4033871872, format: "gguf"}]
  }
];

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFilters();
  checkGatewayHealth();
  loadModels();
  loadPlaygroundModels();
  initSliders();
});

// Navigation
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });
  
  // Update content
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `${view}-view`);
  });
}

// Gateway health check
async function checkGatewayHealth() {
  const status = document.getElementById('gateway-status');
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await res.json();
      status.textContent = `Connected (v${data.version})`;
    }
  } catch (err) {
    status.textContent = 'Gateway offline';
    status.parentElement.querySelector('.status-dot').style.background = '#EF4444';
  }
}

// Load models from Hub API
async function loadModels() {
  const grid = document.getElementById('models-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div>Loading models...</div>';
  
  try {
    const res = await fetch(`${API_BASE}/hub/models`, { mode: 'cors' });
    if (!res.ok) throw new Error('Backend offline');
    const data = await res.json();
    allModels = data.models || [];
    renderModels();
  } catch (err) {
    console.log('Backend offline, using demo data');
    allModels = DEMO_MODELS;
    renderModels();
    // Show info message
    const status = document.getElementById('gateway-status');
    status.textContent = 'Demo Mode (Backend offline)';
    status.parentElement.querySelector('.status-dot').style.background = '#F59E0B';
  }
}

function renderModels() {
  const grid = document.getElementById('models-grid');
  const filtered = filterModels(allModels);
  
  document.getElementById('model-count').textContent = filtered.length;
  
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="loading">No models found matching your filters.</div>';
    return;
  }
  
  grid.innerHTML = filtered.map(model => createModelCard(model)).join('');
}

function filterModels(models) {
  return models.filter(model => {
    // Task filter
    if (activeFilters.task !== 'all' && model.task !== activeFilters.task) {
      return false;
    }
    
    // Platform filter
    if (activeFilters.platform) {
      if (!model.targets || !model.targets.includes(activeFilters.platform)) {
        return false;
      }
    }
    
    // Search filter
    if (activeFilters.search) {
      const searchText = activeFilters.search.toLowerCase();
      const searchable = [
        model.name,
        model.task,
        model.arch,
        ...(model.tags || []),
        ...(model.targets || [])
      ].join(' ').toLowerCase();
      
      if (!searchable.includes(searchText)) {
        return false;
      }
    }
    
    return true;
  });
}

function createModelCard(model) {
  const initial = (model.name || 'M')[0].toUpperCase();
  const tags = (model.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const platforms = (model.targets || []).slice(0, 3).map(p => 
    `<span class="tag platform">${p}</span>`
  ).join('');
  
  const files = (model.files || []).map(file => `
    <div class="file-item">
      <div class="file-info">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
        </svg>
        <span>${file.filename}</span>
        <span>•</span>
        <span>${file.format || 'unknown'}</span>
        <span>•</span>
        <span>${formatBytes(file.size_bytes || 0)}</span>
      </div>
    </div>
  `).join('');
  
  return `
    <div class="model-card" onclick="showModelDetail('${model.id}')">
      <div class="model-header">
        <div class="model-icon">${initial}</div>
      </div>
      <h3 class="model-title">${model.name}</h3>
      <div class="model-task">${model.task || 'text-generation'} · ${model.arch || 'unknown'} · ${model.quantization || 'q4'}</div>
      <div class="model-tags">
        ${tags}
        ${platforms}
      </div>
      ${files ? `<div class="model-files">${files}</div>` : ''}
      <button class="btn" style="width: 100%; margin-top: 12px; background: transparent; border: 1px solid var(--border); color: var(--text);" onclick="event.stopPropagation(); showModelDetail('${model.id}')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V3zM2 7a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V7zM2 11a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-1z"/>
        </svg>
        View
      </button>
    </div>
  `;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function downloadFile(modelId, filename) {
  const url = `${API_BASE}/hub/models/${modelId}/download?file=${encodeURIComponent(filename)}`;
  window.open(url, '_blank');
}

// Filters
function initFilters() {
  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    activeFilters.search = e.target.value;
    renderModels();
  });
  
  // Task filters
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilters.task = chip.dataset.filter;
      renderModels();
    });
  });
  
  // Platform filters
  document.querySelectorAll('.chip[data-platform]').forEach(chip => {
    chip.addEventListener('click', () => {
      const platform = chip.dataset.platform;
      
      if (activeFilters.platform === platform) {
        chip.classList.remove('active');
        activeFilters.platform = null;
      } else {
        document.querySelectorAll('.chip[data-platform]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilters.platform = platform;
      }
      
      renderModels();
    });
  });
}

// Playground
async function loadPlaygroundModels() {
  const select = document.getElementById('playground-model');
  try {
    const res = await fetch(`${API_BASE}/hub/models`);
    const data = await res.json();
    const models = data.models || [];
    
    if (models.length === 0) {
      select.innerHTML = '<option value="">No models available</option>';
      return;
    }
    
    select.innerHTML = models.map(m => 
      `<option value="${m.id}">${m.name} (${m.task || 'text-generation'})</option>`
    ).join('');
    
    // Add model change listener
    select.addEventListener('change', updatePlaygroundUI);
    
  } catch (err) {
    select.innerHTML = '<option value="">Failed to load models</option>';
  }
}

function updatePlaygroundUI() {
  const modelId = document.getElementById('playground-model').value;
  const selectedModel = allModels.find(m => m.id === modelId);
  
  if (!selectedModel) return;
  
  const modelType = selectedModel.task || 'text-generation';
  const infoDiv = document.getElementById('model-type-info');
  const inputTypeGroup = document.getElementById('input-type-group');
  const textInputGroup = document.getElementById('text-input-group');
  const imageInputGroup = document.getElementById('image-input-group');
  const audioInputGroup = document.getElementById('audio-input-group');
  const maxTokensGroup = document.getElementById('max-tokens-group');
  const temperatureGroup = document.getElementById('temperature-group');
  const toppGroup = document.getElementById('topp-group');
  const runBtnText = document.getElementById('run-btn-text');
  
  // Reset visibility
  textInputGroup.style.display = 'block';
  imageInputGroup.style.display = 'none';
  audioInputGroup.style.display = 'none';
  inputTypeGroup.style.display = 'none';
  
  // Configure based on model type
  switch(modelType) {
    case 'embedding':
      infoDiv.style.display = 'block';
      infoDiv.innerHTML = '<strong>Embedding Model:</strong> Generates vector embeddings for semantic search, RAG, and similarity matching.';
      maxTokensGroup.style.display = 'none';
      temperatureGroup.style.display = 'none';
      toppGroup.style.display = 'none';
      runBtnText.textContent = 'Generate Embeddings';
      document.getElementById('prompt-input').placeholder = 'Enter text to generate embeddings...';
      break;
      
    case 'vision':
      infoDiv.style.display = 'block';
      infoDiv.innerHTML = '<strong>Vision Model:</strong> Analyzes images for object detection, captioning, and visual Q&A.';
      inputTypeGroup.style.display = 'block';
      runBtnText.textContent = 'Analyze';
      document.getElementById('prompt-input').placeholder = 'Ask a question about the image...';
      break;
      
    case 'audio':
      infoDiv.style.display = 'block';
      infoDiv.innerHTML = '<strong>Audio Model:</strong> Transcribes speech to text or generates audio from text.';
      textInputGroup.style.display = 'none';
      audioInputGroup.style.display = 'block';
      maxTokensGroup.style.display = 'none';
      temperatureGroup.style.display = 'none';
      toppGroup.style.display = 'none';
      runBtnText.textContent = 'Transcribe';
      break;
      
    case 'multimodal':
      infoDiv.style.display = 'block';
      infoDiv.innerHTML = '<strong>Multimodal Model:</strong> Processes both text and images together.';
      inputTypeGroup.style.display = 'block';
      runBtnText.textContent = 'Generate';
      document.getElementById('prompt-input').placeholder = 'Describe what you want to generate...';
      break;
      
    default: // text-generation
      infoDiv.style.display = 'none';
      maxTokensGroup.style.display = 'block';
      temperatureGroup.style.display = 'block';
      toppGroup.style.display = 'block';
      runBtnText.textContent = 'Generate';
      document.getElementById('prompt-input').placeholder = 'Enter your prompt...';
      break;
  }
}

function initSliders() {
  const tempSlider = document.getElementById('temperature');
  const tempValue = document.getElementById('temp-value');
  tempSlider.addEventListener('input', (e) => {
    tempValue.textContent = e.target.value;
  });
  
  const toppSlider = document.getElementById('top-p');
  const toppValue = document.getElementById('topp-value');
  toppSlider.addEventListener('input', (e) => {
    toppValue.textContent = e.target.value;
  });
  
  // Input type change listener
  const inputTypeSelect = document.getElementById('input-type');
  inputTypeSelect.addEventListener('change', (e) => {
    const textInputGroup = document.getElementById('text-input-group');
    const imageInputGroup = document.getElementById('image-input-group');
    const audioInputGroup = document.getElementById('audio-input-group');
    const runBtnText = document.getElementById('run-btn-text');
    
    textInputGroup.style.display = 'none';
    imageInputGroup.style.display = 'none';
    audioInputGroup.style.display = 'none';
    
    // Restore all controls first (camera mode will hide them)
    const maxTokensGroup = document.getElementById('max-tokens-group');
    const tempGroup = document.getElementById('temperature-group');
    const toppGroup = document.getElementById('topp-group');
    const responseLabel = document.getElementById('response-label');
    if (maxTokensGroup) maxTokensGroup.style.display = 'block';
    if (tempGroup) tempGroup.style.display = 'block';
    if (toppGroup) toppGroup.style.display = 'block';
    if (responseLabel) responseLabel.style.display = 'block';
    
    switch(e.target.value) {
      case 'text':
        textInputGroup.style.display = 'block';
        runBtnText.textContent = 'Generate';
        break;
      case 'camera':
        // Camera mode - hide all inputs and expand camera view
        textInputGroup.style.display = 'none';
        imageInputGroup.style.display = 'none';
        runBtnText.textContent = 'Start Camera';
        
        // Hide unnecessary controls in camera mode
        const maxTokensGroup = document.getElementById('max-tokens-group');
        const tempGroup = document.getElementById('temperature-group');
        const toppGroup = document.getElementById('topp-group');
        const responseLabel = document.getElementById('response-label');
        if (maxTokensGroup) maxTokensGroup.style.display = 'none';
        if (tempGroup) tempGroup.style.display = 'none';
        if (toppGroup) toppGroup.style.display = 'none';
        if (responseLabel) responseLabel.style.display = 'none';
        
        setTimeout(() => openCameraRealtime(), 300);
        break;
      case 'image':
        imageInputGroup.style.display = 'block';
        runBtnText.textContent = 'Analyze';
        break;
      case 'audio':
        audioInputGroup.style.display = 'block';
        runBtnText.textContent = 'Transcribe';
        break;
      case 'multimodal':
        textInputGroup.style.display = 'block';
        imageInputGroup.style.display = 'block';
        runBtnText.textContent = 'Generate';
        break;
    }
  });
  
  // Image preview
  const imageInput = document.getElementById('image-input');
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('preview-img').src = event.target.result;
        document.getElementById('image-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Audio preview
  const audioInput = document.getElementById('audio-input');
  audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('preview-audio').src = event.target.result;
        document.getElementById('audio-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

async function runInference() {
  const modelId = document.getElementById('playground-model').value;
  const prompt = document.getElementById('prompt-input').value;
  const maxTokens = parseInt(document.getElementById('max-tokens').value);
  const temperature = parseFloat(document.getElementById('temperature').value);
  const topP = parseFloat(document.getElementById('top-p').value);
  const inputType = document.getElementById('input-type').value;
  
  const output = document.getElementById('response-output');
  const stats = document.getElementById('inference-stats');
  
  const selectedModel = allModels.find(m => m.id === modelId);
  if (!selectedModel) {
    output.innerHTML = '<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">Please select a model</p></div>';
    return;
  }
  
  const modelType = selectedModel.task || 'text-generation';
  
  // Handle different model types
  if (modelType === 'embedding') {
    if (!prompt.trim()) {
      output.innerHTML = '<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">Please enter text to generate embeddings</p></div>';
      return;
    }
    
    output.innerHTML = '<div class="loading"><div class="spinner"></div>Generating embeddings...</div>';
    stats.style.display = 'none';
    
    // Simulate embedding generation (replace with real API call)
    setTimeout(() => {
      const vectorDim = 384;
      const vector = Array.from({length: vectorDim}, () => (Math.random() * 2 - 1).toFixed(4));
      output.innerHTML = `<div style="padding: 16px; background: var(--background); border-radius: 8px;">
        <div style="margin-bottom: 12px;"><strong>Vector Dimension:</strong> ${vectorDim}</div>
        <div style="margin-bottom: 12px;"><strong>Sample Values:</strong></div>
        <code style="font-size: 12px; display: block; overflow-x: auto; white-space: pre;">[${vector.slice(0, 10).join(', ')}, ...]</code>
        <div style="margin-top: 12px; color: var(--text-secondary); font-size: 13px;">
          Full ${vectorDim}-dimensional embedding vector generated. Use this for semantic search, RAG, or similarity matching.
        </div>
      </div>`;
    }, 500);
    return;
  }
  
  if (modelType === 'vision' || modelType === 'multimodal') {
    // If camera mode, just ensure camera is open - real-time analysis handles it
    if (inputType === 'camera') {
      if (!cameraStream) {
        openCameraRealtime();
      }
      return; // Real-time analysis handles the rest
    }
    
    const imageFile = document.getElementById('image-input').files[0];
    if (!imageFile && inputType !== 'text') {
      output.innerHTML = '<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">Please upload an image or switch to Camera mode</p></div>';
      return;
    }
    
    output.innerHTML = '<div class="loading"><div class="spinner"></div>Analyzing image...</div>';
    stats.style.display = 'none';
    
    try {
      const startTime = Date.now();
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('model', modelId);
      formData.append('prompt', prompt || 'What is in this image?');
      formData.append('image', imageFile);
      formData.append('max_tokens', maxTokens);
      
      const res = await fetch(`${API_BASE}/vision/analyze`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      const latency = Date.now() - startTime;
      
      if (data.error || !data.text) {
        output.innerHTML = `<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">${data.text || data.error || 'Vision inference failed. Please upload an image and try again.'}</p></div>`;
        return;
      }
      
      output.textContent = data.text;
      stats.style.display = 'flex';
      const tokenCount = data.text.split(/\s+/).filter(t => t.length > 0).length;
      document.getElementById('stat-tokens').textContent = tokenCount;
      document.getElementById('stat-latency').textContent = `${data.latency_ms || latency}ms`;
      document.getElementById('stat-throughput').textContent = 
        ((tokenCount / ((data.latency_ms || latency) / 1000))).toFixed(1);
    } catch (err) {
      output.innerHTML = `<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">Error: ${err.message}</p></div>`;
      console.error('Vision inference error:', err);
    }
    return;
  }
  
  if (modelType === 'audio') {
    const audioFile = document.getElementById('audio-input').files[0];
    if (!audioFile) {
      output.innerHTML = '<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">Please upload an audio file</p></div>';
      return;
    }
    
    output.innerHTML = '<div class="loading"><div class="spinner"></div>Transcribing audio...</div>';
    stats.style.display = 'none';
    
    // Simulate audio transcription
    setTimeout(() => {
      output.textContent = `[Audio Model Demo]\n\nTranscription: This is a simulated transcription from an audio model. In production, this would transcribe the uploaded audio file.\n\nThe transcribed text would appear here with timestamps and speaker detection if supported.`;
      stats.style.display = 'flex';
      document.getElementById('stat-tokens').textContent = '42';
      document.getElementById('stat-latency').textContent = '890ms';
      document.getElementById('stat-throughput').textContent = '47.2';
    }, 1200);
    return;
  }
  
  // Text generation models
  if (!prompt.trim()) {
    output.innerHTML = '<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">Please enter a prompt</p></div>';
    return;
  }
  
  output.innerHTML = '<div class="loading"><div class="spinner"></div>Generating...</div>';
  stats.style.display = 'none';
  
  try {
    const startTime = Date.now();
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId || 'default',
        prompt: prompt,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP
      })
    });
    
    if (!res.ok) throw new Error('Generation failed');
    
    const data = await res.json();
    const elapsed = Date.now() - startTime;
    
    output.textContent = data.text || 'No response generated';
    
    // Show stats
    stats.style.display = 'flex';
    document.getElementById('stat-tokens').textContent = data.tokens || '-';
    document.getElementById('stat-latency').textContent = `${data.latency_ms || elapsed}ms`;
    const tps = data.tokens && data.latency_ms ? (data.tokens / (data.latency_ms / 1000)).toFixed(1) : '-';
    document.getElementById('stat-throughput').textContent = tps;
    
  } catch (err) {
    output.innerHTML = `<div class="output-placeholder" style="height: auto; padding: 24px;"><p style="color: #EF4444;">Error: ${err.message}. Make sure the gateway is running.</p></div>`;
    console.error('Inference error:', err);
  }
}

// Upload modal
function showUploadModal() {
  document.getElementById('upload-modal').classList.add('active');
}

function hideUploadModal() {
  document.getElementById('upload-modal').classList.remove('active');
}

async function submitModel() {
  const card = {
    name: document.getElementById('upload-name').value,
    task: document.getElementById('upload-task').value,
    arch: document.getElementById('upload-arch').value || undefined,
    quantization: document.getElementById('upload-quant').value || undefined,
    tags: document.getElementById('upload-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    targets: document.getElementById('upload-targets').value.split(',').map(t => t.trim()).filter(Boolean),
    files: [{
      filename: document.getElementById('upload-path').value.split('/').pop(),
      path: document.getElementById('upload-path').value,
      format: document.getElementById('upload-format').value || 'gguf',
      size_bytes: 0
    }]
  };
  
  if (!card.name || !card.files[0].path) {
    alert('Please fill in required fields (Name and File Path)');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/hub/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });
    
    if (!res.ok) throw new Error('Registration failed');
    
    alert('Model registered successfully!');
    hideUploadModal();
    loadModels();
    
    // Clear form
    document.getElementById('upload-name').value = '';
    document.getElementById('upload-arch').value = '';
    document.getElementById('upload-quant').value = '';
    document.getElementById('upload-tags').value = '';
    document.getElementById('upload-targets').value = '';
    document.getElementById('upload-path').value = '';
    
  } catch (err) {
    alert('Failed to register model: ' + err.message);
    console.error('Registration error:', err);
  }
}

// Close modal on background click
document.getElementById('upload-modal').addEventListener('click', (e) => {
  if (e.target.id === 'upload-modal') {
    hideUploadModal();
  }
});

document.getElementById('model-detail-modal').addEventListener('click', (e) => {
  if (e.target.id === 'model-detail-modal') {
    hideModelDetail();
  }
});

// Model detail modal
function showModelDetail(modelId) {
  const model = allModels.find(m => m.id === modelId);
  if (!model) return;
  
  const modal = document.getElementById('model-detail-modal');
  const content = document.getElementById('modal-model-content');
  document.getElementById('modal-model-name').textContent = model.name;
  
  const isEmbedding = model.task === 'embedding';
  const firstFile = model.files && model.files[0];
  const filename = firstFile ? firstFile.filename : 'model.gguf';
  const downloadUrl = `${API_BASE}/hub/models/${model.id}/download?file=${encodeURIComponent(filename)}`;
  
  // Generate platform-specific code
  const pythonCode = isEmbedding ? `from insystem_compute import Engine, ModelConfig

# Load ${model.name}
engine = Engine(device="auto")
config = ModelConfig(
    format="${model.files[0]?.format || 'gguf'}",
    task="embedding"
)
model = engine.load_model("${filename}", config)

# Generate embeddings
texts = [
    "Your text here",
    "Another text to embed"
]
embeddings = model.encode(texts)
print(f"Embeddings shape: {embeddings.shape}")

# Use for semantic search
query_emb = model.encode(["search query"])[0]
similarities = embeddings @ query_emb
print(f"Most similar: {texts[similarities.argmax()]}")` : `from insystem_compute import Engine, ModelConfig

# Load ${model.name}
engine = Engine(device="auto")
config = ModelConfig(
    format="${model.files[0]?.format || 'gguf'}",
    quantization=${model.quantization?.match(/\\d+/)?.[0] || 4},
    max_seq_len=2048
)
model = engine.load_model("${filename}", config)

# Generate text
response = model.generate(
    prompt="Explain quantum computing:",
    max_tokens=150,
    temperature=0.7
)
print(response)`;

  const iosCode = isEmbedding ? `import InSystemCompute

// Load ${model.name}
let config = EngineConfig(device: .auto)
let engine = try Engine(config: config)

let modelConfig = ModelConfig(
    format: .${model.files[0]?.format || 'onnx'},
    task: .embedding
)
let model = try engine.loadModel(
    path: "${filename}",
    config: modelConfig
)

// Generate embeddings
let texts = ["Your text", "Another text"]
let embeddings = try model.encode(texts)
print("Embeddings: \\(embeddings.count)")` : `import InSystemCompute

// Load ${model.name}
let config = EngineConfig(
    device: .auto,
    memoryLimit: 4_000_000_000
)
let engine = try Engine(config: config)

let modelConfig = ModelConfig(
    format: .${model.files[0]?.format || 'gguf'},
    quantization: ${model.quantization?.match(/\\d+/)?.[0] || 4}
)
let model = try engine.loadModel(
    path: "${filename}",
    config: modelConfig
)

// Generate
let response = try model.generate(
    prompt: "Hello!",
    maxTokens: 50
)
print(response)`;

  const androidCode = isEmbedding ? `import com.insystem.compute.*

// Load ${model.name}
val engine = Engine(
    device = Device.AUTO,
    memoryLimit = 4_000_000_000L
)

val config = ModelConfig(
    format = ModelFormat.${model.files[0]?.format?.toUpperCase() || 'ONNX'},
    task = Task.EMBEDDING
)
val model = engine.loadModel(
    path = "${filename}",
    config = config
)

// Generate embeddings
val texts = listOf("Text 1", "Text 2")
val embeddings = model.encode(texts)
Log.d("Embeddings", "Size: \${embeddings.size}")` : `import com.insystem.compute.*

// Load ${model.name}
val engine = Engine(
    device = Device.AUTO,
    memoryLimit = 4_000_000_000L
)

val config = ModelConfig(
    format = ModelFormat.${model.files[0]?.format?.toUpperCase() || 'GGUF'},
    quantization = ${model.quantization?.match(/\\d+/)?.[0] || 4}
)
val model = engine.loadModel(
    path = "${filename}",
    config = config
)

// Generate
val response = model.generate(
    prompt = "Hello!",
    maxTokens = 50
)
Log.d("Response", response)`;

  const curlDownload = `curl -O "${downloadUrl}"`;
  const curlGenerate = `curl -X POST ${API_BASE}/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.id}",
    "prompt": "Your prompt here",
    "max_tokens": 100
  }'`;
  
  const isEmbeddingModel = model.task === 'embedding';
  
  content.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h3 style="margin-bottom: 8px;">${model.name}</h3>
      <p style="color: var(--text-secondary); margin-bottom: 16px;">
        ${model.task || 'text-generation'} • ${model.arch || 'unknown'} • ${model.quantization || 'q4'}
      </p>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        ${(model.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
        ${(model.targets || []).map(t => `<span class="tag platform">${t}</span>`).join('')}
      </div>
      ${!isEmbeddingModel ? `
        <button class="btn btn-primary" style="width: 100%;" onclick="tryInPlayground('${model.id}')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 3l8 5-8 5V3z"/>
          </svg>
          Try in Playground
        </button>
      ` : `
        <div style="padding: 12px; background: var(--primary-light); border-radius: 8px; color: var(--text-secondary); font-size: 14px;">
          <strong>Embedding Model:</strong> Generates vector embeddings for semantic search, RAG, and similarity matching. Use via SDK or API (see code examples below).
        </div>
      `}
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">Download</h4>
      ${(model.files || []).map(file => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--background); border-radius: 8px; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 500;">${file.filename}</div>
            <div style="font-size: 13px; color: var(--text-secondary);">${file.format || 'unknown'} • ${formatBytes(file.size_bytes || 0)}</div>
          </div>
          <button class="download-btn" onclick="downloadFile('${model.id}', '${file.filename}')">
            Download
          </button>
        </div>
      `).join('')}
      
      <div style="margin-top: 16px;">
        <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 8px;">Command Line</label>
        <pre style="background: var(--background); padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto;"><code>${curlDownload}</code></pre>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">Python SDK</h4>
      <pre style="background: var(--background); padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; overflow-x: auto;"><code>${pythonCode}</code></pre>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">iOS (Swift)</h4>
      <pre style="background: var(--background); padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; overflow-x: auto;"><code>${iosCode}</code></pre>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">Android (Kotlin)</h4>
      <pre style="background: var(--background); padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; overflow-x: auto;"><code>${androidCode}</code></pre>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">REST API</h4>
      <pre style="background: var(--background); padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; overflow-x: auto;"><code>${curlGenerate}</code></pre>
    </div>
  `;
  
  modal.classList.add('active');
}

function hideModelDetail() {
  document.getElementById('model-detail-modal').classList.remove('active');
}

function tryInPlayground(modelId) {
  // Close modal
  hideModelDetail();
  
  // Switch to playground view
  switchView('playground');
  
  // Set the model in playground
  setTimeout(() => {
    const select = document.getElementById('playground-model');
    if (select) {
      select.value = modelId;
      // Trigger change event to update UI
      select.dispatchEvent(new Event('change'));
    }
    
    // Check if it's a vision model - auto-select camera mode
    const model = allModels.find(m => m.id === modelId);
    if (model && (model.task === 'vision' || model.task === 'multimodal')) {
      // Switch to camera input type (will auto-open camera via change event)
      const inputTypeSelect = document.getElementById('input-type');
      if (inputTypeSelect) {
        inputTypeSelect.value = 'camera';
        inputTypeSelect.dispatchEvent(new Event('change'));
      }
      
      // Set default prompt
      const promptInput = document.getElementById('prompt-input');
      if (promptInput && !promptInput.value) {
        promptInput.value = 'What do you see? Describe everything in detail.';
      }
    }
  }, 100);
}

// Copy to clipboard functionality
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M5.5 11L1.5 7L2.91 5.59L5.5 8.17L11.09 2.59L12.5 4L5.5 11Z"/>
      </svg>
      Copied!
    `;
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Add copy buttons to all code blocks
function addCopyButtons() {
  document.querySelectorAll('.docs-card pre, pre').forEach(pre => {
    // Skip if already has a copy button
    if (pre.parentElement.classList.contains('code-block')) return;
    
    const code = pre.querySelector('code');
    if (!code) return;
    
    // Wrap pre in code-block div
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    
    // Create copy button
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M4 2a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V2zM2 5a1 1 0 011-1v7a1 1 0 001 1h5a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"/>
      </svg>
      Copy
    `;
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(code.textContent, button);
    });
    
    wrapper.appendChild(button);
  });
}

// Call addCopyButtons after DOM updates
const originalShowModelDetail = showModelDetail;
showModelDetail = function(modelId) {
  originalShowModelDetail(modelId);
  setTimeout(addCopyButtons, 100);
};

// Add copy buttons on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(addCopyButtons, 500);
});

// Re-add copy buttons when switching views
const originalSwitchView = switchView;
switchView = function(view) {
  originalSwitchView(view);
  setTimeout(addCopyButtons, 100);
};

// Camera functionality
let cameraStream = null;
let capturedImageBlob = null;

async function openCamera() {
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-stream');
  
  try {
    // Request camera access
    cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment', // Use back camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    video.srcObject = cameraStream;
    modal.style.display = 'flex';
  } catch (err) {
    alert('Camera access denied or not available: ' + err.message);
    console.error('Camera error:', err);
  }
}

function closeCamera() {
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-stream');
  
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  
  video.srcObject = null;
  modal.style.display = 'none';
}

function capturePhoto() {
  const video = document.getElementById('camera-stream');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Convert to blob
  canvas.toBlob((blob) => {
    capturedImageBlob = blob;
    
    // Show preview
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    previewImg.src = URL.createObjectURL(blob);
    preview.style.display = 'block';
    
    // Create a File object for the form
    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.getElementById('image-input').files = dataTransfer.files;
    
    closeCamera();
  }, 'image/jpeg', 0.9);
}

function previewImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('image-preview');
      const previewImg = document.getElementById('preview-img');
      previewImg.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function clearImage() {
  const preview = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');
  const fileInput = document.getElementById('image-input');
  
  previewImg.src = '';
  preview.style.display = 'none';
  fileInput.value = '';
  capturedImageBlob = null;
}

// Real-time camera analysis
let realtimeAnalysisInterval = null;
let isAnalyzing = false;

async function openCameraRealtime() {
  const output = document.getElementById('response-output');
  const video = document.getElementById('camera-stream');
  
  try {
    // Show preloading status in Response area
    output.innerHTML = `
      <div style="padding: 16px; background: var(--background); border-radius: 8px;">
        <strong style="color: var(--primary);">⏳ Preparing Vision AI...</strong>
        <div style="color: var(--text-secondary); margin-top: 8px;">
          Loading 3.8GB LLaVA model into memory (10-30 seconds, one-time)...
        </div>
      </div>
    `;
    
    // Preload model while camera is opening
    const modelId = document.getElementById('playground-model').value;
    const preloadPromise = fetch(`${API_BASE}/vision/preload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: modelId })
    }).then(res => res.json()).then(data => {
      console.log('Model preload:', data);
      window._modelLoaded = true;
    }).catch(err => console.error('Preload error:', err));
    
    // Request camera access
    cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user', // Use front camera for face detection
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    video.srcObject = cameraStream;
    
    // Display camera and analysis in Response area
    video.onloadedmetadata = async () => {
      await preloadPromise; // Wait for model to finish loading
      
      // Show camera feed with bounding box canvas overlay - like test page
      // Remove output-box styling for clean look
      output.style.padding = '0';
      output.style.border = 'none';
      output.style.background = 'transparent';
      output.style.minHeight = '0';
      
      output.innerHTML = `
        <!-- Video container with canvas overlay -->
        <div id="camera-container" style="position: relative; width: 100%; max-width: 800px; margin: 0 auto;">
          <video id="live-camera-feed" autoplay playsinline style="width: 100%; border: 2px solid #1A73E8; display: block;"></video>
          <canvas id="bbox-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
        </div>
        
        <!-- Status box below video - like test page -->
        <div id="analysis-text" style="margin-top: 16px; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; line-height: 1.5;">
          🎥 Starting analysis...
        </div>
      `;
      
      // Connect camera stream to the video element
      const liveFeed = document.getElementById('live-camera-feed');
      liveFeed.srcObject = cameraStream;
      
      setTimeout(() => startRealtimeAnalysis(), 500);
    };
  } catch (err) {
    output.innerHTML = `<div style="padding: 16px; color: #EF4444;">⚠️ Camera access denied: ${err.message}</div>`;
    console.error('Camera error:', err);
  }
}

function startRealtimeAnalysis() {
  const stats = document.getElementById('inference-stats');
  const video = document.getElementById('live-camera-feed');
  const analysisText = document.getElementById('analysis-text');
  
  // Check if video is ready before starting
  if (!video || !video.videoWidth || !video.videoHeight) {
    if (analysisText) {
      analysisText.innerHTML = '⏳ Waiting for camera to initialize...';
    }
    // Retry after 1 second
    setTimeout(startRealtimeAnalysis, 1000);
    return;
  }
  
  if (analysisText) {
    analysisText.innerHTML = '🎥 Starting real-time analysis...';
  }
  
  // Analyze every 3 seconds so results are visible
  realtimeAnalysisInterval = setInterval(async () => {
    if (isAnalyzing) return; // Skip if previous analysis still running
    
    await analyzeCurrentFrame();
  }, 3000); // 3 seconds between analyses so results stay visible
  
  // Do first analysis after 500ms delay to ensure video is fully ready
  setTimeout(() => analyzeCurrentFrame(), 500);
}

async function analyzeCurrentFrame() {
  if (isAnalyzing) return;
  isAnalyzing = true;
  
  const video = document.getElementById('live-camera-feed');
  const output = document.getElementById('response-output');
  const stats = document.getElementById('inference-stats');
  const modelId = document.getElementById('playground-model').value;
  const prompt = 'Describe what you see in detail';
  
  try {
    // Show quick processing indicator
    const analysisTextDiv = document.getElementById('analysis-text');
    if (analysisTextDiv) {
      // Only show analyzing message if we don't have results yet
      if (!analysisTextDiv.innerHTML.includes('✅ Analysis Complete')) {
        analysisTextDiv.innerHTML = '⚡ Processing... (YOLO: ~25ms)';
      }
    } else {
      const timestamp1 = new Date().toLocaleTimeString();
      output.innerHTML = `
        <div style="padding: 16px; background: var(--background); border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong style="color: var(--primary);">🎥 Analyzing...</strong>
            <span style="color: var(--text-secondary); font-size: 12px;">${timestamp1}</span>
          </div>
          <div style="color: var(--text-secondary); line-height: 1.6;">
            ⏳ Processing frame...
          </div>
        </div>
      `;
    }
    
    // Check if video is ready
    if (!video.videoWidth || !video.videoHeight) {
      output.innerHTML = `<div style="padding: 16px; color: #EF4444;">⚠️ Camera not ready yet. Please wait...</div>`;
      isAnalyzing = false;
      return;
    }
    
    // Get or create canvas overlay for bounding boxes
    let overlayCanvas = document.getElementById('bbox-overlay');
    if (!overlayCanvas) {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.id = 'bbox-overlay';
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.width = '100%';
      overlayCanvas.style.height = '100%';
      overlayCanvas.style.pointerEvents = 'none';
      overlayCanvas.style.zIndex = '2';
      video.parentElement.appendChild(overlayCanvas);
    }
    
    // Capture frame from video - optimize size for faster YOLO
    const canvas = document.createElement('canvas');
    // Reduce resolution for faster inference (YOLO works well at lower res)
    const targetWidth = 640;
    const targetHeight = 480;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    
    // Convert to blob with lower quality for speed
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.6); // Lower quality = faster processing
    });
    
    if (!blob) {
      output.innerHTML = `<div style="padding: 16px; color: #EF4444;">⚠️ Failed to capture frame</div>`;
      isAnalyzing = false;
      return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('model', modelId);
    formData.append('prompt', prompt);
    formData.append('image', blob, 'frame.jpg');
    formData.append('max_tokens', 100);
    
    const startTime = Date.now();
    
    // Send to pipeline API (YOLO + LLaVA)
    const res = await fetch(`${API_BASE}/vision/pipeline`, {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    const latency = Date.now() - startTime;
    
    // Mark model as loaded after first successful response
    if (!data.error && data.description) {
      window._modelLoaded = true;
    }
    
    // Draw bounding boxes on overlay canvas
    if (data.detections && data.detections.length > 0) {
      overlayCanvas.width = video.videoWidth;
      overlayCanvas.height = video.videoHeight;
      
      const overlayCtx = overlayCanvas.getContext('2d');
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      // Scale factor from video dimensions to display size
      const scaleX = overlayCanvas.width / video.videoWidth;
      const scaleY = overlayCanvas.height / video.videoHeight;
      
      data.detections.forEach((det, idx) => {
        const { bbox, class: className, confidence } = det;
        
        // Different colors for different object types
        const colors = ['#00FF00', '#FF00FF', '#00FFFF', '#FFFF00', '#FF6600', '#FF0066'];
        const color = colors[idx % colors.length];
        
        // Draw bounding box
        overlayCtx.strokeStyle = color;
        overlayCtx.lineWidth = 3;
        overlayCtx.strokeRect(bbox.x1, bbox.y1, bbox.x2 - bbox.x1, bbox.y2 - bbox.y1);
        
        // Draw label background
        const label = `${className} ${(confidence * 100).toFixed(0)}%`;
        overlayCtx.font = 'bold 16px Roboto, sans-serif';
        const textWidth = overlayCtx.measureText(label).width;
        
        overlayCtx.fillStyle = color;
        overlayCtx.fillRect(bbox.x1, bbox.y1 - 25, textWidth + 10, 25);
        
        // Draw label text
        overlayCtx.fillStyle = '#000000';
        overlayCtx.fillText(label, bbox.x1 + 5, bbox.y1 - 7);
      });
    }
    
    // Check if we have the live analysis div (camera mode)
    const timestamp2 = new Date().toLocaleTimeString();
    const yoloTime = data.latency_ms?.yolo || 0;
    const llavaTime = data.latency_ms?.llava || 0;
    const speedNote = llavaTime > 10000 ? ' (Next frames will be faster!)' : '';
    
    // Find the analysis text div again (it should exist)
    const finalAnalysisDiv = document.getElementById('analysis-text');
    
    if (data.error || !data.description) {
      const errorMsg = data.description || data.error || 'Analysis failed';
      if (finalAnalysisDiv) {
        finalAnalysisDiv.innerHTML = `<span style="color: #EF4444;">⚠️ ${errorMsg}</span>`;
      } else {
        output.innerHTML = `<div style="padding: 16px; color: #EF4444;">⚠️ ${errorMsg}</div>`;
      }
    } else {
      if (finalAnalysisDiv) {
        // Update analysis like test page - clean format, results stay visible
        finalAnalysisDiv.innerHTML = `
          <strong style="color: var(--primary);">✅ Analysis Complete (${yoloTime + llavaTime}ms)</strong><br>
          <strong>Detections:</strong> ${data.detection_count || 0}<br>
          <strong>YOLO:</strong> ${yoloTime}ms<br>
          <strong>LLaVA:</strong> ${llavaTime}ms<br>
          <strong>Description:</strong> ${data.description || 'N/A'}
        `;
      } else {
        // Standard output for non-camera mode
        output.innerHTML = `
          <div style="padding: 16px; background: var(--background); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--primary);">🎥 Live Analysis</strong>
              <span style="color: var(--text-secondary); font-size: 12px;">${timestamp2}${speedNote}</span>
            </div>
            <div style="color: var(--text-primary); line-height: 1.6;">${data.description}</div>
          </div>
        `;
      }
      
      if (stats) {
        stats.style.display = 'flex';
        const responseText = data.description || '';
        const tokenCount = responseText.split(/\s+/).filter(t => t.length > 0).length;
        document.getElementById('stat-tokens').textContent = tokenCount;
        const totalLatency = data.latency_ms?.total || latency;
        document.getElementById('stat-latency').textContent = `${totalLatency}ms`;
        document.getElementById('stat-throughput').textContent = 
          ((tokenCount / (totalLatency / 1000))).toFixed(1);
      }
    }
  } catch (err) {
    output.innerHTML = `<div style="padding: 16px; color: #EF4444;">Error: ${err.message}</div>`;
    console.error('Realtime analysis error:', err);
  } finally {
    isAnalyzing = false;
  }
}

function stopRealtimeAnalysis() {
  if (realtimeAnalysisInterval) {
    clearInterval(realtimeAnalysisInterval);
    realtimeAnalysisInterval = null;
  }
  isAnalyzing = false;
}

// Update closeCamera to stop real-time analysis
const originalCloseCamera = closeCamera;
closeCamera = function() {
  stopRealtimeAnalysis();
  originalCloseCamera();
};
