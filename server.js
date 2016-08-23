var express = require('express')
var app = express()
var path = require('path')

app.get('/', function (req, res) {
//  res.send('Hello World!');
  res.render('app')
})

app.get('/app.html', function (req, res) {
//  res.send('Hello World!');
  res.render('app')
})

app.get('/note/*', function (req, res) {
//  res.send('Hello World!');
  res.render('app')
})

app.use(express.static(path.join(__dirname, '/public')))
app.set('views', './views')
app.set('view engine', 'ejs')
var port = process.env.PORT || 2000
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`)
})
