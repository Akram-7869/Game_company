const { state } = require('../utils/JoinRoom');

const Timer = require("./Timer");

class DragonTigerGame {
    constructor(roomName, io) {
        this.io = io;
        this.roomName = roomName;
        this.currentPhase = 'betting';
        this.winList = [1, 2, 3, 3, 1];

        this.dragonBet = 0;
        this.tigerBet = 0;
        this.tieBet = 0;
        this.bettingTime = 20; // 20 seconds
        this.pauseTime = 10; // 10 seconds
        this.players = new Set();
        this.staticDeck = [
            // Clubs (0-12)
            { cardNo: 2, color: 1 }, { cardNo: 3, color: 1 }, { cardNo: 4, color: 1 }, { cardNo: 5, color: 1 },
            { cardNo: 6, color: 1 }, { cardNo: 7, color: 1 }, { cardNo: 8, color: 1 }, { cardNo: 9, color: 1 },
            { cardNo: 10, color: 1 }, { cardNo: 11, color: 1 }, { cardNo: 12, color: 1 }, { cardNo: 13, color: 1 },
            { cardNo: 14, color: 1 },
            // Diamonds (13-25)
            { cardNo: 2, color: 2 }, { cardNo: 3, color: 2 }, { cardNo: 4, color: 2 }, { cardNo: 5, color: 2 },
            { cardNo: 6, color: 2 }, { cardNo: 7, color: 2 }, { cardNo: 8, color: 2 }, { cardNo: 9, color: 2 },
            { cardNo: 10, color: 2 }, { cardNo: 11, color: 2 }, { cardNo: 12, color: 2 }, { cardNo: 13, color: 2 },
            { cardNo: 14, color: 2 },
            // Spades (26-38)
            { cardNo: 2, color: 3 }, { cardNo: 3, color: 3 }, { cardNo: 4, color: 3 }, { cardNo: 5, color: 3 },
            { cardNo: 6, color: 3 }, { cardNo: 7, color: 3 }, { cardNo: 8, color: 3 }, { cardNo: 9, color: 3 },
            { cardNo: 10, color: 3 }, { cardNo: 11, color: 3 }, { cardNo: 12, color: 3 }, { cardNo: 13, color: 3 },
            { cardNo: 14, color: 3 },
            // Hearts (39-51)
            { cardNo: 2, color: 4 }, { cardNo: 3, color: 4 }, { cardNo: 4, color: 4 }, { cardNo: 5, color: 4 },
            { cardNo: 6, color: 4 }, { cardNo: 7, color: 4 }, { cardNo: 8, color: 4 }, { cardNo: 9, color: 4 },
            { cardNo: 10, color: 4 }, { cardNo: 11, color: 4 }, { cardNo: 12, color: 4 }, { cardNo: 13, color: 4 },
            { cardNo: 14, color: 4 }
        ];

    }

    selectWinningCards() {
        let dragonCardIndex, tigerCardIndex;

        if (this.dragonBet <= this.tigerBet && this.dragonBet <= this.tieBet) {

        } else if (this.tigerBet <= this.dragonBet && this.tigerBet <= this.tieBet) {
            // Tiger should win
            do {
                dragonCardIndex = Math.floor(Math.random() * 52);
                tigerCardIndex = Math.floor(Math.random() * 52);
            } while (this.staticDeck[tigerCardIndex].cardNo <= this.staticDeck[dragonCardIndex].cardNo);
        } else {
            // Tie should win
            do {
                dragonCardIndex = Math.floor(Math.random() * 52);
                tigerCardIndex = Math.floor(Math.random() * 52);
            } while (this.staticDeck[dragonCardIndex].cardNo !== this.staticDeck[tigerCardIndex].cardNo);
        }

        return { dragonCardIndex, tigerCardIndex };
    }


    startGame() {
        if (this.bettingTimer) return; // Prevent multiple starts

        this.currentPhase = 'betting';
        this.dragonBet = 0;
        this.tigerBet = 0;
        this.tieBet = 0
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

        // const winningNumber = this.getWinningNumber();
        // this.io.to(this.roomName).emit('winning_number', { number: winningNumber });
        const { dragonCardIndex, tigerCardIndex } = this.selectWinningCards();
        const winner = this.staticDeck[dragonCardIndex].cardNo > this.staticDeck[tigerCardIndex].cardNo ? 'dragon' :
            this.staticDeck[dragonCardIndex].cardNo < this.staticDeck[tigerCardIndex].cardNo ? 'tiger' : 'tie';

        // Emit the result to all clients immediately
        this.io.to(this.roomName).emit('game_result', {
            dragonCardIndex,
            tigerCardIndex,
            winner
        });

        this.pauseTimer = new Timer(this.pauseTime, (remaining) => {
            //  this.io.to(this.roomName).emit('pause_tick', { remainingTime: remaining });
        }, () => {
            this.startGame();
        });

        this.pauseTimer.startTimer();
    }
    updatePlayers(players) {
        this.players = players;
    }

    onBetPlaced(socket) {
        socket.removeAllListeners('onBetPlaced');

        socket.on('onBetPlaced', (d) => {

            const { boxNo, amount } = d;

            if (boxNo === 1) {
                this.dragonBet += amount;
            } else if (boxNo === 2) {
                this.tigerBet += amount;
            } else if (boxNo === 3) {
                this.tieBet += amount;
            }
            this.io.to(this.roomName).emit('onBetPlaced', d);

        });
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
        this.io.to(socket.id).emit('syncState', {
            gameType: 'DragonTiger',
            room: this.roomName,
            currentPhase: this.currentPhase,
            player: player,
            postion: this.players.indexOf(socket),
            total_players: this.players.size,
            betting_remaing:this.bettingTimer?.remaining,
            pause_remaing:this.pauseTimer?.remaining

        });
        this.onBetPlaced(socket);
    }


}

module.exports = DragonTigerGame;