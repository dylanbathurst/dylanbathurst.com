var sys = require('sys'),
    http = require('http'),
    url = require('url'),
    fs = require('fs');

function notFound(req, res) {
  message = "Not Found\n";
  res.writeHead(404, {
    "Content-Type": "text/plain",
    "Content-Length": message.length
  });
  if (req.method !== "HEAD")
    res.write(message);
  res.end();
}

exports.setServer = function() {
  var routes = []; 
  
  function setupRequests(method, pattern, callback) {
    if (typeof pattern === 'string') {
      pattern = new RegExp('^' + pattern + '$');
    }
    var route = {
      method: method,
      pattern: pattern,
      callback: callback
    }; 
    routes.push(route);
  }

  function get(pattern, callback) {
    return setupRequests('GET', pattern, callback); 
  }

  var server = http.createServer(function(req, res) {
    var uri,
        path;

    function simpleResponse(code, body, content_type, extra_headers) {
      res.writeHead(code, (extra_headers || []).concat(
                            [ ['Content-Type', content_type],
                              ['Content-Length', Buffer.byteLength(body, 'utf8')]
                            ]));
      if (req.method !== 'HEAD') {
        res.write(body, 'utf8');
      }
      res.end();
      console.log('ended');
    }

    res.simpleHtml = function (code, body, extra_headers) {
      simpleResponse(code, body, 'text/html', extra_headers);
    }; 

    res.notFound = function (message) {
      notFound(req, res, message);
    };

    function handleRequests() {
      uri = url.parse(req.url);
      path = uri.pathname;
      
      var len = routes.length;
      for (var i = 0; i < len; i++) {
        var route = routes[i];
        if (req.method === route.method) {
          var match = path.match(route.pattern);
          if (match && match[0].length > 0) {
            match.shift();
            match = match.map(function(part) {
              return part ? unescape(part) : part;
            });
            match.unshift(res);
            match.unshift(req);
            if (route.format !== undefined) {
              var body = '';
              req.setEncoding('utf8');
              req.addListener('end', function() {
                if (route.format === 'json') {
                  try {
                    body = JSON.parse(unescape(body));
                  } catch(e) {
                    body = null;
                  }
                }
                match.push(body);
                route.callback.apply(null, match);
              });
              return;
            }
            var result = route.callback.apply(null, match);
            switch (typeof result) {
              case 'string':
                res.simpleHtml(200, result);
                break;
              case 'object':
                res.simpleJson(200, result);
                break;
            }
            return;
          } 
        } 
      }
      notFound(req, res);
    }
    handleRequests(); 
  }); 


  // server listening function
  function listen(port) {
    server.listen(port); 
  }

  return {
    listen: listen,
    get: get 
  };
};

exports.staticHandler = function(filename) {
  var body,
      headers;
  var content_type = mime.getMime(filename);
  var encoding = (content_type.slice(0, 4) === 'text' ? 'utf8' : 'binary');
  
  function loadResponseData(req, res, callback) {
    if (body && headers) {
      callback();
      return;
    }

    fs.readFile(filename, encoding, function (err, data) {
      if (err) {
        notFound(req, res, "Cannot find file: " + filename);
        return;
      }
      body = data;
      headers = [ [ "Content-Type"   , content_type ],
                  [ "Content-Length" , body.length ]
                ];
      headers.push(["Cache-Control", "public"]);

      callback();
    });
  }
  return function (req, res) {
    loadResponseData(req, res, function () {
      res.writeHead(200, headers);
      if (req.method !== "HEAD")
        res.write(body, encoding);
      res.end();
    });
  };
};

