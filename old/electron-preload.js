const { contextBridge } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { shell } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  path: {
    join: (...paths) => path.join(...paths)
  },
  fs: {
    writeFile: (filePath, data, options = {}) => {
      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, options, (error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }
  },
  os: {
    tmpdir: () => os.tmpdir()
  },
  shell: {
    openPath: (path) => shell.openPath(path),
    openExternal: (url) => shell.openExternal(url)
  }
})
