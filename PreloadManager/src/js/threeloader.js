/**
 * Created by white on 2017/9/17.
 */

/**
 * threeloader 预加载管理器 依赖 threejs（ 加入序列帧加载 ）
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
}('threeloader', [], window, function (window) {
    // OMD模块化 ( 兼容 amd & cmd & commonjs )
    var own = {};
    var curl = '';

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
     * 初始化threeloader
     * @param {Object} param 配置json
     */
    function init(param) {
        if (typeof THREE == 'undefined' || typeof THREE !== 'object' || typeof THREE.LoadingManager == 'undefined') {
            console.error('threeloader Error: THREE.LoadingManager not exist!');
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
    function load(assets, root) {
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
            if(config.vt>0 && timeid===0){
                timeid = setInterval(virtualProgress, fps);
            }
        }
    }

    /**
     * 初始化 threeloader
     */
    function initLoader() {
        destroy();
        own.loader = new THREE.LoadingManager();
        own.loader.onLoad = handleComplete;
        own.loader.onProgress = handleProgress;
        own.loader.onError =  handleError;

        if (config.vt > 0) {
            own.isVirtual = true;
            vc = (1 / fps) / config.vt;
            timeid = setInterval(virtualProgress, fps);
        }
    }


    /**
     *  解析普通素材类型  ~example~ {end_bg: 'end_bg.jpg'}
     *  @param {String} id 素材标签
     *  @param {String} url 素材url
     *  @param {String} root 素材根目录
     */
    function analyzeAsset(id, url, root) {
        var strArr = url.split('.');
        if (strArr.length > 1) {
            var ext = strArr[1];

            switch (true) {
                case /jpg|png/.test(ext):
                    loadImage(id, config.root + root + url);
                    break;
                case /mp3/.test(ext):
                    loadAudio(id, config.root + root + url);
                    break;
                case /obj/.test(ext):
                    loadObj(id, config.root + root + url);
                    break;
                default:
                    loadFile(id, config.root + root + url);
                    break;
            }


        } else {
            console.info('preloader Info: expanded name erro - ' + data);
        }
    }

    /**
     *  解析复杂素材类型 ~example~ {ani: {type: 'ani', prefix: "ani_", suffix: ".jpg", start: 0, end: 88}}
     *  @param {String} id 素材标签
     *  @param {Object} data 素材json
     *  @param {String} root 素材根目录
     */
    function analyzeData(id, data, root) {
        var type = data.type;
        if (type == "ani") {
            own.resultData[id] = [];
            analyzeAni(id, data, config.root + root);
        } else {
            loadImage(id, config.root + root + data.src);
        }
    }

    /**
     *  解析序列帧类型  ~example~ {ani: {type: 'ani', prefix: "ani_", suffix: ".jpg", start: 0, end: 88}}
     *  @param {String} id 素材标签
     *  @param {Object} data 素材json
     *  @param {String} root 素材根目录
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
     * @param {String} root 素材根目录
     */
    function loadAniImg(id, idx, cid, prefix, suffix, digit, root) {
        var zero = "";
        var dig = idx.toString().length;
        if (dig < digit) {
            for (var i = 0; i < dig; i++) {
                zero += "0";
            }
        }
        var url = prefix + zero + idx + suffix;
        var srcId = "ani#" + id + "#" + cid;

        loadImage(srcId, root + url);
    }

    /**
     *  图片加载
     *  @param {String} id 素材标签
     *  @param {String} url 素材url
     */
    function loadImage(id, url) {
        var loader = new THREE.ImageLoader( own.loader );
        var item = {id:id,result:null};
        loader.crossOrigin = '';

        loader.load( url, function(img){
            item.result = img;
            loadedItem(item);
        }, onItemProgress, onItemError);
    }

    /**
     *  纹理加载
     *  @param {String} id 素材标签
     *  @param {String} url 素材url
     */
    function loadAssets(id, url) {
        if (typeof THREE.ImageLoader == 'undefined') {
            console.error('threeloader Error: THREE.AudioLoader not exist!');
            return;
        }
        // own.loader.loadFile({id: id, src: root + src});
        var loader = new THREE.ImageLoader( own.loader );
        var tex = new THREE.Texture();
        var item = {id:id,result:tex};
        loader.crossOrigin = '';
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        loader.load( url , function(img){
            item.result.image = img;
            item.result.needsUpdate = true;
            loadedItem(item);
        }, onItemProgress, onItemError);
    }

    /**
     * 通过 THREE.AudioLoader 加载 audio 素材
     * @param {String} id 素材标签
     * @param {String} url 素材url
     */
    function loadAudio(id, url){
        if (typeof THREE.AudioLoader == 'undefined') {
            console.error('threeloader Error: THREE.AudioLoader not exist!');
            return;
        }
        var loader = new THREE.AudioLoader( own.loader );
        var item = {id:id,result:null};

        loader.load( url , function(buffer){
            var listener = new THREE.AudioListener();
            var sound = new THREE.Audio( listener );
            sound.setBuffer( buffer );
            // sound.setLoop( true );
            // sound.setVolume(0.5);
            item.result = sound;
            loadedItem(item);
        }, onItemProgress, onItemError);
    }

    /**
     * 加载 OBJ 模型
     * @param {String} id 素材标签
     * @param {String} url 素材url
     */
    function loadObj(id, url) {
        if (typeof THREE.OBJLoader == 'undefined') {
            console.error('threeloader Error: THREE.OBJLoader not exist!');
            return;
        }
        var loader = new THREE.OBJLoader( own.loader );
        var item = {id:id,result:null};

        loader.load( url, function ( object ) {
            item.result = object;
            loadedItem(item);
        }, onItemProgress, onItemError);
    }

    /**
     * 文件加载后装载素材
     * @param {Object} item preload返回素材对象
     */
    function loadedItem(item) {
        if (item) {
            var name = item.id;
            var nameArr = name.split('#');

            // 序列帧 id 标签 —— ani#fly#fly_001
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

    function onItemProgress(xhr) {

    }

    function onItemError(xhr) {

    }

    function handleFileLoad(e) {
        var item = e.item;
        item.result = e.result;
        //console.log(item);
        loadedItem(item);

        if (own.onFileComplete) {
            own.onFileComplete(item);
        }
    }

    function handleProgress(url, itemsLoaded, itemsTotal) {
        // console.log(e.progress);
        curl = url;
        per = itemsLoaded/itemsTotal;
        if (own.onLoadProgress && !own.isVirtual) {
            own.onLoadProgress(itemsLoaded/itemsTotal);
        }
    }

    function handleComplete() {
        console.log("handleComplete");
        if (own.onLoadComplete && !own.isVirtual) {
            own.onLoadComplete(own.resultData);
        }
        own.isComplete = true;
    }

    function handleError(url) {
        console.error("preloader Error: load error " + url);
    }

    /**
     *  Public ---------------------------------------------------------
     */
    own.init = init;
    own.load = load;
    own.destroy = destroy;

    return own;
});