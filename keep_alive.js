const http = require('http');

  http.createServer(function ( req, res) {
     res.write("Sunt Live");
     res.end();
  }).listen(8080);
