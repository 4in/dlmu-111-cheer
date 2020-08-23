# 海大111周年校庆


## 使用方式

```bash
# 安装依赖
$ yarn  # npm i

# 开发   如果在编译前预处理写，会把整个项目进行编译，其实是没有必要的。
$ yarn dev

# 预览/上传 前的预处理   微信开发者工具会自动帮我们做这件事 ;)
$ yarn compile

# 格式化文件
$ yarn format

# 清理文件
$ yarn clean
```

## 添加 / 修改边框

1. 在`miniprogram/assets/frames`目录下放置头像相框，目前都是512x512像素（非强制，但宽高必须一致）
2. 在`miniprogram/frames.ts`文件中配置相框，frameSize: 图片宽高、x: 头像区域左上角x坐标、y: 头像区域左上角y坐标、contentSize: 头像大小
3. 把`miniprogram/app.ts`中的[MTA](https://mta.qq.com/)配置改成自己的，用于统计访问量等信息




## 截图
<p align="center"><a href="https://github.com/marco-tan/dlmu-111-cheer" rel="noopener noreferrer"><img width="375" src="https://github.com/marco-tan/dlmu-111-cheer/raw/refactor/movable-view/screenshot.jpg" alt="Screenshot"></a></p>
