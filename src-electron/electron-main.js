import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

// ✅ Dynamically resolve correct preload path
function getPreloadPath() {
  if (!app.isPackaged) {
    // ✅ DEV MODE → Quasar generates preload in .quasar/dev-electron/preload/electron-preload.cjs
    const devPreload = path.join(
      process.cwd(),
      '.quasar',
      'dev-electron',
      'preload',
      'electron-preload.cjs'
    );

    if (fs.existsSync(devPreload)) {
      console.log('[DEV] Using Quasar dev preload:', devPreload);
      return devPreload;
    }

    // Fallback → directly from source if dev build not yet generated
    const srcPreload = path.join(
      process.cwd(),
      'src-electron',
      'preload',
      'electron-preload.js'
    );
    console.warn('[DEV] Quasar dev preload not found, falling back to:', srcPreload);
    return srcPreload;
  } else {
    // Preferred Quasar location inside unpacked
    const quasarPreload = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'dist',
      'electron',
      'UnPackaged',
      'preload',
      'electron-preload.js.cjs'
    );

    if (fs.existsSync(quasarPreload)) {
      console.log('[PROD] Found preload at:', quasarPreload);
      return quasarPreload;
    }

    // Fallback → if extraResources copied it out
    const fallbackPreload = path.join(process.resourcesPath, 'electron-preload.js.cjs');
    if (fs.existsSync(fallbackPreload)) {
      console.log('[PROD] Using fallback preload at:', fallbackPreload);
      return fallbackPreload;
    }

    console.error('[PROD] No preload found!');
    return quasarPreload; // will still fail gracefully
  }
}

// ✅ Logging setup
const logFile = path.join(app.getPath('home'), 'fi-club-electron.log');
function logToFile(message) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
}
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = (...args) => {
  logToFile(args.join(' '));
  originalConsoleLog(...args);
};
console.error = (...args) => {
  logToFile(`ERROR: ${args.join(' ')}`);
  originalConsoleError(...args);
};
logToFile('Electron main process starting');

let mainWindow;

async function loadViteWithRetry(url, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mainWindow.loadURL(url);
      console.log(`Successfully loaded Vite dev server: ${url}`);
      return;
    } catch (err) {
      console.error(`Attempt ${i + 1} failed to load Vite dev server: ${err}`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('All retries failed. Quitting app.');
  app.quit();
}

function createWindow() {
  console.log('Creating BrowserWindow…');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: getPreloadPath() // ✅ Correct preload path
    }
  });

  // ✅ CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    console.log('Applying CSP to:', details.url);
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:9000;"
        ]
      }
    });
  });

  if (isDev) {
    loadViteWithRetry('http://localhost:9000').then(() => {
      console.log('Vite dev server loaded');
      mainWindow.webContents.openDevTools();
    });
  } else {
    const indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'spa', 'index.html');
    console.log('[PROD] Attempting to load:', indexPath);

    if (!fs.existsSync(indexPath)) {
      console.error('[PROD] index.html does NOT exist at:', indexPath);
      app.quit();
      return;
    }

    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load production build:', err);
      app.quit();
    });

    // Optional: remove in final build
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-fail-load', (event, code, desc, url) => {
    console.error(`Navigation failed for ${url}: ${code} - ${desc}`);
    app.quit();
  });

  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
}

app.on('ready', () => {
  console.log('App ready → creating window');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  console.log('App activated');
  if (mainWindow === null) createWindow();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  app.quit();
});
