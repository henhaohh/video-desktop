// vue 代码
let vm = (() => {
    let template = fs.readFileSync(path.join(nw.App.startPath, 'package.nw/template/index.html'), 'utf-8');
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
                defaultVideo: localStorage.getItem('defaultvideo') ? JSON.parse(localStorage.getItem('defaultvideo')) : {
                    title: "yoyo鹿鸣",
                    type: "video",
                    url: 'https://n0va.mihoyo.com/medias/bgvideo.13edb8ad.mp4',
                    thumbnail: 'https://img-static.mihoyo.com/communityweb/upload/5da4c7abd99381aa867c878102585582.png'
                }, // 默认
                sourceType: "net",//资源类型，网络：net，本地：local
                v_list: [
                    {
                        title: "yoyo鹿鸣",
                        type: "video",
                        url: 'https://n0va.mihoyo.com/medias/bgvideo.13edb8ad.mp4',
                        thumbnail: 'https://img-static.mihoyo.com/communityweb/upload/5da4c7abd99381aa867c878102585582.png'
                    }, {
                        title: '白熊',
                        type: "video",
                        url: "https://www.w3school.com.cn/example/html5/mov_bbb.mp4",
                        thumbnail: 'http://lain.bgm.tv/pic/cover/l/1f/83/66249_w3ynm.jpg'
                    }, {
                        title: "本地文件1",
                        type: "video",
                        url: "D:\\Program Files\\N0vaDesktop\\N0vaDesktopCache\\game\\1598371226346_538.mp4",
                        thumbnail: "/package.nw/images/20210111164124.png"
                    }, {
                        title: "本地文件2",
                        type: "video",
                        url: "D:\\Program Files\\N0vaDesktop\\N0vaDesktopCache\\game\\1598371301098_696.mp4",
                        thumbnail: "/package.nw/images/20210111164013.png"
                    }, {
                        title: "图片测试",
                        type: "image",
                        url: "E:\\wallPaper\\ANIME-PICTURES.NET_-_686579-2835x4035-original-inagaki+minami-sousouman-single-long+hair-tall+image.png",
                        thumbnail: "E:\\wallPaper\\ANIME-PICTURES.NET_-_686579-2835x4035-original-inagaki+minami-sousouman-single-long+hair-tall+image.png"
                    }
                ]
            }
        },
        watch: {
            defaultVideo(v) {
                localStorage.setItem('defaultvideo', JSON.stringify(v));
                if (v.type === 'image') {
                    this.setBackground(v.url)
                } else if (v.type === 'video') {
                    this.setVideoSrc(v.url);
                }
            },
            muted(v) {
                this.setVideoMuted(v)
            },
            isShow(v) {
                this.showDesktop(v)
            }
        },
        created() {
            this.createDesktop().then(async () => {
                if (this.defaultVideo.type === 'image') {
                    this.setBackground(this.defaultVideo.url);
                } else if (this.defaultVideo.type === 'video') {
                    this.setVideoSrc(this.defaultVideo.url);
                }
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
        },
        methods: {
            // 设置背景地址
            setBackground(src) {
                this.win.window.postMessage({
                    type: "image",
                    command: "src",
                    message: src
                }, "*");
            },
            // 设置视频地址
            setVideoSrc(src) {
                this.win.window.postMessage({
                    type: "video",
                    command: "src",
                    message: src
                }, "*");
            },
            // 设置静音模式
            setVideoMuted(muted = true) {
                this.win.window.postMessage({
                    type: "video",
                    command: "muted",
                    message: muted
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
                    // this.setDesktop(this.playerHwnd, this.desktopHwnd).then(r => {
                    //     this.win.show()
                    // });
                } else {
                    return dllAPI.showWindow(this.desktopHwnd, 0).then(() => {
                        this.win.hide()
                        return true
                    });
                    // this.setDesktop(this.playerHwnd, 0).then(r => {
                    //     this.win.hide()
                    // });
                }
            },
            // 文件改变事件
            handleFileChange(e) {
                console.log(e);
                this.defaultVideo = {
                    title: e.target.files[0].name,
                    type: e.target.files[0].type.split('/')[0],
                    url: e.target.files[0].path,
                    thumbnail: ''
                }
                // this.defaultVideo = {
                //     url: e.target.files[0].path
                // }
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
                return dllAPI.getPlayer('henhao-player');
            },
            // 设置桌面
            setDesktop(playerHwnd, desktoHwnd) {
                return dllAPI.setParent(playerHwnd, desktoHwnd);
            }
        }
    }).$mount('#app');
})();