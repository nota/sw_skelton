const fs = require('fs')
const execSync = require('child_process').execSync

const path = './public/assets/css/app.css'

let body = fs.readFileSync(path, {encoding: 'utf8'})
body = body.replace(/color:[\s\w\(\),]+/g, 'color:' + getRandomColor())
fs.writeFileSync(path, body)

execSync('npm run build:assets-json')

function getRandomColor () {
  const r = getRandomInt(255)
  const g = getRandomInt(255)
  const b = getRandomInt(255)
  return `rgb(${r}, ${g}, ${b})`
}

function getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max))
}
