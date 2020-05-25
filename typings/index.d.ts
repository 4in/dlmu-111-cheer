interface IAppOption {}

interface Frame {
  name: string;
  filename: string;
  rect: {
    // 内容区域的左上角x坐标
    x: number;
    // 内容区域的左上角y坐标
    y: number;
    // 图片的尺寸（仅支持正方形）
    frameSize: number;
    // 内容区域的尺寸（仅支持正方形）
    contentSize: number;
  };
}
