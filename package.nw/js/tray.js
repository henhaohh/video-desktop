// 通知栏菜单——一般是在桌面右下角
let tray = ((vm) => {
    var tray = new nw.Tray({
        title: 'video-desktop',
        tooltip: "video-desktop",
        icon: '/package.nw/images/logo.png'
    });
    var menu = new nw.Menu();
    menu.append(new nw.MenuItem({
        type: 'normal',
        label: '显示界面',
        icon: "/package.nw/images/visible.png",
        checked: vm.muted,
        click: function () {
            nw.Window.get().show()
        },
    }));
    menu.append(new nw.MenuItem({
        type: 'checkbox',
        label: '显示动态桌面',
        checked: vm.isShow,
        click: function () {
            vm.isShow = !vm.isShow;
        },
    }));
    menu.append(new nw.MenuItem({
        type: 'separator'
    }));
    menu.append(new nw.MenuItem({
        type: 'normal',
        label: '退出',
        icon: "/package.nw/images/exit.png",
        click:function () {
            vm.quit()       
        },
    }));
    tray.menu = menu;
    return tray
})(vm);