import { contextBridge, ipcRenderer, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';

contextBridge.exposeInMainWorld('electronAPI', {
  path: {
    join: (...paths) => path.join(...paths)
  },
  fs: {
    writeFile: (filePath, data, options = {}) => {
      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, options, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  },
  os: {
    tmpdir: () => os.tmpdir()
  },
  shell: {
    openPath: (path) => shell.openPath(path),
    openExternal: (url) => shell.openExternal(url)
  },
  execAppleScript: (script) => {
    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
});


// ✅ Add a simple flag so Vue knows it's running inside Electron
contextBridge.exposeInMainWorld('electronEnv', {
  isElectron: true
});

// ✅ (Optional) Expose ipcRenderer for messaging
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});
