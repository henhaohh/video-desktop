const path = require('path');
const fs = require('fs');
let vm = (() => {
  let template = fs.readFileSync(path.join(nw.App.startPath, 'package.nw/pages/player/template/index.html'), 'utf-8');
  return new Vue({
    template,
    data() {
      return {
        muted: true,
        src: "",
        backgroundSize: 'cover'
      }
    },
    watch: {
      src() {
        this.defaultShow();
      },
      muted(v) {
        this.webview && this.webview.setAudioMuted(v);
      },
      backgroundSize(v) {
        this.webview && this.webview.insertCSS({
          code: `body>video,body>img,body>iframe {position: absolute;left: 0;width: 100%;top: 0;height: 100%;display: block;object-fit: ${v || 'cover'};}`
        })
      }
    },
    computed: {
      iframe() {
        return this.$refs["iframe"]
      },
      webview() {
        return this.$refs["webview"]
      },
      isLocal() {
        if (!this.src) return false;
        let url = new URL(this.src);
        return ['file:'].includes(url.protocol)
      }
    },
    created() {
      window.addEventListener('message', e => {
        console.log(e);
        let command = e.data.command.toLocaleLowerCase();
        switch (command) {
          // 设置播放源
          case 'src':
            this.src = e.data.message;
            break;
          // 设置静音状态
          case 'muted':
            this.muted = e.data.message;
            break;
          // 设置背景方式
          case 'size':
            this.backgroundSize = e.data.message
            break;
        }
      });
    },
    methods: {
      defaultShow() {
        let me = this;
        if (this.isLocal) {// 本地
          if (this.iframe) {
            this.iframe.addEventListener('load', function () {
              let style = document.createElement('style');
              style.textContent = `body>video,body>img,body>iframe {position: absolute;left: 0;width: 100%;top: 0;height: 100%;display: block;object-fit: ${me.backgroundSize || 'cover'};}`;
              let h = this.contentDocument.head;
              h.appendChild(style);
              [...this.contentDocument.querySelectorAll('video,audio')].forEach(elm => {
                elm.muted = me.muted;
                elm.removeAttribute('controls');
                elm.setAttribute('loop',-1);
              });
            });
          }
        } else {// 网络
          if (this.webview) {
            this.webview.addEventListener('contentload', function () {
              this.insertCSS({
                code: `body>video,body>img,body>iframe {position: absolute;left: 0;width: 100%;top: 0;height: 100%;display: block;object-fit: ${me.backgroundSize || 'cover'};}`
              });
              this.executeScript({
                code: `let video = document.querySelector('video');
                  if(video){
                    video.removeAttribute('controls');
                    video.setAttribute('loop',-1);
                  }`});
            });
            this.webview.addEventListener("loadcommit", function () {
              this.setAudioMuted(me.muted)
            });
          }
        }
      }
    }
  }).$mount('#app');
})();