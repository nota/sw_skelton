'use strict'

const del = require('del')
const gulp = require('gulp')
const environments = require('gulp-environments')
const iconfont = require('gulp-iconfont')
const iconfontCss = require('gulp-iconfont-css')
const replace = require('gulp-replace')
const glob = require('glob-promise')
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
    files.push('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css')
    return files
  })
}

function getAssetHash () {
  let tmpFiles
  return glob('./src/client/**/*.*')
    .then(files => {
      tmpFiles = files
      // sw.jsはpublicにあるのものはhashを含んでいるのでclientのものを使う
      //let index = tmpFiles.indexOf('./public/sw.js')
      //if (index !== false) {
      //  tmpFiles.splice(index, 1);
      //}
      //tmpFiles.push('./src/client/js/sw.js')
      return glob('./views/**/*.*')
    })
    .then(files => {
      files = files.concat(tmpFiles)
      return files
    }).then(files => {
      console.log(files)
      return Promise.all(files.map(file => {
        return md5File(file)
      }))
    }).then(results => {
      console.log(results)
      let all = results.join(',')
      return md5(all)
    })
}


// service workerのASSETSとCHECKSUMを作ってsw.jsを作成
gulp.task('serviceworker', function () {
  let checksum

  return getAssetHash()
    .then(result => {
      console.log(result)
      checksum = result
      return getAssetList()
    })
    .then(files => {
      return gulp.src(['./src/client/js/sw.js'])
        .pipe(replace(/ASSETS = .*/, `ASSETS = [\n'${files.join('\',\n\'')}'\n];`))
        .pipe(replace(/CHECKSUM = .*/, `CHECKSUM = '${checksum}'`))
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
  gulp.watch('src/client/js/sw.js', ['serviceworker'])
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
