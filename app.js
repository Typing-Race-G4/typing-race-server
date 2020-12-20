const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const randomWords = require('random-words')
const PORT = process.env.NODE_ENV || 3000

let rooms = []
let users = []

io.on('connect', socket => {
  console.log('connected')
  socket.on('login', payload => {
    let flag = false
    for (let i = 0; i < users.length; i++) {
      if (payload === users[i]) {
        flag = true
      }
    }
    let temp = []
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].status === 'open') {
        temp.push(rooms[i])
      }
    }
    if (!flag) {
      users.push(payload)
      socket.emit('fetchRooms', {rooms: temp, status: true})
    } else {
      socket.emit('fetchRooms', {rooms: temp, status: false})
    }
  })
  socket.on('createRoom', payload => {
    let room = {
      roomname: payload.roomname,
      admin: payload.admin,
      status: payload.status,
      users: []
    }
    rooms.push(room)
    let temp = []
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].status === 'open') {
        temp.push(rooms[i])
      }
    }
    io.emit('fetchRooms', {rooms: temp, status: ''})
  })
  socket.on('updatedRoom', _ => {
    let temp = []
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].status === 'open') {
        temp.push(rooms[i])
      }
    }
    io.emit('fetchRooms', {rooms: temp, status: ''})
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
          let temp = []
          for (let i = 0; i < rooms.length; i++) {
            if (rooms[i].status === 'open') {
              temp.push(rooms[i])
            }
          }
          io.emit('fetchRooms', {rooms: temp, status: ''})
          io.sockets.in(rooms[i].roomname).emit('fetchPlayers', rooms[i])
        }
      }
    })
  })
  socket.on('startGame', (payload) => {
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].roomname === payload.roomname) {
        rooms[i].status = 'playing'
        rooms[i].sumWord = payload.sumWord
        rooms[i].counter = 1
      }
    }
    let temp = []
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].status === 'open') {
        temp.push(rooms[i])
      }
    }
    io.emit('fetchRooms', {rooms: temp, status: ''})
    io.to(payload.roomname).emit('init', randomWords())
  })
  socket.on('newAnswer', payload => {
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].roomname === payload.roomname) {
        if (rooms[i].counter < rooms[i].sumWord) {
          for (let j = 0; j < rooms[i].users.length; j++) {
            if (rooms[i].users[j].username === payload.username) {
              if (payload.answer === payload.word) {
                rooms[i].users[j].score += 10
              }
              io.sockets.in(rooms[i].roomname).emit('fetchPlayers', rooms[i])
              rooms[i].counter++
              io.to(payload.roomname).emit('init', randomWords())
            }
          }
        } else {
          for (let j = 0; j < rooms[i].users.length; j++) {
            if (rooms[i].users[j].username === payload.username) {
              if (payload.answer === payload.word) {
                rooms[i].users[j].score += 10
              }
              io.sockets.in(rooms[i].roomname).emit('fetchPlayers', rooms[i])
              rooms[i].status = 'close'
              let highestScore = Math.max.apply(Math, rooms[i].users.map(function(win) { return win.score }))
              let winner = rooms[i].users.filter(function(element) {
                return (element.score === highestScore)
              })
              io.to(rooms[i].roomname).emit('finalScore', winner)
            }
          }
          rooms = rooms.filter(function(el) {
            return el.status !== 'close'
          })
        }
      }
    }
  })
  socket.on('logout', payload => {
    for (let i = 0; i < users.length; i++) {
      users = users.filter(function(el) {
        return el !== payload
      })
    }
  })
});

server.listen(PORT, () => {
  console.log('running on' + PORT)
});