const fs = require('fs')
const dateFormat = require('dateformat')

const now = new Date()
const version = 'assets-' + dateFormat(now, 'yyyymmdd-HHMMss')

const paths = [
  '/app.html',
  '/index.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
]
const pattern = /\.(woff2|css|png|js)$/
for (const dir of ['css', 'fonts', 'img']) {
  const files = fs.readdirSync(`./public/assets/${dir}`)
                  .filter(file => file.match(pattern))
                  .map(file => `/assets/${dir}/${file}`)
  paths.push(...files)
}

const body = JSON.stringify({version, paths}, null, 2)

const dir = './public/assets'
if (!fs.existsSync(dir)) fs.mkdirSync(dir)
fs.writeFileSync(`${dir}/assets.json`, body)
