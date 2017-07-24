var express = require('express')
var app = express()
var path = require('path')
const md5File = require('md5-file/promise')

app.get('/', function (req, res) {
//  res.send('Hello World!');
  res.render('app')
})

app.get('/app.html', function (req, res) {
//  res.send('Hello World!');
  res.render('app')
})

app.get('/api/client_version', function (req, res) {
  md5File('public/index.js').then(hash => {
    md5File('public/css/app.css').then(hash2 => {
      res.json({ version: hash.substring(0, 8) + "_" + hash2.substring(0, 8) })
    })
  })
})


app.get('/note/*', function (req, res) {
//  res.send('Hello World!');
  res.render('app')
})

app.use(express.static(path.join(__dirname, '../../public')))
app.set('views', `${__dirname}/views`)
app.set('view engine', 'ejs')
var port = process.env.PORT || 2000
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`)
})
