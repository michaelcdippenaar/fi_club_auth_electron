export default function (ctx) {
  return {
    boot: ['axios'],
    css: ['app.scss'],
    extras: [],
    framework: {
      config: {},
      plugins: ['Notify'],
    },
    electron: {
      packager: {
        platform: 'darwin',
        arch: 'x64'
      },
      preloadScripts: ['electron-preload.js'],
      builder: {
        appId: 'com.ficlub.enrollment',
        productName: 'FiClub Enrollment',
        asarUnpack: ['dist/electron/UnPackaged/preload/**']
      },
      nodeIntegration: false,
      contextIsolation: true
    },
    sourceFiles: {
      electronMain: 'src-electron/electron-main.js',
      electronPreload: 'src-electron/electron-preload.js'
    },
    devServer: {
      port: 9000,
    },
    build: {
      vueRouterMode: 'history',
      extendViteConf(viteConf, { isServer, isClient }) {
        viteConf.base = './';
      },
    }
  };
}
