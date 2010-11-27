var sys = require('sys'),
    Mu = require('../Mu/lib/mu'),
    http = require('http'),
    url = require('url'),
    drouter = require('../node-router/lib/node-router');
    couchdb = require('../node-couchdb/lib/couchdb'),
    
    // CouchDB Connection
    client = couchdb.createClient(5984, 'localhost'),
    dbBlog = client.db('db-blog'),
    dbAbout = client.db('db-about');


var ctx = {
  loop: [],
  list: function() {
    return this.loop.length !== 0;
  },
  empty: function() {
    return this.loop.length === 0;
  }
};

Mu.templateRoot = './templates';

//start server
var server = drouter.getServer();

// setup static content handlers
var styles = drouter.staticDirHandler('./static', 'css');
var js = drouter.staticDirHandler('./static', 'js');
var imgs = drouter.staticDirHandler('./static', 'imgs');

// setup static content url handlers
server.get(new RegExp('^/css/(.*)$'), function(req, res) {return styles(req, res);});
server.get(new RegExp('^/js/(.*)$'), function(req, res) {return js(req, res);});   
server.get(new RegExp('^/imgs/(.*)$'), function(req, res) {return imgs(req, res);});   

// setup main nav url handlers
server.get('/', function(req, res) {
  var home = {};
  Mu.deepRender(req, res, home, 'home.html');
});

server.get('/about/', function(req, res) {
  var about = {};
  dbAbout.getDoc('a367d47a0374755a2d8735cab0001990', function(docErr, doc) {
    if(docErr) {
      sys.print(JSON.stringify(docErr);
      res.simpleHtml(404, '404.html.mu');  
    } 
    
    about['name'] = doc.name;
    about['body'] = doc.body;
    Mu.deepRender(req, res, about, 'about.html');
  });
});

server.get('/blog/', function(req, res) {
  ctx.loop = [];
  dbBlog.allDocs(function(err, all) {
    if(err) throw err;

    var len = all.rows.length;
    for (var i = 0; i < len; i++) {
      postId = all.rows[i].id;
      
      dbBlog.getDoc(postId, function(docErr, doc) {
        if(docErr) throw docErr;

        addDoc(doc, len);
      });
    }
  });
  function addDoc(doc, allDocLen) {
    if (doc.date) {
      var dateObj = {};
      dateObj['cleanDate'] = doc.date;
      dateObj['styledDate'] = doc.date.replace(/-/g, '// ');
      doc.date = dateObj;
    }
    console.log(doc.date);
    ctx.loop.push(doc); 
    
    if (ctx.loop.length == allDocLen) {
      Mu.deepRender(req, res, ctx, './blog/posts.html');
    }
  }
});

// setup individual blog post url handler`
server.get(new RegExp('^/blog/(.*)/$'), function(req, res, match) {
  var postId,
      urlId = match.substring(0, 1) - 1;
  ctx.loop = [];

  dbBlog.allDocs(function(err, all) {
    if(err) throw err;
    postId = all.rows[urlId].id;
    
    dbBlog.getDoc(postId, function(docErr, doc) {
      // couchdb call to get post by postId in the url
      var couchPost = doc;
      ctx.loop[0] = couchPost; 
      Mu.deepRender(req, res, ctx, './blog/posts.html');
    });
  });
});

//extending Mu
Mu.deepRender = function(req, res, data, tmpl, layout) {
  var buffer = {content: ''};
  var layout = (layout || 'layout.html');
  var finalProd = '';
  var finalFinalProd = '';

  Mu.compile(tmpl, function(err, compiled) {
    if (err) throw err;

    compiled(data) 
      .addListener('data', function(c) {
        
        buffer.content += c; 
      })
      .addListener('end', function() {
        MuRender();
      });
    });
  function MuRender() {
    Mu.render(layout, buffer, {}, function(err, output) {
      if (err) throw err;

      output
        .addListener('data', function(c) {
          finalProd += c;      
        })
        .addListener('end', function() {
          res.simpleHtml(200, finalProd);
        });
    });
  }
};


// set port to listen on
server.listen(80);


