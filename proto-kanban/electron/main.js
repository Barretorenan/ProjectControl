import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

let mainWindow = null

function getIndexHtmlPath() {
  // When packaged, app.getAppPath() points inside the asar; dist is next to electron folder in project root
  const appPath = app.getAppPath()
  return path.join(appPath, 'dist', 'index.html')
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(app.getAppPath(), 'electron', 'preload.js')
    }
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(getIndexHtmlPath())
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('save-json', async (_event, { data, defaultPath }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Salvar como',
    defaultPath: defaultPath || 'dados.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return { canceled: true }
  await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
  return { canceled: false, filePath: result.filePath }
})

ipcMain.handle('open-json', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir JSON',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (result.canceled || !result.filePaths?.[0]) return { canceled: true }
  const filePath = result.filePaths[0]
  const raw = await fs.readFile(filePath, 'utf-8')
  try {
    const json = JSON.parse(raw)
    return { canceled: false, filePath, data: json }
  } catch (e) {
    return { canceled: false, filePath, error: 'JSON inválido' }
  }
})

