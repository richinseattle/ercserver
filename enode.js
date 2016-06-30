sqlite = require('sqlite3').verbose();

function enode(socket) {
  this.sock = socket;
  this.buff = "";
  this.bbs = "";
  this.user = "";
}

enode.prototype.verifyPassword = function(nodes, k, bbsTag, password, cb) {
  var database = new sqlite.Database('erc_auth.db');
  database.serialize(function() {
    database.run('CREATE TABLE IF NOT EXISTS auth(' +
                  'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
                  'bbsTag TEXT,' +
                  'password TEXT);'
    );

    database.get('SELECT bbsTag,password FROM auth WHERE bbsTag LIKE ?',
      [bbsTag],
      function done(err, row) {
        if (err) {
          nodes[k].sock.end('SQL Error validating password');
        } else {
          if (row) {
            if (password !== row.password) {
              nodes[k].sock.end('Invalid Password');
            } else {
              cb();
            }
          } else {
            nodes[k].sock.end('Unknown BBS');
          }
        }
      }
    )
  });
}

enode.prototype.process = function(nodes, k) {

  if (this.bbs === "" || this.user === "") {
    var arr = nodes[k].buff.split('|');
    if (arr.length < 3) {
      nodes[k].sock.end("Invalid connection string\r\n");
    } else {
      if (arr[0] !== 'ERCMAGIC') {
        nodes[k].sock.end("Invalid connection string\r\n");
      } else {
        this.verifyPassword(nodes, k, arr[1], arr[3], function cb() {
          nodes[k].bbs = arr[1];
          nodes[k].user = arr[2];
          nodes[k].sock.write(JSON.stringify({
            message : 'Connection Established :)\r\n'
          }));
        });
      }
    }
    nodes[k].buff = "";
  } else {
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].sock.write(JSON.stringify({
        bbsTag    : nodes[k].bbs,
        userName  : nodes[k].user,
        message   : nodes[k].buff,
      }));
    }
    nodes[k].buff = "";
  }
}

module.exports = enode;
