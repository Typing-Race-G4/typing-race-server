const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.NODE_ENV || 3000


io.on('connect', socket => {
  console.log('connected')
});

server.listen(PORT, () => {
  console.log('running on' + PORT)
});