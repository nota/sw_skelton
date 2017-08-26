const express = require('express')
const app = express()
const path = require('path')
const md5File = require('md5-file/promise')
const md5 = require('md5')

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
      const version = md5(hash + hash2).substring(0, 8)
      res.json({ version })
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
const port = process.env.PORT || 2000
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`)
})
