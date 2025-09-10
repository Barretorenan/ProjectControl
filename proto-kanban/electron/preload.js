import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveJson: (payload) => ipcRenderer.invoke('save-json', payload),
  openJson: () => ipcRenderer.invoke('open-json')
})

