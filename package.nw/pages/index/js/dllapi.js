// dll中的api列表
let dllAPI = (() => {
    // dll文件目录，事实上，这是一个exe文件
    let bin_path = path.join(nw.App.startPath, "package.nw/bin/");
    return {
        //获取桌面句柄
        getWorker() {
            let command = "video-desktop.exe getWorker"
            return runExec(command, bin_path)
        },
        //获取播放器句柄
        getPlayer(title = "") {
            let command = `video-desktop.exe getPlayer ${title}`
            return runExec(command, bin_path)
        },
        //设置父窗口
        setParent(m_Hchild, m_Hparent = 0) {
            let command = ["video-desktop.exe", "setParent", m_Hchild, m_Hparent].join(" ");
            return runExec(command, bin_path)
        },
        //设置窗口显示方式
        showWindow(hWnd = 0, nCmdShow = 5) {
            let command = ["video-desktop.exe", "showWindow", hWnd, nCmdShow].join(" ");
            return runExec(command, bin_path)
        },
        //发送消息给某个窗口
        sendMessage(hWnd = 0, Msg = 0, wParam = 0, IParam = 0) {
            let command = ["video-desktop.exe", "sendMessage", hWnd, nCmdShow].join(" ");
            return runExec(command, bin_path)
        },
        //销毁窗口
        destory(hWnd = 0) {
            let command = ["video-desktop.exe", "destory", hWnd].join(" ");
            return runExec(command, bin_path)
        },
    }
})();