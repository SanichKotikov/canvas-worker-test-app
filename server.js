const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 3000;

const MIME = {
  html: "text/html",
  js: "text/javascript",
  css: "text/css",
};

const requestHandler = (request, response) => {
  const url = request.url === '/' ? '/index.html' : request.url;
  const file = path.join(__dirname, url);

  fs.exists(file, (exists) => {
    if (!exists) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.write('404 Not Found\n');
      response.end();
      return;
    }

    fs.readFile(file, 'binary', (error, data) => {
      if (error) {
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.write(error + '\n');
        response.end();
        return;
      }

      const mimeType = MIME[file.split('.').pop()] || 'text/plain';

      response.writeHead(200, { 'Content-Type': mimeType });
      response.write(data, 'binary');
      response.end();
    });
  });
};

http.createServer(requestHandler).listen(PORT);

console.log(`Static file server running at: http://localhost:${PORT}/\nCTRL + C to shutdown`);
