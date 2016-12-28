'use strict';
var senseGo = require('C:\\Users\\Home\\AppData\\Roaming\\npm\\node_modules\\sense-go\\lib');
var gulp = senseGo.gulp; // Get the reference to the gulp instance used in sense-go
var path = require('path');

/*
    Few changes are made in the sense-go global package
        * cli.js 
            --> changed "hasSenseGoJs" and "senseGoJsFile" variables to accept sense-go.local.js instead sense-go.js
                --> couldn't find another way to run custom tasks
            --> row 109: "&& hasSenseGoJs" instead "&& !hasSenseGoJs"
        * copy - copy:toTmp task copy not only the src content folder bu the whole src folder .tmp/src; 
                 and the other tasks are copying the .tmp folder - build\dev\.tmp\src          
            --> function "copy" accept "{base: taskConfig.base}"
            --> each task (except copy:toTmp) sends ",base: config.tmpDir"
            --> copy:toTmp sends "base: 'src'"
*/

var customConfig = senseGo.loadYml( path.join(__dirname, '.sense-go.local.yml'));

senseGo.init(function () {
    // Create a new custom task
    gulp.task('custom', function (done) {
        console.log('Custom Task1');
        done();
    });

    gulp.task('build', gulp.series(
        'clean:tmp',
        'copy:toTmp',
        'clean:tmpIllegal',        
        'wbfolder:tmp',
        'clean:buildDev',
        'copy:tmpToDev',        
        'deploy:toLocal',         
        'zip:dev',
        'clean:tmp',
        'custom'        // <== Load your own custom task and mix it with existing ones 
    ));

});
