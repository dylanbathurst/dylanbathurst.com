var sys = require('sys'),
    http = require('http'),
    path = require('path'),
    url = require('url'),
    mu = require('mu'),
    events = require('events').EventEmitter,
    couchdb = require('./lib/couchdb'),
    fs = require('fs');


var cache = {},
    couchHost,
    serverPort;

if (process.env.DEV) {
  couchHost = '127.0.0.1';
  serverPort = 8080;
} else {
  couchHost = 'dylan.couchone.com';
  serverPort = 80;
}

http.createServer(function (req, res) {

  var uri = url.parse(req.url).pathname;

  switch (uri) {
    case '/':

      if ('homepage' in cache) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(cache.homepage);
        res.end();
      } else {

        couchdb.setup({
          db: 'dylanbathurstcom',
          host: couchHost
        });

        var fileEmitter = new events(),
            view = {posts: []};


        mu.fs('./templates/layout.html', function (err, data) {
          if (err) throw err;

          var handler = function (posts) {
            var couchRes = JSON.parse(posts), i, len, buff = '';

            len = couchRes.rows.length;

            for (var i = 0; i < len; i++) {
              var post = couchRes.rows[i].value,
                  title = post.title,
                  body = post.post;

              view.posts.push({title: title, post: body});
            }

            var numErrors = 0,
                buffer = '';

            mu.compileText('layout.html', data);

            var stream = mu.render('layout.html', view)
              .on('data', function (chunks) { 
                buffer += chunks;
              })
              .on('end',  function () {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(buffer);
                res.end();
                cache['homepage'] = buffer;
              })
              .on('error', function (err) { numErrors++; });

          };

          couchdb.getView('/_design/posts/_view/posts', handler);

        });

      }

    break;
    case '/clearcache':
      if ('homepage' in cache) {
        delete cache.homepage;
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('cache reset');
        res.end();
      } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('cache not set');
        res.end();
      }
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


}).listen(serverPort);

