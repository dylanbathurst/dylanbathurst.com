var sys = require('sys'),
    http = require('http'),
    path = require('path'),
    url = require('url'),
    connect = require('connect'),
    events = require('events').EventEmitter,
    couchdb = require('./lib/couchdb'),
    fs = require('fs');

couchdb.setup({
  db: 'dylanbathurstcom',
  host: '127.0.0.1'
});


http.createServer(function (req, res) {

  var uri = url.parse(req.url).pathname;

  switch (uri) {
    case '/':
      var fileEmitter = new events(),
          buffer = '';

      fileEmitter.on('end', function () {

        var handler = function (posts) {
          var couchRes = JSON.parse(posts), i, len, buff = '';
        
          len = couchRes.rows.length;

          for (var i = 0; i < len; i++) {
            var post = couchRes.rows[i].value,
                title = post.title,
                body = post.post;

            buff += '<h2>' + title + '</h2>' + '<article>' + body + '</article>'  
          } 

          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(buffer + buff);
          res.end();
        };

        couchdb.getView('/_design/posts/_view/posts', handler);

      });

      fs.readFile('./templates/layout.html', function (err, data) {
        if (err) {
          fileEmitter.emit('error');
        }
  
        buffer += data;
        fileEmitter.emit('end');
      });

    break;
    case '/styles.css':
      var fileEmitter = new events(),
          buffer = '';

      fileEmitter.on('end', function () {
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(buffer);
        res.end();
      });

      fs.readFile('./static/css/style.css', function (err, data) {
        if (err) {
          fileEmitter.emit('error');
        }
  
        buffer += data;
        fileEmitter.emit('end');
      });

    break;
  }


}).listen(8080);

