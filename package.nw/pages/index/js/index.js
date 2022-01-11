const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const { timeStamp } = require('console');
/**
 * 有用的工具函数util.js
 */

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
            transparent: true,
            width: screen.width,
            height: screen.height
        }, function (win) {
            win.on('loaded', () => {
                resolve(win);
            });
        });
    })
}
// 获取网络文件的文件类型mime
async function getMime(url) {
    const r = await fetch(url, { method: "head" });
    return r.headers.get('content-type');
}
/**
 * 用到的api
 */
const CDNAPI = {
    getCategory: async () => {
        const r = await fetch('http://cdn.apc.360.cn/index.php?c=WallPaper&a=getAllCategoriesV2&from=360chrome');
        return await r.json();
    },
    getList: async (params = {}) => {
        const baseURL = 'http://wallpaper.apc.360.cn/index.php';
        params = {
            c: 'WallPaper',
            a: params.cid ? "getAppsByCategory" : "getAppsByOrder",
            order: 'create_time',
            start: 0,
            count: 24,
            from: '360chrome',
            ...params
        }
        let sp = new URLSearchParams();
        for (let x in params) {
            sp.append(x, params[x]);
        }
        const r = await fetch(baseURL + '?' + sp.toString());
        return await r.json();
    }
}
/** 
 * dll 里面的api
 * 事实上是一个命令行程序，我用易语言写的一个接口
*/
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
        getWindow(title = "") {
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
            let command = ["video-desktop.exe", "sendMessage", hWnd, Msg].join(" ");
            return runExec(command, bin_path)
        },
        //销毁窗口
        destory(hWnd = 0) {
            let command = ["video-desktop.exe", "destory", hWnd].join(" ");
            return runExec(command, bin_path)
        },
    }
})();
/**
 * VUE主程序
 */
