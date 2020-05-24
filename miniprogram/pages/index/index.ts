const app = getApp<IAppOption>();

interface IPage {
  ctx: WechatMiniprogram.CanvasContext;
  ratio: number;
  canvasState: {
    // 记录当前的操作是移动还是缩放
    action: 'none' | 'move' | 'scale';
    x: number;
    y: number;
    lastX: number;
    lastY: number;
  };
  _setTempFile: (path: string) => Promise<boolean>;
  _draw: () => void;
  handleFillRect: () => void;
  handleGetUserInfo: WechatMiniprogram.EventCallback;
  handleTouchStart: WechatMiniprogram.EventCallback;
  [key: string]: any;
}

interface IData {
  userInfo: Optional<WechatMiniprogram.UserInfo>;
  tempFile: {
    path: string;
    width: number;
    height: number;
  };
  exportPath: string;
}

Page<IData, IPage>({
  ctx: wx.createCanvasContext('canvas'),
  ratio: 0,
  canvasState: {
    action: 'none',
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
  },

  data: {
    userInfo: wx.getStorageSync('userInfo') || {},
    tempFile: {
      path: '',
      width: 0,
      height: 0,
    },
    exportPath: '',
  },

  onReady() {
    wx.getSetting({
      success: ({ authSetting }) => {
        if (authSetting['scope.userInfo']) {
          wx.getUserInfo({
            lang: 'zh_CN',
            success: ({ userInfo }) => {
              wx.setStorageSync('userInfo', userInfo);
              this.setData({ userInfo });
              wx.downloadFile({
                url: userInfo.avatarUrl.replace(/\d+$/, '0'),
                success: ({ tempFilePath }) => {
                  this._setTempFile(tempFilePath);
                },
              });
            },
          });
        }
      },
    });
    const { screenWidth } = wx.getSystemInfoSync();
    this.ratio = screenWidth / 375;
    this.ctx.scale(this.ratio, this.ratio);
    this.ctx.setFillStyle('white');
    this.ctx.fillRect(0, 0, 375, 375);
    this.ctx.draw();
  },

  _setTempFile(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      wx.getImageInfo({
        src: path,
        success: ({ width, height }) => {
          this.setData(
            {
              tempFile: {
                path,
                width,
                height,
              },
            },
            () => resolve(true)
          );
        },
        fail: () => resolve(false),
      });
    });
  },

  _draw() {
    this.ctx.save();
    const {
      tempFile: { path },
    } = this.data;
    const { x, y } = this.canvasState;
    this.ctx.translate(x, y);
    this.ctx.drawImage(path, 0, 0, 240, 240);
    this.ctx.draw();
    this.ctx.restore();
  },

  handleFillRect() {
    this._draw();
  },

  handleTouchStart({ touches }) {
    if (touches.length === 1) {
      this.canvasState.action = 'move';
      this.canvasState.lastX = touches[0].x;
      this.canvasState.lastY = touches[0].y;
    }
  },

  handleTouchMove(event: any) {
    const { action } = this.canvasState;
    const { changedTouches } = event;
    if (action === 'none') return;
    if (action === 'move' && changedTouches.length) {
      const { x, y } = changedTouches[0];
      this.canvasState.x += x - this.canvasState.lastX;
      this.canvasState.y += y - this.canvasState.lastY;
      this.canvasState.lastX = x;
      this.canvasState.lastY = y;
      this._draw();
    }
  },

  handleTouchEnd(_event: any) {
    this.canvasState.action = 'none';
  },

  handleGetUserInfo({ detail }) {
    const { errMsg, userInfo } = detail as { errMsg: string; userInfo: WechatMiniprogram.UserInfo };
    if (!~errMsg.indexOf(':ok')) return;
    wx.setStorageSync('userInfo', userInfo);
    this.setData({ userInfo });
    wx.downloadFile({
      url: userInfo.avatarUrl.replace(/\d+$/, '0'),
      success: ({ tempFilePath }) => {
        this._setTempFile(tempFilePath);
      },
    });
  },
});
