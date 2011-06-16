var mu = require('mu'),
    events = require('events').EventEmitter,
    couchdb = require('./couchdb'),
    fs = require('fs');

var cache = {},
    cHost = process.env.COUCHHOST || '127.0.0.1';

exports.home = function (req, res) {
  if ('homepage' in cache) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(cache.homepage);
    res.end();
  } else {

    couchdb.setup({
      db: 'dylanbathurstcom',
      host: cHost
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
};

exports.clearcache = function (req, res) {
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
};

exports.styles = function (req, res) {
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
};

exports.error = function (req, res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.write('fail... Go <a href="/">Home</a> Idiot.');
  res.end();
}
