/**
 * Canvas Frame Player
 */
;
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
}('framePlayer', [], window, function (window) {
    var document = window.document;

    var own = {};

    var config = {
        nodeName: '#canvas',
        nodeClass: '',
        width: 750,
        height: 1207
    };
    var frameList = {};
    var canvas;
    var context;

    var currentTime = 0;
    var lastTime = 0;
    var deltaTime = 0;
    var start = 0;
    var total = 0;
    var interval = 0;
    var looping = false;
    var loopObj = {};
    var onLoopStart = {};
    var onLoopProcess = {};
    var onLoopEnd = {};

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

    /**
     * 启动循环函数
     */
    function startLoop() {
        onLoopStart.type = isFunction(onLoopStart.func);
        onLoopProcess.type = isFunction(onLoopProcess.func);
        onLoopEnd.type = isFunction(onLoopEnd.func);

        lastTime = Date.now();
        looping = true;

        if (onLoopStart.type) {
            onLoopStart.func();
        }

        loop();
    }

    /**
     * 循环主函数
     */
    function loop() {
        if (!looping) {
            (onLoopEnd.type && start === total) ? onLoopEnd.func() : '';

            return;
        }

        currentTime = Date.now();
        deltaTime = currentTime - lastTime;

        if (onLoopProcess.type) {
            onLoopProcess.func();
        }

        requestAnimationFrame(loop);
    }

    /**
     * 验证是否是函数
     * @param {Object} functionToCheck [description]
     * @return {Boolean}
     */
    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    /**
     * 添加帧素材
     * @param {String} tag 序列帧标签名
     * @param {Array} res 素材数组
     */
    function addFrames(tag, res) {
        frameList[tag] = {};
        frameList[tag].res = res;
        console.log(res);
    }

    /**
     * 初始化
     * @param {Object} param 参数
     */
    function init(param) {
        clone(config, param);

        // 获取canvas外层DOM
        var nodeName = document.querySelector(config.nodeName);
        if (!nodeName) {
            nodeName = document.createElement('div');
            document.body.appendChild(nodeName);
        }
        nodeName.className += config.nodeClass;

        // 添加canvas
        canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = config.height;
        context = canvas.getContext('2d');
        nodeName.appendChild(canvas);
    }

    /**
     * 播放序列帧
     * @param {String} tag 序列帧索引
     * @param {Number} duration 持续时间，单位ms
     * @param {Function} onPlayStart 开始播放回调函数
     * @param {Function} onPlayEnd 结束播放回调函数
     */
    function play(tag, duration, frame, onPlayStart, onPlayEnd) {
        console.log("play");
        console.log(frameList[tag]);
        if (typeof frame != 'undefined') start = frame;
        if (start == total) start = 0;
        if (frameList[tag]) {
            total = frameList[tag].res.length;
            interval = duration / total;
            loopObj = {
                tag: tag
            };
            onLoopStart.func = onPlayStart;
            onLoopEnd.func = onPlayEnd;
            onLoopProcess.func = function () {
                console.log(start, total);
                if ((deltaTime >= interval) && (start < total)) {
                    // console.log(frameList[loopObj.tag].res[start]);
                    context.drawImage(frameList[loopObj.tag].res[start], 0, 0, config.width, config.height);

                    start++;
                    lastTime = currentTime;
                } else if (start >= total) {
                    looping = false;
                }
            };

            startLoop();
        } else {
            console.log('Failed to play frames');
        }
    }

    function drawByFrame(tag, frame) {
        context.drawImage(frameList[tag].res[frame], 0, 0, config.width, config.height);
    }

    /**
     * 清除屏幕内容
     */
    function clear() {
        context.clearRect(0, 0, config.width, config.height);
    }

    /**
     * 停止动画
     */
    function stop() {
        looping = false;
    }

    own.init = init;
    own.addFrames = addFrames;
    own.play = play;
    own.clear = clear;
    own.stop = stop;
    own.drawByFrame = drawByFrame;

    return own;
});