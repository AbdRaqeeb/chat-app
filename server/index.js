const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config();
const formatMessage = require('../utils/messages');
const {userJoin, getCurrentUser, getRoomUsers, userLeave} = require('../utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set up static folder
app.use(express.static(path.resolve(__dirname, '../public')));

const botName = 'Chat Bot'

// run when client connects
io.on('connection', socket => {
    //join room
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);


        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    });


    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            // send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    });
});


const PORT = process.env.PORT || 5500;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});