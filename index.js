#!/usr/bin/env node

/*! (c) 2017 Andrea Giammarchi - @WebReflection
 *
 * ISC License
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose with or without fee is hereby granted,
 * provided that the above copyright notice
 * and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS
 * ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING
 * ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL,
 * DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR
 * ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE,
 * DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 * NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var fs = require('fs');
var http = require('http');
var path = require('path');
var multiparty = require('multiparty');

var hostname = require('os').hostname() || 'trashbin';
var uploadDir = path.resolve(process.argv[2] || process.cwd());

fs.stat(uploadDir, function onStat(err, stats){
  if (err) {
    fs.mkdir(uploadDir, function (err) {
      if (err) throw err;
      onStat(err, {isDirectory: function () { return true; }});
    });
  } else if (stats.isDirectory()) {
    Promise.all([
      loadContent(path.join(__dirname, 'view', 'index.html')),
      loadContent(path.join(__dirname, 'js', 'main.js')),
      loadContent(path.join(__dirname, 'css', 'main.css')),
      loadContent(path.join(__dirname, 'img', 'favicon.ico')),
      new Promise(function (res, rej) {
        fs.readdir(uploadDir, function (err, files) {
          if (err) rej(err);
          else res(files.filter(function (name) {
            return !/^\./.test(name);
          }));
        });
      })
    ])
      .then(function (all) {
        startServer({
          assets: {
            index: all.shift().toString(),
            '/js/main.js': all.shift(),
            '/css/main.css': all.shift(),
            '/favicon.ico': all.shift()
          },
          files: all.shift()
        });
      })
      .catch(function (err) {
        console.error('Resources not found', err);
      });
  } else {
    console.error('Not a folder', uploadDir);
  }
});

function getIPv4() {
  var ni = require('os').networkInterfaces();
  return Object.keys(ni).reduce(function (out, key) {
    return ni[key].reduce(function (out, iface) {
      if (
        iface.family === 'IPv4' &&
        iface.address !== '127.0.0.1'
      ) {
        out.push(iface.address);
      }
      return out;
    }, out);
  }, []);
}

function loadContent(path) {
  return new Promise(function (res, rej) {
    fs.readFile(path, function (err, content) {
      if (err) rej(err);
      else res(content);
    });
  });
}

function startServer(info) {
  var server = http.createServer(function (req, res) {
    if (req.url === '/upload' && req.method === 'POST') {
      upload(req, res, info);
    } else if (info.assets.hasOwnProperty(req.url)) {
      var contentType;
      switch (req.url.match(/(\.[a-z]+)$/)[1]) {
        case '.js':
          contentType = 'application/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.ico':
          contentType = 'image/x-icon';
          break;
      }
      res.writeHead(200, {'Content-Type': contentType});
      res.end(info.assets[req.url]);
    } else {
      var filename = req.url.slice(1);
      if (info.files.indexOf(filename) < 0) {
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Expires': '-1',
          'Pragma': 'no-cache'
        });
        res.end(
          info.assets.index
            .replace('<h1></h1>', '<h1>🗑 ' + hostname + '</h1>')
            .replace('<h2></h2>', '<h2>' + uploadDir + '</h2>')
            .replace('<ul></ul>', '<ul>' + info.files.map(function (name) {
              return '<li><a href="/' + name + '" download>' + name + '</a></li>';
            }).join('') + '</ul>')
            .replace('<script></script>', '<script>var Trashbin = ' + JSON.stringify({
              files: info.files,
              folder: uploadDir
            }) + ';</script>')
        );
      } else {
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Transfer-Encoding': 'Binary',
          'Content-disposition': 'attachment; filename="' + filename + '"'
        });
        fs.createReadStream(path.join(uploadDir, filename)).pipe(res);
      }
    }
  }).listen(
    process.env.PORT || 8080,
    process.env.IP || '0.0.0.0',
    function () {
      var network = server.address();
      console.log('');
      console.log('\033[1mtrashbin\033[0m');
      console.log('uploads: \033[1m' + uploadDir + '\033[0m');
      console.log('address: http://' + network.address + ':' + network.port + '/');
      getIPv4().forEach(function (ip) {
        console.log('network: \033[1mhttp://' + ip + ':' + network.port + '/\033[0m');
      });
      console.log('');
    }
  );
}

function upload(req, res, info) {
  var form = new multiparty.Form({
    autoFiles: true,
    uploadDir: uploadDir
  });
  form.parse(req, function (err, fields, files) {
    var all = [];
    (files.upload || []).forEach(function (file) {
      all.push(new Promise(function (res, rej) {
        fs.rename(
          file.path,
          path.join(path.dirname(file.path), file.originalFilename),
          function (err) {
            if (err) rej(file);
            else {
              if (info.files.indexOf(file.originalFilename) < 0) {
                info.files.unshift(file.originalFilename);
              }
              res(file);
            }
          }
        );
      }));
    });
    var page = [
      '<!doctype html>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
      '<style>* { font-family: sans-serif; }</style>'
    ].join('');
    Promise.all(all)
      .catch(function (err) {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end(page + '✖ error ' + err);
      })
      .then(function () {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(page + '<meta http-equiv="refresh" content="1;URL=/">' + '✔ trashed');
      });
  });
}
