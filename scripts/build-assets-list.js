const fs = require('fs')
const dateFormat = require('dateformat')

const now = new Date();
const version = 'assets-' + dateFormat(now, "yyyymmdd-hhMMss");

const assets = [
  '/app.html',
  '/index.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
]
const pattern = /\.(woff2|css|png|js)$/
for (const dir of ['css', 'fonts', 'img']) {
  const files = fs.readdirSync(`./public/assets/${dir}`)
                  .filter(file => file.match(pattern))
                  .map(file => `/assets/${dir}/${file}`)
  assets.push(...files)
}

const body = JSON.stringify({version, assets})

const dir = './public/assets/json'
if (!fs.existsSync(dir)) fs.mkdirSync(dir)
fs.writeFileSync(`${dir}/assets-list.json`, body)
