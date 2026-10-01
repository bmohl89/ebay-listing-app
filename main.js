const { app, BrowserWindow, ipcMain } = require('electron');
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

  // Load from the updated file if it exists, otherwise the bundled one
  const indexPath = updater.getIndexPath();
  mainWindow.loadFile(indexPath);
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
      // Reload from the newly updated file
      const indexPath = updater.getIndexPath();
      mainWindow.loadFile(indexPath);
      return { success: true, version: result.version };
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get current version
ipcMain.handle('get-version', () => {
  return updater.getLocalVersion();
});
