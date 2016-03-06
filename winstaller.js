const electronInstaller = require('electron-winstaller');
const path = require('path')

var p = path.normalize('./release/win32-x64/PeerTweet-win32-x64')

resultPromise = electronInstaller.createWindowsInstaller({
  appDirectory: p,
  outputDirectory: path.normalize('./release'),
  authors: 'Luca Matteis',
  exe: 'PeerTweet.exe'
});

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
