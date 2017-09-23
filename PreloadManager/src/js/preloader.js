/**
 * preloadManager 预加载管理器 依赖 preloadjs（ 加入序列帧加载 ）
 * 增加配置 虚拟加载时间
 * example -----------------
 var assets_conf = {
       bg: 'end_bg.jpg',
       ani: {type: 'ani', prefix: "ani/ani_000", suffix: ".jpg", start: 0, end: 88}
    };
 preloader.init({
       vt: 1,
       xhr: true,
       root: './img/'
    });
 preloader.onFileComplete = function(item){console.log(item)};
 preloader.onLoadProgress = function(p){console.log(p)};
 preloader.onLoadComplete = function(result){console.log(result)};
 preloader.load();
 *
 * end -----------------
 */

!function (spacename, dependencies, window, factory) {
    "use strict";
    var ex = factory(window);
    if (typeof define == 'function' && (define.amd != undefined || define.cmd != undefined)) {
        define(dependencies, function () {
            return ex;
        }); // AMD
    } else if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = ex; // CommonJS NodeJS
    } else {
        window[spacename] = ex; // Browser globals
    }
}('preloader', [], window, function (window) {
    // OMD模块化 ( 兼容 amd & cmd & commonjs )
    var own = {};

    // 配置文件
    var config;
    var timeid, vc, per, vper, tper;
    var fps = 30;

    /**
     * 属性赋值
     * @param {Object} des 目标属性对象
     * @param {Object} src 输入的新属性对象
     */
    function clone(des, src) {
        var prop;
        for (prop in src) {
            if (des.hasOwnProperty(prop)) {
                des[prop] = src[prop];
            }
        }
    }

    function reset() {
        config = {
            vt: 0,       // 虚拟loading时间（秒
            xhr: true,   // 是否为xhr加载模式
            root: '',  // 素材根目录
            assets: {}   // 存储素材json
        };
        timeid = vc = per = vper = tper = 0;
        own.loader = null;
        own.isComplete = false;
        own.isVirtual = false;
        own.resultData = {};
        own.onLoadProgress = null;
        own.onLoadComplete = null;
        own.onFileComplete = null;
    }

    /**
     * 初始化
     * @param {Object} param 配置json
     */
    function init(param) {
        if (typeof createjs == 'undefined' || typeof createjs !== 'object' || typeof createjs.LoadQueue == 'undefined') {
            console.error('preloader Error: createjs.LoadQueue not exist!');
            return;
        }
        reset();
        clone(config, param);
        initLoader();
    }

    /**
     * 添加素材json
     * @param {Object} assets 素材json
     * @param {String} root 根目录
     */
    function addAssets(assets, root) {
        root = root || '';
        if (assets) {
            for (var i in assets) {
                var data = assets[i];
                var type = typeof(data);
                if (type == "object") {
                    analyzeData(i, data, root);
                } else if (type == "string") {
                    analyzeAsset(i, data, root);
                }
            }
        }
    }

    /**
     * 初始化 preloader
     */
    function initLoader() {
        destroy();
        own.loader = new createjs.LoadQueue(config.xhr, config.root);
        own.loader.on("fileload", handleFileLoad, this);
        own.loader.on("complete", handleComplete, this);
        own.loader.on("progress", handleProgress, this);
        own.loader.on("error", handleError, this);
        own.loader.installPlugin(createjs.Sound);

        if (config.vt > 0) {
            own.isVirtual = true;
            vc = (1 / fps) / config.vt;
        }else{
            vper =1;
        }
    }


    /**
     *  解析普通素材类型  ~example~ {end_bg: 'end_bg.jpg'}
     *  @param {String} id 素材标签
     *  @param {String} data 素材url
     */
    function analyzeAsset(id, data, root) {
        var strArr = data.split('.');
        if (strArr.length > 1) {
            var ext = strArr[1];
            addSrc(id, data, root);
        } else {
            console.info('preloader Info: expanded name erro - ' + data);
        }
    }

    /**
     *  解析复杂素材类型 ~example~ {ani: {type: 'ani', prefix: "ani_", suffix: ".jpg", start: 0, end: 88}}
     *  @param {String} id 素材标签
     *  @param {Object} data 素材json
     *  @param {String} root 根目录
     */
    function analyzeData(id, data, root) {
        var type = data.type;
        if (type == "ani") {
            analyzeAni(id, data, root);
            own.resultData[id] = [];
        } else {
            addSrc(id, data.src, root);
            own.resultData[id] = null;
        }
    }

    /**
     *  解析序列帧类型  ~example~ {ani: {type: 'ani', prefix: "ani_", suffix: ".jpg", start: 0, end: 88}}
     *  @param {String} id 素材标签
     *  @param {Object} data 素材json
     *  @param {String} root 根目录
     */
    function analyzeAni(id, data, root) {
        var start = data.start;
        var end = data.end;
        var cid = 0;
        var idx = start;
        var total = end;
        var v = 1;
        var digit = Math.max(end, start).toString().length;
        if (typeof start == 'undefined' || end == 'undefined')return;
        if (start > end) {
            idx = start;
            total = end;
            v = -1;
        }
        loadAniImg(id, idx, cid, data.prefix, data.suffix, digit, root);
        while (true) {
            idx += v;
            cid++;
            loadAniImg(id, idx, cid, data.prefix, data.suffix, digit, root);
            if (idx == total) return;
        }
    }

    /**
     *
     * @param {String} id 素材标签
     * @param {Int} idx 序列帧图片序列id
     * @param {Int} cid 序列帧加载顺序id
     * @param {String} prefix 前缀文件路径 ~E~ ani/ani_00
     * @param {String} suffix 文件扩展名 ~E~ .jpg
     * @param {Int} digit id最高位数 (补零用)
     * @param {String} root 根目录
     */
    function loadAniImg(id, idx, cid, prefix, suffix, digit, root) {
        var zero = "";
        var dig = idx.toString().length;
        if (dig < digit) {
            for (var i = 0; i < dig; i++) {
                zero += "0";
            }
        }
        var src = prefix + zero + idx + suffix;
        var srcId = "ani#" + id + "#" + cid;

        addSrc(srcId, src, root);
    }

    /**
     *  加载素材
     *  @param {String} id 素材标签
     *  @param {String} src 素材url
     *  @param {String} root 根目录
     */
    function addSrc(id, src, root) {
        // console.log(id,src,root);
        own.loader.loadFile({id: id, src: root + src});
    }

    /**
     * 文件加载后装载素材
     * @param {Object} item preload返回素材对象
     */
    function loadedItem(item) {
        if (item) {
            var name = item.id;
            var nameArr = name.split('#');

            if (nameArr.length >= 3) {
                if (nameArr[0] == 'ani') {
                    var id = parseInt(nameArr[2]);
                    var srcid = nameArr[1];
                    own.resultData[srcid][id] = item.result;
                }
            } else {
                own.resultData[name] = item.result;
            }
        }
    }

    /**
     * 虚拟加载进度
     */
    function virtualProgress() {
        if (vper < 1) {
            vper += vc;
        } else {
            vper = 1;
        }
        var cper = Math.min(vper, per);
        if (per < vper) {
            cper = tper + (per - tper) * 0.2;  //平滑缓慢加载进度
        }
        if (own.onLoadProgress != null) {
            own.onLoadProgress(cper);
        }
        if (cper >= 1 && own.isComplete) {
            own.onLoadProgress(1);
            own.onLoadComplete(own.resultData);
            clearInterval(timeid);
        }
        tper = cper;
    }

    /**
     * 开始加载
     */
    function load() {
        if (own.loader == null){ console.error('preloader Error: loader not init!');return;}
        own.loader.load();
        if(own.isVirtual)timeid = setInterval(virtualProgress, fps);
    }

    /**
     * 销毁
     */
    function destroy() {
        if (own.loader){
            own.resultData = null;
            own.loader.close();
            own.loader.destroy();
            own.loader = null;
        }
    }

    /**
     *  Event ---------------------------------------------------------
     */
    function handleFileLoad(e) {
        var item = e.item;
        item.result = e.result;
        //console.log(item);
        loadedItem(item);

        if (own.onFileComplete) {
            own.onFileComplete(item);
        }
    }

    function handleProgress(e) {
        // console.log(e.progress);
        per = e.progress;
        if (own.onLoadProgress && !own.isVirtual) {
            own.onLoadProgress(e.progress);
        }
    }

    function handleComplete(e) {
        console.log("handleComplete");
        own.isComplete = true;

        if (own.onLoadComplete) {
            own.onLoadComplete(own.resultData);
        }
    }

    function handleError(loader, res) {
        console.error("preloader Error: load error!");
    }

    /**
     *  Public ---------------------------------------------------------
     */
    own.init = init;
    own.addAssets = addAssets;
    own.load = load;
    own.destroy = destroy;

    return own;
});