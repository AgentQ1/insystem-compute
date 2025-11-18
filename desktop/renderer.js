const API_BASE = 'http://localhost:8080/api/v1';

let currentModel = null;
let conversationHistory = [];

// DOM Elements
const loadModelBtn = document.getElementById('load-model-btn');
const loadModelWelcome = document.getElementById('load-model-welcome');
const modelInfo = document.getElementById('model-info');
const chatContainer = document.getElementById('chat-container');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const maxTokensInput = document.getElementById('max-tokens');
const temperatureInput = document.getElementById('temperature');
const tempDisplay = document.getElementById('temp-display');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Check backend health
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected';
      return true;
    }
  } catch (error) {
    statusDot.classList.remove('connected');
    statusText.textContent = 'Backend offline';
  }
  return false;
}

// Load model
async function loadModel(filePath) {
  try {
    // For now, we'll use pre-loaded models
    // In production, you'd send the file path to the backend
    const modelName = filePath.split('/').pop().replace('.gguf', '');
    
    currentModel = {
      path: filePath,
      name: modelName,
      id: modelName.includes('tinyllama') ? 'tinyllama-1b-q4' : 'phi-2-q4'
    };
    
    updateModelInfo();
    showChatInterface();
    sendBtn.disabled = false;
  } catch (error) {
    console.error('Failed to load model:', error);
    alert('Failed to load model. Make sure the backend is running.');
  }
}

function updateModelInfo() {
  if (!currentModel) return;
  
  modelInfo.innerHTML = `
    <div class="model-name">${currentModel.name}</div>
    <div class="model-details">
      <div>Model: ${currentModel.id}</div>
      <div>Status: Ready</div>
    </div>
  `;
}

function showChatInterface() {
  const welcome = chatContainer.querySelector('.welcome-message');
  if (welcome) {
    welcome.style.display = 'none';
  }
}

function addMessage(role, text, meta = null) {
  const welcome = chatContainer.querySelector('.welcome-message');
  if (welcome) {
    welcome.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const avatar = role === 'user' ? 'You' : 'AI';
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar.charAt(0)}</div>
    <div class="message-content">
      <div class="message-text">${text}</div>
      ${meta ? `<div class="message-meta">${meta}</div>` : ''}
    </div>
  `;
  
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  return messageDiv;
}

function showThinking() {
  const thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'message assistant thinking-message';
  thinkingDiv.innerHTML = `
    <div class="message-avatar">AI</div>
    <div class="message-content">
      <div class="thinking">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatContainer.appendChild(thinkingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return thinkingDiv;
}

async function sendMessage() {
  const prompt = promptInput.value.trim();
  if (!prompt || !currentModel) return;
  
  // Add user message
  addMessage('user', prompt);
  conversationHistory.push({ role: 'user', content: prompt });
  
  promptInput.value = '';
  promptInput.style.height = 'auto';
  sendBtn.disabled = true;
  
  // Show thinking indicator
  const thinkingMsg = showThinking();
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: currentModel.id,
        prompt: prompt,
        max_tokens: parseInt(maxTokensInput.value),
        temperature: parseFloat(temperatureInput.value)
      })
    });
    
    if (!response.ok) {
      throw new Error('Generation failed');
    }
    
    const data = await response.json();
    const latency = Date.now() - startTime;
    
    // Remove thinking indicator
    thinkingMsg.remove();
    
    // Add AI response
    const meta = `${data.tokens || '?'} tokens • ${(latency/1000).toFixed(1)}s • ${data.tokens_per_sec ? data.tokens_per_sec.toFixed(1) + ' tok/s' : ''}`;
    addMessage('assistant', data.text, meta);
    conversationHistory.push({ role: 'assistant', content: data.text });
    
  } catch (error) {
    thinkingMsg.remove();
    addMessage('assistant', 'Sorry, I encountered an error. Please make sure the backend is running.', 'Error');
    console.error('Generation error:', error);
  }
  
  sendBtn.disabled = false;
  promptInput.focus();
}

// Event Listeners
loadModelBtn.addEventListener('click', async () => {
  const filePath = await window.electron.selectModelFile();
  if (filePath) {
    loadModel(filePath);
  }
});

if (loadModelWelcome) {
  loadModelWelcome.addEventListener('click', async () => {
    const filePath = await window.electron.selectModelFile();
    if (filePath) {
      loadModel(filePath);
    }
  });
}

sendBtn.addEventListener('click', sendMessage);

promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) {
      sendMessage();
    }
  }
});

promptInput.addEventListener('input', () => {
  promptInput.style.height = 'auto';
  promptInput.style.height = promptInput.scrollHeight + 'px';
});

temperatureInput.addEventListener('input', (e) => {
  tempDisplay.textContent = e.target.value;
});

// Listen for file open events
window.electron.onOpenFile((filePath) => {
  if (filePath.endsWith('.gguf')) {
    loadModel(filePath);
  }
});

// Initialize
checkHealth();
setInterval(checkHealth, 5000);
