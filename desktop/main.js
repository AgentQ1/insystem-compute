const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let inferenceProcess = null;

// Start Python inference backend
function startInferenceBackend() {
  const pythonPath = 'python3';
  const scriptPath = path.join(__dirname, '..', 'gateway', 'gateway_py.py');
  
  inferenceProcess = spawn(pythonPath, ['-m', 'uvicorn', 'gateway_py:app', '--port', '8080'], {
    cwd: path.join(__dirname, '..', 'gateway'),
    stdio: 'pipe'
  });
  
  inferenceProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
  
  inferenceProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });
  
  inferenceProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow(filePath = null) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#F8F9FA',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    frame: true
  });

  mainWindow.loadFile('index.html');

  // If opened with a file, load it
  if (filePath) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('open-file', filePath);
    });
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Start inference backend
  startInferenceBackend();
  
  // Wait a bit for backend to start
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle file opening (macOS)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('open-file', filePath);
  } else {
    createWindow(filePath);
  }
});

app.on('window-all-closed', () => {
  if (inferenceProcess) {
    inferenceProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (inferenceProcess) {
    inferenceProcess.kill();
  }
});

// IPC Handlers
ipcMain.handle('select-model-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'GGUF Models', extensions: ['gguf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});
