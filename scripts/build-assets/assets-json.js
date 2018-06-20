const fs = require('fs')
const execFileSync = require('child_process').execFileSync
const dateFormat = require('dateformat')

const now = new Date()
const version = 'assets-' + dateFormat(now, 'yyyymmdd-HHMMss')

const paths = [
  '/app.html',
  '/index.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css?family=Open+Sans:400,700'
]
const pattern = /\.(woff2|css|png|jpg|gif|svg|ico|js)$/

const files = execFileSync('find', [ './public/assets' ])
                .toString()
                .split('\n')
                .filter(file => file.match(pattern))
                .map(file => file.replace('./public', ''))
paths.push(...files)

const body = JSON.stringify({version, paths}, null, 2)

const dir = './public/assets'
if (!fs.existsSync(dir)) fs.mkdirSync(dir)
fs.writeFileSync(`${dir}/assets.json`, body)
