nw.Window.open('/package.nw/html/index.html', {
    frame: false,
    show: false,
    position: "center",
    width: 1024,
    height: 768,
    min_width: 1024,
    min_height: 768,
    max_width:1440,
    max_height:900,
    icon: "/package.nw/images/logo.png"
}, function (win) {
    // win.on('closed', function () {
    //     win = null;
    // });
    // win.on('close', function () {
    //     // Hide the window to give user the feeling of closing immediately
    //     this.hide();

    //     // If the new window is still open then close it.
    //     if (win !== null) {
    //         win.close(true);
    //     }
    //     // After closing the new window, close the main window.
    //     this.close(true);
    //     nw.App.quit();
    // });
});