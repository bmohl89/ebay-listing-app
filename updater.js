const https = require('https');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ============================================================
// CONFIGURATION — Update these with your GitHub repo details
// ============================================================
const GITHUB_USER = 'bmohl89';
const GITHUB_REPO = 'ebay-listing-app';
const BRANCH = 'main';
const FILE_PATH = 'index.html';

const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/${FILE_PATH}`;
const VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/version.txt`;
// ============================================================

// Writable folder for updates (survives app.asar packaging)
function getUpdateDir() {
  const dir = path.join(app.getPath('userData'), 'updates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Returns the path to use for index.html — updated version if it exists, otherwise bundled
function getIndexPath() {
  const updatedPath = path.join(getUpdateDir(), 'index.html');
  if (fs.existsSync(updatedPath)) return updatedPath;
  return path.join(__dirname, 'index.html');
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
    // Check writable updates folder first
    const updatedVersion = path.join(getUpdateDir(), 'version.txt');
    if (fs.existsSync(updatedVersion)) {
      return fs.readFileSync(updatedVersion, 'utf8').trim();
    }
    // Fall back to bundled version.txt
    const bundledVersion = path.join(__dirname, 'version.txt');
    if (fs.existsSync(bundledVersion)) {
      return fs.readFileSync(bundledVersion, 'utf8').trim();
    }
    // Fall back to package.json
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    return pkg.version;
  } catch (e) {
    return '0.0.0';
  }
}

async function checkForUpdate() {
  const localVersion = getLocalVersion();
  const remoteVersion = (await fetchText(VERSION_URL)).trim();
  
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
  const newHTML = await fetchText(RAW_URL);
  const newVersion = (await fetchText(VERSION_URL)).trim();
  
  const updateDir = getUpdateDir();
  
  // Write to the writable updates folder (NOT inside app.asar)
  fs.writeFileSync(path.join(updateDir, 'index.html'), newHTML, 'utf8');
  fs.writeFileSync(path.join(updateDir, 'version.txt'), newVersion, 'utf8');
  
  return { success: true, version: newVersion };
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

module.exports = { checkForUpdate, applyUpdate, getLocalVersion, getIndexPath };
