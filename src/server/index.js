const express = require('express')
const app = express()
const path = require('path')
const fs = require('mz/fs')
const morgan = require('morgan')
const forceSSL =  require('express-force-ssl')

app.use(morgan('dev'))

app.get('/', async (req, res) => {
  const version = await readAssetsVersion()
  res.setHeader('x-assets-version', version)
  res.render('app', {version})
})

app.get('/app.html', async (req, res) => {
  const version = await readAssetsVersion()
  res.setHeader('x-assets-version', version)
  res.render('app', {version})
})

async function readAssetsVersion () {
  const json = await fs.readFile('./public/assets/assets.json')
  const {version} = JSON.parse(json)
  return version
}

app.get('/note/*', (req, res) => {
  res.render('app')
})

app.use(express.static(path.join(__dirname, '../../public')))
app.set('views', `${__dirname}/views`)
app.set('view engine', 'ejs')
if (process.env.FORCE_SSL === 'true') {
  app.set('forceSSLOptions', { trustXFPHeader: true })
  app.use(forceSSL)
}
const port = process.env.PORT || 2000
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
})

const execSync = require('child_process').execSync
setInterval(() => {
  execSync('node ./scripts/change-css.js')
}, 60000)
