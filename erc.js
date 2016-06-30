var net = require('net');
var Node = require('./enode.js');

var nodes = [];

function receiveData(node, data) {

  var k = nodes.indexOf(node);

  for (var j = 0; j < data.length; j++) {
    if (data[j] == 13) {
      nodes[k].process(nodes, k);
    } else if (data[j] != 10) {
      nodes[k].buff = nodes[k].buff + String.fromCharCode(data[j]);
    }
  }
}

function newSocket(socket) {
  var node = new Node(socket);
  nodes.push(node);
  socket.on('data', function(data) {
    receiveData(node, data);
  })
  socket.on('end', function() {
    closeSocket(node);
  })

  socket.write("ERCHANDSHAKE\r\n")
}

function closeSocket(node) {
  var i = nodes.indexOf(node);
  if (i != -1) {
    nodes.splice(i, 1);
  }
}

var server = net.createServer(newSocket);

server.listen(5001);
