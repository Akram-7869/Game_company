// const {state ,publicRoom, userSocketMap} = require('../utils/JoinRoom');
 
const Timer = require("./Timer");

class DragonTigerGame {
    constructor(roomName, io) {
        this.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.bets = [];
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 10; // 10 seconds
        this.players = new Set();
    }

    startGame() {
        this.currentPhase = 'betting';
        this.io.to(this.roomName).emit('phase_change', { phase: 'betting' });
        console.log(`Betting phase started in room: ${this.roomName}`);

        this.bettingTimer = new Timer(this.bettingTime, (remaining) => {
            this.io.to(this.roomName).emit('betting_tick', { remainingTime: remaining });
        }, () => {
            this.startPausePhase();
        });

        this.bettingTimer.startTimer();
    }

    startPausePhase() {
        this.currentPhase = 'pause';
        this.io.to(this.roomName).emit('phase_change', { phase: 'pause' });
        console.log(`Pause phase started in room: ${this.roomName}`);

        const winningNumber = this.getWinningNumber();
        this.io.to(this.roomName).emit('winning_number', { number: winningNumber });

        this.pauseTimer = new Timer(this.pauseTime, (remaining) => {
            this.io.to(this.roomName).emit('pause_tick', { remainingTime: remaining });
        }, () => {
            this.startGame();
        });

        this.pauseTimer.startTimer();
    }

    getWinningNumber() {
        return Math.floor(Math.random() * 100) + 1; // Random number between 1 and 100
    }

    addPlayer(socket) {
        if (this.currentPhase === 'betting') {
            this.players.add(socket.id);
            socket.join(this.roomName);
            this.io.to(this.roomName).emit('player_joined', { id: socket.id });
            console.log(`Player ${socket.id} joined room ${this.roomName}`);
        } else {
            socket.emit('error', 'Can only join during betting phase.');
        }
    }

    removePlayer(socket) {
        this.players.delete(socket.id);
        socket.leave(this.roomName);
        this.io.to(this.roomName).emit('player_left', { id: socket.id });
        console.log(`Player ${socket.id} left room ${this.roomName}`);
    }
}

module.exports = DragonTigerGame;