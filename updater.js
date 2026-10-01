const https = require('https');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ============================================================
// CONFIGURATION
// ============================================================
const GITHUB_USER = 'bmohl89';
const GITHUB_REPO = 'ebay-listing-app';
const BRANCH = 'main';

// Files that the updater can update (ALL app files)
const UPDATABLE_FILES = ['index.html', 'main.js', 'updater.js', 'version.txt'];

function getGitHubRawURL(filename) {
  return `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/${filename}`;
}
// ============================================================

// Writable folder for updates
function getUpdateDir() {
  const dir = path.join(app.getPath('userData'), 'updates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Returns path for a given file — updated version if exists, otherwise bundled
function getFilePath(filename) {
  const updatedPath = path.join(getUpdateDir(), filename);
  if (fs.existsSync(updatedPath)) return updatedPath;
  return path.join(__dirname, filename);
}

function getIndexPath() {
  return getFilePath('index.html');
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'eBayListingApp' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function getLocalVersion() {
  try {
    const updatedVersion = path.join(getUpdateDir(), 'version.txt');
    if (fs.existsSync(updatedVersion)) {
      return fs.readFileSync(updatedVersion, 'utf8').trim();
    }
    const bundledVersion = path.join(__dirname, 'version.txt');
    if (fs.existsSync(bundledVersion)) {
      return fs.readFileSync(bundledVersion, 'utf8').trim();
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    return pkg.version;
  } catch (e) {
    return '0.0.0';
  }
}

async function checkForUpdate() {
  const localVersion = getLocalVersion();
  const remoteVersion = (await fetchText(getGitHubRawURL('version.txt'))).trim();
  
  const isNewer = compareVersions(remoteVersion, localVersion) > 0;
  
  return {
    available: isNewer,
    localVersion,
    remoteVersion,
    message: isNewer 
      ? `Update available: v${remoteVersion} (current: v${localVersion})`
      : `You're up to date (v${localVersion})`
  };
}

async function applyUpdate() {
  const updateDir = getUpdateDir();
  const changedFiles = [];
  
  // Download all updatable files from GitHub
  for (const filename of UPDATABLE_FILES) {
    try {
      const remoteContent = await fetchText(getGitHubRawURL(filename));
      const localPath = path.join(updateDir, filename);
      
      // Check if content actually changed
      let currentContent = '';
      try { currentContent = fs.readFileSync(localPath, 'utf8'); } catch(e) {}
      
      if (remoteContent !== currentContent) {
        fs.writeFileSync(localPath, remoteContent, 'utf8');
        changedFiles.push(filename);
      }
    } catch (err) {
      console.error(`Failed to update ${filename}:`, err.message);
      // Continue with other files even if one fails
    }
  }
  
  const newVersion = (await fetchText(getGitHubRawURL('version.txt'))).trim();
  
  // Determine if a restart is needed (main.js or updater.js changed)
  const needsRestart = changedFiles.some(f => f === 'main.js' || f === 'updater.js');
  
  return { 
    success: true, 
    version: newVersion, 
    changedFiles,
    needsRestart
  };
}

function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

module.exports = { checkForUpdate, applyUpdate, getLocalVersion, getIndexPath, getFilePath };
