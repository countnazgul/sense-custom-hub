'use strict';
var senseGo = require( 'C:\\Users\\Home\\AppData\\Roaming\\npm\\node_modules\\sense-go\\lib' );
var gulp = senseGo.gulp; // Get the reference to the gulp instance used in sense-go

senseGo.init( function () {
    // Create a new custom task
    gulp.task('custom', function( done ) {
        console.log('Custom Task');
        done();
    });

});
