//importing stuff
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require("./utils/messages");
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require("./utils/users");
const { SocketAddress } = require('net');

//getting bot name
const setVars = require('./settings.json');
const settings =  JSON.parse(JSON.stringify(setVars));
const botName = settings['botName'];

//creating an express object
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//setting path to static files
app.use(express.static(path.join(__dirname, 'public')));

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
const PORT = process.env.PORT || settings['PORT']

server.listen( PORT, () => 
    console.log(`!!! server is running on ${PORT}`)
);
