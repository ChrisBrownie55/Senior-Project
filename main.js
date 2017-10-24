const {app, BrowserWindow} = require('electron')
const url = require('url')
const path = require('path')

let win

function createWindow() {
    win = new BrowserWindow({width: 900, height: 750, show: false, frame: false, transparent: true, "minWidth": 725, "minHeight": 450, webPreferences: { zoomFactor: 1 }})
    win.setFullScreen(true)
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file'
    }))
    win.once('ready-to-show', () => {
        win.show()
    })
}
app.on('ready', createWindow)
