const fs = require('fs')
const {execFileSync} = require('child_process')
const moment = require('moment')

const version = 'assets-' + moment().format('YYYYMMDD-HHmmss')

const pattern = /\.(woff2|css|png|jpg|gif|svg|ico|js)$/

const paths = execFileSync('find', [ './public/assets' ])
  .toString()
  .split('\n')
  .filter(file => file.match(pattern))
  .map(file => file.replace('./public', ''))

const urls = [
  '/app.html',
  '/index.js',
  ...paths,
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css?family=Open+Sans:400,700'
]

const body = JSON.stringify({version, urls}, null, 2)

const dir = './public/assets'
if (!fs.existsSync(dir)) fs.mkdirSync(dir)
fs.writeFileSync(`${dir}/assets.json`, body)
