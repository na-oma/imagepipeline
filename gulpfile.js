/* File: gulpfile.js */
"use strict";

// grab our gulp packages
const gulp  = require('gulp'),
    gutil = require('gulp-util');

const print = require('gulp-print');
const through = require('through2')
const sort = require('gulp-sort');
const merge = require('merge-stream');
const es = require("event-stream");
const TupleStream = require("tuple-stream2");
const noop = require('gulp-noop');
const gulpif = require('gulp-if');
const snapshot = require('gulp-snapshot');
const map = require('map-stream');
const smushit = require('gulp-smushit');
const imagemin = require('gulp-imagemin');
const imageminZopfli = require('imagemin-zopfli');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGuetzli = require('imagemin-guetzli');
const imageminGiflossy = require('imagemin-giflossy');
const imageminPngout = require('imagemin-pngout');
const imageminPngquant = require('imagemin-pngquant');

gulp.task('default', function () {
    gutil.log('Gulp is running!')

    return gulp.src('src/**/*.{jpg,png}')
        //.pipe(smushit({verbose: true}))
        .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.jpegtran({progressive: true}),
                //imagemin.optipng({optimizationLevel: 7}),
                imagemin.svgo({plugins: [{removeViewBox: true}]}),
                imageminZopfli({more: true}),
            ],
            {verbose: true}))
        .pipe(gulp.dest('dist'));
});

gulp.task('jpg100x', function () {
    let quality = 70;

    gulp.src('src/25646_16155950.jpg')
        .pipe(imagemin([
            imageminMozjpeg({quality: quality}),
        ],
        {verbose: true}))
        .pipe(gulp.dest('jpg100x'));

    for(let i = 0; i < 1000; i++) {
        gulp.src('jpg100x/25646_16155950.jpg')
            .pipe(imagemin([
                imageminMozjpeg({quality: Math.floor((Math.random() * 50) + 51)}),
            ],
            {verbose: true}))
            .pipe(gulp.dest('jpg100x'));
    }
});


var log = function(file, cb) {
    console.log(file[0]);
    console.log(file[1]);
    //console.log(file.path);
    console.log();
    cb(null, file);
};

var logFile = function(file, cb) {
    console.log(file.path);
    console.log(file.stat.size);
    cb(null, file);
};

var printSizes = function(file) {
    console.log(file.path);
    console.log(file.stat.size);
    console.log(file.contents.length);
};



// Plugin level function(dealing with files)
function returnSmallerFileFromTuple() {

  // Creating a stream through which each file will pass
  return through.obj(function(file, enc, cb) {
//    if (file.isNull()) {
      // return empty file
//      return cb(null, file);
//    }
    //if (file.isBuffer()) {
      //file.contents = Buffer.concat([prefixText, file.contents]);
    //}
    //if (file.isStream()) {
      //file.contents = file.contents.pipe(prefixStream(prefixText));
    //}

//TODO: make usable for streams and buffers
    console.log(file[0].path + ": " + file[0].contents.length);
    console.log(file[1].path + ": " + file[1].contents.length);

    if (file[0].contents.length == file[1].contents.length) {
        console.log("file 0 equal");
        cb(null, file[0]);
    } else if (file[0].contents.length <= file[1].contents.length) {
        console.log("file 0 smaller");
        cb(null, file[0]);
    } else {
        console.log("file 1 smaller");
        cb(null, file[1]);
    }

  });

}

gulp.task('test', function() {
    const first = gulp.src('src/**/*.{jpg,png}')
        .pipe(smushit({verbose: true}))
        .pipe(imagemin())
        .pipe(sort());
    const second = gulp.src('src/**/*.{jpg,png}')
        .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.jpegtran({progressive: true}),
                //imagemin.optipng({optimizationLevel: 7}),
                imagemin.svgo({plugins: [{removeViewBox: true}]}),
                imageminZopfli({more: true}),
            ],
            {verbose: true}))
        .pipe(sort());

    function comparator(a, b) {
        if (!a || !a.path)
            return 1;
        if (!b || !b.path)
            return -1;
        return a.path.localeCompare(b.path);
    };

    const tuples = TupleStream([first, second], { comparator: comparator })
        .pipe(returnSmallerFileFromTuple());

    return tuples.pipe(gulp.dest('dist_two_ops'));
});

gulp.task('guetzli', () =>
    gulp.src('src/**/*')
        .pipe(imagemin([imageminGuetzli()]))
        .pipe(gulp.dest('dist_guetzli'))
);

