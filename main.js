const {app, BrowserWindow} = require('electron')
const url = require('url')
const path = require('path')

let win

function createWindow() {
    win = new BrowserWindow({width: 800, height: 600, show: false, frame: false, transparent: true})
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file'
    }))
    win.once('ready-to-show', () => {
        win.show()
    })
}
app.on('ready', createWindow)