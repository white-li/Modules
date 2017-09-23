# PreloadManager 预加载模块
[demo](http://display.6edigital.com/)
---
## 依赖库
- [预加载库 preloadjs ^0.6.2](http://www.createjs.com/preloadjs)

## 初始化
```
<script src="./js/preloadjs-0.6.2.min.js"></script>
<script src="./js/preloader.js"></script>
```
## 配置属性
- vt: (default: 0) 虚拟loading时间
- xhr: (default: true) xhr加载方式
- root: (default: "" ) 全局根目录
```
 preloader.init({
   vt: 1,
   xhr: true,
   root: 'img/'
 });
```


## 方法调用
- 添加素材JSON
```
/**
 * 添加素材JSON
 * @param {Object} assets 素材json
 * @param {String} root 素材根目录
 */
preloader.addAssets({
    end_bg: 'end_bg.jpg',
    icon1: 'icon1.png',
    wave: 'wave.jpg',
    sound: 'sound.mp3',
    // 序列帧
    ani: {type: 'ani', prefix: "ani_000", suffix: ".jpg", start: 0, end: 88}
},'./img/');
```

- 开始加载素材
```
preloader.load();
```

- 事件监听
```
preloader.onFileComplete = function(item){console.log(item)};
preloader.onLoadProgress = function(p){
    console.log(p);
    if(p==1){
        // do something when load complete ( virtual loading )
    }
};
preloader.onLoadComplete = function(result){
    // assets load complete
    console.log(result);
};
```

- 销毁加载
```
photoEditor.destroy();
```
