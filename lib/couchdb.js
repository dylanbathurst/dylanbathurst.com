//requires
var http = require('http'),
    events = require('events').EventEmitter;

// instance variables
var couchEmitter = new events();
this.options = {
  host: '',
  port: 5984,
  path: '',
  method: ''
};



exports.setup = function (obj) {

  var ops = this.options;
  ops.path = '/' + obj.db;
  ops.host = obj.host;

};



exports.getView = function (view, callback) {
  exports.couchRequester('GET', view, callback);

  couchEmitter.on('getAllEnd', function(chunk) {
    callback(chunk);
  });
};



exports.couchRequester = function(reqMethod, reqPath, callback) {

  var jaySon = '';
  this.options.method = reqMethod;
  this.options.path += reqPath;

  http.get(this.options, function(res) {
    res.on('data', function (chunk) {
      jaySon += chunk;
    })
    .on('end', function() {
      couchEmitter.emit('getAllEnd', jaySon);
    });
  });

}
