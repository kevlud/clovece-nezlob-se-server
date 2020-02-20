const pokemon = require('pokemon/index');
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

// THIS IS NICE
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
    .use((req, res) => res.sendFile(INDEX))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = socketIO(server);


var boardState = null;

var users = [];
var gameStarted = false;
var availableColors = [
    {name: 'yellow', available: true},
    {name: 'red', available: true},
    {name: 'green', available: true},
    {name: 'blue', available: true}
]

var GAMETURNER;

var userGameCircle = [];

io.on('connection', (socket) => {

    console.log("New user connected")

    for (color of availableColors) {
        if (color.available) {
            //users[socket.id] = {nickName: pokemon.random(), color: color.name, isTurn: false, nextPlayer: null}
            users.push(new Player(socket.id, pokemon.random(), color.name));
            color.available = false;
            socket.emit('your name', users[users.length - 1].nickName)
            break;
        }
    }
    console.log(users)

    io.emit('player list', JSON.stringify(Object.keys(io.sockets.sockets)));


    socket.on('disconnect', () => {
        console.log('User disconnected');
        io.emit('player list', JSON.stringify(Object.keys(io.sockets.sockets)));

        let tempUsers = []
        for (i in users) {
            if (users[i].socketId === socket.id) {
                for (u in availableColors)
                    if (availableColors[u].name === users[i].color)
                        availableColors[u].available = true;

            } else {
                tempUsers.push(users[i])
            }
        }

        users = tempUsers;


        if (users.length == 0) {
            gameStarted = false;
            boardState = null;
            availableColors = [
                {name: 'yellow', available: true},
                {name: 'red', available: true},
                {name: 'green', available: true},
                {name: 'blue', available: true}
            ]
            GAMETURNER = null;
        }

    });

    socket.on('initialize game', () => {
        console.log('Initializing game')
        GAMETURNER = new GameTurner();

        for (user of users) {
            GAMETURNER.appendPlayer(user)
            io.sockets.sockets[user.socketId].emit('start game', user.color)
        }
        GAMETURNER.closeChain();
        io.sockets.sockets[GAMETURNER.currentPlayer.socketId].emit('your move')

        console.log(users)
    })

    socket.on('figure moved', (msg) => {
        boardState = JSON.parse(msg)
        socket.broadcast.emit('other moved', JSON.stringify(boardState))
    })


    socket.on('move ended', () => {
        console.log('MOVE ENDED')
        let nextPlayer = GAMETURNER.nextPlayerTurn();
        console.log(socket.id + ' -> ' + nextPlayer.socketId)
        io.sockets.sockets[nextPlayer.socketId].emit('your move')
    })

});


class GameTurner {
    firstPlayer = null;
    currentPlayer = null;

    nextPlayerTurn() {
        this.currentPlayer = this.currentPlayer.next;
        return this.currentPlayer;
    }

    appendPlayer(player) {
        if (this.firstPlayer == null) {
            this.firstPlayer = player;
            this.currentPlayer = player;
            return;
        }

        this.currentPlayer.next = player;
        this.currentPlayer = player;
    }

    closeChain() {
        this.currentPlayer.next = this.firstPlayer;
    }
}

class Player {
    socketId = '';
    nickName = '';
    color = '';

    next = null;


    constructor(socketId, nickName, color) {
        this.socketId = socketId;
        this.nickName = nickName;
        this.color = color;
    }
}
