import config from '../../config';

interface IPage {
  // 实时数据，如果放在data里会导致频繁刷新
  realtimeState: {
    x: number;
    y: number;
    scale: number;
  };
  tempFileSize: {
    width: number;
    height: number;
  };
  _setTempFilePath: (path: string) => void;
  handleGetUserInfo: WechatMiniprogram.EventCallback;
  handleChooseImage: () => void;
  handleExport: () => void;
  handleChangeCurrentFrame: WechatMiniprogram.EventCallback;
  [key: string]: any;
}

interface IData {
  // 容器尺寸
  canvasSize: number;
  // 用户信息
  userInfo: Optional<WechatMiniprogram.UserInfo>;
  // 临时文件路径
  tempFilePath: string;
  // 边框的根目录
  rootDir: string;
  // 边框信息数组
  frames: Frame[];
  // 当前边框的下标
  currentFrame: number;
  // 可移动区域大小
  movableRect: {
    width: number;
    height: number;
    translateX: number;
    translateY: number;
    scale: number;
  };
  // 图片容器宽度
  imgWidth: number;
  movableX: number;
  movableY: number;
  // 缩放比例
  scaleValue: number;
}

const CANVAS_SIZE = config.canvasSize;

Page<IData, IPage>({
  data: {
    canvasSize: config.canvasSize,
    userInfo: wx.getStorageSync('userInfo') || {},
    tempFilePath: '',
    rootDir: config.frames.rootDir,
    frames: config.frames.frames,
    currentFrame: 0,
    movableRect: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      translateX: 0,
      translateY: 0,
      scale: 1,
    },
    imgWidth: CANVAS_SIZE,
    // 用于控制movable-view的位置
    movableX: 0,
    movableY: 0,
    scaleValue: 1,
  },

  realtimeState: {
    x: 0,
    y: 0,
    scale: 1,
  },

  tempFileSize: {
    width: 0,
    height: 0,
  },

  _setTempFilePath(path: string) {
    const { frames, currentFrame } = this.data;
    wx.getImageInfo({
      src: path,
      success: ({ width, height }) => {
        this.tempFileSize.width = width;
        this.tempFileSize.height = height;
        let imgWidth: number;
        let movableRect = { width: 0, height: 0, translateX: 0, translateY: 0, scale: 1 };
        if (width <= height) {
          movableRect.width = imgWidth = CANVAS_SIZE;
        } else {
          movableRect.width = imgWidth = (CANVAS_SIZE * width) / height;
        }
        movableRect.height = (height / width) * imgWidth;
        movableRect.translateX = (frames[currentFrame].rect.x / frames[currentFrame].rect.frameSize) * CANVAS_SIZE;
        movableRect.translateY = (frames[currentFrame].rect.y / frames[currentFrame].rect.frameSize) * CANVAS_SIZE;
        movableRect.scale = frames[currentFrame].rect.contentSize / frames[currentFrame].rect.frameSize;
        this.setData({ tempFilePath: path, movableRect, imgWidth });
      },
    });
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
                  this._setTempFilePath(tempFilePath);
                },
              });
            },
          });
        }
      },
    });
  },

  handleGetUserInfo({ detail }) {
    const { errMsg, userInfo } = detail as { errMsg: string; userInfo: WechatMiniprogram.UserInfo };
    if (!~errMsg.indexOf(':ok')) return;
    wx.setStorageSync('userInfo', userInfo);
    this.setData({ userInfo });
    wx.downloadFile({
      url: userInfo.avatarUrl.replace(/\d+$/, '0'),
      success: ({ tempFilePath }) => {
        this._setTempFilePath(tempFilePath);
      },
    });
  },

  // 从相册中选择图片
  handleChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: ({ tempFilePaths }) => {
        this._setTempFilePath(tempFilePaths[0]);
      },
    });
  },

  // 导出
  handleExport() {
    const { rootDir, frames, currentFrame, tempFilePath } = this.data;
    const avatarInfo = Object.assign({}, this.realtimeState);
    console.log(avatarInfo);
    const tempFileSize = Object.assign({}, this.tempFileSize);
    const frame = frames[currentFrame];
    const ctx = wx.createCanvasContext('canvas');
    // 绘制头像
    ctx.drawImage(
      tempFilePath,
      0,
      0,
      tempFileSize.width,
      tempFileSize.height,
      frame.rect.x,
      frame.rect.y,
      frame.rect.contentSize,
      frame.rect.contentSize
    );
    // 绘制边框
    ctx.drawImage(`${rootDir}${frame.filename}`, 0, 0, 512, 512);
    ctx.draw(true, function () {
      wx.canvasToTempFilePath({
        canvasId: 'canvas',
        quality: 1,
        x: 0,
        y: 0,
        width: 512,
        height: 512,
        destWidth: 512,
        destHeight: 512,
        success: ({ tempFilePath }) => {
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success() {
              wx.showToast({ title: '导出成功' });
            },
            fail() {
              wx.showModal({
                title: '提示',
                content: '导出失败，请打开权限',
                success({ confirm }) {
                  if (confirm) {
                    wx.openSetting({});
                  }
                },
              });
            },
          });
        },
        fail() {
          wx.showModal({
            title: '提示',
            content: '导出失败',
            showCancel: false,
          });
        },
      });
    });
  },

  handleChangeCurrentFrame({ currentTarget }) {
    const { index } = currentTarget.dataset;
    const { frames } = this.data;
    const movableRect = Object.assign({}, this.data.movableRect);
    const currentFrame = Number(index);
    movableRect.translateX = (frames[currentFrame].rect.x / frames[currentFrame].rect.frameSize) * CANVAS_SIZE;
    movableRect.translateY = (frames[currentFrame].rect.y / frames[currentFrame].rect.frameSize) * CANVAS_SIZE;
    movableRect.scale = frames[currentFrame].rect.contentSize / frames[currentFrame].rect.frameSize;
    this.setData({
      currentFrame,
      movableRect,
    });
  },

  handleChange(event: any) {
    const { x, y } = event.detail;
    this.realtimeState.x = x;
    this.realtimeState.y = y;
  },

  handleScale(event: any) {
    this.realtimeState.scale = event.detail.scale;
  },
});
