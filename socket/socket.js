const io = require('socket.io')(5000);
const state = {};
const publicRoom = {};

// Run when client connects
io.on('connection', socket => {
    // let data = { status: 'connected' };
    //socket.emit('res', { ev: 'connected', data });
    console.log('contedt');
    //socket.join('notification_channel');

    socket.on('join', (d) => {
        let dataParsed = d;// JSON.parse(d);
        let { userId, lobbyId, maxp = 4 } = dataParsed;


        let roomName = '';
        if (publicRoom[lobbyId] && publicRoom[lobbyId]['playerCount'] < maxp && !publicRoom[lobbyId]['played']) {
            roomName = publicRoom[lobbyId]['roomName'];
            console.log('existing-');
        } else {
            roomName = makeid(5);
            console.log('new-');
            publicRoom[lobbyId] = { roomName, playerCount: 0, played: false }
            state[roomName] = { full: 0, players: [] };
        }
        // console.log('room', roomName);
        joinRoom(socket, userId, roomName, dataParsed);
        socket.join(roomName);

        let data = {
            roomName, users: getRoomUsers(roomName),
            userId: userId
        }
        if (state[roomName]) {
            publicRoom[lobbyId]['playerCount'] = state[roomName].players.length;
            if (data.users.length == maxp || data.users.length == 0) {
                delete publicRoom[lobbyId];
            }
        } else {
            delete publicRoom[lobbyId];
        }
        io.to(roomName).emit('res', { ev: 'join', data });
    });
    socket.on('setGameId', (d) => {

        let dataParsed = d;// JSON.parse(d);

        let { room, lobbyId } = d;//JSON.parse(d);
        let data = {
            gameId: makeid(5),
            lobbyId
        }
        //console.log('sendToRoom', ev);
        io.in(room).emit('setGameId', { ev: 'setGameId', data });

    });

    socket.on('sendToRoom', (d) => {
        console.log('sendToRoom');

        let { room, ev, data } = d;//JSON.parse(d);
        //console.log('sendToRoom', ev);
        io.to(room).emit('res', { ev, data });

    });
    //leave
    socket.on('leave', (d) => {
        console.log('leave');
        let { room } = d;
        userLeave(socket);
        socket.leave(room);

        let data = {
            room: room,
            users: getRoomUsers(room)
        };
        io.to(room).emit('res', { ev: 'leave', data });
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {

        let { room, userId } = socket;
        console.log('disconnect-');
        userLeave(socket);
        //console.log('disconnect-inputstring');
        let data = {
            room: room,
            users: getRoomUsers(room),
            userId: userId
        };
        io.to(socket.room).emit('res', { ev: 'disconnect', data });

    });
    // Runs when client disconnects
    socket.on('gameStart', (d) => {
        console.log('gameStart-');
        let { room, lobbyId } = d;

        if (publicRoom[lobbyId]) {
            let rn = publicRoom[lobbyId]['roomName'];
            if (rn == room) {
                publicRoom[lobbyId]['played'] = true;
            }

        }
        //remove empty 
        for (let r in state) {
            if (state[r]['players'].length === 0) {
                delete state[r];
            }
        }
        //remove 
        for (let l in publicRoom) {
            if (publicRoom[l]['roomName']) {
                let rn = publicRoom[l]['roomName'];
                if (!state[rn] || state[rn]['players'].length === 0) {
                    delete publicRoom[l];
                }
            }
        }
        // if (publicRoom[socket['lobbyId']]['roomName'] == room) {
        //   publicRoom[socket['lobbyId']]['roomName'] = '';
        //   publicRoom[socket['lobbyId']]['playerCount'] = 0;
        // }
        let data = {
            room: room
        };
        io.to(socket.room).emit('res', { ev: 'gameStart', data });

    });
    //move user
    socket.on('moveuser', (d) => {

        let { room, userId, action } = d; //JSON.parse(d);
        if (state[room]) {

            const index = state[room].players.findIndex(user => user.userId === userId);
            let toIndex
            if (action === 'win') {
                toIndex = index - 1;
            } else {
                toIndex = index + 1
            }
            arraymove(state[room].players, index, 1);

        }



        let data = {
            room: room,
            users: getRoomUsers(room)
        };
        io.to(room).emit('res', { ev: 'moveuser', data });
    });
});

function arraymove(arr, fromIndex, toIndex) {
    arr.unshift(arr.pop());

}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

let joinRoom = (socket, palyerId, room, d = {}) => {
    //console.log('join room', socket.id, palyerId, room);
    socket['room'] = room;
    socket['userId'] = palyerId;
    socket['lobbyId'] = d.lobbyId;
    let index = -1;
    if (state[room]) {
        index = state[room].players.findIndex(user => user.userId === palyerId);
        //console.log('i-', index);
        if (index === -1) {
            state[room].players.push(d);
        }
    }
}
let getRoomUsers = (room) => {

    if (state[room]) {
        return state[room].players;
    }
    return [];
}
let userLeave = (s) => {
    if (state[s.room] && state[s.room].players.length !== 0) {
        //delete state[s.room].players[s.userId];
        const index = state[s.room].players.findIndex(user => user.userId === s.userId);

        if (index !== -1) {
            state[s.room].players.splice(index, 1)[0];
        }
    }

}