exports.staticDirHandler = function(root, prefix) {
 function loadResponseData(req, res, filename, callback) {
    var content_type = mime.getMime(filename);
    var encoding = (content_type.slice(0,4) === "text" ? "utf8" : "binary");

    fs.readFile(filename, encoding, function(err, data) {
      if(err) {
        notFound(req, res, "Cannot find file: " + filename);
        return;
      }
      var headers = [ [ "Content-Type"   , content_type ],
                      [ "Content-Length" , data.length ],
                      [ "Cache-Control"  , "public" ]
                    ];
      callback(headers, data, encoding);
    });
  }

  return function (req, res) {
    // trim off any query/anchor stuff
    var filename = root + req.url.replace(/[\?|#].*$/, '');
    if (prefix) filename = filename.replace(new RegExp('^'+prefix), '');
    // make sure nobody can explore our local filesystem
    //filename = path.join(root, filename.replace(/\.\.+/g, '.'));
    //if (filename == root) filename = path.join(root, 'index.html');
    loadResponseData(req, res, filename, function(headers, body, encoding) {
      res.writeHead(200, headers);
      if (req.method !== "HEAD")
        res.write(body, encoding);
      res.end();
    });
  };
};

// Mini mime module for static file serving
var DEFAULT_MIME = 'application/octet-stream';
var mime = exports.mime = {

  getMime: function getMime(path) {
    var index = path.lastIndexOf(".");
    if (index < 0) {
      return DEFAULT_MIME;
    }
    return mime.TYPES[path.substring(index).toLowerCase()] || DEFAULT_MIME;
  },

  TYPES : { ".3gp"   : "video/3gpp",
            ".a"     : "application/octet-stream",
            ".ai"    : "application/postscript",
            ".aif"   : "audio/x-aiff",
            ".aiff"  : "audio/x-aiff",
            ".asc"   : "application/pgp-signature",
            ".asf"   : "video/x-ms-asf",
            ".asm"   : "text/x-asm",
            ".asx"   : "video/x-ms-asf",
            ".atom"  : "application/atom+xml",
            ".au"    : "audio/basic",
            ".avi"   : "video/x-msvideo",
            ".bat"   : "application/x-msdownload",
            ".bin"   : "application/octet-stream",
            ".bmp"   : "image/bmp",
            ".bz2"   : "application/x-bzip2",
            ".c"     : "text/x-c",
            ".cab"   : "application/vnd.ms-cab-compressed",
            ".cc"    : "text/x-c",
            ".chm"   : "application/vnd.ms-htmlhelp",
            ".class"   : "application/octet-stream",
            ".com"   : "application/x-msdownload",
            ".conf"  : "text/plain",
            ".cpp"   : "text/x-c",
            ".crt"   : "application/x-x509-ca-cert",
            ".css"   : "text/css",
            ".csv"   : "text/csv",
            ".cxx"   : "text/x-c",
            ".deb"   : "application/x-debian-package",
            ".der"   : "application/x-x509-ca-cert",
            ".diff"  : "text/x-diff",
            ".djv"   : "image/vnd.djvu",
            ".djvu"  : "image/vnd.djvu",
            ".dll"   : "application/x-msdownload",
            ".dmg"   : "application/octet-stream",
            ".doc"   : "application/msword",
            ".dot"   : "application/msword",
            ".dtd"   : "application/xml-dtd",
            ".dvi"   : "application/x-dvi",
            ".ear"   : "application/java-archive",
            ".eml"   : "message/rfc822",
            ".eps"   : "application/postscript",
            ".exe"   : "application/x-msdownload",
            ".f"     : "text/x-fortran",
            ".f77"   : "text/x-fortran",
            ".f90"   : "text/x-fortran",
            ".flv"   : "video/x-flv",
            ".for"   : "text/x-fortran",
            ".gem"   : "application/octet-stream",
            ".gemspec" : "text/x-script.ruby",
            ".gif"   : "image/gif",
            ".gz"    : "application/x-gzip",
            ".h"     : "text/x-c",
            ".hh"    : "text/x-c",
            ".htm"   : "text/html",
            ".html"  : "text/html",
            ".ico"   : "image/vnd.microsoft.icon",
            ".ics"   : "text/calendar",
            ".ifb"   : "text/calendar",
            ".iso"   : "application/octet-stream",
            ".jar"   : "application/java-archive",
            ".java"  : "text/x-java-source",
            ".jnlp"  : "application/x-java-jnlp-file",
            ".jpeg"  : "image/jpeg",
            ".jpg"   : "image/jpeg",
            ".js"    : "application/javascript",
            ".json"  : "application/json",
            ".log"   : "text/plain",
            ".m3u"   : "audio/x-mpegurl",
            ".m4v"   : "video/mp4",
            ".man"   : "text/troff",
            ".mathml"  : "application/mathml+xml",
            ".mbox"  : "application/mbox",
            ".mdoc"  : "text/troff",
            ".me"    : "text/troff",
            ".mid"   : "audio/midi",
            ".midi"  : "audio/midi",
            ".mime"  : "message/rfc822",
            ".mml"   : "application/mathml+xml",
            ".mng"   : "video/x-mng",
            ".mov"   : "video/quicktime",
            ".mp3"   : "audio/mpeg",
            ".mp4"   : "video/mp4",
            ".mp4v"  : "video/mp4",
            ".mpeg"  : "video/mpeg",
            ".mpg"   : "video/mpeg",
            ".ms"    : "text/troff",
            ".msi"   : "application/x-msdownload",
            ".odp"   : "application/vnd.oasis.opendocument.presentation",
            ".ods"   : "application/vnd.oasis.opendocument.spreadsheet",
            ".odt"   : "application/vnd.oasis.opendocument.text",
            ".ogg"   : "application/ogg",
            ".p"     : "text/x-pascal",
            ".pas"   : "text/x-pascal",
            ".pbm"   : "image/x-portable-bitmap",
            ".pdf"   : "application/pdf",
            ".pem"   : "application/x-x509-ca-cert",
            ".pgm"   : "image/x-portable-graymap",
            ".pgp"   : "application/pgp-encrypted",
            ".pkg"   : "application/octet-stream",
            ".pl"    : "text/x-script.perl",
            ".pm"    : "text/x-script.perl-module",
            ".png"   : "image/png",
            ".pnm"   : "image/x-portable-anymap",
            ".ppm"   : "image/x-portable-pixmap",
            ".pps"   : "application/vnd.ms-powerpoint",
            ".ppt"   : "application/vnd.ms-powerpoint",
            ".ps"    : "application/postscript",
            ".psd"   : "image/vnd.adobe.photoshop",
            ".py"    : "text/x-script.python",
            ".qt"    : "video/quicktime",
            ".ra"    : "audio/x-pn-realaudio",
            ".rake"  : "text/x-script.ruby",
            ".ram"   : "audio/x-pn-realaudio",
            ".rar"   : "application/x-rar-compressed",
            ".rb"    : "text/x-script.ruby",
            ".rdf"   : "application/rdf+xml",
            ".roff"  : "text/troff",
            ".rpm"   : "application/x-redhat-package-manager",
            ".rss"   : "application/rss+xml",
            ".rtf"   : "application/rtf",
            ".ru"    : "text/x-script.ruby",
            ".s"     : "text/x-asm",
            ".sgm"   : "text/sgml",
            ".sgml"  : "text/sgml",
            ".sh"    : "application/x-sh",
            ".sig"   : "application/pgp-signature",
            ".snd"   : "audio/basic",
            ".so"    : "application/octet-stream",
            ".svg"   : "image/svg+xml",
            ".svgz"  : "image/svg+xml",
            ".swf"   : "application/x-shockwave-flash",
            ".t"     : "text/troff",
            ".tar"   : "application/x-tar",
            ".tbz"   : "application/x-bzip-compressed-tar",
            ".tci"   : "application/x-topcloud",
            ".tcl"   : "application/x-tcl",
            ".tex"   : "application/x-tex",
            ".texi"  : "application/x-texinfo",
            ".texinfo" : "application/x-texinfo",
            ".text"  : "text/plain",
            ".tif"   : "image/tiff",
            ".tiff"  : "image/tiff",
            ".torrent" : "application/x-bittorrent",
            ".tr"    : "text/troff",
            ".ttf"   : "application/x-font-ttf",
            ".txt"   : "text/plain",
            ".vcf"   : "text/x-vcard",
            ".vcs"   : "text/x-vcalendar",
            ".vrml"  : "model/vrml",
            ".war"   : "application/java-archive",
            ".wav"   : "audio/x-wav",
            ".wma"   : "audio/x-ms-wma",
            ".wmv"   : "video/x-ms-wmv",
            ".wmx"   : "video/x-ms-wmx",
            ".wrl"   : "model/vrml",
            ".wsdl"  : "application/wsdl+xml",
            ".xbm"   : "image/x-xbitmap",
            ".xhtml"   : "application/xhtml+xml",
            ".xls"   : "application/vnd.ms-excel",
            ".xml"   : "application/xml",
            ".xpm"   : "image/x-xpixmap",
            ".xsl"   : "application/xml",
            ".xslt"  : "application/xslt+xml",
            ".yaml"  : "text/yaml",
            ".yml"   : "text/yaml",
            ".zip"   : "application/zip"
          }
};
