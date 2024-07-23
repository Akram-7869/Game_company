const { state } = require('../utils/JoinRoom');

const Timer = require("./Timer");

class DragonTigerGame {
    constructor(roomName, io) {
        this.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.winList = [1, 2, 3, 3, 1];
        this.bets = {
            dragon: 0,
            tiger: 0,
            tie: 0,
        };
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 10; // 10 seconds
        this.players = new Set();
    }

    startGame() {
        if (this.bettingTimer) return; // Prevent multiple starts

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
    updatePlayers(players) {
        this.players = players;
      }
    getWinningNumber() {
        let win = this.determineWinningOutcome();
        this.bets = {
            dragon: 0,
            tiger: 0,
            tie: 0,
        };
        this.winList.push(win).shift();

        return win; // Random number between 1 and 100
    }
    onBetPlaced(socket) {
        socket.removeAllListeners('onBetPlaced');

        socket.on('onBetPlaced', (d) => {

            const { boxNo, amount } = d;

            if (boxNo === 1) {
                this.bets.dragon += amount;
            } else if (boxNo === 2) {
                this.bets.tiger += amount;
            } else if (boxNo === 3) {
                this.bets.tie += amount;
            }
            this.io.to(this.roomName).emit('onBetPlaced', d);

        });
    }

    determineWinningOutcome() {
        const dragonPayout = this.bets.dragon * 2;
        const tigerPayout = this.bets.tiger * 2;
        const tiePayout = this.bets.tie * 10;

        if (dragonPayout <= tigerPayout && dragonPayout <= tiePayout) {
            return 1;//'dragon';
        } else if (tigerPayout <= dragonPayout && tigerPayout <= tiePayout) {
            return 2;//'tiger';
        } else {
            return 3;//'tie';
        }

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
    syncPlayer(socket, player) {
        // Send current game state to the player
        this.io.to(socket).emit('syncState', {
            gameType: 'DragonTiger',
            room: this.roomName,
            currentPhase: this.currentPhase,
            player: player,
            postion: this.players.indexOf(socket),
            total_players: this.players.size,
            bets: this.bets
        });
        this.onBetPlaced(socket);
    }


}

module.exports = DragonTigerGame;