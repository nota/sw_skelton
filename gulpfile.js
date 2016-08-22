'use strict'

const del = require('del')
const gulp = require('gulp')
const environments = require('gulp-environments')
const iconfont = require('gulp-iconfont')
const iconfontCss = require('gulp-iconfont-css')
const replace = require('gulp-replace');
const glob = require('glob-promise');
const md5 = require('MD5')
const md5File = require('md5-file/promise')


const development = environments.development
const production = environments.production
console.log('development', development())
console.log('production', production())

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

function getAssetList () {
  return glob('./public/**/*.*').then(files => {
    files = files.map(file => file.replace(/^\.\/public\//, '/'))
    files.push('/app.html')
    return files
  })
}

function getAssetHashList () {
  return glob('./public/**/*.*')
    .then(files => {
      files.push('./views/app.ejs')
      return files
    }).then(files => {
      return Promise.all(files.map(file => {
        return md5File(file)
      }))
    })
}

function getOneAssetHash () {
  return getAssetHashList().then(results => {
    let all = results.join(',')
    return md5(all)
  })
}

// service workerのFILESとCHECKSUMを作ってsw.jsを作成
gulp.task('serviceworker', function () {
  let checksum

  return getOneAssetHash()
    .then(result => {
     console.log(result)
     checksum = result
     return getAssetList()
    })
    .then(files => {
      return gulp.src(['./src/client/js/sw.js'])
        .pipe(replace(/FILES = .*/, `FILES = [\n'${files.join('\',\n\'')}'\n];`))
        .pipe(replace(/CHECKSUM = .*/, `CHECKSUM = "${checksum}"`))
        .pipe(gulp.dest('./public/'))
    })
})


// ファイルの変更を監視する
// ファイルが変更されたら自動的にコンパイルする
gulp.task('watch', ['build'], () => {
  gulp.watch('src/client/img/**', ['img'])
  gulp.watch('src/client/fonts/**', ['iconfont'])
  gulp.watch('public/**', ['serviceworker'])
  gulp.watch('views/**', ['serviceworker'])
})

// 作業フォルダをクリーンな状態に戻す
gulp.task('clean', () => {
  return del([
    'public/*'
  ])
})

// ビルドタスク
const buildTasks = ['fonts', 'iconfont', 'img', 'favicon', 'serviceworker']
gulp.task('build', buildTasks)
gulp.task('rebuild', ['clean'], () => {
  gulp.run('build')
})
