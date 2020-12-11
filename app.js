const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const randomWords = require('random-words')
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
    io.emit('fetchRooms', rooms)
  })
  socket.on('updatedRoom', _ => {
    io.emit('fetchRooms', rooms)
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
          io.emit('fetchRooms', rooms)
          io.sockets.in(rooms[i].roomname).emit('fetchPlayers', rooms[i])
        }
      }
    })
  })
  socket.on('startGame', (payload) => {
    io.to(payload.roomname).emit('init', randomWords())
  })
  socket.on('newAnswer', payload => {
    let nextword = ''
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].roomname === payload.roomname) {
        rooms[i].counter = 1
        for (let j = 0; j < rooms[i].users.length; j++) {
          if (rooms[i].users[j].username === payload.username) {
            if (payload.answer === payload.word) {
              rooms[i].users[j].score += 10
            }
            io.sockets.in(rooms[i].roomname).emit('fetchPlayers', rooms[i])
            if (payload.counter < 5) {
              io.to(payload.roomname).emit('init', randomWords())
            } else {
              let highestScore = Math.max.apply(Math, rooms[i].users.map(function(win) { return win.score }))
              let winner = rooms[i].users.filter(function(element) {
                return (element.score === highestScore)
              })
              io.to(rooms[i].roomname).emit('finalScore', winner)
            }
          }
        }
      }
    }
  })
});

server.listen(PORT, () => {
  console.log('running on' + PORT)
});