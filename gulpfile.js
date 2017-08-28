'use strict'

const del = require('del')
const gulp = require('gulp')
const iconfont = require('gulp-iconfont')
const iconfontCss = require('gulp-iconfont-css')

const config = {
  nodeModuleDir: './node_modules'
}

// フォントをコピーする
gulp.task('fonts', () => {
  const paths = [
    config.nodeModuleDir + '/bootstrap-sass/assets/fonts/bootstrap/**.*',
    config.nodeModuleDir + '/font-awesome/fonts/**.*'
  ]

  return gulp.src(paths)
    .pipe(gulp.dest('./public/fonts'))
})

// 画像をコピーする
gulp.task('img', () => {
  const paths = [
    './src/client/img/**.*'
  ]

  return gulp.src(paths)
    .pipe(gulp.dest('./public/img'))
})

// faviconをコピーする
gulp.task('favicon', () => {
  return gulp.src('./src/client/img/favicon.ico')
    .pipe(gulp.dest('./public'))
})

// Icon fontを生成
gulp.task('iconfont', function () {
  const fontName = 'app'

  return gulp.src(['./src/client/fonts/*.svg'])
    .pipe(iconfontCss({
      fontName: fontName,
      targetPath: '../css/icons.css',
      fontPath: '../fonts/'
    }))
    .pipe(iconfont({
      fontName: fontName,
      normalize: true,
      fontHeight: 1001,
      formats: ['eot', 'woff', 'woff2', 'ttf', 'svg']
    }))
    .pipe(gulp.dest('./public/fonts/'))
})

// ファイルの変更を監視する
// ファイルが変更されたら自動的にコンパイルする
gulp.task('watch', ['build'], () => {
  gulp.watch('src/client/img/**', ['img'])
  gulp.watch('src/client/fonts/**', ['iconfont'])
})

// 作業フォルダをクリーンな状態に戻す
gulp.task('clean', () => {
  return del([
    'public/*'
  ])
})

// ビルドタスク
const buildTasks = ['fonts', 'iconfont', 'img', 'favicon']
gulp.task('build', buildTasks)
gulp.task('rebuild', ['clean'], () => {
  gulp.run('build')
})
