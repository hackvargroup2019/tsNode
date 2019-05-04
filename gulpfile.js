const gulp = require('gulp');
const ts = require('gulp-typescript');
const shell = require('gulp-shell');

const tsProject = ts.createProject('server/tsconfig.json');

let distDir = 'dist/private/';
let distAssetDir = distDir + 'assets/';
let projectAppDir = 'app/';
let projectAssetsDir = projectAppDir + 'assets/';
let projectSourceDir = projectScriptDir + 'source/';

gulp.task('compile',() => {
    let tsResult = tsProject.src()
        .pipe(tsProject());
    return tsResult.js.pipe(gulp.dest(distDir));
    /*
    let tsResult = tsProject.src();
    return tsResult.js.pipe(gulp.dest(output));*/
});

gulp.task('copy_assets',()=>{
    let input = [projectAssetsDir+'**/*','!'+projectSourceDir+'**'];
    return gulp.src(input)
        .pipe(gulp.dest(distAssetDir));

});

gulp.task('watch_typescript', () => {
    let typescriptPath = projectAppDir+'**/*.ts';
    gulp.watch(typescriptPath, gulp.series(['compile']));
});

gulp.task('watch_assets', () => {
    let assetsPath = projectAssetsDir + '**/*';
    gulp.watch(assetsPath, gulp.series(['copy_assets']));
});

//TODO elimina compile_cpp e watch_source se non hai bisogno di utilizzare file in cpp
gulp.task('default', gulp.parallel(['compile','copy_assets', 'watch_typescript','watch_assets']));
gulp.task('dev', gulp.series(['compile','copy_assets']));
