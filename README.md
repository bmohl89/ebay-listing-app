# eBay Card Listing Generator

A lightweight desktop app for generating professional eBay listing descriptions for Pokémon and sports cards. Built with Electron.

## Features

- **Live Pokémon API search** — type a card name/number and select from results
- **Auto-fill card details** from API data
- **HTML-formatted descriptions** that look great in eBay's listing editor
- **Keyword-packed titles** optimized for eBay search
- **Self-updating** — click "Check for Update" to pull the latest version from GitHub

## Quick Start (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- A GitHub account (for hosting updates)

### Setup

```bash
# 1. Clone the repo (or download the files)
git clone https://github.com/YOUR_USERNAME/ebay-listing-app.git
cd ebay-listing-app

# 2. Install dependencies
npm install

# 3. Run the app
npm start

```

That's it! The app opens and is ready to use.

## Building the .exe Installer

```bash
# Build a Windows installer (.exe)
npm run build

# Or build a portable .exe (no install needed, just run it)
npm run build:portable

```

The output will be in the `dist/` folder:

- `dist/eBay Listing Generator Setup 1.0.0.exe` — installer
- `dist/eBay Listing Generator 1.0.0.exe` — portable version

## How Updates Work

### On your WORK machine (where you make changes):

1. Edit `index.html` (the listing generator UI)
2. Bump the version in `version.txt` (e.g., `1.0.0` → `1.0.1`)
3. Push to GitHub:```bash
git add .
git commit -m "Update: added new feature"
git push

```

### On your HOME machine (where you use the app):

1. Click **"Check for Update"** in the app toolbar
2. If an update is available, click **"Update Now"**
3. The app downloads the latest `index.html` and reloads — done!

> **Note:** The update only replaces `index.html` and `version.txt`. The Electron shell (`main.js`, `updater.js`) stays the same. For structural changes to those files, you'd rebuild the .exe.

## Configuration

### Setting up your GitHub repo

1. Create a new repo on GitHub (e.g., `ebay-listing-app`)
2. Edit `updater.js` and replace:```javascript
const GITHUB_USER = 'YOUR_GITHUB_USERNAME';  // ← your GitHub username
const GITHUB_REPO = 'ebay-listing-app';      // ← your repo name

```
3. Push all files to the repo
4. The update system is now live!

### API Key

The Pokémon TCG API key is embedded in `index.html`. If you need to change it, search for `X-Api-Key` in the file.

## Project Structure

```
ebay-listing-app/
├── package.json      ← App config & build settings
├── main.js           ← Electron main process (window, IPC)
├── updater.js        ← Update logic (fetches from GitHub)
├── index.html        ← The actual listing generator UI
├── version.txt       ← Current version (checked against GitHub)
└── README.md         ← You're reading it

```

## Troubleshooting

- **App won't start:** Make sure you ran `npm install` first
- **API search not working:** Check your internet connection; the Pokémon TCG API requires network access
- **Update fails:** Make sure your GitHub repo is public (or configure auth for private repos)
- **Building fails:** Make sure `electron-builder` is installed (`npm install`)

