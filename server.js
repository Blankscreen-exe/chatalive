//importing stuff
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require("./utils/messages");
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require("./utils/users");

//getting bot name
const envVars = require('./env.json');
const { SocketAddress } = require('net');
const env =  JSON.parse(JSON.stringify(envVars));
const botName = env['botName'];

//creating an express object
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//setting path to static files
app.use(express.static(path.join(__dirname, 'public')));

// //run when client connects
// io.on('connection', socket => {
//     //catch room and username
//     socket.on('joinRoom', ({username, room}) => {});

//     console.log('!!! New WS connection ');
//     //welcome the user
//     socket.emit('message', formatMessage(botName,'Welcome to Chat-A-Live'));
//     socket.broadcast.emit('message',  formatMessage(botName,'Welcome to Chat-A-Live'));

//     //runs when a client disconnects
//     socket.on('disconnect', () => {
//         io.emit('message', formatMessage(botName,'Welcome to Chat-A-Live'));
//     });

//     //listens for chat messages
//     socket.on('chatMessage', (msg) => {
//         // console.log(`>> ${msg}`);
//         io.emit("message",formatMessage('USER',msg));
//     });
// });

// Run when client connects
io.on("connection", (socket) => {
    console.log(io.of("/").adapter);
    socket.on("joinRoom", ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
  "Welcome to Chat-A-Live!"
      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to Chat-A-Live!"));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
  
    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
  
    // Runs when client disconnects
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });

//getting port number
const PORT = env['PORT'] || process.env.PORT

server.listen( PORT, () => 
    console.log(`!!! server is running on ${PORT}`)
);