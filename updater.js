const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURATION — Update these with your GitHub repo details
// ============================================================
const GITHUB_USER = 'bmohl89';   // <-- Change this
const GITHUB_REPO = 'ebay-listing-app';       // <-- Change this if different
const BRANCH = 'main';
const FILE_PATH = 'index.html';

// Raw GitHub URL for the latest index.html
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/${FILE_PATH}`;

// Version file URL (a simple text file with just the version number)
const VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/version.txt`;
// ============================================================

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'eBayListingApp' } }, (res) => {
      // Follow redirects
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
    const versionFile = path.join(__dirname, 'version.txt');
    if (fs.existsSync(versionFile)) {
      return fs.readFileSync(versionFile, 'utf8').trim();
    }
    // Fall back to package.json version
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
  // Download the latest index.html
  const newHTML = await fetchText(RAW_URL);
  
  // Download the latest version.txt
  const newVersion = (await fetchText(VERSION_URL)).trim();
  
  // Write the new files
  const indexPath = path.join(__dirname, 'index.html');
  const versionPath = path.join(__dirname, 'version.txt');
  
  fs.writeFileSync(indexPath, newHTML, 'utf8');
  fs.writeFileSync(versionPath, newVersion, 'utf8');
  
  return { success: true, version: newVersion };
}

// Simple semver comparison: returns 1 if a > b, -1 if a < b, 0 if equal
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

module.exports = { checkForUpdate, applyUpdate, getLocalVersion };
