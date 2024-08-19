const https = require('http');

  http.createServer(function ( req, res) {
     res.write("Sunt Live");
     res.envd();
  }).listen(8080);
