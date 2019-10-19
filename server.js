const server = require('http').createServer();
const io = require('socket.io')(server);
const pokemon = require('pokemon');

let connectedUsers = 0;

var boardState = null;

var users = [];


io.on('connection', (socket) => {

    console.log("New user connected")
    console.log(Object.keys(io.sockets.sockets))

    users[socket.id] = {nickName: pokemon.random(), color: null}
    console.log(users)

    io.emit('player list', JSON.stringify(Object.keys(io.sockets.sockets)));
    socket.emit('your name', users[socket.id].nickName)


    socket.on('disconnect', () => {
        console.log('User disconnected');
        io.emit('player list', JSON.stringify(Object.keys(io.sockets.sockets)));

        delete users[socket.id];

    });

    if (Object.keys(io.sockets.sockets).length === 2) {
        io.emit('start game', JSON.stringify({}))
        socket.emit('other moved', JSON.stringify(boardState))
    }

    socket.on('chosen color', (msg) => {
        console.log('Player chosen ' + JSON.parse(msg).color)
    })

    socket.on('move ended', (msg) => {
        boardState = JSON.parse(msg)
        socket.broadcast.emit('other moved', JSON.stringify(boardState))
    })

});
server.listen(3000);