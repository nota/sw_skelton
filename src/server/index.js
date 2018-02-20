const express = require('express')
const app = express()
const path = require('path')
const md5File = require('md5-file/promise')
const md5 = require('md5')
const fs = require('mz/fs')
const morgan = require('morgan')

app.use(morgan('dev'))
;
app.get('/', async (req, res) => {
  const version = await getVersion()
  res.setHeader('x-app-version', version)
  res.render('app', {version})
})

app.get('/app.html', async (req, res) => {
  const version = await getVersion()
  res.setHeader('x-app-version', version)
  res.render('app', {version})
})

async function getVersion () {
  const paths = [
    'public/index.js',
    'src/server/views/app.ejs',
    'public/css/app.css'
  ]
  const hashes = await Promise.all(paths.map(path => md5File(path)))
  return md5(hashes.join('')).substring(0, 8)
}

app.get('/api/caches/manifest', async (req, res) => {
  const version = await getVersion()
  let assets = [
    '/app.html',
    '/index.js',
    'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
  ]
  const pattern = /\.(woff2|css|png|js)$/
  for (let dir of ['css', 'fonts', 'img']) {
    let files = await fs.readdir(`./public/${dir}`)
    files = files.filter(file => file.match(pattern))
    assets = assets.concat(files.map(file => `/${dir}/${file}`))
  }
  res.json({version, assets})
})

app.get('/note/*', (req, res) => {
  res.render('app')
})

app.use(express.static(path.join(__dirname, '../../public')))
app.set('views', `${__dirname}/views`)
app.set('view engine', 'ejs')
const port = process.env.PORT || 2000
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
})
