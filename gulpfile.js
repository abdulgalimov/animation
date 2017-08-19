/**
 * Created by Zaur abdulgalimov@gmail.com on 19.08.17.
 */


var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');

gulp.task('animation', function (done) {
    return new Promise(function(resolve) {
        var files = [
            'Core.js',
            'Animation.js',
            'Ease.js',
            'Group.js'
        ];
        gulp.src(files, {cwd:'src/core'})
            .pipe(concat('animation.min.js'))
            .pipe(minify({
                ext:{
                    src:'-debug.js',
                    min:'.js'
                }
            }))
            .pipe(gulp.dest('build'))
            .on('end', function() {
                resolve();
            });
    });
});

gulp.task('pixi', function (done) {
    return new Promise(function(resolve) {
        var files = [
            'PixiProperties.js'
        ];
        gulp.src(files, {cwd:'src'})
            .pipe(concat('pixi-properties.min.js'))
            .pipe(minify({
                ext:{
                    src:'-debug.js',
                    min:'.js'
                }
            }))
            .pipe(gulp.dest('build'))
            .on('end', function() {
                resolve();
            });
    });
});