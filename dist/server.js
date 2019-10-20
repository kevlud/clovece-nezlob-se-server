"use strict";

function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}

function _classCallCheck(instance, Constructor) {
    if (!_instanceof(instance, Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {value: value, enumerable: true, configurable: true, writable: true});
    } else {
        obj[key] = value;
    }
    return obj;
}

var pokemon = require('pokemon');

var express = require('express');

var socketIO = require('socket.io');

var path = require('path');

var PORT = process.env.PORT || 3000;
var INDEX = path.join(__dirname, 'index.html');
var server = express().use(function (req, res) {
    return res.sendFile(INDEX);
}).listen(PORT, function () {
    return console.log("Listening on ".concat(PORT));
});
var io = socketIO(server);
var boardState = null;
var users = [];
var gameStarted = false;
var availableColors = [{
    name: 'yellow',
    available: true
}, {
    name: 'red',
    available: true
}, {
    name: 'green',
    available: true
}, {
    name: 'blue',
    available: true
}];
var GAMETURNER;
var userGameCircle = [];
io.on('connection', function (socket) {
    console.log("New user connected");
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = availableColors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            color = _step.value;

            if (color.available) {
                //users[socket.id] = {nickName: pokemon.random(), color: color.name, isTurn: false, nextPlayer: null}
                users.push(new Player(socket.id, pokemon.random(), color.name));
                color.available = false;
                socket.emit('your name', users[users.length - 1].nickName);
                break;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    console.log(users);
    io.emit('player list', JSON.stringify(Object.keys(io.sockets.sockets)));
    socket.on('disconnect', function () {
        console.log('User disconnected');
        io.emit('player list', JSON.stringify(Object.keys(io.sockets.sockets)));
        var tempUsers = [];

        for (i in users) {
            if (users[i].socketId === socket.id) {
                for (u in availableColors) {
                    if (availableColors[u].name === users[i].color) availableColors[u].available = true;
                }
            } else {
                tempUsers.push(users[i]);
            }
        }

        users = tempUsers;

        if (users.length == 0) {
            gameStarted = false;
            boardState = null;
            availableColors = [{
                name: 'yellow',
                available: true
            }, {
                name: 'red',
                available: true
            }, {
                name: 'green',
                available: true
            }, {
                name: 'blue',
                available: true
            }];
            GAMETURNER = null;
        }
    });
    socket.on('initialize game', function () {
        console.log('Initializing game');
        GAMETURNER = new GameTurner();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = users[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                user = _step2.value;
                GAMETURNER.appendPlayer(user);
                io.sockets.sockets[user.socketId].emit('start game', user.color);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        GAMETURNER.closeChain();
        io.sockets.sockets[GAMETURNER.currentPlayer.socketId].emit('your move');
        console.log(users);
    });
    socket.on('figure moved', function (msg) {
        boardState = JSON.parse(msg);
        socket.broadcast.emit('other moved', JSON.stringify(boardState));
    });
    socket.on('move ended', function () {
        console.log('MOVE ENDED');
        var nextPlayer = GAMETURNER.nextPlayerTurn();
        console.log(socket.id + ' -> ' + nextPlayer.socketId);
        io.sockets.sockets[nextPlayer.socketId].emit('your move');
    });
});

var GameTurner = function GameTurner() {
    var _this = this;

    _classCallCheck(this, GameTurner);

    _defineProperty(this, "firstPlayer", null);

    _defineProperty(this, "currentPlayer", null);

    _defineProperty(this, "nextPlayerTurn", function () {
        _this.currentPlayer = _this.currentPlayer.next;
        return _this.currentPlayer;
    });

    _defineProperty(this, "appendPlayer", function (player) {
        if (_this.firstPlayer == null) {
            _this.firstPlayer = player;
            _this.currentPlayer = player;
            return;
        }

        _this.currentPlayer.next = player;
        _this.currentPlayer = player;
    });

    _defineProperty(this, "closeChain", function () {
        _this.currentPlayer.next = _this.firstPlayer;
    });
};

var Player = function Player(socketId, nickName, color) {
    _classCallCheck(this, Player);

    _defineProperty(this, "socketId", '');

    _defineProperty(this, "nickName", '');

    _defineProperty(this, "color", '');

    _defineProperty(this, "next", null);

    this.socketId = socketId;
    this.nickName = nickName;
    this.color = color;
};
