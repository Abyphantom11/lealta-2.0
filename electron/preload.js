const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  getPlatform: () => ipcRenderer.invoke('platform'),

  // Menu actions
  onMenuAction: callback => {
    ipcRenderer.on('menu-action', callback);
  },

  // Remove listeners
  removeAllListeners: channel => {
    ipcRenderer.removeAllListeners(channel);
  },

  // File operations (for future use)
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: data => ipcRenderer.invoke('save-file', data),

  // Notification support
  showNotification: (title, body) => {
    new Notification(title, { body });
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // System info
  isElectron: true,
  isDesktop: true,
});
