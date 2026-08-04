const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const updater = require('./updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    minWidth: 700,
    minHeight: 600,
    title: 'eBay Listing Generator',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle update check from renderer
ipcMain.handle('check-for-update', async () => {
  try {
    const result = await updater.checkForUpdate();
    return result;
  } catch (err) {
    return { available: false, error: err.message };
  }
});

// Handle applying update
ipcMain.handle('apply-update', async () => {
  try {
    const result = await updater.applyUpdate();
    if (result.success) {
      // Reload the window with the new content
      mainWindow.loadFile('index.html');
      return { success: true, version: result.version };
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get current version
ipcMain.handle('get-version', () => {
  // Read from version.txt (updated by the updater) instead of package.json
  try {
    const versionFile = path.join(__dirname, 'version.txt');
    if (fs.existsSync(versionFile)) {
      return fs.readFileSync(versionFile, 'utf8').trim();
    }
  } catch (e) {}
  return app.getVersion();
});
