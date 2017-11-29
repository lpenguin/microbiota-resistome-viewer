const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const process = require('process');
const minimist = require('minimist');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createMenu(){
    const template = [{
        label: 'File',
        submenu: [{
            label: 'Open',
            click: () => {
                loadDataAndRun();
            }
        },{
            role: 'quit'
        }, ]
    }];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function loadDataAndRun(){
    dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
    }, (filePaths)=>{
        if(!filePaths){
            return
        }
        const transLogFile = filePaths.filter(s => s.endsWith('transLog_NP.txt'))[0]
        const abundanceFile = filePaths.filter(s => s.endsWith('ticks.csv'))[0]

        openSimulation(abundanceFile, transLogFile, false)
    })
}

function openSimulation(abundanceFile, transLogFile, devTools=false){
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    if(devTools){
        win.webContents.openDevTools();
    }
    
    win.webContents.on('did-finish-load', ()=>{
        win.webContents.send('loadDataAndRun', {transLogFile: transLogFile, abundanceFile: abundanceFile});
    })
}

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 1200, height: 720, title: 'VERA viewer'});



    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    const [abundanceFile, transLogFile, devTools] = parseArgs();

    createWindow();
    createMenu();
    if(abundanceFile){
        openSimulation(abundanceFile, transLogFile, devTools);
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
    createWindow()
}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const helpMessage = `usage: vera-viewer [-h] [-a ABUNDANCE_FILE] [-t TRANSLOG_FILE]

optional arguments: 
    -h                  show this help message and exit 
    -a ABUNDANCE_FILE   abundance file
    -t TRANSLOG_FILE    translog file
    -d                  open DevTools
`
function parseArgs(){
    const args = minimist(process.argv, {
        string: ['a', 't'],
        boolean: ['h', 'd']
    });
    
    if(args.h){
        console.log(helpMessage);
        app.quit();
        return [undefined, undefined];
    }
    return [args.a, args.t, args.d]
}
