const app = getApp<IAppOption>();

interface IPage {
  _setTempFilePath: (path: string) => void;
  handleGetUserInfo: WechatMiniprogram.EventCallback;
  handleChooseImage: () => void;
  [key: string]: any;
}

interface IData {
  userInfo: Optional<WechatMiniprogram.UserInfo>;
  tempFilePath: string;
  movableSize: {
    width: number;
    height: number;
  };
  imgWidth: number;
  scaleValue: number;
}

const CANVAS_SIZE = 240;

Page<IData, IPage>({
  data: {
    userInfo: wx.getStorageSync('userInfo') || {},
    tempFilePath: '',
    movableSize: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
    },
    imgWidth: CANVAS_SIZE,
    scaleValue: 1,
  },

  _setTempFilePath(path: string) {
    wx.getImageInfo({
      src: path,
      success: ({ width, height }) => {
        let imgWidth: number;
        let movableSize = { width: 0, height: 0 };
        if (width <= height) {
          movableSize.width = imgWidth = CANVAS_SIZE;
        } else {
          movableSize.width = imgWidth = (CANVAS_SIZE * width) / height;
        }
        movableSize.height = (height / width) * imgWidth;
        this.setData({ tempFilePath: path, movableSize, imgWidth });
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
});
