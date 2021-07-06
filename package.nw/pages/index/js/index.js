(async (win, vm) => {
    // 主窗口关闭即整个APP关闭
    win.on('close', function () {
        vm.quit();
    });
})(nw.Window.get(), vm);