// vue 代码
let vm = (() => {
    let template = fs.readFileSync(path.join(nw.App.startPath, 'package.nw/pages/index/template/index.html'), 'utf-8');
    return new Vue({
        template,
        data() {
            return {
                currentWindow: nw.Window.get(),
                win: new Object(),// 播放器窗口Object
                muted: true,    // 静音模式
                isShow: true,   // 是否显示
                playerHwnd: 0,  // 播放器句柄
                desktopHwnd: 0, // 桌面句柄
                defaultThumbnail: "/package.nw/images/nothumb.svg",
                defaultVideo: localStorage.getItem('defaultvideo') ? JSON.parse(localStorage.getItem('defaultvideo')) : {
                    title: "yoyo鹿鸣",
                    type: "video",
                    url: 'https://n0va.mihoyo.com/medias/bgvideo.13edb8ad.mp4',
                    thumbnail: 'https://img-static.mihoyo.com/communityweb/upload/5da4c7abd99381aa867c878102585582.png'
                }, // 默认
                history: localStorage.getItem('history') ? JSON.parse(localStorage.getItem('history')).sort((a, b) => b.timeStamp - a.timeStamp) : [],// 历史记录
                sourceType: "net",//资源类型，网络：net，本地：local
                v_list: [
                    /* {
                        title: "yoyo鹿鸣",
                        type: "video",
                        url: 'https://n0va.mihoyo.com/medias/bgvideo.13edb8ad.mp4',
                        thumbnail: 'https://img-static.mihoyo.com/communityweb/upload/5da4c7abd99381aa867c878102585582.png'
                    } */
                ],
                categorys: [],
                searchParams: {
                    cid: 0,
                    start: 0,
                    count: 24
                },
                bgsize: "cover"
            }
        },
        watch: {
            defaultVideo: {
                deep: true,
                handler(v) {
                    localStorage.setItem('defaultvideo', JSON.stringify(v));
                    let his = localStorage.getItem('history');
                    his = his ? JSON.parse(his) : [];
                    if (!his.filter(va => va.url === v.url).length) {
                        his.push({ timeStamp: Date.now(), ...v });
                        this.$set(this, 'history', his);
                    }
                    this.setVideoSrc(v.url);
                }
            },
            history: {
                deep: true,
                handler(v) {
                    localStorage.setItem('history', JSON.stringify(v));
                }
            },
            bgsize(v) {
                console.log(v);
                this.setVideoSize(v)
            },
            muted(v) {
                this.setVideoMuted(v)
            },
            isShow(v) {
                this.showDesktop(v)
            },
            ["searchParams.cid"]: {
                handler() {
                    this.getList()
                }
            },
            ["searchParams.start"]: {
                handler() {
                    this.getList(true)
                }
            }
        },
        created() {
            this.createDesktop().then(async () => {
                this.setVideoSrc(this.defaultVideo.url);
                let [playerHwnd, desktopHwnd] = await Promise.all([
                    this.getPlayerHwnd(),
                    this.getDesktopHwnd()
                ]);
                if (playerHwnd && desktopHwnd) {
                    this.$set(this, 'playerHwnd', parseInt(playerHwnd));
                    this.$set(this, 'desktopHwnd', parseInt(desktopHwnd));
                    this.win.moveTo(0, 0);
                    this.win.resizeTo(screen.width, screen.height);
                    this.setDesktop(playerHwnd, desktopHwnd);
                    this.showDesktop();
                }
            });
            CDNAPI.getCategory().then(r => r.errno == 0 ? r.data : []).then(r => {
                this.categorys = r;
                setTimeout(() => {
                    new Swiper(".mySwiper", {
                        direction: "horizontal",
                        slidesPerView: "auto",
                        freeMode: true,
                        mousewheel: true,
                    });
                }, 100);
                this.getList();
            });
        },
        methods: {
            // 获取网络图库
            getList(isAdd = false) {
                if (!isAdd) { this.v_list = []; }
                CDNAPI.getList(this.searchParams).then(r => r.errno == 0 ? r.data : []).then(r => {
                    if (isAdd) {
                        r.map(v => ({
                            title: v.utag,
                            type: "image",
                            url: v.url,
                            thumbnail: v.url_thumb
                        })).forEach(v => {
                            this.v_list.push(v)
                        })
                    } else {
                        this.v_list = r.map(v => ({
                            title: v.utag,
                            type: "image",
                            url: v.url,
                            thumbnail: v.url_thumb
                        }))
                    }
                });
            },
            // 设置视频地址
            setVideoSrc(src) {
                this.win.window.postMessage({
                    command: "src",
                    message: src
                }, "*");
            },
            // 设置静音模式
            setVideoMuted(muted = true) {
                this.win.window.postMessage({
                    command: "muted",
                    message: muted
                }, "*");
            },
            // 设置桌面模式
            setVideoSize(size = 'cover') {
                this.win.window.postMessage({
                    command: "size",
                    message: size
                }, "*");
            },
            // 创建桌面
            createDesktop() {
                return createPlayerWindow().then(win => {
                    this.$set(this, 'win', win);
                })
            },
            // 设置桌面显示方式
            showDesktop(show = true) {
                if (show) {
                    return dllAPI.showWindow(this.desktopHwnd, 5).then(() => {
                        this.win.show();
                        return true
                    });
                } else {
                    return dllAPI.showWindow(this.desktopHwnd, 0).then(() => {
                        this.win.hide()
                        return true
                    });
                }
            },
            // 文件地址改变事件
            handleFileChangeA(e) {
                this.defaultVideo = {
                    title: e.target.value,
                    url: e.target.value,
                    thumbnail: ''
                }
            },
            // 文件改变事件
            handleFileChange(e) {
                this.defaultVideo = {
                    title: e.target.files[0].name,
                    url: e.target.files[0].path,
                    type: e.target.files[0].type.split('/')[0].toLowerCase(),
                    thumbnail: ''
                }
            },
            // 退出
            quit() {
                this.showDesktop(!1).then(() => {
                    nw.App.quit();
                });
            },
            // 销毁桌面
            closeDesktop() {
                if (!this.playerHwnd) return Promise.reject(false);
                return this.showDesktop(!1).then(dllAPI.destory(this.playerHwnd));
            },
            // 获取桌面层句柄
            getDesktopHwnd() {
                return dllAPI.getWorker()
            },
            // 获取播放器句柄
            getPlayerHwnd() {
                return dllAPI.getWindow('henhao-player');
            },
            // 设置桌面
            setDesktop(playerHwnd, desktoHwnd) {
                return dllAPI.setParent(playerHwnd, desktoHwnd);
            }
        }
    }).$mount('#app');
})();
/**
 * 任务栏图标及设置
 */
// 通知栏菜单——一般是在桌面右下角
((vm) => {
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
        click: function () {
            vm.quit()
        },
    }));
    tray.menu = menu;
})(vm);
/**
 * 主窗口的其他一些设置
 */
(async (win, vm) => {
    // 主窗口关闭即整个APP关闭
    win.on('close', function () {
        vm.quit();
    });
})(nw.Window.get(), vm);
