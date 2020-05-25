import config from '../../config';

interface IPage {
  _setTempFilePath: (path: string) => void;
  handleGetUserInfo: WechatMiniprogram.EventCallback;
  handleChooseImage: () => void;
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
    scaleValue: 1,
  },

  _setTempFilePath(path: string) {
    const { frames, currentFrame } = this.data;
    wx.getImageInfo({
      src: path,
      success: ({ width, height }) => {
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
});
