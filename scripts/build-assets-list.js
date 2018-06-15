const fs = require('fs')
const dateFormat = require('dateformat')

const now = new Date();
const version = dateFormat(now, "yyyymmdd-hhMMss");

const assets = [
  '/app.html',
  '/index.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
]
const pattern = /\.(woff2|css|png|js)$/
for (const dir of ['css', 'fonts', 'img']) {
  const files = fs.readdirSync(`./public/${dir}`)
                  .filter(file => file.match(pattern))
                  .map(file => `/${dir}/${file}`)
  assets.push(...files)
}

const body = JSON.stringify({version, assets})

fs.writeFileSync("./public/json/assets-list.json", body)
