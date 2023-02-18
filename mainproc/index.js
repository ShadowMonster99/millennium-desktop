const { session, app, BrowserWindow, ipcMain } = require('electron')

const millennium = require('./api.js')
var crypto = require("crypto")

//alternative to localStorage because i cant get it to save after restart.
const Store = require('electron-store');
Store.initRenderer();

//database key, end to end encrypted
const type = crypto.createDecipheriv('aes-192-cbc', crypto.scryptSync('millennium-datatable', 'salt', 24), Buffer.alloc(16));
const millennium_datatable = type.update("0409a528ccc551751133cc4c14b75ff3860fa53d8bcc735bf602657f0a004e1b", 'hex', 'utf8') + type.final('utf8');

const initialize_api = millennium.initAPI();

const createWindow = () => {

    const sess = session.fromPartition('some-partition', { cache: false })

    const electron_window = new BrowserWindow({
        titleBarStyle: 'hidden',
        webPreferences: 
        {
          nodeIntegration: true,
          //can't use IPC with context isolation :(
          contextIsolation: false,
          session: sess
        },
        width: 1100,
        height: 800,
        //1016 - 16 = 1000 min viewport width
        minWidth:1016,
        //749 - 39 = 710 min viewport height
        minHeight:749,
        autoHideMenuBar: true,
        show: false
    })

    electron_window.loadURL(millennium_datatable);
    electron_window.webContents.on('did-finish-load', () => 
    {
      if (!electron_window.webContents.getURL().includes(millennium_datatable)) electron_window.show();

      initialize_api(electron_window, function() 
      {
        electron_window.loadFile('renderer/index.html');
      });
    });

    ipcMain.on('close', () => this.window.close())
    ipcMain.on('min', () => electron_window.minimize())
    ipcMain.on('max', () => 
    {
      if (electron_window.isMaximized()) electron_window.unmaximize()
      else electron_window.maximize()
    })
}

app.whenReady().then(() => createWindow())
