const electron = require('electron')
const remote = require('@electron/remote/main')
const path = require('path')
const appIcon = path.join(__dirname, 'assets/logo.png')
const emptyIcon = electron.nativeImage.createEmpty()
const app = electron.app

let mainWindow, tray
global.desktop = app.getPath('desktop')

remote.initialize()

/* --------------------------------------------------------
 * Create Main Window
 * ----------------------------------------------------- */

function createWindow() {
  // Hide the menu of application
  electron.Menu.setApplicationMenu(null)

  // Create the browser window.
  mainWindow = new electron.BrowserWindow({
    width: 800, // Make sure the aspect ratio of video is 16:9
    height: 580,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: true, // Make sure integrate node in renderer.js
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Hide window instead of minimize if tray exists
  mainWindow.on('minimize', function() {
    if (tray && !tray.isDestroyed()) {
      mainWindow.hide()
    }
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  remote.enable(mainWindow.webContents)
}

/* --------------------------------------------------------
 * Init Application Instance
 * ----------------------------------------------------- */

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) { app.quit() } else {

  // Someone tried to run a second instance, we should focus our window.
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow)

  // Quit when all windows are closed.
  app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
  })

}

/* --------------------------------------------------------
 * IPC Events
 * ----------------------------------------------------- */

electron.ipcMain.on('create-tray', () => {
  tray = new electron.Tray(appIcon)
  tray.setToolTip('Recording...')
  tray.count = 0
  tray.timer = setInterval(() => {
    tray.count++
    if (tray.count % 2 === 0) {
      tray.setImage(appIcon)
    } else {
      tray.setImage(emptyIcon)
    }
  }, 500)

  mainWindow.hide()
  tray.on('click', () => {
    mainWindow.show()
  })
})

electron.ipcMain.on('remove-tray', () => {
  clearInterval(tray.timer)
  tray.destroy()
})