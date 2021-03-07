(async (win, vm) => {
    win.on('close', function () {
        vm.quit();
    });
})(nw.Window.get(), vm);
