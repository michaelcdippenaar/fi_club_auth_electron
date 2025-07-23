import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Adjust preload path for development and production
const preloadPath = isDev
  ? path.join(__dirname, 'electron-preload.js') // Development path
  : path.join(__dirname, 'electron-preload.js'); // Production path (adjusted by Quasar build)

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
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Disable sandbox to allow preload Node.js access
      preload: preloadPath,
    },
  });

  // Set a secure CSP
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8000 ws://localhost:9000;",
        ],
      },
    });
  });

  if (isDev) {
    loadViteWithRetry('http://localhost:9000').then(() => {
      // Comment out to suppress Autofill errors
      // mainWindow.webContents.openDevTools();
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/spa/index.html')).catch((err) => {
      console.error('Failed to load production build:', err);
      app.quit();
    });
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Navigation failed: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
