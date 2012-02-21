var http = require('http');
var express = require('express');

var app = express.createServer();

app.get('/', function (req, res, next) {
  res.writeHead(200, {'Content-Type': 'application/json'});

  var options = {
    host: 'blazing-galaxy-2505.herokuapp.com',
    path: '/dylanbathurst',
    method: 'GET'
  };


  var req = http.request(options, function (response) {
    response.on('data', function (chunk) {
      res.write(chunk);
    });

    response.on('end', function () {
      res.end();
    });
  });

  req.on('error', function (err) {});

  req.end();
});

app.listen(80);
