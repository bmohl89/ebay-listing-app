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

  // Load from updated file if it exists, otherwise bundled
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

// Handle update check
ipcMain.handle('check-for-update', async () => {
  try {
    return await updater.checkForUpdate();
  } catch (err) {
    return { available: false, error: err.message };
  }
});

// Handle applying update
ipcMain.handle('apply-update', async () => {
  try {
    const result = await updater.applyUpdate();
    if (result.success) {
      if (result.needsRestart) {
        // main.js or updater.js changed — full app restart needed
        return { success: true, version: result.version, needsRestart: true };
      } else {
        // Only index.html changed — just reload the page
        const indexPath = updater.getIndexPath();
        mainWindow.loadFile(indexPath);
        return { success: true, version: result.version, needsRestart: false };
      }
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handle app restart (called from renderer when needsRestart is true)
ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

// Get current version
ipcMain.handle('get-version', () => {
  return updater.getLocalVersion();
});
