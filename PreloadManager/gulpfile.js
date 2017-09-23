var gulp = require('gulp');
var fs = require('fs');
var path = require('path');

//注册
var deep = 6;
var path_pc = 'E:/Tools/tmt-workflow-white/';
var mac_pc = '//WORKS/LABS/tmt-workflow-master/';
run_tasks('_tasks');

function run_tasks(tasks_path) {
    if (--deep < 0) {
        throw new Error('something wrong in require tasks!');
        return;
    }

    if(deep==5){
        tasks_path = path.join(path_pc, '_tasks');
    }else if(deep==4){
        tasks_path = path.join(mac_pc, '_tasks');
    }else{
        if(deep==3) tasks_path = '_tasks';
        tasks_path = path.join('../', tasks_path);
    }
    
    if (fs.existsSync(tasks_path)) {
        require(tasks_path)(gulp);
    } else {
        run_tasks(tasks_path);
    }
}
