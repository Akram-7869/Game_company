"use strict";
const Tournament = require('../models/Tournament');
const { makeid } = require('./utils');

const Player = require('../models/Player');
const state = {};
const publicRoom = {};
const userSocketMap = {};

async function JoinRoom(d) {

    let dataParsed = d;// JSON.parse(d);
    console.log(dataParsed)
    let { userId, lobbyId, maxp = 4 } = dataParsed;
    let lobby = await Tournament.findById(lobbyId);
    // if (!lobby) {
    //     console.log('looby-not-found');
    //     return;
    // }


    // let player = await Player.findOne({ _id: userId, 'status': 'active', 'balance': { $gte: lobby.betAmount } });
    // if (!player) {
    //     console.log('player-not-found');
    //     return;
    // }
    let roomName = '';
    if (publicRoom[lobbyId] && publicRoom[lobbyId]['playerCount'] < maxp && !publicRoom[lobbyId]['played']) {
        roomName = publicRoom[lobbyId]['roomName'];
        //  await PlayerGame.findOneAndUpdate({ 'gameId': roomName, 'tournamentId': lobbyId }, { opponentId: userId, playerCount: 2 });
        console.log('join-exisitng', roomName);
    } else {
        roomName = makeid(5);
        publicRoom[lobbyId] = { roomName, playerCount: 0, played: false,timer:{} }
        state[roomName] = { 'created': Date.now() + 600000, players: [], betList: [], timer:{} };
        console.log('create-room-', roomName);
        //   await PlayerGame.create({ playerId: userId, 'gameId': roomName, 'tournamentId': lobbyId, playerCount: 1, gameData: {}, WinList: {} });
    }
    // console.log('room', roomName);
    joinRoom(d.socket, userId, roomName, dataParsed);
    d.socket.join(roomName);
    // if (lobby.mode === 'aviator') {
    //     startCountdown('room-1',10);

    // }
    let data = {
        roomName, users: getRoomLobbyUsers(roomName, lobbyId),
        userId: userId,
        gameData: state[roomName]['gameData'],
        WinList: state[roomName]['WinList'],
    }
    if (state[roomName]) {
        publicRoom[lobbyId]['playerCount'] = state[roomName].players.length;
        // if (data.users.length == maxp || data.users.length == 0) {
        //   delete publicRoom[lobbyId];
        // }
    } else {
        // delete publicRoom[lobbyId];
    }

}


let joinRoom = (socket, playerId, room, d = {}) => {
    //console.log('join room', socket.id, playerId, room);
    socket['room'] = room;
    socket['userId'] = playerId;
    socket['lobbyId'] = d.lobbyId;
    let index = -1;
    if (state[room]) {
        index = state[room].players.findIndex(user => user.userId === playerId);
        //console.log('i-', index);
        if (index === -1 && d.lobbyId === d.lobbyId) {
            state[room].players.push(d);
        }
    }
}
let getRoomLobbyUsers = (room, lobbyId) => {

    if (state[room]) {

        for (let x of state[room].players) {
            if (x.lobbyId != lobbyId) {
                return [];
            }
        }

        return state[room].players;
    }
    return [];
}


module.exports = {JoinRoom, publicRoom, state, userSocketMap}
 