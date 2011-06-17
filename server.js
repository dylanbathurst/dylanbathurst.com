var http = require('http'),
    path = require('path'),
    url = require('url'),
    pages = require('./lib/pages');

console.log(process.env.PORT);
var serverPort = process.env.PORT || 8080;

http.createServer(function (req, res) {

  var uri = url.parse(req.url).pathname;

  switch (uri) {
    case '/':

      pages.home(req, res);

    break;
    case '/clearcache':

      pages.clearcache(req, res);

    break;
    case '/styles.css':

      pages.styles(req, res);

    break;
    default:

      pages.error(req, res);

    break;
  }


}).listen(serverPort);

