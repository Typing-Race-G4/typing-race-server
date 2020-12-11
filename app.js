const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.NODE_ENV || 3000

let rooms = []
io.on('connect', socket => {
  console.log('connected')
  socket.on('login', payload => {
    socket.emit('fetchRooms', rooms)
  })
  socket.on('createRoom', payload => {
    let room = {
      roomname: payload.roomname,
      admin: payload.admin,
      users: []
    }
    rooms.push(room)
    console.log(rooms)
    io.emit('updateRoom', rooms)
  })
  socket.on('joinRoom', payload => {
    socket.join(payload.roomname, () => {
      for (let i = 0; i < rooms.length; i++){
        if (rooms[i].roomname === payload.roomname){
          let user = {
            username: payload.username,
            score: payload.score
          }
          rooms[i].users.push(user)
          console.log(rooms)
        }
      }
    })
  })
});

server.listen(PORT, () => {
  console.log('running on' + PORT)
});