gulp.task('zopfli', () =>
    gulp.src('src/49018_d0096271604700.png')
        .pipe(print())
        .pipe(imagemin([imageminZopfli()]))
        .pipe(imagemin([imagemin.optipng({optimizationLevel: 7})]))
        .pipe(gulp.dest('dist_zopfli'))
);

gulp.task('svg', () =>
    gulp.src('src/**/*.svg')
        .pipe(imagemin([
                imagemin.svgo({plugins: [
                    {convertShapeToPath: false},
                ]}),
            ],
            {verbose: true}))
        .pipe(gulp.dest('dist_svg'))
);

/*does not install */
gulp.task('giflossy', () =>
    gulp.src('src/**/*.gif')
        .pipe(imagemin([
                imageminGiflossy()
            ],
            {verbose: true}))
        .pipe(gulp.dest('dist_gif'))
);

gulp.task('gifsicle', () =>
    gulp.src('src/**/*.gif')
        .pipe(imagemin([
                imagemin.gifsicle({/*interlaced: true, */optimizationLevel: 3}),
            ],
            {verbose: true}))
        .pipe(gulp.dest('dist_gif'))
);

function comparatorPath(a, b) {
    if (!a || !a.path)
        return 1;
    if (!b || !b.path)
        return -1;
    return a.path.localeCompare(b.path);
};


gulp.task('imba', () => {
    const out = 'imba';
    const quality = 92;
    //GIF
    const gifStream = gulp.src('src_/**/*.gif')
        .pipe(imagemin([
                imagemin.gifsicle({/*interlaced: true, */optimizationLevel: 3}),
            ],
            {verbose: true}))
        .pipe(gulp.dest(out));
    //SVG
    const svgStream = gulp.src('src_/**/*.svg')
        .pipe(imagemin([
                imagemin.svgo({plugins: [
                    /*{convertShapeToPath: false},*/
                    {removeViewBox: false},
                ]}),
            ],
            {verbose: true}))
        .pipe(gulp.dest(out));
    //JPG
    const streamSmushit = gulp.src('src_/**/*.{jpg,jpeg}')
        .pipe(sort())
//        .pipe(smushit({verbose: true}))
        .pipe(imagemin([
                imagemin.jpegtran({progressive: true}),
            ],
            {verbose: true}))
        .pipe(sort());
    const streamGuetzli = gulp.src('src_/**/*.{jpg,jpeg}')
        .pipe(sort())
        .pipe(imagemin([
                imageminGuetzli({quality: quality})
            ],
            {verbose: true}))
        .pipe(imagemin([
                imagemin.jpegtran({progressive: true}),
            ],
            {verbose: true}))
        .pipe(sort());
    const streamMoz = gulp.src('src_/**/*.{jpg,jpeg}')
        .pipe(sort())
        .pipe(imagemin([
                imageminMozjpeg({quality: quality})
            ],
            {verbose: true}))
        .pipe(imagemin([
                imagemin.jpegtran({progressive: true}),
            ],
            {verbose: true}))
        .pipe(sort());

    let tuples = TupleStream([streamSmushit, streamGuetzli], { comparator: comparatorPath });
    let streamSmaller = tuples
        .pipe(returnSmallerFileFromTuple());
    tuples = TupleStream([streamSmaller, streamMoz], { comparator: comparatorPath });
    const jpgStream = tuples
        .pipe(returnSmallerFileFromTuple())
        .pipe(gulp.dest(out));

    //PNG
    const streamZopfliOpti = gulp.src('src_/**/*.png')
        .pipe(sort())
//        .pipe(smushit({verbose: true}))
        .pipe(imagemin([
//                imageminPngout({ strategy: 0 }),
                imageminZopfli({more: true}),
                imagemin.optipng({optimizationLevel: 7}),
            ],
            {verbose: true}))
        .pipe(sort());
    const streamQuant = gulp.src('src_/**/*.png')
        .pipe(sort())
        .pipe(imagemin([
                imageminPngquant({quality: quality-15, speed: 1, verbose: true}),
//                imageminPngout({ strategy: 0 }),
                imageminZopfli({more: true}),
                imagemin.optipng({optimizationLevel: 7}),
            ],
            {verbose: true}))
        .pipe(sort());

    tuples = TupleStream([streamZopfliOpti, streamQuant], { comparator: comparatorPath });
    streamSmaller = tuples
        .pipe(returnSmallerFileFromTuple());
    const pngStream = streamSmaller
        .pipe(gulp.dest(out));

    console.log("Please Check any generated SVGs, these optimizations are aggressive!");
    return merge(gifStream, svgStream, jpgStream, pngStream);
});