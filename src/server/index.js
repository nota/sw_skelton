const express = require('express')
const app = express()
const path = require('path')
const morgan = require('morgan')
const forceSSL = require('express-force-ssl')
const assets = require('../../public/assets/assets.json')

app.use(morgan('dev'))
if (process.env.FORCE_SSL === 'true') {
  app.set('forceSSLOptions', { trustXFPHeader: true })
  app.use(forceSSL)
}

app.get('/', (req, res) => {
  const version = assets.version
  res.setHeader('x-assets-version', version)
  res.render('app', {version})
})

app.get('/app.html', (req, res) => {
  const version = assets.version
  res.setHeader('x-assets-version', version)
  res.render('app', {version})
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

const execSync = require('child_process').execSync
setInterval(() => {
  execSync('node ./scripts/change-css.js')
}, 60000)
