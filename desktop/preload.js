const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectModelFile: () => ipcRenderer.invoke('select-model-file'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  onOpenFile: (callback) => ipcRenderer.on('open-file', (event, filePath) => callback(filePath))
});
