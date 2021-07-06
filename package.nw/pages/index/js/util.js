
// 执行程序
function runExec(cmdStr, cmdPath) {
    return new Promise((resolve, reject) => {
        workerProcess = exec(cmdStr, { cwd: cmdPath, windowsHide: true })
        let result = "";
        // 打印正常的后台可执行程序输出
        workerProcess.stdout.on('data', function (data) {
            result += data;
        })
        // 打印错误的后台可执行程序输出
        workerProcess.stderr.on('data', function (data) {
            reject(data)
        })
        // 退出之后的输出
        workerProcess.on('close', function (code) {
            if (code === 0) {
                resolve(result)
            } else {
                reject(code)
            }
        })
    })
}
// 创建播放器窗口
function createPlayerWindow() {
    return new Promise(resolve => {
        nw.Window.open('/package.nw/pages/player/index.html', {
            frame: false,
            show: false,
            width: screen.width,
            height: screen.height
        }, function (win) {
            win.on('loaded', () => {
                resolve(win);
            });
        });
    })
}