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
app.listen(2000, function () {
  console.log('Example app listening on port 2000!')
})
